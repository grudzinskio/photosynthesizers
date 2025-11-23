import { translations, SupportedLanguage } from './index';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface KeyStructure {
  [key: string]: KeyStructure | null;
}

/**
 * Validates translation file structure
 * - Ensures all keys are properly nested
 * - Verifies no duplicate keys exist
 * - Checks for consistent naming conventions (camelCase)
 */
export function validateTranslations(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all language codes
  const languages = Object.keys(translations) as SupportedLanguage[];

  // Extract key structure from English (reference language)
  const referenceKeys = extractKeys(translations.en);
  
  // Validate each language
  for (const lang of languages) {
    const langTranslations = translations[lang];
    
    // Check for proper nesting and structure
    const structureErrors = validateStructure(langTranslations, lang);
    errors.push(...structureErrors);
    
    // Check for duplicate keys (should not happen in JSON, but validate anyway)
    const duplicateErrors = checkDuplicates(langTranslations, lang);
    errors.push(...duplicateErrors);
    
    // Check naming conventions
    const namingWarnings = validateNamingConventions(langTranslations, lang);
    warnings.push(...namingWarnings);
    
    // Check consistency with reference language (English)
    if (lang !== 'en') {
      const consistencyErrors = checkConsistency(referenceKeys, extractKeys(langTranslations), lang);
      errors.push(...consistencyErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extracts all keys from a translation object in dot notation
 */
function extractKeys(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Nested object - recurse
      const nestedKeys = extractKeys(obj[key], fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else if (typeof obj[key] === 'string') {
      // Leaf node - add key
      keys.add(fullKey);
    } else {
      // Invalid value type
      keys.add(fullKey);
    }
  }
  
  return keys;
}

/**
 * Validates the structure of translation object
 * - Ensures values are either strings or nested objects
 * - Checks for empty objects
 */
function validateStructure(obj: any, lang: string, path = ''): string[] {
  const errors: string[] = [];
  
  for (const key in obj) {
    const fullPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    if (value === null || value === undefined) {
      errors.push(`[${lang}] Key "${fullPath}" has null or undefined value`);
    } else if (typeof value === 'object') {
      // Check if empty object
      if (Object.keys(value).length === 0) {
        errors.push(`[${lang}] Key "${fullPath}" is an empty object`);
      } else {
        // Recurse into nested object
        errors.push(...validateStructure(value, lang, fullPath));
      }
    } else if (typeof value !== 'string') {
      errors.push(`[${lang}] Key "${fullPath}" has invalid type: ${typeof value} (expected string or object)`);
    }
  }
  
  return errors;
}

/**
 * Checks for duplicate keys (redundant in JSON but validates structure)
 */
function checkDuplicates(obj: any, lang: string): string[] {
  const errors: string[] = [];
  const allKeys = extractKeys(obj);
  const keyArray = Array.from(allKeys);
  
  // Check for keys that might be duplicated at different levels
  const keyParts = new Map<string, string[]>();
  
  keyArray.forEach(key => {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    
    if (!keyParts.has(lastPart)) {
      keyParts.set(lastPart, []);
    }
    keyParts.get(lastPart)!.push(key);
  });
  
  // This is informational - having same key names at different levels is OK
  // but we'll warn if it might cause confusion
  keyParts.forEach((paths, keyName) => {
    if (paths.length > 3) {
      // Only warn if the same key name appears many times
      errors.push(`[${lang}] Key name "${keyName}" appears ${paths.length} times at different levels: ${paths.join(', ')}`);
    }
  });
  
  return errors;
}

/**
 * Validates naming conventions (camelCase for keys)
 */
function validateNamingConventions(obj: any, lang: string, path = ''): string[] {
  const warnings: string[] = [];
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
  
  for (const key in obj) {
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check if key follows camelCase convention
    if (!camelCaseRegex.test(key)) {
      warnings.push(`[${lang}] Key "${key}" in path "${fullPath}" does not follow camelCase convention`);
    }
    
    // Recurse if nested object
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      warnings.push(...validateNamingConventions(obj[key], lang, fullPath));
    }
  }
  
  return warnings;
}

/**
 * Checks consistency between reference language and target language
 */
function checkConsistency(referenceKeys: Set<string>, targetKeys: Set<string>, lang: string): string[] {
  const errors: string[] = [];
  
  // Check for missing keys
  referenceKeys.forEach(key => {
    if (!targetKeys.has(key)) {
      errors.push(`[${lang}] Missing translation key: "${key}"`);
    }
  });
  
  // Check for extra keys
  targetKeys.forEach(key => {
    if (!referenceKeys.has(key)) {
      errors.push(`[${lang}] Extra translation key not in reference (en): "${key}"`);
    }
  });
  
  return errors;
}

/**
 * Runs validation and logs results to console
 */
export function runValidation(): boolean {
  console.log('🔍 Validating translation files...\n');
  
  const result = validateTranslations();
  
  if (result.errors.length > 0) {
    console.error('❌ Validation failed with errors:\n');
    result.errors.forEach(error => console.error(`  - ${error}`));
    console.error('');
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }
  
  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All translation files are valid!\n');
  } else if (result.valid) {
    console.log('✅ Translation files are valid (with warnings)\n');
  }
  
  return result.valid;
}
