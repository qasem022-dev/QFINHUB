"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function BudgetPlannerCalculator() {
  const [salary, setSalary] = React.useState(60000);
  const [rent, setRent] = React.useState(1500);
  const [utilities, setUtilities] = React.useState(200);
  const [food, setFood] = React.useState(600);
  const [transport, setTransport] = React.useState(400);
  const [insurance, setInsurance] = React.useState(300);
  const [entertainment, setEntertainment] = React.useState(200);
  const [savingsGoal, setSavingsGoal] = React.useState(500);

  const monthlyIncome = isFinite(salary) ? salary / 12 : 0;
  const totalExpenses = isFinite(rent + utilities + food + transport + insurance + entertainment)
    ? rent + utilities + food + transport + insurance + entertainment
    : 0;
  const surplus = isFinite(monthlyIncome - totalExpenses - savingsGoal)
    ? monthlyIncome - totalExpenses - savingsGoal
    : 0;
  const savingsRate = monthlyIncome > 0 ? ((savingsGoal / monthlyIncome) * 100) : 0;
  const expenseRatio = monthlyIncome > 0 && isFinite(totalExpenses / monthlyIncome)
    ? (totalExpenses / monthlyIncome) * 100
    : 0;

  const pieData = [
    { name: "Rent/Mortgage", value: rent },
    { name: "Utilities", value: utilities },
    { name: "Food", value: food },
    { name: "Transport", value: transport },
    { name: "Insurance", value: insurance },
    { name: "Entertainment", value: entertainment },
    { name: "Savings", value: savingsGoal },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Budget Planner"
      description="Create and analyze a personal budget with income, expenses, and savings goals."
      icon={<span>📒</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Income" value={formatCurrency(monthlyIncome)} />
          <ResultCard label="Total Expenses" value={formatCurrency(totalExpenses)} subtext={`${expenseRatio.toFixed(0)}% of income`} />
          <ResultCard label="Surplus / Deficit" value={formatCurrency(surplus)} highlight={surplus >= 0} />
          <ResultCard label="Savings Rate" value={formatPercentage(savingsRate)} subtext={`Target: ${formatCurrency(savingsGoal)}/mo`} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Expense Breakdown" />
      <CalculatorInput input={{ id: "salary", label: "Annual Salary (After Tax)", type: "number", defaultValue: 60000, suffix: "$", min: 0, tooltip: "Your annual take-home pay after taxes." }} value={salary} onChange={setSalary} />
      <CalculatorInput input={{ id: "rent", label: "Rent / Mortgage", type: "number", defaultValue: 1500, suffix: "$", min: 0, tooltip: "Monthly housing payment." }} value={rent} onChange={setRent} />
      <CalculatorInput input={{ id: "utilities", label: "Utilities", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Electricity, water, gas, internet, etc." }} value={utilities} onChange={setUtilities} />
      <CalculatorInput input={{ id: "food", label: "Food & Groceries", type: "number", defaultValue: 600, suffix: "$", min: 0, tooltip: "Groceries, dining out, and food delivery." }} value={food} onChange={setFood} />
      <CalculatorInput input={{ id: "transport", label: "Transportation", type: "number", defaultValue: 400, suffix: "$", min: 0, tooltip: "Car payment, gas, public transit, rideshares." }} value={transport} onChange={setTransport} />
      <CalculatorInput input={{ id: "insurance", label: "Insurance", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Health, auto, life, and other insurance premiums." }} value={insurance} onChange={setInsurance} />
      <CalculatorInput input={{ id: "entertainment", label: "Entertainment", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Streaming, hobbies, recreation, subscriptions." }} value={entertainment} onChange={setEntertainment} />
      <CalculatorInput input={{ id: "savingsGoal", label: "Monthly Savings Goal", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "How much you want to save each month." }} value={savingsGoal} onChange={setSavingsGoal} />
    </CalculatorLayout>
  );
}
