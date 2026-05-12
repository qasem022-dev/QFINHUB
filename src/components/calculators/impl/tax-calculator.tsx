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
  const [w2Income, setW2Income] = React.useState(0);
  const [preTaxDeductions, setPreTaxDeductions] = React.useState(0);

  const safeIncome = Math.max(0, isFinite(income) ? income : 0);
  const safeW2 = Math.max(0, isFinite(w2Income) ? w2Income : 0);
  const safePreTax = Math.max(0, isFinite(preTaxDeductions) ? preTaxDeductions : 0);

  const brackets = filingStatus === 0 ? BRACKETS_2024_SINGLE : BRACKETS_2024_MARRIED;
  const deduction = filingStatus === 0 ? STANDARD_DEDUCTION_2024.single : STANDARD_DEDUCTION_2024.married;
  const taxableIncome = Math.max(0, safeIncome - deduction - safePreTax);

  let totalTax = 0;
  const bracketBreakdown: { name: string; value: number }[] = [];
  let marginalRate = 0;

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
  }

  const effectiveRate = safeIncome > 0 ? (totalTax / safeIncome) * 100 : 0;
  const afterTaxIncome = safeIncome - totalTax;
  const takeHomePay = afterTaxIncome / 12;
  const w2Withholding = safeW2 > 0 ? (safeW2 / safeIncome) * totalTax : 0;
  const estimatedRefund = Math.max(0, w2Withholding - totalTax);

  return (
    <CalculatorLayout
      title="Tax Calculator"
      description="Estimate your income tax liability with marginal rate brackets, deductions, and W-2 withholding analysis."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} />
          <ResultCard label="Marginal Tax Rate" value={formatPercentage(marginalRate * 100)} />
          <ResultCard label="Taxable Income" value={formatCurrency(taxableIncome)} subtext={`After $${deduction.toLocaleString()} standard deduction`} />
          <ResultCard label="After-Tax Income" value={formatCurrency(afterTaxIncome)} subtext={`≈ ${formatCurrency(takeHomePay)}/mo take-home`} />
          {safeW2 > 0 && <ResultCard label="W-2 Withholding vs Owed" value={formatCurrency(estimatedRefund)} subtext={estimatedRefund > 0 ? "Estimated refund" : "Amount due"} />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={bracketBreakdown} xKey="name" yKey="value" title="Tax by Bracket" />
      <CalculatorInput input={{ id: "income", label: "Annual Income", type: "number", defaultValue: 75000, suffix: "$", min: 0, tooltip: "Your total gross annual income before deductions." }} value={income} onChange={setIncome} />
      <CalculatorInput input={{ id: "w2Income", label: "W-2 Wages", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "If you have W-2 wages, enter the amount to estimate withholding vs. tax owed." }} value={w2Income} onChange={setW2Income} />
      <CalculatorInput input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [{ label: "Single", value: 0 }, { label: "Married Filing Jointly", value: 1 }], tooltip: "Your tax filing status determines which tax brackets and standard deduction apply." }} value={filingStatus} onChange={setFilingStatus} />
      <CalculatorInput input={{ id: "preTaxDeductions", label: "Pre-Tax Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Pre-tax deductions such as 401(k), HSA, FSA contributions." }} value={preTaxDeductions} onChange={setPreTaxDeductions} />
    </CalculatorLayout>
  );
}
