"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function SavingsGoalCalculator() {
  const [target, setTarget] = React.useState(50000);
  const [currentSavings, setCurrentSavings] = React.useState(10000);
  const [monthlyContrib, setMonthlyContrib] = React.useState(500);
  const [expectedReturn, setExpectedReturn] = React.useState(5);

  const safeTarget = Math.max(0, isFinite(target) ? target : 0);
  const safeCurrent = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);
  const safeMonthly = Math.max(0, isFinite(monthlyContrib) ? monthlyContrib : 0);
  const safeReturn = Math.max(0, isFinite(expectedReturn) ? expectedReturn : 0);

  const r = safeReturn / 100 / 12;
  const remaining = safeTarget - safeCurrent;

  let months = 0;
  if (remaining <= 0) {
    months = 0;
  } else if (r === 0 && safeMonthly > 0) {
    months = Math.ceil(remaining / safeMonthly);
  } else if (r > 0 && safeMonthly > 0) {
    const dividend = 1 + (remaining * r) / safeMonthly;
    months = dividend > 0 ? Math.ceil(Math.log(dividend) / Math.log(1 + r)) : Infinity;
  } else {
    months = Infinity;
  }

  const safeMonths = isFinite(months) ? months : 0;
  const totalNeeded = safeCurrent + safeMonthly * safeMonths;
  const totalContributions = safeMonthly * safeMonths;

  // Monthly savings needed for different timeframes
  const monthlyFor3Yrs = remaining > 0 && r > 0
    ? (remaining * r) / (Math.pow(1 + r, 36) - 1) * Math.pow(1 + r, 36)
    : remaining > 0 ? remaining / 36 : 0;
  const monthlyFor5Yrs = remaining > 0 && r > 0
    ? (remaining * r) / (Math.pow(1 + r, 60) - 1) * Math.pow(1 + r, 60)
    : remaining > 0 ? remaining / 60 : 0;
  const monthlyFor10Yrs = remaining > 0 && r > 0
    ? (remaining * r) / (Math.pow(1 + r, 120) - 1) * Math.pow(1 + r, 120)
    : remaining > 0 ? remaining / 120 : 0;

  const chartMonths = isFinite(months) ? Math.min(months, 120) : 0;
  const chartStep = chartMonths > 36 ? Math.ceil(chartMonths / 36) : 1;
  const chartData = Array.from({ length: Math.min(Math.floor(chartMonths / chartStep) + 1, 37) }, (_, idx) => {
    const i = idx * chartStep;
    let fv = safeCurrent;
    for (let j = 0; j < i; j++) {
      fv = fv * (1 + r) + safeMonthly;
    }
    return {
      month: `Mo ${i}`,
      "Savings Progress": isFinite(fv) ? Math.round(fv) : 0,
      "Target": Math.round(safeTarget),
    };
  });

  return (
    <CalculatorLayout
      title="Savings Goal"
      description="Plan your savings goals with monthly contributions and time-to-target projections."
      icon={<span>🐷</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Time to Goal" value={isFinite(months) ? `${months} months (${(months / 12).toFixed(1)} yrs)` : "Not achievable"} highlight />
          <ResultCard label="Total Needed" value={formatCurrency(totalNeeded)} />
          <ResultCard label="Total Contributions" value={formatCurrency(totalContributions)} subtext={`${formatCurrency(safeMonthly)}/mo`} />
          <ResultCard label="Monthly for 3 Years" value={formatCurrency(monthlyFor3Yrs)} subtext="Required to reach goal in 3 yrs" />
          <ResultCard label="Monthly for 5 Years" value={formatCurrency(monthlyFor5Yrs)} subtext="Required to reach goal in 5 yrs" />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Savings Progress", "Target"]} title="Progress to Goal" />
      <CalculatorInput input={{ id: "target", label: "Target Amount", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "The total savings amount you want to reach." }} value={target} onChange={setTarget} />
      <CalculatorInput input={{ id: "currentSavings", label: "Current Savings", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "Amount you have already saved toward this goal." }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "monthlyContrib", label: "Monthly Contribution", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "How much you can save each month." }} value={monthlyContrib} onChange={setMonthlyContrib} />
      <CalculatorInput input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected annual return on your savings/investments." }} value={expectedReturn} onChange={setExpectedReturn} />
    </CalculatorLayout>
  );
}
