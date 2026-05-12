"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatPercentage } from "@/lib/utils";

function sharpeInterpretation(ratio: number): string {
  if (ratio > 2) return "Excellent (>2)";
  if (ratio >= 1) return "Good (1–2)";
  if (ratio >= 0.5) return "Fair (0.5–1)";
  return "Poor (<0.5)";
}

export default function SharpeRatio() {
  const [portfolioReturn, setPortfolioReturn] = React.useState(12);
  const [riskFreeRate, setRiskFreeRate] = React.useState(4.5);
  const [stdDeviation, setStdDeviation] = React.useState(15);

  const safePortfolioReturn = isFinite(portfolioReturn) ? portfolioReturn : 0;
  const safeRiskFreeRate = isFinite(riskFreeRate) ? riskFreeRate : 0;
  const safeStdDev = isFinite(stdDeviation) ? stdDeviation : 0;

  const excessReturn = safePortfolioReturn - safeRiskFreeRate;
  const sharpe = safeStdDev > 0 ? excessReturn / safeStdDev : 0;

  const barData = [
    { metric: "Portfolio Return", value: portfolioReturn },
    { metric: "Risk-Free Rate", value: riskFreeRate },
    { metric: "Excess Return", value: excessReturn },
  ];

  return (
    <CalculatorLayout
      title="Sharpe Ratio"
      description="Measure risk-adjusted return using the Sharpe ratio, comparing portfolio returns to the risk-free rate."
      icon={<span>📐</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Sharpe Ratio" value={sharpe.toFixed(2)} highlight />
          <ResultCard label="Interpretation" value={sharpeInterpretation(sharpe)} />
          <ResultCard label="Excess Return" value={formatPercentage(excessReturn)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={barData} xKey="metric" yKey="value" title="Return Comparison (%)" />
      <CalculatorInput
        input={{
          id: "portfolioReturn",
          label: "Portfolio Return",
          type: "number",
          defaultValue: 12,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Expected annual return of the portfolio.",
        }}
        value={portfolioReturn}
        onChange={setPortfolioReturn}
      />
      <CalculatorInput
        input={{
          id: "riskFreeRate",
          label: "Risk-Free Rate",
          type: "number",
          defaultValue: 4.5,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Return of a risk-free asset (e.g., 10-year Treasury yield).",
        }}
        value={riskFreeRate}
        onChange={setRiskFreeRate}
      />
      <CalculatorInput
        input={{
          id: "stdDeviation",
          label: "Standard Deviation",
          type: "number",
          defaultValue: 15,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Portfolio volatility measured as annualized standard deviation.",
        }}
        value={stdDeviation}
        onChange={setStdDeviation}
      />
    </CalculatorLayout>
  );
}
