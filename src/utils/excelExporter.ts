import * as XLSX from 'xlsx';
import { Player, LeagueTeam, Role } from '../types/fantacalcio';

interface ExportLeagueAuctionOptions {
  teams: LeagueTeam[];
  allPlayers: Player[];
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices?: Record<string, number>; // playerId -> purchase price (FM)
  leagueName?: string;
}

/**
 * Esporta tutte le squadre della lega in formato Excel con la struttura richiesta:
 * - Colonna A (1ª colonna): Vuota
 * - Colonna B (2ª colonna): Nome 1ª Squadra / Calciatori
 * - Colonna C (3ª colonna): Valore d'acquisto (FM)
 * - Colonna D (4ª colonna): Nome 2ª Squadra / Calciatori
 * - Colonna E (5ª colonna): Valore d'acquisto (FM)
 * - Colonna F (6ª colonna): Nome 3ª Squadra / Calciatori
 * - Colonna G (7ª colonna): Valore d'acquisto (FM)
 * ... e così via per tutte le squadre della lega.
 */
export const exportLeagueAuctionToExcel = ({
  teams,
  allPlayers,
  playerAssignments,
  playerPrices = {},
  leagueName = 'Lega Fantacalcio',
}: ExportLeagueAuctionOptions) => {
  if (!teams || teams.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // Mappa giocatori per id
  const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));

  // Raggruppa i giocatori per squadra
  const teamRosters: Record<string, Player[]> = {};
  teams.forEach((t) => {
    teamRosters[t.id] = [];
  });

  Object.entries(playerAssignments).forEach(([playerId, rawTeamId]) => {
    const teamId = String(rawTeamId);
    if (teamId && teamRosters[teamId]) {
      const player = playerMap.get(playerId);
      if (player) {
        teamRosters[teamId].push(player);
      }
    }
  });

  // Ordina i giocatori di ciascuna squadra per Ruolo (P -> D -> C -> A) poi per Nome
  const roleOrder: Record<Role, number> = { P: 1, D: 2, C: 3, A: 4 };
  const sortedRosters: Record<string, Player[]> = {};
  let maxRosterLength = 25; // minimo 25 righe standard di una rosa fantacalcio

  teams.forEach((t) => {
    const roster = teamRosters[t.id] || [];
    const sorted = [...roster].sort((a, b) => {
      if (roleOrder[a.ruolo] !== roleOrder[b.ruolo]) {
        return roleOrder[a.ruolo] - roleOrder[b.ruolo];
      }
      return a.nome.localeCompare(b.nome);
    });
    sortedRosters[t.id] = sorted;
    if (sorted.length > maxRosterLength) {
      maxRosterLength = sorted.length;
    }
  });

  // Costruzione matrice righe per il Foglio Principale (Side-by-Side)
  const rows: any[][] = [];

  // RIGA 1: Intestazione Squadre
  // Col A: vuota, poi per ogni squadra [Nome Squadra, 'Valore Acquisto']
  const headerRow1: any[] = [''];
  teams.forEach((t) => {
    headerRow1.push(t.nome.toUpperCase());
    headerRow1.push("Valore d'acquisto");
  });
  rows.push(headerRow1);

  // RIGA 2: Capitani / Dettagli Squadra
  const headerRow2: any[] = [''];
  teams.forEach((t) => {
    const capInfo = t.capitano1 ? `Cap: ${t.capitano1}` : `Squadra ${t.numero}`;
    headerRow2.push(capInfo);
    headerRow2.push('Crediti (FM)');
  });
  rows.push(headerRow2);

  // RIGHE CALCIATORI (Slot 1 .. maxRosterLength)
  for (let slotIdx = 0; slotIdx < maxRosterLength; slotIdx++) {
    const playerRow: any[] = ['']; // Colonna 1 vuota

    teams.forEach((t) => {
      const roster = sortedRosters[t.id] || [];
      const player = roster[slotIdx];

      if (player) {
        // Nome calciatore con indicazione ruolo es. "[P] MERET" o "MERET (P)"
        const playerLabel = `${player.nome} (${player.ruolo})`;
        const price = playerPrices[player.id] !== undefined ? Number(playerPrices[player.id]) : 1;
        playerRow.push(playerLabel);
        playerRow.push(price);
      } else {
        // Slot vuoto non ancora assegnato
        playerRow.push('');
        playerRow.push('');
      }
    });

    rows.push(playerRow);
  }

  // RIGA SEPARATRICE VUOTA
  rows.push(['']);

  // RIGA RIEPILOGO: Totale Crediti Spesi
  const spentRow: any[] = [''];
  teams.forEach((t) => {
    const roster = sortedRosters[t.id] || [];
    let totalSpent = 0;
    roster.forEach((p) => {
      const pr = playerPrices[p.id];
      if (pr !== undefined && !isNaN(Number(pr))) {
        totalSpent += Number(pr);
      }
    });
    spentRow.push('TOTALE SPESI');
    spentRow.push(totalSpent);
  });
  rows.push(spentRow);

  // RIGA RIEPILOGO: Crediti Residui
  const remainingRow: any[] = [''];
  teams.forEach((t) => {
    const budgetInit = t.budgetIniziale !== undefined ? t.budgetIniziale : 700;
    const roster = sortedRosters[t.id] || [];
    let totalSpent = 0;
    roster.forEach((p) => {
      const pr = playerPrices[p.id];
      if (pr !== undefined && !isNaN(Number(pr))) {
        totalSpent += Number(pr);
      }
    });
    remainingRow.push('CREDITI RESIDUI');
    remainingRow.push(budgetInit - totalSpent);
  });
  rows.push(remainingRow);

  // RIGA RIEPILOGO: Budget Iniziale
  const budgetInitRow: any[] = [''];
  teams.forEach((t) => {
    const budgetInit = t.budgetIniziale !== undefined ? t.budgetIniziale : 700;
    budgetInitRow.push('BUDGET INIZIALE');
    budgetInitRow.push(budgetInit);
  });
  rows.push(budgetInitRow);

  // RIGA RIEPILOGO: Giocatori Acquistati (Conteggio / 25)
  const countRow: any[] = [''];
  teams.forEach((t) => {
    const roster = sortedRosters[t.id] || [];
    countRow.push('GIOCATORI IN ROSA');
    countRow.push(`${roster.length} / 25`);
  });
  rows.push(countRow);

  // Crea il Foglio Principale Excel
  const mainSheet = XLSX.utils.aoa_to_sheet(rows);

  // Imposta larghezza colonne ottimali: Col A stretta (vuota), poi Calciatore largo, Valore compatto
  const colWidths: { wch: number }[] = [{ wch: 4 }]; // Colonna A vuota
  teams.forEach(() => {
    colWidths.push({ wch: 28 }); // Nome squadra / Giocatore
    colWidths.push({ wch: 18 }); // Valore d'acquisto (FM)
  });
  mainSheet['!cols'] = colWidths;

  // Aggiungi il foglio principale richiesto
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Asta Tutte le Squadre');

  // AGGIUNGI FOGLI INDIVIDUALI PER CIASCUNA SQUADRA (con statistiche complete)
  teams.forEach((t) => {
    const roster = sortedRosters[t.id] || [];
    const budgetInit = t.budgetIniziale !== undefined ? t.budgetIniziale : 700;
    let totalSpent = 0;
    roster.forEach((p) => {
      const pr = playerPrices[p.id];
      if (pr) totalSpent += Number(pr);
    });

    const teamRows: any[][] = [
      [`ROSA COMPLETA: ${t.nome.toUpperCase()}`],
      [`Capitano 1: ${t.capitano1 || 'Non specificato'}`, `Capitano 2: ${t.capitano2 || 'Non specificato'}`],
      [`Budget Iniziale: ${budgetInit} FM`, `Crediti Spesi: ${totalSpent} FM`, `Crediti Residui: ${budgetInit - totalSpent} FM`],
      [`Calciatori in Rosa: ${roster.length} / 25`],
      [],
      ['Ruolo', 'Nome Calciatore', 'Squadra Serie A', "Valore d'Acquisto (FM)", 'FantaMedia', 'Media Voto', 'Gol Fatti/Subiti', 'Assist', 'Presenze'],
    ];

    roster.forEach((p) => {
      const paid = playerPrices[p.id] !== undefined ? Number(playerPrices[p.id]) : '-';
      teamRows.push([
        p.ruolo,
        p.nome,
        p.squadra,
        paid,
        p.fantaMedia ? p.fantaMedia.toFixed(2) : '-',
        p.mediaVoto ? p.mediaVoto.toFixed(2) : '-',
        p.ruolo === 'P' ? `-${p.golSubiti} GS` : p.golFatti,
        p.assist,
        p.presenze,
      ]);
    });

    const teamSheet = XLSX.utils.aoa_to_sheet(teamRows);
    teamSheet['!cols'] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
    ];

    const cleanTitle = t.nome.substring(0, 28).replace(/[\\/?*[\]]/g, '');
    XLSX.utils.book_append_sheet(workbook, teamSheet, cleanTitle || `Squadra ${t.numero}`);
  });

  // Genera nome file scaricato
  const sanitizedLeague = leagueName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Asta_${sanitizedLeague}_${teams.length}_Squadre_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
