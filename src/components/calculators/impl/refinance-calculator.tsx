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

export default function RefinanceCalculator() {
  const [balance, setBalance] = React.useState(250000);
  const [currentRate, setCurrentRate] = React.useState(7);
  const [remainingTerm, setRemainingTerm] = React.useState(25);
  const [remainingTermUnit, setRemainingTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [newRate, setNewRate] = React.useState(5.5);
  const [newTerm, setNewTerm] = React.useState(30);
  const [newTermUnit, setNewTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [closingCosts, setClosingCosts] = React.useState(5000);

  const safeBalance = Math.max(0, balance ?? 0);
  const safeCurrentRate = Math.max(0, Math.min(currentRate ?? 0, 100));
  const safeNewRate = Math.max(0, Math.min(newRate ?? 0, 100));
  const safeCosts = Math.max(0, closingCosts ?? 0);

  const currentRemainingMonths = Math.max(1, toMonths(remainingTerm, remainingTermUnit));
  const newTermMonths = Math.max(1, toMonths(newTerm, newTermUnit));

  const currentPayment = isFinite(calcMonthlyPayment(safeBalance, safeCurrentRate, currentRemainingMonths))
    ? calcMonthlyPayment(safeBalance, safeCurrentRate, currentRemainingMonths) : 0;
  const newPayment = isFinite(calcMonthlyPayment(safeBalance, safeNewRate, newTermMonths))
    ? calcMonthlyPayment(safeBalance, safeNewRate, newTermMonths) : 0;
  const monthlySavings = currentPayment - newPayment;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(safeCosts / monthlySavings) : Infinity;

  // Total interest calculations
  const currentTotalInterest = currentPayment * currentRemainingMonths - safeBalance;
  const newTotalInterest = newPayment * newTermMonths - safeBalance;
  const totalInterestSaved = Math.max(0, currentTotalInterest - newTotalInterest);

  // Chart data - compare current vs new interest paths (max 36 years)
  const maxYears = Math.min(Math.max(remainingTerm, newTerm), 36);
  const chartData: { year: string; Current: number; New: number }[] = [
    { year: "Start", Current: Math.round(safeBalance), New: Math.round(safeBalance) },
  ];

  for (let y = 1; y <= maxYears; y++) {
    let curBal = safeBalance;
    const curMr = safeCurrentRate / 100 / 12;
    for (let m = 1; m <= y * 12; m++) {
      if (m <= currentRemainingMonths) {
        const interest = curBal * curMr;
        const principalPmt = currentPayment - interest;
        curBal = Math.max(0, curBal - principalPmt);
      }
    }

    let newBal = safeBalance;
    const newMr = safeNewRate / 100 / 12;
    for (let m = 1; m <= y * 12; m++) {
      if (m <= newTermMonths) {
        const interest = newBal * newMr;
        const principalPmt = newPayment - interest;
        newBal = Math.max(0, newBal - principalPmt);
      }
    }

    chartData.push({
      year: `Yr ${y}`,
      Current: Math.round(curBal),
      New: Math.round(newBal),
    });
  }

  return (
    <CalculatorLayout
      title="Refinance Calculator 🔄"
      description="Determine if refinancing your mortgage is worthwhile with break-even and savings analysis."
      icon={<span>🔄</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Current Monthly Payment" value={formatCurrency(currentPayment)} />
          <ResultCard label="New Monthly Payment" value={formatCurrency(newPayment)} />
          <ResultCard
            label="Monthly Savings"
            value={formatCurrency(Math.max(0, monthlySavings))}
            highlight
          />
          <ResultCard
            label="Break-Even Period"
            value={
              monthlySavings > 0
                ? `${formatNumber(breakEvenMonths)} months (${(breakEvenMonths / 12).toFixed(1)} years)`
                : "N/A"
            }
            subtext={`Closing costs: ${formatCurrency(safeCosts)}`}
          />
          <ResultCard
            label="Total Interest Saved"
            value={formatCurrency(totalInterestSaved)}
            subtext={`Current: ${formatCurrency(currentTotalInterest)} → New: ${formatCurrency(newTotalInterest)}`}
          />
          {safeNewRate === 0 && <ResultCard label="Note" value="0% refinance rate" subtext="No interest" />}
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Current", "New"]}
        title="Remaining Balance: Current vs. Refinanced"
      />
      <CalculatorInput
        input={{ id: "balance", label: "Current Loan Balance", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "Your current mortgage balance." }}
        value={balance}
        onChange={setBalance}
      />
      <CalculatorInput
        input={{ id: "currentRate", label: "Current Interest Rate", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Your current mortgage interest rate." }}
        value={currentRate}
        onChange={setCurrentRate}
      />
      <PeriodInput id="remainingTerm" label="Remaining Term" value={remainingTerm} unit={remainingTermUnit} onValueChange={setRemainingTerm} onUnitChange={setRemainingTermUnit} min={1} max={40} />
      <CalculatorInput
        input={{ id: "newRate", label: "New Interest Rate", type: "number", defaultValue: 5.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "The new interest rate you qualify for." }}
        value={newRate}
        onChange={setNewRate}
      />
      <CalculatorInput
        input={{ id: "newTerm", label: "New Loan Term", type: "select", defaultValue: 30, options: [{ label: "15 years", value: 15 }, { label: "20 years", value: 20 }, { label: "30 years", value: 30 }], tooltip: "The term length of the new loan." }}
        value={newTerm}
        onChange={setNewTerm}
      />
      <CalculatorInput
        input={{ id: "closingCosts", label: "Closing Costs", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Total fees to close the refinance." }}
        value={closingCosts}
        onChange={setClosingCosts}
      />
    </CalculatorLayout>
  );
}
