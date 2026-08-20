import React from 'react';
import { Player, Role } from '../types/fantacalcio';
import { BarChart2, Info, Calendar } from 'lucide-react';

interface RoleHeroBannerProps {
  activeRole: Role | 'TUTTI';
  onSelectRole: (role: Role) => void;
  players?: Player[];
  onOpenExcelModal?: () => void;
}

export const RoleHeroBanner: React.FC<RoleHeroBannerProps> = ({ activeRole, onSelectRole, players = [], onOpenExcelModal }) => {
  const rolePlayers = activeRole === 'TUTTI' ? players : players.filter((p) => p.ruolo === activeRole);
  const countP = players.filter((p) => p.ruolo === 'P').length;
  const countD = players.filter((p) => p.ruolo === 'D').length;
  const countC = players.filter((p) => p.ruolo === 'C').length;
  const countA = players.filter((p) => p.ruolo === 'A').length;

  if (activeRole === 'TUTTI') {
    return (
      <div className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="inline-flex items-center text-slate-900 font-bold text-[11px]">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" />
              {players.length} Giocatori nel Listone Ufficiale
            </span>
            <span className="text-[10.5px] text-slate-500 font-mono hidden sm:inline">
              (P: {countP} • D: {countD} • C: {countC} • A: {countA})
            </span>
          </div>

          {/* Discreet market date & final file notice in small text */}
          <div className="flex items-center space-x-1 text-[9.5px] text-slate-500 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded">
            <Calendar className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            <span>
              Ultimo aggiornamento listone: <strong className="text-slate-700 font-semibold">20 Agosto 2026</strong>
            </span>
            <span className="text-slate-400 hidden md:inline">•</span>
            <span className="text-amber-700 font-medium hidden md:inline">
              Calciomercato aperto (listone definitivo scaricabile dal 2 Settembre)
            </span>
          </div>
        </div>

        {/* Quick role jump buttons - Fantacalcio.it colors */}
        <div className="flex items-center space-x-1 font-mono text-[10px] overflow-x-auto smooth-horizontal-scroll py-0.5 max-w-full">
          <button
            onClick={() => onSelectRole('P')}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            P ({countP})
          </button>
          <button
            onClick={() => onSelectRole('D')}
            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            D ({countD})
          </button>
          <button
            onClick={() => onSelectRole('C')}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            C ({countC})
          </button>
          <button
            onClick={() => onSelectRole('A')}
            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            A ({countA})
          </button>
          {onOpenExcelModal && (
            <div className="flex items-center space-x-1.5 ml-1 shrink-0">
              <button
                onClick={onOpenExcelModal}
                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                title="Gestione File Excel e Listone Serie A da fantacalcio.it"
              >
                <span>📊 Carica Lega Serie A</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const total = rolePlayers.length;
  const avgFM = total > 0 ? (rolePlayers.reduce((acc, p) => acc + (p.fantaMedia || 0), 0) / total).toFixed(2) : '0.00';
  const totalGoals = rolePlayers.reduce((acc, p) => acc + (p.golFatti || 0), 0);
  const totalAssists = rolePlayers.reduce((acc, p) => acc + (p.assist || 0), 0);
  const totalCleanSheet = rolePlayers.reduce((acc, p) => acc + (p.cleanSheet || 0), 0);

  const roleMeta = {
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
  }[activeRole];

  return (
    <div className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1 text-xs">
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-0.2 rounded text-[11px] font-black uppercase border ${roleMeta.badge}`}>
          {roleMeta.name} ({total})
        </span>
        <span className="text-[11px] text-slate-700 font-mono font-bold">
          {roleMeta.stats}
        </span>
      </div>

      <div className="flex items-center space-x-2 text-[9.5px] text-slate-500 font-mono">
        <span className="flex items-center space-x-1">
          <Calendar className="w-2.5 h-2.5 text-slate-400" />
          <span>Listone: 20/08/2026 • Mercato aperto (Definitivo dal 2 Settembre)</span>
        </span>
      </div>
    </div>
  );
};
