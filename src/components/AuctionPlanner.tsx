import React, { useState } from 'react';
import { Player, Role } from '../types/fantacalcio';
import { Trash2, Plus, Download, DollarSign, Users, Award, Sparkles, Check, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuctionPlannerProps {
  targetPlayers: Player[];
  onRemoveTarget: (player: Player) => void;
  onClearTargets: () => void;
  budgetBase: 500 | 1000;
  onSelectPlayer: (player: Player) => void;
}

export const AuctionPlanner: React.FC<AuctionPlannerProps> = ({
  targetPlayers,
  onRemoveTarget,
  onClearTargets,
  budgetBase,
  onSelectPlayer,
}) => {
  const [purchasedPlayers, setPurchasedPlayers] = useState<Map<string, number>>(new Map());

  const togglePurchased = (playerId: string, price: number) => {
    const next = new Map(purchasedPlayers);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.set(playerId, price);
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.8 },
      });
    }
    setPurchasedPlayers(next);
  };

  const updatePurchasePrice = (playerId: string, newPrice: number) => {
    const next = new Map(purchasedPlayers);
    next.set(playerId, Math.max(1, newPrice));
    setPurchasedPlayers(next);
  };

  // Group targets by role
  const goalkeepers = targetPlayers.filter((p) => p.ruolo === 'P');
  const defenders = targetPlayers.filter((p) => p.ruolo === 'D');
  const midfielders = targetPlayers.filter((p) => p.ruolo === 'C');
  const attackers = targetPlayers.filter((p) => p.ruolo === 'A');

  // Budget calculations
  let spentBudget = 0;
  purchasedPlayers.forEach((p) => {
    spentBudget += p;
  });
  const remainingBudget = Number(budgetBase) - spentBudget;
  const remainingSlots = 25 - purchasedPlayers.size;
  const maxBidPossible = Math.max(1, remainingBudget - Math.max(0, remainingSlots - 1));

  const exportTargets = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          targetPlayers.map((p) => ({
            nome: p.nome,
            ruolo: p.ruolo,
            squadra: p.squadra,
            fantaMedia: p.fantaMedia,
            prezzoConsigliato: budgetBase === 500 ? p.prezzoConsigliato500 : p.prezzoConsigliato1000,
            slot: p.slotConsigliato,
            acquistato: purchasedPlayers.has(p.id),
            prezzoReale: purchasedPlayers.get(p.id) || 0,
          })),
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FantaScout_Auction_Planner_${budgetBase}FM.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Stats Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span>Asta Live & Squad Planner (Budget {budgetBase} FM)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestisci i tuoi bersagli, registra gli acquisti in tempo reale e calcola l'offerta massima disponibile per chiudere la rosa di 25 elementi.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={exportTargets}
              disabled={targetPlayers.length === 0}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Auction List</span>
            </button>
            {targetPlayers.length > 0 && (
              <button
                onClick={onClearTargets}
                className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Svuota Target</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Budget Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Budget Iniziale</div>
            <div className="text-lg font-black text-slate-900 font-mono">{budgetBase} FM</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Crediti Spesi</div>
            <div className="text-lg font-black text-rose-600 font-mono">{spentBudget} FM</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Budget Rimanente</div>
            <div className="text-lg font-black text-emerald-600 font-mono">{remainingBudget} FM</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Slot da Riempire</div>
            <div className="text-lg font-bold text-blue-700 font-mono">{remainingSlots} / 25</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Max Offerta Possibile</div>
            <div className="text-lg font-black text-amber-600 font-mono">{maxBidPossible} FM</div>
          </div>
        </div>
      </div>

      {/* Target sections by role */}
      {targetPlayers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 mb-1">Nessun giocatore nei Bersagli Asta</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Naviga tra le liste dei 60 Portieri, 60 Difensori, 60 Centrocampisti e 60 Attaccanti e clicca sul pulsante "+ Target" per costruire la tua lista bersagli personalizzata.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portieri */}
          <RoleTargetBlock
            title="Portieri (Target Consigliati: 3)"
            role="P"
            players={goalkeepers}
            purchasedMap={purchasedPlayers}
            budgetBase={budgetBase}
            onTogglePurchase={togglePurchased}
            onUpdatePrice={updatePurchasePrice}
            onRemoveTarget={onRemoveTarget}
            onSelectPlayer={onSelectPlayer}
          />

          {/* Difensori */}
          <RoleTargetBlock
            title="Difensori (Target Consigliati: 8)"
            role="D"
            players={defenders}
            purchasedMap={purchasedPlayers}
            budgetBase={budgetBase}
            onTogglePurchase={togglePurchased}
            onUpdatePrice={updatePurchasePrice}
            onRemoveTarget={onRemoveTarget}
            onSelectPlayer={onSelectPlayer}
          />

          {/* Centrocampisti */}
          <RoleTargetBlock
            title="Centrocampisti (Target Consigliati: 8)"
            role="C"
            players={midfielders}
            purchasedMap={purchasedPlayers}
            budgetBase={budgetBase}
            onTogglePurchase={togglePurchased}
            onUpdatePrice={updatePurchasePrice}
            onRemoveTarget={onRemoveTarget}
            onSelectPlayer={onSelectPlayer}
          />

          {/* Attaccanti */}
          <RoleTargetBlock
            title="Attaccanti (Target Consigliati: 6)"
            role="A"
            players={attackers}
            purchasedMap={purchasedPlayers}
            budgetBase={budgetBase}
            onTogglePurchase={togglePurchased}
            onUpdatePrice={updatePurchasePrice}
            onRemoveTarget={onRemoveTarget}
            onSelectPlayer={onSelectPlayer}
          />
        </div>
      )}
    </div>
  );
};

interface RoleTargetBlockProps {
  title: string;
  role: Role;
  players: Player[];
  purchasedMap: Map<string, number>;
  budgetBase: 500 | 1000;
  onTogglePurchase: (id: string, price: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveTarget: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

const RoleTargetBlock: React.FC<RoleTargetBlockProps> = ({
  title,
  role,
  players,
  purchasedMap,
  budgetBase,
  onTogglePurchase,
  onUpdatePrice,
  onRemoveTarget,
  onSelectPlayer,
}) => {
  const roleTheme = {
    P: 'text-amber-800 border-amber-200 bg-amber-50',
    D: 'text-sky-800 border-sky-200 bg-sky-50',
    C: 'text-emerald-800 border-emerald-200 bg-emerald-50',
    A: 'text-rose-800 border-rose-200 bg-rose-50',
  }[role];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className={`p-3.5 border-b flex items-center justify-between font-bold text-xs uppercase tracking-wider ${roleTheme}`}>
        <span>{title}</span>
        <span className="bg-white/80 px-2 py-0.5 rounded text-[11px] font-mono shadow-2xs">
          {players.filter((p) => purchasedMap.has(p.id)).length} / {players.length} presi
        </span>
      </div>

      <div className="p-3 space-y-2">
        {players.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">Nessun bersaglio inserito per questo ruolo</div>
        ) : (
          players.map((p) => {
            const isBought = purchasedMap.has(p.id);
            const defaultPrice = budgetBase === 500 ? p.prezzoConsigliato500 : p.prezzoConsigliato1000;
            const currentPrice = purchasedMap.get(p.id) || defaultPrice;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                  isBought
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      onClick={() => onSelectPlayer(p)}
                      className="font-extrabold text-sm text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                    >
                      {p.nome}
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">({p.squadra})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>FM: <strong className="text-emerald-600 font-mono">{p.fantaMedia.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>{p.slotConsigliato}</span>
                  </div>
                </div>

                {/* Price & Buy Action */}
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Stima: {defaultPrice} FM</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="1"
                        max={budgetBase}
                        value={currentPrice}
                        onChange={(e) => onUpdatePrice(p.id, parseInt(e.target.value) || 1)}
                        className="w-14 px-1.5 py-0.5 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-500 font-mono font-semibold">FM</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onTogglePurchase(p.id, currentPrice)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isBought
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 hover:bg-blue-600 hover:text-white text-slate-700 shadow-2xs'
                    }`}
                  >
                    {isBought ? 'Preso! ✓' : 'Segna Preso'}
                  </button>

                  <button
                    onClick={() => onRemoveTarget(p)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Rimuovi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
