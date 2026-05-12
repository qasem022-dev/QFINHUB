"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorChart, ResultCard } from "..";

export default function BetaCalculator() {
  const [stockReturnsText, setStockReturnsText] = React.useState("10, 12, 8, 15, -5, 7, 20, -2, 9, 11, 6, 14");
  const [marketReturnsText, setMarketReturnsText] = React.useState("8, 10, 6, 12, -3, 5, 15, -1, 7, 9, 4, 11");

  const parseReturns = (text: string): number[] =>
    text
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

  const stockReturns = parseReturns(stockReturnsText);
  const marketReturns = parseReturns(marketReturnsText);

  const mean = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  let beta = 0;
  let correlation = 0;
  let alpha = 0;

  if (stockReturns.length >= 2 && stockReturns.length === marketReturns.length) {
    const meanStock = mean(stockReturns);
    const meanMarket = mean(marketReturns);

    let cov = 0;
    let varMarket = 0;
    let varStock = 0;

    for (let i = 0; i < stockReturns.length; i++) {
      const sRet = stockReturns[i];
      const mRet = marketReturns[i];
      if (sRet === undefined || mRet === undefined) continue;
      const dStock = sRet - meanStock;
      const dMarket = mRet - meanMarket;
      cov += dStock * dMarket;
      varMarket += dMarket * dMarket;
      varStock += dStock * dStock;
    }

    cov /= stockReturns.length;
    varMarket /= stockReturns.length;
    varStock /= stockReturns.length;

    beta = varMarket > 0 ? cov / varMarket : 0;
    const denom = Math.sqrt(varStock) * Math.sqrt(varMarket);
    correlation = denom > 0 ? cov / denom : 0;
    alpha = meanStock - beta * meanMarket;
  }

  const safeBeta = isNaN(beta) || !isFinite(beta) ? 0 : beta;
  const safeCorrelation = isNaN(correlation) || !isFinite(correlation) ? 0 : correlation;
  const safeAlpha = isNaN(alpha) || !isFinite(alpha) ? 0 : alpha;

  const betaDesc =
    safeBeta > 1
      ? "More volatile than the market"
      : safeBeta < 1 && safeBeta > 0
        ? "Less volatile than the market"
        : safeBeta === 0
          ? "No correlation with market"
          : "Negatively correlated with market";

  const scatterData = stockReturns.map((s, i) => ({
    "Stock Return": Math.round(s * 100) / 100,
    "Market Return": Math.round((marketReturns[i] ?? 0) * 100) / 100,
    point: `${i + 1}`,
  }));

  return (
    <CalculatorLayout
      title="Beta Calculator"
      description="Calculate the beta coefficient of a stock relative to the market using historical returns data."
      icon={<span>β</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Beta (β)" value={safeBeta.toFixed(4)} highlight subtext={betaDesc} />
          <ResultCard label="Correlation" value={safeCorrelation.toFixed(4)} subtext={safeCorrelation > 0.7 ? "Strong positive" : safeCorrelation > 0.3 ? "Moderate" : "Weak"} />
          <ResultCard label="Alpha (Intercept)" value={safeAlpha.toFixed(4)} subtext={safeAlpha > 0 ? "Outperforming" : safeAlpha < 0 ? "Underperforming" : "Neutral"} />
          <ResultCard label="Data Points" value={`${stockReturns.length} pairs`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={scatterData} xKey="point" yKey={["Stock Return", "Market Return"]} title="Stock vs Market Returns (%)" />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Returns (%)</label>
        <input
          type="text"
          value={stockReturnsText}
          onChange={(e) => setStockReturnsText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="e.g., 10, 12, 8, 15, -5"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Returns (%)</label>
        <input
          type="text"
          value={marketReturnsText}
          onChange={(e) => setMarketReturnsText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="e.g., 8, 10, 6, 12, -3"
        />
      </div>
    </CalculatorLayout>
  );
}
