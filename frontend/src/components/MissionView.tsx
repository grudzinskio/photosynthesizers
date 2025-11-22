import type { Mission, DomeName } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft } from 'lucide-react';

interface MissionViewProps {
  mission: Mission;
  domeName: DomeName;
  onFoundIt: () => void;
  onChangeDome: () => void;
}

export function MissionView({ mission, domeName, onFoundIt, onChangeDome }: MissionViewProps) {
  return (
    <div className="flex flex-col min-h-svh p-4 sm:p-6 bg-background">
      {/* Header with dome badge */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <Badge variant="secondary" className="text-sm sm:text-base px-4 py-2 font-medium">
          {domeName}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onChangeDome}
          className="gap-2 min-h-[44px] px-3"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Change Dome</span>
          <span className="sm:hidden">Change</span>
        </Button>
      </div>

      {/* Mission Card */}
      <Card className="flex-1 flex flex-col max-w-2xl mx-auto w-full shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold">Your Mission</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-6 px-4 sm:px-6">
          {/* Riddle Text */}
          <div className="text-base sm:text-lg leading-relaxed text-foreground p-4 bg-muted/50 rounded-lg border border-border">
            {mission.riddle}
          </div>

          {/* Reference Image */}
          {mission.referenceImage && (
            <div className="flex flex-col gap-3">
              <p className="text-sm sm:text-base text-muted-foreground font-semibold">
                Reference Image:
              </p>
              <img
                src={mission.referenceImage}
                alt="Plant reference"
                className="w-full rounded-lg object-cover max-h-[300px] sm:max-h-[400px] shadow-md border border-border"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-6 px-4 sm:px-6 pb-6">
          {/* Primary Action Button */}
          <Button
            onClick={onFoundIt}
            size="lg"
            className="w-full min-h-[56px] text-base sm:text-lg font-semibold gap-3 hover:scale-[1.02] transition-all"
          >
            <Camera className="size-5 sm:size-6" />
            Found it!
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
