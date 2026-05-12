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

export default function LoanRefinancingCalculator() {
  const [currentBalance, setCurrentBalance] = React.useState(25000);
  const [currentRate, setCurrentRate] = React.useState(8);
  const [currentTermRemaining, setCurrentTermRemaining] = React.useState(48);
  const [currentTermUnit, setCurrentTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("months");
  const [newRate, setNewRate] = React.useState(5);
  const [newTerm, setNewTerm] = React.useState(60);
  const [newTermUnit, setNewTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("months");
  const [closingCosts, setClosingCosts] = React.useState(2000);

  const safeBalance = Math.max(0, currentBalance ?? 0);
  const safeCurrentRate = Math.max(0, Math.min(currentRate ?? 0, 100));
  const safeNewRate = Math.max(0, Math.min(newRate ?? 0, 100));
  const safeCosts = Math.max(0, closingCosts ?? 0);

  const curTermMonths = Math.max(1, toMonths(currentTermRemaining, currentTermUnit));
  const newTermMonths = Math.max(1, toMonths(newTerm, newTermUnit));

  const currentPayment = isFinite(calcMonthlyPayment(safeBalance, safeCurrentRate, curTermMonths))
    ? calcMonthlyPayment(safeBalance, safeCurrentRate, curTermMonths) : 0;
  const newPayment = isFinite(calcMonthlyPayment(safeBalance, safeNewRate, newTermMonths))
    ? calcMonthlyPayment(safeBalance, safeNewRate, newTermMonths) : 0;

  const currentTotal = currentPayment * curTermMonths;
  const newTotal = newPayment * newTermMonths;
  const currentInterest = currentTotal - safeBalance;
  const newInterest = newTotal - safeBalance;
  const monthlySavings = currentPayment - newPayment;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(safeCosts / monthlySavings) : Infinity;
  const totalInterestSaved = Math.max(0, currentInterest - newInterest);

  const chartData = [
    { name: "Current Loan", "Monthly Payment": Math.round(currentPayment), "Total Interest": Math.round(currentInterest) },
    { name: "Refinanced", "Monthly Payment": Math.round(newPayment), "Total Interest": Math.round(newInterest) },
  ];

  return (
    <CalculatorLayout
      title="Loan Refinancing Calculator 🔄"
      description="Evaluate whether refinancing a loan makes sense by comparing new vs. current terms."
      icon={<span>🔄</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Current Monthly Payment" value={formatCurrency(currentPayment)} />
          <ResultCard label="New Monthly Payment" value={formatCurrency(newPayment)} highlight={monthlySavings > 0} />
          <ResultCard label="Monthly Savings" value={formatCurrency(Math.max(0, monthlySavings))} subtext={monthlySavings > 0 ? "Per month" : "No savings"} />
          <ResultCard label="Break-Even" value={isFinite(breakEvenMonths) ? `${formatNumber(breakEvenMonths)} months (${(breakEvenMonths / 12).toFixed(1)} yrs)` : "N/A"} subtext={isFinite(breakEvenMonths) ? `To recoup ${formatCurrency(safeCosts)} in closing costs` : undefined} />
          <ResultCard label="Total Interest Saved" value={formatCurrency(Math.max(0, totalInterestSaved))} />
          {safeNewRate === 0 && <ResultCard label="Note" value="0% refinance rate" subtext="Interest-free loan" />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["Monthly Payment", "Total Interest"]} title="Current vs Refinanced" />
      <CalculatorInput input={{ id: "currentBalance", label: "Current Balance", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "Remaining balance on your current loan." }} value={currentBalance} onChange={setCurrentBalance} />
      <CalculatorInput input={{ id: "currentRate", label: "Current Rate", type: "number", defaultValue: 8, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Your current annual interest rate." }} value={currentRate} onChange={setCurrentRate} />
      <PeriodInput id="currentTermRemaining" label="Current Remaining Term" value={currentTermRemaining} unit={currentTermUnit} onValueChange={setCurrentTermRemaining} onUnitChange={setCurrentTermUnit} min={1} max={360} />
      <CalculatorInput input={{ id: "newRate", label: "New Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "The new annual interest rate you qualify for." }} value={newRate} onChange={setNewRate} />
      <PeriodInput id="newTerm" label="New Term" value={newTerm} unit={newTermUnit} onValueChange={setNewTerm} onUnitChange={setNewTermUnit} min={1} max={360} />
      <CalculatorInput input={{ id: "closingCosts", label: "Closing Costs", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Fees to close the new loan (origination, appraisal, etc.)." }} value={closingCosts} onChange={setClosingCosts} />
    </CalculatorLayout>
  );
}
