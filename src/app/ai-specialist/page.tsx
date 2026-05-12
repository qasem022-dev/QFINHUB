"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/ai-specialist/chat-panel";
import { DynamicCalculator, type DynamicCalculatorHandle } from "@/components/ai-specialist/dynamic-calculator";
import type { ChatMessage, AICalculatorResponse } from "@/types/ai";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, Loader2, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslation } from "@/app/i18n-provider";

function AISpecialistContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentCalculator, setCurrentCalculator] =
    React.useState<AICalculatorResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedPlanId, setSavedPlanId] = React.useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [savedTitle, setSavedTitle] = React.useState<string | null>(null);
  const dynamicCalcRef = React.useRef<DynamicCalculatorHandle>(null);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load plan if ?id= query param is present
  React.useEffect(() => {
    const planId = searchParams.get("id");
    if (!planId) return;

    let cancelled = false;
    setLoadingPlan(true);

    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("aiSave.signInToView"));
          return;
        }

        const { data, error } = await supabase
          .from("saved_plans")
          .select("*")
          .eq("id", planId)
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;
        if (!data || cancelled) return;

        const calculator = data.config as AICalculatorResponse;
        setCurrentCalculator(calculator);
        setSavedPlanId(planId);
        setHasUnsavedChanges(false);
        setSavedTitle(data.title || calculator.title);
        setMessages([{
          id: generateId(),
          role: "assistant",
          content: t("aiSave.loadedPlan").replace("{title}", data.title || calculator.title),
          calculator,
        }]);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : t("aiSave.loadFailed"));
        }
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams]);

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
            data.error || t("aiSave.generating"),
          );
        }

        const calculator: AICalculatorResponse = data.calculator;

        // Add assistant message with calculator
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.content || t("aiSave.createdCalc").replace("{title}", calculator.title),
          calculator,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentCalculator(calculator);
        setSavedPlanId(null);
        setHasUnsavedChanges(false);
        setSavedTitle(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("aiSave.errorGeneric");
        setError(errorMessage);

        // Add error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: t("aiSave.errorMessage").replace("{error}", errorMessage),
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
        const body: Record<string, unknown> = { config };

        // If we already have a saved plan ID, update it instead of creating a duplicate
        if (savedPlanId) {
          body.id = savedPlanId;
        }

        const response = await fetch("/api/ai/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("aiSave.saveFailed"));
        }

        const planId = data.plan?.id;
        if (planId) {
          setSavedPlanId(planId);
          setSavedTitle(data.title || config.title || null);
        }
        setHasUnsavedChanges(false);

        if (data.updated) {
          toast.success(t("aiSave.planUpdated"));
        } else {
          toast.success(t("aiSave.calcSaved"));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("aiSave.saveFailed");
        toast.error(errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, savedPlanId],
  );

  // Ctrl+S keyboard shortcut for saving
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentCalculator && !isSaving) {
          const configToSave = dynamicCalcRef.current?.getUpdatedConfig() ?? currentCalculator;
          handleSave(configToSave);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCalculator, isSaving, handleSave]);

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
              {t("aiSpecialist.title")}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t("aiSpecialist.askMe")}
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
                : t("aiSpecialist.noCalculator")}
            </h2>
            {currentCalculator && (
              <>
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                  {t("aiSpecialist.generated")}
                </span>
                {(currentCalculator as any)._model && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    (currentCalculator as any)._model === 'deepseek-reasoner'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {(currentCalculator as any)._model === 'deepseek-reasoner' ? 'Pro' : 'Flash'}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentCalculator ? (
              <button
                onClick={() => {
                  const configToSave = dynamicCalcRef.current?.getUpdatedConfig() ?? currentCalculator;
                  handleSave(configToSave);
                }}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSaving
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    : savedPlanId
                      ? hasUnsavedChanges
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-surface-dark dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : savedPlanId ? (
                  <Bookmark className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                {isSaving ? t("aiSave.saving") : savedPlanId ? (hasUnsavedChanges ? t("aiSave.saveChanges") : t("aiSave.planSaved")) : t("aiSave.savePlan")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Content */}
        {loadingPlan ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("aiSpecialist.loadingPlan")}</p>
            </div>
          </div>
        ) : currentCalculator ? (
          <DynamicCalculator
            ref={dynamicCalcRef}
            config={currentCalculator}
            onSave={handleSave}
            saved={!!savedPlanId}
            onInputChange={() => setHasUnsavedChanges(true)}
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
                {t("aiSpecialist.featuresTitle")}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("aiSpecialist.featuresDesc")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: "🧮", titleKey: "aiSpecialist.featureCalc", descKey: "aiSpecialist.featureCalcDesc" },
                  { icon: "📊", titleKey: "aiSpecialist.featureChart", descKey: "aiSpecialist.featureChartDesc" },
                  { icon: "📋", titleKey: "aiSpecialist.featurePlans", descKey: "aiSpecialist.featurePlansDesc" },
                  { icon: "💾", titleKey: "aiSpecialist.featureSave", descKey: "aiSpecialist.featureSaveDesc" },
                ].map((feature) => (
                  <div
                    key={feature.titleKey}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="mb-1 text-lg">{feature.icon}</div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {t(feature.titleKey)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {t(feature.descKey)}
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

export default function AISpecialistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <AISpecialistContent />
    </Suspense>
  );
}
