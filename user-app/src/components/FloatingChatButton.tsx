import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function FloatingChatButton({ onClick, isOpen = false }: FloatingChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      aria-label={isOpen ? "Close plant information chatbot" : "Open plant information chatbot"}
      aria-expanded={isOpen}
      aria-controls="floating-chat-panel"
      className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-[0_8px_32px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.6)] hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500 focus-visible:ring-offset-2 ring-2 ring-green-400/30"
    >
      <MessageCircle className="h-8 w-8 text-white" aria-hidden="true" />
      <span className="sr-only">{isOpen ? "Close chatbot" : "Open chatbot"}</span>
    </Button>
  );
}
