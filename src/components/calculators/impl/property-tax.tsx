"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function PropertyTaxCalculator() {
  const [homeValue, setHomeValue] = React.useState(400000);
  const [assessmentRatio, setAssessmentRatio] = React.useState(80);
  const [millRate, setMillRate] = React.useState(10);
  const [exemptions, setExemptions] = React.useState(25000);

  const safeValue = Math.max(0, isFinite(homeValue) ? homeValue : 0);
  const safeRatio = Math.max(0, Math.min(100, isFinite(assessmentRatio) ? assessmentRatio : 0));
  const safeMillRate = Math.max(0, isFinite(millRate) ? millRate : 0);
  const safeExemptions = Math.max(0, isFinite(exemptions) ? exemptions : 0);

  const grossAssessed = safeValue * (safeRatio / 100);
  const assessedValue = Math.max(0, grossAssessed - safeExemptions);
  const annualTax = assessedValue * (safeMillRate / 1000);
  const monthlyTax = annualTax / 12;
  const effectiveTaxRate = safeValue > 0 ? (annualTax / safeValue) * 100 : 0;

  const chartData = [
    { name: "Home Value", value: Math.round(safeValue) },
    { name: "Assessed Value", value: Math.round(assessedValue) },
    { name: "Annual Tax", value: Math.round(annualTax) },
  ];

  return (
    <CalculatorLayout
      title="Property Tax Calculator"
      description="Calculate property taxes based on home value, assessment ratio, mill rate, and exemptions."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Assessed Value" value={formatCurrency(assessedValue)} subtext={`${safeRatio}% assessment ratio${safeExemptions > 0 ? ` - $${safeExemptions.toLocaleString()} exemptions` : ""}`} />
          <ResultCard label="Annual Property Tax" value={formatCurrency(annualTax)} highlight />
          <ResultCard label="Monthly Property Tax" value={formatCurrency(monthlyTax)} />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveTaxRate)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Property Tax Overview" />
      <CalculatorInput
        input={{ id: "homeValue", label: "Home Value", type: "number", defaultValue: 400000, suffix: "$", min: 0, step: 10000, tooltip: "The estimated market value of your home." }}
        value={homeValue}
        onChange={setHomeValue}
      />
      <CalculatorInput
        input={{ id: "assessmentRatio", label: "Assessment Ratio", type: "number", defaultValue: 80, suffix: "%", min: 0, max: 100, step: 1, tooltip: "The percentage of your home's value that is subject to taxation (varies by jurisdiction)." }}
        value={assessmentRatio}
        onChange={setAssessmentRatio}
      />
      <CalculatorInput
        input={{ id: "millRate", label: "Mill Rate", type: "number", defaultValue: 10, suffix: "mills", min: 0, max: 100, step: 0.5, tooltip: "1 mill = $1 per $1,000 of assessed value." }}
        value={millRate}
        onChange={setMillRate}
      />
      <CalculatorInput
        input={{ id: "exemptions", label: "Exemptions", type: "number", defaultValue: 25000, suffix: "$", min: 0, step: 1000, tooltip: "Homestead or other exemptions that reduce assessed value." }}
        value={exemptions}
        onChange={setExemptions}
      />
    </CalculatorLayout>
  );
}
