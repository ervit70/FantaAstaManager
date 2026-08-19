import React, { useState, useEffect } from 'react';
import { LeagueTeam, DEFAULT_LEAGUE_TEAMS } from '../types/fantacalcio';
import { X, Save, RotateCcw, Shield, User, Users, CheckCircle2, Trophy, Coins, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

interface LeagueRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: LeagueTeam[];
  onSaveTeams: (teams: LeagueTeam[]) => void;
  playerAssignments: Record<string, string>; // playerId -> teamId
  playerPrices?: Record<string, number>; // playerId -> purchase price
}

export const LeagueRegistryModal: React.FC<LeagueRegistryModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSaveTeams,
  playerAssignments,
  playerPrices = {},
}) => {
  const [localTeams, setLocalTeams] = useState<LeagueTeam[]>(teams);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [bulkBudgetInput, setBulkBudgetInput] = useState<number>(700);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Sync state with props when modal opens or teams change
  useEffect(() => {
    if (isOpen) {
      // Ensure all teams have budgetIniziale defined
      const sanitized = teams.map((t) => ({
        ...t,
        budgetIniziale: t.budgetIniziale !== undefined ? t.budgetIniziale : 700,
      }));
      setLocalTeams(sanitized);
      setSavedSuccess(false);
      setResetSuccessMessage(null);
      setIsConfirmResetOpen(false);
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
      return updated;
    });
    setSavedSuccess(false);
    setResetSuccessMessage(null);
  };

  const handleSetAllBudgets = (amount: number) => {
    setLocalTeams((prev) =>
      prev.map((t) => ({
        ...t,
        budgetIniziale: amount,
      }))
    );
    setSavedSuccess(false);
  };

  const handleSave = () => {
    onSaveTeams(localTeams);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  // Restore Pristine Initial Names & State
  const handleConfirmResetPristine = () => {
    const pristineTeams: LeagueTeam[] = DEFAULT_LEAGUE_TEAMS.map((t, i) => ({
      ...t,
      id: `team-${i + 1}`,
      numero: i + 1,
      nome: `Squadra ${i + 1}`,
      capitano1: `Capitano ${i + 1}`,
      capitano2: `Vice Capitano ${i + 1}`,
      budgetIniziale: 700,
      coloreHex: [
        '#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed',
        '#0284c7', '#4f46e5', '#e11d48', '#0d9488', '#ea580c'
      ][i],
      badgeSigla: `SQ${i + 1}`,
    }));
    
    setLocalTeams(pristineTeams);
    onSaveTeams(pristineTeams);
    setIsConfirmResetOpen(false);
    setResetSuccessMessage('Nomi, Capitani e Squadre ripristinati allo stato vergine iniziale (Squadra 1...10, 700 FM)!');
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
                <span>Anagrafica & Monte Acquisti 10 Squadre</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configura i nomi delle 10 squadre, i Capitani e il Monte Ingaggi/Budget Iniziale per l'Asta.
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

          {/* Top Actions Ribbon: Quick Bulk Budget + Pristine Reset Button */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Imposta Monte Ingaggi Iniziale per tutte le 10 squadre:
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
              title="Ripristina i nomi di tutte le 10 squadre e dei capitani allo stato vergine iniziale"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>🔄 RIPRISTINA NOMI INIZIALI (STATO VERGINE)</span>
            </button>
          </div>

          {/* Grid of 10 Teams */}
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
                          Nome Squadra Fantacalcio
                        </label>
                        <input
                          type="text"
                          value={team.nome}
                          placeholder={`Squadra ${idx + 1}`}
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
                <span>Salva Anagrafica e Budget 10 Squadre</span>
              </>
            )}
          </button>
        </div>

        {/* POPUP MODALE CONFERMA RIPRISTINO STATO VERGINE */}
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
                    Conferma ripristino anagrafica 10 squadre
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-xs text-slate-700 space-y-1.5">
                <p>
                  Questa operazione <strong>sovrascriverà tutti i nomi personalizzati</strong> delle 10 squadre e dei rispettivi Capitani, ripristinandoli alla configurazione iniziale pulita:
                </p>
                <ul className="list-disc list-inside font-medium text-slate-800 space-y-0.5 pl-1">
                  <li><strong>Nomi:</strong> Squadra 1, Squadra 2 ... Squadra 10</li>
                  <li><strong>Capitani:</strong> Capitano 1...10 e Vice Capitano 1...10</li>
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
