import type { GameState, DomeName } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, ExternalLink } from 'lucide-react';
import insideDomeImg from "@/assets/inside_dome.webp";
import { useEffect, useState } from 'react';
import { getWikipediaPlantData, type WikipediaPlantData } from '@/api/wikipediaApi';
import { useTranslation } from '@/hooks/useTranslation';

interface MissionViewProps {
  gameState: GameState;
  domeName: DomeName;
  onFoundIt: () => void;
  onChangeDome: () => void;
}

export function MissionView({ gameState, domeName, onFoundIt, onChangeDome }: MissionViewProps) {
  const { t } = useTranslation();
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
    <div className="relative flex flex-col min-h-svh px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: `url(${insideDomeImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/40" aria-hidden="true" />
      {/* Header with dome badge */}
      <div className="relative z-10 flex items-center justify-between mb-6 lg:mb-8 gap-2 max-w-5xl max-w-ultra mx-auto w-full">
        <Badge variant="secondary" className="text-sm sm:text-base px-5 py-2.5 font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border border-green-300 dark:border-green-700">
          {domeName}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onChangeDome}
          className="gap-2 min-h-[44px] px-4 bg-white/90 dark:bg-gray-800/90 border-2 shadow-md hover:bg-green-50 dark:hover:bg-green-900"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{t('mission.changeDome')}</span>
          <span className="sm:hidden">{t('mission.change')}</span>
        </Button>
      </div>

      {/* Mission Card */}
      <Card className="relative z-10 flex-1 flex flex-col max-w-5xl max-w-ultra mx-auto w-full shadow-2xl border-2 border-green-200 dark:border-green-800 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b-2 border-green-200 dark:border-green-800">
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 dark:text-green-200">{t('mission.title')}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Two-column layout on lg+ screens */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left column (60%) - Plant name and image */}
            <div className="flex-1 lg:w-[60%] flex flex-col gap-4 lg:gap-6">
              {/* Plant Name Box */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-md">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 dark:text-green-200 text-center">
                  {gameState.plantName}
                </h3>
              </div>

              {/* Reference Image from Wikipedia */}
              {wikiData && wikiData.found && (
                <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm sm:text-base text-muted-foreground font-bold uppercase tracking-wide">
                      {t('mission.referenceImage')}
                    </p>
                    {wikiData.url && (
                      <a
                        href={wikiData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs sm:text-sm text-green-600 dark:text-green-400 hover:underline min-h-[44px] min-w-[44px] justify-center"
                        aria-label={`${t('mission.viewOnWikipedia')} ${wikiData.title} (opens in new tab)`}
                      >
                        <ExternalLink className="size-3 sm:size-4" aria-hidden="true" />
                        {t('mission.viewOnWikipedia')}
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

                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    {t('mission.sourceWikipedia')} ({wikiData.source === 'species' ? t('mission.speciesPage') : wikiData.source === 'genus' ? t('mission.genusPage') : t('mission.genusImage')})
                  </p>
                </div>
              )}

              {loadingWiki && (
                <div className="flex items-center justify-center p-4 sm:p-6 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <p className="text-sm sm:text-base text-green-600 dark:text-green-400 animate-pulse">
                    {t('mission.loadingReferenceImage')}
                  </p>
                </div>
              )}
            </div>

            {/* Right column (40%) - Additional content */}
            <div className="flex-1 lg:w-[40%] flex flex-col gap-4 lg:gap-6">
              {wikiData && wikiData.found && (
                <>
                  {wikiData.description && wikiData.description !== 'Species of plant' && (
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
                      <h4 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-200 mb-2 sm:mb-3">{t('mission.description')}</h4>
                      <p className="text-sm sm:text-base text-green-900 dark:text-green-100 italic leading-relaxed">
                        {wikiData.description}
                      </p>
                    </div>
                  )}

                  {wikiData.extract && (
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
                      <h4 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-200 mb-2 sm:mb-3">{t('mission.about')}</h4>
                      <p className="text-sm sm:text-base text-green-950 dark:text-green-50 line-clamp-6 leading-relaxed">
                        {wikiData.extract}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-t-2 border-green-200 dark:border-green-800">
          {/* Primary Action Button */}
          <Button
            onClick={onFoundIt}
            size="lg"
            className="w-full min-h-[60px] text-base sm:text-lg font-bold gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] hover:animate-pulse active:scale-[0.98] transition-all duration-200"
          >
            <Camera className="size-6 sm:size-7" />
            {t('mission.foundIt')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
