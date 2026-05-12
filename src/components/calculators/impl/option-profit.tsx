"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function OptionProfitCalculator() {
  const [optionType, setOptionType] = React.useState(0); // 0 = call, 1 = put
  const [stockPrice, setStockPrice] = React.useState(105);
  const [strikePrice, setStrikePrice] = React.useState(100);
  const [premium, setPremium] = React.useState(5);
  const [contracts, setContracts] = React.useState(1);

  const multiplier = contracts * 100;

  const breakeven =
    optionType === 0
      ? strikePrice + premium
      : strikePrice - premium;

  const computeProfit = (price: number) => {
    if (optionType === 0) {
      return (Math.max(0, price - strikePrice) - premium) * multiplier;
    } else {
      return (Math.max(0, strikePrice - price) - premium) * multiplier;
    }
  };

  const profit = computeProfit(stockPrice);
  const maxLoss = -premium * multiplier;
  const maxGain = optionType === 0 ? Infinity : (strikePrice - premium) * multiplier;

  // Generate profit chart data for a range of stock prices
  const minChartPrice = Math.max(0, strikePrice - 5 * premium);
  const maxChartPrice = strikePrice + 5 * premium + 10;
  const step = Math.max(0.5, (maxChartPrice - minChartPrice) / 40);

  const chartData: { price: number; profit: number }[] = [];
  for (let p = minChartPrice; p <= maxChartPrice; p += step) {
    chartData.push({ price: Math.round(p * 100) / 100, profit: Math.round(computeProfit(p) * 100) / 100 });
  }

  return (
    <CalculatorLayout
      title="Option Profit Calculator"
      description="Calculate profit, loss, and breakeven for call and put option positions."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Breakeven Price" value={formatCurrency(breakeven)} highlight />
          <ResultCard label="Profit/Loss" value={formatCurrency(profit)} subtext={`At $${stockPrice.toFixed(2)} stock price`} />
          <ResultCard label="Max Loss" value={formatCurrency(maxLoss)} />
          <ResultCard label="Max Gain" value={maxGain === Infinity ? "Unlimited" : formatCurrency(maxGain)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="price" yKey={["profit"]} title="Profit/Loss vs Stock Price" />
      <CalculatorInput
        input={{ id: "optionType", label: "Option Type", type: "select", defaultValue: 0, options: [{ label: "Call", value: 0 }, { label: "Put", value: 1 }], tooltip: "Choose between a call option (right to buy) or put option (right to sell)." }}
        value={optionType}
        onChange={setOptionType}
      />
      <CalculatorInput
        input={{ id: "stockPrice", label: "Current Stock Price", type: "number", defaultValue: 105, suffix: "$", min: 0.01, step: 0.01, tooltip: "Current market price of the underlying stock." }}
        value={stockPrice}
        onChange={setStockPrice}
      />
      <CalculatorInput
        input={{ id: "strikePrice", label: "Strike Price", type: "number", defaultValue: 100, suffix: "$", min: 0.01, step: 0.01, tooltip: "The predetermined price at which the option can be exercised." }}
        value={strikePrice}
        onChange={setStrikePrice}
      />
      <CalculatorInput
        input={{ id: "premium", label: "Premium per Share", type: "number", defaultValue: 5, suffix: "$", min: 0.01, step: 0.01, tooltip: "The price paid per share for the option contract." }}
        value={premium}
        onChange={setPremium}
      />
      <CalculatorInput
        input={{ id: "contracts", label: "Number of Contracts", type: "number", defaultValue: 1, min: 1, step: 1, tooltip: "Each contract represents 100 shares." }}
        value={contracts}
        onChange={setContracts}
      />
    </CalculatorLayout>
  );
}
