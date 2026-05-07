"use client";

import * as React from "react";
import { ChatPanel } from "@/components/ai-specialist/chat-panel";
import { DynamicCalculator } from "@/components/ai-specialist/dynamic-calculator";
import type { ChatMessage, AICalculatorResponse } from "@/types/ai";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, Loader2, Bookmark } from "lucide-react";

export default function AISpecialistPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentCalculator, setCurrentCalculator] =
    React.useState<AICalculatorResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());

  const handleSend = React.useCallback(
    async (query: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: query,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            context: messages.slice(-6), // Send recent context
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to generate calculator",
          );
        }

        const calculator: AICalculatorResponse = data.calculator;

        // Add assistant message with calculator
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.content || `I've created a **${calculator.title}** for you. Check the results panel on the right to interact with it.`,
          calculator,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentCalculator(calculator);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(errorMessage);

        // Add error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: `Sorry, I encountered an error: ${errorMessage}. Please try rephrasing your request.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const handleSave = React.useCallback(
    async (config: AICalculatorResponse) => {
      if (isSaving) return;
      setIsSaving(true);

      try {
        const response = await fetch("/api/ai/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save calculator");
        }

        setSavedIds((prev) => new Set(prev).add(config.title));
        toast.success("Calculator saved successfully!");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save calculator";
        toast.error(errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Chat Panel - Left */}
      <div className="flex w-full flex-col border-r border-gray-200 lg:w-[420px] dark:border-gray-700">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-accent-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              AI Specialist
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Ask me to build any financial calculator
            </p>
          </div>
        </div>
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Results Panel - Right */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentCalculator
                ? currentCalculator.title
                : "Calculator Results"}
            </h2>
            {currentCalculator && (
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                AI Generated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentCalculator && !savedIds.has(currentCalculator.title) && (
              <button
                onClick={() => handleSave(currentCalculator)}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-surface-dark dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentCalculator ? (
          <DynamicCalculator
            config={currentCalculator}
            onSave={handleSave}
            saved={savedIds.has(currentCalculator.title)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20">
                  <Sparkles className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Financial Specialist
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Describe the financial calculator you need, and I'll
                build it instantly — complete with inputs, results,
                charts, and a personalized financial plan.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="mb-1 text-lg">{feature.icon}</div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const features = [
  {
    icon: "🧮",
    title: "Custom Calculators",
    description: "AI builds any calculator you describe",
  },
  {
    icon: "📊",
    title: "Interactive Charts",
    description: "Dynamic visualizations and tables",
  },
  {
    icon: "📋",
    title: "Financial Plans",
    description: "Actionable steps and pro tips",
  },
  {
    icon: "💾",
    title: "Save & Reuse",
    description: "Save your favorite calculators",
  },
];
