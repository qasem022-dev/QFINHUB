"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function PositionSizingCalculator() {
  const [accountSize, setAccountSize] = React.useState(50000);
  const [riskPerTrade, setRiskPerTrade] = React.useState(2);
  const [stopLossDist, setStopLossDist] = React.useState(5);
  const [entryPrice, setEntryPrice] = React.useState(100);

  const safeAccount = Math.max(0, accountSize ?? 0);
  const safeRiskPct = Math.max(0, Math.min(riskPerTrade ?? 0, 100));
  const safeStopPct = Math.max(0.01, stopLossDist ?? 0);
  const safeEntry = Math.max(0.01, entryPrice ?? 0);

  const dollarRisked = safeAccount * (safeRiskPct / 100);
  const stopLossDecimal = safeStopPct / 100;
  const positionValue = stopLossDecimal > 0 ? dollarRisked / stopLossDecimal : 0;
  const shares = safeEntry > 0 ? positionValue / safeEntry : 0;

  const safeShares = isNaN(shares) || !isFinite(shares) ? 0 : shares;
  const safeDollarRisked = isNaN(dollarRisked) || !isFinite(dollarRisked) ? 0 : dollarRisked;
  const safePositionValue = isNaN(positionValue) || !isFinite(positionValue) ? 0 : positionValue;

  // Kelly fraction: (bp - q) / b where b = odds, p = win rate (assume 50%), q = 1-p
  const kellyPct = safeStopPct > 0 ? (safeRiskPct / safeStopPct) * 50 : 0;
  const halfKelly = kellyPct / 2;

  const chartData = [
    { metric: "$ Risked", value: Math.round(safeDollarRisked) },
    { metric: "Position Value", value: Math.round(safePositionValue) },
    { metric: "Full Kelly", value: Math.round(kellyPct * safeAccount / 100) },
    { metric: "Half Kelly", value: Math.round(halfKelly * safeAccount / 100) },
  ];

  return (
    <CalculatorLayout
      title="Position Sizing Calculator"
      description="Determine the optimal number of shares to buy based on your account size, risk tolerance, and stop loss distance."
      icon={<span>📏</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Shares to Buy" value={Math.floor(safeShares).toLocaleString()} highlight subtext={`At $${safeEntry.toFixed(2)} per share`} />
          <ResultCard label="$ Risked" value={formatCurrency(safeDollarRisked)} subtext={`${safeRiskPct}% of $${safeAccount.toLocaleString()}`} />
          <ResultCard label="Position Value" value={formatCurrency(safePositionValue)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="metric" yKey="value" title="Position Sizing ($)" />
      <CalculatorInput
        input={{ id: "accountSize", label: "Account Size", type: "number", defaultValue: 50000, suffix: "$", min: 0, step: 100, tooltip: "Total trading account value." }}
        value={accountSize}
        onChange={setAccountSize}
      />
      <CalculatorInput
        input={{ id: "riskPerTrade", label: "Risk per Trade", type: "number", defaultValue: 2, suffix: "%", min: 0.1, max: 100, step: 0.1, tooltip: "Percentage of account you are willing to risk on this trade." }}
        value={riskPerTrade}
        onChange={setRiskPerTrade}
      />
      <CalculatorInput
        input={{ id: "stopLossDist", label: "Stop Loss Distance", type: "number", defaultValue: 5, suffix: "%", min: 0.1, max: 100, step: 0.1, tooltip: "Percentage distance from entry price to stop loss." }}
        value={stopLossDist}
        onChange={setStopLossDist}
      />
      <CalculatorInput
        input={{ id: "entryPrice", label: "Entry Price", type: "number", defaultValue: 100, suffix: "$", min: 0.01, step: 0.01, tooltip: "The price per share at entry." }}
        value={entryPrice}
        onChange={setEntryPrice}
      />
    </CalculatorLayout>
  );
}
