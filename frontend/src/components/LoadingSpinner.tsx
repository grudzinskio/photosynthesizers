import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Analyzing..." }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-xl bg-background p-8 sm:p-10 shadow-2xl border border-border mx-4 max-w-sm">
        <Loader2 className="size-16 sm:size-20 animate-spin text-primary" />
        <p className="text-lg sm:text-xl font-semibold text-center">{message}</p>
      </div>
    </div>
  );
}
