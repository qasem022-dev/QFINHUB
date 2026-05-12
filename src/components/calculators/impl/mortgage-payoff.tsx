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

export default function MortgagePayoffCalculator() {
  const [balance, setBalance] = React.useState(250000);
  const [rate, setRate] = React.useState(6);
  const [remainingTerm, setRemainingTerm] = React.useState(25);
  const [remainingTermUnit, setRemainingTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [extraPayment, setExtraPayment] = React.useState(200);

  const safeBalance = Math.max(0, balance ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeExtra = Math.max(0, extraPayment ?? 0);

  const termMonths = Math.max(1, toMonths(remainingTerm, remainingTermUnit));
  const mr = safeRate / 100 / 12;

  // Standard payment
  const standardPayment = isFinite(calcMonthlyPayment(safeBalance, safeRate, termMonths))
    ? calcMonthlyPayment(safeBalance, safeRate, termMonths) : 0;
  const standardTotalCost = standardPayment * termMonths;
  const standardTotalInterest = standardTotalCost - safeBalance;

  // Accelerated: iterate month by month
  let accelBalance = safeBalance;
  let months = 0;
  const accelPayment = standardPayment + safeExtra;

  const chartStep = Math.max(1, Math.floor(termMonths / 36));
  const chartData: { month: string; Standard: number; Accelerated: number }[] = [
    { month: "Start", Standard: Math.round(safeBalance), Accelerated: Math.round(safeBalance) },
  ];

  while (accelBalance > 0 && months < 600) {
    const interest = accelBalance * mr;
    let principalPmt = accelPayment - interest;
    if (principalPmt > accelBalance) principalPmt = accelBalance;
    accelBalance = Math.max(0, accelBalance - principalPmt);
    months++;

    if (months % Math.max(1, chartStep * 12) === 0 || accelBalance <= 0) {
      let stdBal = safeBalance;
      for (let m = 1; m <= Math.min(months, termMonths); m++) {
        const sInterest = stdBal * mr;
        const sPrincipal = standardPayment - sInterest;
        stdBal = Math.max(0, stdBal - sPrincipal);
      }
      chartData.push({
        month: months >= termMonths ? "End" : `Yr ${Math.ceil(months / 12)}`,
        Standard: Math.round(stdBal),
        Accelerated: Math.round(accelBalance),
      });
    }
  }

  const accelTotalInterest = (accelPayment * months) - safeBalance;
  const interestSaved = Math.max(0, standardTotalInterest - accelTotalInterest);
  const monthsSaved = termMonths - months;

  return (
    <CalculatorLayout
      title="Mortgage Payoff Calculator 🏁"
      description="Calculate how extra payments can shorten your mortgage term and reduce total interest."
      icon={<span>🏁</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Standard Monthly Payment" value={formatCurrency(standardPayment)} />
          <ResultCard label="Standard Payoff Time" value={`${remainingTerm} ${remainingTermUnit} (${formatNumber(termMonths)} months)`} />
          <ResultCard label="Standard Total Interest" value={formatCurrency(standardTotalInterest)} />
          <ResultCard
            label="Accelerated Monthly Payment"
            value={formatCurrency(accelPayment)}
            subtext={`Standard + ${formatCurrency(safeExtra)} extra`}
            highlight
          />
          <ResultCard
            label="Accelerated Payoff Time"
            value={`${Math.floor(months / 12)} years ${months % 12} months (${formatNumber(months)} months)`}
            subtext={monthsSaved > 0 ? `${formatNumber(monthsSaved)} months sooner` : ""}
          />
          <ResultCard label="Interest Saved" value={formatCurrency(Math.max(0, interestSaved))} />
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate" subtext="Extra payments only reduce term" />}
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="month"
        yKey={["Standard", "Accelerated"]}
        title="Balance Over Time: Standard vs. Accelerated"
      />
      <CalculatorInput
        input={{ id: "balance", label: "Current Loan Balance", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "Your current mortgage balance." }}
        value={balance}
        onChange={setBalance}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual mortgage interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="remainingTerm" label="Remaining Term" value={remainingTerm} unit={remainingTermUnit} onValueChange={setRemainingTerm} onUnitChange={setRemainingTermUnit} min={1} max={40} />
      <CalculatorInput
        input={{ id: "extraPayment", label: "Extra Monthly Payment", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Additional amount paid each month toward principal." }}
        value={extraPayment}
        onChange={setExtraPayment}
      />
    </CalculatorLayout>
  );
}
