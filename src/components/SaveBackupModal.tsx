import React, { useState, useRef } from 'react';
import { LeagueWorkspace, Player } from '../types/fantacalcio';
import {
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  History,
  HardDrive,
  X,
  FileSpreadsheet,
  Users,
  Coins,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import {
  BackupSnapshot,
  getStoredSnapshots,
  downloadBackupFile,
  parseBackupFile,
  calculateTotalAssignments,
  calculateTotalCreditsSpent
} from '../services/backupService';

interface SaveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: LeagueWorkspace[];
  activeLeagueId: string;
  customPlayers: Player[] | null;
  lastSavedTime: string | null;
  onManualSave: () => void;
  onRestoreState: (leagues: LeagueWorkspace[], activeLeagueId: string, customPlayers?: Player[] | null) => void;
}

export const SaveBackupModal: React.FC<SaveBackupModalProps> = ({
  isOpen,
  onClose,
  leagues,
  activeLeagueId,
  customPlayers,
  lastSavedTime,
  onManualSave,
  onRestoreState,
}) => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => getStoredSnapshots());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const totalAssigned = calculateTotalAssignments(leagues);
  const totalSpent = calculateTotalCreditsSpent(leagues);

  const handleSaveNow = () => {
    onManualSave();
    setSnapshots(getStoredSnapshots());
    setSuccessMessage('✅ Salvataggio completato sia nel browser che sul cloud!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDownload = () => {
    downloadBackupFile(leagues, activeLeagueId, customPlayers);
    setSuccessMessage('💾 File di backup JSON scaricato con successo sul tuo computer!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const parsed = await parseBackupFile(file);
      if (confirm(`Confermi il ripristino del backup? Contiene ${parsed.leagues.length} leghe/fogli.`)) {
        onRestoreState(parsed.leagues, parsed.activeLeagueId, parsed.customPlayers);
        setSuccessMessage('✅ Dati ripristinati con successo dal file di backup!');
        setSnapshots(getStoredSnapshots());
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Errore durante il caricamento del file di backup.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    if (
      confirm(
        `Sei sicuro di voler ripristinare il salvataggio del ${new Date(snap.timestamp).toLocaleString('it-IT')} con ${snap.totalAssignedPlayers} acquisti?`
      )
    ) {
      onRestoreState(snap.leagues, snap.activeLeagueId, snap.customPlayers);
      setSuccessMessage(`✅ Ripristinato snapshot del ${snap.formattedTime}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border-2 border-emerald-500/60 rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Save className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center space-x-2">
                <span>Salvataggio & Sicurezza Asta</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  Auto-Save Attivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Salva i tuoi acquisti, esporta copie di sicurezza e ripristina la tua asta
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

        {/* Success / Error notification */}
        {successMessage && (
          <div className="px-4 py-2 bg-emerald-600/90 text-white text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{successMessage}</span>
          </div>
        )}

        {uploadError && (
          <div className="px-4 py-2 bg-red-600/90 text-white text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-200" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Current State Summary Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Stato Asta Attuale
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-200 font-mono">
                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold flex items-center space-x-1">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>{leagues.length} Leghe / Fogli</span>
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold flex items-center space-x-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span className="text-emerald-400">{totalAssigned}</span> Calciatori Assegnati
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold flex items-center space-x-1">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300">{totalSpent} FM</span> Spesi
                </span>
              </div>
              {lastSavedTime && (
                <div className="text-[11px] text-slate-400 font-mono pt-1">
                  Ultimo salvataggio confermato:{' '}
                  <strong className="text-white">{new Date(lastSavedTime).toLocaleString('it-IT')}</strong>
                </div>
              )}
            </div>

            {/* Primary Save Button */}
            <button
              onClick={handleSaveNow}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>SALVA ADESSO</span>
            </button>
          </div>

          {/* Backup & Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download JSON Backup */}
            <div className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="font-bold text-white flex items-center space-x-1.5 text-xs">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scarica Backup (.json)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Salva un file completo sul tuo computer con tutte le rose, prezzi pagati e impostazioni di tutte le leghe.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-md font-bold text-[11px] flex items-center justify-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scarica File Backup</span>
              </button>
            </div>

            {/* Restore from JSON Backup */}
            <div className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="font-bold text-white flex items-center space-x-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ripristina da File (.json)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hai fatto un backup su un altro PC o browser? Carica il file per ripristinare all'istante tutto il mercato.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="backup-file-upload-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 bg-blue-600/80 hover:bg-blue-600 active:scale-95 text-white rounded-md font-bold text-[11px] flex items-center justify-center space-x-1.5 border border-blue-500/50 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carica File Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Local Snapshots History */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5 text-xs">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Salvataggi Automatici Recenti (Ripristino Rapido)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {snapshots.length} salvataggi memorizzati
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-4 text-slate-500 italic text-[11px]">
                Nessun salvataggio precedente trovato. Fai clic su "SALVA ADESSO" per creare il tuo primo snapshot.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {snapshots.map((snap, idx) => (
                  <div
                    key={snap.id || idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-[11px]"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 font-mono text-[9px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200">
                          {new Date(snap.timestamp).toLocaleString('it-IT')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {snap.totalLeagues} Leghe • <strong className="text-emerald-400">{snap.totalAssignedPlayers}</strong> calciatori • <strong className="text-amber-300">{snap.totalCreditsSpent} FM</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Ripristina questo stato d'asta"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Ripristina</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>I tuoi dati sono protetti in LocalStorage e sincronizzati nel Cloud</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
