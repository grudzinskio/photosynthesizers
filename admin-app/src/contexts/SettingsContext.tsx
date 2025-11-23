import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  apiBaseUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'admin-app-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    // Only save to localStorage if settings differ from defaults
    // This prevents unnecessary writes when settings haven't changed
    const settingsString = JSON.stringify(settings);
    const defaultString = JSON.stringify(defaultSettings);
    if (settingsString !== defaultString) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, settingsString);
    } else {
      // Remove from localStorage if it matches defaults
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

