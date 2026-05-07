"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

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

const STANDARD_DEDUCTION_2024 = { single: 14600, married: 29200 };

export default function TaxCalculator() {
  const [income, setIncome] = React.useState(75000);
  const [filingStatus, setFilingStatus] = React.useState(0); // 0 = single, 1 = married

  const brackets = filingStatus === 0 ? BRACKETS_2024_SINGLE : BRACKETS_2024_MARRIED;
  const deduction = filingStatus === 0 ? STANDARD_DEDUCTION_2024.single : STANDARD_DEDUCTION_2024.married;
  const taxableIncome = Math.max(0, income - deduction);

  let totalTax = 0;
  const bracketBreakdown: { name: string; value: number }[] = [];
  let marginalRate = 0;
  let prevFrom = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.from) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
    if (taxableInBracket > 0) {
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;
      bracketBreakdown.push({
        name: `${(bracket.rate * 100).toFixed(0)}% Bracket`,
        value: Math.round(taxInBracket),
      });
    }
    marginalRate = bracket.rate;
    prevFrom = bracket.from;
  }

  const effectiveRate = taxableIncome > 0 ? (totalTax / income) * 100 : 0;

  return (
    <CalculatorLayout
      title="Tax Calculator"
      description="Estimate your income tax liability with marginal rate brackets and deductions."
      icon={<span>📋</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} />
          <ResultCard label="Marginal Tax Rate" value={formatPercentage(marginalRate * 100)} />
          <ResultCard label="Taxable Income" value={formatCurrency(taxableIncome)} subtext={`After $${deduction.toLocaleString()} standard deduction`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={bracketBreakdown} xKey="name" yKey="value" title="Tax by Bracket" />
      <CalculatorInput input={{ id: "income", label: "Annual Income", type: "number", defaultValue: 75000, suffix: "$", min: 0 }} value={income} onChange={setIncome} />
      <CalculatorInput input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [{ label: "Single", value: 0 }, { label: "Married Filing Jointly", value: 1 }] }} value={filingStatus} onChange={setFilingStatus} />
    </CalculatorLayout>
  );
}
