"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

interface DebtEntry {
  balance: number;
  rate: number;
  minPayment: number;
}

export default function DebtConsolidationCalculator() {
  const [debt1, setDebt1] = React.useState<DebtEntry>({ balance: 5000, rate: 18, minPayment: 150 });
  const [debt2, setDebt2] = React.useState<DebtEntry>({ balance: 8000, rate: 22, minPayment: 200 });
  const [debt3, setDebt3] = React.useState<DebtEntry>({ balance: 3000, rate: 15, minPayment: 100 });
  const [consolidatedRate, setConsolidatedRate] = React.useState(10);
  const [consolidatedTerm, setConsolidatedTerm] = React.useState(5);
  const [consolidatedTermUnit, setConsolidatedTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const debts = [debt1, debt2, debt3].map(d => ({
    balance: Math.max(0, d.balance ?? 0),
    rate: Math.max(0, Math.min(d.rate ?? 0, 100)),
    minPayment: Math.max(0, d.minPayment ?? 0),
  }));
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
  const weightedAvgRate = totalDebt > 0
    ? debts.reduce((s, d) => s + d.balance * d.rate, 0) / totalDebt
    : 0;

  const safeConsRate = Math.max(0, Math.min(consolidatedRate ?? 0, 100));
  const consolidatedMonths = Math.max(1, toMonths(consolidatedTerm, consolidatedTermUnit));
  const consolidatedPayment = totalDebt > 0 && isFinite(calcMonthlyPayment(totalDebt, safeConsRate, consolidatedMonths))
    ? calcMonthlyPayment(totalDebt, safeConsRate, consolidatedMonths)
    : 0;

  // Calculate current payoff time and interest with minimum payments
  let currentMonths = 0;
  let currentInterest = 0;
  let balances = debts.map(d => d.balance);
  const minPayments = debts.map(d => d.minPayment);
  while (balances.some(b => b > 0) && currentMonths < 600) {
    currentMonths++;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i]! <= 0) continue;
      const mr = debts[i]!.rate / 100 / 12;
      const interest = balances[i]! * mr;
      currentInterest += interest;
      const principalPmt = Math.min(minPayments[i]! - interest, balances[i]!);
      if (principalPmt <= 0) continue;
      balances[i] = balances[i]! - principalPmt;
    }
  }

  // With consolidation
  let consMonths = 0;
  let consInterest = 0;
  let consBalance = totalDebt;
  const cmr = safeConsRate / 100 / 12;
  while (consBalance > 0 && consMonths < 600 && consMonths < consolidatedMonths) {
    consMonths++;
    const interest = consBalance * cmr;
    consInterest += interest;
    const principalPmt = Math.min(consolidatedPayment - interest, consBalance);
    if (principalPmt <= 0) break;
    consBalance -= principalPmt;
  }

  const interestSavings = currentInterest - consInterest;
  const monthsSaved = currentMonths - consMonths;

  const chartData = [
    { name: "Current Total", "Monthly Payment": Math.round(totalMinPayment) },
    { name: "Consolidated", "Monthly Payment": Math.round(consolidatedPayment) },
  ];

  return (
    <CalculatorLayout
      title="Debt Consolidation Calculator 🔗"
      description="Compare consolidation options and see how combining debts affects interest and payoff time."
      icon={<span>🔗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Debt" value={formatCurrency(totalDebt)} />
          <ResultCard label="Weighted Avg Rate" value={formatPercentage(weightedAvgRate / 100)} />
          <ResultCard label="Current Monthly Min" value={formatCurrency(totalMinPayment)} />
          <ResultCard label="Consolidated Payment" value={formatCurrency(consolidatedPayment)} highlight />
          <ResultCard label="Interest Savings" value={formatCurrency(Math.max(0, interestSavings))} subtext={interestSavings > 0 ? `Over ${formatNumber(consolidatedMonths)} months` : "No savings projected"} />
          {monthsSaved > 0 && <ResultCard label="Months Saved" value={`${formatNumber(monthsSaved)} months`} />}
          {safeConsRate === 0 && <ResultCard label="Note" value="0% consolidation rate" subtext="Principal only" />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="Monthly Payment" title="Monthly Payment Comparison" />
      <CalculatorInput input={{ id: "debt1Balance", label: "Debt 1 - Balance", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Balance for the first debt." }} value={debt1.balance} onChange={(v) => setDebt1({ ...debt1, balance: v })} />
      <CalculatorInput input={{ id: "debt1Rate", label: "Debt 1 - Rate", type: "number", defaultValue: 18, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the first debt." }} value={debt1.rate} onChange={(v) => setDebt1({ ...debt1, rate: v })} />
      <CalculatorInput input={{ id: "debt1Min", label: "Debt 1 - Min Payment", type: "number", defaultValue: 150, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the first debt." }} value={debt1.minPayment} onChange={(v) => setDebt1({ ...debt1, minPayment: v })} />
      <CalculatorInput input={{ id: "debt2Balance", label: "Debt 2 - Balance", type: "number", defaultValue: 8000, suffix: "$", min: 0, tooltip: "Balance for the second debt." }} value={debt2.balance} onChange={(v) => setDebt2({ ...debt2, balance: v })} />
      <CalculatorInput input={{ id: "debt2Rate", label: "Debt 2 - Rate", type: "number", defaultValue: 22, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the second debt." }} value={debt2.rate} onChange={(v) => setDebt2({ ...debt2, rate: v })} />
      <CalculatorInput input={{ id: "debt2Min", label: "Debt 2 - Min Payment", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the second debt." }} value={debt2.minPayment} onChange={(v) => setDebt2({ ...debt2, minPayment: v })} />
      <CalculatorInput input={{ id: "debt3Balance", label: "Debt 3 - Balance", type: "number", defaultValue: 3000, suffix: "$", min: 0, tooltip: "Balance for the third debt." }} value={debt3.balance} onChange={(v) => setDebt3({ ...debt3, balance: v })} />
      <CalculatorInput input={{ id: "debt3Rate", label: "Debt 3 - Rate", type: "number", defaultValue: 15, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the third debt." }} value={debt3.rate} onChange={(v) => setDebt3({ ...debt3, rate: v })} />
      <CalculatorInput input={{ id: "debt3Min", label: "Debt 3 - Min Payment", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the third debt." }} value={debt3.minPayment} onChange={(v) => setDebt3({ ...debt3, minPayment: v })} />
      <CalculatorInput input={{ id: "consolidatedRate", label: "Consolidated Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected interest rate on the consolidation loan." }} value={consolidatedRate} onChange={setConsolidatedRate} />
      <PeriodInput id="consolidatedTerm" label="Consolidated Loan Term" value={consolidatedTerm} unit={consolidatedTermUnit} onValueChange={setConsolidatedTerm} onUnitChange={setConsolidatedTermUnit} min={1} max={30} />
    </CalculatorLayout>
  );
}
