"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function SideHustleCalculator() {
  const [revenue, setRevenue] = React.useState(2000);
  const [expenses, setExpenses] = React.useState(300);
  const [hoursPerWeek, setHoursPerWeek] = React.useState(10);
  const [weeksPerYear, setWeeksPerYear] = React.useState(48);
  const [seTaxRate, setSeTaxRate] = React.useState(15.3);

  const safeRevenue = isFinite(revenue) ? revenue : 0;
  const safeExpenses = isFinite(expenses) ? expenses : 0;
  const safeHours = isFinite(hoursPerWeek) ? hoursPerWeek : 0;
  const safeWeeks = isFinite(weeksPerYear) ? weeksPerYear : 0;
  const safeSeTax = isFinite(seTaxRate) ? seTaxRate : 0;

  const annualGross = safeRevenue * 12;
  const annualExpenses = safeExpenses * 12;
  const net = annualGross - annualExpenses;
  const seTaxBase = net * 0.9235;
  const seTax = seTaxBase * (safeSeTax / 100);
  const totalHours = safeHours * safeWeeks;
  const effectiveHourly = totalHours > 0 ? (net - seTax) / totalHours : 0;

  const pieData = [
    { name: "Net Income (After SE Tax)", value: Math.max(0, net - seTax) },
    { name: "SE Tax", value: seTax },
    { name: "Business Expenses", value: annualExpenses },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Side Hustle Calculator"
      description="Calculate the true profitability of your side hustle including self-employment tax."
      icon={<span>💼</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Gross Revenue" value={formatCurrency(annualGross)} />
          <ResultCard label="Annual Expenses" value={formatCurrency(annualExpenses)} />
          <ResultCard label="Net Income" value={formatCurrency(net)} highlight />
          <ResultCard label="SE Tax" value={formatCurrency(seTax)} />
          <ResultCard label="Effective Hourly Rate" value={formatCurrency(effectiveHourly)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey={["value"]} title="Income Breakdown" />
      <CalculatorInput input={{ id: "revenue", label: "Monthly Revenue", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Average monthly revenue from your side hustle." }} value={revenue} onChange={setRevenue} />
      <CalculatorInput input={{ id: "expenses", label: "Monthly Expenses", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Average monthly business expenses." }} value={expenses} onChange={setExpenses} />
      <CalculatorInput input={{ id: "hours-per-week", label: "Hours Per Week", type: "number", defaultValue: 10, suffix: "hrs", min: 1, max: 168, tooltip: "Average hours per week spent on your side hustle." }} value={hoursPerWeek} onChange={setHoursPerWeek} />
      <CalculatorInput input={{ id: "weeks-per-year", label: "Weeks Per Year", type: "number", defaultValue: 48, suffix: "wks", min: 1, max: 52, tooltip: "Number of weeks per year you work on your side hustle." }} value={weeksPerYear} onChange={setWeeksPerYear} />
      <CalculatorInput input={{ id: "se-tax-rate", label: "SE Tax Rate", type: "number", defaultValue: 15.3, suffix: "%", min: 0, max: 50, step: 0.1, tooltip: "Self-employment tax rate (15.3% for Social Security + Medicare)." }} value={seTaxRate} onChange={setSeTaxRate} />
    </CalculatorLayout>
  );
}
