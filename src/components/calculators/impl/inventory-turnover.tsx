"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function InventoryTurnoverCalculator() {
  const [beginningInventory, setBeginningInventory] = React.useState(200000);
  const [endingInventory, setEndingInventory] = React.useState(250000);
  const [cogs, setCogs] = React.useState(1200000);

  const safeBeginning = isFinite(beginningInventory) ? Math.max(0, beginningInventory) : 0;
  const safeEnding = isFinite(endingInventory) ? Math.max(0, endingInventory) : 0;
  const safeCogs = isFinite(cogs) ? Math.max(0, cogs) : 0;

  const avgInventory = (safeBeginning + safeEnding) / 2;
  const turnover = avgInventory > 0 ? safeCogs / avgInventory : 0;
  const daysInInventory = turnover > 0 ? 365 / turnover : 0;

  const chartData = [
    { name: "Your Company", value: Math.round(turnover * 100) / 100 },
    { name: "Industry Benchmark", value: 6 },
  ];

  return (
    <CalculatorLayout
      title="Inventory Turnover Calculator"
      description="Calculate inventory turnover ratio and days in inventory from beginning and ending inventory and COGS."
      icon={<span>📦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Average Inventory" value={formatCurrency(avgInventory)} />
          <ResultCard label="Turnover Ratio" value={formatNumber(turnover, 2)} highlight subtext="Times inventory sold per year" />
          <ResultCard label="Days in Inventory" value={formatNumber(daysInInventory, 1)} subtext="Average days to sell inventory" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Inventory Turnover vs Benchmark" />
      <CalculatorInput input={{ id: "beginningInventory", label: "Beginning Inventory", type: "number", defaultValue: 200000, suffix: "$", min: 0, step: 1000, tooltip: "Inventory value at the start of the period." }} value={beginningInventory} onChange={setBeginningInventory} />
      <CalculatorInput input={{ id: "endingInventory", label: "Ending Inventory", type: "number", defaultValue: 250000, suffix: "$", min: 0, step: 1000, tooltip: "Inventory value at the end of the period." }} value={endingInventory} onChange={setEndingInventory} />
      <CalculatorInput input={{ id: "cogs", label: "Cost of Goods Sold", type: "number", defaultValue: 1200000, suffix: "$", min: 0, step: 1000, tooltip: "Total cost of goods sold during the period." }} value={cogs} onChange={setCogs} />
    </CalculatorLayout>
  );
}
