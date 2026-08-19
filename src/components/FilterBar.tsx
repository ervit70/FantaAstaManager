import React, { useState } from 'react';
import { FilterState, Tier, SortColumn, LeagueTeam } from '../types/fantacalcio';
import { Search, LayoutGrid, List, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (newFilter: Partial<FilterState>) => void;
  onResetFilter: () => void;
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  totalFilteredCount: number;
  availableTeams?: string[];
  leagueTeams?: LeagueTeam[];
}

const DEFAULT_SERIE_A_TEAMS = [
  'Tutte',
  'Atalanta',
  'Bologna',
  'Cagliari',
  'Como',
  'Fiorentina',
  'Genoa',
  'Inter',
  'Juventus',
  'Lazio',
  'Lecce',
  'Milan',
  'Monza',
  'Napoli',
  'Parma',
  'Roma',
  'Sassuolo',
  'Torino',
  'Udinese',
  'Venezia',
  'Verona',
];

const TIERS: (Tier | 'Tutti')[] = [
  'Tutti',
  'Tier 1 - Top',
  'Tier 2 - Semitop',
  'Tier 3 - Titolari Affidabili',
  'Tier 4 - Scommesse/Low-Cost',
  'Tier 5 - Jolly/Slot Finali',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  onResetFilter,
  viewMode,
  onToggleViewMode,
  totalFilteredCount,
  availableTeams,
  leagueTeams = [],
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const teamsList = React.useMemo(() => {
    if (!availableTeams || availableTeams.length === 0) return DEFAULT_SERIE_A_TEAMS;
    const clean = Array.from(new Set(availableTeams)).filter(Boolean).sort();
    return ['Tutte', ...clean.filter((t) => t !== 'Tutte')];
  }, [availableTeams]);

  const toggleSortOrder = () => {
    onChangeFilter({ sortOrder: filter.sortOrder === 'desc' ? 'asc' : 'desc' });
  };

  const hasActiveFilters =
    Boolean(filter.searchQuery) ||
    filter.squadra !== 'Tutte' ||
    filter.soloNuoviEstero ||
    filter.soloRigoristi ||
    filter.soloPiazzati ||
    (filter.assegnazioneLega && filter.assegnazioneLega !== 'Tutti') ||
    filter.tier !== 'Tutti' ||
    filter.sortBy !== 'rendimentoIndex' ||
    filter.sortOrder !== 'desc';

  return (
    <div className="bg-white border border-slate-200 rounded-md p-1 sm:p-1.5 shadow-2xs shrink-0">
      {/* Primary Clean Row */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[130px] sm:min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca calciatore..."
            value={filter.searchQuery}
            onChange={(e) => onChangeFilter({ searchQuery: e.target.value })}
            className="w-full pl-6 pr-2 py-0.5 sm:py-1 bg-slate-50 border border-slate-200 rounded text-[10.5px] sm:text-[11px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-medium transition-all"
          />
        </div>

        {/* Squadra Serie A dropdown */}
        <div className="w-24 sm:w-36">
          <select
            value={filter.squadra || 'Tutte'}
            onChange={(e) => {
              const newTeam = e.target.value;
              if (newTeam !== 'Tutte' && filter.ruolo !== 'TUTTI') {
                onChangeFilter({ squadra: newTeam, ruolo: 'TUTTI' });
              } else {
                onChangeFilter({ squadra: newTeam });
              }
            }}
            className={`w-full py-0.5 sm:py-1 px-1 sm:px-1.5 rounded text-[10px] sm:text-[11px] font-bold truncate cursor-pointer border transition-colors ${
              filter.squadra && filter.squadra !== 'Tutte'
                ? 'bg-blue-50 border-blue-400 text-blue-950 font-black'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {teamsList.map((team) => (
              <option key={team} value={team}>
                {team === 'Tutte' ? 'Tutte Serie A' : `Rosa ${team}`}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop inline selectors (hidden on mobile, shown in advanced) */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Assegnazione Lega */}
          <div className="w-36">
            <select
              value={filter.assegnazioneLega || 'Tutti'}
              onChange={(e) => onChangeFilter({ assegnazioneLega: e.target.value })}
              className={`w-full py-1 px-1.5 rounded text-[11px] font-bold truncate cursor-pointer border ${
                filter.assegnazioneLega && filter.assegnazioneLega !== 'Tutti'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Tutti">🏆 Tutti i Giocatori</option>
              <option value="Liberi">🟢 Solo Liberi</option>
              <option value="Assegnati">🔴 Solo Assegnati</option>
              <optgroup label="Filtra per Squadra Lega:">
                {[...leagueTeams]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Tier */}
          <div className="w-24">
            <select
              value={filter.tier || 'Tutti'}
              onChange={(e) => onChangeFilter({ tier: e.target.value as any })}
              className="w-full py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 font-medium truncate cursor-pointer"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === 'Tutti' ? 'Tutti i Tier' : t.replace('Tier ', 'T')}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 max-w-[130px]">
              <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0 mr-1" />
              <select
                value={filter.sortBy}
                onChange={(e) => onChangeFilter({ sortBy: e.target.value as SortColumn })}
                className="bg-transparent text-[11px] text-slate-800 focus:outline-none font-medium truncate w-full cursor-pointer"
              >
                <option value="rendimentoIndex">Rendimento</option>
                <option value="fantaMedia">FM</option>
                <option value="mediaVoto">MV</option>
                <option value="presenze">Partite</option>
                <option value="golFatti">Gol</option>
                <option value="assist">Assist</option>
                <option value="prezzoConsigliato">Target Asta</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>

            <button
              onClick={toggleSortOrder}
              className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
            >
              {filter.sortOrder === 'desc' ? (
                <ArrowDown className="w-3 h-3 text-blue-600" />
              ) : (
                <ArrowUp className="w-3 h-3 text-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Toggle Advanced Filters Button (Mobile & Desktop) */}
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`flex items-center space-x-0.5 px-1.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-bold border transition-colors cursor-pointer ${
            isAdvancedOpen || hasActiveFilters
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="Mostra altri filtri (Tier, Rigori, Piazzati, Stato Lega)"
        >
          <SlidersHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">Filtri</span>
          {isAdvancedOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilter}
            title="Azzera filtri"
            className="p-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        )}

        {/* Counter and View Switcher */}
        <div className="flex items-center space-x-1 ml-auto shrink-0">
          <span className="text-[10px] text-slate-500 font-mono font-bold whitespace-nowrap">
            <span className="text-blue-700 font-black">{totalFilteredCount}</span>
          </span>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5">
            <button
              onClick={() => onToggleViewMode('grid')}
              title="Vista Griglia Schede (Ottima su Smartphone)"
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              onClick={() => onToggleViewMode('table')}
              title="Vista Tabella"
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Expandable Panel */}
      {isAdvancedOpen && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs animate-fadeIn">
          {/* On Mobile: Assegnazione Lega & Tier */}
          <div className="flex md:hidden items-center gap-1 w-full flex-wrap">
            <select
              value={filter.assegnazioneLega || 'Tutti'}
              onChange={(e) => onChangeFilter({ assegnazioneLega: e.target.value })}
              className="flex-1 py-1 px-1.5 rounded text-[10.5px] font-bold bg-slate-50 border border-slate-200 text-slate-800"
            >
              <option value="Tutti">🏆 Tutti</option>
              <option value="Liberi">🟢 Solo Liberi</option>
              <option value="Assegnati">🔴 Solo Assegnati</option>
              <optgroup label="Squadra:">
                {leagueTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </optgroup>
            </select>

            <select
              value={filter.tier || 'Tutti'}
              onChange={(e) => onChangeFilter({ tier: e.target.value as any })}
              className="w-24 py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-[10.5px] text-slate-800"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === 'Tutti' ? 'Tutti i Tier' : t.replace('Tier ', 'T')}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Badges: Estero, Rigoristi, Piazzati */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => onChangeFilter({ soloNuoviEstero: !filter.soloNuoviEstero })}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filter.soloNuoviEstero
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              ⭐ Estero
            </button>

            <button
              onClick={() => onChangeFilter({ soloRigoristi: !filter.soloRigoristi })}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filter.soloRigoristi
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              🎯 Rigoristi
            </button>

            <button
              onClick={() => onChangeFilter({ soloPiazzati: !filter.soloPiazzati })}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filter.soloPiazzati
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              📐 Piazzati
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
