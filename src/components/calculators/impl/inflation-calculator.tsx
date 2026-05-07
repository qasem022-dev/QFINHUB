"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function InflationCalculator() {
  const [currentAmount, setCurrentAmount] = React.useState(1000);
  const [inflationRate, setInflationRate] = React.useState(3);
  const [years, setYears] = React.useState(10);

  const r = inflationRate / 100;
  const futurePurchasingPower = currentAmount / Math.pow(1 + r, years);
  const totalImpact = currentAmount - futurePurchasingPower;

  const chartData = Array.from({ length: years + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Purchasing Power": Math.round(currentAmount / Math.pow(1 + r, i)),
    "Today's Value": Math.round(currentAmount),
  }));

  return (
    <CalculatorLayout
      title="Inflation Calculator"
      description="Calculate the future value of money adjusted for inflation over time."
      icon={<span>📉</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Future Purchasing Power" value={formatCurrency(futurePurchasingPower)} highlight />
          <ResultCard label="Total Inflation Impact" value={formatCurrency(totalImpact)} subtext={`Over ${years} years at ${inflationRate}% inflation`} />
          <ResultCard label="Today's Value" value={formatCurrency(currentAmount)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Purchasing Power", "Today's Value"]} title="Purchasing Power Over Time" />
      <CalculatorInput input={{ id: "currentAmount", label: "Current Amount", type: "number", defaultValue: 1000, suffix: "$", min: 0 }} value={currentAmount} onChange={setCurrentAmount} />
      <CalculatorInput input={{ id: "inflationRate", label: "Inflation Rate", type: "number", defaultValue: 3, suffix: "%", min: 0, max: 100, step: 0.1 }} value={inflationRate} onChange={setInflationRate} />
      <CalculatorInput input={{ id: "years", label: "Time Period", type: "number", defaultValue: 10, suffix: "years", min: 1, max: 50 }} value={years} onChange={setYears} />
    </CalculatorLayout>
  );
}
