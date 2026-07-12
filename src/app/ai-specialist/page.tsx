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
        {/* Example prompts shown when chat is empty */}
        {messages.length === 0 && !isLoading && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">Try asking...</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Calculate mortgage payment for a $350K home with 20% down",
                "How much should I save monthly to retire at 60?",
                "Compare Roth IRA vs Traditional IRA for a 30-year-old",
                "What will $10K grow to in 20 years at 7% interest?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-left text-xs text-gray-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
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
    <>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <AISpecialistContent />
      </Suspense>

      {/* SEO + AdSense Content — Static, SSR-rendered, always visible to crawlers */}
      <article className="bg-white dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI Financial Specialist — Custom Calculator Builder
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Build a personalized financial calculator in seconds by
              describing what you want to calculate in plain English. Our
              AI Financial Specialist generates an interactive calculator
              tailored to your exact scenario — including the inputs,
              formulas, and visual results — without requiring you to
              write any code or hunt through 125 pre-built calculators to
              find the closest match.
            </p>
          </header>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              What Is the AI Financial Specialist?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              The AI Financial Specialist is QFINHUB&apos;s natural-language
              calculator builder. Instead of browsing our catalog of 125+
              pre-built calculators to find one that approximates what you
              need, you simply describe the calculation in everyday
              language — for example, &quot;calculate the monthly payment
              for a $350,000 home with 20% down at 7% interest for 30
              years&quot; or &quot;how much do I need to save monthly to
              retire at 60 with $1.5 million&quot;.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              The AI then generates a fully interactive calculator with the
              appropriate inputs, the right financial formula, and a
              results visualization — all in under 10 seconds. You can
              adjust the inputs to match your exact scenario, save the
              calculator to your account, or share it with a friend.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This makes QFINHUB the first financial calculator platform
              that combines the depth of a 125+ calculator library with the
              flexibility of an on-demand, AI-generated custom tool.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              How It Works
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Using the AI Financial Specialist takes about 30 seconds
              from start to finished calculation:
            </p>
            <ol className="space-y-3 text-gray-700 dark:text-gray-300 ml-2 list-decimal list-inside">
              <li className="leading-relaxed">
                <strong>Describe your calculation.</strong> Type your
                question in the chat panel in plain English. Be as
                specific or general as you like — both work.
              </li>
              <li className="leading-relaxed">
                <strong>AI generates the calculator.</strong> Within 5-10
                seconds, the AI builds a custom calculator with the right
                inputs, formula, and visualization for your question.
              </li>
              <li className="leading-relaxed">
                <strong>Adjust the inputs.</strong> Change any input to
                match your personal scenario. Results recalculate
                instantly.
              </li>
              <li className="leading-relaxed">
                <strong>Save or share.</strong> Sign in (free) to save
                the calculator to your dashboard, or share the link with
                a friend or financial advisor.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Example Calculations You Can Build
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The AI Financial Specialist can build a calculator for
              virtually any financial calculation, including:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Mortgage and loan scenarios:</strong> specific
                home prices, down payments, interest rates, and term
                lengths
              </li>
              <li>
                <strong>Retirement projections:</strong> custom savings
                targets, retirement ages, and contribution schedules
              </li>
              <li>
                <strong>Investment comparisons:</strong> side-by-side
                scenarios comparing different asset allocations or
                contribution levels
              </li>
              <li>
                <strong>Debt payoff strategies:</strong> specific debt
                balances, interest rates, and extra payment plans
              </li>
              <li>
                <strong>Tax calculations:</strong> federal and state tax
                estimates based on income, filing status, and deductions
              </li>
              <li>
                <strong>Net worth tracking:</strong> custom asset and
                liability categories
              </li>
              <li>
                <strong>College savings:</strong> 529 plan projections
                with custom contribution schedules
              </li>
              <li>
                <strong>Business calculations:</strong> break-even
                analysis, pricing models, payroll estimates
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Example Prompts to Get You Started
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Not sure what to ask? Try one of these example prompts to
              see the AI Financial Specialist in action:
            </p>
            <div className="space-y-3">
              {[
                "Calculate mortgage payment for a $350K home with 20% down at 7% for 30 years",
                "How much should I save monthly to retire at 60 with $1.5 million?",
                "Compare Roth IRA vs Traditional IRA for a 30-year-old earning $80K",
                "What will $10K grow to in 20 years at 7% annual interest?",
                "Calculate the total interest paid on a $25K car loan at 6.5% for 5 years",
                "How long to pay off $8K credit card debt with $200/month payments at 22% APR?",
                "Estimate take-home pay for $75K salary in California with 401k contribution",
                "Calculate monthly savings needed for $50K down payment in 3 years",
              ].map((prompt, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    &quot;{prompt}&quot;
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              AI Disclosure &amp; Accuracy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              The AI Financial Specialist uses a large language model
              (LLM) to translate your natural-language question into a
              structured calculator configuration. We use two models
              depending on the complexity of the question:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2 mb-4">
              <li>
                <strong>Flash model</strong> (default): fast responses
                for common financial calculations, optimized for simple
                to moderate complexity
              </li>
              <li>
                <strong>Pro / reasoning model</strong> (for complex
                questions): slower but more careful, used for questions
                requiring multi-step financial reasoning
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              <strong>Important accuracy notes:</strong>
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2 mb-4">
              <li>
                AI-generated calculators are based on standard financial
                formulas that have been verified by QFINHUB&apos;s
                editorial team
              </li>
              <li>
                For complex or unusual scenarios, always verify the
                generated calculator&apos;s results against an independent
                source or a qualified financial professional
              </li>
              <li>
                The AI may occasionally generate a calculator with inputs
                or formulas that don&apos;t perfectly match your intent —
                review the inputs and adjust as needed
              </li>
              <li>
                Tax calculations are estimates only and do not account for
                every possible deduction, credit, or jurisdiction-specific
                rule
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The AI Financial Specialist is a tool to help you model
              financial scenarios more easily — it is not a substitute
              for professional financial advice. For decisions involving
              significant money, consult a qualified CFP®, CPA, or
              licensed attorney in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Privacy &amp; Data
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              When you use the AI Financial Specialist, we send your
              question to our AI provider (Google Gemini) to generate
              the calculator configuration. We do not store the
              conversation history server-side unless you explicitly save
              a calculator to your account.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Saved calculators are stored in your secure account and can
              be deleted at any time. We never share your calculations or
              personal financial information with third parties for
              marketing purposes. See our{" "}
              <a
                href="/privacy"
                className="text-primary-600 dark:text-primary-400 underline font-medium"
              >
                Privacy Policy
              </a>{" "}
              for full details.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You can use the AI Financial Specialist without signing in
              — your question is processed and a calculator is generated,
              but it will not be saved to your account unless you choose
              to save it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Features at a Glance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-2xl mb-2">🧮</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Interactive Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Every AI-generated calculator is fully interactive —
                  adjust inputs and see results update in real time.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Visual Results
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Charts, breakdowns, and amortization schedules help you
                  understand your scenario at a glance.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Save to Dashboard
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Sign in (free) to save calculators and access them from
                  any device.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-2xl mb-2">💾</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Share with Others
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Share a link to any saved calculator with a friend,
                  family member, or financial advisor.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              When to Use the AI Specialist vs. Pre-Built Calculators
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Both options are free and accurate. Here&apos;s how to
              choose:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Use pre-built calculators</strong> when your
                question matches a common scenario (mortgage payment,
                compound interest, retirement projection, etc.). They
                load faster, are battle-tested against thousands of users,
                and produce predictable results.
              </li>
              <li>
                <strong>Use the AI Specialist</strong> when your scenario
                is unusual, multi-step, or doesn&apos;t fit any of our
                pre-built calculators. Examples: comparing three
                different mortgage scenarios side by side, modeling a
                specific debt-payoff strategy, or calculating a custom
                tax scenario for your specific state and filing status.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>

            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Is the AI Financial Specialist free to use?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Yes, completely free. You can generate unlimited
                  calculators without signing in. Signing in (also free)
                  lets you save calculators to your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  How accurate are AI-generated calculators?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  AI-generated calculators use the same verified financial
                  formulas as our pre-built calculators. For common
                  scenarios, accuracy is very high. For unusual or
                  complex scenarios, we recommend verifying results
                  against an independent source.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Can I edit the AI-generated calculator?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Yes. Once a calculator is generated, every input field
                  is fully editable. Adjust any value to match your
                  scenario and the results will recalculate instantly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  What languages does the AI Specialist support?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  You can ask questions in any of the 33 languages we
                  support. The AI will respond in the same language you
                  used in your question.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Does the AI Specialist provide financial advice?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  No. The AI Specialist builds calculators based on
                  standard financial formulas. It does not provide
                  personalized financial, tax, investment, or legal
                  advice. For major decisions, consult a qualified
                  professional.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 p-6">
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300 mb-3">
              Important Disclaimer
            </h2>
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              The AI Financial Specialist and all calculators it
              generates are provided for educational and informational
              purposes only. They do not constitute financial advice,
              investment advice, tax advice, or any other professional
              advice. You should consult with a qualified professional
              for advice tailored to your specific situation. All
              calculator outputs are estimates and their accuracy is not
              guaranteed. By using this tool, you agree to our{" "}
              <a
                href="/terms"
                className="underline font-medium"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="underline font-medium"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <footer className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
            <p>
              The AI Financial Specialist is part of QFINHUB&apos;s
              mission to make accurate financial information universally
              accessible. Learn more about our editorial standards on our{" "}
              <a
                href="/editorial-policy"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Editorial Policy
              </a>{" "}
              page or read about our formula sources on the{" "}
              <a
                href="/methodology"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Methodology
              </a>{" "}
              page.
            </p>
          </footer>
        </div>
      </article>
    </>
  );
}
