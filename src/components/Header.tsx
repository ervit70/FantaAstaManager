import React, { useState } from 'react';
import { Role } from '../types/fantacalcio';
import { Users, DollarSign, Compass, FileSpreadsheet, Trophy, Settings, Menu, X, BookOpen, ShoppingBag, ShieldCheck } from 'lucide-react';
import { LicenseStatus } from '../services/licenseService';

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
  teamsCount?: number;
  isCloudSynced?: boolean;
  onOpenManual: () => void;
  onOpenLicenseModal: () => void;
  currentLicense: LicenseStatus | null;
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
  teamsCount = 10,
  onOpenManual,
  onOpenLicenseModal,
  currentLicense,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0b172a] text-white border-b-2 border-blue-600 shadow-md shrink-0">
      <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-3">
        <div className="flex items-center justify-between h-10 sm:h-11 gap-1 sm:gap-2">
          {/* Left: Brand Wordmark */}
          <div
            className="flex items-center space-x-1.5 cursor-pointer select-none shrink-0"
            onClick={() => onSelectRole('TUTTI')}
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-md flex items-center justify-center font-black text-xs text-white shadow-sm ring-1 ring-blue-400 shrink-0">
              FC
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-black tracking-tight text-xs sm:text-base text-white uppercase font-sans whitespace-nowrap">
                Fanta<span className="text-blue-400">Scout</span> <span className="text-slate-400 font-semibold text-[10px] sm:text-xs">26/27</span>
              </span>
              {isCustomDataActive ? (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono whitespace-nowrap">
                  ☁️ Excel ({totalPlayersCount})
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono whitespace-nowrap">
                  ☁️ DB
                </span>
              )}
            </div>
          </div>

          {/* Center: Roles Navigation (Visible on xl+ screens where there is plenty of room) */}
          <nav className="hidden 2xl:flex items-center space-x-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => onSelectRole('P')}
              title="Filtra Portieri (P)"
              className={`px-2 py-0.5 rounded text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeRole === 'P'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                  : 'text-amber-300/90 hover:text-amber-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded bg-amber-600/70 text-[9px] flex items-center justify-center font-black text-white">P</span>
              <span>Portieri</span>
            </button>

            <button
              onClick={() => onSelectRole('D')}
              title="Filtra Difensori (D)"
              className={`px-2 py-0.5 rounded text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeRole === 'D'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-emerald-300/90 hover:text-emerald-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded bg-emerald-700/80 text-[9px] flex items-center justify-center font-black text-white">D</span>
              <span>Difensori</span>
            </button>

            <button
              onClick={() => onSelectRole('C')}
              title="Filtra Centrocampisti (C)"
              className={`px-2 py-0.5 rounded text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeRole === 'C'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'text-blue-300/90 hover:text-blue-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded bg-blue-700/80 text-[9px] flex items-center justify-center font-black text-white">C</span>
              <span>Centrocampisti</span>
            </button>

            <button
              onClick={() => onSelectRole('A')}
              title="Filtra Attaccanti (A)"
              className={`px-2 py-0.5 rounded text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeRole === 'A'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
                  : 'text-red-300/90 hover:text-red-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded bg-red-700/80 text-[9px] flex items-center justify-center font-black text-white">A</span>
              <span>Attaccanti</span>
            </button>

            <button
              onClick={() => onSelectRole('TUTTI')}
              title={`Mostra tutti i calciatori (${totalPlayersCount})`}
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeRole === 'TUTTI'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Tutti ({totalPlayersCount})</span>
            </button>

            <button
              onClick={() => onSelectRole('PLANNER')}
              title="Apri Planner & Strategia Asta"
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
                activeRole === 'PLANNER'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Planner</span>
              {targetCount > 0 && <span className="text-[10px] font-mono font-black bg-emerald-900 px-1 rounded-full">({targetCount})</span>}
            </button>
          </nav>

          {/* Right: Primary Actions Zone (Guaranteed to always fit and never clip) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Licenza / Acquisto Button */}
            <button
              onClick={onOpenLicenseModal}
              title={
                currentLicense && currentLicense.isLicensed && !currentLicense.isExpired
                  ? `Licenza Attiva fino al 1° Agosto 2027 (${currentLicense.daysRemaining} giorni)`
                  : 'Acquista Licenza Stagionale 2026/27 a 8,99€ (Valida fino al 1° Agosto 2027)'
              }
              className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-black transition-all shadow-xs cursor-pointer shrink-0 ${
                currentLicense && currentLicense.isLicensed && !currentLicense.isExpired
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-400/60'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-1 ring-amber-300 font-extrabold animate-pulse'
              }`}
            >
              {currentLicense && currentLicense.isLicensed && !currentLicense.isExpired ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="hidden lg:inline">PRO 26/27</span>
                  <span className="lg:hidden">PRO</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span className="hidden lg:inline">Licenza 8,99€</span>
                  <span className="lg:hidden">8,99€</span>
                </>
              )}
            </button>

            {/* Manuale & Guida Button */}
            <button
              onClick={onOpenManual}
              title="Apri il Manuale Illustrato e la Guida Completa all'Asta"
              className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs border border-blue-400 cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Manuale</span>
            </button>

            {/* Excel Button - Carica Lega Serie A */}
            <button
              onClick={onOpenExcelModal}
              title="Carica o Esporta il foglio Excel (.xlsx, .csv) della Serie A da fantacalcio.it"
              className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer ring-1 ring-emerald-400/60 shrink-0 ${
                isCustomDataActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">Excel</span>
              <span className="sm:hidden">XLS</span>
            </button>

            {/* Rose Squadre button */}
            <button
              onClick={onOpenSquadsModal}
              title={`Visualizza le ${teamsCount} Squadre e i calciatori acquistati`}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-black transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Trophy className="w-3 h-3 text-slate-950 shrink-0" />
              <span className="hidden sm:inline">Squadre</span>
              <span className="bg-slate-950 text-amber-300 text-[9px] px-1 py-0.2 rounded-full font-mono font-black shrink-0">
                {assignedPlayersCount > 0 ? assignedPlayersCount : teamsCount}
              </span>
            </button>

            {/* Budget Switcher */}
            <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-700 text-[9.5px] shrink-0">
              <button
                onClick={() => onToggleBudget(500)}
                title="Budget standard 500 crediti"
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
                title="Budget standard 1000 crediti"
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
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Users className="w-3 h-3" />
                <span>({compareCount})</span>
              </button>
            )}

            {/* Mobile Menu Dropdown Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="2xl:hidden p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Menu rapido"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0b172a] border-t border-slate-800 px-3 py-2 space-y-2 text-xs animate-fadeIn">
          {/* Roles Selector with Fantacalcio.it colors */}
          <div className="grid grid-cols-5 gap-1 font-black text-center">
            <button
              onClick={() => {
                onSelectRole('P');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1 rounded font-black ${activeRole === 'P' ? 'bg-amber-500 text-slate-950' : 'bg-amber-950/40 text-amber-300 border border-amber-800'}`}
            >
              P
            </button>
            <button
              onClick={() => {
                onSelectRole('D');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1 rounded font-black ${activeRole === 'D' ? 'bg-emerald-600 text-white' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'}`}
            >
              D
            </button>
            <button
              onClick={() => {
                onSelectRole('C');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1 rounded font-black ${activeRole === 'C' ? 'bg-blue-600 text-white' : 'bg-blue-950/40 text-blue-300 border border-blue-800'}`}
            >
              C
            </button>
            <button
              onClick={() => {
                onSelectRole('A');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1 rounded font-black ${activeRole === 'A' ? 'bg-red-600 text-white' : 'bg-red-950/40 text-red-300 border border-red-800'}`}
            >
              A
            </button>
            <button
              onClick={() => {
                onSelectRole('TUTTI');
                setIsMobileMenuOpen(false);
              }}
              className={`py-1 rounded font-bold ${activeRole === 'TUTTI' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}
            >
              Tutti
            </button>
          </div>

          {/* Quick Action Tools */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                onOpenLicenseModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-amber-500 text-slate-950 rounded font-black border border-amber-400"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{currentLicense?.isLicensed ? 'Licenza Attiva' : 'Acquista Licenza 8,99€'}</span>
            </button>

            <button
              onClick={() => {
                onOpenManual();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-blue-600 text-white rounded font-black border border-blue-400"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>📖 Manuale & Guida</span>
            </button>

            <button
              onClick={() => {
                onOpenSquadsModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rose Squadre ({assignedPlayersCount})</span>
            </button>

            <button
              onClick={() => {
                onOpenRegistryModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Squadre & Budget ({teamsCount})</span>
            </button>

            <button
              onClick={() => {
                onSelectRole('PLANNER');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-emerald-950/50 text-emerald-300 border border-emerald-700/50 rounded font-bold"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Planner {targetCount > 0 && `(${targetCount})`}</span>
            </button>

            <button
              onClick={() => {
                onOpenLegend();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold col-span-2"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Legenda Sigle & Statistiche</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
