"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

function safeFV(PV: number, PMT: number, r: number, n: number, t: number): number {
  if (r === 0) {
    return PV + PMT * n * t;
  }
  const factor = Math.pow(1 + r / n, n * t);
  const fv = PV * factor + PMT * ((factor - 1) / (r / n));
  return isFinite(fv) ? fv : 0;
}

export default function RetirementPlanningCalculator() {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [currentSavings, setCurrentSavings] = React.useState(50000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(1000);
  const [expectedReturn, setExpectedReturn] = React.useState(7);
  const [currentIncome, setCurrentIncome] = React.useState(75000);
  const [yearsToRetire, setYearsToRetire] = React.useState(35);
  const [yearsToRetireUnit, setYearsToRetireUnit] = React.useState<PeriodUnit>("years");

  const safeCurrentSavings = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);
  const safeMonthly = Math.max(0, isFinite(monthlyContribution) ? monthlyContribution : 0);
  const safeIncome = Math.max(0, isFinite(currentIncome) ? currentIncome : 0);
  const safeReturn = Math.max(0, isFinite(expectedReturn) ? expectedReturn : 0);

  const r = safeReturn / 100;
  const yearsToRetireInYears = toMonths(yearsToRetire, yearsToRetireUnit) / 12;
  const retirementAge = currentAge + yearsToRetireInYears;
  const n = 12;
  const t = yearsToRetireInYears;

  const futureValue = safeFV(safeCurrentSavings, safeMonthly, r, n, t);

  const safeWithdrawalRate = 0.04;
  const retirementIncome = futureValue * safeWithdrawalRate;
  const incomeReplacement = safeIncome > 0 ? (retirementIncome / safeIncome) * 100 : 0;

  // Monte Carlo-like scenarios
  const conservativeReturn = Math.max(0, r - 0.03);
  const optimisticReturn = r + 0.03;
  const conservativeFV = safeFV(safeCurrentSavings, safeMonthly, conservativeReturn, n, t);
  const optimisticFV = safeFV(safeCurrentSavings, safeMonthly, optimisticReturn, n, t);

  const chartYears = Math.min(Math.round(t), 36);
  const chartData = Array.from({ length: chartYears + 1 }, (_, i) => {
    const y = i;
    const fv = safeFV(safeCurrentSavings, safeMonthly, r, n, y);
    const contrib = safeCurrentSavings + safeMonthly * 12 * y;
    return {
      year: `Year ${y}`,
      "Nest Egg": Math.round(fv),
      Contributions: Math.round(contrib),
    };
  });

  return (
    <CalculatorLayout
      title="Retirement Planning"
      description="Plan your retirement savings with projections, withdrawal strategies, and goal tracking."
      icon={<span>🏖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Nest Egg at Retirement" value={formatCurrency(futureValue)} highlight />
          <ResultCard label="Annual Retirement Income" value={formatCurrency(retirementIncome)} subtext="Based on 4% withdrawal rate" />
          <ResultCard label="Income Replacement Rate" value={`${incomeReplacement.toFixed(1)}%`} subtext={`of current $${safeIncome.toLocaleString()} income`} />
          <ResultCard label="Conservative (3% lower)" value={formatCurrency(conservativeFV)} subtext={`At ${Math.max(0, safeReturn - 3).toFixed(1)}% return`} />
          <ResultCard label="Optimistic (3% higher)" value={formatCurrency(optimisticFV)} subtext={`At ${(safeReturn + 3).toFixed(1)}% return`} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["Nest Egg", "Contributions"]} title="Savings Growth" />
      <CalculatorInput input={{ id: "currentAge", label: "Current Age", type: "number", defaultValue: 30, suffix: "years", min: 18, max: 80, tooltip: "Your current age. Used to calculate years until retirement." }} value={currentAge} onChange={setCurrentAge} />
      <PeriodInput
        id="yearsToRetire"
        label="Years to Retirement"
        value={yearsToRetire}
        unit={yearsToRetireUnit}
        onValueChange={setYearsToRetire}
        onUnitChange={setYearsToRetireUnit}
        min={1}
        max={70}
      />
      <CalculatorInput input={{ id: "currentSavings", label: "Current Savings", type: "number", defaultValue: 50000, suffix: "$", min: 0, tooltip: "Your total retirement savings balance today." }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "monthlyContribution", label: "Monthly Contribution", type: "number", defaultValue: 1000, suffix: "$", min: 0, tooltip: "Amount you contribute to retirement accounts each month." }} value={monthlyContribution} onChange={setMonthlyContribution} />
      <CalculatorInput input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected average annual investment return before retirement." }} value={expectedReturn} onChange={setExpectedReturn} />
      <CalculatorInput input={{ id: "currentIncome", label: "Current Annual Income", type: "number", defaultValue: 75000, suffix: "$", min: 0, tooltip: "Your current gross annual income." }} value={currentIncome} onChange={setCurrentIncome} />
    </CalculatorLayout>
  );
}
