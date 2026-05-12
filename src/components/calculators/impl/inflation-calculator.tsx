"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function InflationCalculator() {
  const [currentAmount, setCurrentAmount] = React.useState(1000);
  const [inflationRate, setInflationRate] = React.useState(3);
  const [years, setYears] = React.useState(10);
  const [yearsUnit, setYearsUnit] = React.useState<PeriodUnit>("years");

  const safeAmount = Math.max(0, currentAmount ?? 0);
  const safeR = Math.max(0, Math.min(inflationRate ?? 0, 100)) / 100;
  const safeYears = Math.max(0, toMonths(years, yearsUnit) / 12);

  const futurePurchasingPower = safeYears > 0 && safeR >= 0
    ? safeAmount / Math.pow(1 + safeR, safeYears)
    : safeR < 0
      ? safeAmount * Math.pow(1 + Math.abs(safeR), safeYears)
      : safeAmount;
  const totalImpact = safeAmount - futurePurchasingPower;

  const safePower = isNaN(futurePurchasingPower) || !isFinite(futurePurchasingPower) ? 0 : futurePurchasingPower;
  const safeImpact = isNaN(totalImpact) || !isFinite(totalImpact) ? 0 : totalImpact;

  const maxYears = Math.min(Math.max(Math.ceil(safeYears), 1), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const power = safeR >= 0 ? Math.pow(1 + safeR, i) : Math.pow(1 + Math.abs(safeR), i);
    return {
      year: `Year ${i}`,
      "Purchasing Power": Math.round(safeR >= 0 ? safeAmount / power : safeAmount * power),
      "Today's Value": Math.round(safeAmount),
    };
  });

  return (
    <CalculatorLayout
      title="Inflation Calculator"
      description="Calculate the future value of money adjusted for inflation over time."
      icon={<span>📉</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Future Purchasing Power" value={formatCurrency(safePower)} highlight subtext={`What $${safeAmount.toLocaleString()} will be worth`} />
          <ResultCard label="Total Inflation Impact" value={formatCurrency(safeImpact)} subtext={`Over ${safeYears.toFixed(1)} years at ${inflationRate}% inflation`} />
          <ResultCard label="Today's Value" value={formatCurrency(safeAmount)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Purchasing Power", "Today's Value"]} title="Purchasing Power Over Time" />
      <CalculatorInput input={{ id: "currentAmount", label: "Current Amount", type: "number", defaultValue: 1000, suffix: "$", min: 0, tooltip: "The current amount of money you want to adjust for inflation." }} value={currentAmount} onChange={setCurrentAmount} />
      <CalculatorInput input={{ id: "inflationRate", label: "Inflation Rate", type: "number", defaultValue: 3, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual inflation rate (e.g., 3 for 3%)." }} value={inflationRate} onChange={setInflationRate} />
      <PeriodInput
        id="years"
        label="Time Period"
        value={years}
        unit={yearsUnit}
        onValueChange={setYears}
        onUnitChange={setYearsUnit}
        min={1}
        max={50}
      />
    </CalculatorLayout>
  );
}
