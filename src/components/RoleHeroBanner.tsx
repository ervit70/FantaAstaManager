import React from 'react';
import { Player, Role } from '../types/fantacalcio';
import { BarChart2 } from 'lucide-react';

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
      <div className="bg-white border border-slate-200 rounded-md px-2.5 py-1 mb-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1 text-xs">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center text-blue-900 font-bold text-[11px]">
            <BarChart2 className="w-3 h-3 text-blue-600 mr-1 shrink-0" />
            {players.length} Giocatori nel Listone
          </span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            (P: {countP} • D: {countD} • C: {countC} • A: {countA})
          </span>
        </div>

        {/* Quick role jump buttons */}
        <div className="flex items-center space-x-1 font-mono text-[10px] overflow-x-auto smooth-horizontal-scroll py-0.5 max-w-full">
          <button
            onClick={() => onSelectRole('P')}
            className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-bold transition-colors cursor-pointer shrink-0"
          >
            P ({countP})
          </button>
          <button
            onClick={() => onSelectRole('D')}
            className="px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded font-bold transition-colors cursor-pointer shrink-0"
          >
            D ({countD})
          </button>
          <button
            onClick={() => onSelectRole('C')}
            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded font-bold transition-colors cursor-pointer shrink-0"
          >
            C ({countC})
          </button>
          <button
            onClick={() => onSelectRole('A')}
            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded font-bold transition-colors cursor-pointer shrink-0"
          >
            A ({countA})
          </button>
          {onOpenExcelModal && (
            <div className="flex items-center space-x-1.5 ml-1 shrink-0">
              <button
                onClick={onOpenExcelModal}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                title="Gestione File Excel e Listone Serie A"
              >
                <span>📊 Carica Lega Serie A</span>
              </button>
              {players.length > 0 && (
                <button
                  onClick={onOpenExcelModal}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                  title="Apri finestra di arricchimento statistiche storiche e consigli d'asta"
                >
                  <span>🧠 Arricchisci Statistiche</span>
                </button>
              )}
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
      badge: 'bg-amber-100 border-amber-200 text-amber-900',
      stats: `${total} Portieri • FM media ${avgFM} • ${totalCleanSheet} Clean Sheet`,
    },
    D: {
      name: 'Difensori',
      badge: 'bg-sky-100 border-sky-200 text-sky-900',
      stats: `${total} Difensori • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
    C: {
      name: 'Centrocampisti',
      badge: 'bg-emerald-100 border-emerald-200 text-emerald-900',
      stats: `${total} Centrocampisti • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
    A: {
      name: 'Attaccanti',
      badge: 'bg-rose-100 border-rose-200 text-rose-900',
      stats: `${total} Attaccanti • ${totalGoals} Gol • ${totalAssists} Assist • FM media ${avgFM}`,
    },
  }[activeRole];

  return (
    <div className="bg-white border border-slate-200 rounded-md px-2.5 py-1 mb-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1 text-xs">
      <div className="flex items-center space-x-2">
        <span className={`px-1.5 py-0.2 rounded text-[11px] font-black uppercase border ${roleMeta.badge}`}>
          {roleMeta.name} ({total})
        </span>
        <span className="text-[11px] text-slate-600 font-mono font-medium">
          {roleMeta.stats}
        </span>
      </div>

      <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 font-mono">
        <span>Stagione 2025/2026</span>
      </div>
    </div>
  );
};
