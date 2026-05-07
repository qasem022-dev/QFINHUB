"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import type { ChatMessage } from "@/types/ai";

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
                AI Financial Specialist
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Ask me to build any financial calculator. Try asking about
                compound interest, loan payments, retirement planning, or
                investment returns.
              </p>
              <div className="mt-6 space-y-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(prompt)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
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
                      Calculator generated - see results panel
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
            <div className="flex gap-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to build a financial calculator..."
            rows={1}
            disabled={isLoading}
            className="min-h-[40px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-600 dark:focus:ring-primary-800"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const examplePrompts = [
  "Build a compound interest calculator with monthly contributions",
  "Create a loan payment calculator with amortization table",
  "Build a retirement planning calculator with withdrawal strategy",
  "Create an investment return calculator with CAGR",
  "Build a mortgage affordability calculator",
];
