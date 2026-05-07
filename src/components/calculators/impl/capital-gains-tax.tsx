"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const SHORT_TERM_RATE = 0.35; // Assume top marginal for short-term
const LONG_TERM_RATES = [
  { from: 0, to: 44625, rate: 0 },
  { from: 44625, to: 492300, rate: 0.15 },
  { from: 492300, to: Infinity, rate: 0.20 },
];

export default function CapitalGainsTaxCalculator() {
  const [costBasis, setCostBasis] = React.useState(10000);
  const [proceeds, setProceeds] = React.useState(20000);
  const [holdingPeriod, setHoldingPeriod] = React.useState(0); // 0 = short, 1 = long
  const [otherIncome, setOtherIncome] = React.useState(50000);

  const gain = proceeds - costBasis;
  let taxRate: number;
  let taxOwed: number;

  if (holdingPeriod === 0) {
    // Short-term: taxed as ordinary income
    taxRate = SHORT_TERM_RATE;
    taxOwed = gain * taxRate;
  } else {
    // Long-term: 0%, 15%, or 20%
    const totalIncome = otherIncome + gain;
    let rate = 0.20;
    for (const bracket of LONG_TERM_RATES) {
      if (totalIncome > bracket.from && totalIncome <= bracket.to) {
        rate = bracket.rate;
        break;
      }
    }
    // simplified: apply the bracket the gain falls into
    taxRate = rate;
    taxOwed = gain * taxRate;
  }

  const netProceeds = proceeds - taxOwed;

  const chartData = [
    { name: "Cost Basis", value: Math.round(costBasis) },
    { name: "Tax Owed", value: Math.round(taxOwed) },
    { name: "Net Proceeds", value: Math.round(netProceeds) },
  ];

  return (
    <CalculatorLayout
      title="Capital Gains Tax"
      description="Calculate capital gains tax on investments including short-term and long-term rates."
      icon={<span>📑</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Capital Gain" value={formatCurrency(gain)} highlight />
          <ResultCard label="Tax Owed" value={formatCurrency(taxOwed)} subtext={`${(taxRate * 100).toFixed(0)}% ${holdingPeriod === 0 ? "short-term" : "long-term"} rate`} />
          <ResultCard label="Net Proceeds" value={formatCurrency(netProceeds)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Gain Breakdown" />
      <CalculatorInput input={{ id: "costBasis", label: "Cost Basis", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The original purchase price including commissions and fees." }} value={costBasis} onChange={setCostBasis} />
      <CalculatorInput input={{ id: "proceeds", label: "Sale Proceeds", type: "number", defaultValue: 20000, suffix: "$", min: 0 }} value={proceeds} onChange={setProceeds} />
      <CalculatorInput input={{ id: "holdingPeriod", label: "Holding Period", type: "select", defaultValue: 0, options: [{ label: "Short-Term (< 1 year)", value: 0 }, { label: "Long-Term (≥ 1 year)", value: 1 }] }} value={holdingPeriod} onChange={setHoldingPeriod} />
      <CalculatorInput input={{ id: "otherIncome", label: "Other Taxable Income", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "Your other income to determine the correct long-term capital gains bracket." }} value={otherIncome} onChange={setOtherIncome} />
    </CalculatorLayout>
  );
}
