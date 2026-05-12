"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function ARMCalculator() {
  const [loanAmount, setLoanAmount] = React.useState(300000);
  const [initialRate, setInitialRate] = React.useState(5);
  const [initialPeriod, setInitialPeriod] = React.useState(5);
  const [initialPeriodUnit, setInitialPeriodUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [adjustmentRate, setAdjustmentRate] = React.useState(2);
  const [adjustmentCap, setAdjustmentCap] = React.useState(2);
  const [lifetimeCap, setLifetimeCap] = React.useState(6);
  const [margin, setMargin] = React.useState(2.25);
  const [indexRate, setIndexRate] = React.useState(3);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeAmount = Math.max(0, loanAmount ?? 0);
  const safeInitialRate = Math.max(0, Math.min(initialRate ?? 0, 20));
  const safeAdjRate = Math.max(0, Math.min(adjustmentRate ?? 0, 10));
  const safeAdjCap = Math.max(0, Math.min(adjustmentCap ?? 0, 10));
  const safeLifetimeCap = Math.max(0, Math.min(lifetimeCap ?? 0, 15));
  const safeMargin = Math.max(0, Math.min(margin ?? 0, 10));
  const safeIndex = Math.max(0, Math.min(indexRate ?? 0, 15));

  const termMonths = Math.max(1, toMonths(term, termUnit));
  const initialMonths = Math.max(1, toMonths(initialPeriod, initialPeriodUnit));

  // Initial payment
  const initialPayment = isFinite(calcMonthlyPayment(safeAmount, safeInitialRate, termMonths))
    ? calcMonthlyPayment(safeAmount, safeInitialRate, termMonths) : 0;

  const remainingMonths = Math.max(1, termMonths - initialMonths);

  const computedNewRate = Math.min(
    safeIndex + safeMargin,
    safeInitialRate + safeAdjCap,
    safeInitialRate + safeLifetimeCap,
  );

  // First find balance after initial period
  const mr = safeInitialRate / 100 / 12;
  let balanceAfterInitial = safeAmount;
  for (let m = 1; m <= initialMonths; m++) {
    const interest = balanceAfterInitial * mr;
    const principalPmt = initialPayment - interest;
    balanceAfterInitial = Math.max(0, balanceAfterInitial - principalPmt);
  }

  const adjustedPayment = isFinite(calcMonthlyPayment(balanceAfterInitial, computedNewRate, remainingMonths))
    ? calcMonthlyPayment(balanceAfterInitial, computedNewRate, remainingMonths) : 0;

  // Max possible rate (worst case): initial_rate + lifetime_cap
  const maxRate = safeInitialRate + safeLifetimeCap;
  const maxPayment = isFinite(calcMonthlyPayment(balanceAfterInitial, maxRate, remainingMonths))
    ? calcMonthlyPayment(balanceAfterInitial, maxRate, remainingMonths) : 0;

  // Chart data: rate path over time (max 36 points)
  const chartStep = Math.max(1, Math.floor(term / 36));
  const chartData: { year: string; Rate: number }[] = [];
  for (let y = 1; y <= term; y += chartStep) {
    let rateAtYear = safeInitialRate;
    if (y > initialPeriod) {
      rateAtYear = Math.min(safeInitialRate + (y - initialPeriod) * safeAdjRate, maxRate);
      rateAtYear = Math.min(rateAtYear, safeIndex + safeMargin);
    }
    chartData.push({
      year: `Yr ${y}`,
      Rate: Math.round(rateAtYear * 100) / 100,
    });
  }

  return (
    <CalculatorLayout
      title="ARM Calculator 📈"
      description="Project adjustable-rate mortgage payments with rate caps, indexes, and adjustment periods."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Initial Monthly Payment" value={formatCurrency(initialPayment)} subtext={`${formatNumber(safeInitialRate)}% for ${formatNumber(initialPeriod)} ${initialPeriodUnit}`} />
          <ResultCard label="Post-Adjustment Payment" value={formatCurrency(adjustedPayment)} subtext={`New rate: ${computedNewRate.toFixed(2)}%`} />
          <ResultCard label="Max Possible Payment" value={formatCurrency(maxPayment)} subtext={`Worst case: ${maxRate.toFixed(2)}%`} highlight />
          <ResultCard label="Index + Margin" value={formatPercentage((safeIndex + safeMargin) / 100)} subtext={`Index: ${formatNumber(safeIndex)}% + Margin: ${formatNumber(safeMargin)}%`} />
          <ResultCard label="Lifetime Cap" value={`${formatNumber(safeLifetimeCap)}%`} subtext={`Max rate: ${(safeInitialRate + safeLifetimeCap).toFixed(2)}%`} />
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Rate"]}
        title="Interest Rate Path Over Time"
      />
      <CalculatorInput
        input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 300000, suffix: "$", min: 0 }}
        value={loanAmount}
        onChange={setLoanAmount}
      />
      <CalculatorInput
        input={{ id: "initialRate", label: "Initial Interest Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 20, step: 0.1 }}
        value={initialRate}
        onChange={setInitialRate}
      />
      <PeriodInput id="initialPeriod" label="Initial Fixed Period" value={initialPeriod} unit={initialPeriodUnit} onValueChange={setInitialPeriod} onUnitChange={setInitialPeriodUnit} min={1} max={30} />
      <CalculatorInput
        input={{ id: "adjustmentRate", label: "Periodic Adjustment Rate", type: "number", defaultValue: 2, suffix: "%", min: 0, max: 5, step: 0.25, tooltip: "Rate change per adjustment period" }}
        value={adjustmentRate}
        onChange={setAdjustmentRate}
      />
      <CalculatorInput
        input={{ id: "adjustmentCap", label: "First Adjustment Cap", type: "number", defaultValue: 2, suffix: "%", min: 0, max: 10, step: 0.25, tooltip: "Max rate increase at first adjustment" }}
        value={adjustmentCap}
        onChange={setAdjustmentCap}
      />
      <CalculatorInput
        input={{ id: "lifetimeCap", label: "Lifetime Interest Cap", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 15, step: 0.25, tooltip: "Maximum total rate increase over the life of the loan" }}
        value={lifetimeCap}
        onChange={setLifetimeCap}
      />
      <CalculatorInput
        input={{ id: "margin", label: "Lender Margin", type: "number", defaultValue: 2.25, suffix: "%", min: 0, max: 5, step: 0.25, tooltip: "Margin added to index rate" }}
        value={margin}
        onChange={setMargin}
      />
      <CalculatorInput
        input={{ id: "indexRate", label: "Index Rate (SOFR/CMT)", type: "number", defaultValue: 3, suffix: "%", min: 0, max: 15, step: 0.1, tooltip: "Current benchmark index rate (e.g., SOFR, 1-Year CMT)" }}
        value={indexRate}
        onChange={setIndexRate}
      />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} />
    </CalculatorLayout>
  );
}
