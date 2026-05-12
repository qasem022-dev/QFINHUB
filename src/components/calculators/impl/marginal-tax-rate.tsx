"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const BRACKETS_2024_SINGLE = [
  { rate: 0.10, from: 0, to: 11600 },
  { rate: 0.12, from: 11600, to: 47150 },
  { rate: 0.22, from: 47150, to: 100525 },
  { rate: 0.24, from: 100525, to: 191950 },
  { rate: 0.32, from: 191950, to: 243725 },
  { rate: 0.35, from: 243725, to: 609350 },
  { rate: 0.37, from: 609350, to: Infinity },
];

const BRACKETS_2024_MARRIED = [
  { rate: 0.10, from: 0, to: 23200 },
  { rate: 0.12, from: 23200, to: 94300 },
  { rate: 0.22, from: 94300, to: 201050 },
  { rate: 0.24, from: 201050, to: 383900 },
  { rate: 0.32, from: 383900, to: 487450 },
  { rate: 0.35, from: 487450, to: 731200 },
  { rate: 0.37, from: 731200, to: Infinity },
];

const BRACKETS_2024_HOH = [
  { rate: 0.10, from: 0, to: 16550 },
  { rate: 0.12, from: 16550, to: 63100 },
  { rate: 0.22, from: 63100, to: 100500 },
  { rate: 0.24, from: 100500, to: 191950 },
  { rate: 0.32, from: 191950, to: 243700 },
  { rate: 0.35, from: 243700, to: 609350 },
  { rate: 0.37, from: 609350, to: Infinity },
];

const BRACKET_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function MarginalTaxRateCalculator() {
  const [taxableIncome, setTaxableIncome] = React.useState(100000);
  const [filingStatus, setFilingStatus] = React.useState(0); // 0 = Single, 1 = Married, 2 = HoH

  const safeIncome = Math.max(0, isFinite(taxableIncome) ? taxableIncome : 0);

  const brackets =
    filingStatus === 0 ? BRACKETS_2024_SINGLE
    : filingStatus === 1 ? BRACKETS_2024_MARRIED
    : BRACKETS_2024_HOH;

  let totalTax = 0;
  let marginalRate = 0;
  const bracketBreakdown: { name: string; value: number }[] = [];

  for (const bracket of brackets) {
    if (safeIncome <= bracket.from) break;
    const taxableInBracket = Math.min(safeIncome, bracket.to) - bracket.from;
    if (taxableInBracket > 0) {
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;
      bracketBreakdown.push({
        name: `${(bracket.rate * 100).toFixed(0)}% Bracket`,
        value: Math.round(taxInBracket),
      });
    }
    marginalRate = bracket.rate;
  }

  const effectiveRate = safeIncome > 0 ? (totalTax / safeIncome) * 100 : 0;
  const afterTaxIncome = safeIncome - totalTax;

  return (
    <CalculatorLayout
      title="Marginal Tax Rate Calculator"
      description="Determine your marginal tax bracket, effective tax rate, and total federal income tax for 2024."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Marginal Tax Rate" value={formatPercentage(marginalRate * 100)} highlight />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} />
          <ResultCard label="Total Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Taxable Income" value={formatCurrency(safeIncome)} />
          <ResultCard label="After-Tax Income" value={formatCurrency(afterTaxIncome)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={bracketBreakdown} xKey="name" yKey="value" title="Tax Owed by Bracket" colors={BRACKET_COLORS} />
      <CalculatorInput
        input={{ id: "taxableIncome", label: "Taxable Income", type: "number", defaultValue: 100000, suffix: "$", min: 0, step: 1000, tooltip: "Your income after deductions and adjustments — the amount actually subject to tax." }}
        value={taxableIncome}
        onChange={setTaxableIncome}
      />
      <CalculatorInput
        input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [
          { label: "Single", value: 0 },
          { label: "Married Filing Jointly", value: 1 },
          { label: "Head of Household", value: 2 },
        ], tooltip: "Your filing status determines the applicable tax brackets."}}
        value={filingStatus}
        onChange={setFilingStatus}
      />
    </CalculatorLayout>
  );
}
