"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function LoanComparisonCalculator() {
  const [amountA, setAmountA] = React.useState(20000);
  const [rateA, setRateA] = React.useState(6);
  const [termA, setTermA] = React.useState(3);
  const [termAUnit, setTermAUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [amountB, setAmountB] = React.useState(20000);
  const [rateB, setRateB] = React.useState(8);
  const [termB, setTermB] = React.useState(5);
  const [termBUnit, setTermBUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeAmountA = Math.max(0, amountA ?? 0);
  const safeRateA = Math.max(0, Math.min(rateA ?? 0, 100));
  const safeAmountB = Math.max(0, amountB ?? 0);
  const safeRateB = Math.max(0, Math.min(rateB ?? 0, 100));

  const termMonthsA = Math.max(1, toMonths(termA, termAUnit));
  const termMonthsB = Math.max(1, toMonths(termB, termBUnit));
  const paymentA = isFinite(calcMonthlyPayment(safeAmountA, safeRateA, termMonthsA)) ? calcMonthlyPayment(safeAmountA, safeRateA, termMonthsA) : 0;
  const paymentB = isFinite(calcMonthlyPayment(safeAmountB, safeRateB, termMonthsB)) ? calcMonthlyPayment(safeAmountB, safeRateB, termMonthsB) : 0;
  const totalInterestA = (paymentA * termMonthsA) - safeAmountA;
  const totalInterestB = (paymentB * termMonthsB) - safeAmountB;
  const paymentDiff = paymentA - paymentB;
  const interestDiff = totalInterestA - totalInterestB;

  const chartData = [
    { name: "Loan A", "Monthly Payment": Math.round(paymentA), "Total Interest": Math.round(totalInterestA) },
    { name: "Loan B", "Monthly Payment": Math.round(paymentB), "Total Interest": Math.round(totalInterestB) },
  ];

  return (
    <CalculatorLayout
      title="Loan Comparison Calculator ⚖️"
      description="Compare multiple loan offers side by side with rates, terms, and total cost analysis."
      icon={<span>⚖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Loan A - Monthly Payment" value={formatCurrency(paymentA)} />
          <ResultCard label="Loan B - Monthly Payment" value={formatCurrency(paymentB)} />
          <ResultCard label="Payment Difference" value={formatCurrency(Math.abs(paymentDiff))} subtext={paymentDiff < 0 ? "Loan B is cheaper monthly" : paymentDiff > 0 ? "Loan A is cheaper monthly" : "Same monthly payment"} highlight={paymentDiff !== 0} />
          <ResultCard label="Loan A - Total Interest" value={formatCurrency(totalInterestA)} subtext={`Over ${formatNumber(termMonthsA)} months`} />
          <ResultCard label="Loan B - Total Interest" value={formatCurrency(totalInterestB)} subtext={`Over ${formatNumber(termMonthsB)} months`} />
          <ResultCard label="Interest Difference" value={formatCurrency(Math.abs(interestDiff))} subtext={interestDiff < 0 ? "Loan B has less interest" : interestDiff > 0 ? "Loan A has less interest" : "Same total interest"} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["Monthly Payment", "Total Interest"]} title="Loan Comparison" />
      <CalculatorInput input={{ id: "amountA", label: "Loan A - Amount", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "Loan amount for offer A." }} value={amountA} onChange={setAmountA} />
      <CalculatorInput input={{ id: "rateA", label: "Loan A - Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Annual interest rate for offer A." }} value={rateA} onChange={setRateA} />
      <PeriodInput id="termA" label="Loan A - Term" value={termA} unit={termAUnit} onValueChange={setTermA} onUnitChange={setTermAUnit} min={1} max={30} />
      <CalculatorInput input={{ id: "amountB", label: "Loan B - Amount", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "Loan amount for offer B." }} value={amountB} onChange={setAmountB} />
      <CalculatorInput input={{ id: "rateB", label: "Loan B - Rate", type: "number", defaultValue: 8, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Annual interest rate for offer B." }} value={rateB} onChange={setRateB} />
      <PeriodInput id="termB" label="Loan B - Term" value={termB} unit={termBUnit} onValueChange={setTermB} onUnitChange={setTermBUnit} min={1} max={30} />
    </CalculatorLayout>
  );
}
