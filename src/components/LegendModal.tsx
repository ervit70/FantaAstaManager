import React from 'react';
import { X, HelpCircle, BookOpen, Sparkles, Shield, Target, Flame } from 'lucide-react';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const abbreviations = [
    {
      sigla: 'PG',
      nomeCompleto: 'Partite Giocate / Presenze',
      descrizione: 'Numero totale di partite a voto disputate dal giocatore nella stagione di Serie A 2025/2026 (su un totale di 38 gare di campionato).',
      colore: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    {
      sigla: 'MV',
      nomeCompleto: 'Media Voto Pura',
      descrizione: 'La media dei voti puri assegnati dai pagellisti (senza considerare alcun bonus come gol o assist, né malus come cartellini o gol subiti). Rappresenta la pura qualità delle prestazioni.',
      colore: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      sigla: 'FM',
      nomeCompleto: 'FantaMedia',
      descrizione: 'Media voto ufficiale calcolata includendo tutti i bonus (+3 gol, +1 assist, +3 rigore parato, +1 clean sheet se applicabile) e malus (-1 gol subito, -3 rigore sbagliato, -0.5 ammonizione, -1 espulsione, -2 autorete).',
      colore: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    {
      sigla: 'GOL / CS',
      nomeCompleto: 'Gol Fatti (Giocatori di Movimento) / Clean Sheet (Portieri)',
      descrizione: 'Per difensori, centrocampisti e attaccanti indica il numero totale di gol segnati (+3). Per i portieri indica le gare concluse senza subire alcun gol (porta inviolata).',
      colore: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      sigla: 'ASSIST / RP',
      nomeCompleto: 'Assist Forniti (Movimento) / Rigori Parati (Portieri)',
      descrizione: 'Per i giocatori di movimento rappresenta i passaggi decisivi tramutati in gol (+1). Per i portieri indica il numero di penalty parati o neutralizzati durante la stagione (+3).',
      colore: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      sigla: 'RIG',
      nomeCompleto: 'Rigoristi & Realizzazioni',
      descrizione: 'Indica se il giocatore è il tiratore designato dal dischetto (1°, 2° o 3° rigorista nelle gerarchie di squadra) e il bilancio gol segnati su rigori calciati (es. 5/6).',
      colore: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    {
      sigla: '🟨 / 🟥',
      nomeCompleto: 'Ammonizioni & Espulsioni (Cartellini)',
      descrizione: 'Conteggio dei cartellini gialli (-0.5 malus ciascuno) e dei cartellini rossi diretti o per doppia ammonizione (-1 malus). Utile per valutare la fallosità.',
      colore: 'bg-amber-100/60 text-amber-900 border-amber-300',
    },
    {
      sigla: 'REND',
      nomeCompleto: 'Rendimento Index (0 - 100)',
      descrizione: 'Algoritmo proprietario sintetico che pesa in percentuale presenze, fantamedia, continuità di voto, bonus pesanti, disciplina e affidabilità per quantificare l’efficienza complessiva.',
      colore: 'bg-purple-50 text-purple-900 border-purple-300',
    },
    {
      sigla: 'Target FM',
      nomeCompleto: 'Target Prezzo Asta Consigliato',
      descrizione: 'Stima del prezzo equo in crediti da spendere all’asta, parametrata sui budget standard (500 o 1000 Fantamilioni) e correlata alla percentuale consigliata di spesa per reparto.',
      colore: 'bg-slate-100 text-slate-900 border-slate-300',
    },
    {
      sigla: 'Tier (T1 - T5)',
      nomeCompleto: 'Fasce / Livelli di Scelta',
      descrizione: 'Tier 1 = Top di reparto assoluti; Tier 2 = Semitop ad alto rendimento; Tier 3 = Titolari affidabili a voto sicuro; Tier 4 = Scommesse/Low-Cost; Tier 5 = Jolly e slot finali.',
      colore: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      sigla: 'xG / xA',
      nomeCompleto: 'Expected Goals & Expected Assists',
      descrizione: 'Metrica statistica avanzata che stima quanti gol (xG) o quanti assist (xA) un giocatore avrebbe dovuto produrre in base alla qualità e pericolosità delle occasioni generate.',
      colore: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-blue-500 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Legenda & Guida alle Sigle
              </h2>
              <p className="text-xs text-slate-400">Guida alla lettura delle statistiche 2025/26 e indici d'asta</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table / Cards */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {abbreviations.map((item) => (
              <div
                key={item.sigla}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black font-mono border ${item.colore}`}>
                    {item.sigla}
                  </span>
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{item.nomeCompleto}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.descrizione}</p>
              </div>
            ))}
          </div>

          {/* Bonus / Malus Rules Recap */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-700 mb-2.5 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Riepilogo Punteggi Bonus & Malus Ufficiali Fantacalcio</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 font-mono">
              <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                <span className="font-bold text-emerald-700">+3.0</span> Gol segnato
              </div>
              <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                <span className="font-bold text-emerald-700">+1.0</span> Assist vincente
              </div>
              <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                <span className="font-bold text-emerald-700">+3.0</span> Rigore parato
              </div>
              <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                <span className="font-bold text-emerald-700">+1.0</span> Porta inviolata (Clean Sheet)
              </div>
              <div className="bg-rose-50/70 p-2 rounded border border-rose-200">
                <span className="font-bold text-rose-700">-1.0</span> Gol subito
              </div>
              <div className="bg-rose-50/70 p-2 rounded border border-rose-200">
                <span className="font-bold text-rose-700">-3.0</span> Rigore fallito
              </div>
              <div className="bg-amber-50/70 p-2 rounded border border-amber-200">
                <span className="font-bold text-amber-700">-0.5</span> Cartellino Giallo 🟨
              </div>
              <div className="bg-rose-50/70 p-2 rounded border border-rose-200">
                <span className="font-bold text-rose-700">-1.0</span> Cartellino Rosso 🟥
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Ho capito, chiudi legenda
          </button>
        </div>
      </div>
    </div>
  );
};
