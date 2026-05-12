"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput } from "..";
import type { PeriodUnit } from "..";
import { toMonths } from "..";
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
  const [holdingValue, setHoldingValue] = React.useState(1);
  const [holdingUnit, setHoldingUnit] = React.useState<PeriodUnit>("years");
  const [otherIncome, setOtherIncome] = React.useState(50000);

  const safeBasis = Math.max(0, isFinite(costBasis) ? costBasis : 0);
  const safeProceeds = Math.max(0, isFinite(proceeds) ? proceeds : 0);
  const safeOtherIncome = Math.max(0, isFinite(otherIncome) ? otherIncome : 0);

  const gain = safeProceeds - safeBasis;
  const holdingMonths = toMonths(holdingValue, holdingUnit);
  const isLongTerm = holdingMonths >= 12;
  let taxRate: number;
  let taxOwed: number;

  if (!isLongTerm) {
    taxRate = SHORT_TERM_RATE;
    taxOwed = gain * taxRate;
  } else {
    const totalIncome = safeOtherIncome + gain;
    let rate = 0.20;
    for (const bracket of LONG_TERM_RATES) {
      if (totalIncome > bracket.from && totalIncome <= bracket.to) {
        rate = bracket.rate;
        break;
      }
    }
    taxRate = rate;
    taxOwed = gain * taxRate;
  }

  const netProceeds = Math.max(0, safeProceeds - taxOwed);

  const chartData = [
    { name: "Cost Basis", value: Math.round(safeBasis) },
    { name: "Tax Owed", value: Math.round(taxOwed) },
    { name: "Net Proceeds", value: Math.round(netProceeds) },
  ];

  return (
    <CalculatorLayout
      title="Capital Gains Tax"
      description="Calculate capital gains tax on investments including short-term and long-term rates with bracket analysis."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Capital Gain" value={formatCurrency(gain)} highlight />
          <ResultCard label="Tax Owed" value={formatCurrency(taxOwed)} subtext={`${(taxRate * 100).toFixed(0)}% ${isLongTerm ? "long-term" : "short-term"} rate`} />
          <ResultCard label="Net Proceeds" value={formatCurrency(netProceeds)} />
          <ResultCard label="Effective Tax Rate on Gain" value={formatPercentage(gain > 0 ? (taxOwed / gain) * 100 : 0)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Gain Breakdown" />
      <CalculatorInput input={{ id: "costBasis", label: "Cost Basis", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The original purchase price including commissions and fees." }} value={costBasis} onChange={setCostBasis} />
      <CalculatorInput input={{ id: "proceeds", label: "Sale Proceeds", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "The total amount received from the sale." }} value={proceeds} onChange={setProceeds} />
      <PeriodInput id="holdingPeriod" label="Holding Period" value={holdingValue} unit={holdingUnit} onValueChange={setHoldingValue} onUnitChange={setHoldingUnit} min={1} max={50} />
      <CalculatorInput input={{ id: "otherIncome", label: "Other Taxable Income", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "Your other income to determine the correct long-term capital gains bracket." }} value={otherIncome} onChange={setOtherIncome} />
    </CalculatorLayout>
  );
}
