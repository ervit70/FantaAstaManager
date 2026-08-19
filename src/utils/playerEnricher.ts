import { Player, Role, Tier, StatusOrigin } from '../types/fantacalcio';
import { find20252026Stats, HistoricalPlayerSeasonStats } from '../data/seasonStats2025_2026';
import { ALL_PLAYERS } from '../data/allPlayers';

// Built-in map of ALL_PLAYERS by normalized name for instant full-profile matching
const ALL_PLAYERS_MAP = new Map<string, Player>();
ALL_PLAYERS.forEach((p) => {
  ALL_PLAYERS_MAP.set(p.nome.toLowerCase().trim(), p);
  const words = p.nome.toLowerCase().trim().split(' ');
  if (words.length > 1) {
    ALL_PLAYERS_MAP.set(words[words.length - 1], p); // surname lookup
  }
});

/**
 * Normalizes Italian string for robust player matching (handles accents and lowercase)
 */
export function normalizePlayerName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligently enriches raw players from Fantacalcio.it listone with:
 * 1. Historical 2025/2026 season stats (MV, FM, Gol, Assist, Rigori, Clean Sheet, Cartellini)
 * 2. Tactical attributes (Rigorista, Piazzati, Slot Consigliato, Punti di forza, Consigli d'asta)
 * 3. Projections for new transfers or promoted youngsters
 */
export function enrichPlayersDatabase(
  rawPlayers: Player[],
  onProgress?: (processed: number, total: number) => void
): { enrichedPlayers: Player[]; matchedCount: number; estimatedCount: number } {
  let matchedCount = 0;
  let estimatedCount = 0;

  const total = rawPlayers.length;
  const enrichedPlayers = rawPlayers.map((player, index) => {
    if (onProgress && index % 25 === 0) {
      onProgress(index + 1, total);
    }

    const normName = normalizePlayerName(player.nome);
    const squadra = player.squadra || 'Serie A';
    const role = player.ruolo;
    const fvm = player.fvm || player.quotazione || 10;
    const quotazione = player.quotazione || fvm || 10;

    // 1. Try matching with ALL_PLAYERS
    let baseMatch = ALL_PLAYERS_MAP.get(normName);
    if (!baseMatch) {
      // Try search inside ALL_PLAYERS array with includes
      baseMatch = ALL_PLAYERS.find((p) => {
        const pNorm = normalizePlayerName(p.nome);
        return (
          pNorm === normName ||
          (normName.length > 4 && pNorm.includes(normName)) ||
          (pNorm.length > 4 && normName.includes(pNorm))
        );
      });
    }

    // 2. Try matching with SEASON_STATS_2025_2026
    const hStats: HistoricalPlayerSeasonStats | null = find20252026Stats(player.nome, squadra);

    if (baseMatch || hStats) {
      matchedCount++;
    } else {
      estimatedCount++;
    }

    // Calculate or preserve role & pricing
    const price500 = Math.max(1, Math.round(fvm * 1.8));
    const price1000 = Math.max(1, Math.round(fvm * 3.6));

    // Stats resolution: Priority: hStats -> baseMatch -> calculated from FVM
    const presenze =
      hStats?.presenze ??
      baseMatch?.presenze ??
      Math.min(38, Math.max(10, Math.round(20 + fvm * 0.4)));

    const mediaVoto =
      hStats?.mediaVoto ??
      baseMatch?.mediaVoto ??
      Number((5.85 + Math.min(0.85, fvm * 0.023)).toFixed(2));

    const fantaMedia =
      hStats?.fantaMedia ??
      baseMatch?.fantaMedia ??
      Number((mediaVoto + (role === 'P' ? -0.35 : fvm * 0.06)).toFixed(2));

    const golFatti =
      hStats?.golFatti ??
      baseMatch?.golFatti ??
      (role === 'P'
        ? 0
        : role === 'D'
        ? Math.min(7, Math.max(0, Math.round(fvm * 0.18)))
        : role === 'C'
        ? Math.min(14, Math.max(0, Math.round(fvm * 0.35)))
        : Math.min(24, Math.max(1, Math.round(fvm * 0.55))));

    const golSubiti =
      role === 'P'
        ? hStats?.golSubiti ?? baseMatch?.golSubiti ?? Math.max(18, Math.round(52 - fvm * 1.35))
        : 0;

    const cleanSheet =
      hStats?.cleanSheet ??
      baseMatch?.cleanSheet ??
      (role === 'P'
        ? Math.min(18, Math.max(4, Math.round(fvm * 0.85)))
        : role === 'D'
        ? Math.min(16, Math.max(3, Math.round(fvm * 0.7)))
        : 0);

    const assist =
      hStats?.assist ??
      baseMatch?.assist ??
      (role === 'P'
        ? 0
        : role === 'D'
        ? Math.min(8, Math.max(0, Math.round(fvm * 0.22)))
        : role === 'C'
        ? Math.min(12, Math.max(0, Math.round(fvm * 0.3)))
        : Math.min(8, Math.max(0, Math.round(fvm * 0.18))));

    const rigoriParati =
      role === 'P'
        ? hStats?.rigoriParati ?? baseMatch?.rigoriParati ?? (fvm >= 15 ? 2 : fvm >= 8 ? 1 : 0)
        : 0;

    const rigoriSegnati =
      hStats?.rigoriSegnati ??
      baseMatch?.rigoriSegnati ??
      (role === 'A' && fvm >= 25 ? 3 : role === 'C' && fvm >= 22 ? 2 : 0);

    const rigoriTirati =
      hStats?.rigoriTirati ??
      baseMatch?.rigoriTirati ??
      (rigoriSegnati > 0 ? rigoriSegnati + (fvm >= 30 ? 1 : 0) : 0);

    const rigoriSbagliati =
      hStats?.rigoriSbagliati ??
      baseMatch?.rigoriSbagliati ??
      Math.max(0, rigoriTirati - rigoriSegnati);

    const ammonizioni =
      hStats?.ammonizioni ??
      baseMatch?.ammonizioni ??
      Math.min(9, Math.max(1, Math.round(2 + fvm * 0.12)));

    const espulsioni =
      hStats?.espulsioni ??
      baseMatch?.espulsioni ??
      (fvm <= 6 && index % 8 === 0 ? 1 : 0);

    // Tier calculation
    let tier: Tier = baseMatch?.tier || 'Tier 3 - Titolari Affidabili';
    if (!baseMatch) {
      if (role === 'P') {
        if (fvm >= 15) tier = 'Tier 1 - Top';
        else if (fvm >= 11) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 8) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else if (role === 'D') {
        if (fvm >= 18) tier = 'Tier 1 - Top';
        else if (fvm >= 12) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 7) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else if (role === 'C') {
        if (fvm >= 22) tier = 'Tier 1 - Top';
        else if (fvm >= 15) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 9) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else {
        if (fvm >= 28) tier = 'Tier 1 - Top';
        else if (fvm >= 18) tier = 'Tier 2 - Semitop';
        else if (fvm <= 5) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 12) tier = 'Tier 4 - Scommesse/Low-Cost';
      }
    }

    let slot = baseMatch?.slotConsigliato || '3°/4° Slot';
    if (!baseMatch) {
      if (tier === 'Tier 1 - Top') slot = '1° Slot Top';
      else if (tier === 'Tier 2 - Semitop') slot = '2° Slot Alto';
      else if (tier === 'Tier 5 - Jolly/Slot Finali') slot = 'Slot Copertura / 1 Credito';
      else if (tier === 'Tier 4 - Scommesse/Low-Cost') slot = 'Scommessa 5°/6° Slot';
    }

    const rigorista =
      baseMatch?.rigorista ??
      (rigoriTirati > 0 || (role === 'A' && fvm >= 26) || (role === 'C' && fvm >= 24));

    const punizioni = baseMatch?.punizioni ?? (fvm >= 20 && (role === 'C' || role === 'D'));
    const corner = baseMatch?.corner ?? (fvm >= 16 && role === 'C');

    const puntiDiForza = baseMatch?.puntiDiForza || [
      `FVM ufficiale Fantacalcio.it: ${fvm}`,
      `Quotazione di mercato: ${quotazione}`,
      `Costanza di rendimento in ${squadra}`,
    ];

    const criticita = baseMatch?.criticita || [
      fvm <= 5 ? 'Minutaggio non garantito al 100%' : 'Possibile turnover nelle settimane di coppe',
    ];

    const consiglioAsta =
      baseMatch?.consiglioAsta ||
      `Consigliato all'asta come ${slot}. Valuta un rilancio massimo di ${price500} FM (su base 500) o ${price1000} FM (su base 1000).`;

    const status: StatusOrigin = baseMatch?.status || 'Confermato';

    return {
      ...player,
      presenze,
      mediaVoto,
      fantaMedia,
      golFatti,
      golSubiti,
      cleanSheet,
      rigoriParati,
      rigoriTirati,
      rigoriSegnati,
      rigoriSbagliati,
      assist,
      ammonizioni,
      espulsioni,
      titolarePercentuale: baseMatch?.titolarePercentuale ?? Math.min(100, Math.round((presenze / 38) * 100)),
      minutiGiocati: baseMatch?.minutiGiocati ?? presenze * 80,
      xG: baseMatch?.xG ?? Number((golFatti * 0.92).toFixed(1)),
      xA: baseMatch?.xA ?? Number((assist * 0.88).toFixed(1)),
      rendimentoIndex:
        baseMatch?.rendimentoIndex ??
        Math.min(99, Math.max(45, Math.round(fantaMedia * 9.2 + fvm * 0.85))),
      affidabilitaFisica: baseMatch?.affidabilitaFisica ?? (presenze >= 30 ? 9 : presenze >= 22 ? 8 : 6),
      costanzaVoto: baseMatch?.costanzaVoto ?? (mediaVoto >= 6.3 ? 9 : mediaVoto >= 6.0 ? 7 : 5),
      appealBonus: baseMatch?.appealBonus ?? (golFatti + assist >= 10 ? 9 : golFatti + assist >= 5 ? 7 : 4),
      rischioMalus: baseMatch?.rischioMalus ?? (ammonizioni >= 8 || espulsioni >= 1 ? 7 : 3),
      tier,
      slotConsigliato: slot,
      status,
      rigorista,
      punizioni,
      corner,
      puntiDiForza,
      criticita,
      consiglioAsta,
      fasciaConsigliata:
        baseMatch?.fasciaConsigliata ||
        (tier === 'Tier 1 - Top'
          ? 'Top Assoluto'
          : tier === 'Tier 2 - Semitop'
          ? 'Titolare Fisso'
          : tier === 'Tier 4 - Scommesse/Low-Cost'
          ? 'Scommessa Risparmio'
          : 'Titolare Fisso'),
      targetPrezzoPercentuale:
        baseMatch?.targetPrezzoPercentuale ??
        Number(Math.min(35, Math.max(0.5, (price500 / 500) * 100)).toFixed(1)),
    };
  });

  if (onProgress) {
    onProgress(total, total);
  }

  return {
    enrichedPlayers,
    matchedCount,
    estimatedCount,
  };
}
