import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, X } from 'lucide-react';
import { askPlantQuestion } from '@/api/gameApi';
import type { ChatMessage, DomeName } from '@/types';

interface FloatingChatPanelProps {
  plantName: string;
  domeType: DomeName;
  isOpen: boolean;
  onClose: () => void;
}

// Maximum number of messages to keep in history
const MAX_MESSAGES = 10;

function FloatingChatPanelComponent({
  plantName,
  domeType,
  isOpen,
  onClose
}: FloatingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastSendTimeRef = useRef<number>(0);

  // Auto-scroll to latest message with smooth animation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [messages]);

  // Announce loading state changes to screen readers
  useEffect(() => {
    if (isLoading) {
      setStatusMessage('Generating response...');
    } else if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setStatusMessage('Response received');
      }
    }
  }, [isLoading, messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Memoized send handler with debounce protection
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Debounce: Check if 500ms has passed since last send
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    if (timeSinceLastSend < 500) {
      return; // Ignore rapid-fire requests
    }
    lastSendTimeRef.current = now;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    // Add user message to chat and limit history to MAX_MESSAGES
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      // Keep only the last MAX_MESSAGES messages
      return updated.length > MAX_MESSAGES
        ? updated.slice(updated.length - MAX_MESSAGES)
        : updated;
    });
    setInputValue('');
    setIsLoading(true);
    setStatusMessage('Sending question...');

    try {
      // Call API to get AI response with 30 second timeout
      const response = await askPlantQuestion(trimmedInput, domeType, plantName);

      // Create AI message
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        // Keep only the last MAX_MESSAGES messages
        return updated.length > MAX_MESSAGES
          ? updated.slice(updated.length - MAX_MESSAGES)
          : updated;
      });
    } catch (error) {
      // Create error message with specific error details
      const errorContent = error instanceof Error
        ? error.message
        : 'Failed to get response. Please try again.';

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        // Keep only the last MAX_MESSAGES messages
        return updated.length > MAX_MESSAGES
          ? updated.slice(updated.length - MAX_MESSAGES)
          : updated;
      });
      setStatusMessage('Error occurred');
      console.error('Chatbot error:', error);
    } finally {
      setIsLoading(false);
      // Refocus input after sending
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, domeType, plantName]);

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isOpen) return null;

  return (
    <div
      id="floating-chat-panel"
      className={`
        absolute bottom-24 right-6
        w-[calc(100%-3rem)] sm:w-[500px]
        h-[650px] max-h-[calc(100%-8rem)]
        bg-white dark:bg-gray-900
        border-2 border-green-200 dark:border-green-800
        rounded-2xl shadow-2xl
        flex flex-col
        z-20
        animate-in slide-in-from-bottom-4 fade-in duration-300
      `}
      role="dialog"
      aria-labelledby="chatbot-title"
      aria-describedby="chatbot-subtitle"
      aria-modal="true"
    >
      {/* Screen reader announcements for status changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-t-2xl flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100 truncate" id="chatbot-title">
            Ask About This Plant
          </h3>
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 truncate" id="chatbot-subtitle">
            {plantName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 hover:bg-green-100 dark:hover:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          aria-label="Close chat"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat message history"
        aria-describedby="chatbot-title"
        tabIndex={0}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center px-2">
            <p className="text-muted-foreground text-xs sm:text-sm">
              Ask a question to learn more about this plant!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={`${message.role === 'user' ? 'Your question' : 'AI response'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${message.role === 'user'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-foreground'
                }`}
            >
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" role="status" aria-label="AI is generating a response">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span className="text-xs sm:text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 sm:p-4 border-t-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
          role="search"
          aria-label="Ask a question about the plant"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 border-green-300 dark:border-green-700 focus-visible:ring-green-500"
            aria-label="Question input"
            aria-describedby="chatbot-title"
            autoComplete="off"
          />
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md disabled:opacity-50 min-h-[44px] min-w-[44px]"
            aria-label={isLoading ? "Sending message" : "Send message"}
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-5" aria-hidden="true" />
            )}
            <span className="sr-only">{isLoading ? "Sending" : "Send"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const FloatingChatPanel = memo(FloatingChatPanelComponent);
