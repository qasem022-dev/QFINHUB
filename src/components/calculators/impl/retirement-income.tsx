"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function RetirementIncomeCalculator() {
  const [retirementSavings, setRetirementSavings] = React.useState(500000);
  const [annualReturn, setAnnualReturn] = React.useState(6);
  const [withdrawalRate, setWithdrawalRate] = React.useState(4);
  const [otherIncome, setOtherIncome] = React.useState(25000);
  const [retirementYears, setRetirementYears] = React.useState(30);
  const [retirementYearsUnit, setRetirementYearsUnit] = React.useState<PeriodUnit>("years");

  const safeSavings = Math.max(0, isFinite(retirementSavings) ? retirementSavings : 0);
  const safeReturn = Math.max(0, isFinite(annualReturn) ? annualReturn : 0);
  const safeWR = Math.max(0, isFinite(withdrawalRate) ? withdrawalRate : 0);
  const safeOtherIncome = Math.max(0, isFinite(otherIncome) ? otherIncome : 0);

  const r = safeReturn / 100;
  const wr = safeWR / 100;
  const retirementYearsInYears = toMonths(retirementYears, retirementYearsUnit) / 12;
  const annualWithdrawal = safeSavings * wr;
  const totalAnnualIncome = annualWithdrawal + safeOtherIncome;
  const monthlyIncome = totalAnnualIncome / 12;

  // Calculate portfolio longevity
  let portfolioDuration = 0;
  if (annualWithdrawal <= 0) {
    portfolioDuration = Infinity;
  } else {
    let balance = safeSavings;
    const maxYears = 200;
    for (let y = 0; y < maxYears; y++) {
      if (balance <= 0) break;
      balance = balance * (1 + r) - annualWithdrawal;
      portfolioDuration = y + 1;
      if (balance <= 0) break;
    }
    if (balance > 0) portfolioDuration = Infinity;
  }

  // Withdrawal strategy: balance over time chart
  const chartYears = Math.min(Math.ceil(retirementYearsInYears), 36);
  const balanceChart = Array.from({ length: chartYears + 1 }, (_, i) => {
    let bal = safeSavings;
    for (let y = 0; y < i; y++) {
      bal = bal * (1 + r) - annualWithdrawal;
      if (bal <= 0) { bal = 0; break; }
    }
    return {
      year: `Yr ${i}`,
      "Portfolio Balance": Math.round(Math.max(0, bal)),
    };
  });

  return (
    <CalculatorLayout
      title="Retirement Income"
      description="Calculate your retirement income from savings, withdrawals, and other income sources with longevity projections."
      icon={<span>💵</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Annual Withdrawal"
            value={formatCurrency(annualWithdrawal)}
            highlight
            subtext={`At ${safeWR}% withdrawal rate`}
          />
          <ResultCard
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
          />
          <ResultCard
            label="Total Annual Income"
            value={formatCurrency(totalAnnualIncome)}
          />
          <ResultCard
            label="Portfolio Longevity"
            value={
              portfolioDuration === Infinity
                ? "∞"
                : `${formatNumber(portfolioDuration, 0)} years`
            }
            highlight
            subtext={
              portfolioDuration !== Infinity
                ? portfolioDuration <= retirementYearsInYears
                  ? "⚠️ Savings may run out before retirement horizon"
                  : "✅ Savings outlast retirement horizon"
                : "Portfolio grows indefinitely"
            }
          />
          <ResultCard label="Other Income" value={formatCurrency(safeOtherIncome)} subtext="Annual (pensions, SS, rental)" />
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={balanceChart}
        xKey="year"
        yKey={["Portfolio Balance"]}
        title="Portfolio Balance Over Time"
        height={250}
      />
      <CalculatorInput
        input={{
          id: "retirementSavings",
          label: "Retirement Savings",
          type: "number",
          defaultValue: 500000,
          suffix: "$",
          min: 0,
          tooltip: "Your total retirement savings balance.",
        }}
        value={retirementSavings}
        onChange={setRetirementSavings}
      />
      <CalculatorInput
        input={{
          id: "annualReturn",
          label: "Annual Return",
          type: "number",
          defaultValue: 6,
          suffix: "%",
          min: 0,
          max: 30,
          step: 0.1,
          tooltip: "Expected annual return on your retirement portfolio.",
        }}
        value={annualReturn}
        onChange={setAnnualReturn}
      />
      <CalculatorInput
        input={{
          id: "withdrawalRate",
          label: "Withdrawal Rate",
          type: "slider",
          defaultValue: 4,
          suffix: "%",
          min: 2,
          max: 8,
          step: 0.25,
          tooltip: "The percentage of your savings you withdraw each year.",
        }}
        value={withdrawalRate}
        onChange={setWithdrawalRate}
      />
      <CalculatorInput
        input={{
          id: "otherIncome",
          label: "Other Income",
          type: "number",
          defaultValue: 25000,
          suffix: "$",
          min: 0,
          tooltip: "Pensions, social security, rental income, or any other income sources.",
        }}
        value={otherIncome}
        onChange={setOtherIncome}
      />
      <PeriodInput
        id="retirementYears"
        label="Retirement Horizon"
        value={retirementYears}
        unit={retirementYearsUnit}
        onValueChange={setRetirementYears}
        onUnitChange={setRetirementYearsUnit}
        min={1}
        max={60}
      />
    </CalculatorLayout>
  );
}
