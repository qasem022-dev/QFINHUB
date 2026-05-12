"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
export default function RuleOf72() {
  const [rate, setRate] = React.useState(7);

  const safeRate = isFinite(rate) ? Math.max(0.1, Math.min(rate, 100)) : 7;

  const yearsToDouble = safeRate > 0 ? 72 / safeRate : 0;
  const exactYears = safeRate > 0 ? Math.log(2) / Math.log(1 + safeRate / 100) : 0;
  const actualMultiplier = Math.pow(1 + safeRate / 100, 10);

  const chartData = Array.from({ length: 21 }, (_, i) => {
    const y = i;
    const val = Math.pow(1 + safeRate / 100, y);
    return {
      year: `Year ${y}`,
      Value: isNaN(val) ? 1 : Math.round(val * 100) / 100,
    };
  });

  return (
    <CalculatorLayout
      title="Rule of 72"
      description="Estimate how long it will take for an investment to double at a given annual rate of return."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Years to Double" value={formatNumber(yearsToDouble, 1)} highlight />
          <ResultCard label="Exact (Log Formula)" value={formatNumber(exactYears, 1)} subtext={`ln(2) / ln(1 + ${safeRate}%)`} />
          <ResultCard label="Rule of 72" value={`72 ÷ ${safeRate}% = ${formatNumber(yearsToDouble, 1)} years`} />
          <ResultCard label="10-Year Growth" value={`${formatNumber(actualMultiplier, 2)}×`} subtext={`$1 grows to $${actualMultiplier.toFixed(2)} at ${safeRate}%`} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey="Value" title="Investment Growth ($1 Initial)" height={250} />
      <CalculatorInput
        input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 7, suffix: "%", min: 0.1, max: 100, step: 0.1, tooltip: "The annual rate of return on your investment." }}
        value={rate}
        onChange={setRate}
      />
    </CalculatorLayout>
  );
}
