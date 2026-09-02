import React, { useState, useMemo } from 'react';
import { LeagueTeam, Player, Role } from '../types/fantacalcio';
import {
  Coins,
  ChevronDown,
  ChevronUp,
  Trophy,
  Settings,
  Download,
  FileSpreadsheet,
  Save,
  Check,
  HardDrive
} from 'lucide-react';
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
  activeRole?: Role | 'TUTTI' | 'PLANNER';
  onSelectRole?: (role: Role | 'TUTTI') => void;
  onOpenExcelModal?: () => void;
  onManualSave?: () => void;
  onOpenSaveModal?: () => void;
  isSaving?: boolean;
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
  activeRole = 'TUTTI',
  onSelectRole,
  onOpenExcelModal,
  onManualSave,
  onOpenSaveModal,
  isSaving = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManualSave) {
      onManualSave();
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    }
  };

  // Compute counts per role
  const countP = useMemo(() => allPlayers.filter((p) => p.ruolo === 'P').length, [allPlayers]);
  const countD = useMemo(() => allPlayers.filter((p) => p.ruolo === 'D').length, [allPlayers]);
  const countC = useMemo(() => allPlayers.filter((p) => p.ruolo === 'C').length, [allPlayers]);
  const countA = useMemo(() => allPlayers.filter((p) => p.ruolo === 'A').length, [allPlayers]);
  const totalBaseCount = allPlayers.length;

  const handleRoleClick = (role: Role | 'TUTTI') => {
    if (!onSelectRole) return;
    if (activeRole === role && role !== 'TUTTI') {
      onSelectRole('TUTTI');
    } else {
      onSelectRole(role);
    }
  };

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
      {/* Top Ribbon with Role Buttons (P, D, C, A, Excel Lega) right next to RESIDUO 10 SQUADRE */}
      <div className="px-2 py-0.5 sm:py-1 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-1.5 text-xs select-none flex-nowrap overflow-x-auto">
        {/* Left: Residuo Title and Slot Count */}
        <div className="flex items-center space-x-1.5 min-w-0 shrink-0">
          <div className="w-4 h-4 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <Coins className="w-2.5 h-2.5 text-slate-950" />
          </div>
          <span className="text-[11px] sm:text-xs font-black text-amber-300 uppercase tracking-tight whitespace-nowrap">
            Residuo {teams.length} Squadre
          </span>
          <span className="text-[9.5px] text-slate-400 font-mono hidden md:inline whitespace-nowrap">
            • <strong className="text-white font-bold">{totalAssignedPlayers}</strong>/{totalMaxSlots} <span className="hidden lg:inline">• Spesi: <strong className="text-amber-400 font-bold">{totalCreditsSpent} FM</strong></span>
          </span>
        </div>

        {/* Center: ROLE BUTTONS (TUTTI, P, D, C, A) & EXCEL LEGA */}
        {onSelectRole && (
          <div className="flex items-center space-x-1 font-mono text-[9.5px] sm:text-[10.5px] shrink-0">
            {/* TUTTI */}
            <button
              type="button"
              onClick={() => handleRoleClick('TUTTI')}
              title="Mostra tutti i ruoli"
              className={`px-1.5 py-0.5 rounded font-black transition-all cursor-pointer flex items-center space-x-0.5 border ${
                activeRole === 'TUTTI'
                  ? 'bg-slate-100 text-slate-950 border-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <span>Tutti ({totalBaseCount})</span>
            </button>

            {/* P */}
            <button
              type="button"
              onClick={() => handleRoleClick('P')}
              title={activeRole === 'P' ? 'Deseleziona Portieri' : 'Filtra Portieri'}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-black transition-all cursor-pointer border ${
                activeRole === 'P'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm ring-1 ring-amber-300 font-black'
                  : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border-amber-500/40'
              }`}
            >
              P ({countP})
            </button>

            {/* D */}
            <button
              type="button"
              onClick={() => handleRoleClick('D')}
              title={activeRole === 'D' ? 'Deseleziona Difensori' : 'Filtra Difensori'}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-black transition-all cursor-pointer border ${
                activeRole === 'D'
                  ? 'bg-emerald-500 text-white border-emerald-300 shadow-sm ring-1 ring-emerald-300 font-black'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border-emerald-500/40'
              }`}
            >
              D ({countD})
            </button>

            {/* C */}
            <button
              type="button"
              onClick={() => handleRoleClick('C')}
              title={activeRole === 'C' ? 'Deseleziona Centrocampisti' : 'Filtra Centrocampisti'}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-black transition-all cursor-pointer border ${
                activeRole === 'C'
                  ? 'bg-blue-500 text-white border-blue-300 shadow-sm ring-1 ring-blue-300 font-black'
                  : 'bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border-blue-500/40'
              }`}
            >
              C ({countC})
            </button>

            {/* A */}
            <button
              type="button"
              onClick={() => handleRoleClick('A')}
              title={activeRole === 'A' ? 'Deseleziona Attaccanti' : 'Filtra Attaccanti'}
              className={`px-1.5 sm:px-2 py-0.5 rounded font-black transition-all cursor-pointer border ${
                activeRole === 'A'
                  ? 'bg-red-500 text-white border-red-300 shadow-sm ring-1 ring-red-300 font-black'
                  : 'bg-red-500/20 hover:bg-red-500/40 text-red-300 border-red-500/40'
              }`}
            >
              A ({countA})
            </button>

            {/* Excel Lega Button */}
            {onOpenExcelModal && (
              <button
                type="button"
                onClick={onOpenExcelModal}
                className="px-1.5 sm:px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs border border-emerald-400"
                title="Gestione File Excel e Listone Serie A da fantacalcio.it"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-100" />
                <span>Excel Lega</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Actions (SALVA, Backup, Scarica Excel Asta, Budget, Rose, Collapse) */}
        <div className="flex items-center space-x-1 shrink-0">
          {onManualSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-0.5 px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-black border transition-all cursor-pointer shadow-xs ${
                showSavedFeedback
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300 scale-105'
                  : isSaving
                  ? 'bg-emerald-700 text-emerald-200 border-emerald-500 animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 ring-1 ring-emerald-300/60'
              }`}
              title="Salva immediatamente tutti gli acquisti nel browser e nel cloud"
            >
              {showSavedFeedback ? (
                <>
                  <Check className="w-2.5 h-2.5 stroke-[3] text-slate-950" />
                  <span>SALVATO!</span>
                </>
              ) : (
                <>
                  <Save className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                  <span>SALVA</span>
                </>
              )}
            </button>
          )}

          {onOpenSaveModal && (
            <button
              type="button"
              onClick={onOpenSaveModal}
              className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 transition-colors cursor-pointer"
              title="Gestione Backup, Cronologia Salvataggi e Ripristino"
            >
              <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          )}

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
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 shadow-2xs transition-colors cursor-pointer"
            title="Scarica tutte le squadre in Excel"
          >
            <Download className="w-2.5 h-2.5 text-emerald-200" />
            <span className="hidden lg:inline">Scarica Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenRegistry}
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title={`Modifica il budget iniziale e i nomi delle ${teams.length} squadre`}
          >
            <Settings className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">Budget</span>
          </button>

          <button
            type="button"
            onClick={onOpenSquads}
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
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

      {/* SINGLE ROW of ALL teams - Micro-cards fitting strictly side-by-side on 1 row without horizontal scroll */}
      {!isCollapsed && (
        <div
          className="p-0.5 sm:p-1 bg-slate-900/95 grid gap-0.5 sm:gap-1 w-full overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${teams.length || 10}, minmax(0, 1fr))`,
          }}
        >
          {teamsStats.map(({ team, budgetInit, count, spent, remaining, roles, idx }) => {
            const isSelected = selectedTeamFilter === team.id;
            const pctSpent = budgetInit > 0 ? Math.min(100, Math.round((spent / budgetInit) * 100)) : 0;
            const isCompleted = count >= 25;

            return (
              <div
                key={team.id}
                onClick={() => {
                  if (isSelected) {
                    onSelectTeamFilter('Tutti');
                  } else {
                    onSelectTeamFilter(team.id);
                  }
                }}
                className={`p-0.5 sm:p-1 rounded border transition-all cursor-pointer select-none relative flex flex-col justify-between min-w-0 w-full overflow-hidden ${
                  isSelected
                    ? 'bg-blue-950 border-blue-400 ring-1 ring-blue-400 shadow-md z-10'
                    : 'bg-slate-950/85 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                }`}
                title={`${team.nome} (${count}/25) • Residuo: ${remaining} FM • Spesi: ${spent}/${budgetInit} FM (Clicca per filtrare)`}
              >
                {/* Team Name + Slot count */}
                <div className="flex items-center justify-between gap-0.5 min-w-0 w-full leading-none">
                  <div className="flex items-center space-x-0.5 min-w-0 flex-1 overflow-hidden">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-600 text-[6.5px] sm:text-[7.5px] font-mono font-black flex items-center justify-center text-white shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className="font-bold text-[7.5px] sm:text-[8.5px] md:text-[9.5px] text-white tracking-tight truncate block min-w-0"
                      title={team.nome}
                    >
                      {team.nome}
                    </span>
                  </div>

                  <span
                    className={`text-[6.5px] sm:text-[7.5px] font-mono font-black px-0.5 py-0.2 rounded shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {count}/25
                  </span>
                </div>

                {/* Main Budget Display */}
                <div className="mt-0.5 flex items-baseline justify-between border-t border-slate-800/80 pt-0.5 leading-none min-w-0">
                  <div className="flex items-baseline space-x-0.5 min-w-0">
                    <span
                      className={`text-[9.5px] sm:text-[10.5px] md:text-[11px] font-black font-mono tracking-tight leading-none ${
                        remaining < 20
                          ? 'text-red-400'
                          : remaining < 60
                          ? 'text-amber-300'
                          : 'text-emerald-400'
                      }`}
                    >
                      {remaining}
                    </span>
                    <span className="text-[6px] sm:text-[6.5px] font-bold text-slate-400 uppercase">FM</span>
                  </div>
                  <div className="text-[6.5px] sm:text-[7.5px] font-mono text-slate-400 truncate">
                    <strong className="text-slate-200">{spent}</strong>
                  </div>
                </div>

                {/* Role Breakdown Badges: only the count acquired (P:1 D:4 C:2 A:1) */}
                <div className="mt-0.5 grid grid-cols-4 gap-0.5 text-center text-[6.5px] sm:text-[7px] font-mono font-black leading-none">
                  <div
                    className={`rounded py-0.5 ${
                      roles.P >= 3
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                        : roles.P > 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                    title={`Portieri: ${roles.P}`}
                  >
                    P:{roles.P}
                  </div>
                  <div
                    className={`rounded py-0.5 ${
                      roles.D >= 8
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                        : roles.D > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                    title={`Difensori: ${roles.D}`}
                  >
                    D:{roles.D}
                  </div>
                  <div
                    className={`rounded py-0.5 ${
                      roles.C >= 8
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                        : roles.C > 0
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                    title={`Centrocampisti: ${roles.C}`}
                  >
                    C:{roles.C}
                  </div>
                  <div
                    className={`rounded py-0.5 ${
                      roles.A >= 6
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : roles.A > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                    title={`Attaccanti: ${roles.A}`}
                  >
                    A:{roles.A}
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="mt-0.5 w-full bg-slate-800 h-0.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pctSpent > 90
                        ? 'bg-red-500'
                        : pctSpent > 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pctSpent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
