"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";

// Type-only — stripped at compile time, zero runtime cost.
import type * as RechartsModule from "recharts";

const BRACKETS_2024_SINGLE = [
  { rate: 0.10, from: 0, to: 11600 },
  { rate: 0.12, from: 11600, to: 47150 },
  { rate: 0.22, from: 47150, to: 100525 },
  { rate: 0.24, from: 100525, to: 191950 },
  { rate: 0.32, from: 191950, to: 243725 },
  { rate: 0.35, from: 243725, to: 609350 },
  { rate: 0.37, from: 609350, to: Infinity },
];

const BRACKETS_2024_MARRIED = [
  { rate: 0.10, from: 0, to: 23200 },
  { rate: 0.12, from: 23200, to: 94300 },
  { rate: 0.22, from: 94300, to: 201050 },
  { rate: 0.24, from: 201050, to: 383900 },
  { rate: 0.32, from: 383900, to: 487450 },
  { rate: 0.35, from: 487450, to: 731200 },
  { rate: 0.37, from: 731200, to: Infinity },
];

const BRACKET_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const BRACKET_LABELS = [
  "10% Bracket",
  "12% Bracket",
  "22% Bracket",
  "24% Bracket",
  "32% Bracket",
  "35% Bracket",
  "37% Bracket",
];

interface ChartDataItem {
  name: string;
  [key: string]: string | number;
}

function HorizontalStackedBar({
  data,
  bracketKeys,
  rc,
}: {
  data: ChartDataItem;
  bracketKeys: string[];
  rc: typeof RechartsModule;
}) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip: RechartsTooltip,
    ResponsiveContainer,
    Legend,
  } = rc;
  const chartData = [data];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-500 dark:text-gray-400" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" hide />
        <RechartsTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-surface-dark">
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Taxable Income by Bracket
                </p>
                {payload
                  .filter((entry) => typeof entry.value === "number" && entry.value > 0)
                  .map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{entry.name}:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Number(entry.value))}
                      </span>
                    </div>
                  ))}
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
          formatter={(value: string) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
        />
        {bracketKeys.map((key, idx) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={BRACKET_COLORS[idx % BRACKET_COLORS.length]}
            radius={idx === bracketKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function TaxBracketCalculator() {
  const [annualIncome, setAnnualIncome] = React.useState(80000);
  const [filingStatus, setFilingStatus] = React.useState(0); // 0 = single, 1 = married

  // Dynamic recharts import — defers ~150KB until the chart section is rendered.
  const [R, setR] = React.useState<typeof RechartsModule | null>(null);
  const [chartReady, setChartReady] = React.useState(false);

  React.useEffect(() => {
    import("recharts").then((mod) => {
      setR(mod);
      requestAnimationFrame(() => setChartReady(true));
    });
  }, []);

  const safeIncome = Math.max(0, isFinite(annualIncome) ? annualIncome : 0);

  const brackets = filingStatus === 0 ? BRACKETS_2024_SINGLE : BRACKETS_2024_MARRIED;

  const taxableIncome = safeIncome;
  let totalTax = 0;
  const bracketAmounts: Record<string, number> = {};
  let marginalBracketLabel = "N/A";

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]!;
    if (taxableIncome <= bracket.from) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
    if (taxableInBracket > 0) {
      bracketAmounts[BRACKET_LABELS[i]!] = Math.round(taxableInBracket);
    }
    totalTax += taxableInBracket * bracket.rate;
    marginalBracketLabel = BRACKET_LABELS[i]!;
  }

  const effectiveRate = safeIncome > 0 ? (totalTax / safeIncome) * 100 : 0;
  const afterTaxIncome = safeIncome - totalTax;

  const activeBracketKeys = BRACKET_LABELS.filter((key) => (bracketAmounts[key] ?? 0) > 0);

  return (
    <CalculatorLayout
      title="Tax Bracket Visualizer"
      description="Find your federal income tax bracket and visualize taxes owed at each bracket level."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Marginal Bracket" value={marginalBracketLabel} highlight />
          <ResultCard label="Total Tax Owed" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} />
          <ResultCard label="Taxable Income" value={formatCurrency(taxableIncome)} />
          <ResultCard label="After-Tax Income" value={formatCurrency(afterTaxIncome)} />
          {activeBracketKeys.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Income in Each Bracket
              </p>
              <div className="space-y-1.5">
                {activeBracketKeys.map((key) => {
                  const bracketIndex = BRACKET_LABELS.indexOf(key);
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: BRACKET_COLORS[bracketIndex] }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{key}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(bracketAmounts[key] ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
    >
      <Card className="border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
            Taxable Income by Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartReady && R ? (
            <HorizontalStackedBar
              data={{ name: "Income", ...bracketAmounts }}
              bracketKeys={activeBracketKeys.length > 0 ? activeBracketKeys : BRACKET_LABELS}
              rc={R}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
            </div>
          )}
        </CardContent>
      </Card>
      <CalculatorInput
        input={{
          id: "annualIncome",
          label: "Annual Income",
          type: "slider",
          defaultValue: 80000,
          min: 0,
          max: 1000000,
          suffix: "$",
          step: 1000,
          tooltip: "Your total taxable income used to determine your tax bracket.",
        }}
        value={annualIncome}
        onChange={setAnnualIncome}
      />
      <CalculatorInput
        input={{
          id: "filingStatus",
          label: "Filing Status",
          type: "select",
          defaultValue: 0,
          options: [
            { label: "Single", value: 0 },
            { label: "Married Jointly", value: 1 },
          ],
          tooltip: "Your filing status determines the tax brackets used.",
        }}
        value={filingStatus}
        onChange={setFilingStatus}
      />
    </CalculatorLayout>
  );
}
