import { useContext } from 'react';
import type { LanguageContextValue } from '../contexts/LanguageContext';
import { LanguageContext } from '../contexts/LanguageContext';

/**
 * Custom hook to access translation functionality and language state
 * 
 * @throws Error if used outside of LanguageProvider
 * @returns Translation function, current language, language setter, and available languages
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, currentLanguage, setLanguage } = useTranslation();
 *   
 *   return (
 *     <div>
 *       <h1>{t('app.title')}</h1>
 *       <p>{t('chat.subtitle', '', { plantName: 'Rosa' })}</p>
 *       <button onClick={() => setLanguage('es')}>Español</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error(
      'useTranslation must be used within a LanguageProvider. ' +
      'Make sure your component is wrapped with <LanguageProvider>.'
    );
  }
  
  return context;
}
