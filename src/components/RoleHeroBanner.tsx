import React from 'react';
import { Player, Role } from '../types/fantacalcio';
import { BarChart2, Calendar, RotateCcw } from 'lucide-react';

interface RoleHeroBannerProps {
  activeRole: Role | 'TUTTI' | 'PLANNER';
  onSelectRole: (role: Role | 'TUTTI') => void;
  players?: Player[];
  onOpenExcelModal?: () => void;
}

export const RoleHeroBanner: React.FC<RoleHeroBannerProps> = ({
  activeRole,
  onSelectRole,
  players = [],
  onOpenExcelModal,
}) => {
  const rolePlayers = activeRole === 'TUTTI' || activeRole === 'PLANNER' 
    ? players 
    : players.filter((p) => p.ruolo === activeRole);

  const countP = players.filter((p) => p.ruolo === 'P').length;
  const countD = players.filter((p) => p.ruolo === 'D').length;
  const countC = players.filter((p) => p.ruolo === 'C').length;
  const countA = players.filter((p) => p.ruolo === 'A').length;

  const total = rolePlayers.length;
  const avgFM = total > 0 ? (rolePlayers.reduce((acc, p) => acc + (p.fantaMedia || 0), 0) / total).toFixed(2) : '0.00';
  const totalGoals = rolePlayers.reduce((acc, p) => acc + (p.golFatti || 0), 0);
  const totalAssists = rolePlayers.reduce((acc, p) => acc + (p.assist || 0), 0);
  const totalCleanSheet = rolePlayers.reduce((acc, p) => acc + (p.cleanSheet || 0), 0);

  const roleMeta = activeRole !== 'TUTTI' && activeRole !== 'PLANNER' ? {
    P: {
      name: 'Portieri',
      badge: 'bg-amber-500 text-slate-950 border-amber-600',
      stats: `${total} Portieri • FM media ${avgFM} • ${totalCleanSheet} Clean Sheet`,
    },
    D: {
      name: 'Difensori',
      badge: 'bg-emerald-600 text-white border-emerald-700',
      stats: `${total} Difensori • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
    C: {
      name: 'Centrocampisti',
      badge: 'bg-blue-600 text-white border-blue-700',
      stats: `${total} Centrocampisti • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
    A: {
      name: 'Attaccanti',
      badge: 'bg-red-600 text-white border-red-700',
      stats: `${total} Attaccanti • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
  }[activeRole] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1.5 text-xs">
      {/* Left Info Zone: Total or Role Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
        {roleMeta ? (
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10.5px] font-black uppercase border shadow-2xs ${roleMeta.badge}`}>
              {roleMeta.name} ({total})
            </span>
            <span className="text-[10.5px] sm:text-[11px] text-slate-700 font-mono font-bold">
              {roleMeta.stats}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            <span className="inline-flex items-center text-slate-900 font-bold text-[10.5px] sm:text-[11px]">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" />
              {players.length} Giocatori nel Listone
            </span>
            <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-mono hidden md:inline">
              (P: {countP} • D: {countD} • C: {countC} • A: {countA})
            </span>
          </div>
        )}

        {/* Discreet market date & final file notice in small text */}
        <div className="hidden lg:flex items-center space-x-1 text-[9.5px] text-slate-500 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded">
          <Calendar className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span>
            Listone: <strong className="text-slate-700 font-semibold">20 Ago 2026</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-amber-700 font-medium">
            Definitivo scaricabile dal 2 Settembre
          </span>
        </div>
      </div>

      {/* Right: Permanent Role Navigation Buttons (Always visible & interactive) */}
      <div className="flex items-center space-x-1 font-mono text-[10px] sm:text-[11px] overflow-x-auto smooth-horizontal-scroll py-0.5 shrink-0 ml-auto">
        {/* TUTTI BUTTON */}
        <button
          onClick={() => onSelectRole('TUTTI')}
          title="Mostra tutti i ruoli"
          className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1 border ${
            activeRole === 'TUTTI'
              ? 'bg-slate-800 text-white border-slate-900 shadow-sm ring-1 ring-slate-400'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          {activeRole !== 'TUTTI' && <RotateCcw className="w-2.5 h-2.5 mr-0.5" />}
          <span>Tutti ({players.length})</span>
        </button>

        {/* P BUTTON */}
        <button
          onClick={() => onSelectRole(activeRole === 'P' ? 'TUTTI' : 'P')}
          title={activeRole === 'P' ? 'Clicca per deselezionare' : 'Filtra Portieri'}
          className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer shrink-0 border ${
            activeRole === 'P'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-400 scale-105'
              : 'bg-amber-100/80 hover:bg-amber-400 hover:text-slate-950 text-amber-900 border-amber-300'
          }`}
        >
          P ({countP})
        </button>

        {/* D BUTTON */}
        <button
          onClick={() => onSelectRole(activeRole === 'D' ? 'TUTTI' : 'D')}
          title={activeRole === 'D' ? 'Clicca per deselezionare' : 'Filtra Difensori'}
          className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer shrink-0 border ${
            activeRole === 'D'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400 scale-105'
              : 'bg-emerald-100/80 hover:bg-emerald-600 hover:text-white text-emerald-900 border-emerald-300'
          }`}
        >
          D ({countD})
        </button>

        {/* C BUTTON */}
        <button
          onClick={() => onSelectRole(activeRole === 'C' ? 'TUTTI' : 'C')}
          title={activeRole === 'C' ? 'Clicca per deselezionare' : 'Filtra Centrocampisti'}
          className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer shrink-0 border ${
            activeRole === 'C'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400 scale-105'
              : 'bg-blue-100/80 hover:bg-blue-600 hover:text-white text-blue-900 border-blue-300'
          }`}
        >
          C ({countC})
        </button>

        {/* A BUTTON */}
        <button
          onClick={() => onSelectRole(activeRole === 'A' ? 'TUTTI' : 'A')}
          title={activeRole === 'A' ? 'Clicca per deselezionare' : 'Filtra Attaccanti'}
          className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer shrink-0 border ${
            activeRole === 'A'
              ? 'bg-red-600 text-white border-red-700 shadow-sm ring-2 ring-red-400 scale-105'
              : 'bg-red-100/80 hover:bg-red-600 hover:text-white text-red-900 border-red-300'
          }`}
        >
          A ({countA})
        </button>

        {onOpenExcelModal && (
          <div className="flex items-center space-x-1 ml-1 shrink-0">
            <button
              onClick={onOpenExcelModal}
              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs border border-emerald-800"
              title="Gestione File Excel e Listone Serie A da fantacalcio.it"
            >
              <span>📊 Excel Lega</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
