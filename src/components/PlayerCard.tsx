import React, { useState, useMemo, useEffect } from 'react';
import { Player, LeagueTeam } from '../types/fantacalcio';
import { Plus, Check, Eye, Trophy, Coins } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  budgetBase: 500 | 1000;
  onSelectPlayer: (player: Player) => void;
  isTargeted: boolean;
  onToggleTarget: (player: Player) => void;
  isCompared: boolean;
  onToggleCompare: (player: Player) => void;
  teams: LeagueTeam[];
  assignedTeamId?: string;
  paidPrice?: number;
  onAssignPlayer: (playerId: string, teamId: string) => void;
  onUpdatePlayerPrice?: (playerId: string, price: number) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  budgetBase,
  onSelectPlayer,
  isTargeted,
  onToggleTarget,
  teams,
  assignedTeamId = '',
  paidPrice,
  onAssignPlayer,
  onUpdatePlayerPrice,
}) => {
  const price = budgetBase === 500 ? player.prezzoConsigliato500 : player.prezzoConsigliato1000;
  const assignedTeam = teams.find((t) => t.id === assignedTeamId);

  const [priceInput, setPriceInput] = useState<string>(paidPrice !== undefined ? String(paidPrice) : '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setPriceInput(paidPrice !== undefined ? String(paidPrice) : '');
  }, [paidPrice]);

  const handleSavePrice = () => {
    if (!onUpdatePlayerPrice) return;
    const num = priceInput.trim() === '' ? 0 : parseInt(priceInput, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdatePlayerPrice(player.id, num);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1200);
    }
  };

  // Teams sorted alphabetically by name
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }));
  }, [teams]);

  // Role color palette
  const roleBadgeStyle = {
    P: 'bg-amber-100/90 text-amber-900 border-amber-300',
    D: 'bg-sky-100/90 text-sky-900 border-sky-300',
    C: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    A: 'bg-rose-100/90 text-rose-900 border-rose-300',
  }[player.ruolo];

  // Tier styling
  const getTierBadge = (tier: string) => {
    if (tier.includes('Tier 1')) return 'bg-amber-50 text-amber-900 border-amber-300';
    if (tier.includes('Tier 2')) return 'bg-emerald-50 text-emerald-900 border-emerald-300';
    if (tier.includes('Tier 3')) return 'bg-blue-50 text-blue-900 border-blue-200';
    if (tier.includes('Tier 4')) return 'bg-purple-50 text-purple-900 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`bg-white border rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all relative group ${
      assignedTeam ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-blue-400'
    }`}>
      {/* Top badges bar */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <span className={`px-2 py-0.5 rounded font-black text-xs border font-mono ${roleBadgeStyle}`}>
              {player.ruolo}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700 border border-slate-200 truncate max-w-[80px]">
              {player.squadra}
            </span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getTierBadge(player.tier)}`}>
              {player.tier.replace('Tier ', 'T')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
              {player.rendimentoIndex}
            </span>
          </div>
        </div>

        {/* Player Name */}
        <div className="mb-2">
          <h3
            onClick={() => onSelectPlayer(player)}
            className="text-sm font-black text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-tight line-clamp-1"
            title={player.nome}
          >
            {player.nome}
          </h3>
          <div className="flex items-center space-x-1 mt-0.5 text-[10px] text-slate-500">
            <span>{player.slotConsigliato}</span>
            {player.rigorista && (
              <span className="text-amber-700 font-bold flex items-center">
                • 🎯 Rigorista
              </span>
            )}
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-4 gap-1 py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center font-mono text-[11px] mb-2">
          <div>
            <span className="text-[9px] text-slate-400 block font-semibold">FM</span>
            <span className="font-bold text-emerald-700">{player.fantaMedia.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-semibold">MV</span>
            <span className="font-bold text-slate-700">{player.mediaVoto.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-semibold">{player.ruolo === 'P' ? 'CS' : 'GOL'}</span>
            <span className="font-bold text-rose-600">{player.ruolo === 'P' ? player.cleanSheet : player.golFatti}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-semibold">{player.ruolo === 'P' ? 'RP' : 'ASS'}</span>
            <span className="font-bold text-sky-600">{player.ruolo === 'P' ? player.rigoriParati : player.assist}</span>
          </div>
        </div>
      </div>

      {/* Target Price & Action Controls */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Asta ({budgetBase})</span>
            <span className="text-xs font-mono font-black text-slate-900">{price} FM</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleTarget(player)}
              className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                isTargeted
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 shadow-2xs'
              }`}
            >
              {isTargeted ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              <span>{isTargeted ? 'Target' : '+ Target'}</span>
            </button>

            <button
              onClick={() => onSelectPlayer(player)}
              title="Dettagli e Scheda Completa"
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Menu a tendina Assegnazione Squadra Fantacalcio & Input Prezzo */}
        <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-tight flex items-center space-x-0.5">
              <Trophy className="w-2.5 h-2.5 text-amber-500" />
              <span>Squadra Aggiudicataria:</span>
            </label>
            {assignedTeam && (
              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1 py-0.1 rounded">
                Acquistato
              </span>
            )}
          </div>
          <select
            value={assignedTeamId}
            onChange={(e) => onAssignPlayer(player.id, e.target.value)}
            className={`w-full py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer truncate ${
              assignedTeamId
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <option value="">— Libero / Svincolato —</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>

          {/* Prezzo Asta & Salva */}
          {onUpdatePlayerPrice && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
              <div className="flex items-center space-x-1">
                <Coins className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-slate-600">Prezzo Asta:</span>
              </div>

              {assignedTeamId ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={priceInput}
                    placeholder="0"
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                    className="w-14 px-1.5 py-0.5 text-center bg-amber-50 border border-amber-400 rounded text-xs font-mono font-black text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                  />
                  <span className="text-[10px] font-bold text-slate-400">FM</span>

                  <button
                    type="button"
                    onClick={handleSavePrice}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer flex items-center space-x-0.5 ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                    }`}
                  >
                    {isSaved ? <Check className="w-2.5 h-2.5" /> : <span>Salva</span>}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Libero (—)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
