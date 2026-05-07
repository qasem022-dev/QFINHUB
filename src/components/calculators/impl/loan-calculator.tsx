"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const mr = annualRate / 100 / 12;
  return (principal * mr * Math.pow(1 + mr, termMonths)) / (Math.pow(1 + mr, termMonths) - 1);
}

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(25000);
  const [rate, setRate] = React.useState(6);
  const [term, setTerm] = React.useState(5);

  const termMonths = term * 12;
  const monthlyPayment = calcMonthlyPayment(loanAmount, rate, termMonths);
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - loanAmount;

  const chartData = Array.from({ length: termMonths + 1 }, (_, i) => {
    const balance = i === 0 ? loanAmount : 0;
    const paidSoFar = i * monthlyPayment;
    const remainingBalance = loanAmount - (paidSoFar - (totalInterest * (i / termMonths)));
    return {
      month: `Mo ${i}`,
      Balance: Math.round(Math.max(0, loanAmount - (monthlyPayment - (loanAmount * (rate / 100 / 12))) * 
        ((Math.pow(1 + rate / 100 / 12, i) - 1) / (rate / 100 / 12)) )),
    };
  });

  // Build accurate amortization for chart
  const accurateChartData: {month: string; Balance: number; "Principal Paid": number; "Interest Paid": number}[] = [];
  let balance = loanAmount;
  const mr = rate / 100 / 12;
  for (let i = 0; i <= termMonths; i++) {
    if (i === 0) {
      accurateChartData.push({ month: "Start", Balance: Math.round(loanAmount), "Principal Paid": 0, "Interest Paid": 0 });
    } else {
      const interest = balance * mr;
      const principalPmt = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPmt);
      accurateChartData.push({
        month: `Mo ${i}`,
        Balance: Math.round(balance),
        "Principal Paid": Math.round(principalPmt * i),
        "Interest Paid": Math.round((monthlyPayment * i) - (loanAmount - balance)),
      });
    }
  }

  return (
    <CalculatorLayout
      title="Loan Calculator"
      description="Calculate monthly payments, total interest, and amortization schedule for any loan."
      icon={<span>🏦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Payment" value={formatCurrency(totalPayment)} />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
        </div>
      }
    >
      <CalculatorChart type="area" data={accurateChartData.filter((_, i) => i % Math.max(1, Math.floor(termMonths / 24)) === 0 || i === 0 || i === termMonths)} xKey="month" yKey={["Principal Paid", "Interest Paid"]} title="Amortization Breakdown" />
      <CalculatorInput input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 25000, suffix: "$", min: 0 }} value={loanAmount} onChange={setLoanAmount} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 30, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "term", label: "Loan Term", type: "number", defaultValue: 5, suffix: "years", min: 1, max: 30 }} value={term} onChange={setTerm} />
    </CalculatorLayout>
  );
}
