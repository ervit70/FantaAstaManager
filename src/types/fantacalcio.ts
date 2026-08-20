export type Role = 'P' | 'D' | 'C' | 'A';

export type Tier =
  | 'Tier 1 - Top'
  | 'Tier 2 - Semitop'
  | 'Tier 3 - Titolari Affidabili'
  | 'Tier 4 - Scommesse/Low-Cost'
  | 'Tier 5 - Jolly/Slot Finali';

export type StatusOrigin = 'Confermato' | 'Nuovo dall\'Estero' | 'Cambio Squadra A' | 'Rientro/Promosso';

export interface Player {
  id: string;
  nome: string;
  squadra: string;
  ruolo: Role;
  ruoloEsteso: string;
  ruoloExtra?: string; // Ruolo Extra / Mantra (es. "Por", "Dd;Ds;E", "Dc", "M;C", "T;W", "A", "Pc")
  ruoloMantra?: string;
  quotazione: number; // base listino / Valore di Mercato reale
  fvm?: number; // Fanta Valore di Mercato per Asta (colonna L)
  prezzoConsigliato500: number; // stima crediti asta su 500
  prezzoConsigliato1000: number; // stima crediti asta su 1000
  slotConsigliato: string; // es. "1° Slot", "2° Slot", "3°/4° Slot", "5°/6° Slot", "Scommessa 8° Slot"
  tier: Tier;
  status: StatusOrigin;
  provenienzaEstero?: {
    campionato: string;
    clubPrecedente: string;
    noteAdattamento: string;
  };

  // Rendimento 2025/26
  presenze: number; // PG (Partite Giocate)
  titolarePercentuale: number; // % gare da titolare
  minutiGiocati: number;
  mediaVoto: number; // MV pura
  fantaMedia: number; // FM con bonus e malus
  golFatti: number; // GF
  golSubiti: number; // GS (per Portieri)
  cleanSheet: number; // CS (Portieri) o gare a porta inviolata (Difensori)
  rigoriParati: number; // RP (Portieri)
  rigoriTirati: number;
  rigoriSegnati: number;
  rigoriSbagliati: number;
  assist: number; // AS
  ammonizioni: number; // AMM
  espulsioni: number; // ESP
  xG: number; // Expected Goals
  xA: number; // Expected Assists

  // Valutazione Strategica
  rendimentoIndex: number; // Punteggio algoritmico 0 - 100
  affidabilitaFisica: number; // 1-10
  costanzaVoto: number; // 1-10 (quanto raramente scende sotto il 6)
  appealBonus: number; // 1-10 (capacità di portare +3 o +1)
  rischioMalus: number; // 1-10 (1 = bassissimo rischio, 10 = cartellino facile)

  // Calci piazzati
  rigorista: boolean;
  rigoristaOrdine?: number; // 1°, 2°, 3°
  punizioni: boolean;
  corner: boolean;

  // Analisi per l'Asta
  puntiDiForza: string[];
  criticita: string[];
  consiglioAsta: string;
  fasciaConsigliata: 'Top Assoluto' | 'Titolare Fisso' | 'Specialista Bonus' | 'Modificatore Oro' | 'Scommessa Risparmio' | 'Tappabuchi 1 credito';
  targetPrezzoPercentuale: number; // % consigliata del budget totale
}

export interface MySquadPlayer {
  player: Player;
  prezzoPagato: number;
  slotAssegnato: string;
  dataAcquisto: string;
  titolare: boolean;
}

export interface OpponentPlayer {
  playerId: string;
  playerNome: string;
  ruolo: Role;
  squadraSerieA: string;
  acquirente: string;
  prezzoPagato: number;
}

/**
 * Anagrafica Squadra Lega Fantacalcio all'italiana
 */
export interface LeagueTeam {
  id: string; // 'team-1', 'team-2', ... 'team-N'
  numero: number; // 1 to N
  nome: string; // Nome Squadra Fantacalcio
  capitano1: string; // Nome Capitano 1
  capitano2: string; // Nome Capitano 2
  budgetIniziale?: number; // Monte acquisti iniziale in FM (es. 700 FM)
  coloreHex?: string;
  badgeSigla?: string;
}

export const TEAM_COLOR_PALETTE = [
  '#2563eb', // 1 Blu
  '#059669', // 2 Smeraldo
  '#dc2626', // 3 Rosso
  '#d97706', // 4 Ambra
  '#7c3aed', // 5 Viola
  '#0284c7', // 6 Azzurro Sky
  '#4f46e5', // 7 Indaco
  '#e11d48', // 8 Rubino
  '#0d9488', // 9 Ottanio
  '#ea580c', // 10 Arancio
  '#059669', // 11 Verde Scuro
  '#9333ea', // 12 Porpora
  '#ca8a04', // 13 Oro
  '#be185d', // 14 Fucsia
  '#0891b2', // 15 Turchese
  '#475569', // 16 Ardesia
  '#15803d', // 17 Foresta
  '#c2410c', // 18 Ruggine
  '#4338ca', // 19 Oltremare
  '#be123c', // 20 Carminio
];

/**
 * Genera l'elenco delle squadre predefinite per un determinato numero di partecipanti (default 10)
 */
export const generateDefaultTeams = (count: number = 10, initialBudget: number = 700): LeagueTeam[] => {
  const teams: LeagueTeam[] = [];
  const safeCount = Math.max(4, Math.min(20, count || 10));

  for (let i = 1; i <= safeCount; i++) {
    const color = TEAM_COLOR_PALETTE[(i - 1) % TEAM_COLOR_PALETTE.length];
    teams.push({
      id: `team-${i}`,
      numero: i,
      nome: `Squadra ${i}`,
      capitano1: `Capitano ${i}`,
      capitano2: `Vice Capitano ${i}`,
      budgetIniziale: initialBudget,
      coloreHex: color,
      badgeSigla: `SQ${i}`,
    });
  }

  return teams;
};

export const DEFAULT_LEAGUE_TEAMS: LeagueTeam[] = generateDefaultTeams(10, 700);

/**
 * Excel-Style Independent League Sheet / Workspace
 */
export interface LeagueWorkspace {
  id: string; // e.g. 'league-1', 'league-2'
  nome: string; // e.g. 'Lega 1 (Amici)', 'Lega 2 (Lavoro)'
  coloreTab: string; // Excel sheet tab color (e.g. '#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48')
  budgetBase: 500 | 1000;
  numeroSquadre?: number; // Default 10 (configurable from 4 to 20)
  teams: LeagueTeam[]; // Dynamic teams with their distinct names, captains, and budget
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices: Record<string, number>; // playerId -> paidPrice FM
  targetPlayerIds?: string[]; // target player IDs in this league
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_TAB_COLORS = [
  '#2563eb', // Blu
  '#059669', // Smeraldo
  '#d97706', // Ambra
  '#7c3aed', // Viola
  '#e11d48', // Rubino
  '#0891b2', // Ciano
  '#4f46e5', // Indaco
  '#ea580c', // Arancione
  '#475569', // Ardesia
];

export const createDefaultLeague = (
  id = 'league-1',
  nome = 'Lega 1 (Principale)',
  coloreTab = '#2563eb',
  budgetBase: 500 | 1000 = 500,
  initialBudgetEach = 700,
  numberOfTeams = 10
): LeagueWorkspace => ({
  id,
  nome,
  coloreTab,
  budgetBase,
  numeroSquadre: numberOfTeams,
  teams: generateDefaultTeams(numberOfTeams, initialBudgetEach),
  playerAssignments: {},
  playerPrices: {},
  targetPlayerIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export interface LeagueSettings {
  budgetTotale: 500 | 1000 | number;
  numeroSquadre: number;
  modificatoreDifesa: boolean;
  bonusImbattibilitaPortiere: boolean;
  capitanoBonus: boolean;
  modalita: 'Classic' | 'Mantra';
}

export type SortColumn =
  | 'rendimentoIndex'
  | 'fantaMedia'
  | 'mediaVoto'
  | 'golFatti'
  | 'assist'
  | 'prezzoConsigliato'
  | 'presenze'
  | 'cleanSheet'
  | 'rigoriParati'
  | 'rigoriSegnati'
  | 'cartellini'
  | 'nome'
  | 'squadra'
  | 'ruolo'
  | 'tier'
  | 'squadraLega';

export interface FilterState {
  searchQuery: string;
  ruolo: Role | 'TUTTI';
  squadra?: string;
  tier?: Tier | 'Tutti';
  soloNuoviEstero: boolean;
  soloRigoristi: boolean;
  soloPiazzati: boolean;
  assegnazioneLega?: 'Tutti' | 'Liberi' | 'Assegnati' | string; // teamId or 'Liberi'/'Assegnati'
  minFantaMedia?: number;
  maxPrezzo?: number;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
}
