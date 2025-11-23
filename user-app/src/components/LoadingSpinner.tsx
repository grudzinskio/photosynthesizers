import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const displayMessage = message || t("loading.default");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-card/95 backdrop-blur-sm p-10 sm:p-12 shadow-2xl border-4 border-green-300 dark:border-green-700 mx-4 max-w-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse" />
          <Loader2 className="relative size-20 sm:size-24 animate-spin text-green-600 dark:text-green-400" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-center text-green-800 dark:text-green-200">{displayMessage}</p>
      </div>
    </div>
  );
}
