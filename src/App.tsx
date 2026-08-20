import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ALL_PLAYERS } from './data/allPlayers';
import {
  Player,
  Role,
  FilterState,
  SortColumn,
  LeagueTeam,
  DEFAULT_LEAGUE_TEAMS,
  LeagueWorkspace,
  createDefaultLeague,
  DEFAULT_TAB_COLORS,
} from './types/fantacalcio';
import { Header } from './components/Header';
import { RoleHeroBanner } from './components/RoleHeroBanner';
import { FilterBar } from './components/FilterBar';
import { PlayerCard } from './components/PlayerCard';
import { PlayerTable } from './components/PlayerTable';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { CompareModal } from './components/CompareModal';
import { AuctionPlanner } from './components/AuctionPlanner';
import { LegendModal } from './components/LegendModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { LeagueRegistryModal } from './components/LeagueRegistryModal';
import { LeagueSquadsModal } from './components/LeagueSquadsModal';
import { LiveAuctionBudgetBar } from './components/LiveAuctionBudgetBar';
import { ExcelLeagueTabs } from './components/ExcelLeagueTabs';
import { UserManualModal } from './components/UserManualModal';
import { PurchaseLicenseModal } from './components/PurchaseLicenseModal';
import { LicenseStatus, loadStoredLicense, saveStoredLicense, getTrustedServerTime, SEASON_EXPIRY_DATE_ISO, calculateRemainingDays } from './services/licenseService';
import { subscribeToCloudLeagueState, saveCloudLeagueState, CloudLeagueState } from './firebase';
import { Upload, FileSpreadsheet, RotateCcw } from 'lucide-react';

const DEFAULT_FILTER: FilterState = {
  searchQuery: '',
  ruolo: 'TUTTI',
  squadra: 'Tutte',
  tier: 'Tutti',
  soloNuoviEstero: false,
  soloRigoristi: false,
  soloPiazzati: false,
  assegnazioneLega: 'Tutti',
  minFantaMedia: 0,
  maxPrezzo: 1000,
  sortBy: 'rendimentoIndex',
  sortOrder: 'desc',
};

// Initial state loader with automatic backwards-compatibility migration
const getInitialLeaguesState = (): { leagues: LeagueWorkspace[]; activeId: string } => {
  try {
    const savedLeagues = localStorage.getItem('fantascout_leagues_v2');
    const savedActiveId = localStorage.getItem('fantascout_active_league_id');
    if (savedLeagues) {
      const parsed: LeagueWorkspace[] = JSON.parse(savedLeagues);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeId = parsed.some((l) => l.id === savedActiveId) ? savedActiveId! : parsed[0].id;
        return { leagues: parsed, activeId };
      }
    }

    // Migrate from legacy single-league state if present
    const legacyTeamsRaw = localStorage.getItem('fantascout_league_teams_2627');
    const legacyAssignRaw = localStorage.getItem('fantascout_player_assignments_2627');
    const legacyPricesRaw = localStorage.getItem('fantascout_player_prices_2627');
    const legacyTargetsRaw = localStorage.getItem('fantascout_targets_2627');

    const legacyTeams: LeagueTeam[] = legacyTeamsRaw ? JSON.parse(legacyTeamsRaw) : DEFAULT_LEAGUE_TEAMS;
    const legacyAssignments: Record<string, string> = legacyAssignRaw ? JSON.parse(legacyAssignRaw) : {};
    const legacyPrices: Record<string, number> = legacyPricesRaw ? JSON.parse(legacyPricesRaw) : {};
    const legacyTargets: string[] = legacyTargetsRaw ? JSON.parse(legacyTargetsRaw) : [];

    const defaultLeague: LeagueWorkspace = {
      id: 'league-1',
      nome: 'Lega 1 (Principale)',
      coloreTab: '#2563eb',
      budgetBase: 500,
      teams: Array.isArray(legacyTeams) && legacyTeams.length === 10 ? legacyTeams : DEFAULT_LEAGUE_TEAMS,
      playerAssignments: legacyAssignments,
      playerPrices: legacyPrices,
      targetPlayerIds: legacyTargets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { leagues: [defaultLeague], activeId: 'league-1' };
  } catch (e) {
    console.error('Error loading initial leagues state', e);
    const fallback = createDefaultLeague('league-1', 'Lega 1 (Principale)');
    return { leagues: [fallback], activeId: 'league-1' };
  }
};

export function App() {
  const [activeRole, setActiveRole] = useState<Role | 'TUTTI' | 'PLANNER'>('TUTTI');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Global custom players database loaded from LocalStorage / Cloud Firestore (shared across all leagues)
  const [customPlayers, setCustomPlayers] = useState<Player[] | null>(() => {
    try {
      const saved = localStorage.getItem('fantascout_custom_players_2627');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Multi-league Workspaces / Excel-like Sheets
  const initialLeagueState = useMemo(() => getInitialLeaguesState(), []);
  const [leagues, setLeagues] = useState<LeagueWorkspace[]>(initialLeagueState.leagues);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(initialLeagueState.activeId);

  // Compare players IDs (transient)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [isSquadsModalOpen, setIsSquadsModalOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // License State with Server-Time Anti-Tamper Verification
  const [currentLicense, setCurrentLicense] = useState<LicenseStatus | null>(() => loadStoredLicense());
  const [gumroadUrl, setGumroadUrl] = useState<string>(() => {
    return localStorage.getItem('fantascout_gumroad_url') || 'https://ervit.gumroad.com/l/djmkop';
  });

  // Verify License & Expiry against trusted server time on startup
  useEffect(() => {
    const checkLicenseStatus = async () => {
      const stored = loadStoredLicense();
      if (stored && stored.isLicensed) {
        const trustedNow = await getTrustedServerTime();
        const expiry = new Date(stored.expiresAt || SEASON_EXPIRY_DATE_ISO);
        const isExpired = trustedNow >= expiry;
        const daysRemaining = calculateRemainingDays(trustedNow, expiry);

        const updated: LicenseStatus = {
          ...stored,
          isExpired,
          isLicensed: !isExpired,
          daysRemaining,
          verifiedAt: trustedNow.toISOString(),
        };
        setCurrentLicense(updated);
        saveStoredLicense(updated);
      }
    };
    checkLicenseStatus();
  }, []);

  const handleUpdateGumroadUrl = (url: string) => {
    setGumroadUrl(url);
    try {
      localStorage.setItem('fantascout_gumroad_url', url);
    } catch {}
  };

  // Flag to avoid loop syncing when updating from remote
  const isRemoteUpdateRef = useRef(false);

  // Current active league workspace
  const activeLeague: LeagueWorkspace = useMemo(() => {
    const found = leagues.find((l) => l.id === activeLeagueId);
    if (found) return found;
    if (leagues.length > 0) return leagues[0];
    return createDefaultLeague('league-1', 'Lega 1 (Principale)');
  }, [leagues, activeLeagueId]);

  // Derived properties from active league
  const leagueTeams = activeLeague.teams || DEFAULT_LEAGUE_TEAMS;
  const playerAssignments = activeLeague.playerAssignments || {};
  const playerPrices = activeLeague.playerPrices || {};
  const budgetBase = activeLeague.budgetBase || 500;
  const targetIds = useMemo(() => new Set(activeLeague.targetPlayerIds || []), [activeLeague.targetPlayerIds]);

  // Real-time Cloud Synchronization via Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudLeagueState(
      (cloudState: CloudLeagueState) => {
        isRemoteUpdateRef.current = true;
        setIsCloudSynced(true);

        // 1. Sync global custom players (Excel dataset)
        if (cloudState.customPlayers !== undefined) {
          setCustomPlayers(cloudState.customPlayers);
          try {
            if (cloudState.customPlayers) {
              localStorage.setItem('fantascout_custom_players_2627', JSON.stringify(cloudState.customPlayers));
            } else {
              localStorage.removeItem('fantascout_custom_players_2627');
            }
          } catch (e) {
            console.error('LocalStorage write error:', e);
          }
        }

        // 2. Sync multi-league workspaces if available
        if (cloudState.leagues && Array.isArray(cloudState.leagues) && cloudState.leagues.length > 0) {
          setLeagues(cloudState.leagues);
          try {
            localStorage.setItem('fantascout_leagues_v2', JSON.stringify(cloudState.leagues));
          } catch (e) {
            console.error('LocalStorage write error:', e);
          }

          if (cloudState.activeLeagueId) {
            setActiveLeagueId(cloudState.activeLeagueId);
            try {
              localStorage.setItem('fantascout_active_league_id', cloudState.activeLeagueId);
            } catch (e) {}
          }
        } else if (cloudState.teams && Array.isArray(cloudState.teams)) {
          // Fallback legacy sync
          setLeagues((prev) => {
            const current = prev[0] || createDefaultLeague();
            const updated: LeagueWorkspace = {
              ...current,
              teams: cloudState.teams || current.teams,
              playerAssignments: cloudState.playerAssignments || current.playerAssignments,
              playerPrices: cloudState.playerPrices || current.playerPrices,
              targetPlayerIds: cloudState.targetPlayerIds || current.targetPlayerIds,
              budgetBase: cloudState.budgetBase || current.budgetBase,
            };
            const nextLeagues = [updated, ...prev.slice(1)];
            try {
              localStorage.setItem('fantascout_leagues_v2', JSON.stringify(nextLeagues));
            } catch (e) {}
            return nextLeagues;
          });
        }

        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      },
      (error) => {
        console.warn('Firebase cloud sync status:', error);
        setIsCloudSynced(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper to persist leagues updates locally and to Firestore Cloud
  const persistLeagues = (updatedLeagues: LeagueWorkspace[], activeId = activeLeagueId) => {
    setLeagues(updatedLeagues);
    try {
      localStorage.setItem('fantascout_leagues_v2', JSON.stringify(updatedLeagues));
      localStorage.setItem('fantascout_active_league_id', activeId);
    } catch (e) {
      console.error('Failed to persist leagues to LocalStorage', e);
    }

    // Find current active league to save legacy keys as fallback
    const active = updatedLeagues.find((l) => l.id === activeId) || updatedLeagues[0];
    if (active) {
      try {
        localStorage.setItem('fantascout_league_teams_2627', JSON.stringify(active.teams));
        localStorage.setItem('fantascout_player_assignments_2627', JSON.stringify(active.playerAssignments));
        localStorage.setItem('fantascout_player_prices_2627', JSON.stringify(active.playerPrices));
        localStorage.setItem('fantascout_targets_2627', JSON.stringify(active.targetPlayerIds || []));
      } catch (e) {}
    }

    saveCloudLeagueState({
      leagues: updatedLeagues,
      activeLeagueId: activeId,
      // Legacy mirror
      teams: active?.teams,
      playerAssignments: active?.playerAssignments,
      playerPrices: active?.playerPrices,
      targetPlayerIds: active?.targetPlayerIds,
      budgetBase: active?.budgetBase,
    }).catch((e) => console.warn('Cloud sync error', e));
  };

  // --- MULTI-LEAGUE SHEET HANDLERS ---

  const handleSelectLeague = (leagueId: string) => {
    setActiveLeagueId(leagueId);
    try {
      localStorage.setItem('fantascout_active_league_id', leagueId);
    } catch (e) {}
    saveCloudLeagueState({ activeLeagueId: leagueId }).catch(() => {});
  };

  const handleCreateLeague = (nome: string, budgetIniziale = 700, coloreTab = '#2563eb', teamCount = 10) => {
    const newId = `league-${Date.now()}`;
    const newLeague = createDefaultLeague(newId, nome, coloreTab, 500, budgetIniziale, teamCount);
    const nextLeagues = [...leagues, newLeague];
    setActiveLeagueId(newId);
    persistLeagues(nextLeagues, newId);
  };

  const handleRenameLeague = (leagueId: string, newName: string) => {
    const nextLeagues = leagues.map((l) => (l.id === leagueId ? { ...l, nome: newName, updatedAt: new Date().toISOString() } : l));
    persistLeagues(nextLeagues);
  };

  const handleChangeLeagueColor = (leagueId: string, newColor: string) => {
    const nextLeagues = leagues.map((l) => (l.id === leagueId ? { ...l, coloreTab: newColor, updatedAt: new Date().toISOString() } : l));
    persistLeagues(nextLeagues);
  };

  const handleDuplicateLeague = (leagueId: string, duplicateAssignments = false) => {
    const source = leagues.find((l) => l.id === leagueId);
    if (!source) return;

    const newId = `league-${Date.now()}`;
    const newLeague: LeagueWorkspace = {
      ...source,
      id: newId,
      nome: `${source.nome} (Copia)`,
      coloreTab: DEFAULT_TAB_COLORS[(leagues.length) % DEFAULT_TAB_COLORS.length],
      playerAssignments: duplicateAssignments ? { ...source.playerAssignments } : {},
      playerPrices: duplicateAssignments ? { ...source.playerPrices } : {},
      targetPlayerIds: duplicateAssignments ? [...(source.targetPlayerIds || [])] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextLeagues = [...leagues, newLeague];
    setActiveLeagueId(newId);
    persistLeagues(nextLeagues, newId);
  };

  const handleDeleteLeague = (leagueId: string) => {
    if (leagues.length <= 1) return;
    const nextLeagues = leagues.filter((l) => l.id !== leagueId);
    const nextActiveId = activeLeagueId === leagueId ? nextLeagues[0].id : activeLeagueId;
    setActiveLeagueId(nextActiveId);
    persistLeagues(nextLeagues, nextActiveId);
  };

  const handleResetLeagueRosters = (leagueId: string) => {
    const nextLeagues = leagues.map((l) =>
      l.id === leagueId
        ? {
            ...l,
            playerAssignments: {},
            playerPrices: {},
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  // --- ACTIVE LEAGUE SPECIFIC HANDLERS ---

  const handleSaveLeagueTeams = (updatedTeams: LeagueTeam[]) => {
    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            teams: updatedTeams,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const handleAssignPlayer = (playerId: string, teamId: string) => {
    const currentAssignments = { ...(activeLeague.playerAssignments || {}) };
    const currentPrices = { ...(activeLeague.playerPrices || {}) };

    if (!teamId) {
      // Unassigned / Libero: remove assignment and reset auction price to restore initial budget
      delete currentAssignments[playerId];
      delete currentPrices[playerId];
    } else {
      // Assigned to a team (if moved from Team A to Team B, price stays attached to player and is now deducted from Team B while restoring Team A)
      currentAssignments[playerId] = teamId;
    }

    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            playerAssignments: currentAssignments,
            playerPrices: currentPrices,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const handleBatchReleasePlayers = (playerIds: string[]) => {
    const currentAssignments = { ...(activeLeague.playerAssignments || {}) };
    const currentPrices = { ...(activeLeague.playerPrices || {}) };

    playerIds.forEach((pId) => {
      delete currentAssignments[pId];
      delete currentPrices[pId];
    });

    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            playerAssignments: currentAssignments,
            playerPrices: currentPrices,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const handleUpdatePlayerPrice = (playerId: string, price: number) => {
    const currentPrices = { ...(activeLeague.playerPrices || {}) };
    if (price <= 0 || isNaN(price)) {
      delete currentPrices[playerId];
    } else {
      currentPrices[playerId] = price;
    }

    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            playerPrices: currentPrices,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const handleToggleBudget = (newBase: 500 | 1000) => {
    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            budgetBase: newBase,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const toggleTarget = (player: Player) => {
    const currentTargets = new Set(activeLeague.targetPlayerIds || []);
    if (currentTargets.has(player.id)) {
      currentTargets.delete(player.id);
    } else {
      currentTargets.add(player.id);
    }

    const nextTargetsArray = Array.from(currentTargets);
    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            targetPlayerIds: nextTargetsArray,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  const handleClearTargets = () => {
    const nextLeagues = leagues.map((l) =>
      l.id === activeLeague.id
        ? {
            ...l,
            targetPlayerIds: [],
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    persistLeagues(nextLeagues);
  };

  // Active base dataset (custom or built-in) - Shared globally across all league sheets
  const basePlayersList: Player[] = useMemo(() => {
    if (customPlayers !== null) {
      return customPlayers; // If customPlayers is [] (wiped), returns [] (0 players in grid)
    }
    return ALL_PLAYERS;
  }, [customPlayers]);

  // When an Excel file is imported: replace and wipe DB, save to Cloud Firestore & LocalStorage (Global for all leagues)
  const handleApplyCustomPlayers = (players: Player[]) => {
    setCustomPlayers(players);
    try {
      localStorage.setItem('fantascout_custom_players_2627', JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save custom players to localStorage', e);
    }
    saveCloudLeagueState({
      customPlayers: players,
      updatedAt: new Date().toISOString(),
    }).catch((e) => {
      console.error('Failed to upload players to Firestore cloud:', e);
    });
  };

  // Completely wipe database to 0 players
  const handleWipeDatabase = () => {
    setCustomPlayers([]);
    try {
      localStorage.setItem('fantascout_custom_players_2627', JSON.stringify([]));
    } catch (e) {
      console.error('Failed to wipe custom players', e);
    }
    saveCloudLeagueState({
      customPlayers: [],
      updatedAt: new Date().toISOString(),
    }).catch((e) => {
      console.error('Failed to wipe players in Firestore cloud:', e);
    });
  };

  // Reset to default Serie A database
  const handleResetToDefault = () => {
    setCustomPlayers(null);
    try {
      localStorage.removeItem('fantascout_custom_players_2627');
    } catch (e) {
      console.error('Failed to reset custom players', e);
    }
    saveCloudLeagueState({
      customPlayers: null,
      updatedAt: new Date().toISOString(),
    }).catch((e) => {
      console.error('Failed to reset custom players in Firestore cloud:', e);
    });
  };

  // Toggle compare modal
  const toggleCompare = (player: Player) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) {
        next.delete(player.id);
      } else {
        if (next.size >= 4) {
          alert('Puoi confrontare al massimo 4 calciatori contemporaneamente.');
          return prev;
        }
        next.add(player.id);
      }
      return next;
    });
  };

  const handleClearCompare = () => {
    setCompareIds(new Set());
  };

  // Role filter select
  const handleRoleSelect = (role: Role | 'TUTTI' | 'PLANNER') => {
    setActiveRole(role);
    if (role === 'PLANNER') {
      setFilter((prev) => ({ ...prev, ruolo: 'TUTTI' }));
    } else {
      setFilter((prev) => ({ ...prev, ruolo: role }));
    }
  };

  // Sorting
  const handleSortChange = (col: SortColumn) => {
    setFilter((prev) => {
      if (prev.sortBy === col) {
        return { ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' };
      }
      return { ...prev, sortBy: col, sortOrder: 'desc' };
    });
  };

  // Available Serie A teams
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    basePlayersList.forEach((p) => set.add(p.squadra));
    return Array.from(set).sort();
  }, [basePlayersList]);

  // Target players
  const targetPlayersList = useMemo(() => {
    return basePlayersList.filter((p) => targetIds.has(p.id));
  }, [basePlayersList, targetIds]);

  // Compared players
  const comparedPlayersList = useMemo(() => {
    return basePlayersList.filter((p) => compareIds.has(p.id));
  }, [basePlayersList, compareIds]);

  // Main Filtered & Sorted Players List
  const filteredPlayers = useMemo(() => {
    let result = [...basePlayersList];

    // Filter by role
    if (filter.ruolo !== 'TUTTI') {
      result = result.filter((p) => p.ruolo === filter.ruolo);
    }

    // Filter by Serie A team
    if (filter.squadra && filter.squadra !== 'Tutte') {
      result = result.filter((p) => p.squadra === filter.squadra);
    }

    // Filter by Tier
    if (filter.tier && filter.tier !== 'Tutti') {
      result = result.filter((p) => p.tier === filter.tier);
    }

    // Filter by Fantacalcio League team assignment
    if (filter.assegnazioneLega && filter.assegnazioneLega !== 'Tutti') {
      if (filter.assegnazioneLega === 'Liberi') {
        result = result.filter((p) => !playerAssignments[p.id]);
      } else if (filter.assegnazioneLega === 'Assegnati') {
        result = result.filter((p) => Boolean(playerAssignments[p.id]));
      } else {
        // Specific team ID
        result = result.filter((p) => playerAssignments[p.id] === filter.assegnazioneLega);
      }
    }

    // Quick toggles
    if (filter.soloNuoviEstero) {
      result = result.filter((p) => p.status === 'Nuovo dall\'Estero');
    }
    if (filter.soloRigoristi) {
      result = result.filter((p) => p.rigorista);
    }
    if (filter.soloPiazzati) {
      result = result.filter((p) => p.punizioni || p.corner);
    }

    // Numerical thresholds
    if (filter.minFantaMedia && filter.minFantaMedia > 0) {
      result = result.filter((p) => p.fantaMedia >= filter.minFantaMedia!);
    }

    // Search query
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.squadra.toLowerCase().includes(q) ||
          p.ruoloEsteso.toLowerCase().includes(q) ||
          p.fasciaConsigliata.toLowerCase().includes(q) ||
          p.slotConsigliato.toLowerCase().includes(q) ||
          (p.provenienzaEstero && p.provenienzaEstero.clubPrecedente.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (filter.sortBy) {
        case 'nome':
          valA = a.nome;
          valB = b.nome;
          return filter.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'squadra':
          valA = a.squadra;
          valB = b.squadra;
          return filter.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'ruolo': {
          const roleOrder: Record<Role, number> = { P: 1, D: 2, C: 3, A: 4 };
          valA = roleOrder[a.ruolo];
          valB = roleOrder[b.ruolo];
          break;
        }
        case 'squadraLega': {
          const teamA = leagueTeams.find((t) => t.id === playerAssignments[a.id])?.nome || 'ZZZ';
          const teamB = leagueTeams.find((t) => t.id === playerAssignments[b.id])?.nome || 'ZZZ';
          return filter.sortOrder === 'asc' ? teamA.localeCompare(teamB) : teamB.localeCompare(teamA);
        }
        case 'fantaMedia':
          valA = a.fantaMedia;
          valB = b.fantaMedia;
          break;
        case 'mediaVoto':
          valA = a.mediaVoto;
          valB = b.mediaVoto;
          break;
        case 'golFatti':
          valA = a.ruolo === 'P' ? a.cleanSheet : a.golFatti;
          valB = b.ruolo === 'P' ? b.cleanSheet : b.golFatti;
          break;
        case 'assist':
          valA = a.assist;
          valB = b.assist;
          break;
        case 'presenze':
          valA = a.presenze;
          valB = b.presenze;
          break;
        case 'cleanSheet':
          valA = a.cleanSheet;
          valB = b.cleanSheet;
          break;
        case 'rigoriParati':
          valA = a.rigoriParati;
          valB = b.rigoriParati;
          break;
        case 'rigoriSegnati':
          valA = a.rigoriSegnati;
          valB = b.rigoriSegnati;
          break;
        case 'cartellini':
          valA = a.ammonizioni + a.espulsioni * 2;
          valB = b.ammonizioni + b.espulsioni * 2;
          break;
        case 'prezzoConsigliato':
          valA = budgetBase === 500 ? a.prezzoConsigliato500 : a.prezzoConsigliato1000;
          valB = budgetBase === 500 ? b.prezzoConsigliato500 : b.prezzoConsigliato1000;
          break;
        case 'tier': {
          const tierRank: Record<string, number> = {
            'Tier 1 - Top': 5,
            'Tier 2 - Semitop': 4,
            'Tier 3 - Titolari Affidabili': 3,
            'Tier 4 - Scommesse/Low-Cost': 2,
            'Tier 5 - Jolly/Slot Finali': 1,
          };
          valA = tierRank[a.tier] || 0;
          valB = tierRank[b.tier] || 0;
          break;
        }
        case 'rendimentoIndex':
        default:
          valA = a.rendimentoIndex;
          valB = b.rendimentoIndex;
          break;
      }

      if (valA === valB) return 0;
      return filter.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : valA > valB ? -1 : 1;
    });

    return result;
  }, [basePlayersList, filter, budgetBase, playerAssignments, leagueTeams]);

  // Assigned players count in the active league
  const assignedPlayersCount = useMemo(() => {
    return Object.keys(playerAssignments).length;
  }, [playerAssignments]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-100 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* TOP SECTION: Fully responsive on all devices and monitor resolutions */}
      <div className="relative shrink-0 z-30 bg-slate-100 border-b border-slate-200 shadow-2xs">
        {/* Header */}
        <Header
          activeRole={activeRole}
          onSelectRole={handleRoleSelect}
          targetCount={targetIds.size}
          budgetBase={budgetBase}
          onToggleBudget={handleToggleBudget}
          onOpenCompare={() => setIsCompareOpen(true)}
          compareCount={compareIds.size}
          onOpenLegend={() => setIsLegendOpen(true)}
          onOpenExcelModal={() => setIsExcelModalOpen(true)}
          isCustomDataActive={Boolean(customPlayers)}
          totalPlayersCount={basePlayersList.length}
          onOpenRegistryModal={() => setIsRegistryModalOpen(true)}
          onOpenSquadsModal={() => setIsSquadsModalOpen(true)}
          assignedPlayersCount={assignedPlayersCount}
          teamsCount={leagueTeams.length}
          isCloudSynced={isCloudSynced}
          onOpenManual={() => setIsManualOpen(true)}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          currentLicense={currentLicense}
        />

        {/* EXCEL MULTI-LEAGUE WORKSPACE TABS BAR */}
        <ExcelLeagueTabs
          leagues={leagues}
          activeLeagueId={activeLeague.id}
          onSelectLeague={handleSelectLeague}
          onCreateLeague={handleCreateLeague}
          onRenameLeague={handleRenameLeague}
          onChangeLeagueColor={handleChangeLeagueColor}
          onDuplicateLeague={handleDuplicateLeague}
          onDeleteLeague={handleDeleteLeague}
          onResetLeagueRosters={handleResetLeagueRosters}
          allPlayers={basePlayersList}
        />

        {/* Live Auction Budget Ribbon for the active league's 10 teams + Role/Filter */}
        <div className="max-w-[1700px] w-full mx-auto px-1.5 sm:px-3 pt-0.5 sm:pt-1 pb-0.5 sm:pb-1">
          <LiveAuctionBudgetBar
            teams={leagueTeams}
            playerAssignments={playerAssignments}
            playerPrices={playerPrices}
            allPlayers={basePlayersList}
            selectedTeamFilter={filter.assegnazioneLega}
            onSelectTeamFilter={(teamId) => setFilter((prev) => ({ ...prev, assegnazioneLega: teamId }))}
            onOpenRegistry={() => setIsRegistryModalOpen(true)}
            onOpenSquads={() => setIsSquadsModalOpen(true)}
          />

          {activeRole !== 'PLANNER' && (
            <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
              {/* Hero role context banner (accessible on all screen sizes) */}
              <div className="block">
                <RoleHeroBanner
                  activeRole={activeRole}
                  onSelectRole={(r) => handleRoleSelect(r)}
                  players={basePlayersList}
                  onOpenExcelModal={() => setIsExcelModalOpen(true)}
                />
              </div>

              {/* Filter toolbar */}
              <FilterBar
                filter={filter}
                onChangeFilter={(newF) => setFilter((prev) => ({ ...prev, ...newF }))}
                onResetFilter={() => setFilter(DEFAULT_FILTER)}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                totalFilteredCount={filteredPlayers.length}
                availableTeams={availableTeams}
                leagueTeams={leagueTeams}
              />
            </div>
          )}
        </div>
      </div>

      {/* PLAYERS REGION (Natural full responsive scroll on all monitors, laptops, and mobile screens) */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-1.5 sm:px-3 py-1 flex flex-col">
        {activeRole === 'PLANNER' ? (
          <AuctionPlanner
            targetPlayers={targetPlayersList}
            onRemoveTarget={toggleTarget}
            onClearTargets={handleClearTargets}
            budgetBase={budgetBase}
            onSelectPlayer={setSelectedPlayer}
          />
        ) : (
          <>
            {/* Main content grid/table */}
            {filteredPlayers.length === 0 ? (
              basePlayersList.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-600 shadow-xs max-w-xl mx-auto my-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Database Calciatori Svuotato (0 Giocatori)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Il database è completamente azzerato e pronto per ricevere il tuo file Excel da Fantacalcio.it.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setIsExcelModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>📥 Carica Lega Serie A da Fantacalcio.it</span>
                    </button>
                    <button
                      onClick={handleResetToDefault}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-300 cursor-pointer flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ripristina Database di Serie A</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-xs max-w-xl mx-auto my-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center font-bold">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {filter.teamId ? 'Nessun giocatore acquistato da questa squadra' : 'Nessun giocatore corrisponde ai filtri selezionati'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {filter.teamId 
                      ? 'La squadra selezionata non ha ancora calciatori assegnati nella sua rosa all\'asta.' 
                      : 'Nessun calciatore trovato con la combinazione di ruolo, squadra o parametri impostati.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setFilter(DEFAULT_FILTER);
                        setActiveRole('TUTTI');
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      Mostra Tutti i {basePlayersList.length} Calciatori
                    </button>
                  </div>
                </div>
              )
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    budgetBase={budgetBase}
                    onSelectPlayer={setSelectedPlayer}
                    isTargeted={targetIds.has(player.id)}
                    onToggleTarget={toggleTarget}
                    isCompared={compareIds.has(player.id)}
                    onToggleCompare={toggleCompare}
                    teams={leagueTeams}
                    assignedTeamId={playerAssignments[player.id]}
                    paidPrice={playerPrices[player.id]}
                    onAssignPlayer={handleAssignPlayer}
                    onUpdatePlayerPrice={handleUpdatePlayerPrice}
                  />
                ))}
              </div>
            ) : (
              <PlayerTable
                players={filteredPlayers}
                budgetBase={budgetBase}
                onSelectPlayer={setSelectedPlayer}
                targetPlayerIds={targetIds}
                onToggleTarget={toggleTarget}
                comparedPlayerIds={compareIds}
                onToggleCompare={toggleCompare}
                sortBy={filter.sortBy}
                sortOrder={filter.sortOrder}
                onSortChange={handleSortChange}
                onOpenLegend={() => setIsLegendOpen(true)}
                teams={leagueTeams}
                playerAssignments={playerAssignments}
                playerPrices={playerPrices}
                onAssignPlayer={handleAssignPlayer}
                onUpdatePlayerPrice={handleUpdatePlayerPrice}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-slate-100 border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-600 tracking-tight">
        <div className="w-full max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 font-medium">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
            <span>
              {customPlayers ? '☁️ Cloud Database Attivo (File Excel Sincronizzato)' : '☁️ Cloud Database Attivo • Serie A Season 2025/26 Certified Stats'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-700 font-sans font-medium text-[10px] bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
              📅 Listone: 20/08/2026 (Mercato aperto • Definitivo dal 2 Settembre)
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[10.5px] font-semibold">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span>
                Foglio: <strong>{activeLeague.nome}</strong> • {basePlayersList.length} Calciatori ({assignedPlayersCount} Assegnati alle {leagueTeams.length} Squadre)
              </span>
            </span>
            <button
              onClick={() => setIsSquadsModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 underline font-bold cursor-pointer lowercase"
            >
              vedi rose lega
            </button>
          </div>
        </div>
      </footer>

      {/* Anagrafica Squadre Modal (with anti-accidental-deletion protection) */}
      <LeagueRegistryModal
        isOpen={isRegistryModalOpen}
        onClose={() => setIsRegistryModalOpen(false)}
        teams={leagueTeams}
        onSaveTeams={handleSaveLeagueTeams}
        playerAssignments={playerAssignments}
        playerPrices={playerPrices}
        allPlayers={basePlayersList}
        onBatchReleasePlayers={handleBatchReleasePlayers}
      />

      {/* Rose 10 Squadre Modal (for the active league sheet) */}
      <LeagueSquadsModal
        isOpen={isSquadsModalOpen}
        onClose={() => setIsSquadsModalOpen(false)}
        teams={leagueTeams}
        allPlayers={basePlayersList}
        playerAssignments={playerAssignments}
        playerPrices={playerPrices}
        onAssignPlayer={handleAssignPlayer}
        onOpenRegistry={() => {
          setIsSquadsModalOpen(false);
          setIsRegistryModalOpen(true);
        }}
        onSelectPlayer={setSelectedPlayer}
      />

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          budgetBase={budgetBase}
          isTargeted={targetIds.has(selectedPlayer.id)}
          onToggleTarget={toggleTarget}
          isCompared={compareIds.has(selectedPlayer.id)}
          onToggleCompare={toggleCompare}
        />
      )}

      {/* Comparison Modal */}
      {isCompareOpen && (
        <CompareModal
          players={comparedPlayersList}
          onClose={() => setIsCompareOpen(false)}
          onRemovePlayer={toggleCompare}
          onClearAll={handleClearCompare}
          budgetBase={budgetBase}
          onSelectPlayer={setSelectedPlayer}
        />
      )}

      {/* Legend Modal */}
      <LegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* Excel Import / Export Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        currentPlayers={basePlayersList}
        isCustomDataActive={Boolean(customPlayers && customPlayers.length > 0)}
        onApplyCustomPlayers={handleApplyCustomPlayers}
        onWipeDatabase={handleWipeDatabase}
        onResetToDefault={handleResetToDefault}
        budgetBase={budgetBase}
      />

      {/* Interactive Illustrated User Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onOpenRegistry={() => setIsRegistryModalOpen(true)}
        onOpenSquads={() => setIsSquadsModalOpen(true)}
        onOpenExcel={() => setIsExcelModalOpen(true)}
      />

      {/* Purchase & License Modal (Gumroad + PayPal with Server Time Expiry Check) */}
      <PurchaseLicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        currentLicense={currentLicense}
        onLicenseUpdated={setCurrentLicense}
        gumroadUrl={gumroadUrl}
        onUpdateGumroadUrl={handleUpdateGumroadUrl}
      />
    </div>
  );
}

export default App;
