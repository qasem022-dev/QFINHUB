"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function TraditionalIraCalculator() {
  const [annualContribution, setAnnualContribution] = React.useState(7000);
  const [currentAge, setCurrentAge] = React.useState(35);
  const [currentBalance, setCurrentBalance] = React.useState(0);
  const [annualReturn, setAnnualReturn] = React.useState(7);
  const [taxRate, setTaxRate] = React.useState(22);
  const [expectedTaxRate, setExpectedTaxRate] = React.useState(12);
  const [yearsToGrow, setYearsToGrow] = React.useState(30);
  const [yearsToGrowUnit, setYearsToGrowUnit] = React.useState<PeriodUnit>("years");

  const safeContrib = Math.max(0, isFinite(annualContribution) ? annualContribution : 0);
  const safeBalance = Math.max(0, isFinite(currentBalance) ? currentBalance : 0);
  const safeReturn = Math.max(0, isFinite(annualReturn) ? annualReturn : 0);
  const safeTaxRate = Math.max(0, isFinite(taxRate) ? taxRate : 0);
  const safeExpectedTaxRate = Math.max(0, isFinite(expectedTaxRate) ? expectedTaxRate : 0);

  const r = safeReturn / 100;
  const yearsToGrowInYears = toMonths(yearsToGrow, yearsToGrowUnit) / 12;

  // FV formula (annual compounding)
  const fv =
    safeBalance * Math.pow(1 + r, yearsToGrowInYears) +
    (r > 0
      ? safeContrib * ((Math.pow(1 + r, yearsToGrowInYears) - 1) / r)
      : safeContrib * yearsToGrowInYears);

  const preTaxBalance = isFinite(fv) ? Math.round(fv) : 0;
  const afterTaxBalance = Math.round(preTaxBalance * (1 - safeExpectedTaxRate / 100));
  const taxSavingsToday = Math.round(safeContrib * (safeTaxRate / 100));
  const estimatedTaxesOwed = preTaxBalance - afterTaxBalance;

  // RMD projection (age 72+)
  const rmdAge = 72;
  const rmdFactor = 27.4;
  const rmdAt72 = rmdAge > currentAge + yearsToGrowInYears ? 0 : preTaxBalance / rmdFactor;

  // Chart: bar chart comparing pre-tax vs after-tax balance
  const chartData = [
    { name: "Pre-Tax Balance", value: preTaxBalance },
    { name: "After-Tax Balance", value: afterTaxBalance },
  ];

  return (
    <CalculatorLayout
      title="Traditional IRA Calculator"
      description="Estimate your Traditional IRA balance at retirement with pre-tax contributions, deferred tax projections, and RMD estimates."
      icon={<span>🏛️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Pre-Tax Balance" value={formatCurrency(preTaxBalance)} highlight />
          <ResultCard label="After-Tax Balance" value={formatCurrency(afterTaxBalance)} subtext={`At ${safeExpectedTaxRate}% expected tax rate`} />
          <ResultCard label="Tax Savings Today" value={formatCurrency(taxSavingsToday)} subtext={`At ${safeTaxRate}% marginal tax rate`} />
          <ResultCard label="Estimated Taxes Owed" value={formatCurrency(estimatedTaxesOwed)} />
          <ResultCard label="Estimated RMD at 72" value={formatCurrency(rmdAt72)} subtext="Required Minimum Distribution" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Pre-Tax vs After-Tax Balance" />
      <CalculatorInput input={{ id: "annualContribution", label: "Annual Contribution", type: "number", defaultValue: 7000, suffix: "$", min: 0, tooltip: "How much you contribute each year to your Traditional IRA." }} value={annualContribution} onChange={setAnnualContribution} />
      <CalculatorInput input={{ id: "currentAge", label: "Current Age", type: "slider", defaultValue: 35, suffix: "years", min: 18, max: 70, step: 1, tooltip: "Your current age used to determine how many years your Traditional IRA has to grow." }} value={currentAge} onChange={setCurrentAge} />
      <PeriodInput
        id="yearsToGrow"
        label="Years to Grow"
        value={yearsToGrow}
        unit={yearsToGrowUnit}
        onValueChange={setYearsToGrow}
        onUnitChange={setYearsToGrowUnit}
        min={1}
        max={65}
      />
      <CalculatorInput input={{ id: "currentBalance", label: "Current Balance", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Your current Traditional IRA account balance." }} value={currentBalance} onChange={setCurrentBalance} />
      <CalculatorInput input={{ id: "annualReturn", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected average annual investment return." }} value={annualReturn} onChange={setAnnualReturn} />
      <CalculatorInput input={{ id: "taxRate", label: "Current Marginal Tax Rate", type: "number", defaultValue: 22, suffix: "%", min: 0, max: 50, step: 0.5, tooltip: "Your current marginal federal income tax rate used to calculate upfront tax savings." }} value={taxRate} onChange={setTaxRate} />
      <CalculatorInput input={{ id: "expectedTaxRate", label: "Expected Tax Rate in Retirement", type: "number", defaultValue: 12, suffix: "%", min: 0, max: 50, step: 0.5, tooltip: "The tax rate you expect to pay on withdrawals in retirement." }} value={expectedTaxRate} onChange={setExpectedTaxRate} />
    </CalculatorLayout>
  );
}
