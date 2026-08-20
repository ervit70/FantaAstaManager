import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Player, LeagueTeam, Role } from '../types/fantacalcio';
import { 
  Trophy, 
  X, 
  Users, 
  User, 
  Download, 
  Trash2, 
  Search, 
  Coins,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

interface LeagueSquadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: LeagueTeam[];
  allPlayers: Player[];
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices?: Record<string, number>; // playerId -> purchase price
  onAssignPlayer: (playerId: string, teamId: string) => void;
  onOpenRegistry: () => void;
  onSelectPlayer: (player: Player) => void;
}

export const LeagueSquadsModal: React.FC<LeagueSquadsModalProps> = ({
  isOpen,
  onClose,
  teams,
  allPlayers,
  playerAssignments,
  playerPrices = {},
  onAssignPlayer,
  onOpenRegistry,
  onSelectPlayer,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'team-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Map of players belonging to each team - Hook called unconditionally
  const teamRosters = useMemo(() => {
    const rosters: Record<string, Player[]> = {};
    teams.forEach((t) => {
      rosters[t.id] = [];
    });

    // Populate
    const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));
    Object.entries(playerAssignments).forEach(([playerId, rawTeamId]) => {
      const teamId = String(rawTeamId);
      if (teamId && rosters[teamId]) {
        const player = playerMap.get(playerId);
        if (player) {
          rosters[teamId].push(player);
        }
      }
    });

    return rosters;
  }, [teams, allPlayers, playerAssignments]);

  const currentTeamIndex = teams.findIndex((t) => t.id === selectedTeamId);
  const currentTeam = (currentTeamIndex >= 0 ? teams[currentTeamIndex] : teams[0]) || {
    id: 'team-1',
    numero: 1,
    nome: 'Squadra 1',
    capitano1: '',
    capitano2: '',
    budgetIniziale: 700,
  };
  const currentRoster = teamRosters[currentTeam.id] || [];

  // Navigate to prev/next team
  const handlePrevTeam = () => {
    if (teams.length === 0) return;
    const prevIdx = currentTeamIndex > 0 ? currentTeamIndex - 1 : teams.length - 1;
    setSelectedTeamId(teams[prevIdx].id);
  };

  const handleNextTeam = () => {
    if (teams.length === 0) return;
    const nextIdx = currentTeamIndex < teams.length - 1 ? currentTeamIndex + 1 : 0;
    setSelectedTeamId(teams[nextIdx].id);
  };

  // Categorize players by role - Hook called unconditionally
  const roleCategorized = useMemo(() => {
    let list = currentRoster;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.squadra.toLowerCase().includes(q)
      );
    }

    const portieri = list.filter((p) => p.ruolo === 'P');
    const difensori = list.filter((p) => p.ruolo === 'D');
    const centrocampisti = list.filter((p) => p.ruolo === 'C');
    const attaccanti = list.filter((p) => p.ruolo === 'A');

    return { portieri, difensori, centrocampisti, attaccanti };
  }, [currentRoster, searchQuery]);

  // Aggregate stats for current team - Hook called unconditionally
  const teamStats = useMemo(() => {
    const total = currentRoster.length;
    const budgetInit = currentTeam.budgetIniziale !== undefined ? currentTeam.budgetIniziale : 700;

    let spent = 0;
    currentRoster.forEach((p) => {
      const price = playerPrices[p.id];
      if (price !== undefined && !isNaN(price)) {
        spent += Number(price);
      }
    });
    const remaining = budgetInit - spent;
    const slotsLeft = Math.max(0, 25 - total);
    const avgPerSlot = slotsLeft > 0 ? (remaining / slotsLeft).toFixed(1) : '0';

    if (total === 0) {
      return { total: 0, avgFM: '0.00', totalGol: 0, totalAssist: 0, totalCleanSheet: 0, budgetInit, spent, remaining, slotsLeft, avgPerSlot };
    }
    const sumFM = currentRoster.reduce((acc, p) => acc + (p.fantaMedia || 0), 0);
    const avgFM = (sumFM / total).toFixed(2);
    const totalGol = currentRoster.reduce((acc, p) => acc + (p.golFatti || 0), 0);
    const totalAssist = currentRoster.reduce((acc, p) => acc + (p.assist || 0), 0);
    const totalCleanSheet = currentRoster.reduce((acc, p) => acc + (p.cleanSheet || 0), 0);

    return { total, avgFM, totalGol, totalAssist, totalCleanSheet, budgetInit, spent, remaining, slotsLeft, avgPerSlot };
  }, [currentRoster, currentTeam, playerPrices]);

  // Early return strictly AFTER all hooks have executed
  if (!isOpen) return null;

  // Export all rosters to an organized Excel workbook
  const handleExportAllRostersExcel = () => {
    const workbook = XLSX.utils.book_new();

    teams.forEach((t) => {
      const roster = teamRosters[t.id] || [];
      const budgetInit = t.budgetIniziale !== undefined ? t.budgetIniziale : 700;
      let totalSpent = 0;
      roster.forEach((p) => {
        const pr = playerPrices[p.id];
        if (pr) totalSpent += Number(pr);
      });

      const rows: any[][] = [
        [`ROSA FANTACALCIO: ${t.nome.toUpperCase()}`],
        [`Capitano 1: ${t.capitano1 || 'Non specificato'}`, `Capitano 2: ${t.capitano2 || 'Non specificato'}`],
        [`Monte Iniziale: ${budgetInit} FM`, `Crediti Spesi: ${totalSpent} FM`, `Crediti Residui: ${budgetInit - totalSpent} FM`],
        [`Totale Calciatori: ${roster.length} / 25`],
        [],
        ['Ruolo', 'Nome Calciatore', 'Squadra Serie A', 'Prezzo Asta (FM)', 'FantaMedia 25/26', 'Media Voto', 'Gol 25/26', 'Assist', 'Rigori', 'Presenze'],
      ];

      // Sort by role P -> D -> C -> A then name
      const roleOrder: Record<Role, number> = { P: 1, D: 2, C: 3, A: 4 };
      const sorted = [...roster].sort((a, b) => {
        if (roleOrder[a.ruolo] !== roleOrder[b.ruolo]) {
          return roleOrder[a.ruolo] - roleOrder[b.ruolo];
        }
        return a.nome.localeCompare(b.nome);
      });

      sorted.forEach((p) => {
        const paid = playerPrices[p.id] !== undefined ? playerPrices[p.id] : '-';
        rows.push([
          p.ruolo,
          p.nome,
          p.squadra,
          paid,
          p.fantaMedia.toFixed(2),
          p.mediaVoto.toFixed(2),
          p.ruolo === 'P' ? `-${p.golSubiti} GS` : p.golFatti,
          p.assist,
          p.rigoriSegnati > 0 ? `${p.rigoriSegnati}/${p.rigoriTirati}` : '-',
          p.presenze,
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const cleanTitle = t.nome.substring(0, 28).replace(/[\\/?*[\]]/g, '');
      XLSX.utils.book_append_sheet(workbook, worksheet, cleanTitle || `Squadra ${t.numero}`);
    });

    XLSX.writeFile(workbook, `Rose_${teams.length}_Squadre_Fantacalcio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderRoleSection = (title: string, roleCode: Role, players: Player[], badgeBg: string) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center space-x-1.5">
            <span className={`px-1.5 py-0.2 rounded font-black text-[10px] border ${badgeBg}`}>
              {roleCode}
            </span>
            <span className="font-bold text-xs text-slate-800 uppercase tracking-tight">
              {title}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              ({players.length})
            </span>
          </div>
        </div>

        {players.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic py-1.5">Nessun calciatore assegnato in questo ruolo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {players.map((p) => {
              const paidPrice = playerPrices[p.id];
              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2 flex items-center justify-between text-xs transition-all shadow-2xs group"
                >
                  <div className="flex items-center space-x-1.5 overflow-hidden min-w-0 pr-1">
                    <span
                      onClick={() => onSelectPlayer(p)}
                      className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate text-[11px]"
                      title={`Clicca per aprire scheda di ${p.nome}`}
                    >
                      {p.nome}
                    </span>
                    <span className="text-[9.5px] px-1 py-0.1 rounded bg-slate-100 font-bold text-slate-600 border border-slate-200 shrink-0">
                      {p.squadra}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Paid price tag */}
                    <div className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-950 font-mono font-black text-[10.5px]">
                      {paidPrice !== undefined ? `${paidPrice} FM` : '—'}
                    </div>

                    <div className="text-right font-mono text-[10px]">
                      <span className="text-emerald-700 font-bold">FM {p.fantaMedia.toFixed(2)}</span>
                    </div>

                    {/* Release button */}
                    <button
                      type="button"
                      onClick={() => onAssignPlayer(p.id, '')}
                      title="Svincola calciatore dalla rosa"
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner font-extrabold shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center space-x-2 truncate">
                <span>Rose Complete ({teams.length} Squadre) Lega Fantacalcio</span>
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Composizione rose, prezzi d'acquisto, crediti spesi e residui in tempo reale.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportAllRostersExcel}
              className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Scarica file Excel con i fogli delle rose"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Esporta {teams.length} Rose Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TEAMS SELECTOR: Responsive Grid & Scrollbar */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-2 sm:px-4 sm:py-2.5 shrink-0">
          <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-600">
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Seleziona Squadra (Tutte le {teams.length} Squadre della Lega):</span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrevTeam}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                title="Squadra precedente"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prec</span>
              </button>
              <button
                type="button"
                onClick={handleNextTeam}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                title="Squadra successiva"
              >
                <span>Succ</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Grid of compact team buttons that cleanly fit on all smartphone/laptop resolutions */}
          <div className="overflow-x-auto smooth-horizontal-scroll flex sm:grid sm:grid-cols-5 lg:grid-cols-10 gap-1 sm:gap-1.5 pb-1 sm:pb-0">
            {teams.map((team, idx) => {
              const roster = teamRosters[team.id] || [];
              const count = roster.length;
              const isSelected = selectedTeamId === team.id;
              
              // Remaining budget calculation
              const bInit = team.budgetIniziale !== undefined ? team.budgetIniziale : 700;
              let sp = 0;
              roster.forEach((p) => {
                const pr = playerPrices[p.id];
                if (pr) sp += Number(pr);
              });
              const rem = bInit - sp;

              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  title={`${team.nome} (Giocatori: ${count}/25, Residui: ${rem} FM)`}
                  className={`min-w-[95px] sm:min-w-0 flex-1 p-1 sm:p-1.5 rounded-lg text-left transition-all flex flex-col justify-between cursor-pointer border relative shrink-0 sm:shrink ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between space-x-1 w-full">
                    <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-mono font-black shrink-0 ${
                      isSelected ? 'bg-white text-blue-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {team.numero || idx + 1}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded shrink-0 ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}/25
                    </span>
                  </div>

                  <div className="mt-1 w-full">
                    <span className="font-bold text-[10.5px] truncate block leading-tight">
                      {team.nome}
                    </span>
                    <span className={`text-[9px] font-mono block ${isSelected ? 'text-amber-200 font-bold' : 'text-emerald-700 font-semibold'}`}>
                      {rem} FM
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/50">
          
          {/* Team Info Banner & Live Budget */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                  {currentTeam.numero}
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {currentTeam.nome}
                </h3>
                <button
                  type="button"
                  onClick={onOpenRegistry}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
                >
                  Modifica Anagrafica
                </button>
              </div>

              {/* Captains */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center space-x-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Cap. 1: <strong>{currentTeam.capitano1 || 'N/D'}</strong></span>
                </span>
                <span className="flex items-center space-x-1 bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3 text-purple-600" />
                  <span>Cap. 2: <strong>{currentTeam.capitano2 || 'N/D'}</strong></span>
                </span>
              </div>
            </div>

            {/* Live Budget & Aggregate Stats */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Budget Badge */}
              <div className="flex items-center space-x-2 bg-amber-50/80 border border-amber-300 p-2 rounded-lg font-mono text-center">
                <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left leading-tight pr-1.5">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-bold">Iniziale</span>
                  <span className="text-xs font-black text-slate-950">{teamStats.budgetInit} FM</span>
                </div>
                <div className="w-px h-5 bg-amber-200" />
                <div className="text-left leading-tight pr-1.5 pl-0.5">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-bold">Spesi</span>
                  <span className="text-xs font-black text-rose-600">-{teamStats.spent} FM</span>
                </div>
                <div className="w-px h-5 bg-amber-200" />
                <div className="text-left leading-tight pl-0.5">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-bold">Residui</span>
                  <span className="text-xs font-black text-emerald-700">{teamStats.remaining} FM</span>
                </div>
              </div>

              {/* Roster counts */}
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-center">
                <div className="px-1">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">Rosa</span>
                  <span className="text-xs font-black text-slate-900">{teamStats.total}/25</span>
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <div className="px-1">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">FM Media</span>
                  <span className="text-xs font-black text-emerald-600">{teamStats.avgFM}</span>
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <div className="px-1">
                  <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">Gol</span>
                  <span className="text-xs font-black text-rose-600">+{teamStats.totalGol}</span>
                </div>
                {teamStats.slotsLeft > 0 && (
                  <>
                    <div className="w-px h-5 bg-slate-200" />
                    <div className="px-1">
                      <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">Med/Slot</span>
                      <span className="text-xs font-black text-amber-600">{teamStats.avgPerSlot}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search within this team */}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca calciatore nella rosa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Categorized Role Sections */}
          <div className="space-y-4">
            {renderRoleSection('Portieri', 'P', roleCategorized.portieri, 'bg-amber-100 text-amber-900 border-amber-300')}
            {renderRoleSection('Difensori', 'D', roleCategorized.difensori, 'bg-sky-100 text-sky-900 border-sky-300')}
            {renderRoleSection('Centrocampisti', 'C', roleCategorized.centrocampisti, 'bg-emerald-100 text-emerald-900 border-emerald-300')}
            {renderRoleSection('Attaccanti', 'A', roleCategorized.attaccanti, 'bg-rose-100 text-rose-900 border-rose-300')}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-600 font-medium truncate pr-2">
            Mostrando rosa di <strong>{currentTeam.nome}</strong> ({currentRoster.length} calciatori) — Residui: <strong className="text-emerald-700 font-mono font-bold">{teamStats.remaining} FM</strong>.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
