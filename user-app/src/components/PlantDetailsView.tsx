import { useState, useEffect, useRef } from 'react';
import type { GameState } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FloatingChatButton } from './FloatingChatButton';
import { FloatingChatPanel } from './FloatingChatPanel';
import { summarizePlant } from '@/api/gameApi';
import { useTranslation } from '@/hooks/useTranslation';

interface PlantDetailsViewProps {
  gameState: GameState;
  onBack: () => void;
  onDescriptionUpdate?: (description: string) => void;
}

export function PlantDetailsView({ gameState, onBack, onDescriptionUpdate }: PlantDetailsViewProps) {
  const { plantName, plantImage, plantDescription, domeType } = gameState;
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2]));
  const [showAllSections, setShowAllSections] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Focus management when component mounts
  useEffect(() => {
    // Focus on the title for screen readers to announce the page
    titleRef.current?.focus();
  }, []);

  const handleRetryDescription = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await summarizePlant(domeType, plantName);
      onDescriptionUpdate?.(response.summary);
    } catch (error) {
      console.error('Error retrying plant description:', error);
      setRetryError(
        error instanceof Error
          ? error.message
          : t('plantDetails.failedToLoad')
      );
    } finally {
      setIsRetrying(false);
    }
  };

  // Parse markdown content into sections based on h2 headings
  const parseSections = (markdown: string) => {
    const lines = markdown.split('\n');
    const sections: { title: string; content: string }[] = [];
    let currentSection: { title: string; content: string } | null = null;

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace('## ', '').trim(),
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      } else {
        // Content before first h2
        if (sections.length === 0) {
          sections.push({ title: '', content: line + '\n' });
        } else {
          sections[0].content += line + '\n';
        }
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Modal container */}
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col animate-in zoom-in-95 duration-300">
        <Card className="flex-1 flex flex-col w-full shadow-2xl border-2 border-green-200 dark:border-green-800 bg-card overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="plant-details-title">
          <CardHeader className="pb-3 sm:pb-4 px-6 sm:px-8 pt-4 sm:pt-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b-2 border-green-200 dark:border-green-800 flex flex-row items-center justify-between gap-4">
            <CardTitle
              ref={titleRef}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 dark:text-green-200 flex-1"
              tabIndex={-1}
              id="plant-details-title"
            >
              {plantName}
            </CardTitle>
            <Button
              ref={backButtonRef}
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-11 w-11 shrink-0 text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 hover:bg-green-100 dark:hover:bg-green-900"
              aria-label={t('plantDetails.close')}
            >
              <ArrowLeft className="size-6" aria-hidden="true" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            {/* Scrollable content area */}
            <div
              className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 sm:py-6"
              role="region"
              aria-labelledby="plant-details-title"
              tabIndex={0}
            >
              {plantDescription === null ? (
                <div
                  className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800"
                  role="status"
                  aria-live="polite"
                  aria-label={isRetrying ? t('plantDetails.retryingToLoad') : retryError ? t('plantDetails.errorLoadingDescription') : t('plantDetails.loadingDescription')}
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-green-600 dark:text-green-400 mb-4" aria-hidden="true" />
                      <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium">
                        {t('plantDetails.retrying')}
                      </p>
                    </>
                  ) : retryError ? (
                    <>
                      <AlertCircle className="size-8 text-red-600 dark:text-red-400 mb-4" aria-hidden="true" />
                      <p className="text-sm sm:text-base text-red-700 dark:text-red-300 font-medium mb-4 text-center">
                        {retryError}
                      </p>
                      <Button
                        onClick={handleRetryDescription}
                        variant="outline"
                        className="border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950 min-h-[44px] min-w-[44px]"
                        aria-label={t('plantDetails.retryLoading')}
                      >
                        <RefreshCw className="size-4 mr-2" aria-hidden="true" />
                        {t('plantDetails.retry')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-8 animate-spin text-green-600 dark:text-green-400 mb-4" aria-hidden="true" />
                      <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium mb-2">
                        {t('plantDetails.loadingDetails')}
                      </p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 text-center">
                        {t('plantDetails.loadingMayTakeMoment')}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Description sections - full width */}
                  <div className="space-y-4">
                    {(() => {
                      const sections = parseSections(plantDescription);
                      const visibleSections = showAllSections ? sections : sections.slice(0, 3);

                      return (
                        <>
                          {visibleSections.map((section, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md overflow-hidden"
                            >
                              {section.title && (
                                <button
                                  type="button"
                                  onClick={() => toggleSection(index)}
                                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-green-100 dark:hover:bg-green-900 transition-colors duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                                  aria-expanded={expandedSections.has(index) ? 'true' : 'false'}
                                  aria-controls={`section-${index}`}
                                  aria-label={`${expandedSections.has(index) ? t('plantDetails.collapse') : t('plantDetails.expand')} ${section.title} section`}
                                >
                                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-green-800 dark:text-green-200">
                                    {section.title}
                                  </h2>
                                  {expandedSections.has(index) ? (
                                    <ChevronUp className="size-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                                  ) : (
                                    <ChevronDown className="size-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                                  )}
                                </button>
                              )}
                              {expandedSections.has(index) && (
                                <div
                                  id={`section-${index}`}
                                  className="prose prose-green max-w-none p-3 sm:p-4 pt-0"
                                  role="region"
                                  aria-label={section.title || t('plantDetails.plantInformation')}
                                >
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800 dark:text-green-200 mb-2 sm:mb-3">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-green-800 dark:text-green-200 mb-2 mt-3 sm:mt-4">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-green-800 dark:text-green-200 mb-2 mt-2 sm:mt-3">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="text-sm sm:text-base text-green-900 dark:text-green-100 mb-2 sm:mb-3 leading-relaxed">
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside text-green-900 dark:text-green-100 mb-2 sm:mb-3 space-y-1">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside text-green-900 dark:text-green-100 mb-2 sm:mb-3 space-y-1">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li className="text-sm sm:text-base text-green-900 dark:text-green-100">
                                          {children}
                                        </li>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-bold text-green-800 dark:text-green-200">
                                          {children}
                                        </strong>
                                      ),
                                    }}
                                  >
                                    {section.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Read More button */}
                          {sections.length > 3 && (
                            <div className="flex justify-center pt-2 sm:pt-3">
                              <Button
                                onClick={() => setShowAllSections(!showAllSections)}
                                variant="outline"
                                className="border-2 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900 shadow-md text-sm sm:text-base min-h-[44px]"
                                aria-expanded={showAllSections ? 'true' : 'false'}
                                aria-label={showAllSections ? t('plantDetails.showLessSections') : t('plantDetails.readMoreSections', '', { count: String(sections.length - 3) })}
                              >
                                {showAllSections ? (
                                  <>
                                    {t('plantDetails.showLess')}
                                    <ChevronUp className="ml-2 size-4" aria-hidden="true" />
                                  </>
                                ) : (
                                  <>
                                    {t('plantDetails.readMore')} ({sections.length - 3} {sections.length - 3 === 1 ? t('plantDetails.moreSection', '', { count: String(sections.length - 3) }) : t('plantDetails.moreSections', '', { count: String(sections.length - 3) })})
                                    <ChevronDown className="ml-2 size-4" aria-hidden="true" />
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Plant image at bottom */}
                  {plantImage && (
                    <div className="relative group mt-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" aria-hidden="true" />
                      <img
                        src={plantImage}
                        alt={t('plantDetails.referenceImageAlt', '', { plantName })}
                        className="relative w-full rounded-xl object-cover max-h-[400px] shadow-xl border-4 border-green-200 dark:border-green-800"
                      />
                      <p className="text-sm text-center mt-3 text-green-700 dark:text-green-300 font-medium">{t('plantDetails.wikipediaReferenceImage')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Chatbot system positioned in modal */}
        <div className="absolute bottom-6 right-6 z-10">
          <FloatingChatButton
            onClick={() => setIsChatOpen(!isChatOpen)}
            isOpen={isChatOpen}
          />
        </div>

        <FloatingChatPanel
          plantName={plantName}
          domeType={domeType}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}
