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

export default function PersonalLoanCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(10000);
  const [rate, setRate] = React.useState(10);
  const [term, setTerm] = React.useState(3);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeAmount = Math.max(0, loanAmount ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(term, termUnit));

  const monthlyPayment = isFinite(calcMonthlyPayment(safeAmount, safeRate, termMonths)) ? calcMonthlyPayment(safeAmount, safeRate, termMonths) : 0;
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - safeAmount;

  // Build amortization chart (max 36 points)
  const chartStep = Math.max(1, Math.floor(termMonths / 36));
  const chartData: { month: string; Principal: number; Interest: number; Balance: number }[] = [];
  let balance = safeAmount;
  const mr = safeRate / 100 / 12;
  for (let i = 0; i <= termMonths; i++) {
    if (i === 0) {
      chartData.push({ month: "Start", Principal: 0, Interest: 0, Balance: Math.round(safeAmount) });
    } else {
      const interest = balance * mr;
      const principalPmt = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPmt);
      if (i % chartStep === 0 || i === termMonths) {
        chartData.push({
          month: i === termMonths ? "End" : `Mo ${i}`,
          Principal: Math.round(principalPmt),
          Interest: Math.round(interest),
          Balance: Math.round(balance),
        });
      }
    }
  }

  return (
    <CalculatorLayout
      title="Personal Loan Calculator 💳"
      description="Estimate monthly payments and total interest for personal loans with fixed terms."
      icon={<span>💳</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} subtext={`Over ${formatNumber(termMonths)} months`} />
          <ResultCard label="Total Cost" value={formatCurrency(totalPayment)} />
          {safeRate === 0 && <ResultCard label="Note" value="0% APR — no interest" subtext="Principal only payments" />}
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Principal", "Interest"]} title="Principal vs Interest Over Time" />
      <CalculatorInput input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The amount you plan to borrow." }} value={loanAmount} onChange={setLoanAmount} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 36, step: 0.1, tooltip: "Annual percentage rate for the personal loan." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={7} />
    </CalculatorLayout>
  );
}
