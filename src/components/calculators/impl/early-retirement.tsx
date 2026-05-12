"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput } from "@/components/calculators/period-input";

export default function EarlyRetirementCalculator() {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [currentSavings, setCurrentSavings] = React.useState(100000);
  const [annualIncome, setAnnualIncome] = React.useState(75000);
  const [savingsRate, setSavingsRate] = React.useState(30);
  const [annualReturn, setAnnualReturn] = React.useState(7);
  const [annualSpending, setAnnualSpending] = React.useState(45000);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = React.useState(4);

  const safeSavings = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);
  const safeIncome = Math.max(0, isFinite(annualIncome) ? annualIncome : 0);
  const safeSpending = Math.max(0, isFinite(annualSpending) ? annualSpending : 0);
  const safeReturn = Math.max(0, isFinite(annualReturn) ? annualReturn : 0);
  const safeSWR = Math.max(0, isFinite(safeWithdrawalRate) ? safeWithdrawalRate : 0);

  const r = safeReturn / 100;
  const swr = safeSWR / 100;
  const annualSavings = safeIncome * (savingsRate / 100);
  const fireNumber = swr > 0 ? safeSpending / swr : Infinity;

  // Solve for years to FI
  let yearsToFI = 0;
  if (safeSavings >= fireNumber) {
    yearsToFI = 0;
  } else if (r === 0) {
    yearsToFI =
      annualSavings > 0
        ? Math.ceil((fireNumber - safeSavings) / annualSavings)
        : Infinity;
  } else {
    let low = 0;
    let high = 100;
    const target = fireNumber;

    while (
      low <= high &&
      safeSavings * Math.pow(1 + r, high) +
        (annualSavings * (Math.pow(1 + r, high) - 1)) / r <
        target
    ) {
      high *= 2;
      if (high > 500) {
        yearsToFI = Infinity;
        break;
      }
    }

    if (yearsToFI !== Infinity && isFinite(high)) {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const fv =
          safeSavings * Math.pow(1 + r, mid) +
          (annualSavings * (Math.pow(1 + r, mid) - 1)) / r;
        if (fv >= target) {
          yearsToFI = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
    }
  }

  const ageAtFIRE = yearsToFI !== Infinity ? currentAge + yearsToFI : Infinity;

  const savingsAtFIRE =
    yearsToFI !== Infinity && isFinite(yearsToFI)
      ? safeSavings * Math.pow(1 + r, yearsToFI) +
        (annualSavings * (Math.pow(1 + r, yearsToFI) - 1)) / r
      : fireNumber;

  const withdrawalAmount = swr > 0 ? savingsAtFIRE * swr : 0;

  // FIRE milestones
  const milestone25 = fireNumber * 0.25;
  const milestone50 = fireNumber * 0.5;
  const milestone75 = fireNumber * 0.75;

  const maxChartYears = yearsToFI !== Infinity
    ? Math.min(yearsToFI + 10, 60)
    : 60;

  const chartData = Array.from({ length: Math.min(maxChartYears + 1, 37) }, (_, i) => {
    let fv: number;
    if (r === 0) {
      fv = safeSavings + annualSavings * i;
    } else {
      fv =
        safeSavings * Math.pow(1 + r, i) +
        (annualSavings * (Math.pow(1 + r, i) - 1)) / r;
    }
    return {
      year: `Year ${i}`,
      "Portfolio Value": isFinite(fv) ? Math.round(fv) : 0,
      "FIRE Number": isFinite(fireNumber) ? Math.round(fireNumber) : 0,
    };
  });

  return (
    <CalculatorLayout
      title="Early Retirement / FIRE"
      description="Calculate your path to Financial Independence and Early Retirement using the FIRE methodology."
      icon={<span>🔥</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="FIRE Number"
            value={formatCurrency(fireNumber)}
            highlight
          />
          <ResultCard
            label="Years to FIRE"
            value={
              yearsToFI === Infinity
                ? "∞"
                : formatNumber(yearsToFI, 0)
            }
            highlight
            subtext={
              yearsToFI !== Infinity
                ? `At age ${Math.round(ageAtFIRE)}`
                : undefined
            }
          />
          <ResultCard
            label="Age at FIRE"
            value={
              ageAtFIRE === Infinity ? "N/A" : formatNumber(ageAtFIRE, 0)
            }
          />
          <ResultCard
            label="Savings at FIRE"
            value={formatCurrency(savingsAtFIRE)}
          />
          <ResultCard
            label="Withdrawal Amount"
            value={formatCurrency(withdrawalAmount)}
            subtext={`At ${safeSWR}% withdrawal rate`}
          />
          <ResultCard label="25% Milestone" value={formatCurrency(milestone25)} subtext="Quarter of FIRE goal" />
          <ResultCard label="50% Milestone" value={formatCurrency(milestone50)} subtext="Halfway to FIRE" />
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Portfolio Value", "FIRE Number"]}
        title="Portfolio Growth vs FIRE Target"
        height={300}
      />
      <CalculatorInput
        input={{
          id: "currentAge",
          label: "Current Age",
          type: "slider",
          defaultValue: 30,
          suffix: "years",
          min: 18,
          max: 70,
          step: 1,
          tooltip: "Your current age. Used to calculate time horizon to FIRE.",
        }}
        value={currentAge}
        onChange={setCurrentAge}
      />
      <CalculatorInput
        input={{
          id: "currentSavings",
          label: "Current Savings",
          type: "number",
          defaultValue: 100000,
          suffix: "$",
          min: 0,
          tooltip: "Your total current savings and investments.",
        }}
        value={currentSavings}
        onChange={setCurrentSavings}
      />
      <CalculatorInput
        input={{
          id: "annualIncome",
          label: "Annual Income",
          type: "number",
          defaultValue: 75000,
          suffix: "$",
          min: 0,
          tooltip: "Your total annual income before taxes.",
        }}
        value={annualIncome}
        onChange={setAnnualIncome}
      />
      <CalculatorInput
        input={{
          id: "savingsRate",
          label: "Savings Rate",
          type: "slider",
          defaultValue: 30,
          suffix: "%",
          min: 0,
          max: 80,
          step: 1,
          tooltip: "Percentage of your annual income that you save each year.",
        }}
        value={savingsRate}
        onChange={setSavingsRate}
      />
      <CalculatorInput
        input={{
          id: "annualReturn",
          label: "Annual Return",
          type: "number",
          defaultValue: 7,
          suffix: "%",
          min: 0,
          max: 30,
          step: 0.1,
          tooltip: "Expected annual return on your investments.",
        }}
        value={annualReturn}
        onChange={setAnnualReturn}
      />
      <CalculatorInput
        input={{
          id: "annualSpending",
          label: "Annual Spending",
          type: "number",
          defaultValue: 45000,
          suffix: "$",
          min: 0,
          tooltip: "Your expected annual expenses in retirement.",
        }}
        value={annualSpending}
        onChange={setAnnualSpending}
      />
      <CalculatorInput
        input={{
          id: "safeWithdrawalRate",
          label: "Safe Withdrawal Rate",
          type: "number",
          defaultValue: 4,
          suffix: "%",
          min: 1,
          max: 20,
          step: 0.1,
          tooltip: "The percentage you plan to withdraw annually in retirement (4% is the standard Trinity Study recommendation).",
        }}
        value={safeWithdrawalRate}
        onChange={setSafeWithdrawalRate}
      />
    </CalculatorLayout>
  );
}
