"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function StockReturnCalculator() {
  const [buyPrice, setBuyPrice] = React.useState(50);
  const [sellPrice, setSellPrice] = React.useState(75);
  const [shares, setShares] = React.useState(100);
  const [dividends, setDividends] = React.useState(200);

  const safeBuy = Math.max(0.01, buyPrice ?? 0);
  const safeSell = Math.max(0, sellPrice ?? 0);
  const safeShares = Math.max(1, shares ?? 0);
  const safeDivs = Math.max(0, dividends ?? 0);

  const totalCost = safeBuy * safeShares;
  const totalProceeds = safeSell * safeShares;
  const capitalGain = totalProceeds - totalCost;
  const totalReturn = capitalGain + safeDivs;
  const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const safeCapitalGain = isNaN(capitalGain) || !isFinite(capitalGain) ? 0 : capitalGain;
  const safeTotalReturn = isNaN(totalReturn) || !isFinite(totalReturn) ? 0 : totalReturn;
  const safeReturnPct = isNaN(returnPct) || !isFinite(returnPct) ? 0 : returnPct;

  const pieData = [
    { name: "Capital Gain", value: Math.max(0, Math.round(safeCapitalGain)) },
    { name: "Dividend Income", value: Math.round(safeDivs) },
    { name: "Cost Basis", value: Math.round(totalCost) },
  ];

  return (
    <CalculatorLayout
      title="Stock Return Calculator"
      description="Calculate total stock returns including dividends, price appreciation, and total yield."
      icon={<span>📉</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Return" value={formatCurrency(safeTotalReturn)} highlight subtext={`${safeReturnPct.toFixed(1)}% return`} />
          <ResultCard label="Capital Gain" value={formatCurrency(safeCapitalGain)} subtext={`${safeBuy > 0 ? `$${safeBuy.toFixed(2)} → $${safeSell.toFixed(2)}` : ''}`} />
          <ResultCard label="Dividend Income" value={formatCurrency(safeDivs)} />
          <ResultCard label="Total Return %" value={formatPercentage(safeReturnPct)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Return Breakdown" />
      <CalculatorInput input={{ id: "buyPrice", label: "Buy Price Per Share", type: "number", defaultValue: 50, suffix: "$", min: 0, step: 0.01, tooltip: "The price per share at which you bought the stock." }} value={buyPrice} onChange={setBuyPrice} />
      <CalculatorInput input={{ id: "sellPrice", label: "Sell Price Per Share", type: "number", defaultValue: 75, suffix: "$", min: 0, step: 0.01, tooltip: "The price per share at which you sold (or plan to sell) the stock." }} value={sellPrice} onChange={setSellPrice} />
      <CalculatorInput input={{ id: "shares", label: "Number of Shares", type: "number", defaultValue: 100, suffix: "shares", min: 1, tooltip: "Total number of shares bought and sold." }} value={shares} onChange={setShares} />
      <CalculatorInput input={{ id: "dividends", label: "Dividends Received", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Total dividends received during the holding period." }} value={dividends} onChange={setDividends} />
    </CalculatorLayout>
  );
}
