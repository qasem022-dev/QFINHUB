"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function RiskRewardCalculator() {
  const [entryPrice, setEntryPrice] = React.useState(50);
  const [stopLoss, setStopLoss] = React.useState(45);
  const [targetPrice, setTargetPrice] = React.useState(65);
  const [shares, setShares] = React.useState(100);

  const safeEntry = Math.max(0.01, entryPrice ?? 0);
  const safeStop = Math.max(0.01, stopLoss ?? 0);
  const safeTarget = Math.max(0.01, targetPrice ?? 0);
  const safeShares = Math.max(1, shares ?? 0);

  const riskPerShare = Math.max(0, safeEntry - safeStop);
  const rewardPerShare = Math.max(0, safeTarget - safeEntry);
  const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
  const positionRisk = riskPerShare * safeShares;
  const positionReward = rewardPerShare * safeShares;
  const winRateNeeded = riskPerShare > 0 ? (riskPerShare / (riskPerShare + rewardPerShare)) * 100 : 50;

  const chartData = [
    { metric: "Risk", value: Math.round(riskPerShare * 100) / 100 },
    { metric: "Reward", value: Math.round(rewardPerShare * 100) / 100 },
    { metric: "Net", value: Math.round((rewardPerShare - riskPerShare) * 100) / 100 },
  ];

  return (
    <CalculatorLayout
      title="Risk/Reward Calculator"
      description="Evaluate the risk-to-reward ratio of a trade by comparing potential loss (stop loss) to potential gain (target price)."
      icon={<span>⚖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="R:R Ratio" value={rrRatio.toFixed(2)} highlight subtext={`${rewardPerShare.toFixed(2)} / ${riskPerShare.toFixed(2)}`} />
          <ResultCard label="Position Risk" value={formatCurrency(positionRisk)} subtext={`${riskPerShare.toFixed(2)} per share`} />
          <ResultCard label="Position Reward" value={formatCurrency(positionReward)} subtext={`${rewardPerShare.toFixed(2)} per share`} />
          <ResultCard label="Win Rate Needed" value={`${winRateNeeded.toFixed(1)}%`} subtext="Breakeven win rate" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="metric" yKey="value" title="Risk/Reward Per Share ($)" />
      <CalculatorInput
        input={{ id: "entryPrice", label: "Entry Price", type: "number", defaultValue: 50, suffix: "$", min: 0, step: 0.01, tooltip: "The price at which you enter the trade." }}
        value={entryPrice}
        onChange={setEntryPrice}
      />
      <CalculatorInput
        input={{ id: "stopLoss", label: "Stop Loss", type: "number", defaultValue: 45, suffix: "$", min: 0, step: 0.01, tooltip: "The price at which you will exit to limit losses." }}
        value={stopLoss}
        onChange={setStopLoss}
      />
      <CalculatorInput
        input={{ id: "targetPrice", label: "Target Price", type: "number", defaultValue: 65, suffix: "$", min: 0, step: 0.01, tooltip: "The price target for taking profit." }}
        value={targetPrice}
        onChange={setTargetPrice}
      />
      <CalculatorInput
        input={{ id: "shares", label: "Shares / Position Size", type: "number", defaultValue: 100, min: 1, step: 1, tooltip: "Number of shares or units in the position." }}
        value={shares}
        onChange={setShares}
      />
    </CalculatorLayout>
  );
}
