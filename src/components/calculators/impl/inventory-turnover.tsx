"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput, toDays } from "..";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function InventoryTurnoverCalculator() {
  const [beginningInventory, setBeginningInventory] = React.useState(200000);
  const [endingInventory, setEndingInventory] = React.useState(250000);
  const [cogs, setCogs] = React.useState(1200000);
  const [periodValue, setPeriodValue] = React.useState(365);
  const [periodUnit, setPeriodUnit] = React.useState<"days" | "weeks" | "months" | "years">("days");

  const safeBeginning = isFinite(beginningInventory) ? Math.max(0, beginningInventory) : 0;
  const safeEnding = isFinite(endingInventory) ? Math.max(0, endingInventory) : 0;
  const safeCogs = isFinite(cogs) ? Math.max(0, cogs) : 0;
  const safePeriod = isFinite(periodValue) ? Math.max(1, periodValue) : 365;

  const avgInventory = (safeBeginning + safeEnding) / 2;
  const turnover = avgInventory > 0 ? safeCogs / avgInventory : 0;

  // Period in days
  const periodDays = toDays(safePeriod, periodUnit);
  const daysInInventory = turnover > 0 ? periodDays / turnover : 0;

  // Annualized turnover
  const annualizedTurnover = turnover * (365 / periodDays);

  const chartData = [
    { name: "Your Company", value: Math.round(turnover * 100) / 100 },
    { name: "Industry Benchmark", value: 6 },
  ];

  const periodLabel = periodUnit === "days" ? "day" : periodUnit === "weeks" ? "wk" : periodUnit === "months" ? "mo" : "yr";

  return (
    <CalculatorLayout
      title="Inventory Turnover Calculator"
      description="Calculate inventory turnover ratio and days in inventory from beginning and ending inventory and COGS."
      icon={<span>📦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Average Inventory" value={formatCurrency(avgInventory)} />
          <ResultCard label={`Turnover Ratio (${safePeriod} ${periodLabel}${safePeriod > 1 ? 's' : ''})`} value={formatNumber(turnover, 2)} subtext="Times inventory sold in the period" />
          <ResultCard label="Days in Inventory" value={formatNumber(daysInInventory, 1)} subtext="Average days to sell inventory" />
          <ResultCard label="Annualized Turnover" value={formatNumber(annualizedTurnover, 2)} subtext="Projected annual rate" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Inventory Turnover vs Benchmark" />
      <CalculatorInput input={{ id: "beginningInventory", label: "Beginning Inventory", type: "number", defaultValue: 200000, suffix: "$", min: 0, step: 1000, tooltip: "Inventory value at the start of the period." }} value={beginningInventory} onChange={setBeginningInventory} />
      <CalculatorInput input={{ id: "endingInventory", label: "Ending Inventory", type: "number", defaultValue: 250000, suffix: "$", min: 0, step: 1000, tooltip: "Inventory value at the end of the period." }} value={endingInventory} onChange={setEndingInventory} />
      <CalculatorInput input={{ id: "cogs", label: "Cost of Goods Sold", type: "number", defaultValue: 1200000, suffix: "$", min: 0, step: 1000, tooltip: "Total cost of goods sold during the period." }} value={cogs} onChange={setCogs} />
      <PeriodInput id="periodLength" label="Period Length" value={periodValue} unit={periodUnit} onValueChange={setPeriodValue} onUnitChange={setPeriodUnit} min={1} max={3650} />
    </CalculatorLayout>
  );
}
