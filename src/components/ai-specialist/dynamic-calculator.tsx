"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorInput } from "@/components/calculators/calculator-input";
import { ResultCard } from "@/components/calculators/result-card";
import { CalculatorChart } from "@/components/calculators/calculator-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  evaluateFormula,
  formatResultValue,
  generateChartData,
  generateTableData,
} from "@/lib/ai/evaluator";
import { cn } from "@/lib/utils";
import {
  Save,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Target,
  ChevronRight,
  Table2,
} from "lucide-react";
import type { AICalculatorResponse, AICalculatorInput } from "@/types/ai";
import { useTranslation } from "@/app/i18n-provider";

export interface DynamicCalculatorHandle {
  /** Returns a copy of the config with defaultValues updated to current user-modified values */
  getUpdatedConfig: () => AICalculatorResponse;
  /** Returns the raw current input values */
  getInputValues: () => Record<string, number>;
}

interface DynamicCalculatorProps {
  config: AICalculatorResponse;
  onSave?: (config: AICalculatorResponse) => void;
  saved?: boolean;
  onInputChange?: () => void;
}

export const DynamicCalculator = React.forwardRef<DynamicCalculatorHandle, DynamicCalculatorProps>(function DynamicCalculator({
  config,
  onSave,
  saved = false,
  onInputChange,
}: DynamicCalculatorProps, ref) {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Initialize input values from defaults
  const [inputValues, setInputValues] = React.useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      for (const input of config.inputs) {
        initial[input.id] = input.defaultValue;
      }
      return initial;
    },
  );

  // Update when config changes (new calculator generated)
  React.useEffect(() => {
    setIsTransitioning(true);
    const initial: Record<string, number> = {};
    for (const input of config.inputs) {
      initial[input.id] = input.defaultValue;
    }
    setInputValues(initial);

    // Brief delay to show transition, then remove
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [config]);

  // Expose getUpdatedConfig so the parent can access user-modified values
  React.useImperativeHandle(ref, () => ({
    getUpdatedConfig: () => {
      const updatedInputs = config.inputs.map((input) => ({
        ...input,
        defaultValue: inputValues[input.id] ?? input.defaultValue,
      }));
      return { ...config, inputs: updatedInputs };
    },
    getInputValues: () => ({ ...inputValues }),
  }), [config, inputValues]);

  const handleInputChange = (id: string, value: number) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
    onInputChange?.();
  };

  // Evaluate all results
  const evaluatedResults = React.useMemo(() => {
    return config.results.map((result) => {
      const value = evaluateFormula(result.formula, inputValues);
      const formatted = formatResultValue(value, result.format);
      return { ...result, numericValue: value, formatted };
    });
  }, [config.results, inputValues]);

  // Generate chart data
  const chartData = React.useMemo(() => {
    if (!config.chart) return [];
    return generateChartData(config.chart, inputValues);
  }, [config.chart, inputValues]);

  // Generate table data
  const tableData = React.useMemo(() => {
    if (!config.table) return [];
    return generateTableData(config.table, inputValues);
  }, [config.table, inputValues]);

  // Get the right AI input config for the CalculatorInput component
  const adaptInput = (input: AICalculatorInput) => {
    return {
      id: input.id,
      label: input.label,
      type: (input.type === "text" ? "number" : input.type) as "number" | "select" | "slider",
      defaultValue: input.defaultValue,
      min: input.min,
      max: input.max,
      step: input.step,
      suffix: input.suffix,
      tooltip: input.tooltip,
      options: input.options?.map((o) => ({
        label: o.label,
        value: String(o.value),
      })),
    };
  };

  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const priorityIcons = {
    high: AlertTriangle,
    medium: Target,
    low: Lightbulb,
  };

  // Loading skeleton for calculator transitions
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />

      {/* Inputs skeleton */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-4 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>

      {/* Results skeleton */}
      <div>
        <div className="mb-3 h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="h-[300px] rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div ref={containerRef} className={cn("", isTransitioning && "animate-fade-in")}>
          {isTransitioning ? (
            <LoadingSkeleton />
          ) : (
          <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {config.title}
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          </div>

          {/* Inputs */}
          <Card className="border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("dynamicCalc.inputs")}
              </CardTitle>
              <CardDescription>
                {t("dynamicCalc.inputsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.inputs.map((input) => (
                  <CalculatorInput
                    key={input.id}
                    input={adaptInput(input) as any}
                    value={inputValues[input.id] ?? input.defaultValue}
                    onChange={(val: number) => handleInputChange(input.id, val)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              {t("dynamicCalc.results")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {evaluatedResults.length > 0 ? (
                evaluatedResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    label={result.label}
                    value={result.formatted}
                    subtext={result.description}
                    highlight={result.highlight}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("dynamicCalc.noResults") || "Adjust inputs to see results"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          {config.chart && chartData.length > 0 && (
            <CalculatorChart
              type={config.chart.type}
              data={chartData}
              xKey={config.chart.xLabel}
              yKey={config.chart.yFormulas.map((f) => f.key)}
              title={config.chart.title}
              height={300}
            />
          )}

          {/* Table */}
          {config.table && tableData.length > 0 && (
            <Card className="border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-gray-500" />
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                    {config.table.rowLabel} {t("dynamicCalc.breakdown")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {config.table.columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          {config.table!.columns.map((col) => (
                            <td
                              key={col.key}
                              className="px-4 py-2.5 text-gray-900 dark:text-gray-100"
                            >
                              {String(row[col.key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan */}
          {config.plan && (
            <Card className="border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent-500" />
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("dynamicCalc.financialPlan")}
                  </CardTitle>
                </div>
                <CardDescription>{config.plan.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                {config.plan.steps.length > 0 && (
                  <div className="space-y-3">
                    {config.plan.steps.map((step, idx) => {
                      const PriorityIcon = priorityIcons[step.priority];
                      return (
                        <div
                          key={idx}
                          className="flex gap-3 rounded-lg border border-gray-100 p-3 transition-all hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                              priorityColors[step.priority],
                            )}
                          >
                            <PriorityIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {step.title}
                              </p>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] capitalize",
                                  priorityColors[step.priority],
                                )}
                              >
                                {step.priority}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {step.description}
                            </p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {config.plan.tips.length > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        {t("dynamicCalc.proTips")}
                      </p>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {config.plan.tips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"
                        >
                          <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save button */}
          {onSave && (
            <div className="flex justify-center pb-4">
              <Button
                onClick={() => {
                  const updatedInputs = config.inputs.map((input) => ({
                    ...input,
                    defaultValue: inputValues[input.id] ?? input.defaultValue,
                  }));
                  onSave({ ...config, inputs: updatedInputs });
                }}
                variant={saved ? "outline" : "default"}
                className="gap-2 transition-all hover:shadow-md"
              >
                <Save className="h-4 w-4" />
                {saved ? t("dynamicCalc.saveChanges") : t("dynamicCalc.saveCalculator")}
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
      </ScrollArea>
    </div>
  );
});