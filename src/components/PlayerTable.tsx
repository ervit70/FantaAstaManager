import React, { useState, useMemo, useEffect } from 'react';
import { Player, SortColumn, LeagueTeam } from '../types/fantacalcio';
import { Eye, Plus, Check, Users, ArrowUp, ArrowDown, ArrowUpDown, Maximize2, Minimize2, Coins, SlidersHorizontal, Sparkles, Zap, Table as TableIcon } from 'lucide-react';

interface PlayerTableProps {
  players: Player[];
  budgetBase: 500 | 1000;
  onSelectPlayer: (player: Player) => void;
  targetPlayerIds: Set<string>;
  onToggleTarget: (player: Player) => void;
  comparedPlayerIds: Set<string>;
  onToggleCompare: (player: Player) => void;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: SortColumn) => void;
  onOpenLegend?: () => void;
  teams: LeagueTeam[];
  playerAssignments: Record<string, string>;
  playerPrices: Record<string, number>;
  onAssignPlayer: (playerId: string, teamId: string) => void;
  onUpdatePlayerPrice: (playerId: string, price: number) => void;
}

const getTeamBadgeColor = (squadra: string) => {
  const s = squadra.toLowerCase();
  if (s.includes('inter') || s.includes('como') || s.includes('atalanta')) return 'bg-blue-50 text-blue-800 border-blue-200';
  if (s.includes('milan') || s.includes('roma') || s.includes('bologna') || s.includes('torino') || s.includes('genoa')) return 'bg-red-50 text-red-800 border-red-200';
  if (s.includes('juve') || s.includes('udinese')) return 'bg-slate-100 text-slate-800 border-slate-300';
  if (s.includes('fiorentina')) return 'bg-purple-50 text-purple-800 border-purple-200';
  if (s.includes('lazio') || s.includes('napoli')) return 'bg-sky-50 text-sky-800 border-sky-200';
  if (s.includes('verona') || s.includes('parma') || s.includes('lecce')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (s.includes('sassuolo') || s.includes('venezia')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  return 'bg-slate-50 text-slate-800 border-slate-200';
};

/**
 * Super compact & responsive inline price input with instant save (editable only when assigned)
 */
const TablePlayerPriceCell: React.FC<{
  playerId: string;
  currentPrice?: number;
  onSavePrice: (playerId: string, price: number) => void;
  isAssigned: boolean;
}> = ({ playerId, currentPrice, onSavePrice, isAssigned }) => {
  const [val, setVal] = useState<string>(currentPrice !== undefined && isAssigned ? String(currentPrice) : '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setVal(currentPrice !== undefined && isAssigned ? String(currentPrice) : '');
  }, [currentPrice, isAssigned]);

  const handleSave = () => {
    if (!isAssigned) return;
    const num = val.trim() === '' ? 0 : parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      onSavePrice(playerId, num);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleQuickSet = (quickVal: number) => {
    if (!isAssigned) return;
    setVal(String(quickVal));
    onSavePrice(playerId, quickVal);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1200);
  };

  if (!isAssigned) {
    return (
      <div 
        className="flex items-center space-x-1 justify-start opacity-45 cursor-not-allowed select-none"
        title="⚠️ Seleziona prima la Squadra nel menu a sinistra per poter inserire la cifra d'asta"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            disabled
            value="—"
            readOnly
            className="w-12 sm:w-13 px-1 py-0.5 text-center rounded text-[11px] font-mono font-bold border border-slate-200 bg-slate-100/80 text-slate-400 h-6 cursor-not-allowed"
          />
          <span className="text-[8.5px] font-bold text-slate-400 ml-0.5">FM</span>
        </div>
        <span className="text-[9px] text-slate-400 italic">Libero</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 justify-start animate-in fade-in duration-150">
      <div className="relative flex items-center">
        <input
          type="number"
          min="0"
          max="9999"
          value={val}
          placeholder="0"
          autoFocus={!val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-12 sm:w-13 px-1 py-0.5 text-center rounded text-[11px] font-mono font-black border transition-all h-6 leading-tight focus:outline-hidden bg-amber-50 border-amber-400 text-slate-950 focus:bg-white focus:ring-2 focus:ring-amber-500 shadow-2xs"
          title="Inserisci la cifra pagata all'asta (premi Invio o Salva per scalare dal budget)"
        />
        <span className="text-[8.5px] font-bold text-amber-700 ml-0.5 select-none">FM</span>
      </div>

      <button
        type="button"
        onClick={handleSave}
        title="Salva cifra d'acquisto e scorpora dal budget squadra"
        className={`px-1.5 py-0.5 rounded text-[9.5px] font-black transition-all cursor-pointer h-6 flex items-center space-x-0.5 shrink-0 active:scale-95 ${
          isSaved
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="w-2.5 h-2.5 text-emerald-200" />
            <span>OK</span>
          </>
        ) : (
          <span>Salva</span>
        )}
      </button>

      {/* 1 FM shortcut */}
      {!val && (
        <button
          type="button"
          onClick={() => handleQuickSet(1)}
          title="Imposta a 1 FM (prezzo base)"
          className="px-1 py-0.5 text-[9px] font-bold text-slate-700 hover:text-slate-950 bg-amber-100/70 hover:bg-amber-200 rounded border border-amber-300 h-6 cursor-pointer transition-colors shrink-0 shadow-2xs"
        >
          1
        </button>
      )}
    </div>
  );
};

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  budgetBase,
  onSelectPlayer,
  targetPlayerIds,
  onToggleTarget,
  comparedPlayerIds,
  onToggleCompare,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenLegend,
  teams,
  playerAssignments,
  playerPrices,
  onAssignPlayer,
  onUpdatePlayerPrice,
}) => {
  const [isFullHeight, setIsFullHeight] = useState(false);
  
  // View mode: 'auction' (super compact for laptops: focus on auction fields) or 'full' (all detailed stats)
  const [viewMode, setViewMode] = useState<'auction' | 'full'>(() => {
    try {
      const saved = localStorage.getItem('fantascout_table_view_mode');
      return saved === 'full' ? 'full' : 'auction';
    } catch {
      return 'auction';
    }
  });

  const handleToggleViewMode = (mode: 'auction' | 'full') => {
    setViewMode(mode);
    try {
      localStorage.setItem('fantascout_table_view_mode', mode);
    } catch {}
  };

  // Teams sorted in alphabetical order by name
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }));
  }, [teams]);

  // Keyboard navigation support: Arrow Up/Down, Page Up/Down, Home/End scroll the table when focused or when keys are pressed
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // If the event originates from an input or select, let native behavior happen
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const container = document.getElementById('player-table-scroll-container');
    if (!container) return;

    const rowHeight = 36;
    const pageScroll = container.clientHeight * 0.8;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        container.scrollBy({ top: rowHeight, behavior: 'smooth' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        container.scrollBy({ top: -rowHeight, behavior: 'smooth' });
        break;
      case 'PageDown':
        e.preventDefault();
        container.scrollBy({ top: pageScroll, behavior: 'smooth' });
        break;
      case 'PageUp':
        e.preventDefault();
        container.scrollBy({ top: -pageScroll, behavior: 'smooth' });
        break;
      case 'Home':
        e.preventDefault();
        container.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'End':
        e.preventDefault();
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        e.preventDefault();
        container.scrollBy({ left: 60, behavior: 'smooth' });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        container.scrollBy({ left: -60, behavior: 'smooth' });
        break;
    }
  };

  // Helper to render sort indicator in sticky headers
  const renderSortHeader = (
    columnKey: SortColumn,
    label: string,
    align: 'left' | 'center' | 'right' = 'center',
    tooltip?: string,
    extraClass = ''
  ) => {
    const isActive = sortBy === columnKey;
    const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

    return (
      <th
        onClick={() => onSortChange(columnKey)}
        title={tooltip || `Ordina per ${label} (${isActive && sortOrder === 'desc' ? 'Crescente' : 'Decrescente'})`}
        className={`sticky top-0 z-20 py-1.5 px-1 cursor-pointer select-none transition-colors border-b border-slate-300 bg-slate-100/95 backdrop-blur-md shadow-2xs group ${extraClass} ${
          isActive ? 'bg-blue-100 text-blue-950 font-black border-b-blue-600' : 'hover:bg-slate-200/80 text-slate-700 font-bold'
        }`}
      >
        <div className={`flex items-center space-x-0.5 ${alignClass}`}>
          <span className="whitespace-nowrap">{label}</span>
          <span className="shrink-0">
            {isActive ? (
              sortOrder === 'desc' ? (
                <ArrowDown className="w-2.5 h-2.5 text-blue-700 font-bold" />
              ) : (
                <ArrowUp className="w-2.5 h-2.5 text-blue-700 font-bold" />
              )
            ) : (
              <ArrowUpDown className="w-2 h-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col flex-1 min-h-0">
      {/* Table Toolbar & Responsive Mode Switcher */}
      <div className="px-2.5 py-1 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-1.5 font-mono shrink-0">
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 border border-slate-300 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('auction')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                viewMode === 'auction'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Visualizzazione Ottimizzata per Laptop: visibilità immediata di Squadra e Prezzo d'Acquisto senza scorrere!"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Vista Asta Laptop</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleViewMode('full')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Visualizzazione Completa con tutte le colonne statistiche (PG, MV, Gol, Assist, Rigori, Cartellini, Rendimento)"
            >
              <TableIcon className="w-3 h-3" />
              <span>Tutte le Statistiche</span>
            </button>
          </div>

          <span className="hidden xl:inline-block text-[10px] text-slate-500">
            • Assegna la squadra e digita la <strong>Cifra Asta (FM)</strong> per aggiornare i crediti in diretta.
          </span>

          {onOpenLegend && (
            <button
              onClick={onOpenLegend}
              className="text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer text-[10px] ml-1"
            >
              Legenda Sigle
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[10px] shrink-0">
          <div className="flex items-center space-x-1 text-slate-500">
            <span>Ordina:</span>
            <strong className="text-slate-800 uppercase font-mono">
              {sortBy} ({sortOrder === 'desc' ? '↓' : '↑'})
            </strong>
          </div>
        </div>
      </div>

      {/* Scrollable Container with Sticky Table Header and Responsive Horizontal and Vertical Scroll */}
      <div 
        id="player-table-scroll-container"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="table-scroll-wrapper relative w-full flex-1 min-h-0 overflow-y-auto overflow-x-auto focus:outline-none"
      >
        <table className="w-full text-left text-[11px] border-collapse leading-none min-w-[700px] sm:min-w-full">
          <thead>
            <tr className="text-slate-700 font-bold uppercase font-mono tracking-tight text-[10px]">
              {/* Role */}
              {renderSortHeader('ruolo', 'R', 'center', 'Ordina per Ruolo (P, D, C, A)', 'w-7 sticky left-0 z-30 bg-slate-100')}
              
              {/* Player Name */}
              {renderSortHeader('nome', 'Calciatore', 'left', 'Ordina per Nome', 'min-w-[120px] max-w-[180px] sticky left-7 z-30 bg-slate-100 sticky-col-shadow')}
              
              {/* Team Serie A */}
              {renderSortHeader('squadra', 'Squadra', 'left', 'Ordina per Squadra Serie A', 'w-14')}
              
              {/* Tier */}
              {renderSortHeader('tier', 'Tier', 'center', 'Ordina per Fascia / Tier', 'w-10')}

              {/* In Full Mode: detailed stats columns */}
              {viewMode === 'full' && (
                <>
                  {renderSortHeader('presenze', 'PG', 'center', 'Ordina per Partite Giocate (Presenze 25/26)', 'w-8')}
                  {renderSortHeader('mediaVoto', 'MV', 'center', 'Ordina per Media Voto Pura', 'w-10')}
                </>
              )}

              {/* FantaMedia 25/26 - Essential */}
              {renderSortHeader('fantaMedia', 'FM 25/26', 'center', 'Ordina per FantaMedia Ufficiale 2025/2026', 'w-14')}

              {/* In Full Mode: detailed offensive/defensive stats */}
              {viewMode === 'full' && (
                <>
                  {renderSortHeader('golFatti', 'GOL/CS', 'center', 'Ordina per Gol Segnati / Clean Sheet', 'w-10')}
                  {renderSortHeader('assist', 'AS/RP', 'center', 'Ordina per Assist / Rigori Parati', 'w-10')}
                  {renderSortHeader('rigoriSegnati', 'RIG', 'center', 'Ordina per Rigori', 'w-10')}
                  {renderSortHeader('cartellini', '🟨/🟥', 'center', 'Ordina per Cartellini', 'w-10')}
                  {renderSortHeader('rendimentoIndex', 'REND', 'center', 'Ordina per Rendimento Index (0-100)', 'w-11')}
                </>
              )}

              {/* Target Price */}
              {renderSortHeader('prezzoConsigliato', `Target (${budgetBase})`, 'right', 'Ordina per Prezzo Asta Consigliato', 'w-16')}

              {/* Actions */}
              <th className="sticky top-0 z-20 py-1.5 px-1 text-center text-slate-800 bg-slate-100/95 backdrop-blur-md border-b border-slate-300 font-bold shadow-2xs w-14">
                Azioni
              </th>

              {/* Dropdown column for Fantacalcio League team - HIGH PRIORITY */}
              {renderSortHeader('squadraLega', '🏆 Squadra Aggiudicataria', 'left', 'Ordina per Squadra Fantacalcio Assegnata', 'min-w-[130px] max-w-[160px]')}

              {/* Column for purchase auction price & save button - HIGH PRIORITY */}
              <th className="sticky top-0 z-20 py-1.5 px-1.5 text-left text-slate-900 bg-amber-100/90 backdrop-blur-md border-b border-amber-300 font-black shadow-2xs min-w-[115px] max-w-[135px]">
                <div className="flex items-center space-x-1 text-slate-950">
                  <Coins className="w-3 h-3 text-amber-600" />
                  <span>Cifra Asta</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {players.map((p, idx) => {
              const isTargeted = targetPlayerIds.has(p.id);
              const isCompared = comparedPlayerIds.has(p.id);
              const assignedTeamId = playerAssignments[p.id] || '';
              const assignedTeam = teams.find((t) => t.id === assignedTeamId);
              const price = budgetBase === 500 ? p.prezzoConsigliato500 : p.prezzoConsigliato1000;
              const paidPrice = playerPrices[p.id];

              const roleBadgeColor = {
                P: 'bg-amber-500 text-slate-950 font-black shadow-2xs',
                D: 'bg-emerald-600 text-white font-black shadow-2xs',
                C: 'bg-blue-600 text-white font-black shadow-2xs',
                A: 'bg-red-600 text-white font-black shadow-2xs',
              }[p.ruolo];

              const rowBg = assignedTeam ? 'bg-amber-50/90' : idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white';

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-blue-50/90 transition-colors text-slate-800 h-7 sm:h-7.5 ${rowBg}`}
                >
                  {/* Role (Sticky left on horizontal scroll - Fantacalcio.it solid square) */}
                  <td className={`py-0.5 px-1 text-center sticky left-0 z-10 ${rowBg}`}>
                    <div className="flex flex-col items-center">
                      <span className={`w-4.5 h-4.5 rounded flex items-center justify-center font-black text-[10px] font-mono ${roleBadgeColor}`}>
                        {p.ruolo}
                      </span>
                      {p.ruoloExtra && (
                        <span className="text-[7.5px] text-slate-500 font-mono font-bold truncate max-w-[36px]" title={`Ruolo Mantra: ${p.ruoloExtra}`}>
                          {p.ruoloExtra}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Player Name and status (Sticky left next to Role) */}
                  <td className={`py-0.5 px-1 font-semibold sticky left-7 z-10 sticky-col-shadow ${rowBg}`}>
                    <div className="flex items-center space-x-1 min-w-0">
                      <span
                        onClick={() => onSelectPlayer(p)}
                        className="text-slate-900 hover:text-blue-600 cursor-pointer font-bold transition-colors truncate max-w-[110px] sm:max-w-[140px] xl:max-w-[180px] text-[11px]"
                        title={p.nome}
                      >
                        {p.nome}
                      </span>
                      {p.status === 'Nuovo dall\'Estero' && (
                        <span className="text-[8px] bg-purple-100 text-purple-800 border border-purple-200 px-0.5 py-0.1 rounded font-bold whitespace-nowrap shrink-0">
                          Est
                        </span>
                      )}
                      {p.rigorista && (
                        <span className="text-[9px] text-amber-700 font-bold shrink-0" title={`Rigorista ${p.rigoristaOrdine || 1}° ordine`}>
                          🎯
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Team Serie A */}
                  <td className="py-0.5 px-1">
                    <span className={`text-[9.5px] px-1 py-0.2 rounded font-bold border whitespace-nowrap truncate max-w-[62px] inline-block ${getTeamBadgeColor(p.squadra)}`}>
                      {p.squadra}
                    </span>
                  </td>

                  {/* Tier */}
                  <td className="py-0.5 px-0.5 text-slate-600 text-[9.5px] font-semibold text-center whitespace-nowrap">
                    {p.tier ? p.tier.replace('Tier ', 'T') : 'T3'}
                  </td>

                  {/* Full Mode detailed stats */}
                  {viewMode === 'full' && (
                    <>
                      {/* Presenze */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[10px] ${sortBy === 'presenze' ? 'bg-blue-50 font-bold text-slate-900' : 'text-slate-700'}`}>
                        {p.presenze || 0}
                      </td>

                      {/* Media Voto */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[10.5px] font-semibold ${sortBy === 'mediaVoto' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-800'}`}>
                        {p.mediaVoto ? Number(p.mediaVoto).toFixed(2) : '-'}
                      </td>
                    </>
                  )}

                  {/* FantaMedia */}
                  <td className={`py-0.5 px-1 text-center font-mono tabular-nums font-bold text-[11px] ${sortBy === 'fantaMedia' ? 'bg-blue-50/80 text-emerald-800 font-black' : 'text-emerald-700'}`}>
                    {p.fantaMedia ? Number(p.fantaMedia).toFixed(2) : '-'}
                  </td>

                  {/* Full Mode offensive / defensive stats */}
                  {viewMode === 'full' && (
                    <>
                      {/* Gol or Clean Sheet */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[10px] ${sortBy === 'golFatti' || sortBy === 'cleanSheet' ? 'bg-blue-50 font-black' : ''}`}>
                        {p.ruolo === 'P' ? (
                          <span className="text-sky-700 font-bold">{p.cleanSheet} cs</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{p.golFatti}</span>
                        )}
                      </td>

                      {/* Assist or Rigori Parati */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[10px] ${sortBy === 'assist' || sortBy === 'rigoriParati' ? 'bg-blue-50 font-black' : ''}`}>
                        {p.ruolo === 'P' ? (
                          <span className="text-amber-700 font-bold">{p.rigoriParati} rp</span>
                        ) : (
                          <span className="text-sky-700 font-bold">{p.assist}</span>
                        )}
                      </td>

                      {/* Rigori */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[9.5px] ${sortBy === 'rigoriSegnati' ? 'bg-blue-50 font-bold' : 'text-slate-600'}`}>
                        {p.rigoriTirati > 0 ? (
                          <span className="text-amber-800 font-bold">
                            {p.rigoriSegnati}/{p.rigoriTirati}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Cartellini */}
                      <td className={`py-0.5 px-0.5 text-center font-mono tabular-nums text-[9.5px] ${sortBy === 'cartellini' ? 'bg-blue-50 font-bold' : ''}`}>
                        <span className="text-amber-700 font-semibold">{p.ammonizioni}</span>
                        {p.espulsioni > 0 && <span className="text-rose-700 font-bold">/{p.espulsioni}</span>}
                      </td>

                      {/* Rendimento Index */}
                      <td className="py-0.5 px-0.5 text-center font-mono font-black">
                        <span
                          className={`px-1 py-0.2 rounded text-[9.5px] ${
                            p.rendimentoIndex >= 90
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.rendimentoIndex >= 80
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {p.rendimentoIndex}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Target Price */}
                  <td className={`py-0.5 px-1 text-right font-mono tabular-nums ${sortBy === 'prezzoConsigliato' ? 'bg-blue-50' : ''}`}>
                    <span className="font-bold text-slate-900 text-[10.5px]">{price} FM</span>
                    <span className="text-[8.5px] text-slate-400 ml-0.5">({p.targetPrezzoPercentuale}%)</span>
                  </td>

                  {/* Actions */}
                  <td className="py-0.5 px-0.5 text-center">
                    <div className="flex items-center justify-center space-x-0.5">
                      <button
                        onClick={() => onToggleTarget(p)}
                        title={isTargeted ? 'Rimuovi dai target' : 'Aggiungi ai target'}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${
                          isTargeted
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isTargeted ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                      </button>

                      <button
                        onClick={() => onToggleCompare(p)}
                        title="Confronta"
                        className={`p-0.5 rounded transition-colors cursor-pointer ${
                          isCompared
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Users className="w-2.5 h-2.5" />
                      </button>

                      <button
                        onClick={() => onSelectPlayer(p)}
                        title="Dettagli Scheda"
                        className="p-0.5 rounded bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </td>

                  {/* Menu a tendina: Assegnazione Squadra Lega Fantacalcio */}
                  <td className="py-0.5 px-1">
                    <div className="flex items-center space-x-1 min-w-[125px] max-w-[155px]">
                      <select
                        value={assignedTeamId}
                        onChange={(e) => onAssignPlayer(p.id, e.target.value)}
                        className={`w-full py-0.5 px-1 rounded text-[10.5px] font-bold border transition-all cursor-pointer truncate h-6 leading-tight ${
                          assignedTeamId
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-300 font-black'
                            : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-white'
                        }`}
                      >
                        <option value="">— Libero —</option>
                        {sortedTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                      {assignedTeam && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          title={`Assegnato a ${assignedTeam.nome}`}
                        />
                      )}
                    </div>
                  </td>

                  {/* Input Cifra Acquisto Asta & Tasto Salva */}
                  <td className="py-0.5 px-1 bg-amber-50/20">
                    <TablePlayerPriceCell
                      playerId={p.id}
                      currentPrice={paidPrice}
                      onSavePrice={onUpdatePlayerPrice}
                      isAssigned={Boolean(assignedTeamId)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Status Bar */}
      <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between font-mono shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800">
            📊 Mostrati {players.length} calciatori
          </span>
          <span className="text-slate-400 hidden sm:inline">
            (P: {players.filter((p) => p.ruolo === 'P').length} • D: {players.filter((p) => p.ruolo === 'D').length} • C: {players.filter((p) => p.ruolo === 'C').length} • A: {players.filter((p) => p.ruolo === 'A').length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('player-table-scroll-container');
            if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-blue-700 hover:text-blue-900 hover:underline font-bold cursor-pointer flex items-center space-x-1"
          title="Scorri velocemente all'inizio della tabella"
        >
          <span>Torna all'inizio</span>
          <span>↑</span>
        </button>
      </div>
    </div>
  );
};
