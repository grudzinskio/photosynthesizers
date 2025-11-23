import { createContext } from 'react';
import type {
  SupportedLanguage,
  LanguageOption,
} from '../locales';

// Context value interface
export interface LanguageContextValue {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string, interpolations?: Record<string, string>) => string;
  availableLanguages: LanguageOption[];
}

// Create the context with undefined default (will be provided by LanguageProvider)
export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
