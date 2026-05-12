"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput } from "..";
import type { PeriodUnit } from "..";
import { toPeriods } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface DebtInfo {
  name: string;
  balance: number;
  minPayment: number;
  rate: number;
}

export default function DebtAvalancheCalculator() {
  const [debt1, setDebt1] = React.useState<DebtInfo>({ name: "Credit Card", balance: 2500, minPayment: 75, rate: 18 });
  const [debt2, setDebt2] = React.useState<DebtInfo>({ name: "Personal Loan", balance: 5000, minPayment: 150, rate: 12 });
  const [debt3, setDebt3] = React.useState<DebtInfo>({ name: "Car Loan", balance: 8000, minPayment: 250, rate: 6 });
  const [extraPayment, setExtraPayment] = React.useState(100);
  const [maxPayoffTime, setMaxPayoffTime] = React.useState(50);
  const [maxPayoffUnit, setMaxPayoffUnit] = React.useState<PeriodUnit>("years");

  const debts = [debt1, debt2, debt3].map(d => ({
    name: d.name,
    balance: Math.max(0, d.balance ?? 0),
    minPayment: Math.max(0, d.minPayment ?? 0),
    rate: Math.max(0, Math.min(d.rate ?? 0, 100)),
  }));
  const safeExtra = Math.max(0, extraPayment ?? 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
  const maxPeriods = Math.max(1, toPeriods(maxPayoffTime, maxPayoffUnit));

  // Snowball: smallest balance first
  const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance);
  // Avalanche: highest rate first
  const avalancheOrder = [...debts].sort((a, b) => b.rate - a.rate);

  function simulatePayoff(order: DebtInfo[]): { months: number; interest: number; names: string[] } {
    let balances = order.map(d => d.balance);
    const rates = order.map(d => d.rate);
    const mins = order.map(d => d.minPayment);
    let months = 0;
    let interest = 0;
    const names = order.map(d => d.name);

    while (balances.some(b => b > 0) && months < maxPeriods) {
      months++;
      let available = totalMinPayment + safeExtra;
      for (let i = 0; i < balances.length; i++) {
        if (balances[i]! <= 0) continue;
        const mr = rates[i]! / 100 / 12;
        const intPmt = balances[i]! * mr;
        interest += intPmt;
        const minPmt = Math.min(mins[i]!, balances[i]! + intPmt);
        const pmt = i === 0 ? Math.min(available, balances[i]! + intPmt) : Math.min(minPmt, balances[i]! + intPmt);
        if (pmt - intPmt <= 0) { months = maxPeriods; break; }
        balances[i] = balances[i]! - (pmt - intPmt);
        if (balances[i]! < 0) balances[i] = 0;
        available -= pmt;
        if (available <= 0) break;
      }
    }
    return { months, interest, names };
  }

  const snowResult = simulatePayoff(snowballOrder);
  const avaResult = simulatePayoff(avalancheOrder);

  const interestSaved = snowResult.interest - avaResult.interest;

  const chartData = [
    { name: "Snowball", "Total Interest": Math.round(snowResult.interest) },
    { name: "Avalanche", "Total Interest": Math.round(avaResult.interest) },
  ];

  return (
    <CalculatorLayout
      title="Debt Avalanche Method ⛰️"
      description="Pay off debts from highest to lowest interest rate using the avalanche method to save on interest."
      icon={<span>⛰️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Avalanche - Total Interest" value={formatCurrency(avaResult.interest)} />
          <ResultCard label="Avalanche - Payoff Time" value={`${formatNumber(avaResult.months)} mo (${(avaResult.months / 12).toFixed(1)} yrs)`} highlight />
          <ResultCard label="Avalanche Order" value={avaResult.names.join(" → ")} subtext="Highest rate first" />
          <ResultCard label="Snowball - Total Interest" value={formatCurrency(snowResult.interest)} />
          <ResultCard label="Interest Saved (vs Snowball)" value={formatCurrency(Math.max(0, interestSaved))} subtext={interestSaved > 0 ? "Avalanche saves more" : "Similar results"} />
          {avaResult.months >= maxPeriods && <ResultCard label="⚠️ Warning" value="May not fully pay off" subtext="Increase monthly payment" />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="Total Interest" title="Snowball vs Avalanche Interest Comparison" />
      <CalculatorInput input={{ id: "debt1Balance", label: "Debt 1 - Balance", type: "number", defaultValue: 2500, suffix: "$", min: 0, tooltip: "Current balance of the first debt." }} value={debt1.balance} onChange={(v) => setDebt1({ ...debt1, balance: v })} />
      <CalculatorInput input={{ id: "debt1Min", label: "Debt 1 - Min Payment", type: "number", defaultValue: 75, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the first debt." }} value={debt1.minPayment} onChange={(v) => setDebt1({ ...debt1, minPayment: v })} />
      <CalculatorInput input={{ id: "debt1Rate", label: "Debt 1 - Rate", type: "number", defaultValue: 18, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the first debt." }} value={debt1.rate} onChange={(v) => setDebt1({ ...debt1, rate: v })} />
      <CalculatorInput input={{ id: "debt2Balance", label: "Debt 2 - Balance", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Current balance of the second debt." }} value={debt2.balance} onChange={(v) => setDebt2({ ...debt2, balance: v })} />
      <CalculatorInput input={{ id: "debt2Min", label: "Debt 2 - Min Payment", type: "number", defaultValue: 150, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the second debt." }} value={debt2.minPayment} onChange={(v) => setDebt2({ ...debt2, minPayment: v })} />
      <CalculatorInput input={{ id: "debt2Rate", label: "Debt 2 - Rate", type: "number", defaultValue: 12, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the second debt." }} value={debt2.rate} onChange={(v) => setDebt2({ ...debt2, rate: v })} />
      <CalculatorInput input={{ id: "debt3Balance", label: "Debt 3 - Balance", type: "number", defaultValue: 8000, suffix: "$", min: 0, tooltip: "Current balance of the third debt." }} value={debt3.balance} onChange={(v) => setDebt3({ ...debt3, balance: v })} />
      <CalculatorInput input={{ id: "debt3Min", label: "Debt 3 - Min Payment", type: "number", defaultValue: 250, suffix: "$", min: 0, tooltip: "Minimum monthly payment for the third debt." }} value={debt3.minPayment} onChange={(v) => setDebt3({ ...debt3, minPayment: v })} />
      <CalculatorInput input={{ id: "debt3Rate", label: "Debt 3 - Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate for the third debt." }} value={debt3.rate} onChange={(v) => setDebt3({ ...debt3, rate: v })} />
      <CalculatorInput input={{ id: "extraPayment", label: "Extra Monthly Payment", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "Additional amount to put toward debt each month." }} value={extraPayment} onChange={setExtraPayment} />
      <PeriodInput id="maxPayoffTime" label="Maximum Time Horizon" value={maxPayoffTime} unit={maxPayoffUnit} onValueChange={setMaxPayoffTime} onUnitChange={setMaxPayoffUnit} min={1} max={100} />
    </CalculatorLayout>
  );
}
