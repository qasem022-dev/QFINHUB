"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

const MAX_ITERATIONS = 600;

export default function CreditCardPayoffCalculator() {
  const [balance, setBalance] = React.useState(5000);
  const [apr, setApr] = React.useState(22);
  const [minPercent, setMinPercent] = React.useState(2);
  const [extraPayment, setExtraPayment] = React.useState(100);

  const safeBalance = isFinite(balance) && balance >= 0 ? balance : 0;
  const safeApr = isFinite(apr) ? apr : 0;
  const safeMinPercent = isFinite(minPercent) ? minPercent : 2;
  const safeExtra = isFinite(extraPayment) ? extraPayment : 0;

  const monthlyRate = safeApr / 100 / 12;

  const simulate = (extra: number) => {
    let bal = safeBalance;
    let totalInterest = 0;
    let months = 0;
    const path: { month: number; balance: number }[] = [{ month: 0, balance: bal }];

    while (bal > 0 && months < MAX_ITERATIONS) {
      const interest = bal * monthlyRate;
      totalInterest += interest;
      const minPayment = Math.max(bal * (safeMinPercent / 100), 25);
      const payment = minPayment + extra;

      // If payment doesn't cover interest, debt is growing — break early
      if (payment <= interest && months > 0) {
        months = MAX_ITERATIONS;
        break;
      }

      const principalPaid = Math.min(payment - interest, bal);
      bal = Math.max(0, bal - principalPaid);
      months++;
      if (months % 6 === 0 || bal === 0) {
        path.push({ month: months, balance: Math.round(bal) });
      }
    }
    return { months, totalInterest, path };
  };

  const minOnly = simulate(0);
  const withExtra = simulate(safeExtra);

  const savings = Math.max(0, minOnly.totalInterest - withExtra.totalInterest);

  // Merge paths for chart — use all unique months from both paths
  const allMonths = new Set([
    ...minOnly.path.map(p => p.month),
    ...withExtra.path.map(p => p.month),
  ]);
  const fullChartData = Array.from(allMonths).sort((a, b) => a - b).map(m => {
    const minP = minOnly.path.find(p => p.month === m);
    const extraP = withExtra.path.find(p => p.month === m);
    return {
      month: m === 0 ? "Start" : m >= MAX_ITERATIONS ? "Paid Off" : `Month ${m}`,
      "Minimum Only": minP?.balance ?? 0,
      "With Extra": extraP?.balance ?? 0,
    };
  });

  const minLabel = minOnly.months >= MAX_ITERATIONS
    ? `${formatNumber(MAX_ITERATIONS)}+ mo (may not pay off)`
    : `${formatNumber(minOnly.months)} mo`;
  const extraLabel = withExtra.months >= MAX_ITERATIONS
    ? `${formatNumber(MAX_ITERATIONS)}+ mo (may not pay off)`
    : `${formatNumber(withExtra.months)} mo`;

  return (
    <CalculatorLayout
      title="Credit Card Payoff 💳"
      description="Compare paying only the minimum vs adding extra payments to see how much interest you save."
      icon={<span>💳</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Months (Min Only)" value={minLabel} />
          <ResultCard label="Months (With Extra)" value={extraLabel} highlight />
          <ResultCard label="Total Interest (Min Only)" value={formatCurrency(minOnly.totalInterest)} />
          <ResultCard label="Total Interest (With Extra)" value={formatCurrency(withExtra.totalInterest)} />
          <ResultCard label="Interest Saved" value={formatCurrency(savings)} highlight subtext={savings > 0 ? `${formatCurrency(withExtra.totalInterest)} vs ${formatCurrency(minOnly.totalInterest)}` : "No savings with extra payment"} />
        </div>
      }
    >
      <CalculatorChart type="line" data={fullChartData} xKey="month" yKey={["Minimum Only", "With Extra"]} title="Balance Over Time" />
      <CalculatorInput input={{ id: "balance", label: "Current Balance", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Your current credit card balance." }} value={balance} onChange={setBalance} />
      <CalculatorInput input={{ id: "apr", label: "APR", type: "number", defaultValue: 22, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Your credit card's annual percentage rate." }} value={apr} onChange={setApr} />
      <CalculatorInput input={{ id: "min-percent", label: "Minimum Payment %", type: "number", defaultValue: 2, suffix: "%", min: 1, max: 100, step: 0.5, tooltip: "Minimum payment as a percentage of the balance." }} value={minPercent} onChange={setMinPercent} />
      <CalculatorInput input={{ id: "extra-payment", label: "Additional Payment", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "Extra amount you can pay each month beyond the minimum." }} value={extraPayment} onChange={setExtraPayment} />
    </CalculatorLayout>
  );
}
