import { Button } from "@/components/ui/button";
import type { DomeName } from "@/types";
import tropicalDomeImg from "@/assets/tropical_dome.jpg";
import desertDomeImg from "@/assets/desert_dome.jpg";
import showDomeImg from "@/assets/show_dome.webp";
import outsideOfDomesImg from "@/assets/outside_of_domes.jpg";

interface DomeSelectorProps {
  onDomeSelect: (dome: DomeName) => void;
}

const domeImages: Record<DomeName, string> = {
  "Tropical Dome": tropicalDomeImg,
  "Desert Dome": desertDomeImg,
  "Show Dome": showDomeImg,
};

const domeDescriptions: Record<DomeName, string> = {
  "Tropical Dome": "Lush rainforest environment",
  "Desert Dome": "Arid desert landscape",
  "Show Dome": "Seasonal exhibitions",
};

export function DomeSelector({ onDomeSelect }: DomeSelectorProps) {
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
            Photosynthesizers Challenge
          </h1>
          <p className="text-foreground font-bold text-lg sm:text-xl md:text-2xl px-2 sm:px-4 max-w-4xl mx-auto py-2 leading-relaxed overflow-visible text-shadow-glow whitespace-nowrap">
            Embark on a botanical adventure through our conservatory domes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto" role="group" aria-label="Dome selection">
          {(Object.keys(domeImages) as DomeName[]).map((domeName) => (
            <Button
              key={domeName}
              variant="outline"
              className="group h-auto py-10 px-8 flex flex-col items-center gap-6 bg-card/90 backdrop-blur-md border-2 rounded-2xl transition-all duration-500 ease-out hover:bg-card/95 hover:shadow-2xl hover:scale-[1.05] hover:-translate-y-2 hover:border-green-500 focus-visible:ring-4 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              onClick={() => onDomeSelect(domeName)}
              aria-label={`Select ${domeName} - ${domeDescriptions[domeName]}`}
            >
              <div className="dome-image-container relative">
                {/* Animated glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-500" />

                {/* Outer ring animation */}
                <div className="absolute -inset-2 rounded-full border-4 border-transparent group-hover:border-green-500/30 transition-all duration-500" />

                {/* Image container */}
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-border group-hover:border-green-500 shadow-2xl group-hover:shadow-green-500/50 transition-all duration-500">
                  <img
                    src={domeImages[domeName]}
                    alt=""
                    className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-500"
                    aria-hidden="true"
                  />
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              <div className="text-center space-y-2 transition-transform duration-500 group-hover:translate-y-1">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors duration-300">
                  {domeName}
                </span>
                <p className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {domeDescriptions[domeName]}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
