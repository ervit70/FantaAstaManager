import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Player, Role, Tier } from '../types/fantacalcio';
import { enrichPlayersDatabase } from '../utils/playerEnricher';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileText, 
  Trash2,
  Check,
  Layers,
  DatabaseZap,
  Activity,
  Cloud,
  Sparkles,
  Search,
  Globe,
  Loader2
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayers: Player[];
  isCustomDataActive: boolean;
  onApplyCustomPlayers: (players: Player[]) => void;
  onWipeDatabase: () => void;
  onResetToDefault: () => void;
  budgetBase: 500 | 1000;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  currentPlayers,
  isCustomDataActive,
  onApplyCustomPlayers,
  onWipeDatabase,
  onResetToDefault,
  budgetBase,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewPlayers, setPreviewPlayers] = useState<Player[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<{ current: number; total: number } | null>(null);

  // Delete DB double-confirmation modal state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to normalize role (P, D, C, A)
  const normalizeRole = (val: any): Role | null => {
    if (!val) return null;
    const s = String(val).trim().toUpperCase();
    if (s === 'P' || s.startsWith('POR') || s.includes('PORTIERE') || s === '1') return 'P';
    if (s === 'D' || s.startsWith('DIF') || s.includes('DIFENSORE') || s.startsWith('DS') || s.startsWith('DD') || s.startsWith('DC')) return 'D';
    if (s === 'C' || s.startsWith('CEN') || s.includes('CENTROCAMPISTA') || s.startsWith('M') || s.startsWith('T') || s.startsWith('E')) return 'C';
    if (s === 'A' || s.startsWith('ATT') || s.includes('ATTACCANTE') || s.startsWith('PC')) return 'A';
    return null;
  };

  // Helper to normalize numbers
  const normalizeNumber = (val: any, fallback = 0): number => {
    if (val === undefined || val === null || val === '') return fallback;
    const clean = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  };

  /**
   * Smart Parser supporting:
   * 1. Official Fantacalcio.it Excel Format (Quotazioni_Fantacalcio.xlsx):
   *    - Col B (index 1): Ruolo (P, D, C, A)
   *    - Col C (index 2): Ruolo Mantra / Extra (es. Por, Dd, Ds, Dc, E, M, C, T, W, A, Pc)
   *    - Col D (index 3): Nome e Cognome calciatore
   *    - Col E (index 4): Squadra
   *    - Col F (index 5) o Col G (index 6): Quotazione Attuale / Iniziale
   *    - Col L (index 11): FVM (FantaValore di Mercato per Asta)
   * 2. Classic Format:
   *    - Col A (0): Ruolo, Col B (1): Nome, Col C (2): Squadra, Col J (9) / Col D (3): FVM / Quotazione
   */
  const parseWorksheetToPlayers = (worksheet: XLSX.WorkSheet): { players: Player[] } => {
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawMatrix || rawMatrix.length === 0) {
      return { players: [] };
    }

    // Determine header row and column mapping
    let headerRowIndex = 0;
    let colRole = 1;      // Default Fantacalcio.it Col B
    let colRuoloExtra = 2;// Default Fantacalcio.it Col C
    let colName = 3;      // Default Fantacalcio.it Col D
    let colTeam = 4;      // Default Fantacalcio.it Col E
    let colQuotazione = 5;// Default Fantacalcio.it Col F
    let colFVM = 11;      // Default Fantacalcio.it Col L

    // Scan first 4 rows to detect headers
    for (let r = 0; r < Math.min(4, rawMatrix.length); r++) {
      const row = rawMatrix[r] || [];
      const rowStr = row.map((c) => String(c || '').toLowerCase().trim());

      const rIndex = rowStr.findIndex((c) => c === 'r' || c === 'ruolo' || c === 'role');
      const rmIndex = rowStr.findIndex((c) => c === 'rm' || c === 'ruolo mantra' || c === 'ruolo extra' || c === 'ruolomantra');
      const nameIndex = rowStr.findIndex((c) => c === 'nome' || c === 'calciatore' || c === 'giocatore' || c === 'player');
      const teamIndex = rowStr.findIndex((c) => c === 'squadra' || c === 'club' || c === 'sq');
      const fvmIndex = rowStr.findIndex((c) => c === 'fvm' || c === 'fvm classic' || c === 'fantavalore' || c === 'fvm cl');
      const qtIndex = rowStr.findIndex((c) => c === 'qt. a' || c === 'qt a' || c === 'quotazione' || c === 'qt.a' || c === 'valore' || c === 'qt. i');

      if (rIndex !== -1 && nameIndex !== -1) {
        headerRowIndex = r + 1;
        colRole = rIndex;
        colName = nameIndex;
        if (teamIndex !== -1) colTeam = teamIndex;
        if (rmIndex !== -1) colRuoloExtra = rmIndex;
        if (fvmIndex !== -1) colFVM = fvmIndex;
        if (qtIndex !== -1) colQuotazione = qtIndex;
        break;
      }
    }

    const parsed: Player[] = [];

    for (let r = headerRowIndex; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      if (!row || row.length === 0) continue;

      // Extract Role
      let rawRole = row[colRole];
      let role = normalizeRole(rawRole);

      // Fallback: If Col B is not a role, check Col A
      if (!role && normalizeRole(row[0])) {
        role = normalizeRole(row[0]);
      }

      // Extract Name
      let rawName = String(row[colName] || '').trim();
      if (!rawName && row[1] && typeof row[1] === 'string' && isNaN(Number(row[1]))) {
        rawName = String(row[1]).trim();
      }

      if (!rawName || !role) {
        continue;
      }

      // Extract Team
      let rawTeam = String(row[colTeam] || '').trim();
      if (!rawTeam && row[2] && typeof row[2] === 'string') {
        rawTeam = String(row[2]).trim();
      }
      const squadra = rawTeam || 'Serie A';

      // Extract Ruolo Extra / Mantra (Col C)
      const rawRuoloExtra = row[colRuoloExtra] ? String(row[colRuoloExtra]).trim() : undefined;

      // Extract FVM & Quotazione
      let rawFVMVal = row[colFVM];
      let rawQuotVal = row[colQuotazione];

      let fvm = normalizeNumber(rawFVMVal, 0);
      let quotazione = normalizeNumber(rawQuotVal, 0);

      // If FVM is missing, fallback to Quotazione, or Col J, or 10
      if (fvm <= 0) {
        if (quotazione > 0) {
          fvm = quotazione;
        } else if (row[9] && !isNaN(parseFloat(row[9]))) {
          fvm = normalizeNumber(row[9], 10);
        } else if (row[3] && !isNaN(parseFloat(row[3])) && typeof row[3] === 'number') {
          fvm = normalizeNumber(row[3], 10);
        } else {
          fvm = 10;
        }
      }

      if (quotazione <= 0) {
        quotazione = fvm;
      }

      fvm = Math.max(1, Math.round(fvm));
      quotazione = Math.max(1, Math.round(quotazione));

      const price500 = Math.max(1, Math.round(fvm * 1.8));
      const price1000 = Math.max(1, Math.round(fvm * 3.6));

      let tier: Tier = 'Tier 3 - Titolari Affidabili';
      if (role === 'P') {
        if (fvm >= 15) tier = 'Tier 1 - Top';
        else if (fvm >= 11) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 8) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else if (role === 'D') {
        if (fvm >= 18) tier = 'Tier 1 - Top';
        else if (fvm >= 12) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 7) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else if (role === 'C') {
        if (fvm >= 22) tier = 'Tier 1 - Top';
        else if (fvm >= 15) tier = 'Tier 2 - Semitop';
        else if (fvm <= 4) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 9) tier = 'Tier 4 - Scommesse/Low-Cost';
      } else {
        if (fvm >= 28) tier = 'Tier 1 - Top';
        else if (fvm >= 18) tier = 'Tier 2 - Semitop';
        else if (fvm <= 5) tier = 'Tier 5 - Jolly/Slot Finali';
        else if (fvm <= 12) tier = 'Tier 4 - Scommesse/Low-Cost';
      }

      let slot = '3°/4° Slot';
      if (tier === 'Tier 1 - Top') slot = '1° Slot Top';
      else if (tier === 'Tier 2 - Semitop') slot = '2° Slot Alto';
      else if (tier === 'Tier 5 - Jolly/Slot Finali') slot = 'Slot Copertura / 1 Credito';
      else if (tier === 'Tier 4 - Scommesse/Low-Cost') slot = 'Scommessa 5°/6° Slot';

      const player: Player = {
        id: `fanta-${r}-${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        nome: rawName,
        squadra,
        ruolo: role,
        ruoloEsteso: role === 'P' ? 'Portiere' : role === 'D' ? 'Difensore' : role === 'C' ? 'Centrocampista' : 'Attaccante',
        ruoloExtra: rawRuoloExtra,
        ruoloMantra: rawRuoloExtra,
        quotazione,
        fvm,
        prezzoConsigliato500: price500,
        prezzoConsigliato1000: price1000,
        slotConsigliato: slot,
        tier,
        status: 'Confermato',
        presenze: 0,
        titolarePercentuale: 50,
        minutiGiocati: 0,
        mediaVoto: 6.0,
        fantaMedia: 6.0,
        golFatti: 0,
        golSubiti: 0,
        cleanSheet: 0,
        rigoriParati: 0,
        rigoriTirati: 0,
        rigoriSegnati: 0,
        rigoriSbagliati: 0,
        assist: 0,
        ammonizioni: 0,
        espulsioni: 0,
        xG: 0,
        xA: 0,
        rendimentoIndex: Math.min(99, Math.max(50, Math.round(55 + fvm * 0.9))),
        affidabilitaFisica: 7,
        costanzaVoto: 7,
        appealBonus: fvm >= 20 ? 8 : 5,
        rischioMalus: 3,
        rigorista: (role === 'A' && fvm >= 26) || (role === 'C' && fvm >= 24),
        punizioni: fvm >= 20 && (role === 'C' || role === 'D'),
        corner: fvm >= 16 && role === 'C',
        puntiDiForza: [
          `FVM Ufficiale Fantacalcio.it: ${fvm} FM`,
          `Quotazione listone: ${quotazione}`,
          rawRuoloExtra ? `Ruolo Mantra: ${rawRuoloExtra}` : `Ruolo: ${role}`,
        ],
        criticita: ['In attesa di arricchimento statistiche stagionali'],
        consiglioAsta: `Giocatore importato da Fantacalcio.it. Prezzo consigliato: ${price500} FM (base 500) o ${price1000} FM (base 1000).`,
        fasciaConsigliata: tier === 'Tier 1 - Top' ? 'Top Assoluto' : tier === 'Tier 2 - Semitop' ? 'Titolare Fisso' : 'Titolare Fisso',
        targetPrezzoPercentuale: Number(Math.min(35, Math.max(0.5, (price500 / 500) * 100)).toFixed(1)),
      };

      parsed.push(player);
    }

    return { players: parsed };
  };

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const names = workbook.SheetNames;
        setSheetNames(names);

        if (names.length === 0) {
          setParseError('Il file Excel selezionato è vuoto.');
          setIsProcessing(false);
          return;
        }

        // Look for 'Tutti' or 'Quotazioni' or take the first sheet
        const preferredSheet = names.find((n) => {
          const l = n.toLowerCase().trim();
          return l === 'tutti' || l === 'quotazioni' || l.includes('fantacalcio') || l === 'sheet1' || l === 'foglio1';
        }) || names[0];

        setSelectedSheet(preferredSheet);
        const sheet = workbook.Sheets[preferredSheet];
        const { players } = parseWorksheetToPlayers(sheet);

        if (players.length === 0) {
          setParseError('Nessun calciatore valido trovato nel foglio selezionato. Verifica che le colonne contengano Ruolo, Nome e Squadra.');
        } else {
          setPreviewPlayers(players);
          setSuccessMessage(`Trovati ${players.length} calciatori nel foglio "${preferredSheet}". Puoi applicarli o arricchirli subito con le statistiche.`);
        }
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setParseError('Errore durante la lettura del file Excel: ' + (err.message || 'Formato non supportato'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Errore di lettura del file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Switch sheet
  const handleSheetChange = (sheetName: string) => {
    if (!file) return;
    setSelectedSheet(sheetName);
    setIsProcessing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[sheetName];
        const { players } = parseWorksheetToPlayers(sheet);

        if (players.length === 0) {
          setParseError(`Nessun calciatore valido trovato nel foglio "${sheetName}".`);
          setPreviewPlayers([]);
        } else {
          setPreviewPlayers(players);
          setSuccessMessage(`Caricati ${players.length} calciatori dal foglio "${sheetName}".`);
        }
      } catch (err: any) {
        setParseError('Errore: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Run Enrichment Engine on preview players or on current database
  const handleEnrichStats = (playersToEnrich = previewPlayers.length > 0 ? previewPlayers : currentPlayers) => {
    if (playersToEnrich.length === 0) return;
    setIsEnriching(true);
    setEnrichProgress({ current: 0, total: playersToEnrich.length });

    setTimeout(() => {
      try {
        const { enrichedPlayers, matchedCount, estimatedCount } = enrichPlayersDatabase(
          playersToEnrich,
          (curr, tot) => setEnrichProgress({ current: curr, total: tot })
        );

        if (previewPlayers.length > 0) {
          setPreviewPlayers(enrichedPlayers);
        } else {
          onApplyCustomPlayers(enrichedPlayers);
        }

        setSuccessMessage(
          `🧠 Auto-Scouting completato con successo! ${matchedCount} calciatori abbinati con statistiche storiche certificate 2025/2026 e ${estimatedCount} con proiezione algoritmica.`
        );
      } catch (e: any) {
        console.error('Enrichment error:', e);
        setParseError('Errore durante l\'arricchimento dei dati: ' + e.message);
      } finally {
        setIsEnriching(false);
        setEnrichProgress(null);
      }
    }, 150);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (previewPlayers.length === 0) return;
    onApplyCustomPlayers(previewPlayers);
    onClose();
  };

  // Handle Complete Database Wipe with Double Confirmation
  const handleConfirmDeleteAll = () => {
    onWipeDatabase();
    setFile(null);
    setPreviewPlayers([]);
    setSuccessMessage('Database calciatori svuotato completamente (0 giocatori).');
    setIsConfirmDeleteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center space-x-2">
                <span>Carica Lega Serie A (File Excel Fantacalcio.it)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Compatibile 100%
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Scarica la lista da Fantacalcio.it, caricala qui per la tua lega e arricchisci le statistiche
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* FANTACALCIO.IT OFFICIAL DOWNLOAD LINK BANNER */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-4 border border-blue-700/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono font-black text-[10px] uppercase tracking-wider">
                  FONTE UFFICIALE
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Lista Ufficiale Calciatori Serie A
                </h3>
              </div>
              <p className="text-[11.5px] text-slate-300 leading-relaxed max-w-xl">
                Non hai ancora il file Excel aggiornato? Scarica la lista ufficiale direttamente dal portale <strong>Fantacalcio.it</strong>:
              </p>
              <div className="space-y-1 pt-0.5">
                <div className="text-[10.5px] text-amber-300 font-medium flex items-center space-x-1">
                  <span>📅</span>
                  <span><strong>Data attuale listone: 20 Agosto 2026</strong> • Calciomercato aperto: la versione definitiva ufficiale con tutti gli acquisti dell'ultim'ora sarà scaricabile a partire dal <strong>2 Settembre</strong>.</span>
                </div>
                <div className="text-[10.5px] text-slate-300/90 font-normal flex items-center space-x-1">
                  <span>⚠️</span>
                  <span><strong>Nota:</strong> Effettua il login su <em>www.fantacalcio.it</em> per visualizzare il tasto <strong>"SCARICA EXCEL"</strong> sulla loro pagina.</span>
                </div>
              </div>
            </div>

            <a
              href="https://www.fantacalcio.it/quotazioni-fantacalcio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
              title="Apri la pagina delle Quotazioni Ufficiali su Fantacalcio.it in una nuova scheda"
            >
              <Globe className="w-4 h-4" />
              <span>Vai e scarica la Lista Serie A ↗</span>
            </a>
          </div>

          {/* Top Action Ribbon: Status, Enrich & Wipe DB Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isCustomDataActive ? 'bg-emerald-500 animate-pulse' : currentPlayers.length > 0 ? 'bg-blue-500' : 'bg-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-800">
                  Stato Database Calciatori:{' '}
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {currentPlayers.length === 0 
                    ? 'Svuotato (0 Calciatori)'
                    : isCustomDataActive 
                    ? 'Database Personalizzato Attivo' 
                    : 'Database Standard'}
                </span>
                <span className="text-slate-500 ml-1.5 font-bold">
                  ({currentPlayers.length} calciatori archiviati)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* TASTO ARRICCHISCI STATISTICHE DIRETTO */}
              {currentPlayers.length > 0 && (
                <button
                  type="button"
                  disabled={isEnriching}
                  onClick={() => handleEnrichStats(previewPlayers.length > 0 ? previewPlayers : currentPlayers)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-sm transition-all cursor-pointer text-xs active:scale-95 disabled:opacity-50 ring-2 ring-blue-400/40"
                  title="Cerca nel database storico 2025/2026 e compila automaticamente Presenze, Media Voto, FantaMedia, Gol, Assist, Rigori e Consigli d'Asta"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🧠 Cerca in Rete & Arricchisci Statistiche</span>
                </button>
              )}

              {/* BOTTONE ELIMINA / SVUOTA DATABASE CON POPUP CONFERMA */}
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-all shadow-2xs hover:border-rose-300 cursor-pointer text-xs shrink-0 active:scale-95"
                title="Apre la finestra di conferma per cancellare interamente il database calciatori"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Elimina / Svuota Tutto il DB</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-5 text-center transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  Seleziona File Excel di Fantacalcio.it
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Supporta i file <strong>Quotazioni_Fantacalcio.xlsx</strong>, .xls e .csv
                </p>
              </div>

              {file && (
                <div className="inline-flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 font-mono text-[11px] mt-1 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold truncate max-w-xs">{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Sheet Selector if multi-sheet file */}
          {sheetNames.length > 1 && (
            <div className="flex items-center space-x-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <Layers className="w-4 h-4 text-slate-600 shrink-0" />
              <label className="font-bold text-slate-700 shrink-0">Seleziona Foglio:</label>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Structure Mapping Info Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-[11.5px] text-blue-950 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Struttura Colonne Ufficiale Fantacalcio.it Riconosciuta in Automatico:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-blue-800 pt-1">
              <div>• <strong>Colonna B</strong>: Ruolo Classic (P, D, C, A)</div>
              <div>• <strong>Colonna C</strong>: Ruolo Extra / Mantra</div>
              <div>• <strong>Colonna D</strong>: Nome Calciatore</div>
              <div>• <strong>Colonna E</strong>: Squadra di appartenenza</div>
              <div>• <strong>Colonna F/G</strong>: Quotazione di mercato</div>
              <div>• <strong>Colonna L</strong>: FVM (FantaValore per Asta)</div>
            </div>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{parseError}</span>
            </div>
          )}

          {/* Success / Info Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Auto-Scouting / Enrich Progress Bar */}
          {isEnriching && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-xs">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Ricerca in rete e arricchimento statistiche 2025/2026 in corso...</span>
                </div>
                {enrichProgress && (
                  <span className="font-mono font-bold">
                    {enrichProgress.current} / {enrichProgress.total}
                  </span>
                )}
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-150"
                  style={{
                    width: enrichProgress
                      ? `${Math.round((enrichProgress.current / enrichProgress.total) * 100)}%`
                      : '50%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview of Loaded Players */}
          {previewPlayers.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Anteprima Listone ({previewPlayers.length} Calciatori Pronti)</span>
                </h3>

                {/* TASTO ARRICCHIMENTO STATISTICHE */}
                <button
                  type="button"
                  disabled={isEnriching}
                  onClick={() => handleEnrichStats(previewPlayers)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50 text-xs active:scale-95"
                  title="Cerca in rete e associa le statistiche storiche 2025/2026 (MV, FM, Gol, Assist, Rigori, Consigli d'asta)"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🧠 Cerca in Rete & Arricchisci Statistiche</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto overflow-x-auto smooth-horizontal-scroll">
                <table className="w-full text-[11px] text-left min-w-[500px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5">R</th>
                      <th className="px-2 py-1.5">Mantra</th>
                      <th className="px-2 py-1.5">Nome</th>
                      <th className="px-2 py-1.5">Squadra</th>
                      <th className="px-2 py-1.5 text-right">Qt.</th>
                      <th className="px-2 py-1.5 text-right">FVM</th>
                      <th className="px-2 py-1.5 text-right">PG</th>
                      <th className="px-2 py-1.5 text-right">FM</th>
                      <th className="px-2 py-1.5 text-right">GF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {previewPlayers.slice(0, 30).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="px-2 py-1 font-bold">
                          <span
                            className={`px-1 rounded text-[9.5px] ${
                              p.ruolo === 'P'
                                ? 'bg-amber-100 text-amber-900'
                                : p.ruolo === 'D'
                                ? 'bg-emerald-100 text-emerald-900'
                                : p.ruolo === 'C'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {p.ruolo}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-slate-500 font-sans">{p.ruoloExtra || '-'}</td>
                        <td className="px-2 py-1 font-bold font-sans text-slate-900">{p.nome}</td>
                        <td className="px-2 py-1 text-slate-600 font-sans">{p.squadra}</td>
                        <td className="px-2 py-1 text-right text-slate-700">{p.quotazione}</td>
                        <td className="px-2 py-1 text-right font-bold text-emerald-700">{p.fvm || p.quotazione}</td>
                        <td className="px-2 py-1 text-right text-slate-500">{p.presenze || '-'}</td>
                        <td className="px-2 py-1 text-right text-slate-700 font-bold">{p.fantaMedia || '-'}</td>
                        <td className="px-2 py-1 text-right text-slate-700">{p.golFatti || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewPlayers.length > 30 && (
                <p className="text-[10px] text-slate-400 text-right">
                  Mostrati primi 30 di {previewPlayers.length} calciatori
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-xs"
          >
            Chiudi
          </button>

          <div className="flex items-center space-x-2">
            {previewPlayers.length > 0 ? (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition-all cursor-pointer text-xs active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Applica Listone ({previewPlayers.length} Calciatori)</span>
              </button>
            ) : isCustomDataActive ? (
              <button
                type="button"
                onClick={() => handleEnrichStats(currentPlayers)}
                disabled={isEnriching}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-sm transition-all cursor-pointer text-xs active:scale-95"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Arricchisci Database Attuale con Statistiche</span>
              </button>
            ) : null}
          </div>
        </div>

      </div>

      {/* POPUP MODAL DI CONFERMA: ELIMINA / SVUOTA DATABASE */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 w-full max-w-md p-5 text-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Conferma Eliminazione Database
                </h3>
                <p className="text-[11px] text-rose-600 font-bold">
                  Operazione distruttiva irreversibile
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5">
              <p className="font-bold">
                ⚠️ ATTENZIONE: Questa operazione eliminerà COMPLETAMENTE tutti i dati dei calciatori attualmente caricati.
              </p>
              <p className="text-[11px] text-rose-800">
                Il database verrà azzerato e ripristinato allo stato iniziale predefinito su tutti i dispositivi e sul Cloud.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>SÌ, CANCELLA TUTTO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
