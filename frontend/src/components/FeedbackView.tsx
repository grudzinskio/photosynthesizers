import type { FeedbackData } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

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
    <div className="flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 py-8 bg-background">
      <Card 
        className={`w-full max-w-md shadow-lg ${
          isSuccess 
            ? 'border-green-500 border-2 bg-green-50/50 dark:bg-green-950/20' 
            : 'border-red-500 border-2 bg-red-50/50 dark:bg-red-950/20'
        }`}
      >
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-center">
            <Badge 
              variant={isSuccess ? 'default' : 'destructive'}
              className={`text-base sm:text-lg px-6 py-3 gap-2 font-semibold ${
                isSuccess 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : ''
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="size-5 sm:size-6" />
                  Success!
                </>
              ) : (
                <>
                  <XCircle className="size-5 sm:size-6" />
                  Not Quite
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:px-6">
          {/* Captured photo thumbnail */}
          <div className="flex justify-center bg-muted/30 rounded-lg p-2 border border-border">
            <img
              src={capturedImage}
              alt="Your captured photo"
              className="w-full max-h-[200px] sm:max-h-[250px] object-contain rounded-md"
            />
          </div>

          {/* Feedback message */}
          <div className="text-center bg-card rounded-lg p-4 border border-border">
            <p className="text-base sm:text-lg leading-relaxed text-foreground">
              {feedback.message}
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-6 px-4 sm:px-6 pb-6">
          {isSuccess ? (
            <Button
              size="lg"
              className="w-full min-h-[56px] text-base sm:text-lg font-semibold bg-green-500 hover:bg-green-600 text-white hover:scale-[1.02] transition-all"
              onClick={onNextMission}
            >
              Next Mission
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              className="w-full min-h-[56px] text-base sm:text-lg font-semibold hover:scale-[1.02] transition-all"
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
