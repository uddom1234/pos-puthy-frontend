import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppSettings {
  currencyRate: number; // USD -> KHR
  wifiInfo: string;
  phoneNumber: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  currencyRate: 4100,
  wifiInfo: '',
  phoneNumber: '',
};

interface AppSettingsContextShape extends AppSettings {
  setCurrencyRate: (rate: number) => void;
  setWifiInfo: (wifi: string) => void;
  setPhoneNumber: (phone: string) => void;
}

const AppSettingsContext = createContext<AppSettingsContextShape | undefined>(undefined);

const STORAGE_KEY = 'app_settings_v1';

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {}
  }, []);

  const persist = (next: AppSettings) => {
    setSettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const setCurrencyRate = (rate: number) => persist({ ...settings, currencyRate: rate });
  const setWifiInfo = (wifi: string) => persist({ ...settings, wifiInfo: wifi });
  const setPhoneNumber = (phone: string) => persist({ ...settings, phoneNumber: phone });

  return (
    <AppSettingsContext.Provider value={{ ...settings, setCurrencyRate, setWifiInfo, setPhoneNumber }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
};

// Helper for non-React modules
export const readAppSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...parsed } as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};


