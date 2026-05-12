"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function RothIraCalculator() {
  const [annualContribution, setAnnualContribution] = React.useState(7000);
  const [currentAge, setCurrentAge] = React.useState(30);
  const [currentBalance, setCurrentBalance] = React.useState(0);
  const [annualReturn, setAnnualReturn] = React.useState(7);
  const [contributionLimit, setContributionLimit] = React.useState(7000);
  const [yearsToGrow, setYearsToGrow] = React.useState(35);
  const [yearsToGrowUnit, setYearsToGrowUnit] = React.useState<PeriodUnit>("years");

  const safeContrib = Math.max(0, isFinite(annualContribution) ? annualContribution : 0);
  const safeBalance = Math.max(0, isFinite(currentBalance) ? currentBalance : 0);
  const safeReturn = Math.max(0, isFinite(annualReturn) ? annualReturn : 0);
  const safeLimit = Math.max(0, isFinite(contributionLimit) ? contributionLimit : 0);

  const r = safeReturn / 100;
  const yearsToGrowInYears = toMonths(yearsToGrow, yearsToGrowUnit) / 12;
  const effectiveContribution = Math.min(safeContrib, safeLimit);

  // FV formula (annual compounding, no monthly)
  const fv =
    safeBalance * Math.pow(1 + r, yearsToGrowInYears) +
    (r > 0
      ? effectiveContribution * ((Math.pow(1 + r, yearsToGrowInYears) - 1) / r)
      : effectiveContribution * yearsToGrowInYears);

  const projectedBalance = isFinite(fv) ? Math.round(fv) : 0;
  const totalContributions = safeBalance + effectiveContribution * yearsToGrowInYears;
  const totalTaxFreeGrowth = Math.max(0, projectedBalance - totalContributions);
  const percentFromGrowth =
    projectedBalance > 0
      ? ((totalTaxFreeGrowth / projectedBalance) * 100)
      : 0;

  // Roth vs Traditional comparison
  // Traditional: contributions deductible now, taxed at withdrawal
  // Roth: contributions after-tax, withdrawals tax-free
  const assumedTaxRate = 0.22; // typical marginal rate
  const traditionalFV =
    safeBalance * Math.pow(1 + r, yearsToGrowInYears) +
    (r > 0
      ? effectiveContribution * (1 + assumedTaxRate) * ((Math.pow(1 + r, yearsToGrowInYears) - 1) / r)
      : effectiveContribution * (1 + assumedTaxRate) * yearsToGrowInYears);
  const traditionalAfterTax = isFinite(traditionalFV) ? traditionalFV * (1 - assumedTaxRate) : 0;
  const rothAdvantage = projectedBalance - traditionalAfterTax;

  // Chart: area chart showing balance growth over time
  const chartYears = Math.min(Math.round(yearsToGrowInYears), 36);
  const chartData = Array.from({ length: chartYears + 1 }, (_, i) => {
    const y = i;
    const fvAtYear =
      safeBalance * Math.pow(1 + r, y) +
      (r > 0
        ? effectiveContribution * ((Math.pow(1 + r, y) - 1) / r)
        : effectiveContribution * y);
    const contribAtYear = safeBalance + effectiveContribution * y;
    const growthAtYear = Math.round(Math.max(0, fvAtYear - contribAtYear));
    return {
      year: `Year ${y}`,
      Contributions: Math.round(contribAtYear),
      "Tax-Free Growth": Math.max(0, growthAtYear),
    };
  });

  return (
    <CalculatorLayout
      title="Roth IRA Calculator"
      description="Estimate your Roth IRA balance at retirement with tax-free growth projections and Roth vs Traditional comparison."
      icon={<span>🪙</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Projected Balance" value={formatCurrency(projectedBalance)} highlight />
          <ResultCard label="Total Contributions" value={formatCurrency(totalContributions)} subtext={`Over ${Math.round(yearsToGrowInYears)} years`} />
          <ResultCard label="Total Tax-Free Growth" value={formatCurrency(totalTaxFreeGrowth)} />
          <ResultCard label="Percentage from Growth" value={formatPercentage(percentFromGrowth)} />
          <ResultCard label="Roth vs Traditional" value={formatCurrency(rothAdvantage)} highlight subtext={rothAdvantage >= 0 ? "Roth advantage over Traditional IRA" : "Traditional IRA advantage"} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["Contributions", "Tax-Free Growth"]} title="Roth IRA Growth Over Time" />
      <CalculatorInput input={{ id: "annualContribution", label: "Annual Contribution", type: "number", defaultValue: 7000, suffix: "$", min: 0, tooltip: "How much you contribute each year to your Roth IRA." }} value={annualContribution} onChange={setAnnualContribution} />
      <CalculatorInput input={{ id: "currentAge", label: "Current Age", type: "slider", defaultValue: 30, suffix: "years", min: 18, max: 70, step: 1, tooltip: "Your current age used to determine how many years your Roth IRA has to grow." }} value={currentAge} onChange={setCurrentAge} />
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
      <CalculatorInput input={{ id: "currentBalance", label: "Current Balance", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Your current Roth IRA account balance." }} value={currentBalance} onChange={setCurrentBalance} />
      <CalculatorInput input={{ id: "annualReturn", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected average annual investment return." }} value={annualReturn} onChange={setAnnualReturn} />
      <CalculatorInput input={{ id: "contributionLimit", label: "Contribution Limit", type: "number", defaultValue: 7000, suffix: "$", min: 0, tooltip: "Maximum annual contribution allowed by the IRS." }} value={contributionLimit} onChange={setContributionLimit} />
    </CalculatorLayout>
  );
}
