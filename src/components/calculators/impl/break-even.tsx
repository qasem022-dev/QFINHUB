"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = React.useState(50000);
  const [varCostPerUnit, setVarCostPerUnit] = React.useState(15);
  const [pricePerUnit, setPricePerUnit] = React.useState(40);

  const contribution = pricePerUnit - varCostPerUnit;
  const breakEvenUnits = contribution > 0 ? Math.ceil(fixedCosts / contribution) : Infinity;
  const breakEvenRevenue = breakEvenUnits * pricePerUnit;

  const maxUnits = Math.max(breakEvenUnits * 2, 100);
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const units = Math.round((maxUnits / 20) * (i + 1));
    const revenue = units * pricePerUnit;
    const totalCost = fixedCosts + units * varCostPerUnit;
    return {
      units: formatNumber(units, 0),
      "Total Revenue": Math.round(revenue),
      "Total Cost": Math.round(totalCost),
    };
  });

  return (
    <CalculatorLayout
      title="Break-Even Analysis"
      description="Calculate the break-even point for your business with fixed and variable costs."
      icon={<span>⚖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Break-Even Units" value={formatNumber(breakEvenUnits, 0)} highlight />
          <ResultCard label="Break-Even Revenue" value={formatCurrency(breakEvenRevenue)} />
          <ResultCard label="Contribution Margin" value={formatCurrency(contribution)} subtext="Per unit" />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="units" yKey={["Total Revenue", "Total Cost"]} title="Cost vs Revenue" />
      <CalculatorInput input={{ id: "fixedCosts", label: "Fixed Costs", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "Rent, salaries, equipment — costs that don't change with production volume." }} value={fixedCosts} onChange={setFixedCosts} />
      <CalculatorInput input={{ id: "varCostPerUnit", label: "Variable Cost Per Unit", type: "number", defaultValue: 15, suffix: "$", min: 0, step: 0.01 }} value={varCostPerUnit} onChange={setVarCostPerUnit} />
      <CalculatorInput input={{ id: "pricePerUnit", label: "Price Per Unit", type: "number", defaultValue: 40, suffix: "$", min: 0, step: 0.01 }} value={pricePerUnit} onChange={setPricePerUnit} />
    </CalculatorLayout>
  );
}
