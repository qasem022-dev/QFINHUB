"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

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

function computeTax(income: number, status: number): number {
  const brackets =
    status === 0 ? BRACKETS_2024_SINGLE
    : status === 1 ? BRACKETS_2024_MARRIED
    : BRACKETS_2024_HOH;

  let total = 0;
  for (const b of brackets) {
    if (income <= b.from) break;
    const taxable = Math.min(income, b.to) - b.from;
    if (taxable > 0) total += taxable * b.rate;
  }
  return total;
}

export default function W4Calculator() {
  const [annualIncome, setAnnualIncome] = React.useState(75000);
  const [filingStatus, setFilingStatus] = React.useState(0);
  const [dependents, setDependents] = React.useState(0);
  const [otherIncome, setOtherIncome] = React.useState(0);
  const [deductions, setDeductions] = React.useState(0);
  const [taxCredits, setTaxCredits] = React.useState(0);
  const [withholdingToDate, setWithholdingToDate] = React.useState(5000);
  const [remainingPayPeriods, setRemainingPayPeriods] = React.useState(26);

  const safeIncome = isFinite(annualIncome) ? Math.max(0, annualIncome) : 0;
  const safeOtherIncome = isFinite(otherIncome) ? Math.max(0, otherIncome) : 0;
  const safeDeductions = isFinite(deductions) ? Math.max(0, deductions) : 0;
  const safeCredits = isFinite(taxCredits) ? Math.max(0, taxCredits) : 0;
  const safeWithheld = isFinite(withholdingToDate) ? Math.max(0, withholdingToDate) : 0;
  const safePeriods = isFinite(remainingPayPeriods) ? Math.max(1, remainingPayPeriods) : 26;

  const totalIncome = safeIncome + safeOtherIncome;
  const taxableIncome = Math.max(0, totalIncome - safeDeductions);
  const estimatedTax = computeTax(taxableIncome, filingStatus);
  const remainingTax = Math.max(0, estimatedTax - safeWithheld - safeCredits);
  const additionalPerPaycheck = safePeriods > 0 ? remainingTax / safePeriods : 0;

  // Update chart data to use safe values
  const chartData = [
    { name: "Estimated Total Tax", value: Math.round(estimatedTax) },
    { name: "YTD Withholding", value: Math.round(safeWithheld) },
    { name: "Remaining Tax", value: Math.round(remainingTax) },
  ];

  return (
    <CalculatorLayout
      title="W-4 Withholding Calculator"
      description="Estimate your federal income tax withholding and determine how much additional withholding is needed per paycheck."
      icon={<span>📋</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Estimated Total Tax" value={formatCurrency(estimatedTax)} highlight />
          <ResultCard label="YTD Withholding" value={formatCurrency(withholdingToDate)} />
          <ResultCard label="Remaining Tax Due" value={formatCurrency(remainingTax)} highlight />
          <ResultCard label="Additional Withholding / Paycheck" value={formatCurrency(additionalPerPaycheck)} subtext={`Over ${remainingPayPeriods} remaining pay periods`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Withholding Overview" />
      <CalculatorInput
        input={{ id: "annualIncome", label: "Annual Income (W-2)", type: "number", defaultValue: 75000, suffix: "$", min: 0, step: 1000, tooltip: "Your expected annual wage income from your W-2 job." }}
        value={annualIncome}
        onChange={setAnnualIncome}
      />
      <CalculatorInput
        input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [
          { label: "Single", value: 0 },
          { label: "Married Jointly", value: 1 },
          { label: "Head of Household", value: 2 },
        ], tooltip: "Your filing status determines the tax brackets used for withholding calculations."}}
        value={filingStatus}
        onChange={setFilingStatus}
      />
      <CalculatorInput
        input={{ id: "dependents", label: "Dependents", type: "number", defaultValue: 0, min: 0, max: 20, step: 1, tooltip: "Number of dependents you claim on your tax return." }}
        value={dependents}
        onChange={setDependents}
      />
      <CalculatorInput
        input={{ id: "otherIncome", label: "Other Income", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 1000, tooltip: "Additional taxable income from sources other than your main W-2 job." }}
        value={otherIncome}
        onChange={setOtherIncome}
      />
      <CalculatorInput
        input={{ id: "deductions", label: "Deductions (Pre-Tax)", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 500, tooltip: "Pre-tax deductions like 401(k), HSA, FSA, etc." }}
        value={deductions}
        onChange={setDeductions}
      />
      <CalculatorInput
        input={{ id: "taxCredits", label: "Tax Credits", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 100, tooltip: "Non-refundable tax credits (child tax credit, education credits, etc.)." }}
        value={taxCredits}
        onChange={setTaxCredits}
      />
      <CalculatorInput
        input={{ id: "withholdingToDate", label: "Withholding to Date (YTD)", type: "number", defaultValue: 5000, suffix: "$", min: 0, step: 500, tooltip: "Total federal income tax already withheld from your paychecks this year." }}
        value={withholdingToDate}
        onChange={setWithholdingToDate}
      />
      <CalculatorInput
        input={{ id: "remainingPayPeriods", label: "Remaining Pay Periods", type: "number", defaultValue: 26, min: 1, max: 52, step: 1, tooltip: "Number of pay periods remaining in the calendar year." }}
        value={remainingPayPeriods}
        onChange={setRemainingPayPeriods}
      />
    </CalculatorLayout>
  );
}
