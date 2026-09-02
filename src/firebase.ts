import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Player, LeagueTeam, LeagueWorkspace } from './types/fantacalcio';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if present
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface CloudLeagueState {
  id: string;
  customPlayers: Player[] | null;
  // Multi-league / multi-sheet workspaces
  leagues?: LeagueWorkspace[];
  activeLeagueId?: string;
  // Legacy / fallback fields
  playerAssignments?: Record<string, string>;
  playerPrices?: Record<string, number>;
  teams?: LeagueTeam[];
  targetPlayerIds?: string[];
  budgetBase?: 500 | 1000;
  updatedAt: string;
}

const GLOBAL_LEAGUE_DOC_ID = 'main_league_state';

// Track if Firestore quota is currently exhausted to avoid hammering the API
let isFirestoreQuotaExhausted = false;
let quotaExhaustedResetTimer: any = null;

/**
 * Deeply sanitizes any object or array to ensure no `undefined` values are sent to Firestore,
 * as Firestore throws an error if any property contains `undefined`.
 */
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeFirestoreData(value);
    }
  }
  return cleanObj as T;
}

/**
 * Listen to real-time changes of the cloud league database with safety guards
 */
export function subscribeToCloudLeagueState(
  onUpdate: (state: CloudLeagueState) => void,
  onError?: (error: Error) => void
): () => void {
  if (isFirestoreQuotaExhausted) {
    if (onError) onError(new Error('Firestore quota temporaneamente esaurita: modalità offline attiva.'));
    return () => {};
  }

  try {
    const docRef = doc(db, 'league_state', GLOBAL_LEAGUE_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CloudLeagueState;
          onUpdate(data);
        }
      },
      (err) => {
        if (err.message && (err.message.includes('quota') || err.message.includes('resource-exhausted'))) {
          isFirestoreQuotaExhausted = true;
          // Reset quota flag after 5 minutes
          if (!quotaExhaustedResetTimer) {
            quotaExhaustedResetTimer = setTimeout(() => {
              isFirestoreQuotaExhausted = false;
              quotaExhaustedResetTimer = null;
            }, 5 * 60 * 1000);
          }
        }
        console.warn('Firestore subscription status:', err.message || err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Firestore initialization fallback:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fetch the latest cloud state once
 */
export async function getCloudLeagueState(): Promise<CloudLeagueState | null> {
  if (isFirestoreQuotaExhausted) return null;

  try {
    const docRef = doc(db, 'league_state', GLOBAL_LEAGUE_DOC_ID);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as CloudLeagueState;
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('resource-exhausted') || err?.code === 'resource-exhausted') {
      isFirestoreQuotaExhausted = true;
    }
    console.warn('Failed to load cloud state:', err);
    return null;
  }
}

// Debounce timer for saving to cloud to prevent quota exhaustion
let cloudSaveDebounceTimer: any = null;
let pendingCloudSavePayload: Partial<CloudLeagueState> | null = null;

/**
 * Save / sync the full league state to Firestore Cloud with debouncing & quota guards
 */
export async function saveCloudLeagueState(state: Partial<CloudLeagueState>, immediate = false): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return; // Silently skip cloud writes if quota is exceeded; LocalStorage remains active and intact
  }

  pendingCloudSavePayload = {
    ...(pendingCloudSavePayload || {}),
    ...state,
  };

  const executeSave = async () => {
    if (!pendingCloudSavePayload) return;
    const payloadToSave = { ...pendingCloudSavePayload };
    pendingCloudSavePayload = null;

    try {
      const docRef = doc(db, 'league_state', GLOBAL_LEAGUE_DOC_ID);
      const rawPayload: Record<string, any> = {
        ...payloadToSave,
        id: GLOBAL_LEAGUE_DOC_ID,
        updatedAt: new Date().toISOString(),
      };

      const sanitizedPayload = sanitizeFirestoreData(rawPayload);
      await setDoc(docRef, sanitizedPayload, { merge: true });
    } catch (err: any) {
      if (err?.message?.includes('resource-exhausted') || err?.code === 'resource-exhausted') {
        isFirestoreQuotaExhausted = true;
        console.warn('Firestore cloud quota limit reached. Falling back safely to LocalStorage only.');
      } else {
        console.warn('Cloud sync error (local state remains safe):', err);
      }
    }
  };

  if (immediate) {
    if (cloudSaveDebounceTimer) clearTimeout(cloudSaveDebounceTimer);
    return executeSave();
  }

  if (cloudSaveDebounceTimer) {
    clearTimeout(cloudSaveDebounceTimer);
  }

  cloudSaveDebounceTimer = setTimeout(() => {
    executeSave();
  }, 2000); // 2 second debounce to prevent rapid-fire writes
}

