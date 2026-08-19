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
  id: string; // 'team-1', 'team-2', ... 'team-10'
  numero: number; // 1 to 10
  nome: string; // Nome Squadra Fantacalcio
  capitano1: string; // Nome Capitano 1
  capitano2: string; // Nome Capitano 2
  budgetIniziale?: number; // Monte acquisti iniziale in FM (es. 700 FM)
  coloreHex?: string;
  badgeSigla?: string;
}

export const DEFAULT_LEAGUE_TEAMS: LeagueTeam[] = [
  { id: 'team-1', numero: 1, nome: 'Squadra 1', capitano1: 'Capitano 1', capitano2: 'Vice Capitano 1', budgetIniziale: 700, coloreHex: '#2563eb', badgeSigla: 'SQ1' },
  { id: 'team-2', numero: 2, nome: 'Squadra 2', capitano1: 'Capitano 2', capitano2: 'Vice Capitano 2', budgetIniziale: 700, coloreHex: '#059669', badgeSigla: 'SQ2' },
  { id: 'team-3', numero: 3, nome: 'Squadra 3', capitano1: 'Capitano 3', capitano2: 'Vice Capitano 3', budgetIniziale: 700, coloreHex: '#dc2626', badgeSigla: 'SQ3' },
  { id: 'team-4', numero: 4, nome: 'Squadra 4', capitano1: 'Capitano 4', capitano2: 'Vice Capitano 4', budgetIniziale: 700, coloreHex: '#d97706', badgeSigla: 'SQ4' },
  { id: 'team-5', numero: 5, nome: 'Squadra 5', capitano1: 'Capitano 5', capitano2: 'Vice Capitano 5', budgetIniziale: 700, coloreHex: '#7c3aed', badgeSigla: 'SQ5' },
  { id: 'team-6', numero: 6, nome: 'Squadra 6', capitano1: 'Capitano 6', capitano2: 'Vice Capitano 6', budgetIniziale: 700, coloreHex: '#0284c7', badgeSigla: 'SQ6' },
  { id: 'team-7', numero: 7, nome: 'Squadra 7', capitano1: 'Capitano 7', capitano2: 'Vice Capitano 7', budgetIniziale: 700, coloreHex: '#4f46e5', badgeSigla: 'SQ7' },
  { id: 'team-8', numero: 8, nome: 'Squadra 8', capitano1: 'Capitano 8', capitano2: 'Vice Capitano 8', budgetIniziale: 700, coloreHex: '#e11d48', badgeSigla: 'SQ8' },
  { id: 'team-9', numero: 9, nome: 'Squadra 9', capitano1: 'Capitano 9', capitano2: 'Vice Capitano 9', budgetIniziale: 700, coloreHex: '#0d9488', badgeSigla: 'SQ9' },
  { id: 'team-10', numero: 10, nome: 'Squadra 10', capitano1: 'Capitano 10', capitano2: 'Vice Capitano 10', budgetIniziale: 700, coloreHex: '#ea580c', badgeSigla: 'SQ10' },
];

/**
 * Excel-Style Independent League Sheet / Workspace
 */
export interface LeagueWorkspace {
  id: string; // e.g. 'league-1', 'league-2'
  nome: string; // e.g. 'Lega 1 (Amici)', 'Lega 2 (Lavoro)'
  coloreTab: string; // Excel sheet tab color (e.g. '#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48')
  budgetBase: 500 | 1000;
  teams: LeagueTeam[]; // 10 teams with their distinct names, captains, and budget
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
  initialBudgetEach = 700
): LeagueWorkspace => ({
  id,
  nome,
  coloreTab,
  budgetBase,
  teams: DEFAULT_LEAGUE_TEAMS.map((t) => ({ ...t, budgetIniziale: initialBudgetEach })),
  playerAssignments: {},
  playerPrices: {},
  targetPlayerIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export interface LeagueSettings {
  budgetTotale: 500 | 1000 | number;
  numeroSquadre: 8 | 10 | 12;
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
