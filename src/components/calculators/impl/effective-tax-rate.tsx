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
  { rate: 0.32, from: 191950, to: 243725 },
  { rate: 0.35, from: 243725, to: 609350 },
  { rate: 0.37, from: 609350, to: Infinity },
];

const STANDARD_DEDUCTION_2024 = { single: 14600, married: 29200, hoh: 21900 };

const BRACKET_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function EffectiveTaxRateCalculator() {
  const [annualIncome, setAnnualIncome] = React.useState(80000);
  const [filingStatus, setFilingStatus] = React.useState(0); // 0 = single, 1 = married, 2 = hoh
  const [preTaxDeductions, setPreTaxDeductions] = React.useState(0);
  const [standardDeduction, setStandardDeduction] = React.useState(14600);
  const [itemizedDeductions, setItemizedDeductions] = React.useState(0);

  const safeIncome = Math.max(0, isFinite(annualIncome) ? annualIncome : 0);
  const safePreTax = Math.max(0, isFinite(preTaxDeductions) ? preTaxDeductions : 0);
  const safeStdDed = Math.max(0, isFinite(standardDeduction) ? standardDeduction : 0);
  const safeItemized = Math.max(0, isFinite(itemizedDeductions) ? itemizedDeductions : 0);

  const brackets =
    filingStatus === 0
      ? BRACKETS_2024_SINGLE
      : filingStatus === 1
        ? BRACKETS_2024_MARRIED
        : BRACKETS_2024_HOH;

  const deductionUsed = Math.max(safeStdDed, safeItemized);
  const taxableIncome = Math.max(0, safeIncome - deductionUsed - safePreTax);

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
  const isUsingItemized = safeItemized > safeStdDed;
  const afterTaxIncome = safeIncome - totalTax;

  const handleFilingStatusChange = (val: number) => {
    setFilingStatus(val);
    const deduction =
      val === 0
        ? STANDARD_DEDUCTION_2024.single
        : val === 1
          ? STANDARD_DEDUCTION_2024.married
          : STANDARD_DEDUCTION_2024.hoh;
    setStandardDeduction(deduction);
  };

  return (
    <CalculatorLayout
      title="Effective Tax Rate Calculator"
      description="Calculate your overall effective tax rate by dividing total tax liability by total income."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} highlight />
          <ResultCard label="Marginal Tax Rate" value={formatPercentage(marginalRate * 100)} />
          <ResultCard label="Taxable Income" value={formatCurrency(taxableIncome)} subtext={`After $${deductionUsed.toLocaleString()} in deductions`} />
          <ResultCard label="Standard Deduction Used" value={formatCurrency(deductionUsed)} subtext={isUsingItemized ? "Itemized deductions exceed standard deduction" : "Standard deduction applied"} />
          <ResultCard label="After-Tax Income" value={formatCurrency(afterTaxIncome)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={bracketBreakdown} xKey="name" yKey="value" title="Tax Owed by Bracket" colors={BRACKET_COLORS} />
      <CalculatorInput input={{ id: "annualIncome", label: "Annual Income", type: "number", defaultValue: 80000, suffix: "$", min: 0, tooltip: "Your total gross annual income from all sources." }} value={annualIncome} onChange={setAnnualIncome} />
      <CalculatorInput input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [{ label: "Single", value: 0 }, { label: "Married Jointly", value: 1 }, { label: "Head of Household", value: 2 }], tooltip: "Your tax filing status determines the applicable brackets and standard deduction." }} value={filingStatus} onChange={handleFilingStatusChange} />
      <CalculatorInput input={{ id: "preTaxDeductions", label: "Pre-Tax Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Pre-tax deductions such as 401(k), HSA, FSA, and traditional IRA contributions." }} value={preTaxDeductions} onChange={setPreTaxDeductions} />
      <CalculatorInput input={{ id: "standardDeduction", label: "Standard Deduction", type: "number", defaultValue: 14600, suffix: "$", min: 0, tooltip: "The standard deduction amount for your filing status. Adjusts automatically when filing status changes." }} value={standardDeduction} onChange={setStandardDeduction} />
      <CalculatorInput input={{ id: "itemizedDeductions", label: "Itemized Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "If you itemize, enter total itemized deductions (mortgage interest, state & local taxes, charity, etc.). The larger of standard vs. itemized is used." }} value={itemizedDeductions} onChange={setItemizedDeductions} />
    </CalculatorLayout>
  );
}
