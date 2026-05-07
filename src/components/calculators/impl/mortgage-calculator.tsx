"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const mr = annualRate / 100 / 12;
  return (principal * mr * Math.pow(1 + mr, termMonths)) / (Math.pow(1 + mr, termMonths) - 1);
}

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = React.useState(350000);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);
  const [taxes, setTaxes] = React.useState(3000);
  const [insurance, setInsurance] = React.useState(1200);

  const downPayment = homePrice * (downPct / 100);
  const loanAmount = homePrice - downPayment;
  const termMonths = term * 12;
  const pAndI = calcMonthlyPayment(loanAmount, rate, termMonths);
  const monthlyTaxes = taxes / 12;
  const monthlyInsurance = insurance / 12;
  const hasPMI = downPct < 20;
  const pmiRate = hasPMI ? (loanAmount * 0.005) / 12 : 0;
  const totalMonthly = pAndI + monthlyTaxes + monthlyInsurance + pmiRate;
  const totalPayment = totalMonthly * termMonths;
  const totalInterest = (pAndI * termMonths) - loanAmount;

  const pieData = [
    { name: "Principal & Interest", value: Math.round(pAndI * 12) },
    { name: "Property Taxes", value: Math.round(taxes) },
    { name: "Insurance", value: Math.round(insurance) },
    ...(hasPMI ? [{ name: "PMI", value: Math.round(pmiRate * 12) }] : []),
  ];

  return (
    <CalculatorLayout
      title="Mortgage Calculator"
      description="Estimate monthly mortgage payments including principal, interest, taxes, and insurance."
      icon={<span>🏠</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(totalMonthly)} highlight />
          <ResultCard label="Principal + Interest" value={formatCurrency(pAndI)} />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} subtext={`Over ${term} years`} />
          <ResultCard label="Down Payment" value={formatCurrency(downPayment)} subtext={`${downPct}% of home price`} />
          {hasPMI && <ResultCard label="Monthly PMI" value={formatCurrency(pmiRate)} subtext="Required for < 20% down" />}
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Annual Payment Breakdown" />
      <CalculatorInput input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 350000, suffix: "$", min: 0 }} value={homePrice} onChange={setHomePrice} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1 }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "term", label: "Loan Term", type: "select", defaultValue: 30, options: [{ label: "15 years", value: 15 }, { label: "20 years", value: 20 }, { label: "30 years", value: 30 }] }} value={term} onChange={setTerm} />
      <CalculatorInput input={{ id: "taxes", label: "Annual Property Taxes", type: "number", defaultValue: 3000, suffix: "$", min: 0 }} value={taxes} onChange={setTaxes} />
      <CalculatorInput input={{ id: "insurance", label: "Annual Home Insurance", type: "number", defaultValue: 1200, suffix: "$", min: 0 }} value={insurance} onChange={setInsurance} />
    </CalculatorLayout>
  );
}
