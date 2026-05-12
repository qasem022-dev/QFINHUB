"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput } from "@/components/calculators/period-input";

export default function DebtPayoffCalculator() {
  const [totalDebt, setTotalDebt] = React.useState(15000);
  const [rate, setRate] = React.useState(18);
  const [monthlyPayment, setMonthlyPayment] = React.useState(500);
  const [extraPayment, setExtraPayment] = React.useState(0);

  const safeDebt = Math.max(0, totalDebt ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeMonthly = Math.max(0, monthlyPayment ?? 0);
  const safeExtra = Math.max(0, extraPayment ?? 0);

  const mr = safeRate / 100 / 12;
  const totalMonthly = safeMonthly + safeExtra;

  const chartData: { month: string; "With Extra Payment": number; "Without Extra": number }[] = [
    { month: "Start", "With Extra Payment": Math.round(safeDebt), "Without Extra": Math.round(safeDebt) },
  ];

  // With extra payment
  let balanceExtra = safeDebt;
  let monthsExtra = 0;
  let totalInterestExtra = 0;
  while (balanceExtra > 0 && monthsExtra < 600) {
    const interest = balanceExtra * mr;
    const principalPmt = Math.min(totalMonthly - interest, balanceExtra);
    if (principalPmt <= 0) break;
    totalInterestExtra += interest;
    balanceExtra -= principalPmt;
    monthsExtra++;
    if (monthsExtra % 6 === 0 || balanceExtra <= 0) {
      chartData.push({
        month: `Mo ${monthsExtra}`,
        "With Extra Payment": Math.round(Math.max(0, balanceExtra)),
        "Without Extra": 0,
      });
    }
  }

  // Without extra payment
  let balanceNoExtra = safeDebt;
  let monthsNoExtra = 0;
  let totalInterestNoExtra = 0;
  while (balanceNoExtra > 0 && monthsNoExtra < 600) {
    const interest = balanceNoExtra * mr;
    const principalPmt = Math.min(safeMonthly - interest, balanceNoExtra);
    if (principalPmt <= 0) break;
    totalInterestNoExtra += interest;
    balanceNoExtra -= principalPmt;
    monthsNoExtra++;
    if (monthsNoExtra % 6 === 0 || balanceNoExtra <= 0) {
      const idx = chartData.findIndex(d => d.month === `Mo ${monthsNoExtra}`);
      if (idx >= 0) {
        chartData[idx]!["Without Extra"] = Math.round(Math.max(0, balanceNoExtra));
      } else {
        chartData.push({
          month: `Mo ${monthsNoExtra}`,
          "With Extra Payment": 0,
          "Without Extra": Math.round(Math.max(0, balanceNoExtra)),
        });
      }
    }
  }

  const savings = Math.max(0, totalInterestNoExtra - totalInterestExtra);
  const unpaidMsg = monthsExtra >= 600 ? true : false;

  return (
    <CalculatorLayout
      title="Debt Payoff Calculator 💪"
      description="Calculate how long it will take to pay off debt with various monthly payment strategies."
      icon={<span>💪</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Months to Payoff" value={`${formatNumber(monthsExtra)} months (${(monthsExtra / 12).toFixed(1)} yrs)`} highlight />
          <ResultCard label="Total Interest Paid" value={formatCurrency(totalInterestExtra)} />
          <ResultCard label="Interest Saved" value={formatCurrency(savings)} subtext={`vs. ${formatCurrency(safeMonthly)}/mo minimum`} />
          <ResultCard label="Standard Payoff" value={`${formatNumber(monthsNoExtra)} months (${(monthsNoExtra / 12).toFixed(1)} yrs)`} subtext={`At ${formatCurrency(safeMonthly)}/mo`} />
          <ResultCard label="Extra Payment Added" value={formatCurrency(safeExtra)} subtext="Per month" />
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate" subtext="No interest accrues" />}
          {unpaidMsg && <ResultCard label="⚠️ Warning" value="Payment may be too low" subtext="Increase monthly payment" />}
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="month" yKey={["With Extra Payment", "Without Extra"]} title="Debt Balance Over Time" />
      <CalculatorInput input={{ id: "totalDebt", label: "Total Debt", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "Your total outstanding debt balance." }} value={totalDebt} onChange={setTotalDebt} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 18, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Weighted average interest rate on your debts." }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "monthlyPayment", label: "Monthly Payment", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Your base monthly payment amount." }} value={monthlyPayment} onChange={setMonthlyPayment} />
      <CalculatorInput input={{ id: "extraPayment", label: "Extra Monthly Payment", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Additional amount you can pay each month." }} value={extraPayment} onChange={setExtraPayment} />
    </CalculatorLayout>
  );
}
