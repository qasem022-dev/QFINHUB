"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatPercentage } from "@/lib/utils";

export default function AlphaCalculator() {
  const [portfolioReturn, setPortfolioReturn] = React.useState(15);
  const [riskFreeRate, setRiskFreeRate] = React.useState(4.5);
  const [beta, setBeta] = React.useState(1.2);
  const [marketReturn, setMarketReturn] = React.useState(10);

  const safePortfolioReturn = isFinite(portfolioReturn) ? portfolioReturn : 0;
  const safeRiskFreeRate = isFinite(riskFreeRate) ? riskFreeRate : 0;
  const safeBeta = isFinite(beta) ? beta : 0;
  const safeMarketReturn = isFinite(marketReturn) ? marketReturn : 0;

  const expectedReturnCAPM = safeRiskFreeRate + safeBeta * (safeMarketReturn - safeRiskFreeRate);
  const alpha = safePortfolioReturn - expectedReturnCAPM;
  const excessReturn = safePortfolioReturn - safeRiskFreeRate;

  const barData = [
    { metric: "Portfolio Return", value: portfolioReturn },
    { metric: "Expected (CAPM)", value: Math.round(expectedReturnCAPM * 100) / 100 },
    { metric: "Alpha", value: Math.round(alpha * 100) / 100 },
  ];

  return (
    <CalculatorLayout
      title="Alpha Calculator"
      description="Calculate Jensen's Alpha — the risk-adjusted excess return of a portfolio compared to its expected return from the CAPM model."
      icon={<span>α</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Jensen's Alpha" value={formatPercentage(alpha)} highlight subtext={alpha > 0 ? "Outperforming the market" : alpha < 0 ? "Underperforming the market" : "In line with the market"} />
          <ResultCard label="Expected Return (CAPM)" value={formatPercentage(expectedReturnCAPM)} />
          <ResultCard label="Excess Return" value={formatPercentage(excessReturn)} subtext={`Portfolio return minus risk-free rate`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={barData} xKey="metric" yKey="value" title="Return Comparison (%)" />
      <CalculatorInput
        input={{ id: "portfolioReturn", label: "Portfolio Return", type: "number", defaultValue: 15, suffix: "%", min: -100, max: 1000, step: 0.1, tooltip: "Actual return of the portfolio." }}
        value={portfolioReturn}
        onChange={setPortfolioReturn}
      />
      <CalculatorInput
        input={{ id: "riskFreeRate", label: "Risk-Free Rate", type: "number", defaultValue: 4.5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Return of a risk-free asset (e.g., 10-year Treasury yield)." }}
        value={riskFreeRate}
        onChange={setRiskFreeRate}
      />
      <CalculatorInput
        input={{ id: "beta", label: "Beta", type: "number", defaultValue: 1.2, min: 0, max: 5, step: 0.01, tooltip: "Portfolio's systematic risk relative to the market." }}
        value={beta}
        onChange={setBeta}
      />
      <CalculatorInput
        input={{ id: "marketReturn", label: "Market Return", type: "number", defaultValue: 10, suffix: "%", min: -100, max: 1000, step: 0.1, tooltip: "The return of the overall market (e.g., S&P 500)." }}
        value={marketReturn}
        onChange={setMarketReturn}
      />
    </CalculatorLayout>
  );
}
