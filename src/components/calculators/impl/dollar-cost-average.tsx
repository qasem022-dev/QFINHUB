"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toPeriods, type PeriodUnit } from "@/components/calculators/period-input";

const SAMPLE_PRICES = [50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 50];

export default function DollarCostAverageCalculator() {
  const [totalInvested, setTotalInvested] = React.useState(6000);
  const [periods, setPeriods] = React.useState(12);
  const [periodsUnit, setPeriodsUnit] = React.useState<PeriodUnit>("months");
  const [customPrices, setCustomPrices] = React.useState(SAMPLE_PRICES.join(", "));

  const parsePrices = (str: string): number[] => {
    return str.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
  };

  const prices = parsePrices(customPrices);
  const safeTotalInvested = Math.max(0, totalInvested ?? 0);
  const effectivePeriods = Math.min(Math.max(1, toPeriods(periods, periodsUnit)), prices.length, 36);
  const amountPerPeriod = safeTotalInvested / effectivePeriods;

  let totalShares = 0;
  let totalCost = 0;
  const chartData: { period: string; "Share Price": number; "Avg Cost": number }[] = [];

  for (let i = 0; i < effectivePeriods; i++) {
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
  const currentPrice = prices[effectivePeriods - 1] || 0;
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
      <CalculatorInput
        input={{ id: "totalInvested", label: "Total Amount Invested", type: "number", defaultValue: 6000, suffix: "$", min: 0, tooltip: "Total amount of money invested across all periods." }}
        value={totalInvested}
        onChange={setTotalInvested}
      />
      <PeriodInput
        id="periods"
        label="Number of Periods"
        value={periods}
        unit={periodsUnit}
        onValueChange={setPeriods}
        onUnitChange={setPeriodsUnit}
        min={2}
        max={60}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Prices (comma-separated)</label>
        <input
          type="text"
          value={customPrices}
          onChange={(e) => setCustomPrices(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="e.g., 50, 52, 48, 51, 49, 53"
        />
      </div>
    </CalculatorLayout>
  );
}
