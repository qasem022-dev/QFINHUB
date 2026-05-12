"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function PensionCalculator() {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [retirementAge, setRetirementAge] = React.useState(65);
  const [yearsOfService, setYearsOfService] = React.useState(30);
  const [yearsOfServiceUnit, setYearsOfServiceUnit] = React.useState<PeriodUnit>("years");
  const [finalAvgSalary, setFinalAvgSalary] = React.useState(80000);
  const [benefitMultiplier, setBenefitMultiplier] = React.useState(1.5);
  const [cola, setCola] = React.useState(2);
  const [currentSavings, setCurrentSavings] = React.useState(100000);

  const safeSalary = Math.max(0, isFinite(finalAvgSalary) ? finalAvgSalary : 0);
  const safeMultiplier = Math.max(0, isFinite(benefitMultiplier) ? benefitMultiplier : 0);
  const safeCOLA = Math.max(0, isFinite(cola) ? cola : 0);
  const safeSavings = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);

  const yearsOfServiceInYears = toMonths(yearsOfService, yearsOfServiceUnit) / 12;
  const annualPension = yearsOfServiceInYears * (safeMultiplier / 100) * safeSalary;
  const monthlyPension = annualPension / 12;
  const lifeExpectancy = 85;
  const retirementYears = Math.max(1, lifeExpectancy - retirementAge);
  let lifetimeValue = 0;
  const colaChartData: { year: string; "Pension Income": number }[] = [];

  for (let y = 0; y < Math.min(retirementYears, 36); y++) {
    const colaFactor = Math.pow(1 + safeCOLA / 100, y);
    const yearIncome = annualPension * colaFactor;
    lifetimeValue += yearIncome;
    colaChartData.push({
      year: `Year ${y + 1}`,
      "Pension Income": Math.round(yearIncome),
    });
  }

  const totalRetirementValue = safeSavings + lifetimeValue;

  // Lump sum vs annuity comparison
  // Approximate present value of pension as lump sum
  const discountRate = 0.05; // 5% discount rate
  let lumpSumValue = 0;
  for (let y = 0; y < Math.min(retirementYears, 50); y++) {
    const colaFactor = Math.pow(1 + safeCOLA / 100, y);
    lumpSumValue += (annualPension * colaFactor) / Math.pow(1 + discountRate, y + 1);
  }

  return (
    <CalculatorLayout
      title="Pension Calculator"
      description="Estimate your defined-benefit pension income based on years of service, salary, and cost-of-living adjustments."
      icon={<span>🏦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Pension Benefit" value={formatCurrency(annualPension)} highlight />
          <ResultCard label="Monthly Pension Benefit" value={formatCurrency(monthlyPension)} />
          <ResultCard label="Lifetime Value" value={formatCurrency(lifetimeValue)} highlight subtext={`Over ${retirementYears} years of retirement (age ${retirementAge} to ${lifeExpectancy}) with ${safeCOLA}% COLA`} />
          <ResultCard label="Total Retirement Value" value={formatCurrency(totalRetirementValue)} subtext={`Pension + $${formatNumber(safeSavings, 0)} in savings`} />
          <ResultCard label="Lump Sum Equivalent" value={formatCurrency(lumpSumValue)} subtext={`At ${discountRate * 100}% discount rate`} />
        </div>
      }
    >
      <CalculatorChart type="line" data={colaChartData} xKey="year" yKey={["Pension Income"]} title="Pension Income with COLA Growth" height={300} />
      <CalculatorInput
        input={{ id: "currentAge", label: "Current Age", type: "number", defaultValue: 30, suffix: "years", min: 18, max: 80, step: 1, tooltip: "Your current age." }}
        value={currentAge}
        onChange={setCurrentAge}
      />
      <CalculatorInput
        input={{ id: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, suffix: "years", min: 50, max: 80, step: 1, tooltip: "The age at which you plan to start receiving pension benefits." }}
        value={retirementAge}
        onChange={setRetirementAge}
      />
      <PeriodInput
        id="yearsOfService"
        label="Years of Service"
        value={yearsOfService}
        unit={yearsOfServiceUnit}
        onValueChange={setYearsOfService}
        onUnitChange={setYearsOfServiceUnit}
        min={0}
        max={60}
      />
      <CalculatorInput
        input={{ id: "finalAvgSalary", label: "Final Average Salary", type: "number", defaultValue: 80000, suffix: "$", min: 0, step: 1000, tooltip: "Your average salary over the final years of employment (typically highest 3-5 years)." }}
        value={finalAvgSalary}
        onChange={setFinalAvgSalary}
      />
      <CalculatorInput
        input={{ id: "benefitMultiplier", label: "Benefit Multiplier", type: "number", defaultValue: 1.5, suffix: "%", min: 0, max: 10, step: 0.1, tooltip: "The percentage multiplier used in the pension formula (e.g., 1.5% per year of service)." }}
        value={benefitMultiplier}
        onChange={setBenefitMultiplier}
      />
      <CalculatorInput
        input={{ id: "cola", label: "COLA (Cost of Living Adjustment)", type: "number", defaultValue: 2, suffix: "%", min: 0, max: 10, step: 0.1, tooltip: "Annual cost-of-living adjustment applied to pension benefits." }}
        value={cola}
        onChange={setCola}
      />
      <CalculatorInput
        input={{ id: "currentSavings", label: "Current Savings", type: "number", defaultValue: 100000, suffix: "$", min: 0, step: 1000, tooltip: "Other retirement savings in addition to your pension." }}
        value={currentSavings}
        onChange={setCurrentSavings}
      />
    </CalculatorLayout>
  );
}
