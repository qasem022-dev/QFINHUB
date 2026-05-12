"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, AlertCircle, Shuffle, X } from "lucide-react";
import type { ChatMessage } from "@/types/ai";
import { useTranslation } from "@/app/i18n-provider";

const EXAMPLE_PREFIXES = [
  "Calculate my ",
  "Help me plan ",
  "How much should I ",
  "What's the best ",
  "Create a ",
  "Show me ",
];

const EXAMPLE_SUFFIXES = [
  "monthly mortgage payment",
  "retirement savings goal",
  "investment growth over 10 years",
  "loan amortization schedule",
  "tax estimation for freelancers",
  "compound interest calculator",
  "debt payoff plan",
  "budget allocation for 50/30/20 rule",
  "SIP investment return",
  "home affordability check",
];

function getRandomExample(): string {
  const prefix = EXAMPLE_PREFIXES[Math.floor(Math.random() * EXAMPLE_PREFIXES.length)];
  const suffix = EXAMPLE_SUFFIXES[Math.floor(Math.random() * EXAMPLE_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export function ChatPanel({ messages, onSend, isLoading, error }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTryExample = () => {
    const example = getRandomExample();
    setInput(example);
    // Focus the textarea
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30">
                <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("chat.title")}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {t("chat.description")}
              </p>
              <div className="mt-6 space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => onSend(t(`chat.examples.${i}`))}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                  >
                    &ldquo;{t(`chat.examples.${i}`)}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "assistant" && (
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.calculator && (
                  <div className="mt-2 rounded-lg border border-primary-200 bg-primary-50/50 p-2 dark:border-primary-800 dark:bg-primary-900/20">
                    <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                      {msg.calculator.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("chat.calcGenerated")}
                    </p>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("chat.thinking")}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-slide-up dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                rows={1}
                disabled={isLoading}
                className="min-h-[40px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-600 dark:focus:ring-primary-800"
              />
              {input && (
                <button
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Clear input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl transition-all hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!input.trim() && !isLoading && messages.length > 0 && (
            <button
              onClick={handleTryExample}
              className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-[11px] text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <Shuffle className="h-3 w-3" />
              Try an example
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

