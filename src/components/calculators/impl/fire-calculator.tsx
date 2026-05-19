"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function FireCalculator() {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [retirementAge, setRetirementAge] = React.useState(45);
  const [currentSavings, setCurrentSavings] = React.useState(100000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(3000);
  const [expectedReturn, setExpectedReturn] = React.useState(7);
  const [withdrawalRate, setWithdrawalRate] = React.useState(4);
  const [annualExpenses, setAnnualExpenses] = React.useState(40000);

  // Sanitize inputs
  const safeCurrentAge = Math.max(18, isFinite(currentAge) ? currentAge : 18);
  const safeRetirementAge = Math.max(safeCurrentAge + 1, isFinite(retirementAge) ? retirementAge : safeCurrentAge + 1);
  const safeSavings = Math.max(0, isFinite(currentSavings) ? currentSavings : 0);
  const safeMonthly = Math.max(0, isFinite(monthlyContribution) ? monthlyContribution : 0);
  const safeReturn = Math.max(0, Math.min(isFinite(expectedReturn) ? expectedReturn : 7, 30));
  const safeWithdrawalRate = Math.max(0.5, Math.min(isFinite(withdrawalRate) ? withdrawalRate : 4, 15));
  const safeAnnualExpenses = Math.max(0, isFinite(annualExpenses) ? annualExpenses : 0);

  const annualReturn = safeReturn / 100;
  const yearsToRetirement = safeRetirementAge - safeCurrentAge;
  const withdrawalRateDecimal = safeWithdrawalRate / 100;

  // FIRE Number = Annual Expenses / Withdrawal Rate (4% rule: multiply expenses by 25)
  const fireNumber = withdrawalRateDecimal > 0
    ? safeAnnualExpenses / withdrawalRateDecimal
    : 0;

  // Project savings at retirement age
  const futureValue = ((): number => {
    const r = annualReturn;
    const n = 12; // monthly compounding
    const t = yearsToRetirement;
    if (r === 0) {
      return safeSavings + safeMonthly * n * t;
    }
    const factor = Math.pow(1 + r / n, n * t);
    const fv = safeSavings * factor + safeMonthly * ((factor - 1) / (r / n));
    return isFinite(fv) ? fv : 0;
  })();

  // Years to FIRE from current savings
  const yearsToFire = ((): number => {
    const r = annualReturn;
    const annualSavings = safeMonthly * 12;
    if (r <= 0 || annualSavings <= 0) {
      return fireNumber > safeSavings ? Infinity : 0;
    }
    // Years to FIRE = log((r * fireNumber / annualSavings) + 1) / log(1 + r)
    const numerator = (r * fireNumber) / annualSavings + 1;
    if (numerator <= 0) return 0;
    const ytf = Math.log(numerator) / Math.log(1 + r);
    return isFinite(ytf) && ytf >= 0 ? ytf : 0;
  })();

  // Gap to FIRE
  const fireGap = fireNumber - futureValue;
  const fireProgress = fireNumber > 0 ? Math.min((futureValue / fireNumber) * 100, 100) : 100;

  // Income at retirement using the 4% rule
  const retirementIncome = futureValue * withdrawalRateDecimal;

  // Conservative and optimistic scenarios
  const conservativeReturn = Math.max(0, annualReturn - 0.02);
  const optimisticReturn = annualReturn + 0.02;
  const conservativeFV = ((): number => {
    const r = conservativeReturn;
    const t = yearsToRetirement;
    if (r === 0) return safeSavings + safeMonthly * 12 * t;
    const factor = Math.pow(1 + r / 12, 12 * t);
    const fv = safeSavings * factor + safeMonthly * ((factor - 1) / (r / 12));
    return isFinite(fv) ? fv : 0;
  })();
  const optimisticFV = ((): number => {
    const r = optimisticReturn;
    const t = yearsToRetirement;
    if (r === 0) return safeSavings + safeMonthly * 12 * t;
    const factor = Math.pow(1 + r / 12, 12 * t);
    const fv = safeSavings * factor + safeMonthly * ((factor - 1) / (r / 12));
    return isFinite(fv) ? fv : 0;
  })();

  // Chart data: growth over time
  const chartYears = Math.min(Math.ceil(yearsToRetirement), 36);
  const chartData = Array.from({ length: chartYears + 1 }, (_, i) => {
    const y = i;
    const r = annualReturn;
    let fv: number;
    if (r === 0) {
      fv = safeSavings + safeMonthly * 12 * y;
    } else {
      const factor = Math.pow(1 + r / 12, 12 * y);
      fv = safeSavings * factor + safeMonthly * ((factor - 1) / (r / 12));
    }
    const contrib = safeSavings + safeMonthly * 12 * y;
    return {
      year: `Year ${i}`,
      "Portfolio Value": isFinite(fv) ? Math.round(fv) : 0,
      "FIRE Target": Math.round(fireNumber),
      "Contributions": Math.round(contrib),
    };
  });

  const retirementYear = new Date().getFullYear() + yearsToRetirement;

  return (
    <CalculatorLayout
      title="FIRE Calculator"
      description="Plan your path to Financial Independence and Early Retirement using the 4% rule and compound growth projections."
      icon={<span>🔥</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="FIRE Number"
            value={formatCurrency(fireNumber)}
            subtext="Your target portfolio value"
            highlight
          />
          <ResultCard
            label="Projected Portfolio at Retirement"
            value={formatCurrency(futureValue)}
            subtext={`Age ${safeRetirementAge} (in ${retirementYear})`}
          />
          <ResultCard
            label="Progress to FIRE"
            value={`${fireProgress.toFixed(1)}%`}
            subtext={`${fireGap > 0 ? formatCurrency(fireGap) + " remaining" : "Target reached!"}`}
          />
          <ResultCard
            label="Years to FIRE"
            value={isFinite(yearsToFire) ? `${yearsToFire.toFixed(1)} years` : "N/A"}
            subtext="Based on current savings rate"
          />
          <ResultCard
            label="Annual Retirement Income"
            value={formatCurrency(retirementIncome)}
            subtext={`At ${safeWithdrawalRate}% withdrawal rate`}
          />
          <ResultCard
            label="Conservative Estimate"
            value={formatCurrency(conservativeFV)}
            subtext={`At ${Math.max(0, safeReturn - 2).toFixed(1)}% return`}
          />
          <ResultCard
            label="Optimistic Estimate"
            value={formatCurrency(optimisticFV)}
            subtext={`At ${(safeReturn + 2).toFixed(1)}% return`}
          />
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Portfolio Value", "FIRE Target", "Contributions"]}
        title="Path to Financial Independence"
      />
      <CalculatorInput
        input={{
          id: "currentAge",
          label: "Current Age",
          type: "number",
          defaultValue: 30,
          suffix: "years",
          min: 18,
          max: 80,
          tooltip: "Your current age.",
        }}
        value={currentAge}
        onChange={setCurrentAge}
      />
      <CalculatorInput
        input={{
          id: "retirementAge",
          label: "Target Retirement Age",
          type: "number",
          defaultValue: 45,
          suffix: "years",
          min: 20,
          max: 80,
          tooltip: "The age at which you want to achieve financial independence and retire early.",
        }}
        value={retirementAge}
        onChange={setRetirementAge}
      />
      <CalculatorInput
        input={{
          id: "annualExpenses",
          label: "Annual Expenses in Retirement",
          type: "number",
          defaultValue: 40000,
          suffix: "$",
          min: 0,
          tooltip: "Your expected annual living expenses during retirement. Be realistic — include healthcare, housing, and discretionary spending.",
        }}
        value={annualExpenses}
        onChange={setAnnualExpenses}
      />
      <CalculatorInput
        input={{
          id: "currentSavings",
          label: "Current Portfolio Value",
          type: "number",
          defaultValue: 100000,
          suffix: "$",
          min: 0,
          tooltip: "The total value of your current investments and retirement accounts.",
        }}
        value={currentSavings}
        onChange={setCurrentSavings}
      />
      <CalculatorInput
        input={{
          id: "monthlyContribution",
          label: "Monthly Contribution",
          type: "number",
          defaultValue: 3000,
          suffix: "$",
          min: 0,
          tooltip: "How much you invest each month toward your FIRE goal.",
        }}
        value={monthlyContribution}
        onChange={setMonthlyContribution}
      />
      <CalculatorInput
        input={{
          id: "expectedReturn",
          label: "Expected Annual Return",
          type: "number",
          defaultValue: 7,
          suffix: "%",
          min: 0,
          max: 30,
          step: 0.1,
          tooltip: "Expected average annual investment return. 7% is a common estimate for stock market returns after inflation.",
        }}
        value={expectedReturn}
        onChange={setExpectedReturn}
      />
      <CalculatorInput
        input={{
          id: "withdrawalRate",
          label: "Safe Withdrawal Rate",
          type: "number",
          defaultValue: 4,
          suffix: "%",
          min: 0.5,
          max: 15,
          step: 0.1,
          tooltip: "The percentage of your portfolio you plan to withdraw annually. The classic FIRE movement uses the '4% rule'.",
        }}
        value={withdrawalRate}
        onChange={setWithdrawalRate}
      />
    </CalculatorLayout>
  );
}
