"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput, toPeriods } from "..";
import { formatCurrency } from "@/lib/utils";

export default function SalaryCalculator() {
  const [payValue, setPayValue] = React.useState(75000);
  const [payUnit, setPayUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safePay = isFinite(payValue) ? Math.max(0, payValue) : 0;

  // Convert input to annual salary
  let annualSalary = 0;
  if (payUnit === "years") {
    annualSalary = safePay;
  } else if (payUnit === "months") {
    annualSalary = safePay * 12;
  } else if (payUnit === "weeks") {
    annualSalary = safePay * 52;
  } else if (payUnit === "days") {
    annualSalary = safePay * 260; // ~260 working days per year
  }

  const hourly = annualSalary / 2080;
  const weekly = annualSalary / 52;
  const biweekly = annualSalary / 26;
  const monthly = annualSalary / 12;

  const chartData = [
    { name: "Hourly", value: hourly },
    { name: "Weekly", value: weekly },
    { name: "Biweekly", value: biweekly },
    { name: "Monthly", value: monthly },
  ];

  const payUnitLabel = payUnit === "years" ? "Annual" : payUnit === "months" ? "Monthly" : payUnit === "weeks" ? "Weekly" : "Daily";

  return (
    <CalculatorLayout
      title="Salary Calculator"
      description="Convert your annual salary to hourly, weekly, bi-weekly, and monthly pay rates."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Salary" value={formatCurrency(annualSalary)} highlight />
          <ResultCard label="Hourly (2,080 hrs)" value={formatCurrency(hourly)} />
          <ResultCard label="Weekly (52 weeks)" value={formatCurrency(weekly)} />
          <ResultCard label="Biweekly (26 periods)" value={formatCurrency(biweekly)} />
          <ResultCard label="Monthly (12 months)" value={formatCurrency(monthly)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Pay Breakdown" height={250} />
      <PeriodInput id="payAmount" label={`${payUnitLabel} Pay`} value={payValue} unit={payUnit} onValueChange={setPayValue} onUnitChange={setPayUnit} min={0} max={99999999} />
    </CalculatorLayout>
  );
}
