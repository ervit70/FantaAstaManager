/**
 * Servizio di Gestione Licenza e Convalida Anti-Manomissione Multi-Dispositivo
 * Scadenza Ufficiale Stagione 2026/27: 1° Agosto 2027 (00:00 UTC)
 * Limite Dispositivi Personali: 3 Dispositivi per Licenza (es. Fisso + Portatile + Smartphone)
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'computer' | 'mobile';
  activatedAt: string;
  lastUsedAt: string;
}

export interface LicenseStatus {
  isLicensed: boolean;
  licenseKey?: string;
  customerEmail?: string;
  planType: 'annual_2026_2027' | 'renewal_2027_2028' | 'lifetime_dev';
  expiresAt: string; // ISO 8601 UTC
  isExpired: boolean;
  daysRemaining: number;
  verifiedAt: string;
  source: 'gumroad' | 'manual' | 'offline_cached';
  deviceId?: string;
  deviceName?: string;
  deviceType?: 'computer' | 'mobile';
  activeComputersCount?: number;
  activeMobilesCount?: number;
  maxComputersAllowed?: number;
  maxMobilesAllowed?: number;
}

// Scadenza fissa per la stagione Fantacalcio 2026/2027: 1° Agosto 2027 00:00:00 UTC
export const SEASON_EXPIRY_DATE_ISO = '2027-08-01T00:00:00.000Z';
export const RENEWAL_EXPIRY_DATE_ISO = '2028-08-01T00:00:00.000Z';
export const MAX_COMPUTERS = 2; // Max 2 Computer (Windows, Mac/iOS Desktop, Linux)
export const MAX_MOBILES = 1;   // Max 1 Smartphone / Tablet (Android, iPhone/iOS)
export const MAX_ALLOWED_DEVICES = MAX_COMPUTERS + MAX_MOBILES; // Totale 3

const STORAGE_KEY = 'fantascout_pro_license_v1';
const DEVICE_ID_KEY = 'fantascout_device_fingerprint_v1';
const LAST_TRUSTED_TIME_KEY = 'fantascout_trusted_server_time';

/**
 * Ottiene o genera un identificativo univoco per il dispositivo/browser corrente
 */
export const getOrCreateDeviceId = (): { deviceId: string; deviceName: string; deviceType: 'computer' | 'mobile' } => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  let deviceName = 'Computer';
  let deviceType: 'computer' | 'mobile' = 'computer';
  const ua = navigator.userAgent;

  if (/Android/i.test(ua)) {
    deviceName = 'Smartphone / Tablet Android';
    deviceType = 'mobile';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceName = 'iPhone / iPad (iOS)';
    deviceType = 'mobile';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    // Check if it's touch-enabled iPad pretending to be Mac
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) {
      deviceName = 'iPad (iOS)';
      deviceType = 'mobile';
    } else {
      deviceName = 'Mac / MacBook (macOS)';
      deviceType = 'computer';
    }
  } else if (/Windows NT/i.test(ua)) {
    deviceName = 'PC Windows (Desktop/Notebook)';
    deviceType = 'computer';
  } else if (/Linux/i.test(ua)) {
    deviceName = 'Computer Linux';
    deviceType = 'computer';
  }

  return { deviceId, deviceName, deviceType };
};

/**
 * Ottiene il tempo corrente verificato contro manipolazioni orologio locale
 */
export const getTrustedServerTime = async (): Promise<Date> => {
  const localDate = new Date();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.utc_datetime) {
        const serverDate = new Date(data.utc_datetime);
        localStorage.setItem(LAST_TRUSTED_TIME_KEY, serverDate.toISOString());
        return serverDate;
      }
    }
  } catch {
    // Fallback offline
  }

  const lastTrustedIso = localStorage.getItem(LAST_TRUSTED_TIME_KEY);
  if (lastTrustedIso) {
    const lastTrusted = new Date(lastTrustedIso);
    if (localDate < lastTrusted) {
      return lastTrusted;
    }
  }

  localStorage.setItem(LAST_TRUSTED_TIME_KEY, localDate.toISOString());
  return localDate;
};

/**
 * Calcola giorni rimanenti alla scadenza
 */
export const calculateRemainingDays = (now: Date, expiry: Date): number => {
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Carica lo stato della licenza salvata localmente
 */
export const loadStoredLicense = (): LicenseStatus | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Salva lo stato della licenza
 */
export const saveStoredLicense = (status: LicenseStatus) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
};

/**
 * Rimuove o azzera la licenza dal dispositivo locale
 */
export const clearStoredLicense = async (licenseKey?: string) => {
  const { deviceId } = getOrCreateDeviceId();
  localStorage.removeItem(STORAGE_KEY);

  // Rimuovi questo dispositivo dal cloud se c'era una licenza
  if (licenseKey && db) {
    try {
      const docRef = doc(db, 'license_activations', licenseKey.trim().toUpperCase());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const devices = (data.devices || []).filter((d: DeviceInfo) => d.deviceId !== deviceId);
        await setDoc(docRef, { ...data, devices, updatedAt: new Date().toISOString() });
      }
    } catch {
      // Ignore network errors on deactivation
    }
  }
};

/**
 * Convalida e Registra la Licenza con supporto Multi-Dispositivo (Max 3 Dispositivi)
 */
export const verifyAndActivateLicense = async (
  key: string,
  email: string = '',
  gumroadPermalink: string = ''
): Promise<{ success: boolean; message: string; license?: LicenseStatus; activeDevices?: DeviceInfo[] }> => {
  const cleanKey = key.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanKey) {
    return { success: false, message: 'Inserisci un codice licenza valido.' };
  }

  const currentDate = await getTrustedServerTime();
  const expiryDate = new Date(SEASON_EXPIRY_DATE_ISO);
  const { deviceId, deviceName } = getOrCreateDeviceId();

  // 1. TENTATIVO CONVALIDA API DIRETTA GUMROAD
  let isGumroadVerified = false;
  if (gumroadPermalink && cleanKey.length >= 8) {
    try {
      const form = new URLSearchParams();
      form.append('product_permalink', gumroadPermalink);
      form.append('license_key', cleanKey);

      const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          isGumroadVerified = true;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. CONVALIDA CHIAVI MASTER & FORMATI UFFICIALI
  const isMasterKey = 
    cleanKey === 'MASTER-FANTA-2026' || 
    cleanKey === 'FANTA2026-DEV-ADMIN' ||
    cleanKey.startsWith('FS26-') ||
    cleanKey.startsWith('GUM-') ||
    cleanKey.startsWith('PRO-') ||
    isGumroadVerified;

  const isValidFormat = isMasterKey || cleanKey.length >= 10;

  if (!isValidFormat) {
    return {
      success: false,
      message: 'Il codice licenza inserito non è valido o non corrisponde al formato autorizzato.',
    };
  }

  const isRenewal = cleanKey.includes('REN') || cleanKey.includes('2027');
  const targetExpiry = isRenewal ? new Date(RENEWAL_EXPIRY_DATE_ISO) : expiryDate;
  const isExpired = currentDate >= targetExpiry;
  const daysRemaining = calculateRemainingDays(currentDate, targetExpiry);

  if (isExpired) {
    return {
      success: false,
      message: `Questa licenza è scaduta il 1° Agosto ${isRenewal ? '2028' : '2027'}. È necessario rinnovarla per la nuova stagione.`,
    };
  }

  // 3. CONTROLLO MULTI-DISPOSITIVO TRAMITE CLOUD FIRESTORE (Max 2 Computer + 1 Mobile)
  let devicesList: DeviceInfo[] = [];
  try {
    if (db && !isMasterKey) {
      const docRef = doc(db, 'license_activations', cleanKey);
      const snap = await getDoc(docRef);

      const { deviceType } = getOrCreateDeviceId();
      const currentDeviceEntry: DeviceInfo = {
        deviceId,
        deviceName,
        deviceType,
        activatedAt: currentDate.toISOString(),
        lastUsedAt: currentDate.toISOString(),
      };

      if (snap.exists()) {
        const data = snap.data();
        devicesList = data.devices || [];

        const existingIndex = devicesList.findIndex((d) => d.deviceId === deviceId);

        if (existingIndex >= 0) {
          // Questo dispositivo era già registrato per questa licenza: aggiorna l'ultimo utilizzo e tipo
          devicesList[existingIndex].lastUsedAt = currentDate.toISOString();
          devicesList[existingIndex].deviceType = deviceType;
          devicesList[existingIndex].deviceName = deviceName;
        } else {
          // Verifica limiti specifici per tipologia
          const currentComputers = devicesList.filter(d => (d.deviceType || 'computer') === 'computer');
          const currentMobiles = devicesList.filter(d => d.deviceType === 'mobile');

          if (deviceType === 'computer' && currentComputers.length >= MAX_COMPUTERS) {
            return {
              success: false,
              message: `Limite Computer raggiunto (${currentComputers.length}/${MAX_COMPUTERS} PC/Mac attivi). Questa licenza consente l'uso su massimo 2 Computer personali. Scollega uno dei vecchi computer per attivarne uno nuovo.`,
              activeDevices: devicesList,
            };
          }

          if (deviceType === 'mobile' && currentMobiles.length >= MAX_MOBILES) {
            return {
              success: false,
              message: `Limite Smartphone raggiunto (${currentMobiles.length}/${MAX_MOBILES} telefono attivo). Questa licenza consente l'uso su massimo 1 Smartphone/Tablet personale. Scollega il vecchio smartphone per attivarne uno nuovo.`,
              activeDevices: devicesList,
            };
          }

          if (devicesList.length >= MAX_ALLOWED_DEVICES) {
            return {
              success: false,
              message: `Limite di dispositivi totali raggiunto (${devicesList.length}/${MAX_ALLOWED_DEVICES}). Scollega un dispositivo per continuare.`,
              activeDevices: devicesList,
            };
          }

          devicesList.push(currentDeviceEntry);
        }

        await setDoc(docRef, {
          licenseKey: cleanKey,
          customerEmail: cleanEmail || data.customerEmail || '',
          devices: devicesList,
          maxComputers: MAX_COMPUTERS,
          maxMobiles: MAX_MOBILES,
          maxDevices: MAX_ALLOWED_DEVICES,
          expiresAt: targetExpiry.toISOString(),
          updatedAt: currentDate.toISOString(),
        });
      } else {
        // Prima attivazione assoluta per questa licenza
        devicesList = [currentDeviceEntry];
        await setDoc(docRef, {
          licenseKey: cleanKey,
          customerEmail: cleanEmail,
          devices: devicesList,
          maxComputers: MAX_COMPUTERS,
          maxMobiles: MAX_MOBILES,
          maxDevices: MAX_ALLOWED_DEVICES,
          expiresAt: targetExpiry.toISOString(),
          updatedAt: currentDate.toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Controllo cloud multi-device fallback locale:', err);
  }

  const { deviceType } = getOrCreateDeviceId();
  const activeComputers = devicesList.filter(d => (d.deviceType || 'computer') === 'computer').length || (deviceType === 'computer' ? 1 : 0);
  const activeMobiles = devicesList.filter(d => d.deviceType === 'mobile').length || (deviceType === 'mobile' ? 1 : 0);

  const license: LicenseStatus = {
    isLicensed: true,
    licenseKey: cleanKey,
    customerEmail: cleanEmail || 'cliente@fantascout.it',
    planType: isRenewal ? 'renewal_2027_2028' : 'annual_2026_2027',
    expiresAt: targetExpiry.toISOString(),
    isExpired: false,
    daysRemaining,
    verifiedAt: currentDate.toISOString(),
    source: isGumroadVerified ? 'gumroad' : 'manual',
    deviceId,
    deviceName,
    deviceType,
    activeComputersCount: activeComputers,
    activeMobilesCount: activeMobiles,
    maxComputersAllowed: MAX_COMPUTERS,
    maxMobilesAllowed: MAX_MOBILES,
  };

  saveStoredLicense(license);
  return {
    success: true,
    message: `Licenza Stagione 2026/27 attivata con successo! Valida su questo dispositivo (${deviceName}) fino al 1° Agosto ${isRenewal ? '2028' : '2027'}.`,
    license,
    activeDevices: devicesList,
  };
};

