"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const mr = annualRate / 100 / 12;
  return (principal * mr * Math.pow(1 + mr, termMonths)) / (Math.pow(1 + mr, termMonths) - 1);
}

export default function MortgageAffordabilityCalculator() {
  const [income, setIncome] = React.useState(85000);
  const [monthlyDebts, setMonthlyDebts] = React.useState(500);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);

  const termMonths = term * 12;
  const maxPctOfIncome = 0.28;
  const maxPctOfDebt = 0.36;
  const monthlyIncome = income / 12;

  const maxHousingPayment = monthlyIncome * maxPctOfIncome;
  const maxTotalDebt = monthlyIncome * maxPctOfDebt;
  const availableForHousing = maxTotalDebt - monthlyDebts;
  const affordableMonthly = Math.min(maxHousingPayment, availableForHousing);

  // Back-calculate affordable loan amount
  const mr = rate / 100 / 12;
  const affordableLoan = mr > 0
    ? (affordableMonthly / mr) * (1 - 1 / Math.pow(1 + mr, termMonths))
    : affordableMonthly * termMonths;

  const affordableHomePrice = downPct < 100
    ? affordableLoan / (1 - downPct / 100)
    : affordableLoan;

  return (
    <CalculatorLayout
      title="Mortgage Affordability"
      description="Determine how much house you can afford based on income, debt, and down payment."
      icon={<span>🔑</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Affordable Home Price" value={formatCurrency(Math.max(0, affordableHomePrice))} highlight />
          <ResultCard label="Max Loan Amount" value={formatCurrency(Math.max(0, affordableLoan))} />
          <ResultCard label="Estimated Monthly Payment" value={formatCurrency(Math.max(0, affordableMonthly))} subtext="28% front-end / 36% back-end ratio" />
          <ResultCard label="Down Payment Needed" value={formatCurrency(Math.max(0, affordableHomePrice * (downPct / 100)))} />
        </div>
      }
    >
      <CalculatorInput input={{ id: "income", label: "Annual Household Income", type: "number", defaultValue: 85000, suffix: "$", min: 0 }} value={income} onChange={setIncome} />
      <CalculatorInput input={{ id: "monthlyDebts", label: "Monthly Debt Payments", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Credit cards, car loans, student loans, etc." }} value={monthlyDebts} onChange={setMonthlyDebts} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1 }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "term", label: "Loan Term", type: "select", defaultValue: 30, options: [{ label: "15 years", value: 15 }, { label: "20 years", value: 20 }, { label: "30 years", value: 30 }] }} value={term} onChange={setTerm} />
    </CalculatorLayout>
  );
}
