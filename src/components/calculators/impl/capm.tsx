"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatPercentage } from "@/lib/utils";

function smlAnalysis(expectedReturn: number, riskFreeRate: number): string {
  if (expectedReturn > riskFreeRate) return "Above SML — potentially undervalued";
  if (expectedReturn < riskFreeRate) return "Below SML — potentially overvalued";
  return "On SML — fairly valued";
}

export default function CAPMCalculator() {
  const [riskFreeRate, setRiskFreeRate] = React.useState(4.5);
  const [beta, setBeta] = React.useState(1.2);
  const [marketReturn, setMarketReturn] = React.useState(10);

  const safeRiskFreeRate = isFinite(riskFreeRate) ? riskFreeRate : 0;
  const safeBeta = isFinite(beta) ? beta : 0;
  const safeMarketReturn = isFinite(marketReturn) ? marketReturn : 0;

  const marketRiskPremium = safeMarketReturn - safeRiskFreeRate;
  const betaRiskPremium = safeBeta * marketRiskPremium;
  const expectedReturn = safeRiskFreeRate + betaRiskPremium;

  const barData = [
    { metric: "Risk-Free Rate", value: riskFreeRate },
    { metric: "Market Risk Premium", value: marketRiskPremium },
    { metric: "Expected Return", value: expectedReturn },
  ];

  return (
    <CalculatorLayout
      title="CAPM Calculator"
      description="Calculate the expected return of an asset using the Capital Asset Pricing Model, incorporating systematic risk (beta), risk-free rate, and market return."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Expected Return"
            value={formatPercentage(expectedReturn)}
            highlight
          />
          <ResultCard
            label="Market Risk Premium"
            value={formatPercentage(marketRiskPremium)}
            subtext={`Market return minus risk-free rate`}
          />
          <ResultCard
            label="Beta Risk Premium"
            value={formatPercentage(betaRiskPremium)}
            subtext={`Beta × Market Risk Premium (${beta.toFixed(2)} × ${formatPercentage(marketRiskPremium)})`}
          />
          <ResultCard
            label="Security Market Line"
            value={smlAnalysis(expectedReturn, riskFreeRate)}
          />
        </div>
      }
    >
      <CalculatorChart
        type="bar"
        data={barData}
        xKey="metric"
        yKey="value"
        title="Return Breakdown (%)"
      />
      <CalculatorInput
        input={{ id: "riskFreeRate", label: "Risk-Free Rate", type: "number", defaultValue: 4.5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The return of a risk-free asset (e.g., 10-year Treasury bond yield)." }}
        value={riskFreeRate}
        onChange={setRiskFreeRate}
      />
      <CalculatorInput
        input={{ id: "beta", label: "Beta (Systematic Risk)", type: "number", defaultValue: 1.2, min: 0, max: 5, step: 0.01, tooltip: "Measures the asset's volatility relative to the market. β > 1 means more volatile than the market." }}
        value={beta}
        onChange={setBeta}
      />
      <CalculatorInput
        input={{ id: "marketReturn", label: "Market Return", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The expected return of the overall market (e.g., S&P 500)." }}
        value={marketReturn}
        onChange={setMarketReturn}
      />
    </CalculatorLayout>
  );
}
