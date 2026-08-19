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
 * Listen to real-time changes of the cloud league database
 */
export function subscribeToCloudLeagueState(
  onUpdate: (state: CloudLeagueState) => void,
  onError?: (error: Error) => void
) {
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
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch the latest cloud state once
 */
export async function getCloudLeagueState(): Promise<CloudLeagueState | null> {
  try {
    const docRef = doc(db, 'league_state', GLOBAL_LEAGUE_DOC_ID);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as CloudLeagueState;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load cloud state:', err);
    return null;
  }
}

/**
 * Save / sync the full league state to Firestore Cloud
 */
export async function saveCloudLeagueState(state: Partial<CloudLeagueState>): Promise<void> {
  try {
    const docRef = doc(db, 'league_state', GLOBAL_LEAGUE_DOC_ID);
    const rawPayload: Record<string, any> = {
      ...state,
      id: GLOBAL_LEAGUE_DOC_ID,
      updatedAt: new Date().toISOString(),
    };

    const sanitizedPayload = sanitizeFirestoreData(rawPayload);
    await setDoc(docRef, sanitizedPayload, { merge: true });
  } catch (err) {
    console.error('Failed to sync state to Firestore cloud:', err);
    throw err;
  }
}
