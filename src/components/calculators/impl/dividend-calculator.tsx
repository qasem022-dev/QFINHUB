"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function DividendCalculator() {
  const [investment, setInvestment] = React.useState(50000);
  const [yieldPct, setYieldPct] = React.useState(3.5);
  const [growth, setGrowth] = React.useState(6);
  const [timeValue, setTimeValue] = React.useState(10);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");

  const safeInvestment = Math.max(0, investment ?? 0);
  const safeYield = Math.max(0, Math.min(yieldPct ?? 0, 100));
  const safeGrowth = Math.max(0, Math.min(growth ?? 0, 100));

  const t = Math.max(1, Math.round(toMonths(timeValue, timeUnit) / 12));
  const maxYears = Math.min(t, 36);
  const annualIncome = safeInvestment * (safeYield / 100);
  const g = safeGrowth / 100;

  let totalDividends = 0;
  let currentIncome = annualIncome;
  const chartData: { year: string; "Dividend Income": number }[] = [
    { year: "Year 0", "Dividend Income": Math.round(currentIncome) },
  ];
  for (let y = 1; y <= maxYears; y++) {
    if (y < maxYears) {
      currentIncome *= (1 + g);
    }
    totalDividends += currentIncome;
    chartData.push({ year: `Year ${y}`, "Dividend Income": Math.round(currentIncome) });
  }

  const yieldOnCost = safeInvestment > 0 ? (currentIncome / safeInvestment) * 100 : 0;

  return (
    <CalculatorLayout
      title="Dividend Calculator"
      description="Project dividend income with DRIP, growth rates, and reinvestment strategies."
      icon={<span>💵</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Dividend Income" value={formatCurrency(currentIncome)} highlight subtext={`At year ${t}`} />
          <ResultCard label="Total Dividends Received" value={formatCurrency(totalDividends)} subtext={`Over ${t} years`} />
          <ResultCard label="Yield on Cost" value={formatPercentage(yieldOnCost)} />
          <ResultCard label="Initial Annual Income" value={formatCurrency(annualIncome)} subtext={`At ${yieldPct}% yield`} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey="Dividend Income" title="Dividend Growth" />
      <CalculatorInput input={{ id: "investment", label: "Initial Investment", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "The amount you are investing in dividend-paying stocks." }} value={investment} onChange={setInvestment} />
      <CalculatorInput input={{ id: "yieldPct", label: "Dividend Yield", type: "number", defaultValue: 3.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "The current annual dividend yield of the investment." }} value={yieldPct} onChange={setYieldPct} />
      <CalculatorInput input={{ id: "growth", label: "Annual Dividend Growth", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 50, step: 0.1, tooltip: "The expected annual growth rate of dividend payments." }} value={growth} onChange={setGrowth} />
      <PeriodInput
        id="investment-horizon"
        label="Investment Horizon"
        value={timeValue}
        unit={timeUnit}
        onValueChange={setTimeValue}
        onUnitChange={setTimeUnit}
        min={1}
        max={50}
      />
    </CalculatorLayout>
  );
}
