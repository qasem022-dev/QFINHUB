"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency } from "@/lib/utils";

export default function CarAffordabilityCalculator() {
  const [monthlyBudget, setMonthlyBudget] = React.useState(500);
  const [downPayment, setDownPayment] = React.useState(5000);
  const [rate, setRate] = React.useState(5);
  const [timeValue, setTimeValue] = React.useState(60);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("months");
  const [tradeIn, setTradeIn] = React.useState(0);

  const safeBudget = isFinite(monthlyBudget) ? monthlyBudget : 0;
  const safeDown = isFinite(downPayment) ? downPayment : 0;
  const safeTrade = isFinite(tradeIn) ? tradeIn : 0;
  const safeTerm = toMonths(timeValue, timeUnit);

  const r = rate / 100 / 12;
  const maxPrice = r > 0 && safeTerm > 0
    ? safeBudget * (1 - Math.pow(1 + r, -safeTerm)) / r + safeDown + safeTrade
    : safeTerm > 0 ? safeBudget * safeTerm + safeDown + safeTrade : safeDown + safeTrade;

  const loanAmount = Math.max(0, maxPrice - safeDown - safeTrade);
  const monthlyPayment = loanAmount > 0 && r > 0 && safeTerm > 0
    ? loanAmount * r * Math.pow(1 + r, safeTerm) / (Math.pow(1 + r, safeTerm) - 1)
    : safeTerm > 0 ? loanAmount / safeTerm : 0;

  return (
    <CalculatorLayout
      title="Car Affordability"
      description="Find out the maximum car price you can afford based on your monthly budget."
      icon={<span>🚗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Maximum Car Price" value={formatCurrency(maxPrice)} highlight />
          <ResultCard label="Estimated Monthly Payment" value={formatCurrency(monthlyPayment)} />
          <ResultCard label="Down Payment + Trade-In" value={formatCurrency(safeDown + safeTrade)} />
          <ResultCard label="Loan Amount" value={formatCurrency(loanAmount)} />
        </div>
      }
    >
      <CalculatorInput input={{ id: "monthly-budget", label: "Monthly Budget", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "How much you can afford to pay per month for a car." }} value={monthlyBudget} onChange={setMonthlyBudget} />
      <CalculatorInput input={{ id: "down-payment", label: "Down Payment", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Cash you can put down upfront." }} value={downPayment} onChange={setDownPayment} />
      <CalculatorInput input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Annual interest rate on the auto loan." }} value={rate} onChange={setRate} />
      <PeriodInput
        id="loan-term"
        label="Loan Term"
        value={timeValue}
        unit={timeUnit}
        onValueChange={setTimeValue}
        onUnitChange={setTimeUnit}
        min={1}
        max={120}
      />
      <CalculatorInput input={{ id: "trade-in", label: "Trade-In Value", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Value of your current vehicle as a trade-in." }} value={tradeIn} onChange={setTradeIn} />
    </CalculatorLayout>
  );
}
