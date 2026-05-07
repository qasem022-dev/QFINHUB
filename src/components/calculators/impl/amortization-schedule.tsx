"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const mr = annualRate / 100 / 12;
  return (principal * mr * Math.pow(1 + mr, termMonths)) / (Math.pow(1 + mr, termMonths) - 1);
}

export default function AmortizationScheduleCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(250000);
  const [rate, setRate] = React.useState(6);
  const [term, setTerm] = React.useState(30);

  const termMonths = term * 12;
  const monthlyPayment = calcMonthlyPayment(loanAmount, rate, termMonths);
  const mr = rate / 100 / 12;

  let balance = loanAmount;
  const chartData: { month: string; Principal: number; Interest: number; Balance: number }[] = [
    { month: "Start", Principal: 0, Interest: 0, Balance: Math.round(loanAmount) },
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

  const totalInterest = (monthlyPayment * termMonths) - loanAmount;

  return (
    <CalculatorLayout
      title="Amortization Schedule"
      description="Generate a complete amortization schedule with payment breakdown by principal and interest."
      icon={<span>📅</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} subtext={`Over ${term} years`} />
          <ResultCard label="Total Payments" value={formatCurrency(monthlyPayment * termMonths)} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Principal", "Interest"]} title="Principal vs Interest Over Time" />
      <CalculatorInput input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 250000, suffix: "$", min: 0 }} value={loanAmount} onChange={setLoanAmount} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "term", label: "Loan Term", type: "select", defaultValue: 30, options: [{ label: "15 years", value: 15 }, { label: "20 years", value: 20 }, { label: "30 years", value: 30 }] }} value={term} onChange={setTerm} />
    </CalculatorLayout>
  );
}
