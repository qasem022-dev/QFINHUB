"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function MarkupCalculator() {
  const [cost, setCost] = React.useState(100);
  const [markup, setMarkup] = React.useState(50);

  const safeCost = isFinite(cost) ? Math.max(0, cost) : 0;
  const safeMarkup = isFinite(markup) ? Math.max(0, markup) : 0;

  const sellingPrice = safeCost * (1 + safeMarkup / 100);
  const profit = sellingPrice - safeCost;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const chartData = [
    { name: "Cost", value: cost },
    { name: "Profit", value: profit },
  ];

  return (
    <CalculatorLayout
      title="Markup Calculator"
      description="Calculate selling price and profit from cost and markup percentage."
      icon={<span>🏷️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Selling Price" value={formatCurrency(sellingPrice)} highlight />
          <ResultCard label="Profit" value={formatCurrency(profit)} />
          <ResultCard label="Margin" value={formatPercentage(margin)} subtext="Profit as % of selling price" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Cost vs Profit" />
      <CalculatorInput input={{ id: "cost", label: "Cost", type: "number", defaultValue: 100, suffix: "$", min: 0, step: 0.01, tooltip: "The wholesale or production cost of the item." }} value={cost} onChange={setCost} />
      <CalculatorInput input={{ id: "markup", label: "Markup Percentage", type: "number", defaultValue: 50, suffix: "%", min: 0, step: 0.1, tooltip: "Percentage added to cost to determine selling price." }} value={markup} onChange={setMarkup} />
    </CalculatorLayout>
  );
}
