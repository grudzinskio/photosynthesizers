import type { FeedbackData } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import insideDomeImg from "@/assets/inside_dome.webp";

interface FeedbackViewProps {
  feedback: FeedbackData;
  capturedImage: string;
  onNextMission: () => void;
  onTryAgain: () => void;
}

export function FeedbackView({ 
  feedback, 
  capturedImage, 
  onNextMission, 
  onTryAgain 
}: FeedbackViewProps) {
  const isSuccess = feedback.success;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 py-8 overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: `url(${insideDomeImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/40" aria-hidden="true" />
      <Card 
        className={`relative z-10 w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur-sm ${
          isSuccess 
            ? 'border-4 border-green-400 dark:border-green-600' 
            : 'border-4 border-red-400 dark:border-red-600'
        }`}
      >
        <CardHeader className="space-y-6 pb-6 pt-8">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${
                isSuccess ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <Badge 
                variant={isSuccess ? 'default' : 'destructive'}
                className={`relative text-lg sm:text-xl px-8 py-4 gap-3 font-bold shadow-xl ${
                  isSuccess 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-2 border-green-300' 
                    : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border-2 border-red-300'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="size-6 sm:size-7" />
                    Success!
                  </>
                ) : (
                  <>
                    <XCircle className="size-6 sm:size-7" />
                    Not Quite
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-6 sm:px-8">
          {/* Captured photo thumbnail */}
          <div className="relative group">
            <div className={`absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
              isSuccess ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <div className={`relative rounded-xl p-3 border-4 shadow-xl ${
              isSuccess 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-300 dark:border-green-700'
                : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-300 dark:border-red-700'
            }`}>
              <img
                src={capturedImage}
                alt="Your captured photo"
                className="w-full max-h-[250px] sm:max-h-[300px] object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Feedback message */}
          <div className={`text-center rounded-xl p-6 border-2 shadow-md ${
            isSuccess
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-300 dark:border-green-700'
              : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-300 dark:border-red-700'
          }`}>
            <p className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
              {feedback.message}
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-6 px-6 sm:px-8 pb-8">
          {isSuccess ? (
            <Button
              size="lg"
              className="w-full min-h-[60px] text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              onClick={onNextMission}
            >
              Next Mission
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full min-h-[60px] text-base sm:text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              onClick={onTryAgain}
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
