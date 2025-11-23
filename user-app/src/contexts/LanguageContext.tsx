import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SupportedLanguage } from '../locales';
import {
  availableLanguages,
  translations,
  getTranslation,
  interpolate,
} from '../locales';
import { LanguageContext } from './LanguageContext';
import type { LanguageContextValue } from './LanguageContext';

// Context provider props
export interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

// LocalStorage key for persisting language preference
const STORAGE_KEY = 'app-language';

/**
 * Get language from localStorage
 */
function getStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const supportedLanguages: SupportedLanguage[] = ['en', 'es', 'zh', 'fr', 'de', 'ja', 'ar', 'ru', 'pt', 'it'];
    if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
  }
  return null;
}

/**
 * Save language to localStorage
 */
function setStoredLanguage(language: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language to localStorage:', error);
  }
}

/**
 * Detect browser language and return supported language or fallback
 */
function detectBrowserLanguage(): SupportedLanguage {
  try {
    const browserLang = navigator.language.toLowerCase();
    
    // Check for exact match or language prefix match
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('it')) return 'it';
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
  }
  
  // Default to English
  return 'en';
}

/**
 * LanguageProvider component that manages language state and provides translation functionality
 */
export function LanguageProvider({ children, defaultLanguage }: LanguageProviderProps) {
  // Initialize language state with priority: stored > default > browser > 'en'
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const stored = getStoredLanguage();
    if (stored) return stored;
    if (defaultLanguage) return defaultLanguage;
    return detectBrowserLanguage();
  });

  // Update localStorage when language changes
  useEffect(() => {
    setStoredLanguage(currentLanguage);
  }, [currentLanguage]);

  /**
   * Translation function with interpolation support
   */
  const t = (
    key: string,
    fallback?: string,
    interpolations?: Record<string, string>
  ): string => {
    const currentTranslations = translations[currentLanguage];
    let translated = getTranslation(currentTranslations, key, fallback);
    
    // Apply interpolations if provided
    if (interpolations) {
      translated = interpolate(translated, interpolations);
    }
    
    return translated;
  };

  const value: LanguageContextValue = {
    currentLanguage,
    setLanguage: setCurrentLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
