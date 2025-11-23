import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import type { SupportedLanguage } from '@/locales';

export interface LanguageSelectorProps {
  variant?: 'floating' | 'inline';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function LanguageSelector({ 
  variant = 'floating',
  position = 'top-right' 
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Get current language display info
  const currentLangOption = availableLanguages.find(lang => lang.code === currentLanguage);

  // Position classes for floating variant
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle language selection
  const handleLanguageSelect = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    setIsOpen(false);
    setFocusedIndex(-1);
    
    // Announce language change to screen readers
    const selectedLang = availableLanguages.find(lang => lang.code === langCode);
    if (selectedLang) {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Language changed to ${selectedLang.name}`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
    
    // Return focus to button
    buttonRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open dropdown with Enter, Space, or Arrow Down
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < availableLanguages.length - 1 ? prev + 1 : 0;
          optionRefs.current.get(next)?.focus();
          return next;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : availableLanguages.length - 1;
          optionRefs.current.get(next)?.focus();
          return next;
        });
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        optionRefs.current.get(0)?.focus();
        break;

      case 'End': {
        event.preventDefault();
        const lastIndex = availableLanguages.length - 1;
        setFocusedIndex(lastIndex);
        optionRefs.current.get(lastIndex)?.focus();
        break;
      }

      case 'Tab':
        // Allow tab to close dropdown and move focus naturally
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle option keyboard events
  const handleOptionKeyDown = (event: React.KeyboardEvent, langCode: SupportedLanguage) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageSelect(langCode);
    }
  };

  // Focus first option when dropdown opens
  useEffect(() => {
    if (isOpen && focusedIndex === 0) {
      optionRefs.current.get(0)?.focus();
    }
  }, [isOpen, focusedIndex]);

  const containerClass = variant === 'floating'
    ? `fixed ${positionClasses[position]} z-50`
    : 'relative inline-block';

  return (
    <div className={containerClass}>
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        variant="outline"
        size={variant === 'floating' ? 'default' : 'sm'}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="language-dropdown"
        className={`
          flex items-center gap-2 transition-all duration-300
          ${variant === 'floating' 
            ? 'bg-card/90 backdrop-blur-md hover:bg-card/95 shadow-lg hover:shadow-xl hover:scale-105' 
            : 'bg-card hover:bg-card/95'
          }
          focus-visible:ring-4 focus-visible:ring-green-500 focus-visible:ring-offset-2
        `}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium">
          {currentLangOption?.flag} {currentLangOption?.name}
        </span>
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id="language-dropdown"
          role="listbox"
          aria-label="Available languages"
          aria-activedescendant={focusedIndex >= 0 ? `lang-option-${availableLanguages[focusedIndex]?.code}` : undefined}
          className={`
            absolute mt-2 min-w-[200px] rounded-lg border-2 border-border
            bg-card/95 backdrop-blur-md shadow-2xl
            animate-in fade-in-0 zoom-in-95 duration-200
            ${variant === 'floating' && (position.includes('right') ? 'right-0' : 'left-0')}
            ${variant === 'inline' ? 'left-0' : ''}
          `}
        >
          <div className="p-2 space-y-1">
            {availableLanguages.map((lang, index) => {
              const isSelected = lang.code === currentLanguage;
              const isFocused = index === focusedIndex;
              
              return (
                <button
                  key={lang.code}
                  ref={(el) => {
                    if (el) optionRefs.current.set(index, el);
                  }}
                  id={`lang-option-${lang.code}`}
                  role="option"
                  {...(isSelected && { 'aria-selected': true })}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => handleLanguageSelect(lang.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, lang.code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-md
                    text-left transition-all duration-200
                    ${isSelected 
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400 font-semibold' 
                      : 'hover:bg-accent text-foreground'
                    }
                    ${isFocused ? 'ring-2 ring-green-500 ring-inset' : ''}
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset
                  `}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <span className="flex-1">
                    {lang.name}
                  </span>
                  {isSelected && (
                    <svg
                      className="h-5 w-5 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
