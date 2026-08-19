import React from 'react';
import { FilterState, Tier, SortColumn, LeagueTeam } from '../types/fantacalcio';
import { Search, LayoutGrid, List, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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
  const teamsList = React.useMemo(() => {
    if (!availableTeams || availableTeams.length === 0) return DEFAULT_SERIE_A_TEAMS;
    const clean = Array.from(new Set(availableTeams)).filter(Boolean).sort();
    return ['Tutte', ...clean.filter((t) => t !== 'Tutte')];
  }, [availableTeams]);

  const toggleSortOrder = () => {
    onChangeFilter({ sortOrder: filter.sortOrder === 'desc' ? 'asc' : 'desc' });
  };

  const hasActiveFilters =
    filter.searchQuery ||
    filter.squadra !== 'Tutte' ||
    filter.soloNuoviEstero ||
    filter.soloRigoristi ||
    filter.soloPiazzati ||
    (filter.assegnazioneLega && filter.assegnazioneLega !== 'Tutti') ||
    filter.tier !== 'Tutti' ||
    filter.sortBy !== 'rendimentoIndex' ||
    filter.sortOrder !== 'desc';

  return (
    <div className="bg-white border border-slate-200 rounded-md p-1.5 mb-1.5 shadow-2xs">
      {/* Compact Main Toolbar Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Search input - Ultra Compact */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca calciatore o squadra..."
            value={filter.searchQuery}
            onChange={(e) => onChangeFilter({ searchQuery: e.target.value })}
            className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-medium transition-all"
          />
        </div>

        {/* Squadra Serie A dropdown */}
        <div className="w-28 sm:w-36">
          <select
            value={filter.squadra || 'Tutte'}
            onChange={(e) => {
              const newTeam = e.target.value;
              // If selecting a specific Serie A team, automatically reset role to TUTTI so all players of that team are visible
              if (newTeam !== 'Tutte' && filter.ruolo !== 'TUTTI') {
                onChangeFilter({ squadra: newTeam, ruolo: 'TUTTI' });
              } else {
                onChangeFilter({ squadra: newTeam });
              }
            }}
            className={`w-full py-1 px-1.5 rounded text-[11px] font-bold truncate cursor-pointer border transition-colors ${
              filter.squadra && filter.squadra !== 'Tutte'
                ? 'bg-blue-50 border-blue-400 text-blue-950 font-black ring-1 ring-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
            }`}
          >
            {teamsList.map((team) => (
              <option key={team} value={team}>
                {team === 'Tutte' ? 'Tutte Squadre Serie A' : `Rosa ${team}`}
              </option>
            ))}
          </select>
        </div>

        {/* Assegnazione Lega Fantacalcio dropdown */}
        <div className="w-32 sm:w-40">
          <select
            value={filter.assegnazioneLega || 'Tutti'}
            onChange={(e) => onChangeFilter({ assegnazioneLega: e.target.value })}
            className={`w-full py-1 px-1.5 rounded text-[11px] font-bold truncate cursor-pointer border ${
              filter.assegnazioneLega && filter.assegnazioneLega !== 'Tutti'
                ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-200'
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

        {/* Tier dropdown */}
        <div className="w-24 sm:w-28">
          <select
            value={filter.tier || 'Tutti'}
            onChange={(e) => onChangeFilter({ tier: e.target.value as any })}
            className="w-full py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 font-medium truncate cursor-pointer"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === 'Tutti' ? 'Tutti i Tier' : t.replace('Tier ', 'T')}
              </option>
            ))}
          </select>
        </div>

        {/* Sort selector + Direction Toggle */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 max-w-[140px]">
            <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 shrink-0 mr-1" />
            <select
              value={filter.sortBy}
              onChange={(e) => onChangeFilter({ sortBy: e.target.value as SortColumn })}
              className="bg-transparent text-[11px] text-slate-800 focus:outline-none font-medium truncate w-full cursor-pointer"
            >
              <option value="rendimentoIndex">Rendimento</option>
              <option value="fantaMedia">FantaMedia (FM)</option>
              <option value="mediaVoto">Media Voto (MV)</option>
              <option value="presenze">Partite (PG)</option>
              <option value="golFatti">Gol / CS</option>
              <option value="assist">Assist / RP</option>
              <option value="rigoriSegnati">Rigori</option>
              <option value="cartellini">Cartellini</option>
              <option value="prezzoConsigliato">Target Asta</option>
              <option value="squadraLega">Squadra Lega</option>
              <option value="nome">Nome A-Z</option>
              <option value="squadra">Squadra A</option>
              <option value="ruolo">Ruolo</option>
            </select>
          </div>

          <button
            onClick={toggleSortOrder}
            title={filter.sortOrder === 'desc' ? 'Ordine Decrescente' : 'Ordine Crescente'}
            className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 hover:text-blue-600 transition-colors shrink-0 font-bold cursor-pointer"
          >
            {filter.sortOrder === 'desc' ? (
              <ArrowDown className="w-3 h-3 text-blue-600" />
            ) : (
              <ArrowUp className="w-3 h-3 text-blue-600" />
            )}
          </button>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center space-x-1 ml-auto">
          <button
            onClick={() => onChangeFilter({ soloNuoviEstero: !filter.soloNuoviEstero })}
            title="Mostra solo i nuovi colpi arrivati dall'estero"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center space-x-0.5 cursor-pointer ${
              filter.soloNuoviEstero
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>⭐ Estero</span>
          </button>

          <button
            onClick={() => onChangeFilter({ soloRigoristi: !filter.soloRigoristi })}
            title="Mostra solo rigoristi"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center space-x-0.5 cursor-pointer ${
              filter.soloRigoristi
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🎯 Rigoristi</span>
          </button>

          <button
            onClick={() => onChangeFilter({ soloPiazzati: !filter.soloPiazzati })}
            title="Mostra tiratori punizioni e corner"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center space-x-0.5 cursor-pointer ${
              filter.soloPiazzati
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>📐 Piazzati</span>
          </button>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilter}
              title="Azzera filtri"
              className="p-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Counter and View Switcher */}
          <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
            <span className="text-[10px] text-slate-500 font-mono font-bold whitespace-nowrap">
              <span className="text-blue-700 font-black">{totalFilteredCount}</span>
            </span>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5">
              <button
                onClick={() => onToggleViewMode('grid')}
                title="Vista Griglia"
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
                title="Vista Tabella Dati Compatta"
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
      </div>
    </div>
  );
};
