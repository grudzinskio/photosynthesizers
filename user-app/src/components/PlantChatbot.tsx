import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { askPlantQuestion } from '@/api/gameApi';
import type { ChatMessage, DomeName } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface PlantChatbotProps {
  plantName: string;
  domeType: DomeName;
}

// Maximum number of messages to keep in history
const MAX_MESSAGES = 10;

function PlantChatbotComponent({ plantName, domeType }: PlantChatbotProps) {
  const { t, currentLanguage } = useTranslation();
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
      setStatusMessage(t('chat.thinking'));
    } else if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setStatusMessage(t('chat.emptyState'));
      }
    }
  }, [isLoading, messages, t]);

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
    setStatusMessage(t('chat.send'));

    try {
      // Call API to get AI response with 30 second timeout
      const response = await askPlantQuestion(trimmedInput, domeType, plantName, currentLanguage, 30000);

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
        : t('errors.generic');
      
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
      setStatusMessage(t('errors.generic'));
      console.error('Chatbot error:', error);
    } finally {
      setIsLoading(false);
      // Refocus input after sending
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, domeType, plantName, currentLanguage, t]);

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="flex flex-col h-full" role="region" aria-label={t('chat.ariaLabelChatbot')}>
      {/* Screen reader announcements for status changes */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Chat header */}
      <div className="px-4 py-3 border-b border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100" id="chatbot-title">
          {t('chat.title')}
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          {t('chat.subtitle', '', { plantName })}
        </p>
      </div>

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label={t('chat.ariaLabelHistory')}
        aria-describedby="chatbot-title"
        tabIndex={0}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">
              {t('chat.emptyState')}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={message.role === 'user' ? t('chat.ariaLabelUserMessage') : t('chat.ariaLabelAiMessage')}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-foreground'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" role="status" aria-label={t('chat.ariaLabelGenerating')}>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">{t('chat.thinking')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
          role="search"
          aria-label={t('chat.ariaLabelAskQuestion')}
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('chat.placeholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 border-green-300 dark:border-green-700 focus-visible:ring-green-500"
            aria-label={t('chat.ariaLabelQuestionInput')}
            aria-describedby="chatbot-title"
            autoComplete="off"
          />
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md disabled:opacity-50"
            aria-label={isLoading ? t('chat.send') : t('chat.send')}
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-5" aria-hidden="true" />
            )}
            <span className="sr-only">{t('chat.send')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const PlantChatbot = memo(PlantChatbotComponent);
