import React, { useState } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, Zap, Lock, Calendar, 
  ExternalLink, Key, RefreshCw, AlertCircle, ShoppingBag, Sparkles,
  Laptop, Smartphone, Monitor, Info
} from 'lucide-react';
import { 
  LicenseStatus, verifyAndActivateLicense, clearStoredLicense, 
  DeviceInfo, MAX_ALLOWED_DEVICES 
} from '../services/licenseService';

interface PurchaseLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: LicenseStatus | null;
  onLicenseUpdated: (newLicense: LicenseStatus | null) => void;
  gumroadUrl?: string;
  onUpdateGumroadUrl?: (url: string) => void;
}

export const PurchaseLicenseModal: React.FC<PurchaseLicenseModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  onLicenseUpdated,
  gumroadUrl = 'https://ervit.gumroad.com/l/djmkop',
  onUpdateGumroadUrl,
}) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(gumroadUrl);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Inserisci il codice di licenza ricevuto dopo l\'acquisto.' });
      return;
    }

    setIsValidating(true);
    setFeedbackMessage(null);

    try {
      let permalink = '';
      try {
        const parts = gumroadUrl.split('/l/');
        if (parts.length > 1) {
          permalink = parts[1].split('?')[0];
        }
      } catch {}

      const res = await verifyAndActivateLicense(licenseInput, emailInput, permalink);
      if (res.success && res.license) {
        setFeedbackMessage({ type: 'success', text: res.message });
        if (res.activeDevices) {
          setActiveDevices(res.activeDevices);
        }
        onLicenseUpdated(res.license);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
        if (res.activeDevices) {
          setActiveDevices(res.activeDevices);
        }
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Si è verificato un errore durante la convalida.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Vuoi davvero rimuovere la licenza da questo dispositivo per liberare uno slot?')) {
      await clearStoredLicense(currentLicense?.licenseKey);
      onLicenseUpdated(null);
      setFeedbackMessage({ type: 'success', text: 'Licenza scollegata con successo da questo dispositivo.' });
    }
  };

  const handleSaveCustomUrl = () => {
    if (onUpdateGumroadUrl && customUrlInput.trim()) {
      onUpdateGumroadUrl(customUrlInput.trim());
      setIsEditingUrl(false);
    }
  };

  const isLicensedActive = currentLicense && currentLicense.isLicensed && !currentLicense.isExpired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden text-slate-800 relative">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md font-black">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Licenza FantaScout 2026/27
                </h2>
                {isLicensedActive ? (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ATTIVA</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                    MULTI-DISPOSITIVO (FINO A 3)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Sblocco completo Asta Live, Gestione Squadre e Listoni Ufficiali Serie A
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto max-h-[75vh] space-y-6">
          
          {/* Multi-Device Info Pill */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 text-indigo-950 text-xs">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="flex-1 leading-snug">
              <span className="font-extrabold text-indigo-900 block mb-0.5 text-[12.5px]">
                Licenza Personale Multi-Device: 2 Computer + 1 Smartphone
              </span>
              <span className="text-indigo-800 text-[11.5px]">
                Include fino a <strong>2 Computer</strong> (PC Windows o Mac/Linux) per preparare l'asta a casa e portarla sul portatile, più <strong>1 Smartphone/Tablet</strong> (Android o iOS) per consultazioni al volo.
              </span>
            </div>
          </div>

          {/* Status Alert if already licensed */}
          {isLicensedActive ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                      Licenza Ufficiale 2026/27 Attiva su questo Dispositivo
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Scadenza certificata: <strong>1° Agosto 2027</strong> ({currentLicense.daysRemaining} giorni rimanenti)
                    </p>
                    <p className="text-[11px] text-emerald-700 font-mono">
                      Dispositivo: <strong>{currentLicense.deviceName || 'Questo Computer'}</strong> • Codice: {currentLicense.licenseKey}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  Scollega questo Dispositivo
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-800">
                <span className="flex items-center space-x-1.5 font-bold">
                  <Laptop className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Computer attivi: <strong>{currentLicense.activeComputersCount || 1} di {currentLicense.maxComputersAllowed || 2}</strong> • Smartphone: <strong>{currentLicense.activeMobilesCount || 0} di {currentLicense.maxMobilesAllowed || 1}</strong>
                  </span>
                </span>
                <span className="text-emerald-700">
                  (Dispositivo: {currentLicense.deviceName || 'Questo dispositivo'})
                </span>
              </div>
            </div>
          ) : (
            /* Purchase Box (Offer Banner) */
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pass Ufficiale Asta 2026/27</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    FantaScout Pro All-Inclusive
                  </h3>
                  <p className="text-xs text-slate-300">
                    Valido per tutta la stagione fino al <strong>1° Agosto 2027</strong> su <strong>3 dispositivi personali</strong>.
                  </p>
                </div>

                <div className="text-left sm:text-right bg-indigo-950/60 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-indigo-800/40">
                  <div className="text-3xl font-black text-amber-400 tracking-tight">
                    8,99 €
                  </div>
                  <div className="text-[11px] text-indigo-200 font-medium">
                    (Rinnovo anno successivo a 5,99 €)
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200 pt-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>2 Computer + 1 Smartphone</strong> (Windows, Mac, iOS, Android)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Listone Serie A 2026/27 completo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Asta Live fino a 20 squadre con budget</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fogli Leghe indipendenti illimitati</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Importazione Excel Fantacalcio.it</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronizzazione Cloud Multi-Device</span>
                </div>
              </div>

              {/* Big Direct Buy Button */}
              <div className="pt-2">
                <a
                  href={gumroadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ACQUISTA ORA LA LICENZA (8,99 €)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-center text-[11px] text-slate-400 mt-2 flex items-center justify-center space-x-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Pagamento sicuro e protetto via PayPal, Carta di Credito, Apple Pay e Google Pay.</span>
                </p>
              </div>
            </div>
          )}

          {/* Enter License Key Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900">
              <Key className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-extrabold">
                Hai già acquistato o possiedi un Codice Licenza?
              </h4>
            </div>

            <p className="text-xs text-slate-600">
              Inserisci la chiave di licenza ricevuta via email per attivare questo dispositivo (PC, Mac, Portatile o Tablet):
            </p>

            <form onSubmit={handleActivate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                    Codice di Licenza (es. FS26-XXXX-YYYY o chiave Gumroad)
                  </label>
                  <input
                    type="text"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    placeholder="Es. 6F0E4C97-B72A4E69-A11BF6C4-AF6517E7"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                    Tua Email (opzionale)
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="tua@email.it"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {feedbackMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-start space-x-2 animate-in fade-in duration-150 ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}
                >
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{feedbackMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-1">
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifica e Registrazione Dispositivo...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Attiva su Questo Dispositivo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Admin / Gumroad URL Configuration Panel */}
          {onUpdateGumroadUrl && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                  <span>⚙️ Link Pagina Negozio Gumroad / Checkout:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  {isEditingUrl ? 'Chiudi' : 'Modifica Link Negozio'}
                </button>
              </div>

              {isEditingUrl && (
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://ervit.gumroad.com/l/djmkop"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomUrl}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Salva
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Scadenza Stagione: <strong>1° Agosto 2027 (00:00 UTC)</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};

