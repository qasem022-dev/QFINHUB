"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function SavingsGoalCalculator() {
  const [target, setTarget] = React.useState(50000);
  const [currentSavings, setCurrentSavings] = React.useState(10000);
  const [monthlyContrib, setMonthlyContrib] = React.useState(500);
  const [expectedReturn, setExpectedReturn] = React.useState(5);

  const r = expectedReturn / 100 / 12;
  const remaining = target - currentSavings;

  let months = 0;
  if (remaining <= 0) {
    months = 0;
  } else if (r === 0) {
    months = monthlyContrib > 0 ? Math.ceil(remaining / monthlyContrib) : Infinity;
  } else {
    // Solve: remaining = monthlyContrib * ((1+r)^n - 1) / r
    // (1+r)^n = 1 + remaining * r / monthlyContrib
    months = Math.ceil(Math.log(1 + (remaining * r) / monthlyContrib) / Math.log(1 + r));
  }

  const totalNeeded = currentSavings + monthlyContrib * months;
  const totalContributions = monthlyContrib * months;

  const chartMonths = Math.min(months, 120);
  const chartData = Array.from({ length: Math.min(chartMonths + 1, 121) }, (_, i) => {
    let fv = currentSavings;
    for (let j = 0; j < i; j++) {
      fv = fv * (1 + r) + monthlyContrib;
    }
    return {
      month: `Mo ${i}`,
      "Savings Progress": Math.round(fv),
      "Target": Math.round(target),
    };
  });

  return (
    <CalculatorLayout
      title="Savings Goal"
      description="Plan your savings goals with monthly contributions and time-to-target projections."
      icon={<span>🎯</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Time to Goal" value={months > 0 ? `${months} months (${(months / 12).toFixed(1)} yrs)` : "Goal reached!"} highlight />
          <ResultCard label="Total Needed" value={formatCurrency(totalNeeded)} />
          <ResultCard label="Total Contributions" value={formatCurrency(totalContributions)} subtext={`${formatCurrency(monthlyContrib)}/mo`} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="month" yKey={["Savings Progress", "Target"]} title="Progress to Goal" />
      <CalculatorInput input={{ id: "target", label: "Target Amount", type: "number", defaultValue: 50000, suffix: "$", min: 0 }} value={target} onChange={setTarget} />
      <CalculatorInput input={{ id: "currentSavings", label: "Current Savings", type: "number", defaultValue: 10000, suffix: "$", min: 0 }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "monthlyContrib", label: "Monthly Contribution", type: "number", defaultValue: 500, suffix: "$", min: 0 }} value={monthlyContrib} onChange={setMonthlyContrib} />
      <CalculatorInput input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 30, step: 0.1 }} value={expectedReturn} onChange={setExpectedReturn} />
    </CalculatorLayout>
  );
}
