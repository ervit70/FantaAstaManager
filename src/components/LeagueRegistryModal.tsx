import React, { useState, useEffect, useRef } from 'react';
import { LeagueTeam, DEFAULT_LEAGUE_TEAMS, generateDefaultTeams, TEAM_COLOR_PALETTE, Player } from '../types/fantacalcio';
import { 
  X, Save, RotateCcw, User, Users, CheckCircle2, Trophy, Coins, 
  Zap, AlertTriangle, RefreshCw, Hash, ShieldAlert, Lock, ArrowLeft, Trash2
} from 'lucide-react';

interface LeagueRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: LeagueTeam[];
  onSaveTeams: (teams: LeagueTeam[]) => void;
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices?: Record<string, number>; // playerId -> purchase price
  allPlayers?: Player[];
  onBatchReleasePlayers?: (playerIds: string[]) => void;
}

interface AffectedTeamData {
  team: LeagueTeam;
  playerCount: number;
  spentCredits: number;
  playerNames: string[];
  playerIds: string[];
}

export const LeagueRegistryModal: React.FC<LeagueRegistryModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSaveTeams,
  playerAssignments,
  playerPrices = {},
  allPlayers = [],
  onBatchReleasePlayers,
}) => {
  const [localTeams, setLocalTeams] = useState<LeagueTeam[]>(teams);
  const [teamCount, setTeamCount] = useState<number>(teams.length || 10);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [bulkBudgetInput, setBulkBudgetInput] = useState<number>(700);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Safety Memory Cache for all customized teams up to 20
  const teamMemoryCacheRef = useRef<Map<string, LeagueTeam>>(new Map());

  // Safety Modal State for accidental reduction during active auction
  const [pendingReductionCount, setPendingReductionCount] = useState<number | null>(null);
  const [affectedTeamsData, setAffectedTeamsData] = useState<AffectedTeamData[]>([]);

  // Sync state with props when modal opens or teams change
  useEffect(() => {
    if (isOpen) {
      const sanitized = (teams.length > 0 ? teams : DEFAULT_LEAGUE_TEAMS).map((t, idx) => ({
        ...t,
        numero: t.numero || idx + 1,
        budgetIniziale: t.budgetIniziale !== undefined ? t.budgetIniziale : 700,
        coloreHex: t.coloreHex || TEAM_COLOR_PALETTE[idx % TEAM_COLOR_PALETTE.length],
      }));

      // Cache existing teams in memory map
      sanitized.forEach((t) => {
        teamMemoryCacheRef.current.set(t.id, { ...t });
      });

      setLocalTeams(sanitized);
      setTeamCount(sanitized.length);
      setSavedSuccess(false);
      setResetSuccessMessage(null);
      setIsConfirmResetOpen(false);
      setPendingReductionCount(null);
      setAffectedTeamsData([]);
    }
  }, [isOpen, teams]);

  if (!isOpen) return null;

  const handleUpdateField = (index: number, field: keyof LeagueTeam, value: any) => {
    setLocalTeams((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      // Keep memory cache updated
      if (updated[index]?.id) {
        teamMemoryCacheRef.current.set(updated[index].id, { ...updated[index] });
      }
      return updated;
    });
    setSavedSuccess(false);
    setResetSuccessMessage(null);
  };

  const handleSetAllBudgets = (amount: number) => {
    setLocalTeams((prev) => {
      const updated = prev.map((t) => ({
        ...t,
        budgetIniziale: amount,
      }));
      updated.forEach((t) => teamMemoryCacheRef.current.set(t.id, { ...t }));
      return updated;
    });
    setSavedSuccess(false);
  };

  // Helper: check if any teams to be cut off have assigned players
  const getAffectedTeamsWithPlayers = (currentList: LeagueTeam[], targetCount: number): AffectedTeamData[] => {
    if (targetCount >= currentList.length) return [];

    const teamsToCut = currentList.slice(targetCount);
    const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));
    const result: AffectedTeamData[] = [];

    teamsToCut.forEach((t) => {
      const pIds: string[] = [];
      const pNames: string[] = [];
      let spent = 0;

      Object.entries(playerAssignments).forEach(([pId, teamId]) => {
        if (teamId === t.id) {
          pIds.push(pId);
          const pObj = playerMap.get(pId);
          pNames.push(pObj ? `${pObj.nome} (${pObj.ruolo})` : pId);
          const price = playerPrices[pId];
          if (price !== undefined && !isNaN(price)) {
            spent += Number(price);
          }
        }
      });

      if (pIds.length > 0) {
        result.push({
          team: t,
          playerCount: pIds.length,
          spentCredits: spent,
          playerNames: pNames,
          playerIds: pIds,
        });
      }
    });

    return result;
  };

  // Safe team count changer with anti-accidental-deletion protection
  const handleChangeTeamCount = (newCount: number, bypassSafetyCheck = false) => {
    const targetCount = Math.max(4, Math.min(20, newCount));
    
    // If reducing teams and not bypassed, check for active auction data
    if (!bypassSafetyCheck && targetCount < localTeams.length) {
      const affected = getAffectedTeamsWithPlayers(localTeams, targetCount);
      if (affected.length > 0) {
        // TRIGGER SAFETY INTERLOCK MODAL!
        setPendingReductionCount(targetCount);
        setAffectedTeamsData(affected);
        return;
      }
    }

    setTeamCount(targetCount);

    setLocalTeams((prev) => {
      if (targetCount === prev.length) return prev;

      if (targetCount > prev.length) {
        // Add new teams or restore previously configured from memory cache
        const currentLen = prev.length;
        const added: LeagueTeam[] = [];
        const baseBudget = prev[0]?.budgetIniziale || 700;

        for (let i = currentLen + 1; i <= targetCount; i++) {
          const teamId = `team-${i}`;
          // Check if we previously had custom details for this team in memory
          const cached = teamMemoryCacheRef.current.get(teamId);
          if (cached) {
            added.push({ ...cached, numero: i });
          } else {
            const color = TEAM_COLOR_PALETTE[(i - 1) % TEAM_COLOR_PALETTE.length];
            const newTeam: LeagueTeam = {
              id: teamId,
              numero: i,
              nome: `Squadra ${i}`,
              capitano1: `Capitano ${i}`,
              capitano2: `Vice Capitano ${i}`,
              budgetIniziale: baseBudget,
              coloreHex: color,
              badgeSigla: `SQ${i}`,
            };
            teamMemoryCacheRef.current.set(teamId, newTeam);
            added.push(newTeam);
          }
        }
        return [...prev, ...added];
      } else {
        // Decrease teams: cache the existing ones in memory before slicing
        prev.forEach((t) => teamMemoryCacheRef.current.set(t.id, { ...t }));
        return prev.slice(0, targetCount);
      }
    });

    setSavedSuccess(false);
    setPendingReductionCount(null);
    setAffectedTeamsData([]);
  };

  // Safe Action 1: Keep players safely in memory, just reduce the visible count
  const handleConfirmSafeReduction = () => {
    if (pendingReductionCount !== null) {
      handleChangeTeamCount(pendingReductionCount, true);
    }
  };

  // Safe Action 2: Release players from cut teams back to free pool
  const handleConfirmReleaseAndReduce = () => {
    if (pendingReductionCount !== null) {
      if (onBatchReleasePlayers && affectedTeamsData.length > 0) {
        const allIdsToRelease = affectedTeamsData.flatMap((a) => a.playerIds);
        onBatchReleasePlayers(allIdsToRelease);
      }
      handleChangeTeamCount(pendingReductionCount, true);
    }
  };

  // Cancel reduction and revert input
  const handleCancelReduction = () => {
    setTeamCount(localTeams.length);
    setPendingReductionCount(null);
    setAffectedTeamsData([]);
  };

  const handleSave = () => {
    onSaveTeams(localTeams);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  // Restore Pristine Initial Names & State based on current count
  const handleConfirmResetPristine = () => {
    const count = localTeams.length || 10;
    const pristineTeams: LeagueTeam[] = generateDefaultTeams(count, 700);
    
    // Update memory cache
    pristineTeams.forEach((t) => teamMemoryCacheRef.current.set(t.id, { ...t }));

    setLocalTeams(pristineTeams);
    onSaveTeams(pristineTeams);
    setIsConfirmResetOpen(false);
    setResetSuccessMessage(`Nomi, Capitani e Squadre ripristinati allo stato vergine di default (Squadra 1...${count}, 700 FM)!`);
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 4500);
  };

  // Calculate spent and remaining credits for a given team
  const getTeamBudgetStats = (teamId: string, budgetIniziale: number = 700) => {
    let count = 0;
    let spent = 0;
    Object.entries(playerAssignments).forEach(([playerId, tId]) => {
      if (tId === teamId) {
        count += 1;
        const price = playerPrices[playerId];
        if (price !== undefined && !isNaN(price)) {
          spent += Number(price);
        }
      }
    });
    const remaining = budgetIniziale - spent;
    return { count, spent, remaining };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 relative">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center space-x-2">
                <span>Anagrafica & Monte Acquisti ({localTeams.length} Squadre)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configura il numero di partecipanti (default 10), nomi squadre, Capitani e Monte Ingaggi/Budget Iniziale per l'Asta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Reset Success Alert Banner */}
          {resetSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 flex items-center space-x-2.5 animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{resetSuccessMessage}</span>
            </div>
          )}

          {/* PARAMETRO DI SISTEMA: NUMERO SQUADRE PARTECIPANTI (CON PROTEZIONE DI SICUREZZA) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center space-x-1.5">
                  <span>Parametro di Sistema: Numero Squadre Partecipanti</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-mono font-bold">
                    Default: 10 Squadre
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Se aumenti o diminuisci i partecipanti, il sistema <strong>protegge automaticamente i dati</strong> impedendo la perdita accidentale di rose e crediti.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {[8, 10, 12, 14, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleChangeTeamCount(num)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                    localTeams.length === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {num} Squadre {num === 10 && '⭐'}
                </button>
              ))}

              {/* Custom number input */}
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-300">
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={teamCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    handleChangeTeamCount(val);
                  }}
                  className="w-14 px-1.5 py-1 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-hidden focus:border-blue-500"
                  title="Imposta numero personalizzato di partecipanti (4-20)"
                />
              </div>
            </div>
          </div>

          {/* Top Actions Ribbon: Quick Bulk Budget */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Imposta Monte Ingaggi Iniziale per tutte le {localTeams.length} squadre:
                </h4>
                <p className="text-[11px] text-slate-600">
                  Puoi applicare una cifra comune (es. <strong>700 FM</strong>) oppure modificarla singolarmente su ogni squadra sotto.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSetAllBudgets(700)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
              >
                <Zap className="w-3 h-3" />
                <span>700 FM (Consigliato)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAllBudgets(500)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                500 FM
              </button>
              <button
                type="button"
                onClick={() => handleSetAllBudgets(1000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                1000 FM
              </button>
              <div className="flex items-center space-x-1 ml-1 pl-2 border-l border-slate-300">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={bulkBudgetInput}
                  onChange={(e) => setBulkBudgetInput(parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-1 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleSetAllBudgets(bulkBudgetInput)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  Applica
                </button>
              </div>
            </div>
          </div>

          {/* Action row with prominent pristine reset button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <span>
              I crediti iniziali verranno <strong>automaticamente scalati in tempo reale</strong> ad ogni acquisto registrato nella lista giocatori.
            </span>

            {/* TASTO RIPRISTINA NOMI INIZIALI STATO VERGINE */}
            <button
              type="button"
              onClick={() => setIsConfirmResetOpen(true)}
              className="text-xs font-black text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-95 ring-1 ring-rose-300/60"
              title="Ripristina i nomi di tutte le squadre e dei capitani allo stato vergine iniziale predefinito"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>🔄 RIPRISTINA NOMI INIZIALI (STATO VERGINE)</span>
            </button>
          </div>

          {/* Grid of Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {localTeams.map((team, idx) => {
              const budgetInit = team.budgetIniziale !== undefined ? team.budgetIniziale : 700;
              const { count, spent, remaining } = getTeamBudgetStats(team.id, budgetInit);

              return (
                <div
                  key={team.id}
                  className="bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all space-y-3"
                  style={{ borderLeftColor: team.coloreHex || '#2563eb', borderLeftWidth: '4px' }}
                >
                  {/* Team Top line: Number, Badge, Name, Initial Budget */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: team.coloreHex || '#2563eb' }}
                      >
                        {team.numero || idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                          Nome Squadra Fantacalcio #{team.numero || idx + 1}
                        </label>
                        <input
                          type="text"
                          value={team.nome}
                          placeholder={`Squadra ${team.numero || idx + 1}`}
                          onChange={(e) => handleUpdateField(idx, 'nome', e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 truncate"
                        />
                      </div>
                    </div>

                    {/* Team Color Picker & Initial Budget */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 text-right">
                          Budget Iniziale
                        </label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={budgetInit}
                            onChange={(e) => handleUpdateField(idx, 'budgetIniziale', parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-hidden focus:border-amber-500"
                          />
                          <span className="text-[10px] font-bold text-slate-500">FM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Captains line */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1 flex items-center space-x-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        <span>Nome Capitano 1</span>
                      </label>
                      <input
                        type="text"
                        value={team.capitano1}
                        placeholder="Es. Mario Rossi"
                        onChange={(e) => handleUpdateField(idx, 'capitano1', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-purple-600" />
                        <span>Nome Capitano 2</span>
                      </label>
                      <input
                        type="text"
                        value={team.capitano2}
                        placeholder="Es. Luigi Bianchi"
                        onChange={(e) => handleUpdateField(idx, 'capitano2', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Live Budget Recap footer for this team */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Partenza: <strong>{budgetInit} FM</strong></span>
                    <span>Acquistati: <strong className="text-blue-600">{count}/25</strong></span>
                    <span>Spesi: <strong className="text-rose-600">-{spent} FM</strong></span>
                    <span>Residui: <strong className="text-emerald-700">{remaining} FM</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmResetOpen(true)}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-300 px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Ripristina Nomi Iniziali</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 shadow-md transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Salvataggio Eseguito!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-blue-200" />
                <span>Salva Anagrafica e Budget ({localTeams.length} Squadre)</span>
              </>
            )}
          </button>
        </div>

        {/* POPUP 1: BLOCCO DI SICUREZZA ANTI-CANCELLAZIONE SQUADRE CON CALCIATORI GIÀ ASSEGNATI */}
        {pendingReductionCount !== null && affectedTeamsData.length > 0 && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-xl w-full p-5 sm:p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
              
              <div className="flex items-center space-x-3 text-amber-600 border-b border-slate-100 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Protezione Asta: Calciatori già Assegnati!
                  </h3>
                  <p className="text-xs text-amber-700 font-bold">
                    Stai riducendo il numero di partecipanti da {localTeams.length} a {pendingReductionCount} squadre
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">
                  ⚠️ Le seguenti squadre che verrebbero escluse hanno <strong>calciatori già acquistati all'asta</strong>:
                </p>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {affectedTeamsData.map((aff) => (
                    <div key={aff.team.id} className="bg-white border border-amber-200 rounded-lg p-2.5 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono text-[10px] flex items-center justify-center">
                            {aff.team.numero}
                          </span>
                          <span>{aff.team.nome}</span>
                        </span>
                        <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {aff.playerCount} Calciatori ({aff.spentCredits} FM spesi)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono pl-6 truncate" title={aff.playerNames.join(', ')}>
                        {aff.playerNames.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 pt-1">
                  Scegli come procedere in totale sicurezza senza rischiare di perdere dati per errore:
                </p>
              </div>

              {/* 3 Safe Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Safe Option 1: Safe Memory retention */}
                <button
                  type="button"
                  onClick={handleConfirmSafeReduction}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-98"
                >
                  <span className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-blue-200" />
                    <span>🛡️ CONSERVA IN MEMORIA CASSAFORTE (CONSIGLIATO)</span>
                  </span>
                  <span className="text-[10px] font-normal text-blue-100 hidden sm:inline">
                    (Se ripassi a {localTeams.length} ritrovi tutto intatto)
                  </span>
                </button>

                {/* Safe Option 2: Cancel */}
                <button
                  type="button"
                  onClick={handleCancelReduction}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                  <span>ANNULLA MODIFICA (MANTIENI LE {localTeams.length} SQUADRE ATTUALI)</span>
                </button>

                {/* Option 3: Release players back to market */}
                <button
                  type="button"
                  onClick={handleConfirmReleaseAndReduce}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Svincola i calciatori delle squadre rimosse e riduci a {pendingReductionCount} squadre</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* POPUP 2: MODALE CONFERMA RIPRISTINO STATO VERGINE */}
        {isConfirmResetOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ripristinare lo Stato Vergine?
                  </h3>
                  <p className="text-xs text-rose-600 font-bold">
                    Conferma ripristino anagrafica {localTeams.length} squadre
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-xs text-slate-700 space-y-1.5">
                <p>
                  Questa operazione <strong>sovrascriverà tutti i nomi personalizzati</strong> delle squadre e dei rispettivi Capitani, ripristinandoli alla configurazione iniziale pulita:
                </p>
                <ul className="list-disc list-inside font-medium text-slate-800 space-y-0.5 pl-1">
                  <li><strong>Nomi:</strong> Squadra 1, Squadra 2 ... Squadra {localTeams.length}</li>
                  <li><strong>Capitani:</strong> Capitano 1...{localTeams.length} e Vice Capitano 1...{localTeams.length}</li>
                  <li><strong>Budget Iniziale:</strong> 700 FM per ciascuna squadra</li>
                  <li><strong>Colori & Sigle:</strong> Palette originale predefinita</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmResetOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPristine}
                  className="px-4 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>SÌ, RIPRISTINA STATO VERGINE</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
