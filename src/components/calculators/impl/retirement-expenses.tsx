"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

const EXPENSE_CATEGORIES = [
  { id: "housing", label: "Housing", defaultVal: 1500 },
  { id: "healthcare", label: "Healthcare", defaultVal: 500 },
  { id: "food", label: "Food", defaultVal: 600 },
  { id: "transport", label: "Transport", defaultVal: 400 },
  { id: "travel", label: "Travel/Entertainment", defaultVal: 300 },
  { id: "utilities", label: "Utilities", defaultVal: 200 },
  { id: "insurance", label: "Insurance", defaultVal: 300 },
  { id: "other", label: "Other", defaultVal: 200 },
];

export default function RetirementExpensesCalculator() {
  const [expenses, setExpenses] = React.useState<Record<string, number>>({
    housing: 1500,
    healthcare: 500,
    food: 600,
    transport: 400,
    travel: 300,
    utilities: 200,
    insurance: 300,
    other: 200,
  });
  const [inflationRate, setInflationRate] = React.useState(3);
  const [yearsOut, setYearsOut] = React.useState(20);
  const [yearsOutUnit, setYearsOutUnit] = React.useState<PeriodUnit>("years");

  const safeInflation = Math.max(0, isFinite(inflationRate) ? inflationRate : 0);

  const updateExpense = (id: string, val: number) => {
    setExpenses((prev) => ({ ...prev, [id]: Math.max(0, isFinite(val) ? val : 0) }));
  };

  const monthlyTotal = EXPENSE_CATEGORIES.reduce((sum, cat) => sum + Math.max(0, isFinite(expenses[cat.id] ?? 0) ? (expenses[cat.id] ?? 0) : 0), 0);
  const annualTotal = monthlyTotal * 12;
  const yearsOutInYears = toMonths(yearsOut, yearsOutUnit) / 12;
  const inflationAdjusted = annualTotal * Math.pow(1 + safeInflation / 100, yearsOutInYears);
  const monthlyAdjusted = isFinite(inflationAdjusted) ? inflationAdjusted / 12 : 0;

  // Healthcare cost projection
  const healthcareMonthly = Math.max(0, isFinite(expenses.healthcare ?? 0) ? (expenses.healthcare ?? 0) : 0);
  const healthcareAnnual = healthcareMonthly * 12;
  const healthcareInflated = healthcareAnnual * Math.pow(1 + safeInflation / 100, yearsOutInYears);

  const pieData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: Math.round(Math.max(0, isFinite(expenses[cat.id] ?? 0) ? (expenses[cat.id] ?? 0) : 0)),
  }));

  return (
    <CalculatorLayout
      title="Retirement Expenses"
      description="Estimate your monthly and annual retirement expenses with inflation-adjusted projections."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Monthly Expenses" value={formatCurrency(monthlyTotal)} highlight />
          <ResultCard label="Total Annual Expenses" value={formatCurrency(annualTotal)} />
          <ResultCard label="Inflation-Adjusted Annual Target" value={formatCurrency(inflationAdjusted)} highlight subtext={`In ${Math.round(yearsOutInYears)} years at ${safeInflation}% inflation`} />
          <ResultCard label="Inflation-Adjusted Monthly Need" value={formatCurrency(monthlyAdjusted)} />
          <ResultCard label="Healthcare Cost Projection" value={formatCurrency(healthcareInflated)} subtext={`Annual healthcare at retirement`} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Expense Breakdown" height={300} />
      {EXPENSE_CATEGORIES.map((cat) => (
        <CalculatorInput
          key={cat.id}
          input={{ id: cat.id, label: cat.label, type: "number", defaultValue: cat.defaultVal, suffix: "$", min: 0, step: 50, tooltip: `Your monthly ${cat.label.toLowerCase()} expenses in retirement.` }}
          value={expenses[cat.id] ?? cat.defaultVal}
          onChange={(v: number) => updateExpense(cat.id, v)}
        />
      ))}
      <CalculatorInput
        input={{ id: "inflationRate", label: "Inflation Rate", type: "number", defaultValue: 3, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Expected annual inflation rate to adjust expenses for future purchasing power." }}
        value={inflationRate}
        onChange={setInflationRate}
      />
      <PeriodInput
        id="yearsOut"
        label="Years Until Retirement"
        value={yearsOut}
        unit={yearsOutUnit}
        onValueChange={setYearsOut}
        onUnitChange={setYearsOutUnit}
        min={0}
        max={60}
      />
    </CalculatorLayout>
  );
}
