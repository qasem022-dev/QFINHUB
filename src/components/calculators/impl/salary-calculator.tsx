"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function SalaryCalculator() {
  const [annualSalary, setAnnualSalary] = React.useState(75000);

  const safeSalary = isFinite(annualSalary) ? Math.max(0, annualSalary) : 0;

  const hourly = safeSalary / 2080;
  const weekly = safeSalary / 52;
  const biweekly = safeSalary / 26;
  const monthly = safeSalary / 12;

  const chartData = [
    { name: "Hourly", value: hourly },
    { name: "Weekly", value: weekly },
    { name: "Biweekly", value: biweekly },
    { name: "Monthly", value: monthly },
  ];

  return (
    <CalculatorLayout
      title="Salary Calculator"
      description="Convert your annual salary to hourly, weekly, bi-weekly, and monthly pay rates."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Salary" value={formatCurrency(safeSalary)} highlight />
          <ResultCard label="Hourly (2,080 hrs)" value={formatCurrency(hourly)} />
          <ResultCard label="Weekly (52 weeks)" value={formatCurrency(weekly)} />
          <ResultCard label="Biweekly (26 periods)" value={formatCurrency(biweekly)} />
          <ResultCard label="Monthly (12 months)" value={formatCurrency(monthly)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Pay Breakdown" height={250} />
      <CalculatorInput
        input={{ id: "annualSalary", label: "Annual Salary", type: "number", defaultValue: 75000, suffix: "$", min: 0, tooltip: "Your total annual salary before taxes and deductions." }}
        value={annualSalary}
        onChange={setAnnualSalary}
      />
    </CalculatorLayout>
  );
}
