"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = React.useState(50000);
  const [varCostPerUnit, setVarCostPerUnit] = React.useState(15);
  const [pricePerUnit, setPricePerUnit] = React.useState(40);

  const safeFixed = isFinite(fixedCosts) ? Math.max(0, fixedCosts) : 0;
  const safeVar = isFinite(varCostPerUnit) ? Math.max(0, varCostPerUnit) : 0;
  const safePrice = isFinite(pricePerUnit) ? Math.max(0, pricePerUnit) : 0;

  const contribution = safePrice - safeVar;
  const breakEvenUnits = contribution > 0 ? Math.ceil(safeFixed / contribution) : Infinity;
  const breakEvenRevenue = isFinite(breakEvenUnits) ? breakEvenUnits * safePrice : 0;

  const safeBreakEven = isFinite(breakEvenUnits) ? breakEvenUnits : 0;
  const maxUnits = Math.max(safeBreakEven * 2, 100);
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const units = Math.round((maxUnits / 20) * (i + 1));
    const revenue = units * safePrice;
    const totalCost = safeFixed + units * safeVar;
    return {
      units: `${units}`,
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
          <ResultCard label="Break-Even Units" value={isFinite(breakEvenUnits) ? formatNumber(breakEvenUnits, 0) : "N/A"} highlight />
          <ResultCard label="Break-Even Revenue" value={formatCurrency(breakEvenRevenue)} />
          <ResultCard label="Contribution Margin" value={formatCurrency(contribution)} subtext="Per unit" />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="units" yKey={["Total Revenue", "Total Cost"]} title="Cost vs Revenue" />
      <CalculatorInput input={{ id: "fixedCosts", label: "Fixed Costs", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "Rent, salaries, equipment — costs that don't change with production volume." }} value={fixedCosts} onChange={setFixedCosts} />
      <CalculatorInput input={{ id: "varCostPerUnit", label: "Variable Cost Per Unit", type: "number", defaultValue: 15, suffix: "$", min: 0, step: 0.01, tooltip: "The per-unit cost that varies with production volume (materials, labor)." }} value={varCostPerUnit} onChange={setVarCostPerUnit} />
      <CalculatorInput input={{ id: "pricePerUnit", label: "Price Per Unit", type: "number", defaultValue: 40, suffix: "$", min: 0, step: 0.01, tooltip: "The selling price for each unit of product or service." }} value={pricePerUnit} onChange={setPricePerUnit} />
    </CalculatorLayout>
  );
}
