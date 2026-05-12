"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function MortgageAffordabilityCalculator() {
  const [income, setIncome] = React.useState(85000);
  const [monthlyDebts, setMonthlyDebts] = React.useState(500);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [startDate, setStartDate] = React.useState<string>("");

  const safeIncome = Math.max(0, income ?? 0);
  const safeDebts = Math.max(0, monthlyDebts ?? 0);
  const safeDownPct = Math.max(0, Math.min(downPct ?? 0, 100));
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(term, termUnit));
  const maxPctOfIncome = 0.28;
  const maxPctOfDebt = 0.36;
  const monthlyIncome = safeIncome / 12;

  const maxHousingPayment = monthlyIncome * maxPctOfIncome;
  const maxTotalDebt = monthlyIncome * maxPctOfDebt;
  const availableForHousing = maxTotalDebt - safeDebts;
  const affordableMonthly = Math.max(0, Math.min(maxHousingPayment, availableForHousing));

  // Back-calculate affordable loan amount
  const mr = safeRate / 100 / 12;
  const affordableLoan = mr > 0
    ? (affordableMonthly / mr) * (1 - 1 / Math.pow(1 + mr, termMonths))
    : affordableMonthly * termMonths;

  const downPaymentPct = Math.max(0.01, (100 - safeDownPct) / 100);
  const affordableHomePrice = safeDownPct < 100
    ? affordableLoan / downPaymentPct
    : affordableLoan;

  const monthlyHousingCalc = safeDownPct < 100
    ? calcMonthlyPayment(affordableLoan, safeRate, termMonths)
    : 0;

  // DTI breakdown for chart
  const dtiData = [
    { name: "Housing", value: Math.round(Math.min(affordableMonthly, maxHousingPayment) * 12) },
    { name: "Other Debts", value: Math.round(safeDebts * 12) },
    { name: "Remaining Income", value: Math.round(Math.max(0, safeIncome - (Math.min(affordableMonthly, maxHousingPayment) + safeDebts) * 12)) },
  ];

  return (
    <CalculatorLayout
      title="Mortgage Affordability 🏠"
      description="Determine how much house you can afford based on income, debt, and down payment."
      icon={<span>🏠</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Affordable Home Price" value={formatCurrency(Math.max(0, affordableHomePrice))} highlight />
          <ResultCard label="Max Loan Amount" value={formatCurrency(Math.max(0, affordableLoan))} />
          <ResultCard label="Estimated Monthly Payment" value={formatCurrency(Math.max(0, affordableMonthly))} subtext={`28% front-end / 36% back-end ratio`} />
          <ResultCard label="Down Payment Needed" value={formatCurrency(Math.max(0, affordableHomePrice * (safeDownPct / 100)))} subtext={`${formatNumber(safeDownPct)}% down`} />
          <ResultCard label="Front-End DTI" value={formatPercentage((Math.min(affordableMonthly, maxHousingPayment) / monthlyIncome))} subtext="Max 28% of income" />
          <ResultCard label="Back-End DTI" value={formatPercentage(((Math.min(affordableMonthly, maxHousingPayment) + safeDebts) / monthlyIncome))} subtext="Max 36% of income" />
        </div>
      }
    >
      <CalculatorChart type="pie" data={dtiData} xKey="name" yKey="value" title="Annual Income Allocation" />
      <CalculatorInput input={{ id: "income", label: "Annual Household Income", type: "number", defaultValue: 85000, suffix: "$", min: 0, tooltip: "Your total annual household pre-tax income." }} value={income} onChange={setIncome} />
      <CalculatorInput input={{ id: "monthlyDebts", label: "Monthly Debt Payments", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Credit cards, car loans, student loans, etc." }} value={monthlyDebts} onChange={setMonthlyDebts} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1, tooltip: "Percentage of home price you can pay upfront." }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Expected mortgage interest rate." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} showDatePicker startDate={startDate} onStartDateChange={setStartDate} />
    </CalculatorLayout>
  );
}
