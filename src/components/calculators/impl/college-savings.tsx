"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function CollegeSavingsCalculator() {
  const [childAge, setChildAge] = React.useState(5);
  const [collegeStart, setCollegeStart] = React.useState(18);
  const [annualTuition, setAnnualTuition] = React.useState(25000);
  const [collegeYears, setCollegeYears] = React.useState(4);
  const [collegeYearsUnit, setCollegeYearsUnit] = React.useState<PeriodUnit>("years");
  const [currentSavings, setCurrentSavings] = React.useState(5000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(300);
  const [expectedReturn, setExpectedReturn] = React.useState(6);

  const safeChildAge = Math.max(0, isFinite(childAge) ? childAge : 0);
  const safeCollegeStart = Math.max(safeChildAge + 1, isFinite(collegeStart) ? collegeStart : safeChildAge + 1);
  const safeTuition = Math.max(0, isFinite(annualTuition) ? annualTuition : 0);
  const safeCurrent = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);
  const safeMonthly = Math.max(0, isFinite(monthlyContribution) ? monthlyContribution : 0);
  const safeReturn = Math.max(0, isFinite(expectedReturn) ? expectedReturn : 0);

  const yearsUntilCollege = Math.min(Math.max(0, safeCollegeStart - safeChildAge), 50);
  const tuitionGrowth = 1.05;
  const futureTuition = safeTuition * Math.pow(tuitionGrowth, yearsUntilCollege);
  const safeCollegeYearsVal = toMonths(collegeYears, collegeYearsUnit) / 12;
  const totalNeed = isFinite(futureTuition) ? futureTuition * Math.max(1, safeCollegeYearsVal) : 0;

  const r = safeReturn / 100;
  const fvCurrent = safeCurrent * Math.pow(1 + r, yearsUntilCollege);
  const fvContributions = r > 0
    ? safeMonthly * 12 * (Math.pow(1 + r, yearsUntilCollege) - 1) / r
    : safeMonthly * 12 * yearsUntilCollege;
  const projectedSavings = isFinite(fvContributions) ? fvCurrent + fvContributions : fvCurrent;
  const shortfall = Math.max(0, totalNeed - projectedSavings);

  // 529 vs Regular savings comparison
  // 529: tax-free growth for qualified expenses
  const taxOnEarnings = 0.15; // 15% capital gains
  const regularFV = projectedSavings;
  const earningsPortion = Math.max(0, regularFV - safeCurrent - safeMonthly * 12 * yearsUntilCollege);
  const regularAfterTax = regularFV - earningsPortion * taxOnEarnings;
  const _529Advantage = projectedSavings - regularAfterTax;

  const chartYears = Math.min(yearsUntilCollege + 1, 36);
  const chartData = Array.from({ length: chartYears }, (_, i) => {
    const fvC = safeCurrent * Math.pow(1 + r, i);
    const fvM = r > 0 ? safeMonthly * 12 * (Math.pow(1 + r, i) - 1) / r : safeMonthly * 12 * i;
    const projected = isFinite(fvC + fvM) ? fvC + fvM : safeCurrent;
    const tuitionCost = safeTuition * Math.pow(tuitionGrowth, i) * Math.max(1, safeCollegeYearsVal);
    return {
      year: `Year ${i}`,
      "Projected Savings": isFinite(projected) ? Math.round(projected) : 0,
      "Tuition Cost": isFinite(tuitionCost) ? Math.round(tuitionCost) : 0,
    };
  });

  return (
    <CalculatorLayout
      title="College Savings"
      description="Plan for future college costs and see if your savings are on track."
      icon={<span>🎓</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Need" value={formatCurrency(totalNeed)} />
          <ResultCard label="Projected Savings" value={formatCurrency(projectedSavings)} highlight />
          <ResultCard label="Shortfall" value={formatCurrency(shortfall)} />
          <ResultCard label="Years Until College" value={formatNumber(yearsUntilCollege) + " yrs"} />
          <ResultCard label="Future Annual Tuition" value={formatCurrency(futureTuition)} />
          <ResultCard label="529 vs Regular Savings" value={formatCurrency(Math.abs(_529Advantage))} subtext={_529Advantage >= 0 ? "529 advantage (tax-free)" : "Regular account better"} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Projected Savings", "Tuition Cost"]} title="Savings Growth vs Tuition Cost" />
      <CalculatorInput input={{ id: "child-age", label: "Child's Current Age", type: "number", defaultValue: 5, suffix: "yrs", min: 0, max: 17, tooltip: "Current age of the child." }} value={childAge} onChange={setChildAge} />
      <CalculatorInput input={{ id: "college-start", label: "College Start Age", type: "number", defaultValue: 18, suffix: "yrs", min: 1, max: 30, tooltip: "Expected age when the child starts college." }} value={collegeStart} onChange={setCollegeStart} />
      <CalculatorInput input={{ id: "annual-tuition", label: "Current Annual Tuition", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "Today's cost of one year of college tuition." }} value={annualTuition} onChange={setAnnualTuition} />
      <PeriodInput
        id="college-years"
        label="Years in College"
        value={collegeYears}
        unit={collegeYearsUnit}
        onValueChange={setCollegeYears}
        onUnitChange={setCollegeYearsUnit}
        min={1}
        max={8}
      />
      <CalculatorInput input={{ id: "current-savings", label: "Current Savings", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Amount already saved for college." }} value={currentSavings} onChange={setCurrentSavings} />
      <CalculatorInput input={{ id: "monthly-contribution", label: "Monthly Contribution", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Monthly amount you plan to save for college." }} value={monthlyContribution} onChange={setMonthlyContribution} />
      <CalculatorInput input={{ id: "expected-return", label: "Expected Annual Return", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected annual return on college savings." }} value={expectedReturn} onChange={setExpectedReturn} />
    </CalculatorLayout>
  );
}
