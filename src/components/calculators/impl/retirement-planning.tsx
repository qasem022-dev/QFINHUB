"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function RetirementPlanningCalculator() {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [retirementAge, setRetirementAge] = React.useState(65);
  const [currentSavings, setCurrentSavings] = React.useState(50000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(1000);
  const [expectedReturn, setExpectedReturn] = React.useState(7);
  const [currentIncome, setCurrentIncome] = React.useState(75000);

  const r = expectedReturn / 100;
  const yearsToRetire = retirementAge - currentAge;
  const n = 12;
  const t = yearsToRetire;

  const futureValue =
    currentSavings * Math.pow(1 + r / n, n * t) +
    monthlyContribution * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));

  const safeWithdrawalRate = 0.04;
  const retirementIncome = futureValue * safeWithdrawalRate;
  const incomeReplacement = currentIncome > 0 ? (retirementIncome / currentIncome) * 100 : 0;

  const chartData = Array.from({ length: t + 1 }, (_, i) => {
    const y = i;
    const fv =
      currentSavings * Math.pow(1 + r / n, n * y) +
      monthlyContribution * ((Math.pow(1 + r / n, n * y) - 1) / (r / n));
    const contrib = currentSavings + monthlyContribution * 12 * y;
    return {
      year: `Age ${currentAge + y}`,
      "Nest Egg": Math.round(fv),
      Contributions: Math.round(contrib),
    };
  });

  return (
    <CalculatorLayout
      title="Retirement Planning"
      description="Plan your retirement savings with projections, withdrawal strategies, and goal tracking."
      icon={<span>🏖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Nest Egg at Retirement" value={formatCurrency(futureValue)} highlight />
          <ResultCard label="Annual Retirement Income" value={formatCurrency(retirementIncome)} subtext="Based on 4% withdrawal rate" />
          <ResultCard label="Income Replacement Rate" value={`${incomeReplacement.toFixed(1)}%`} subtext={`of current $${currentIncome.toLocaleString()} income`} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["Nest Egg", "Contributions"]} title="Savings Growth" />
      <CalculatorInput input={{ id: "currentAge", label: "Current Age", type: "number", defaultValue: 30, suffix: "years", min: 18, max: 80 }} value={currentAge} onChange={setCurrentAge} />
      <CalculatorInput input={{ id: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, suffix: "years", min: 30, max: 90 }} value={retirementAge} onChange={setRetirementAge} />
      <CalculatorInput input={{ id: "currentSavings", label: "Current Savings", type: "number", defaultValue: 50000, suffix: "$", min: 0 }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "monthlyContribution", label: "Monthly Contribution", type: "number", defaultValue: 1000, suffix: "$", min: 0 }} value={monthlyContribution} onChange={setMonthlyContribution} />
      <CalculatorInput input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1 }} value={expectedReturn} onChange={setExpectedReturn} />
      <CalculatorInput input={{ id: "currentIncome", label: "Current Annual Income", type: "number", defaultValue: 75000, suffix: "$", min: 0 }} value={currentIncome} onChange={setCurrentIncome} />
    </CalculatorLayout>
  );
}
