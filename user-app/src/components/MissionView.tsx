import type { GameState, DomeName } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, ExternalLink } from 'lucide-react';
import insideDomeImg from "@/assets/inside_dome.webp";
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { getWikipediaPlantData, type WikipediaPlantData } from '@/api/wikipediaApi';

interface MissionViewProps {
  gameState: GameState;
  domeName: DomeName;
  onFoundIt: () => void;
  onChangeDome: () => void;
}

export function MissionView({ gameState, domeName, onFoundIt, onChangeDome }: MissionViewProps) {
  const [wikiData, setWikiData] = useState<WikipediaPlantData | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(false);

  // Fetch Wikipedia data when plant name changes
  useEffect(() => {
    if (!gameState.plantName) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoadingWiki(true);
      try {
        const data = await getWikipediaPlantData(gameState.plantName);
        if (!cancelled) {
          setWikiData(data);
          setLoadingWiki(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch Wikipedia data:', error);
          setLoadingWiki(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [gameState.plantName]);

  return (
    <div className="relative flex flex-col min-h-svh p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: `url(${insideDomeImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/40" aria-hidden="true" />
      {/* Header with dome badge */}
      <div className="relative z-10 flex items-center justify-between mb-8 gap-2 max-w-3xl mx-auto w-full">
        <Badge variant="secondary" className="text-sm sm:text-base px-5 py-2.5 font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border border-green-300 dark:border-green-700">
          {domeName}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onChangeDome}
          className="gap-2 min-h-[44px] px-4 hover:bg-green-100 dark:hover:bg-green-900"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Change Dome</span>
          <span className="sm:hidden">Change</span>
        </Button>
      </div>

      {/* Mission Card */}
      <Card className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full shadow-2xl border-2 border-green-200 dark:border-green-800 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b-2 border-green-200 dark:border-green-800">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">Your Mission</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-8 px-6 sm:px-8 py-8">
          {/* Plant Name Box */}
          <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200 text-center">
              {gameState.plantName}
            </h3>
          </div>

          {/* Plant Description with Markdown */}
          <div className="text-base sm:text-lg leading-relaxed text-foreground p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-md prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            {gameState.plantDescription ? (
              <ReactMarkdown
                components={{
                  h1: (props) => <h1 className="text-2xl font-bold mb-4 text-amber-900 dark:text-amber-100" {...props} />,
                  h2: (props) => <h2 className="text-xl font-bold mb-3 text-amber-900 dark:text-amber-100" {...props} />,
                  h3: (props) => <h3 className="text-lg font-bold mb-2 text-amber-900 dark:text-amber-100" {...props} />,
                  h4: (props) => <h4 className="text-base font-bold mb-2 text-amber-900 dark:text-amber-100" {...props} />,
                  p: (props) => <p className="mb-3 text-amber-950 dark:text-amber-50" {...props} />,
                  strong: (props) => <strong className="font-bold text-amber-900 dark:text-amber-100" {...props} />,
                  em: (props) => <em className="italic" {...props} />,
                  ul: (props) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                  ol: (props) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                  li: (props) => <li className="text-amber-950 dark:text-amber-50" {...props} />,
                }}
              >
                {gameState.plantDescription}
              </ReactMarkdown>
            ) : (
              <p className="italic font-medium text-center">Loading plant description...</p>
            )}
          </div>

          {/* Reference Image from Wikipedia */}
          {wikiData && wikiData.found && (
            <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm sm:text-base text-muted-foreground font-bold uppercase tracking-wide">
                  Reference Image:
                </p>
                {wikiData.url && (
                  <a
                    href={wikiData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    <ExternalLink className="size-3 sm:size-4" />
                    View on Wikipedia
                  </a>
                )}
              </div>

              {wikiData.thumbnail && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <img
                    src={wikiData.thumbnail}
                    alt={`${wikiData.title} from Wikipedia`}
                    className="relative w-full rounded-xl object-cover max-h-[350px] sm:max-h-[450px] shadow-xl border-4 border-green-200 dark:border-green-800"
                  />
                </div>
              )}

              {wikiData.description && (
                <p className="text-sm text-green-900 dark:text-green-100 italic">
                  {wikiData.description}
                </p>
              )}

              {wikiData.extract && (
                <p className="text-sm text-green-950 dark:text-green-50 line-clamp-3">
                  {wikiData.extract}
                </p>
              )}

              <p className="text-xs text-green-600 dark:text-green-400">
                Source: Wikipedia ({wikiData.source === 'species' ? 'Species page' : wikiData.source === 'genus' ? 'Genus page' : 'Genus image'})
              </p>
            </div>
          )}

          {loadingWiki && (
            <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 animate-pulse">
                Loading reference image...
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-6 px-6 sm:px-8 pb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-t-2 border-green-200 dark:border-green-800">
          {/* Primary Action Button */}
          <Button
            onClick={onFoundIt}
            size="lg"
            className="w-full min-h-[60px] text-base sm:text-lg font-bold gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <Camera className="size-6 sm:size-7" />
            Found it!
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
