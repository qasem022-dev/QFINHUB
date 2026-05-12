"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput } from "..";
import type { PeriodUnit } from "..";
import { toPeriods } from "..";
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
  const [numPeriods, setNumPeriods] = React.useState(10);
  const [numPeriodsUnit, setNumPeriodsUnit] = React.useState<PeriodUnit>("years");
  const [cashFlows, setCashFlows] = React.useState<number[]>([8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000, 24000, 26000]);
  const [discountRate, setDiscountRate] = React.useState(10);

  const safePeriods = Math.max(1, Math.min(50, Math.round(toPeriods(numPeriods, numPeriodsUnit))));

  // Adjust cash flows array when period count changes
  React.useEffect(() => {
    setCashFlows(prev => {
      if (prev.length === safePeriods) return prev;
      if (prev.length < safePeriods) {
        return [...prev, ...Array(safePeriods - prev.length).fill(0)];
      }
      return prev.slice(0, safePeriods);
    });
  }, [safePeriods]);

  const activeCashFlows = cashFlows.slice(0, safePeriods);
  const safeDiscountRate = Math.max(0, Math.min(discountRate ?? 0, 100));
  const irr = calculateIRR(initialInvestment, activeCashFlows);
  const npv = calculateNPV(initialInvestment, activeCashFlows, safeDiscountRate);
  const payback = calculatePaybackPeriod(initialInvestment, activeCashFlows);

  const safeIrr = isNaN(irr) || !isFinite(irr) ? 0 : irr;
  const safeNpv = isNaN(npv) || !isFinite(npv) ? 0 : npv;

  const paybackDisplay = payback <= safePeriods
    ? `${Math.floor(payback)} yrs ${Math.round((payback - Math.floor(payback)) * 12)} mos`
    : `>${safePeriods} years`;

  const chartData = activeCashFlows.map((cf, i) => ({
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
      <CalculatorChart type="bar" data={chartData} xKey="year" yKey="Cash Flow" title="Period Cash Flows" />
      <CalculatorInput
        input={{ id: "irr_initial", label: "Initial Investment", type: "number", defaultValue: -50000, suffix: "$", tooltip: "The upfront investment amount (negative value represents cash outflow)." }}
        value={initialInvestment}
        onChange={setInitialInvestment}
      />
      <PeriodInput id="irr_periods" label="Number of Periods" value={numPeriods} unit={numPeriodsUnit} onValueChange={setNumPeriods} onUnitChange={setNumPeriodsUnit} min={1} max={50} />
      {activeCashFlows.map((cf, i) => (
        <CalculatorInput
          key={`cf_${i}`}
          input={{ id: `irr_cf${i + 1}`, label: `Period ${i + 1} Cash Flow`, type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: `Expected cash inflow in period ${i + 1}.` }}
          value={cf}
          onChange={(v) => setCashFlows(prev => { const next = [...prev]; next[i] = v; return next; })}
        />
      ))}
      <CalculatorInput
        input={{ id: "irr_discount", label: "Discount Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The rate used to discount future cash flows for NPV calculation." }}
        value={discountRate}
        onChange={setDiscountRate}
      />
    </CalculatorLayout>
  );
}
