import React, { useState, useMemo } from 'react';
import { LeagueTeam, Player } from '../types/fantacalcio';
import { Coins, ChevronDown, ChevronUp, Trophy, Settings } from 'lucide-react';

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

  // Compute live budget statistics for all 10 teams
  const teamsStats = useMemo(() => {
    const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));

    return teams.map((team) => {
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
      };
    });
  }, [teams, playerAssignments, playerPrices, allPlayers]);

  const totalAssignedPlayers = Object.keys(playerAssignments).length;
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
            Residuo Squadre
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
            • <strong className="text-white font-bold">{totalAssignedPlayers}</strong>/250 <span className="hidden xs:inline">• Spesi: <strong className="text-amber-400 font-bold">{totalCreditsSpent} FM</strong></span>
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={onOpenRegistry}
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Modifica il budget iniziale e i nomi delle 10 squadre"
          >
            <Settings className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">Budget</span>
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

      {/* 10 Teams STRICT SINGLE HORIZONTAL ROW with Swipe Scrollbar on Mobile */}
      {!isCollapsed && (
        <div className="p-1 sm:p-1.5 bg-slate-900/95">
          <div 
            className="budget-horizontal-scroll flex flex-nowrap overflow-x-auto overflow-y-hidden gap-1.5 py-1 px-0.5 select-none"
            style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }}
          >
            {teamsStats.map(({ team, budgetInit, count, spent, remaining }) => {
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
                  style={{ minWidth: '120px', width: '120px', maxWidth: '120px', flexShrink: 0 }}
                  className={`rounded-md p-1.5 border transition-all cursor-pointer select-none flex flex-col justify-between shrink-0 ${
                    isSelected
                      ? 'bg-blue-900/90 border-blue-400 shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-800/90 border-slate-700/90 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {/* Top line: Number + Name + Count */}
                  <div className="flex items-center justify-between space-x-1 min-w-0 leading-tight">
                    <div className="flex items-center space-x-1 min-w-0 truncate">
                      <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white font-mono font-bold text-[8.5px] flex items-center justify-center shrink-0">
                        {team.numero}
                      </span>
                      <span className="text-[10px] font-bold text-slate-100 truncate">
                        {team.nome}
                      </span>
                    </div>
                    <span className="text-[8.5px] font-mono text-slate-400 shrink-0">
                      {count}/25
                    </span>
                  </div>

                  {/* Bottom line: High visibility remaining budget */}
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <div className={`px-1.5 py-0.5 rounded border flex items-baseline space-x-0.5 font-mono font-black text-[11px] leading-tight ${badgeStyle}`}>
                      <span>{remaining}</span>
                      <span className="text-[8px] font-normal opacity-85">FM</span>
                    </div>

                    <span className="text-[8.5px] font-mono text-slate-400 truncate" title={`Spesi: ${spent} FM`}>
                      {spent > 0 ? `-${spent}` : '0'}
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
