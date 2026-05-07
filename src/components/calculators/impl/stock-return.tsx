"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function StockReturnCalculator() {
  const [buyPrice, setBuyPrice] = React.useState(50);
  const [sellPrice, setSellPrice] = React.useState(75);
  const [shares, setShares] = React.useState(100);
  const [dividends, setDividends] = React.useState(200);

  const totalCost = buyPrice * shares;
  const totalProceeds = sellPrice * shares;
  const capitalGain = totalProceeds - totalCost;
  const totalReturn = capitalGain + dividends;
  const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const pieData = [
    { name: "Capital Gain", value: Math.round(capitalGain) },
    { name: "Dividend Income", value: Math.round(dividends) },
    { name: "Cost Basis", value: Math.round(totalCost) },
  ];

  return (
    <CalculatorLayout
      title="Stock Return Calculator"
      description="Calculate total stock returns including dividends, price appreciation, and total yield."
      icon={<span>📉</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Return" value={formatCurrency(totalReturn)} highlight />
          <ResultCard label="Capital Gain" value={formatCurrency(capitalGain)} subtext={`${buyPrice > 0 ? `$${buyPrice} → $${sellPrice}` : ''}`} />
          <ResultCard label="Dividend Income" value={formatCurrency(dividends)} />
          <ResultCard label="Total Return %" value={formatPercentage(returnPct)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Return Breakdown" />
      <CalculatorInput input={{ id: "buyPrice", label: "Buy Price Per Share", type: "number", defaultValue: 50, suffix: "$", min: 0, step: 0.01 }} value={buyPrice} onChange={setBuyPrice} />
      <CalculatorInput input={{ id: "sellPrice", label: "Sell Price Per Share", type: "number", defaultValue: 75, suffix: "$", min: 0, step: 0.01 }} value={sellPrice} onChange={setSellPrice} />
      <CalculatorInput input={{ id: "shares", label: "Number of Shares", type: "number", defaultValue: 100, suffix: "shares", min: 1 }} value={shares} onChange={setShares} />
      <CalculatorInput input={{ id: "dividends", label: "Dividends Received", type: "number", defaultValue: 200, suffix: "$", min: 0 }} value={dividends} onChange={setDividends} />
    </CalculatorLayout>
  );
}
