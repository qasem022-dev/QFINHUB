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

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(25000);
  const [rate, setRate] = React.useState(6);
  const [term, setTerm] = React.useState(5);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeAmount = Math.max(0, loanAmount ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(term, termUnit));
  const monthlyPayment = isFinite(calcMonthlyPayment(safeAmount, safeRate, termMonths)) ? calcMonthlyPayment(safeAmount, safeRate, termMonths) : 0;
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - safeAmount;

  // Build amortization for chart (max 36 points)
  const chartStep = Math.max(1, Math.floor(termMonths / 36));
  const accurateChartData: {month: string; Balance: number; "Principal Paid": number; "Interest Paid": number}[] = [];
  let balance = safeAmount;
  const mr = safeRate / 100 / 12;
  for (let i = 0; i <= termMonths; i++) {
    if (i === 0) {
      accurateChartData.push({ month: "Start", Balance: Math.round(safeAmount), "Principal Paid": 0, "Interest Paid": 0 });
    } else {
      const interest = balance * mr;
      const principalPmt = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPmt);
      const cumulativePrincipal = Math.round(safeAmount - balance);
      const cumulativeInterest = Math.round(monthlyPayment * i - (safeAmount - balance));
      if (i % chartStep === 0 || i === termMonths) {
        accurateChartData.push({
          month: i === termMonths ? "End" : `Mo ${i}`,
          Balance: Math.round(balance),
          "Principal Paid": cumulativePrincipal,
          "Interest Paid": cumulativeInterest,
        });
      }
    }
  }

  return (
    <CalculatorLayout
      title="Loan Calculator 🏦"
      description="Calculate monthly payments, total interest, and amortization schedule for any loan."
      icon={<span>🏦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Payment" value={formatCurrency(totalPayment)} subtext={`Over ${formatNumber(termMonths)} months`} />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate — no interest charged" subtext="Principal only" />}
        </div>
      }
    >
      <CalculatorChart type="area" data={accurateChartData} xKey="month" yKey={["Principal Paid", "Interest Paid"]} title="Amortization Breakdown" />
      <CalculatorInput input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "The total amount you plan to borrow." }} value={loanAmount} onChange={setLoanAmount} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "The annual interest rate for the loan." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={30} />
    </CalculatorLayout>
  );
}
