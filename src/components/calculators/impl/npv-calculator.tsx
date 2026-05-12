"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

function calculateNPV(initialInvestment: number, cashFlows: number[], rate: number): number {
  let npv = initialInvestment;
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i]! / Math.pow(1 + rate / 100, i + 1);
  }
  return npv;
}

function calculateDiscountedCashFlows(initialInvestment: number, cashFlows: number[], rate: number): number[] {
  return cashFlows.map((cf, i) => cf / Math.pow(1 + rate / 100, i + 1));
}

export default function NPVCalculator() {
  const [initialInvestment, setInitialInvestment] = React.useState(-100000);
  const [discountRate, setDiscountRate] = React.useState(10);
  const [cf1, setCf1] = React.useState(20000);
  const [cf2, setCf2] = React.useState(25000);
  const [cf3, setCf3] = React.useState(30000);
  const [cf4, setCf4] = React.useState(35000);
  const [cf5, setCf5] = React.useState(40000);

  const cashFlows = [cf1, cf2, cf3, cf4, cf5];
  const safeRate = Math.max(0, Math.min(discountRate ?? 0, 100));
  const npv = calculateNPV(initialInvestment, cashFlows, safeRate);
  const absInitial = Math.max(0, Math.abs(initialInvestment));
  const profitabilityIndex = absInitial > 0 ? (npv + absInitial) / absInitial : 0;
  const decision = npv > 0 ? "Accept" : "Reject";

  const safeNpv = isNaN(npv) || !isFinite(npv) ? 0 : npv;
  const safePi = isNaN(profitabilityIndex) || !isFinite(profitabilityIndex) ? 0 : profitabilityIndex;

  const discountedCFs = calculateDiscountedCashFlows(initialInvestment, cashFlows, safeRate);
  let cumulative = 0;
  const chartData = discountedCFs.map((dcf, i) => {
    cumulative += dcf;
    return {
      year: `Year ${i + 1}`,
      "Cumulative Discounted CF": Math.round(cumulative * 100) / 100,
    };
  });

  return (
    <CalculatorLayout
      title="NPV Calculator"
      description="Calculate Net Present Value and Profitability Index to evaluate an investment project."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Net Present Value" value={formatCurrency(safeNpv)} highlight subtext={safeNpv > 0 ? "Positive — value-creating" : "Negative — value-destroying"} />
          <ResultCard label="Profitability Index" value={safePi.toFixed(2)} subtext={safePi > 1 ? "> 1.0 — favorable" : "< 1.0 — unfavorable"} />
          <ResultCard
            label="Decision"
            value={decision}
            className={
              decision === "Accept"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }
          />
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={chartData}
        xKey="year"
        yKey="Cumulative Discounted CF"
        title="Cumulative Discounted Cash Flows"
      />
      <CalculatorInput
        input={{ id: "npv_initial", label: "Initial Investment", type: "number", defaultValue: -100000, suffix: "$", tooltip: "The upfront investment amount (negative value = cash outflow)." }}
        value={initialInvestment}
        onChange={setInitialInvestment}
      />
      <CalculatorInput
        input={{ id: "npv_rate", label: "Discount Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The required rate of return for discounting future cash flows." }}
        value={discountRate}
        onChange={setDiscountRate}
      />
      <CalculatorInput
        input={{ id: "npv_cf1", label: "Year 1 Cash Flow", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 1." }}
        value={cf1}
        onChange={setCf1}
      />
      <CalculatorInput
        input={{ id: "npv_cf2", label: "Year 2 Cash Flow", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 2." }}
        value={cf2}
        onChange={setCf2}
      />
      <CalculatorInput
        input={{ id: "npv_cf3", label: "Year 3 Cash Flow", type: "number", defaultValue: 30000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 3." }}
        value={cf3}
        onChange={setCf3}
      />
      <CalculatorInput
        input={{ id: "npv_cf4", label: "Year 4 Cash Flow", type: "number", defaultValue: 35000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 4." }}
        value={cf4}
        onChange={setCf4}
      />
      <CalculatorInput
        input={{ id: "npv_cf5", label: "Year 5 Cash Flow", type: "number", defaultValue: 40000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 5." }}
        value={cf5}
        onChange={setCf5}
      />
    </CalculatorLayout>
  );
}
