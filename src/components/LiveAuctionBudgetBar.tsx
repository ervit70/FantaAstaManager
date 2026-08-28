import React, { useState, useMemo } from 'react';
import { LeagueTeam, Player } from '../types/fantacalcio';
import { Coins, ChevronDown, ChevronUp, Trophy, Settings, Download, FileSpreadsheet } from 'lucide-react';
import { exportLeagueAuctionToExcel } from '../utils/excelExporter';

interface LiveAuctionBudgetBarProps {
  teams: LeagueTeam[];
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices: Record<string, number>; // playerId -> purchase price (FM)
  allPlayers: Player[];
  selectedTeamFilter?: string;
  onSelectTeamFilter: (teamId: string) => void;
  onOpenRegistry: () => void;
  onOpenSquads: () => void;
}

export const LiveAuctionBudgetBar: React.FC<LiveAuctionBudgetBarProps> = ({
  teams,
  playerAssignments,
  playerPrices,
  allPlayers,
  selectedTeamFilter,
  onSelectTeamFilter,
  onOpenRegistry,
  onOpenSquads,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute live budget statistics for all teams
  const teamsStats = useMemo(() => {
    const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));

    return teams.map((team, idx) => {
      const budgetInit = team.budgetIniziale !== undefined ? team.budgetIniziale : 700;
      let count = 0;
      let spent = 0;
      const roles = { P: 0, D: 0, C: 0, A: 0 };

      Object.entries(playerAssignments).forEach(([playerId, tId]) => {
        if (tId === team.id) {
          count += 1;
          const p = playerMap.get(playerId);
          if (p) {
            roles[p.ruolo] = (roles[p.ruolo] || 0) + 1;
          }
          const price = playerPrices[playerId];
          if (price !== undefined && !isNaN(price)) {
            spent += Number(price);
          }
        }
      });

      const remaining = budgetInit - spent;
      const slotsLeft = Math.max(0, 25 - count);
      const avgPerSlot = slotsLeft > 0 ? (remaining / slotsLeft).toFixed(1) : '0';

      return {
        team,
        budgetInit,
        count,
        spent,
        remaining,
        slotsLeft,
        avgPerSlot,
        roles,
        idx,
      };
    });
  }, [teams, playerAssignments, playerPrices, allPlayers]);

  const totalAssignedPlayers = Object.keys(playerAssignments).length;
  const totalMaxSlots = (teams.length || 10) * 25;
  const totalCreditsSpent = (Object.values(playerPrices) as number[]).reduce(
    (a: number, b: number) => a + (Number(b) || 0),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg text-slate-100 shadow-sm overflow-hidden shrink-0">
      {/* Compact Header Ribbon */}
      <div className="px-2 py-1 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-1 text-xs select-none">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-black text-amber-300 uppercase tracking-tight truncate">
            Residuo {teams.length} Squadre
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
            • <strong className="text-white font-bold">{totalAssignedPlayers}</strong>/{totalMaxSlots} <span className="hidden xs:inline">• Spesi: <strong className="text-amber-400 font-bold">{totalCreditsSpent} FM</strong></span>
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportLeagueAuctionToExcel({
                teams,
                allPlayers,
                playerAssignments,
                playerPrices,
                leagueName: 'Lega_Fantacalcio',
              })
            }
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 shadow-2xs transition-colors cursor-pointer"
            title="Scarica tutte le squadre in Excel (Col 1 vuota, Col 2 Squadra 1, Col 3 Prezzo d'acquisto, Col 4 Squadra 2, etc.)"
          >
            <Download className="w-2.5 h-2.5 text-emerald-200" />
            <span className="hidden sm:inline">Scarica Excel Asta</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenRegistry}
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title={`Modifica il budget iniziale e i nomi delle ${teams.length} squadre`}
          >
            <Settings className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">Budget ({teams.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenSquads}
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Visualizza le rose complete"
          >
            <Trophy className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">Rose</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Espandi residuo squadre' : 'Comprimi residuo squadre'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Dynamic Teams SINGLE HORIZONTAL ROW with Swipe Scrollbar on Mobile */}
      {!isCollapsed && (
        <div className="p-1 sm:p-1.5 bg-slate-900/95">
          <div 
            className="budget-horizontal-scroll flex flex-nowrap overflow-x-auto overflow-y-hidden gap-1.5 py-1 px-0.5 select-none"
            style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }}
          >
            {teamsStats.map(({ team, budgetInit, count, spent, remaining, idx }) => {
              const isSelected = selectedTeamFilter === team.id;

              // High-visibility status colors
              const badgeStyle =
                remaining < 50
                  ? 'bg-rose-950/90 text-rose-300 border-rose-700/80 ring-1 ring-rose-600/50'
                  : remaining < 150
                  ? 'bg-amber-950/90 text-amber-300 border-amber-700/80 ring-1 ring-amber-500/40'
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 ring-1 ring-emerald-500/40';

              return (
                <div
                  key={team.id}
                  onClick={() => onSelectTeamFilter(isSelected ? 'Tutti' : team.id)}
                  title={`Clicca per filtrare i giocatori di ${team.nome} (Iniziale: ${budgetInit} FM • Spesi: ${spent} FM • Residuo: ${remaining} FM • Giocatori: ${count}/25)`}
                  style={{ minWidth: '150px', flexShrink: 0 }}
                  className={`rounded-lg p-2 border transition-all cursor-pointer select-none flex flex-col justify-between shrink-0 ${
                    isSelected
                      ? 'bg-blue-900/90 border-blue-400 shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-800/90 border-slate-750 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {/* Top line: Team Badge + Full Name + Count */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="w-4 h-4 rounded text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: team.coloreHex || '#2563eb' }}
                      >
                        {team.numero || idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis" title={team.nome}>
                        {team.nome}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-slate-400 shrink-0 bg-slate-950/60 px-1 py-0.5 rounded">
                      {count}/25
                    </span>
                  </div>

                  {/* Bottom line: High visibility remaining budget + Spent */}
                  <div className="mt-1.5 flex items-center justify-between gap-1.5">
                    <div className={`px-2 py-0.5 rounded-md border flex items-baseline space-x-0.5 font-mono font-black text-xs leading-tight shadow-xs ${badgeStyle}`}>
                      <span>{remaining}</span>
                      <span className="text-[8.5px] font-normal opacity-85">FM</span>
                    </div>

                    <span className="text-[9.5px] font-mono font-medium text-slate-400 whitespace-nowrap" title={`Spesi: ${spent} FM`}>
                      {spent > 0 ? `Spesi: ${spent}` : 'Spesi: 0'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
