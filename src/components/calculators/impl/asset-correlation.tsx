"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorChart, ResultCard } from "..";

export default function AssetCorrelationCalculator() {
  const [aReturnsText, setAReturnsText] = React.useState("10, 12, 8, 15, -5, 7, 20, -2, 9, 11, 6, 14");
  const [bReturnsText, setBReturnsText] = React.useState("5, 8, 10, 6, 2, 9, 12, 4, 7, 11, 3, 9");

  const parseReturns = (text: string): number[] =>
    text
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

  const returnsA = parseReturns(aReturnsText);
  const returnsB = parseReturns(bReturnsText);

  let correlation = 0;
  let strength = "N/A";

  if (returnsA.length >= 2 && returnsA.length === returnsB.length) {
    const n = returnsA.length;
    const meanA = returnsA.reduce((a, b) => a + b, 0) / n;
    const meanB = returnsB.reduce((a, b) => a + b, 0) / n;

    let cov = 0;
    let varA = 0;
    let varB = 0;

    for (let i = 0; i < n; i++) {
      const retA = returnsA[i];
      const retB = returnsB[i];
      if (retA === undefined || retB === undefined) continue;
      const dA = retA - meanA;
      const dB = retB - meanB;
      cov += dA * dB;
      varA += dA * dA;
      varB += dB * dB;
    }

    const denom = Math.sqrt(varA) * Math.sqrt(varB);
    correlation = denom > 0 ? cov / denom : 0;

    const absCorr = Math.abs(correlation);
    if (absCorr >= 0.7) strength = "Strong";
    else if (absCorr >= 0.4) strength = "Moderate";
    else if (absCorr >= 0.1) strength = "Weak";
    else strength = "Negligible";

    if (correlation > 0) strength += " positive";
    else if (correlation < 0) strength += " negative";
    else strength = "No correlation";
  }

  const safeCorrelation = isNaN(correlation) || !isFinite(correlation) ? 0 : correlation;

  const diversificationBenefit =
    Math.abs(safeCorrelation) < 0.5
      ? "High — assets provide meaningful diversification"
      : Math.abs(safeCorrelation) < 0.8
        ? "Moderate — some diversification benefit"
        : "Low — assets move together";

  const scatterData = returnsA.map((a, i) => ({
    "Asset A": Math.round(a * 100) / 100,
    "Asset B": Math.round((returnsB[i] ?? 0) * 100) / 100,
    point: `${i + 1}`,
  }));

  return (
    <CalculatorLayout
      title="Asset Correlation Calculator"
      description="Calculate the Pearson correlation coefficient between two assets to measure how they move in relation to each other."
      icon={<span>🔗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Correlation Coefficient" value={safeCorrelation.toFixed(4)} highlight />
          <ResultCard label="Strength" value={strength} subtext={`Diversification: ${diversificationBenefit}`} />
          <ResultCard label="Data Points" value={`${returnsA.length} pairs`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={scatterData} xKey="point" yKey={["Asset A", "Asset B"]} title="Asset Returns Comparison (%)" />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset A Returns (%)</label>
        <input
          type="text"
          value={aReturnsText}
          onChange={(e) => setAReturnsText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="e.g., 10, 12, 8, 15, -5"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset B Returns (%)</label>
        <input
          type="text"
          value={bReturnsText}
          onChange={(e) => setBReturnsText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="e.g., 5, 8, 10, 6, 2"
        />
      </div>
    </CalculatorLayout>
  );
}
