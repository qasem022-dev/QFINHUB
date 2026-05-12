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

export default function AmortizationScheduleCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(250000);
  const [rate, setRate] = React.useState(6);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeAmount = Math.max(0, loanAmount ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(term, termUnit));
  const monthlyPayment = isFinite(calcMonthlyPayment(safeAmount, safeRate, termMonths)) ? calcMonthlyPayment(safeAmount, safeRate, termMonths) : 0;
  const mr = safeRate / 100 / 12;

  let balance = safeAmount;
  const chartData: { month: string; Principal: number; Interest: number; Balance: number }[] = [
    { month: "Start", Principal: 0, Interest: 0, Balance: Math.round(safeAmount) },
  ];

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * mr;
    const principalPmt = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPmt);
    if (i % 12 === 0 || i === termMonths) {
      chartData.push({
        month: `Yr ${Math.ceil(i / 12)}`,
        Principal: Math.round(principalPmt * 12),
        Interest: Math.round(interest * 12),
        Balance: Math.round(balance),
      });
    }
  }

  const totalInterest = (monthlyPayment * termMonths) - safeAmount;
  const totalPaid = monthlyPayment * termMonths;
  const interestPct = totalPaid > 0 ? ((totalInterest / totalPaid) * 100) : 0;

  return (
    <CalculatorLayout
      title="Amortization Schedule 📅"
      description="Generate a complete amortization schedule with payment breakdown by principal and interest."
      icon={<span>📅</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} subtext={`${formatPercentage(interestPct / 100)} of total payments`} />
          <ResultCard label="Total Payments" value={formatCurrency(totalPaid)} subtext={`Over ${formatNumber(termMonths)} months`} />
          <ResultCard label="Interest vs Principal" value={formatPercentage(interestPct / 100)} subtext={`Interest portion of total payments`} />
          {safeRate === 0 && <ResultCard label="Note" value="0% APR — no interest applies" subtext="Payments are principal only" />}
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Principal", "Interest"]} title="Principal vs Interest Over Time" />
      <CalculatorInput input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "The total amount you plan to borrow." }} value={loanAmount} onChange={setLoanAmount} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual interest rate on the loan." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} />
    </CalculatorLayout>
  );
}
