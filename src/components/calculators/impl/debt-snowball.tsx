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

export default function DebtSnowballCalculator() {
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

  // Snowball method: order by smallest balance first
  const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance);

  // Calculate payoff using snowball
  let snowBalances = snowballOrder.map(d => d.balance);
  const snowRates = snowballOrder.map(d => d.rate);
  const snowMins = snowballOrder.map(d => d.minPayment);
  let snowMonths = 0;
  let snowInterest = 0;
  const snowNames = snowballOrder.map(d => d.name);

  while (snowBalances.some(b => b > 0) && snowMonths < maxPeriods) {
    snowMonths++;
    let available = totalMinPayment + safeExtra;
    for (let i = 0; i < snowBalances.length; i++) {
      if (snowBalances[i]! <= 0) continue;
      const mr = snowRates[i]! / 100 / 12;
      const interest = snowBalances[i]! * mr;
      snowInterest += interest;
      const minPmt = Math.min(snowMins[i]!, snowBalances[i]! + interest);
      const pmt = i === 0 ? Math.min(available, snowBalances[i]! + interest) : Math.min(minPmt, snowBalances[i]! + interest);
      if (pmt - interest <= 0) { snowMonths = maxPeriods; break; }
      snowBalances[i] = snowBalances[i]! - (pmt - interest);
      if (snowBalances[i]! < 0) snowBalances[i] = 0;
      available -= pmt;
      if (available <= 0) break;
    }
  }

  const isUnpaid = snowMonths >= maxPeriods;

  const chartData = snowballOrder.map((d, i) => ({
    name: d.name,
    "Balance": Math.round(d.balance),
  }));

  return (
    <CalculatorLayout
      title="Debt Snowball Method ❄️"
      description="Pay off debts from smallest to largest balance using the snowball method for momentum."
      icon={<span>❄️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Interest" value={formatCurrency(snowInterest)} />
          <ResultCard label="Total Months to Payoff" value={`${formatNumber(snowMonths)} mo (${(snowMonths / 12).toFixed(1)} yrs)`} highlight />
          <ResultCard label="Payoff Order" value={snowNames.join(" → ")} subtext="Smallest balance first" />
          <ResultCard label="Total Debt" value={formatCurrency(debts.reduce((s, d) => s + d.balance, 0))} />
          {isUnpaid && <ResultCard label="⚠️ Warning" value="May not fully pay off" subtext="Increase monthly payment" />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="Balance" title="Debt Balances (Smallest First)" />
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
