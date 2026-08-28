import React, { useState, useRef, useEffect } from 'react';
import { LeagueWorkspace, DEFAULT_TAB_COLORS, createDefaultLeague, Player } from '../types/fantacalcio';
import { exportLeagueAuctionToExcel } from '../utils/excelExporter';
import {
  FileSpreadsheet,
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Palette,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Coins,
  Layers,
  Hash,
  Download
} from 'lucide-react';

interface ExcelLeagueTabsProps {
  leagues: LeagueWorkspace[];
  activeLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
  onCreateLeague: (nome: string, budgetIniziale: number, coloreTab: string, teamCount?: number) => void;
  onRenameLeague: (leagueId: string, newName: string) => void;
  onChangeLeagueColor: (leagueId: string, newColor: string) => void;
  onDuplicateLeague: (leagueId: string, duplicateAssignments: boolean) => void;
  onDeleteLeague: (leagueId: string) => void;
  onResetLeagueRosters: (leagueId: string) => void;
  allPlayers: Player[];
}

export const ExcelLeagueTabs: React.FC<ExcelLeagueTabsProps> = ({
  leagues,
  activeLeagueId,
  onSelectLeague,
  onCreateLeague,
  onRenameLeague,
  onChangeLeagueColor,
  onDuplicateLeague,
  onDeleteLeague,
  onResetLeagueRosters,
  allPlayers,
}) => {
  const [isNewLeagueModalOpen, setIsNewLeagueModalOpen] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueBudget, setNewLeagueBudget] = useState<number>(700);
  const [newLeagueColor, setNewLeagueColor] = useState<string>(DEFAULT_TAB_COLORS[0]);
  const [newLeagueTeamCount, setNewLeagueTeamCount] = useState<number>(10);

  // Context / Options menu state
  const [activeMenuLeagueId, setActiveMenuLeagueId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Rename inline state
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Tab scroll container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuLeagueId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (league: LeagueWorkspace, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingLeagueId(league.id);
    setEditingName(league.nome);
    setActiveMenuLeagueId(null);
  };

  const handleSaveRename = (leagueId: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenameLeague(leagueId, trimmed);
    }
    setEditingLeagueId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLeagueName.trim() || `Lega ${leagues.length + 1}`;
    onCreateLeague(name, Number(newLeagueBudget) || 700, newLeagueColor, newLeagueTeamCount || 10);
    setIsNewLeagueModalOpen(false);
    setNewLeagueName('');
    setNewLeagueTeamCount(10);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
      {/* Top Banner with Sheet tabs bar */}
      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 flex items-center justify-between gap-2 h-10">
        
        {/* Left Indicator */}
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 shrink-0 pr-1">
          <div className="flex items-center space-x-1 bg-slate-800/90 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-md text-[11px] font-mono">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fogli Leghe:</span>
            <span className="text-white font-bold">{leagues.length}</span>
          </div>
        </div>

        {/* Scroll Left Button if overflow */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
          title="Scorri schede a sinistra"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Sheet Tabs List (Excel Look & Feel) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
        >
          {leagues.map((league, idx) => {
            const isActive = league.id === activeLeagueId;
            const assignedCount = Object.keys(league.playerAssignments || {}).length;
            const tabColor = league.coloreTab || DEFAULT_TAB_COLORS[idx % DEFAULT_TAB_COLORS.length];
            const numTeams = league.teams?.length || league.numeroSquadre || 10;
            const maxSlots = numTeams * 25;

            return (
              <div
                key={league.id}
                className="relative group shrink-0"
              >
                {editingLeagueId === league.id ? (
                  <div className="flex items-center bg-white text-slate-900 px-2 py-0.5 rounded-t-lg border-t-2 border-x border-slate-300 shadow-xs h-8">
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(league.id);
                        if (e.key === 'Escape') setEditingLeagueId(null);
                      }}
                      onBlur={() => handleSaveRename(league.id)}
                      className="text-xs font-bold px-1 py-0.5 border border-blue-400 rounded outline-hidden w-28 sm:w-36 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(league.id)}
                      className="ml-1 p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectLeague(league.id)}
                    onDoubleClick={(e) => handleStartRename(league, e)}
                    style={{ borderTopColor: isActive ? tabColor : 'transparent' }}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-t-lg text-xs font-bold cursor-pointer transition-all h-8 border-t-2 border-x ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-md ring-1 ring-black/5 font-black'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                    }`}
                    title={`Doppio click per rinominare "${league.nome}". Clicca con tasto destro o menu per opzioni.`}
                  >
                    {/* Tab Color Dot / Accent */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: tabColor }}
                    />

                    {/* Sheet Name */}
                    <span className="truncate max-w-[130px] sm:max-w-[180px] font-sans">
                      {league.nome}
                    </span>

                    {/* Assigned Players Badge */}
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-slate-900/60 text-slate-400 border border-slate-700'
                      }`}
                      title={`${assignedCount} calciatori assegnati su ${maxSlots} posti (${numTeams} squadre)`}
                    >
                      {assignedCount}/{maxSlots}
                    </span>

                    {/* Options Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuLeagueId(activeMenuLeagueId === league.id ? null : league.id);
                      }}
                      className={`p-0.5 rounded hover:bg-black/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer ${
                        isActive ? 'text-slate-700' : 'text-slate-400'
                      }`}
                      title="Opzioni foglio lega (Rinomina, Duplica, Colore, Elimina)"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Context Menu Dropdown for this tab */}
                {activeMenuLeagueId === league.id && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Opzioni Foglio: {league.nome}
                    </div>

                    {/* Rename */}
                    <button
                      type="button"
                      onClick={() => handleStartRename(league)}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Rinomina Foglio Lega</span>
                    </button>

                    {/* Change Color */}
                    <div className="px-3 py-1.5 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                        <Palette className="w-3 h-3 text-purple-600" />
                        <span>Colore Etichetta:</span>
                      </div>
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        {DEFAULT_TAB_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              onChangeLeagueColor(league.id, c);
                              setActiveMenuLeagueId(null);
                            }}
                            className="w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: c }}
                            title={`Imposta colore ${c}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Export League Auction to Excel */}
                    <button
                      type="button"
                      onClick={() => {
                        exportLeagueAuctionToExcel({
                          teams: league.teams,
                          allPlayers,
                          playerAssignments: league.playerAssignments,
                          playerPrices: league.playerPrices,
                          leagueName: league.nome,
                        });
                        setActiveMenuLeagueId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 text-emerald-900 flex items-center space-x-2 font-bold cursor-pointer border-t border-slate-100"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scarica Excel Asta (Squadre & Prezzi)</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => {
                        onDuplicateLeague(league.id, false);
                        setActiveMenuLeagueId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center space-x-2 font-medium cursor-pointer border-t border-slate-100"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Duplica Struttura (Nuovo Foglio)</span>
                    </button>

                    {/* Reset Rosters */}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Vuoi davvero azzerare gli acquisti e i prezzi di "${league.nome}"? I nomi delle squadre rimarranno invariati.`
                          )
                        ) {
                          onResetLeagueRosters(league.id);
                          setActiveMenuLeagueId(null);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-amber-50 text-amber-900 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Azzera Acquisti in questo Foglio</span>
                    </button>

                    {/* Delete League (only if more than 1) */}
                    {leagues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Vuoi eliminare definitivamente il foglio "${league.nome}" e tutti i suoi dati?`
                            )
                          ) {
                            onDeleteLeague(league.id);
                            setActiveMenuLeagueId(null);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-700 flex items-center space-x-2 font-medium cursor-pointer border-t border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Elimina Foglio Lega</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll Right Button if overflow */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
          title="Scorri schede a destra"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* + Add New League Sheet Tab Button */}
        <button
          type="button"
          onClick={() => {
            setNewLeagueName(`Lega ${leagues.length + 1}`);
            setNewLeagueBudget(700);
            setNewLeagueTeamCount(10);
            setNewLeagueColor(DEFAULT_TAB_COLORS[leagues.length % DEFAULT_TAB_COLORS.length]);
            setIsNewLeagueModalOpen(true);
          }}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          title="Crea un nuovo foglio di lavoro indipendente per un altro Fantacalcio (con squadre e monte crediti autonomo)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Nuovo Foglio Lega</span>
          <span className="md:hidden">Nuovo</span>
        </button>

      </div>

      {/* Modal to Create a New League Sheet */}
      {isNewLeagueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Crea Nuovo Foglio Fantacalcio
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ambiente di lavoro autonomo con squadre e budget separato
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeagueModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              
              {/* League Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome del Foglio / Nome Lega:
                </label>
                <input
                  type="text"
                  required
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="es. Fantacalcio Amici, Lega Ufficio, Lega Champions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              {/* Number of Teams */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Numero Squadre Partecipanti:</span>
                  <span className="text-[10px] text-blue-600 font-mono font-bold">Default: 10 Squadre</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[8, 10, 12, 14].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setNewLeagueTeamCount(cnt)}
                      className={`py-1 px-2 rounded-lg font-mono font-bold text-center border cursor-pointer transition-all ${
                        newLeagueTeamCount === cnt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {cnt} {cnt === 10 ? '⭐' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Budget for each team */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monte Acquisti Iniziale per ciascuna Squadra:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 700, 1000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewLeagueBudget(b)}
                      className={`py-1.5 px-2 rounded-lg font-mono font-bold text-center border cursor-pointer transition-all ${
                        newLeagueBudget === b
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {b} FM
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Color */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Colore Etichetta Scheda:
                </label>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {DEFAULT_TAB_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLeagueColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                        newLeagueColor === c ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Shared Players Database Note */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota:</strong> Il database dei calciatori (inclusi gli Excel personalizzati caricati) è condiviso su tutti i fogli lega. Puoi passare da un foglio all'altro in qualunque momento con 1 solo click!
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLeagueModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Crea Foglio Lega
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};
