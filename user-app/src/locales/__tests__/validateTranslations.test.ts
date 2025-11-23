import { describe, it, expect } from 'vitest';
import { validateTranslations } from '../validateTranslations';

describe('validateTranslations', () => {
  it('should validate that all translation files have proper structure', () => {
    const result = validateTranslations();
    
    // Log errors and warnings for debugging
    if (result.errors.length > 0) {
      console.error('Validation errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('Validation warnings:', result.warnings);
    }
    
    expect(result.errors).toHaveLength(0);
  });

  it('should ensure all languages have the same keys as English', () => {
    const result = validateTranslations();
    
    const missingKeyErrors = result.errors.filter(error => 
      error.includes('Missing translation key')
    );
    const extraKeyErrors = result.errors.filter(error => 
      error.includes('Extra translation key')
    );
    
    expect(missingKeyErrors).toHaveLength(0);
    expect(extraKeyErrors).toHaveLength(0);
  });

  it('should verify all keys follow camelCase naming convention', () => {
    const result = validateTranslations();
    
    const namingWarnings = result.warnings.filter(warning =>
      warning.includes('does not follow camelCase convention')
    );
    
    // We expect no naming convention violations
    expect(namingWarnings).toHaveLength(0);
  });

  it('should ensure no empty objects exist in translations', () => {
    const result = validateTranslations();
    
    const emptyObjectErrors = result.errors.filter(error =>
      error.includes('is an empty object')
    );
    
    expect(emptyObjectErrors).toHaveLength(0);
  });

  it('should ensure all values are either strings or nested objects', () => {
    const result = validateTranslations();
    
    const typeErrors = result.errors.filter(error =>
      error.includes('has invalid type')
    );
    
    expect(typeErrors).toHaveLength(0);
  });
});
