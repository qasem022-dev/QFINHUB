"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function MarginCalculator() {
  const [cost, setCost] = React.useState(100);
  const [margin, setMargin] = React.useState(33.33);

  const rawSellingPrice = margin >= 100 ? Infinity : cost / (1 - margin / 100);
  const sellingPrice = isFinite(rawSellingPrice) ? rawSellingPrice : 0;
  const profit = isFinite(sellingPrice) ? sellingPrice - cost : 0;
  const markup = cost > 0 && sellingPrice > 0 ? (profit / cost) * 100 : 0;

  const chartData = [
    { name: "Cost", value: cost },
    { name: "Profit", value: profit },
  ];

  return (
    <CalculatorLayout
      title="Margin Calculator"
      description="Calculate selling price and markup from cost and desired profit margin."
      icon={<span>📐</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Selling Price" value={sellingPrice > 0 ? formatCurrency(sellingPrice) : "N/A"} highlight />
          <ResultCard label="Profit" value={sellingPrice > 0 ? formatCurrency(profit) : "N/A"} />
          <ResultCard label="Markup" value={formatPercentage(markup)} subtext="Markup on cost" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Cost vs Profit" />
      <CalculatorInput input={{ id: "cost", label: "Cost", type: "number", defaultValue: 100, suffix: "$", min: 0, step: 0.01, tooltip: "The wholesale or production cost of the item." }} value={cost} onChange={setCost} />
      <CalculatorInput input={{ id: "margin", label: "Desired Margin", type: "number", defaultValue: 33.33, suffix: "%", min: 0, max: 99.99, step: 0.01, tooltip: "Desired profit margin as a percentage of selling price. Must be less than 100%." }} value={margin} onChange={setMargin} />
    </CalculatorLayout>
  );
}
