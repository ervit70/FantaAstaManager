import React from 'react';
import { Player } from '../types/fantacalcio';
import { X, Trash2, Users } from 'lucide-react';

interface CompareModalProps {
  players: Player[];
  onClose: () => void;
  onRemovePlayer: (player: Player) => void;
  onClearAll: () => void;
  budgetBase: 500 | 1000;
  onSelectPlayer: (player: Player) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  players,
  onClose,
  onRemovePlayer,
  onClearAll,
  budgetBase,
  onSelectPlayer,
}) => {
  if (players.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b-2 border-blue-500 flex items-center justify-between bg-slate-900 text-white sticky top-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Confronto Giocatori ({players.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Analisi comparativa del rendimento 2025/2026 e target asta</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg border border-red-500/40 hover:bg-red-950/30 flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Svuota</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Comparison Grid */}
        <div className="p-6 overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-3 w-44 text-slate-500 font-mono uppercase font-bold">Parametro</th>
                {players.map((p) => (
                  <th key={p.id} className="py-3 px-4 min-w-[200px]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-base font-extrabold text-slate-900 block">{p.nome}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.squadra} • {p.ruolo}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemovePlayer(p)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Rimuovi"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {/* Rendimento Index */}
              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Rendimento Index</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-black text-sm text-blue-600">
                    {p.rendimentoIndex} / 100
                  </td>
                ))}
              </tr>

              {/* FantaMedia */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">FantaMedia 25/26</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-sm text-emerald-600">
                    {p.fantaMedia.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Media Voto */}
              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Media Voto Pura</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {p.mediaVoto.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Gol / Clean Sheet */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">Gol Fatti / Clean Sheet</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-rose-600">
                    {p.ruolo === 'P' ? `${p.cleanSheet} clean sheet` : `${p.golFatti} gol`}
                  </td>
                ))}
              </tr>

              {/* Assist / Rigori Parati */}
              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Assist / Rigori Parati</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-sky-600">
                    {p.ruolo === 'P' ? `${p.rigoriParati} rig. parati` : `${p.assist} assist`}
                  </td>
                ))}
              </tr>

              {/* Rigori */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">Status Rigorista</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-medium">
                    {p.rigorista ? (
                      <span className="text-amber-800 font-bold">
                        🎯 {p.rigoristaOrdine}° ordine ({p.rigoriSegnati}/{p.rigoriTirati})
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Presenze & Minuti */}
              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Presenze & Minuti</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-700 font-medium">
                    {p.presenze} gare ({p.minutiGiocati}')
                  </td>
                ))}
              </tr>

              {/* Cartellini */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">Ammonizioni / Espulsioni</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono text-slate-700">
                    🟨 {p.ammonizioni} | 🟥 {p.espulsioni}
                  </td>
                ))}
              </tr>

              {/* Tactical indices */}
              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Affidabilità Fisica</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-emerald-600">
                    {p.affidabilitaFisica} / 10
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">Costanza Voto</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-blue-600">
                    {p.costanzaVoto} / 10
                  </td>
                ))}
              </tr>

              <tr className="bg-slate-50/60">
                <td className="py-3 px-3 font-bold text-slate-700">Appeal Bonus</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-amber-600">
                    {p.appealBonus} / 10
                  </td>
                ))}
              </tr>

              {/* Recommended Price */}
              <tr className="bg-blue-50/80">
                <td className="py-3 px-3 font-black text-blue-900">Target Prezzo ({budgetBase} FM)</td>
                {players.map((p) => {
                  const price = budgetBase === 500 ? p.prezzoConsigliato500 : p.prezzoConsigliato1000;
                  return (
                    <td key={p.id} className="py-3 px-4 font-mono">
                      <span className="text-base font-black text-slate-900">{price} FM</span>
                      <span className="text-xs text-slate-500 ml-1">({p.targetPrezzoPercentuale}%)</span>
                    </td>
                  );
                })}
              </tr>

              {/* Strategic Advice */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-700">Consiglio Asta</td>
                {players.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-xs text-slate-700 leading-relaxed font-medium">
                    {p.consiglioAsta}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
