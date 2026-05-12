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

export default function AutoLoanCalculator() {
  const [carPrice, setCarPrice] = React.useState(35000);
  const [downPayment, setDownPayment] = React.useState(5000);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(5);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [tradeInValue, setTradeInValue] = React.useState(0);

  const safePrice = Math.max(0, carPrice ?? 0);
  const safeDown = Math.max(0, downPayment ?? 0);
  const safeTradeIn = Math.max(0, tradeInValue ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const loanAmount = Math.max(0, safePrice - safeDown - safeTradeIn);
  const termMonths = Math.max(1, toMonths(term, termUnit));
  const monthlyPayment = loanAmount > 0 && isFinite(calcMonthlyPayment(loanAmount, safeRate, termMonths)) ? calcMonthlyPayment(loanAmount, safeRate, termMonths) : 0;
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - loanAmount;
  const totalCost = loanAmount > 0 ? loanAmount + totalInterest : safePrice;

  // Build amortization chart data (max 36 points)
  const chartStep = Math.max(1, Math.floor(termMonths / 36));
  const chartData: { month: string; Principal: number; Interest: number; Balance: number }[] = [];
  let balance = loanAmount;
  const mr = safeRate / 100 / 12;
  for (let i = 0; i <= termMonths; i++) {
    if (i === 0) {
      chartData.push({ month: "Start", Principal: 0, Interest: 0, Balance: Math.round(loanAmount) });
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
      title="Auto Loan Calculator 🚗"
      description="Calculate monthly payments, total interest, and total cost for car loans with various terms."
      icon={<span>🚗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Loan Amount" value={formatCurrency(loanAmount)} subtext={`After down + trade-in`} />
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(totalCost)} subtext={`Over ${formatNumber(termMonths)} months`} />
          {safeRate === 0 && <ResultCard label="Note" value="0% APR financing" subtext="No interest — pay only principal" />}
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Principal", "Interest"]} title="Principal vs Interest Amortization" />
      <CalculatorInput input={{ id: "carPrice", label: "Car Price", type: "number", defaultValue: 35000, suffix: "$", min: 0, tooltip: "The purchase price of the vehicle." }} value={carPrice} onChange={setCarPrice} />
      <CalculatorInput input={{ id: "downPayment", label: "Down Payment", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Cash you pay upfront toward the car." }} value={downPayment} onChange={setDownPayment} />
      <CalculatorInput input={{ id: "tradeInValue", label: "Trade-In Value", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Value of your current car being traded in." }} value={tradeInValue} onChange={setTradeInValue} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Annual percentage rate on the auto loan." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={8} />
    </CalculatorLayout>
  );
}
