import en from './en.json';
import es from './es.json';
import zh from './zh.json';

// Supported languages
export type SupportedLanguage = 'en' | 'es' | 'zh' | 'fr' | 'de' | 'ja' | 'ar' | 'ru' | 'pt' | 'it';

// Translation types
export type TranslationKey = string;
export interface TranslationValue {
  [key: string]: string | TranslationValue;
}
export type Translations = TranslationValue;

// Language metadata
export interface LanguageOption {
  code: SupportedLanguage;
  name: string;        // Native name (e.g., "English", "Español", "中文")
  flag: string;        // Emoji flag
}

// Available languages with metadata
export const availableLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

// Translation store
export const translations: Record<SupportedLanguage, Translations> = {
  en,
  es,
  zh,
  fr: en, // Fallback to English for now
  de: en, // Fallback to English for now
  ja: en, // Fallback to English for now
  ar: en, // Fallback to English for now
  ru: en, // Fallback to English for now
  pt: en, // Fallback to English for now
  it: en, // Fallback to English for now
};

/**
 * Helper to get nested translation value
 * @param translations - The translations object for a specific language
 * @param key - Dot-notation key (e.g., "app.title")
 * @param fallback - Optional fallback text if key is not found
 * @returns The translated string or fallback
 */
export function getTranslation(
  translations: Translations,
  key: string,
  fallback?: string
): string {
  const keys = key.split('.');
  let value: string | TranslationValue = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return fallback || key;
    }
  }
  
  return typeof value === 'string' ? value : fallback || key;
}

/**
 * Helper for interpolation (e.g., "Hello {{name}}")
 * @param template - Template string with {{variable}} placeholders
 * @param values - Object with values to interpolate
 * @returns Interpolated string
 */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || '');
}
