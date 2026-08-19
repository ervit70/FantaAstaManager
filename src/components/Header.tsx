import React from 'react';
import { Role } from '../types/fantacalcio';
import { Users, DollarSign, Compass, FileSpreadsheet, Trophy, Settings } from 'lucide-react';

interface HeaderProps {
  activeRole: Role | 'TUTTI' | 'PLANNER';
  onSelectRole: (role: Role | 'TUTTI' | 'PLANNER') => void;
  targetCount: number;
  budgetBase: 500 | 1000;
  onToggleBudget: (base: 500 | 1000) => void;
  onOpenCompare: () => void;
  compareCount: number;
  onOpenLegend: () => void;
  onOpenExcelModal: () => void;
  isCustomDataActive: boolean;
  totalPlayersCount: number;
  onOpenRegistryModal: () => void;
  onOpenSquadsModal: () => void;
  assignedPlayersCount: number;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onSelectRole,
  targetCount,
  budgetBase,
  onToggleBudget,
  onOpenCompare,
  compareCount,
  onOpenLegend,
  onOpenExcelModal,
  isCustomDataActive,
  totalPlayersCount,
  onOpenRegistryModal,
  onOpenSquadsModal,
  assignedPlayersCount,
  isCloudSynced = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b-2 border-blue-500 shadow-md shrink-0">
      <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-11 sm:h-12 gap-2">
          {/* Brand single wordmark - Compact */}
          <div
            className="flex items-center space-x-2 cursor-pointer select-none shrink-0"
            onClick={() => onSelectRole('TUTTI')}
          >
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center font-black text-xs text-white shadow-inner">
              FS
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-white">
                FantaScout <span className="text-blue-400 font-semibold text-xs">26/27</span>
              </span>
              {isCustomDataActive ? (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  ☁️ Cloud Excel ({totalPlayersCount})
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  ☁️ Cloud DB
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links - Roles (Ultra Compact) */}
          <nav className="hidden lg:flex items-center space-x-0.5 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => onSelectRole('P')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'P'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Portieri
            </button>
            <button
              onClick={() => onSelectRole('D')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'D'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Difensori
            </button>
            <button
              onClick={() => onSelectRole('C')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'C'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Centrocampisti
            </button>
            <button
              onClick={() => onSelectRole('A')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'A'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Attaccanti
            </button>
            <button
              onClick={() => onSelectRole('TUTTI')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'TUTTI'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              Tutti ({totalPlayersCount})
            </button>
            <button
              onClick={() => onSelectRole('PLANNER')}
              className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
                activeRole === 'PLANNER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-400 hover:bg-emerald-950/30'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Planner {targetCount > 0 && `(${targetCount})`}</span>
            </button>
          </nav>

          {/* Primary Actions Zone */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            
            {/* TASTO 1: Anagrafica 10 Squadre */}
            <button
              onClick={onOpenRegistryModal}
              title="Anagrafica 10 Squadre Lega (Nomi e Capitani)"
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2 py-1 rounded-md border border-slate-700 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Settings className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">10 Squadre</span>
            </button>

            {/* TASTO 2: Rose 10 Squadre */}
            <button
              onClick={onOpenSquadsModal}
              title="Visualizza le 10 Squadre e i calciatori acquistati"
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <Trophy className="w-3 h-3" />
              <span>Rose 10 Squadre</span>
              {assignedPlayersCount > 0 && (
                <span className="bg-slate-950 text-amber-300 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black">
                  {assignedPlayersCount}
                </span>
              )}
            </button>

            {/* Excel Button - Carica Lega Serie A */}
            <button
              onClick={onOpenExcelModal}
              title="Carica o Esporta il foglio Excel (.xlsx, .csv) della Serie A"
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ring-2 ring-emerald-400/50 ${
                isCustomDataActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>📊 Carica Lega Serie A</span>
            </button>

            {/* Legend button */}
            <button
              onClick={onOpenLegend}
              title="Legenda Sigle e Statistiche (PG, MV, FM, ecc.)"
              className="hidden lg:flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2 py-1 rounded-md border border-slate-700 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Compass className="w-3 h-3 text-blue-400" />
              <span>Sigle</span>
            </button>

            {/* Budget Switcher */}
            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700 text-[10px] shrink-0">
              <button
                onClick={() => onToggleBudget(500)}
                className={`px-1.5 py-0.5 rounded font-bold font-mono transition-all cursor-pointer ${
                  budgetBase === 500
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                500
              </button>
              <button
                onClick={() => onToggleBudget(1000)}
                className={`px-1.5 py-0.5 rounded font-bold font-mono transition-all cursor-pointer ${
                  budgetBase === 1000
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1000
              </button>
            </div>

            {/* Compare Button */}
            {compareCount > 0 && (
              <button
                onClick={onOpenCompare}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-3 h-3" />
                <span>({compareCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-1 border-t border-slate-800 gap-1 scrollbar-none text-[11px]">
          <button
            onClick={() => onSelectRole('P')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 cursor-pointer ${
              activeRole === 'P' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            P
          </button>
          <button
            onClick={() => onSelectRole('D')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 cursor-pointer ${
              activeRole === 'D' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            D
          </button>
          <button
            onClick={() => onSelectRole('C')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 cursor-pointer ${
              activeRole === 'C' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            C
          </button>
          <button
            onClick={() => onSelectRole('A')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 cursor-pointer ${
              activeRole === 'A' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            A
          </button>
          <button
            onClick={() => onSelectRole('TUTTI')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 cursor-pointer ${
              activeRole === 'TUTTI' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Tutti ({totalPlayersCount})
          </button>
          <button
            onClick={() => onSelectRole('PLANNER')}
            className={`px-2 py-0.5 rounded font-bold uppercase shrink-0 flex items-center space-x-1 cursor-pointer ${
              activeRole === 'PLANNER' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            <span>Planner {targetCount > 0 && `(${targetCount})`}</span>
          </button>
          <button
            onClick={onOpenExcelModal}
            className="md:hidden px-2 py-0.5 rounded font-bold uppercase shrink-0 text-emerald-300 flex items-center space-x-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Lega Serie A</span>
          </button>
        </div>
      </div>
    </header>
  );
};
