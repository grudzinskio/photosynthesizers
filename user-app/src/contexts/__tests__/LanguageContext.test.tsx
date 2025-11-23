import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { LanguageProvider } from '../LanguageContext.tsx';
import { useTranslation } from '../../hooks/useTranslation';

// Test component that uses the translation hook
function TestComponent() {
  const { t, currentLanguage, setLanguage, availableLanguages } = useTranslation();
  
  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="translated-text">{t('app.title')}</div>
      <div data-testid="available-languages">{availableLanguages.length}</div>
      <button onClick={() => setLanguage('es')} data-testid="set-spanish">
        Set Spanish
      </button>
      <button onClick={() => setLanguage('zh')} data-testid="set-chinese">
        Set Chinese
      </button>
      <button onClick={() => setLanguage('en')} data-testid="set-english">
        Set English
      </button>
    </div>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'en-US',
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should provide default language as English when no stored language exists', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
  });

  it('should provide all available languages', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('available-languages')).toHaveTextContent('3');
  });

  it('should translate text using the t function', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('translated-text')).toHaveTextContent('Photosynthesizers Challenge');
  });

  it('should switch language when setLanguage is called', async () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const spanishButton = screen.getByTestId('set-spanish');
    
    act(() => {
      spanishButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
    });
  });

  it('should update translations when language changes', async () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    // Initial English text
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Photosynthesizers Challenge');

    const spanishButton = screen.getByTestId('set-spanish');
    
    act(() => {
      spanishButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Desafío de Fotosintéticos');
    });
  });

  it('should persist language selection to localStorage', async () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const spanishButton = screen.getByTestId('set-spanish');
    
    act(() => {
      spanishButton.click();
    });

    await waitFor(() => {
      expect(localStorage.getItem('app-language')).toBe('es');
    });
  });

  it('should load language from localStorage on mount', () => {
    localStorage.setItem('app-language', 'zh');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
  });

  it('should use defaultLanguage prop when provided and no stored language exists', () => {
    render(
      <LanguageProvider defaultLanguage="es">
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('es');
  });

  it('should prioritize stored language over defaultLanguage prop', () => {
    localStorage.setItem('app-language', 'zh');

    render(
      <LanguageProvider defaultLanguage="es">
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
  });

  it('should handle nested translation keys', () => {
    function NestedKeyComponent() {
      const { t } = useTranslation();
      return <div data-testid="nested">{t('domes.tropical.name')}</div>;
    }

    render(
      <LanguageProvider>
        <NestedKeyComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('nested')).toHaveTextContent('Tropical Dome');
  });

  it('should return fallback text for missing keys', () => {
    function FallbackComponent() {
      const { t } = useTranslation();
      return <div data-testid="fallback">{t('missing.key', 'Fallback Text')}</div>;
    }

    render(
      <LanguageProvider>
        <FallbackComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('fallback')).toHaveTextContent('Fallback Text');
  });

  it('should return key itself when no fallback is provided for missing keys', () => {
    function NoFallbackComponent() {
      const { t } = useTranslation();
      return <div data-testid="no-fallback">{t('missing.key')}</div>;
    }

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <LanguageProvider>
        <NoFallbackComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('no-fallback')).toHaveTextContent('missing.key');
    expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing.key');
    
    consoleSpy.mockRestore();
  });

  it('should handle interpolation in translations', () => {
    function InterpolationComponent() {
      const { t } = useTranslation();
      return (
        <div data-testid="interpolated">
          {t('chat.subtitle', '', { plantName: 'Rosa damascena' })}
        </div>
      );
    }

    render(
      <LanguageProvider>
        <InterpolationComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('interpolated')).toHaveTextContent(
      'Get answers to your questions about Rosa damascena'
    );
  });

  it('should detect browser language on first load', () => {
    Object.defineProperty(navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'es-ES',
    });

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('es');
  });

  it('should handle Chinese browser language detection', () => {
    Object.defineProperty(navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'zh-CN',
    });

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
  });

  it('should throw error when useTranslation is used outside LanguageProvider', () => {
    function ComponentOutsideProvider() {
      const { t } = useTranslation();
      return <div>{t('app.title')}</div>;
    }

    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ComponentOutsideProvider />);
    }).toThrow('useTranslation must be used within a LanguageProvider');

    consoleSpy.mockRestore();
  });
});
