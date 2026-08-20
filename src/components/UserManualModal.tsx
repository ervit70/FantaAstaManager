import React, { useState } from 'react';
import { 
  X, BookOpen, Zap, Settings, Trophy, FileSpreadsheet, 
  DollarSign, CheckCircle2, ChevronRight, Coins, 
  HelpCircle, ArrowRight, ShieldCheck, Download, Hash
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegistry?: () => void;
  onOpenSquads?: () => void;
  onOpenExcel?: () => void;
}

type ChapterId = 'quickstart' | 'config' | 'auction' | 'excel' | 'planner' | 'rosters' | 'faq';

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onOpenRegistry,
  onOpenSquads,
  onOpenExcel,
}) => {
  const [activeChapter, setActiveChapter] = useState<ChapterId>('quickstart');

  if (!isOpen) return null;

  const chapters: { id: ChapterId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'quickstart', label: '1. Guida Rapida (3 Passi)', icon: <Zap className="w-4 h-4 text-amber-400" />, badge: 'Primi Passi' },
    { id: 'config', label: '2. Configurazione Squadre & Budget', icon: <Settings className="w-4 h-4 text-blue-400" /> },
    { id: 'auction', label: '3. Gestione Asta Live', icon: <Coins className="w-4 h-4 text-emerald-400" />, badge: 'Fondamentale' },
    { id: 'excel', label: '4. Caricamento Excel Fantacalcio.it', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> },
    { id: 'planner', label: '5. Strategia & Planner', icon: <DollarSign className="w-4 h-4 text-purple-400" /> },
    { id: 'rosters', label: '6. Rose Squadre & Esportazione', icon: <Trophy className="w-4 h-4 text-amber-300" /> },
    { id: 'faq', label: '7. Domande Frequenti (FAQ)', icon: <HelpCircle className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Ribbon - Fantacalcio.it Dark Navy Header */}
        <div className="px-4 py-3 bg-[#0b172a] border-b border-blue-600/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md ring-1 ring-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                <span>Manuale & Guida Ufficiale all'Asta</span>
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-mono font-black">
                  FantaScout 26/27
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Guida passo-passo illustrata con schermate ed esempi pratici per dominare l'asta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi guida"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar Tabs + Content Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-950/50">
          
          {/* Left Navigation Sidebar */}
          <div className="w-full md:w-64 bg-slate-900/95 border-b md:border-b-0 md:border-r border-slate-800 p-2 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto smooth-horizontal-scroll">
            <div className="hidden md:block px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Indice Capitoli
            </div>
            {chapters.map((ch) => {
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap md:whitespace-normal text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    {ch.icon}
                    <span className="truncate">{ch.label}</span>
                  </div>
                  {ch.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ml-1 hidden lg:inline-block ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-300 border border-slate-700'
                    }`}>
                      {ch.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Scrollable Chapter Content */}
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto text-xs leading-relaxed space-y-4 bg-slate-900/40">
            
            {/* CHAPTER 1: QUICKSTART */}
            {activeChapter === 'quickstart' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-amber-400 uppercase tracking-tight flex items-center gap-1.5">
                    <Zap className="w-5 h-5 text-amber-400" />
                    1. Guida Rapida in 3 Semplici Passi
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Tutto quello che ti serve per essere operativo all'asta in meno di 2 minuti.
                  </p>
                </div>

                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center font-mono text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-slate-100 text-xs">Configura le Squadre & Numero Partecipanti</h4>
                    <p className="text-slate-400 text-[11px]">
                      Clicca su <strong>"⚙️ Budget"</strong> per impostare il numero di partecipanti (default 10, estendibile a 12, 14, ecc.), i nomi e il budget iniziale (es. 700 FM).
                    </p>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center font-mono text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-slate-100 text-xs">Chiama e Assegna</h4>
                    <p className="text-slate-400 text-[11px]">
                      Cerca il calciatore, seleziona la squadra dal menu a tendina e digita la <strong>Cifra Asta</strong> vinta.
                    </p>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-slate-100 text-xs">Controlla i Residui</h4>
                    <p className="text-slate-400 text-[11px]">
                      Il budget residuo di tutte le squadre si aggiorna in tempo reale sul nastro in alto senza errori di calcolo!
                    </p>
                  </div>
                </div>

                {/* VISUAL SCREENSHOT MOCKUP 1 */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono border-b border-slate-800 pb-1">
                    <span className="text-amber-300 font-bold">📸 SCHERMATA: Nastro Residuo Squadre in Tempo Reale</span>
                    <span>Squadre Sincronizzate</span>
                  </div>
                  
                  {/* Live Simulation Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-nowrap overflow-x-auto gap-2">
                    <div className="min-w-[125px] bg-slate-800 border border-slate-700 rounded p-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-white">1 Squadra 1</span>
                        <span className="text-slate-400 font-mono">0/25</span>
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded font-black font-mono text-[11px] border border-emerald-700">
                        700 FM
                      </div>
                    </div>

                    <div className="min-w-[125px] bg-blue-950/80 border border-blue-500 rounded p-1.5 ring-1 ring-blue-400">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-amber-300">2 Squadra 2</span>
                        <span className="text-amber-300 font-mono">5/25</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-1.5 py-0.5 bg-amber-950 text-amber-300 rounded font-black font-mono text-[11px] border border-amber-700">
                          650 FM
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">-50 spesi</span>
                      </div>
                    </div>

                    <div className="min-w-[125px] bg-slate-800 border border-slate-700 rounded p-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-white">3 Squadra 3</span>
                        <span className="text-slate-400 font-mono">0/25</span>
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded font-black font-mono text-[11px] border border-emerald-700">
                        700 FM
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    💡 <strong>Consiglio Pro:</strong> Clicca su una squadra nel nastro per filtrare all'istante solo i giocatori acquistati da quel fanta-allenatore!
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 2: CONFIGURATION */}
            {activeChapter === 'config' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-blue-400 uppercase tracking-tight flex items-center gap-1.5">
                    <Settings className="w-5 h-5 text-blue-400" />
                    2. Configurazione Numero Squadre & Budget Iniziale
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Come impostare il numero di partecipanti (default 10 squadre, estendibile), personalizzare i nomi dei fanta-allenatori e impostare i crediti di partenza.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Come aprire l'Anagrafica Squadre
                    </h4>
                    <p className="text-slate-300 text-xs">
                      1. Clicca sul pulsante <strong>"⚙️ Budget"</strong> presente nella barra del residuo o nel menu.<br/>
                      2. <strong>Parametro di Sistema Numero Squadre:</strong> Il sistema è preimpostato su <strong>10 squadre</strong>. Se la tua lega conta 8, 12, 14 o più partecipanti, seleziona il numero desiderato: le nuove squadre verranno istantaneamente generate pronte da personalizzare!<br/>
                      3. <strong>🛡️ Protezione Anti-Errore Asta in Corso:</strong> Se modifichi per errore il numero di squadre durante l'asta, il sistema <strong>blocca la cancellazione e protegge i dati</strong>! I calciatori già assegnati, i prezzi pagati e i nomi personalizzati vengono conservati al 100% in cassaforte di sicurezza senza perdita di informazioni.<br/>
                      4. Per ciascuna squadra puoi inserire il <strong>Nome Personalizzato</strong>, i <strong>Capitani</strong> e il <strong>Budget Iniziale</strong> (default 700 FM).<br/>
                      5. Puoi usare i tasti rapidi <strong>"Imposta per tutte: 500 FM / 700 FM / 1000 FM"</strong> per compilare all'istante tutte le squadre.<br/>
                      6. In qualunque momento puoi premere il tasto <strong>"🔄 Ripristina Nomi Iniziali (Stato Vergine)"</strong> per azzerare e riportare i nomi allo stato pulito iniziale (Squadra 1...N).
                    </p>
                  </div>

                  {/* VISUAL SCREENSHOT MOCKUP 2 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="text-[10.5px] text-amber-300 font-bold font-mono border-b border-slate-800 pb-1">
                      📸 SCHERMATA: Modale Gestione Squadre e Budget
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded border border-slate-700">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center font-mono">1</span>
                          <span className="font-bold text-white text-xs flex-1">Squadra 1</span>
                          <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">700 FM</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded border border-slate-700">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center font-mono">2</span>
                          <span className="font-bold text-white text-xs flex-1">Squadra 2</span>
                          <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">700 FM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {onOpenRegistry && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRegistry();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Apri ora l'Anagrafica Squadre & Budget</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CHAPTER 3: AUCTION MANAGEMENT */}
            {activeChapter === 'auction' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1.5">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    3. Gestione Asta Live & Assegnazione Calciatori
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Come registrare i giocatori acquistati, inserire il prezzo pagato e correggere errori al volo.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Procedura di Assegnazione in Diretta
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                      <li>Usa la <strong>barra di ricerca</strong> in alto per digitare il nome del calciatore (es. <em>"Lautaro", "De Bruyne"</em>).</li>
                      <li>Nella colonna <strong>"Acquirente / Squadra"</strong>, apri il menu a tendina e scegli la squadra vincitrice.</li>
                      <li>Nel campo <strong>"Cifra Asta (FM)"</strong> digita il prezzo a cui è stato aggiudicato.</li>
                      <li>I crediti vengono <strong>immediatamente scalati</strong> dal budget della squadra e sommati al monte spesi.</li>
                    </ul>
                  </div>

                  {/* VISUAL SCREENSHOT MOCKUP 3 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="text-[10.5px] text-amber-300 font-bold font-mono border-b border-slate-800 pb-1">
                      📸 SCHERMATA: Esempio di riga durante l'Asta
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-2 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center font-mono">C</span>
                        <span className="font-black text-white">De Bruyne Kevin</span>
                        <span className="text-[10px] text-slate-400">Inter</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded bg-blue-900/90 text-blue-200 border border-blue-500 font-bold text-[11px]">
                          2 Squadra 2
                        </span>
                        <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black font-mono text-[11px]">
                          50 FM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/80 rounded-lg p-3 text-amber-200 text-xs">
                    ⚠️ <strong>Come Correggere un Errore:</strong> Se hai sbagliato assegnazione o prezzo, ti basta riselezionare <strong>"— Libero —"</strong> dal menu a tendina: il calciatore tornerà libero e i crediti verranno istantaneamente riaccreditati al budget della squadra!
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 4: EXCEL UFFICIALE FANTACALCIO.IT */}
            {activeChapter === 'excel' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-emerald-300 uppercase tracking-tight flex items-center gap-1.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                    4. Caricamento Excel Ufficiale da Fantacalcio.it
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Come scaricare e importare il file originale di Fantacalcio.it aggiornato a fine calciomercato.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* CALENDAR WARNING BOX */}
                  <div className="bg-emerald-950/50 border-2 border-emerald-500 rounded-xl p-3.5 space-y-2 text-slate-200">
                    <div className="flex items-center space-x-2 text-emerald-300 font-black text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>Stato Listone Ufficiale & Date Chiave Calciomercato</span>
                    </div>
                    <p className="text-xs">
                      📅 <strong>Situazione Attuale (Oggi 20 Agosto 2026):</strong> L'app include il listone aggiornato con tutti i colpi e i ruoli di agosto.<br/>
                      🚨 <strong>Chiusura Mercato & File Definitivo (2 Settembre 2026):</strong> Non appena chiuderà la finestra ufficiale di calciomercato, potrai scaricare il file Excel definitivo al 100% direttamente da Fantacalcio.it e caricarlo nell'app in 2 secondi.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-400" />
                      Procedura per Scaricare e Caricare il File:
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
                      <li>Vai su <strong className="text-blue-400">www.fantacalcio.it/quotazioni-fantacalcio</strong>.</li>
                      <li>Clicca su <strong>"Scarica Excel / Quotazioni"</strong> (file <em>.xlsx</em> o <em>.csv</em>).</li>
                      <li>Nella nostra app, clicca sul pulsante verde <strong>"Carica Lega Serie A"</strong> in alto.</li>
                      <li>Trascina o seleziona il file scaricato: l'algoritmo caricherà i ruoli, quotazioni, FVM, statistiche 25/26 e rigoristi in tempo reale!</li>
                    </ol>
                  </div>

                  {onOpenExcel && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExcel();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Apri Gestione File Excel Serie A</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CHAPTER 5: STRATEGY & AUCTION PLANNER */}
            {activeChapter === 'planner' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-purple-400 uppercase tracking-tight flex items-center gap-1.5">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    5. Strategia, Fasce (Tier) & Auction Planner
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Pianifica i tuoi obiettivi e calcola la spesa ideale reparto per reparto.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs">
                      ⭐ Obiettivi Personali & Filtri Rapidi
                    </h4>
                    <p className="text-slate-300 text-xs">
                      • Clicca sulla <strong>stella ⭐</strong> accanto a qualsiasi calciatore per aggiungerlo ai tuoi "Obiettivi Asta".<br/>
                      • Usa i filtri rapidi in cima alla tabella per isolare: <strong>Rigoristi</strong>, <strong>Tiratori di Punizioni/Corner</strong>, <strong>Nuovi arrivati dall'estero</strong> e fasce di rendimento (Tier 1 Top fino a Tier 5 Jolly).
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs">
                      💰 Auction Planner (Budget Allocator)
                    </h4>
                    <p className="text-slate-300 text-xs">
                      Clicca sul tab <strong>"Planner"</strong> nella barra di navigazione: potrai simulare la distribuzione ideale del budget (es. <em>Porta 7%, Difesa 18%, Centrocampo 30%, Attacco 45%</em>) e visualizzare il costo cumulativo dei tuoi obiettivi prima di iniziare a spendere!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 6: ROSTERS */}
            {activeChapter === 'rosters' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-amber-300 uppercase tracking-tight flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-300" />
                    6. Rose Squadre & Esportazione
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Controllo completo dei 25 slot per ciascuna squadra e download dei resoconti finali.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs">
                      🏆 Finestra "Rose Squadre"
                    </h4>
                    <p className="text-slate-300 text-xs">
                      Cliccando su <strong>"Rose Squadre"</strong> puoi consultare le formazioni di tutte le squadre suddivise con precisione per ruolo (Portieri, Difensori, Centrocampisti, Attaccanti).<br/>
                      Visualizzi all'istante: totale calciatori (x/25), crediti spesi, crediti residui e media crediti rimasti per slot libero.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      Esportazione Excel di tutte le Rose
                    </h4>
                    <p className="text-slate-300 text-xs">
                      All'interno della finestra delle rose troverai il tasto <strong>"Esporta Rose Excel"</strong>: genererà un file Excel multi-foglio completo con ogni rosa, i prezzi pagati e le statistiche, pronto da inviare nel gruppo WhatsApp della lega!
                    </p>
                  </div>

                  {onOpenSquads && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSquads();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Visualizza le Rose delle Squadre</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CHAPTER 7: FAQ */}
            {activeChapter === 'faq' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-slate-300 uppercase tracking-tight flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                    7. Domande Frequenti (FAQ)
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Risposte alle domande più comuni sull'utilizzo dell'app.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 space-y-1">
                    <h5 className="font-bold text-amber-300 text-xs">I dati rimangono salvati se chiudo la pagina o il browser?</h5>
                    <p className="text-slate-300 text-[11.5px]">
                      <strong>Sì, al 100%!</strong> L'app sincronizza istantaneamente ogni click e ogni modifica sia sul database locale che nel Cloud in tempo reale.
                    </p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 space-y-1">
                    <h5 className="font-bold text-amber-300 text-xs">Possiamo essere in più o meno di 10 persone alla nostra asta?</h5>
                    <p className="text-slate-300 text-[11.5px]">
                      <strong>Assolutamente sì!</strong> Il parametro di sistema di default è impostato su 10 squadre, ma aprendo <em>"⚙️ Budget"</em> puoi scegliere 8, 12, 14, 16 o digitare un numero personalizzato da 4 a 20 squadre: tutte le schermate si adatteranno istantaneamente.
                    </p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 space-y-1">
                    <h5 className="font-bold text-amber-300 text-xs">Posso gestire più leghe contemporaneamente (es. Lega Amici e Lega Lavoro)?</h5>
                    <p className="text-slate-300 text-[11.5px]">
                      <strong>Sì!</strong> In alto trovi la barra dei <strong>Fogli Leghe (in stile Excel)</strong>. Clicca su <strong>"+ Nuovo Foglio Lega"</strong> per creare un'altra lega completamente separata con le proprie squadre e budget indipendenti.
                    </p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 space-y-1">
                    <h5 className="font-bold text-amber-300 text-xs">L'applicazione funziona bene anche su Smartphone?</h5>
                    <p className="text-slate-300 text-[11.5px]">
                      <strong>Sì!</strong> L'interfaccia è completamente reattiva per smartphone, con tasti d'azione veloci, barra a scorrimento orizzontale e visualizzazioni a schede compatte per un'asta fluida.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Guida Ufficiale FantaScout 26/27 • Sincronizzazione Cloud Attiva
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer ml-auto"
          >
            Ho Capito, Chiudi Guida
          </button>
        </div>

      </div>
    </div>
  );
};
