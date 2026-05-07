"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

const SAMPLE_PRICES = [50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 50];

export default function DollarCostAverageCalculator() {
  const [totalInvested, setTotalInvested] = React.useState(6000);
  const [periods, setPeriods] = React.useState(12);
  const [customPrices, setCustomPrices] = React.useState(SAMPLE_PRICES.join(", "));

  const parsePrices = (str: string): number[] => {
    return str.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
  };

  const prices = parsePrices(customPrices);
  const actualPeriods = Math.min(periods, prices.length);
  const amountPerPeriod = totalInvested / actualPeriods;

  let totalShares = 0;
  let totalCost = 0;
  const chartData: { period: string; "Share Price": number; "Avg Cost": number }[] = [];

  for (let i = 0; i < actualPeriods; i++) {
    const price = prices[i]!;
    const shares = amountPerPeriod / price;
    totalShares += shares;
    totalCost += amountPerPeriod;
    const avgCost = totalCost / totalShares;
    chartData.push({
      period: `P${i + 1}`,
      "Share Price": price,
      "Avg Cost": Math.round(avgCost * 100) / 100,
    });
  }

  const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
  const currentPrice = prices[actualPeriods - 1] || 0;
  const currentValue = totalShares * currentPrice;
  const gainLoss = currentValue - totalCost;

  return (
    <CalculatorLayout
      title="Dollar Cost Average"
      description="Calculate the average cost basis of periodic investments in a single security."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Shares" value={formatNumber(totalShares, 2)} highlight />
          <ResultCard label="Average Cost Per Share" value={formatCurrency(avgCost)} />
          <ResultCard label="Current Value" value={formatCurrency(currentValue)} />
          <ResultCard label="Gain / Loss" value={formatCurrency(gainLoss)} highlight={gainLoss >= 0} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="period" yKey={["Share Price", "Avg Cost"]} title="Prices vs Average Cost" />
      <CalculatorInput input={{ id: "totalInvested", label: "Total Amount Invested", type: "number", defaultValue: 6000, suffix: "$", min: 0 }} value={totalInvested} onChange={setTotalInvested} />
      <CalculatorInput input={{ id: "periods", label: "Number of Periods", type: "number", defaultValue: 12, suffix: "periods", min: 2, max: 60 }} value={periods} onChange={setPeriods} />
    </CalculatorLayout>
  );
}
