import React from 'react';
import { Role } from '../types/fantacalcio';
import { AlertTriangle, X, ShieldAlert, ArrowRight, RotateCcw, Check } from 'lucide-react';

export interface UnassignPendingTarget {
  playerId: string;
  playerName: string;
  playerRole: Role;
  playerTeamSerieA: string;
  teamId: string;
  teamName: string;
  paidPrice: number;
}

interface UnassignConfirmModalProps {
  isOpen: boolean;
  target: UnassignPendingTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const UnassignConfirmModal: React.FC<UnassignConfirmModalProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !target) return null;

  const roleBadgeStyle = {
    P: 'bg-amber-500 text-slate-950',
    D: 'bg-emerald-600 text-white',
    C: 'bg-blue-600 text-white',
    A: 'bg-red-600 text-white',
  }[target.playerRole];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border-2 border-amber-400 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with high-visibility warning */}
        <div className="bg-amber-500 text-slate-950 px-5 py-3.5 flex items-center justify-between font-black">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Attenzione: Conferma Svincolo Calciatore
              </h3>
              <p className="text-xs text-slate-900 font-semibold opacity-90">
                Hai selezionato "Libero" per un calciatore già acquistato
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
            <p className="text-slate-800 font-medium leading-relaxed">
              Il calciatore <strong className="text-slate-950 font-black">{target.playerName}</strong> risulta attualmente assegnato alla squadra <strong className="text-blue-900 font-black">{target.teamName}</strong>.
            </p>
            <p className="text-slate-600">
              Se confermi lo svincolo, il calciatore tornerà nella lista degli svincolati e la transazione verrà annullata.
            </p>
          </div>

          {/* Player & Current Assignment Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">
              Dettagli Assegnazione Attuale:
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className={`w-5 h-5 rounded flex items-center justify-center font-black text-xs font-mono shadow-2xs ${roleBadgeStyle}`}>
                  {target.playerRole}
                </span>
                <span className="font-black text-slate-900 text-sm">
                  {target.playerName}
                </span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">
                  {target.playerTeamSerieA}
                </span>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-500 block">Prezzo Asta:</span>
                <span className="text-base font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                  {target.paidPrice} FM
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span>Squadra assegnataria:</span>
              <strong className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                🏆 {target.teamName}
              </strong>
            </div>
          </div>

          {/* Impact preview */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center space-x-1 text-rose-800">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Cosa succederà confermando:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11.5px] text-rose-950/80 pl-1 font-medium">
              <li>Il calciatore tornerà <strong>LIBERO</strong> nel listone d'asta.</li>
              <li>I <strong>{target.paidPrice} FM</strong> verranno riaccreditati al budget di <strong>{target.teamName}</strong>.</li>
              <li>Uno slot nella rosa di {target.teamName} tornerà vuoto.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>ANNULLA (Mantieni Assegnato a {target.teamName})</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Svincola e Rimborsa {target.paidPrice} FM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
