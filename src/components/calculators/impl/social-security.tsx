"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

// 2024 Social Security bend points
const BEND_POINT_1 = 1174;
const BEND_POINT_2 = 7078;

// Full Retirement Age (assume 67 for everyone born 1960+)
const FRA = 67;

function calculatePIA(aime: number): number {
  if (aime <= BEND_POINT_1) {
    return 0.9 * aime;
  } else if (aime <= BEND_POINT_2) {
    return 0.9 * BEND_POINT_1 + 0.32 * (aime - BEND_POINT_1);
  } else {
    return 0.9 * BEND_POINT_1 + 0.32 * (BEND_POINT_2 - BEND_POINT_1) + 0.15 * (aime - BEND_POINT_2);
  }
}

function calculateBenefitAtAge(pia: number, claimAge: number): number {
  if (claimAge < FRA) {
    const monthsEarly = (FRA - claimAge) * 12;
    const first36 = Math.min(monthsEarly, 36);
    const beyond36 = Math.max(monthsEarly - 36, 0);
    const reduction = first36 * (5 / 9 / 100) + beyond36 * (5 / 12 / 100);
    return pia * (1 - reduction);
  } else if (claimAge > FRA) {
    const maxClaimAge = Math.min(claimAge, 70);
    const monthsLate = (maxClaimAge - FRA) * 12;
    const increase = monthsLate * (8 / 12 / 100);
    return pia * (1 + increase);
  } else {
    return pia;
  }
}

function estimateLifeExpectancy(currentAge: number): number {
  return Math.max(currentAge + 10, 82);
}

export default function SocialSecurityCalculator() {
  const [currentAge, setCurrentAge] = React.useState(35);
  const [annualIncome, setAnnualIncome] = React.useState(60000);
  const [retirementAge, setRetirementAge] = React.useState(67);
  const [spouseIncome, setSpouseIncome] = React.useState(0);
  const [yearsWorked, setYearsWorked] = React.useState(15);
  const [yearsWorkedUnit, setYearsWorkedUnit] = React.useState<PeriodUnit>("years");

  const safeIncome = Math.max(0, isFinite(annualIncome) ? annualIncome : 0);
  const safeSpouseIncome = Math.max(0, isFinite(spouseIncome) ? spouseIncome : 0);
  const combinedIncome = safeIncome + safeSpouseIncome;

  const aime = combinedIncome / 12;
  const pia = calculatePIA(aime);

  const yearsWorkedInYears = toMonths(yearsWorked, yearsWorkedUnit) / 12;
  const yearsFactor = Math.min(yearsWorkedInYears / 35, 1);
  const adjustedPia = pia * yearsFactor;

  const benefitAt62 = calculateBenefitAtAge(adjustedPia, 62);
  const benefitAtFRA = calculateBenefitAtAge(adjustedPia, FRA);
  const benefitAt70 = calculateBenefitAtAge(adjustedPia, 70);

  const plannedClaimAge = Math.max(retirementAge, 62);
  const benefitAtPlanned = calculateBenefitAtAge(adjustedPia, plannedClaimAge);

  const lifeExpectancy = estimateLifeExpectancy(currentAge);
  const lifetimeAt62 = benefitAt62 * 12 * (lifeExpectancy - 62);
  const lifetimeAtFRA = benefitAtFRA * 12 * (lifeExpectancy - FRA);
  const lifetimeAt70 = benefitAt70 * 12 * (lifeExpectancy - 70);

  // Break-even age: compare claiming at 62 vs 67
  // At what age does claiming at 67 catch up to claiming at 62?
  const annualDiff = (benefitAtFRA - benefitAt62) * 12;
  const cumulativeAdvantage62 = benefitAt62 * 12 * (FRA - 62);
  const breakEvenAge = annualDiff > 0 ? FRA + cumulativeAdvantage62 / annualDiff : FRA;

  const scenarios = [
    { age: 62, monthly: benefitAt62, lifetime: lifetimeAt62 },
    { age: FRA, monthly: benefitAtFRA, lifetime: lifetimeAtFRA },
    { age: 70, monthly: benefitAt70, lifetime: lifetimeAt70 },
  ];

  let suggestedAge: number;
  let suggestionReason: string;

  if (lifetimeAt70 > lifetimeAtFRA && lifetimeAt70 > lifetimeAt62) {
    suggestedAge = 70;
    suggestionReason = "maximizes total lifetime benefits based on estimated life expectancy";
  } else if (lifetimeAtFRA >= lifetimeAt62 && lifetimeAtFRA >= lifetimeAt70) {
    suggestedAge = FRA;
    suggestionReason = "balances monthly income with total lifetime benefits";
  } else {
    suggestedAge = 62;
    suggestionReason = "provides income sooner and maximizes lifetime benefits given your life expectancy";
  }

  const chartData = [
    { age: "62", "Monthly Benefit": Math.round(benefitAt62) },
    { age: "67 (FRA)", "Monthly Benefit": Math.round(benefitAtFRA) },
    { age: "70", "Monthly Benefit": Math.round(benefitAt70) },
  ];

  return (
    <CalculatorLayout
      title="Social Security Calculator"
      description="Estimate your Social Security benefits based on your earnings history and claiming age."
      icon={<span>🏛️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Estimated Monthly Benefit" value={formatCurrency(benefitAtPlanned)} highlight subtext={`Claiming at age ${plannedClaimAge}`} />
          <ResultCard label="Annual Benefit" value={formatCurrency(benefitAtPlanned * 12)} />

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lifetime Benefits by Claiming Age</h4>
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div key={s.age} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Claim at {s.age === FRA ? `${s.age} (FRA)` : s.age}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(s.lifetime)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ResultCard
            label="Break-Even Age"
            value={breakEvenAge.toFixed(1)}
            subtext="Age when claiming at FRA surpasses claiming at 62"
            highlight
          />

          <ResultCard
            label="Suggested Strategy"
            value={`Claim at ${suggestedAge}`}
            subtext={suggestionReason}
          />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="age" yKey="Monthly Benefit" title="Monthly Benefit at Different Claiming Ages" />
      <CalculatorInput
        input={{ id: "currentAge", label: "Current Age", type: "slider", defaultValue: 35, suffix: "", min: 18, max: 70, step: 1, tooltip: "Your current age used for life expectancy estimation." }}
        value={currentAge}
        onChange={setCurrentAge}
      />
      <CalculatorInput
        input={{ id: "annualIncome", label: "Annual Income", type: "number", defaultValue: 60000, suffix: "$", min: 0, step: 1000, tooltip: "Your average annual income from wages or self-employment." }}
        value={annualIncome}
        onChange={setAnnualIncome}
      />
      <CalculatorInput
        input={{ id: "retirementAge", label: "Planned Retirement Age", type: "slider", defaultValue: 67, suffix: "", min: 62, max: 70, step: 1, tooltip: "The age at which you plan to start claiming Social Security benefits." }}
        value={retirementAge}
        onChange={setRetirementAge}
      />
      <CalculatorInput
        input={{ id: "spouseIncome", label: "Spouse Annual Income", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 1000, tooltip: "Your spouse's annual income, used for combined AIME calculation." }}
        value={spouseIncome}
        onChange={setSpouseIncome}
      />
      <PeriodInput
        id="yearsWorked"
        label="Years Worked"
        value={yearsWorked}
        unit={yearsWorkedUnit}
        onValueChange={setYearsWorked}
        onUnitChange={setYearsWorkedUnit}
        min={0}
        max={50}
      />
    </CalculatorLayout>
  );
}
