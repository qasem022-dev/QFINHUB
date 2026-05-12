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

function computeIncomeTax(income: number, status: number): number {
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

export default function Form1099Calculator() {
  const [income1099, setIncome1099] = React.useState(80000);
  const [businessExpenses, setBusinessExpenses] = React.useState(10000);
  const [filingStatus, setFilingStatus] = React.useState(0);
  const [otherIncome, setOtherIncome] = React.useState(0);
  const [estimatedPayments, setEstimatedPayments] = React.useState(5000);

  const safeIncome = isFinite(income1099) ? Math.max(0, income1099) : 0;
  const safeExpenses = isFinite(businessExpenses) ? Math.max(0, businessExpenses) : 0;
  const safeOtherIncome = isFinite(otherIncome) ? Math.max(0, otherIncome) : 0;
  const safeEstimated = isFinite(estimatedPayments) ? Math.max(0, estimatedPayments) : 0;

  const netSeIncome = Math.max(0, safeIncome - safeExpenses);
  const seBase = netSeIncome * 0.9235;
  const seTax = seBase * 0.153;
  const seDeduction = seTax * 0.5;
  const taxableIncome = Math.max(0, netSeIncome - seDeduction + safeOtherIncome);
  const incomeTax = computeIncomeTax(taxableIncome, filingStatus);
  const totalTax = seTax + incomeTax;
  const totalTaxRemaining = Math.max(0, totalTax - safeEstimated);
  const quarterlyPayment = totalTaxRemaining / 4;
  const effectiveRate = netSeIncome > 0 ? ((seTax + incomeTax) / (netSeIncome + safeOtherIncome)) * 100 : 0;

  const pieData = [
    { name: "Self-Employment Tax", value: Math.round(seTax) },
    { name: "Income Tax", value: Math.round(incomeTax) },
  ];

  return (
    <CalculatorLayout
      title="1099 / Self-Employed Tax Calculator"
      description="Calculate self-employment tax, estimated income tax, and quarterly payments for 1099 contractors and freelancers."
      icon={<span>📑</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Self-Employment Tax" value={formatCurrency(seTax)} subtext={`15.3% on ${formatCurrency(seBase)} SE base`} />
          <ResultCard label="Income Tax" value={formatCurrency(incomeTax)} subtext={`On taxable income of ${formatCurrency(taxableIncome)}`} />
          <ResultCard label="Total Tax Remaining" value={formatCurrency(totalTaxRemaining)} highlight />
          <ResultCard label="Quarterly Payment Due" value={formatCurrency(quarterlyPayment)} subtext="4 quarterly estimated payments" />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveRate)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Tax Breakdown" />
      <CalculatorInput
        input={{ id: "income1099", label: "1099 Income", type: "number", defaultValue: 80000, suffix: "$", min: 0, step: 1000, tooltip: "Your total gross income from 1099/self-employment work." }}
        value={income1099}
        onChange={setIncome1099}
      />
      <CalculatorInput
        input={{ id: "businessExpenses", label: "Business Expenses", type: "number", defaultValue: 10000, suffix: "$", min: 0, step: 500, tooltip: "Deductible business expenses that reduce your net self-employment income (Schedule C expenses)." }}
        value={businessExpenses}
        onChange={setBusinessExpenses}
      />
      <CalculatorInput
        input={{ id: "filingStatus", label: "Filing Status", type: "select", defaultValue: 0, options: [
          { label: "Single", value: 0 },
          { label: "Married Filing Jointly", value: 1 },
          { label: "Head of Household", value: 2 },
        ], tooltip: "Your tax filing status determines which tax brackets apply to your income."}}
        value={filingStatus}
        onChange={setFilingStatus}
      />
      <CalculatorInput
        input={{ id: "otherIncome", label: "Other Income (W-2, etc.)", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 1000, tooltip: "Income from other sources like W-2 wages, interest, dividends, etc." }}
        value={otherIncome}
        onChange={setOtherIncome}
      />
      <CalculatorInput
        input={{ id: "estimatedPayments", label: "Estimated Payments Already Made", type: "number", defaultValue: 5000, suffix: "$", min: 0, step: 500, tooltip: "Quarterly estimated tax payments you have already made this year." }}
        value={estimatedPayments}
        onChange={setEstimatedPayments}
      />
    </CalculatorLayout>
  );
}
