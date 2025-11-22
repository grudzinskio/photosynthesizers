import { Button } from "@/components/ui/button";
import type { DomeName } from "@/types";
import tropicalDomeImg from "@/assets/tropical_dome.jpg";
import desertDomeImg from "@/assets/desert_dome.jpg";
import showDomeImg from "@/assets/show_dome.webp";
import outsideOfDomesImg from "@/assets/outside_of_domes.jpg";
// Additional facility images available for future use:
// import insideDomeImg from "@/assets/inside_dome.webp";
// import domesFacilityMapImg from "@/assets/Domes Facility Map.webp";

interface DomeSelectorProps {
  onDomeSelect: (dome: DomeName) => void;
}

const domeImages: Record<DomeName, string> = {
  "Tropical Dome": tropicalDomeImg,
  "Desert Dome": desertDomeImg,
  "Show Dome": showDomeImg,
};

export function DomeSelector({ onDomeSelect }: DomeSelectorProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 py-8 overflow-hidden">
      {/* Background imagery with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${outsideOfDomesImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" aria-hidden="true" />
      
      {/* Content container with relative positioning to appear above background */}
      <div className="relative z-10 w-full max-w-4xl space-y-8 sm:space-y-12">
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Photosynthesizers Challenge

          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2 sm:px-4">
            Select your dome to begin
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8" role="group" aria-label="Dome selection">
          <Button
            variant="outline"
            className="h-auto py-4 sm:py-6 px-2 sm:px-4 flex flex-col items-center gap-3 sm:gap-4 hover:bg-accent hover:scale-[1.05] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
            onClick={() => onDomeSelect("Tropical Dome")}
            aria-label="Select Tropical Dome - A lush tropical environment with diverse plant species"
          >
            <img 
              src={domeImages["Tropical Dome"]} 
              alt="" 
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-2 border-border shadow-md"
              aria-hidden="true"
            />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-center">Tropical Dome</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 sm:py-6 px-2 sm:px-4 flex flex-col items-center gap-3 sm:gap-4 hover:bg-accent hover:scale-[1.05] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
            onClick={() => onDomeSelect("Desert Dome")}
            aria-label="Select Desert Dome - An arid environment featuring cacti and desert plants"
          >
            <img 
              src={domeImages["Desert Dome"]} 
              alt="" 
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-2 border-border shadow-md"
              aria-hidden="true"
            />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-center">Desert Dome</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 sm:py-6 px-2 sm:px-4 flex flex-col items-center gap-3 sm:gap-4 hover:bg-accent hover:scale-[1.05] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
            onClick={() => onDomeSelect("Show Dome")}
            aria-label="Select Show Dome - A seasonal display featuring rotating plant exhibitions"
          >
            <img 
              src={domeImages["Show Dome"]} 
              alt="" 
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-2 border-border shadow-md"
              aria-hidden="true"
            />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-center">Show Dome</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
