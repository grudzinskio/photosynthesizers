import { Button } from "@/components/ui/button";
import { Palmtree, Sun, Flower2 } from "lucide-react";
import type { DomeName } from "@/types";

interface DomeSelectorProps {
  onDomeSelect: (dome: DomeName) => void;
}

export function DomeSelector({ onDomeSelect }: DomeSelectorProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome to Dome Defender
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            Select your dome to begin
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-[56px] py-4 px-6 text-lg font-semibold gap-3 hover:bg-accent hover:scale-[1.02] transition-all"
            onClick={() => onDomeSelect("Tropical Dome")}
          >
            <Palmtree className="size-6 shrink-0" />
            Tropical Dome
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-[56px] py-4 px-6 text-lg font-semibold gap-3 hover:bg-accent hover:scale-[1.02] transition-all"
            onClick={() => onDomeSelect("Desert Dome")}
          >
            <Sun className="size-6 shrink-0" />
            Desert Dome
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-[56px] py-4 px-6 text-lg font-semibold gap-3 hover:bg-accent hover:scale-[1.02] transition-all"
            onClick={() => onDomeSelect("Show Dome")}
          >
            <Flower2 className="size-6 shrink-0" />
            Show Dome
          </Button>
        </div>
      </div>
    </div>
  );
}
