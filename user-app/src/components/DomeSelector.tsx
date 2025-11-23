import { Button } from "@/components/ui/button";
import type { DomeName } from "@/types";
import tropicalDomeImg from "@/assets/tropical_dome.jpg";
import desertDomeImg from "@/assets/desert_dome.jpg";
import showDomeImg from "@/assets/show_dome.webp";
import outsideOfDomesImg from "@/assets/outside_of_domes.jpg";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface DomeSelectorProps {
  onDomeSelect: (dome: DomeName) => void;
}

const domeImages: Record<DomeName, string> = {
  "Tropical Dome": tropicalDomeImg,
  "Desert Dome": desertDomeImg,
  "Show Dome": showDomeImg,
};

// Map dome names to translation keys
const domeTranslationKeys: Record<DomeName, { name: string; description: string }> = {
  "Tropical Dome": { name: "domes.tropical.name", description: "domes.tropical.description" },
  "Desert Dome": { name: "domes.desert.name", description: "domes.desert.description" },
  "Show Dome": { name: "domes.show.name", description: "domes.show.description" },
};

export function DomeSelector({ onDomeSelect }: DomeSelectorProps) {
  const { t } = useTranslation();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const checkMobile = () => window.matchMedia('(max-width: 1024px)').matches;
    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      // Clean up existing observer
      if (observer) {
        observer.disconnect();
      }

      // Clear visible cards when switching to desktop
      if (!checkMobile()) {
        setVisibleCards(new Set());
        return;
      }

      // Set up observer for mobile
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const domeName = entry.target.getAttribute('data-dome-name');
            if (domeName) {
              if (entry.isIntersecting) {
                setVisibleCards((prev) => new Set(prev).add(domeName));
              } else {
                setVisibleCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(domeName);
                  return newSet;
                });
              }
            }
          });
        },
        { threshold: 0.5, rootMargin: '-30% 0px -15% 0px' }
      );

      cardRefs.current.forEach((card) => {
        if (card && observer) observer.observe(card);
      });
    };

    // Initial setup
    setupObserver();

    // Listen for resize events
    const handleResize = () => {
      setupObserver();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden">
      {/* Background imagery with gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: `url(${outsideOfDomesImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30" aria-hidden="true" />

      {/* Content container with relative positioning to appear above background */}
      <div className="relative z-10 w-full max-w-7xl space-y-8 sm:space-y-12">
        <div className="text-center space-y-3 sm:space-y-4 pb-6 overflow-visible">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent drop-shadow-lg pb-2 leading-tight overflow-visible">
            {t('app.title')}
          </h1>
          <p className="text-foreground font-bold text-lg sm:text-xl md:text-2xl px-2 sm:px-4 max-w-4xl mx-auto py-2 leading-relaxed overflow-visible text-shadow-glow whitespace-normal sm:whitespace-nowrap text-center">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto" role="group" aria-label="Dome selection">
          {(Object.keys(domeImages) as DomeName[]).map((domeName) => (
            <Button
              key={domeName}
              ref={(el) => {
                if (el) cardRefs.current.set(domeName, el);
              }}
              data-dome-name={domeName}
              variant="outline"
              className={`group h-auto py-6 sm:py-10 px-5 sm:px-8 flex flex-col items-center gap-4 sm:gap-6 bg-card/90 backdrop-blur-md border-2 rounded-2xl transition-all duration-500 ease-out touch-manipulation
                ${visibleCards.has(domeName)
                  ? 'max-lg:shadow-2xl max-lg:scale-[1.05] max-lg:-translate-y-2 max-lg:border-green-500'
                  : ''}
                hover:bg-card/95 hover:shadow-2xl hover:scale-[1.05] hover:-translate-y-2 hover:border-green-500
                active:scale-[1.05] active:-translate-y-2 active:border-green-500 active:shadow-2xl
                focus-visible:ring-4 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
              onClick={() => onDomeSelect(domeName)}
              aria-label={`Select ${t(domeTranslationKeys[domeName].name)} - ${t(domeTranslationKeys[domeName].description)}`}
            >
              <div className="dome-image-container relative">
                {/* Animated glow effect */}
                <div className={`absolute -inset-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full blur-2xl transition-all duration-500 
                  ${visibleCards.has(domeName) ? 'max-lg:opacity-40' : 'opacity-0'}
                  group-hover:opacity-40 group-active:opacity-40`} />

                {/* Outer ring animation */}
                <div className={`absolute -inset-2 rounded-full border-4 transition-all duration-500
                  ${visibleCards.has(domeName) ? 'max-lg:border-green-500/30' : 'border-transparent'}
                  group-hover:border-green-500/30 group-active:border-green-500/30`} />

                {/* Image container */}
                <div className={`relative w-full h-full rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-500
                  ${visibleCards.has(domeName) ? 'max-lg:border-green-500 max-lg:shadow-green-500/50' : 'border-border'}
                  group-hover:border-green-500 group-active:border-green-500 group-hover:shadow-green-500/50 group-active:shadow-green-500/50`}>
                  <img
                    src={domeImages[domeName]}
                    alt=""
                    className={`w-full h-full object-cover transition-transform duration-500
                      ${visibleCards.has(domeName) ? 'max-lg:scale-110' : 'scale-100'}
                      group-hover:scale-110 group-active:scale-110`}
                    aria-hidden="true"
                  />
                  {/* Overlay gradient on hover/active */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent transition-opacity duration-500
                    ${visibleCards.has(domeName) ? 'max-lg:opacity-100' : 'opacity-0'}
                    group-hover:opacity-100 group-active:opacity-100`} />
                </div>
              </div>

              <div className={`text-center space-y-1.5 sm:space-y-2 transition-transform duration-500
                ${visibleCards.has(domeName) ? 'max-lg:translate-y-1' : ''}
                group-hover:translate-y-1 group-active:translate-y-1`}>
                <span className={`text-lg sm:text-2xl md:text-3xl font-bold transition-colors duration-300
                  ${visibleCards.has(domeName) ? 'max-lg:text-green-700 dark:max-lg:text-green-400' : 'text-foreground'}
                  group-hover:text-green-700 dark:group-hover:text-green-400 group-active:text-green-700 dark:group-active:text-green-400`}>
                  {t(domeTranslationKeys[domeName].name)}
                </span>
                <p className={`text-xs sm:text-base transition-colors duration-300
                  ${visibleCards.has(domeName) ? 'max-lg:text-foreground' : 'text-muted-foreground'}
                  group-hover:text-foreground group-active:text-foreground`}>
                  {t(domeTranslationKeys[domeName].description)}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
