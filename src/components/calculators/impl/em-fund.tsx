"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function EmergencyFundCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = React.useState(5000);
  const [timeValue, setTimeValue] = React.useState(6);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("months");
  const [currentSavings, setCurrentSavings] = React.useState(5000);
  const [jobStability, setJobStability] = React.useState(2); // 1=Low, 2=Medium, 3=High

  const safeExpenses = Math.max(0, isFinite(monthlyExpenses) ? monthlyExpenses : 0);
  const safeMonthsCover = toMonths(timeValue, timeUnit);
  const safeSavings = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);

  const target = safeExpenses * safeMonthsCover;
  const shortfall = Math.max(0, target - safeSavings);
  const monthsOfCoverage = safeExpenses > 0 ? safeSavings / safeExpenses : 0;

  // Recommended months based on job stability
  const recommendedMonths: Record<number, number> = { 1: 9, 2: 6, 3: 3 };
  const stabilityMonths = recommendedMonths[jobStability] ?? 6;
  const stabilityRecommended = safeExpenses * stabilityMonths;
  const stabilityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };

  const barData = [
    { name: "Target Fund", value: Math.round(target) },
    { name: "Current Savings", value: Math.round(safeSavings) },
  ];

  return (
    <CalculatorLayout
      title="Emergency Fund"
      description="Calculate how much you need in your emergency fund based on your monthly expenses and job stability."
      icon={<span>🐷</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Recommended Fund" value={formatCurrency(target)} highlight />
          <ResultCard label="Current Savings" value={formatCurrency(safeSavings)} />
          <ResultCard label="Shortfall" value={formatCurrency(shortfall)} />
          <ResultCard label="Months of Coverage" value={formatNumber(monthsOfCoverage, 1)} />
          <ResultCard label="Job Stability" value={stabilityLabels[jobStability] ?? "Medium"} subtext={`Recommends ${stabilityMonths} months coverage`} />
          <ResultCard label="Stability-Based Target" value={formatCurrency(stabilityRecommended)} highlight subtext={`${stabilityMonths} months for ${stabilityLabels[jobStability] ?? "Medium"} stability`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={barData} xKey="name" yKey="value" title="Target vs Current" />
      <CalculatorInput input={{ id: "monthly-expenses", label: "Monthly Expenses", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Your essential monthly expenses (housing, food, utilities, etc.)." }} value={monthlyExpenses} onChange={setMonthlyExpenses} />
      <PeriodInput
        id="months-to-cover"
        label="Months to Cover"
        value={timeValue}
        unit={timeUnit}
        onValueChange={setTimeValue}
        onUnitChange={setTimeUnit}
        min={1}
        max={60}
      />
      <CalculatorInput input={{ id: "current-savings", label: "Current Savings", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "How much you currently have saved for emergencies." }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "job-stability", label: "Job Stability", type: "select", defaultValue: 2, options: [{ label: "Low", value: 1 }, { label: "Medium", value: 2 }, { label: "High", value: 3 }], tooltip: "Job stability affects how many months of expenses you should save." }} value={jobStability} onChange={setJobStability} />
    </CalculatorLayout>
  );
}
