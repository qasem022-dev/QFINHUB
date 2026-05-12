"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput, toMonths, toPeriods } from "..";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
export default function RuleOf72() {
  const [rate, setRate] = React.useState(7);
  const [period, setPeriod] = React.useState(10);
  const [periodUnit, setPeriodUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeRate = isFinite(rate) ? Math.max(0.1, Math.min(rate, 100)) : 7;

  const yearsToDouble = safeRate > 0 ? 72 / safeRate : 0;
  const exactYears = safeRate > 0 ? Math.log(2) / Math.log(1 + safeRate / 100) : 0;
  const safePeriod = isFinite(period) ? Math.max(1, period) : 10;
  const periodInMonths = toMonths(safePeriod, periodUnit);
  const actualMultiplier = Math.pow(1 + safeRate / 100, periodInMonths / 12);

  const periodInYears = periodInMonths / 12;
  const numSteps = Math.max(2, Math.round(periodInMonths));
  const chartData = Array.from({ length: Math.min(numSteps + 1, 120) }, (_, i) => {
    const monthsElapsed = (i / numSteps) * periodInMonths;
    const yearsElapsed = monthsElapsed / 12;
    const val = Math.pow(1 + safeRate / 100, yearsElapsed);
    return {
      period: periodUnit === "years" ? `Yr ${Math.round(yearsElapsed)}` :
              periodUnit === "months" ? `Mo ${Math.round(monthsElapsed)}` :
              periodUnit === "weeks" ? `Wk ${Math.round(monthsElapsed * 4.345)}` :
              `Day ${Math.round(monthsElapsed * 30.44)}`,
      Value: isNaN(val) ? 1 : Math.round(val * 100) / 100,
    };
  });

  const periodLabel = periodUnit === "years" ? "Year" :
                      periodUnit === "months" ? "Month" :
                      periodUnit === "weeks" ? "Week" : "Day";

  return (
    <CalculatorLayout
      title="Rule of 72"
      description="Estimate how long it will take for an investment to double at a given annual rate of return."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label={`${periodLabel}s to Double`} value={periodUnit === "years" ? formatNumber(yearsToDouble, 1) : formatNumber(toPeriods(yearsToDouble, "years"), 1)} highlight subtext={`At ${safeRate}% annual return`} />
          <ResultCard label="Exact (Log Formula)" value={formatNumber(exactYears, 1)} subtext={`ln(2) / ln(1 + ${safeRate}%) = ${exactYears.toFixed(1)} years`} />
          <ResultCard label="Rule of 72" value={`72 ÷ ${safeRate}% = ${formatNumber(yearsToDouble, 1)} years`} />
          <ResultCard label={`${safePeriod}-${periodUnit} Growth`} value={`${formatNumber(actualMultiplier, 2)}×`} subtext={`$$1 grows to $${actualMultiplier.toFixed(2)} at ${safeRate}%`} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="period" yKey="Value" title={`Investment Growth ($$1 Initial over ${safePeriod} ${periodUnit})`} height={250} />
      <CalculatorInput
        input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 7, suffix: "%", min: 0.1, max: 100, step: 0.1, tooltip: "The annual rate of return on your investment." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="projectionPeriod" label="Projection Period" value={period} unit={periodUnit} onValueChange={setPeriod} onUnitChange={setPeriodUnit} min={1} max={100} />
    </CalculatorLayout>
  );
}
