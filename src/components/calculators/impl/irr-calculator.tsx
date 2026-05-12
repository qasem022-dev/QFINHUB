"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

function calculateIRR(initialInvestment: number, cashFlows: number[]): number {
  let guess = 0.1;
  for (let iter = 0; iter < 1000; iter++) {
    let npv = initialInvestment;
    let dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const year = i + 1;
      const factor = Math.pow(1 + guess, year);
      const cf = cashFlows[i]!;
      npv += cf / factor;
      dnpv -= (year * cf) / Math.pow(1 + guess, year + 1);
    }
    if (Math.abs(dnpv) < 1e-10) {
      if (Math.abs(npv) < 1e-10) return guess;
      return 0; // failed to converge — dnpv too small
    }
    const nextGuess = guess - npv / dnpv;
    if (Math.abs(nextGuess - guess) < 0.0001) return nextGuess;
    guess = nextGuess;
  }
  // Check if final guess is reasonable
  return isFinite(guess) && Math.abs(guess) < 10 ? guess : 0;
}

function calculateNPV(initialInvestment: number, cashFlows: number[], rate: number): number {
  let npv = initialInvestment;
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i]! / Math.pow(1 + rate / 100, i + 1);
  }
  return npv;
}

function calculatePaybackPeriod(initialInvestment: number, cashFlows: number[]): number {
  const absInvestment = Math.abs(initialInvestment);
  let cumulative = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    const cf = cashFlows[i]!;
    cumulative += cf;
    if (cumulative >= absInvestment) {
      const prevCumulative = cumulative - cf;
      const fraction = (absInvestment - prevCumulative) / cf;
      return i + fraction;
    }
  }
  return cashFlows.length;
}

export default function IRRCalculator() {
  const [initialInvestment, setInitialInvestment] = React.useState(-50000);
  const [cf1, setCf1] = React.useState(8000);
  const [cf2, setCf2] = React.useState(10000);
  const [cf3, setCf3] = React.useState(12000);
  const [cf4, setCf4] = React.useState(14000);
  const [cf5, setCf5] = React.useState(16000);
  const [cf6, setCf6] = React.useState(18000);
  const [cf7, setCf7] = React.useState(20000);
  const [cf8, setCf8] = React.useState(22000);
  const [cf9, setCf9] = React.useState(24000);
  const [cf10, setCf10] = React.useState(26000);
  const [discountRate, setDiscountRate] = React.useState(10);

  const cashFlows = [cf1, cf2, cf3, cf4, cf5, cf6, cf7, cf8, cf9, cf10];
  const safeDiscountRate = Math.max(0, Math.min(discountRate ?? 0, 100));
  const irr = calculateIRR(initialInvestment, cashFlows);
  const npv = calculateNPV(initialInvestment, cashFlows, safeDiscountRate);
  const payback = calculatePaybackPeriod(initialInvestment, cashFlows);

  const safeIrr = isNaN(irr) || !isFinite(irr) ? 0 : irr;
  const safeNpv = isNaN(npv) || !isFinite(npv) ? 0 : npv;

  const paybackDisplay = payback <= 10
    ? `${Math.floor(payback)} yrs ${Math.round((payback - Math.floor(payback)) * 12)} mos`
    : ">10 years";

  const chartData = cashFlows.map((cf, i) => ({
    year: `Year ${i + 1}`,
    "Cash Flow": cf,
  }));

  return (
    <CalculatorLayout
      title="IRR Calculator"
      description="Calculate Internal Rate of Return, Net Present Value, and Payback Period for an investment project."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Internal Rate of Return" value={formatPercentage(safeIrr)} highlight subtext={safeIrr > safeDiscountRate / 100 ? "Exceeds discount rate" : "Below discount rate"} />
          <ResultCard label="Net Present Value" value={formatCurrency(safeNpv)} />
          <ResultCard label="Payback Period" value={paybackDisplay} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="year" yKey="Cash Flow" title="Annual Cash Flows" />
      <CalculatorInput
        input={{ id: "irr_initial", label: "Initial Investment", type: "number", defaultValue: -50000, suffix: "$", tooltip: "The upfront investment amount (negative value represents cash outflow)." }}
        value={initialInvestment}
        onChange={setInitialInvestment}
      />
      <CalculatorInput
        input={{ id: "irr_cf1", label: "Year 1 Cash Flow", type: "number", defaultValue: 8000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 1." }}
        value={cf1}
        onChange={setCf1}
      />
      <CalculatorInput
        input={{ id: "irr_cf2", label: "Year 2 Cash Flow", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 2." }}
        value={cf2}
        onChange={setCf2}
      />
      <CalculatorInput
        input={{ id: "irr_cf3", label: "Year 3 Cash Flow", type: "number", defaultValue: 12000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 3." }}
        value={cf3}
        onChange={setCf3}
      />
      <CalculatorInput
        input={{ id: "irr_cf4", label: "Year 4 Cash Flow", type: "number", defaultValue: 14000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 4." }}
        value={cf4}
        onChange={setCf4}
      />
      <CalculatorInput
        input={{ id: "irr_cf5", label: "Year 5 Cash Flow", type: "number", defaultValue: 16000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 5." }}
        value={cf5}
        onChange={setCf5}
      />
      <CalculatorInput
        input={{ id: "irr_cf6", label: "Year 6 Cash Flow", type: "number", defaultValue: 18000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 6." }}
        value={cf6}
        onChange={setCf6}
      />
      <CalculatorInput
        input={{ id: "irr_cf7", label: "Year 7 Cash Flow", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 7." }}
        value={cf7}
        onChange={setCf7}
      />
      <CalculatorInput
        input={{ id: "irr_cf8", label: "Year 8 Cash Flow", type: "number", defaultValue: 22000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 8." }}
        value={cf8}
        onChange={setCf8}
      />
      <CalculatorInput
        input={{ id: "irr_cf9", label: "Year 9 Cash Flow", type: "number", defaultValue: 24000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 9." }}
        value={cf9}
        onChange={setCf9}
      />
      <CalculatorInput
        input={{ id: "irr_cf10", label: "Year 10 Cash Flow", type: "number", defaultValue: 26000, suffix: "$", min: 0, tooltip: "Expected cash inflow in year 10." }}
        value={cf10}
        onChange={setCf10}
      />
      <CalculatorInput
        input={{ id: "irr_discount", label: "Discount Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The rate used to discount future cash flows for NPV calculation." }}
        value={discountRate}
        onChange={setDiscountRate}
      />
    </CalculatorLayout>
  );
}
