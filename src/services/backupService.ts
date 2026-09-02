import { LeagueWorkspace, Player } from '../types/fantacalcio';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  formattedTime: string;
  totalLeagues: number;
  totalAssignedPlayers: number;
  totalCreditsSpent: number;
  activeLeagueId: string;
  leagues: LeagueWorkspace[];
  customPlayers?: Player[] | null;
}

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  activeLeagueId: string;
  leagues: LeagueWorkspace[];
  customPlayers?: Player[] | null;
  metadata?: {
    app: string;
    season: string;
  };
}

const BACKUP_SNAPSHOTS_KEY = 'fantascout_backup_snapshots_v1';
const LAST_MANUAL_SAVE_KEY = 'fantascout_last_manual_save_v1';
const MAX_SNAPSHOTS = 10;

/**
 * Computes total assigned players count across all leagues
 */
export function calculateTotalAssignments(leagues: LeagueWorkspace[]): number {
  if (!Array.isArray(leagues)) return 0;
  return leagues.reduce((total, league) => {
    const assignments = league.playerAssignments || {};
    return total + Object.keys(assignments).length;
  }, 0);
}

/**
 * Computes total credits spent across all leagues
 */
export function calculateTotalCreditsSpent(leagues: LeagueWorkspace[]): number {
  if (!Array.isArray(leagues)) return 0;
  return leagues.reduce((total, league) => {
    const prices = league.playerPrices || {};
    return total + Object.values(prices).reduce((sum: number, price: number) => sum + (Number(price) || 0), 0);
  }, 0);
}

/**
 * Synchronously saves all state into LocalStorage and creates an emergency backup snapshot
 */
export function persistFullLocalBackup(
  leagues: LeagueWorkspace[],
  activeLeagueId: string,
  customPlayers?: Player[] | null
): { success: boolean; timestamp: string; snapshot: BackupSnapshot } {
  const now = new Date();
  const timestamp = now.toISOString();
  const formattedTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const totalAssignedPlayers = calculateTotalAssignments(leagues);
  const totalCreditsSpent = calculateTotalCreditsSpent(leagues);

  const snapshot: BackupSnapshot = {
    id: `snap-${Date.now()}`,
    timestamp,
    formattedTime,
    totalLeagues: leagues.length,
    totalAssignedPlayers,
    totalCreditsSpent,
    activeLeagueId,
    leagues: JSON.parse(JSON.stringify(leagues)),
    customPlayers: customPlayers ? JSON.parse(JSON.stringify(customPlayers)) : null,
  };

  try {
    // 1. Primary storage
    localStorage.setItem('fantascout_leagues_v2', JSON.stringify(leagues));
    localStorage.setItem('fantascout_active_league_id', activeLeagueId);
    if (customPlayers) {
      localStorage.setItem('fantascout_custom_players_2627', JSON.stringify(customPlayers));
    }
    localStorage.setItem(LAST_MANUAL_SAVE_KEY, timestamp);

    // 2. Add to Snapshots history
    let existingSnapshots: BackupSnapshot[] = [];
    try {
      const raw = localStorage.getItem(BACKUP_SNAPSHOTS_KEY);
      if (raw) existingSnapshots = JSON.parse(raw);
    } catch {}

    const updatedSnapshots = [snapshot, ...existingSnapshots.slice(0, MAX_SNAPSHOTS - 1)];
    localStorage.setItem(BACKUP_SNAPSHOTS_KEY, JSON.stringify(updatedSnapshots));

    return { success: true, timestamp, snapshot };
  } catch (err) {
    console.error('Failed to write local backup snapshot:', err);
    return { success: false, timestamp, snapshot };
  }
}

/**
 * Retrieves the history of automatic and manual snapshots
 */
export function getStoredSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Gets the timestamp of the last manual or auto save
 */
export function getLastSaveTime(): string | null {
  try {
    return localStorage.getItem(LAST_MANUAL_SAVE_KEY);
  } catch {
    return null;
  }
}

/**
 * Downloads a complete JSON backup file to the user's computer
 */
export function downloadBackupFile(
  leagues: LeagueWorkspace[],
  activeLeagueId: string,
  customPlayers?: Player[] | null
): void {
  const payload: FullBackupPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    activeLeagueId,
    leagues,
    customPlayers,
    metadata: {
      app: 'FantaScout 26/27',
      season: '2026/2027',
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.href = url;
  link.setAttribute('download', `FantaScout_Backup_Asta_${nowStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a JSON file uploaded by the user to restore state
 */
export async function parseBackupFile(file: File): Promise<FullBackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (!parsed.leagues && !parsed.teams)) {
          throw new Error('Formato backup non valido. File JSON non riconosciuto come backup FantaScout.');
        }

        // Standardize structure if needed
        let leagues: LeagueWorkspace[] = parsed.leagues;
        if (!leagues && Array.isArray(parsed.teams)) {
          // Legacy single-league fallback format
          leagues = [
            {
              id: 'league-restored',
              nome: 'Lega Ripristinata',
              coloreTab: '#2563eb',
              teams: parsed.teams,
              playerAssignments: parsed.playerAssignments || {},
              playerPrices: parsed.playerPrices || {},
              targetPlayerIds: parsed.targetPlayerIds || [],
              budgetBase: parsed.budgetBase || 500,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        resolve({
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          activeLeagueId: parsed.activeLeagueId || leagues[0]?.id || 'league-1',
          leagues,
          customPlayers: parsed.customPlayers || null,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Errore durante la lettura del file.'));
    reader.readAsText(file);
  });
}
