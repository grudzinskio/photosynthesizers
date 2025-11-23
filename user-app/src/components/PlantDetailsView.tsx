import { useState, useEffect, useRef } from 'react';
import type { GameState } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PlantChatbot } from './PlantChatbot';
import { summarizePlant } from '@/api/gameApi';
import insideDomeImg from "@/assets/inside_dome.webp";

interface PlantDetailsViewProps {
  gameState: GameState;
  onBack: () => void;
  onDescriptionUpdate?: (description: string) => void;
}

export function PlantDetailsView({ gameState, onBack, onDescriptionUpdate }: PlantDetailsViewProps) {
  const { plantName, plantImage, plantDescription, domeType } = gameState;
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
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
          : 'Failed to load plant description. Please try again.'
      );
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-svh overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: `url(${insideDomeImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/40" aria-hidden="true" />

      {/* Header with back button */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <Button
          ref={backButtonRef}
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 min-h-[44px] px-4 hover:bg-green-100 dark:hover:bg-green-900"
          aria-label="Go back to success screen"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 overflow-hidden">
        <Card className="flex-1 flex flex-col max-w-4xl mx-auto w-full shadow-2xl border-2 border-green-200 dark:border-green-800 bg-card/95 backdrop-blur-sm overflow-hidden" role="main" aria-label="Plant details">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b-2 border-green-200 dark:border-green-800">
            <CardTitle 
              ref={titleRef}
              className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200"
              tabIndex={-1}
              id="plant-details-title"
            >
              {plantName}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            {/* Scrollable content area */}
            <div 
              className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6"
              role="region"
              aria-labelledby="plant-details-title"
              tabIndex={0}
            >
              {/* Reference Image */}
              {plantImage && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" aria-hidden="true" />
                  <img
                    src={plantImage}
                    alt={`Reference image of ${plantName}`}
                    className="relative w-full rounded-xl object-cover max-h-[300px] sm:max-h-[400px] shadow-xl border-4 border-green-200 dark:border-green-800"
                  />
                </div>
              )}

              {/* Plant Description */}
              {plantDescription === null ? (
                <div 
                  className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800"
                  role="status"
                  aria-live="polite"
                  aria-label={isRetrying ? "Retrying to load plant description" : retryError ? "Error loading plant description" : "Loading plant description"}
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-green-600 dark:text-green-400 mb-4" aria-hidden="true" />
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        Retrying...
                      </p>
                    </>
                  ) : retryError ? (
                    <>
                      <AlertCircle className="size-8 text-red-600 dark:text-red-400 mb-4" aria-hidden="true" />
                      <p className="text-red-700 dark:text-red-300 font-medium mb-4 text-center">
                        {retryError}
                      </p>
                      <Button
                        onClick={handleRetryDescription}
                        variant="outline"
                        className="border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
                        aria-label="Retry loading plant description"
                      >
                        <RefreshCw className="size-4 mr-2" aria-hidden="true" />
                        Retry
                      </Button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-8 animate-spin text-green-600 dark:text-green-400 mb-4" aria-hidden="true" />
                      <p className="text-green-700 dark:text-green-300 font-medium mb-2">
                        Loading plant details...
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 text-center">
                        This may take a moment
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  className="prose prose-green max-w-none p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md"
                  role="article"
                  aria-label="Plant description"
                >
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-3 mt-6">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-green-900 dark:text-green-100 mb-4 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-green-900 dark:text-green-100 mb-4 space-y-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-green-900 dark:text-green-100 mb-4 space-y-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-green-900 dark:text-green-100">
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
                    {plantDescription}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Fixed Chatbot at bottom */}
            <div className="border-t-2 border-green-200 dark:border-green-800">
              <PlantChatbot plantName={plantName} domeType={domeType} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
