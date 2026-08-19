import React from 'react';
import { Player } from '../types/fantacalcio';
import { X, Check, Plus, AlertTriangle, ShieldCheck, Flame, Target, Sparkles, TrendingUp, DollarSign } from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player | null;
  onClose: () => void;
  budgetBase: 500 | 1000;
  isTargeted: boolean;
  onToggleTarget: (player: Player) => void;
  isCompared: boolean;
  onToggleCompare: (player: Player) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  onClose,
  budgetBase,
  isTargeted,
  onToggleTarget,
  isCompared,
  onToggleCompare,
}) => {
  if (!player) return null;

  const price = budgetBase === 500 ? player.prezzoConsigliato500 : player.prezzoConsigliato1000;

  const roleNameMap = {
    P: 'Portiere',
    D: 'Difensore',
    C: 'Centrocampista',
    A: 'Attaccante',
  }[player.ruolo];

  const roleBadgeStyle = {
    P: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    D: 'bg-sky-400/20 text-sky-300 border-sky-400/40',
    C: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    A: 'bg-rose-400/20 text-rose-300 border-rose-400/40',
  }[player.ruolo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Slate 900 with blue accent */}
        <div className="p-6 border-b-2 border-blue-500 flex items-start justify-between bg-slate-900 text-white rounded-t-2xl">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase border ${roleBadgeStyle}`}>
                {player.ruolo} - {roleNameMap}
              </span>
              <span className="text-xs font-bold bg-slate-800 px-2.5 py-0.5 rounded text-slate-200 border border-slate-700">
                {player.squadra}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                {player.tier}
              </span>
              {player.status === 'Nuovo dall\'Estero' && (
                <span className="text-xs bg-purple-900/80 text-purple-200 border border-purple-400/50 px-2 py-0.5 rounded font-bold">
                  ⭐ Nuovo dall'Estero
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{player.nome}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{player.ruoloEsteso}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 bg-white">
          {/* Key 2025/26 Season Performance Metrics */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold mb-3 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Rendimento Ufficiale Stagione 2025/2026</span>
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">FantaMedia</div>
                <div className="text-lg font-black text-emerald-600 font-mono">{player.fantaMedia.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Media Voto</div>
                <div className="text-lg font-bold text-slate-800 font-mono">{player.mediaVoto.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Presenze</div>
                <div className="text-lg font-bold text-slate-800 font-mono">{player.presenze}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">
                  {player.ruolo === 'P' ? 'Gol Subiti' : 'Gol Fatti'}
                </div>
                <div className="text-lg font-black text-rose-600 font-mono">
                  {player.ruolo === 'P' ? player.golSubiti : player.golFatti}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">
                  {player.ruolo === 'P' ? 'Clean Sheet' : 'Assist'}
                </div>
                <div className="text-lg font-bold text-sky-600 font-mono">
                  {player.ruolo === 'P' ? player.cleanSheet : player.assist}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Rendimento</div>
                <div className="text-lg font-black text-blue-600 font-mono">{player.rendimentoIndex}/100</div>
              </div>
            </div>

            {/* Sub-stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 text-xs text-slate-700">
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Minuti giocati: </span>
                <span className="font-mono font-bold text-slate-900">{player.minutiGiocati}'</span>
              </div>
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Rigori: </span>
                <span className="font-mono font-bold text-slate-900">
                  {player.ruolo === 'P'
                    ? `${player.rigoriParati} parati`
                    : `${player.rigoriSegnati}/${player.rigoriTirati} segnati`}
                </span>
              </div>
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Cartellini: </span>
                <span className="font-mono font-bold text-slate-900">
                  🟨 {player.ammonizioni} | 🟥 {player.espulsioni}
                </span>
              </div>
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Expected: </span>
                <span className="font-mono font-bold text-slate-900">
                  {player.xG} xG | {player.xA} xA
                </span>
              </div>
            </div>
          </div>

          {/* Foreign Newcomer Focus Box */}
          {player.status === 'Nuovo dall\'Estero' && player.provenienzaEstero && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-purple-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Analisi Nuovo Arrivo dall'Estero</span>
              </div>
              <div className="text-xs text-purple-900/90 space-y-1">
                <p>
                  <strong>Club di Provenienza:</strong> {player.provenienzaEstero.clubPrecedente} ({player.provenienzaEstero.campionato})
                </p>
                <p>
                  <strong>Note di Scouting & Adattamento:</strong> {player.provenienzaEstero.noteAdattamento}
                </p>
              </div>
            </div>
          )}

          {/* Strategic Tactical Indices */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold mb-3 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Indici Tattici Fantacalcistici (Scala 1-10)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-semibold">Affidabilità Fisica</span>
                  <span className="font-bold text-emerald-600 font-mono">{player.affidabilitaFisica}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${player.affidabilitaFisica * 10}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-semibold">Costanza Voto</span>
                  <span className="font-bold text-blue-600 font-mono">{player.costanzaVoto}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${player.costanzaVoto * 10}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-semibold">Appeal Bonus</span>
                  <span className="font-bold text-amber-600 font-mono">{player.appealBonus}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${player.appealBonus * 10}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-semibold">Rischio Malus</span>
                  <span className="font-bold text-rose-600 font-mono">{player.rischioMalus}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${player.rischioMalus * 10}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Criticalities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Punti di Forza</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside font-medium">
                {player.puntiDiForza.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center space-x-1.5 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Criticità & Rischi</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside font-medium">
                {player.criticita.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strategic Auction Advice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-blue-600" />
              <span>Consiglio Strategico per l'Asta</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{player.consiglioAsta}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Consiglio Prezzo ({budgetBase} crediti)</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-slate-900 font-mono">{price} FM</span>
              <span className="text-xs text-slate-500 font-mono">({player.targetPrezzoPercentuale}% del budget totale)</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-bold">
                {player.slotConsigliato}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onToggleCompare(player)}
              className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition-all ${
                isCompared
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isCompared ? 'Rimuovi Confronto' : 'Aggiungi al Confronto'}
            </button>

            <button
              onClick={() => onToggleTarget(player)}
              className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                isTargeted
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 shadow-xs'
              }`}
            >
              {isTargeted ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isTargeted ? 'In Target Asta' : 'Aggiungi a Bersagli Asta'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
