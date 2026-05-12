"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function MonteCarloSimulation() {
  const [initialInvestment, setInitialInvestment] = React.useState(10000);
  const [expectedReturn, setExpectedReturn] = React.useState(8);
  const [volatility, setVolatility] = React.useState(15);
  const [years, setYears] = React.useState(20);
  const [yearsUnit, setYearsUnit] = React.useState<PeriodUnit>("years");
  const [simulations, setSimulations] = React.useState(1000);

  const safeInitial = Math.max(0, initialInvestment ?? 0);
  const safeReturn = Math.max(-100, Math.min(expectedReturn ?? 0, 100));
  const safeVol = Math.max(0.01, Math.min(volatility ?? 0, 100));
  const safeSims = Math.max(100, Math.min(simulations ?? 0, 10000));
  const effectiveYears = Math.min(Math.max(1, Math.round(toMonths(years, yearsUnit) / 12)), 50);

  // Box-Muller transform for normal random
  const normalRandom = (): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const mu = expectedReturn / 100;
  const sigma = volatility / 100;

  // Run all simulations and store final values
  const finalValues: number[] = [];
  // Store percentile paths
  const allPaths: number[][] = [];

  for (let s = 0; s < simulations; s++) {
    let value = initialInvestment;
    const path = [value];
    for (let y = 0; y < effectiveYears; y++) {
      const annualReturn = mu + sigma * normalRandom();
      value *= (1 + annualReturn);
      path.push(value);
    }
    finalValues.push(value);
    if (s < 100) allPaths.push(path); // store first 100 for percentile calc
  }

  // Sort final values for percentiles
  const sorted = [...finalValues].sort((a, b) => a - b);
  const p5 = sorted[Math.floor(0.05 * sorted.length)] ?? 0;
  const p50 = sorted[Math.floor(0.5 * sorted.length)] ?? 0;
  const p95 = sorted[Math.floor(0.95 * sorted.length)] ?? 0;

  const probabilityOfLoss =
    sorted.filter((v) => v < initialInvestment).length / sorted.length;

  // Generate chart data - median path with percentiles
  const chartData: { year: string; "5th Percentile": number; "Median": number; "95th Percentile": number }[] = [];
  for (let y = 0; y <= effectiveYears; y++) {
    const valsAtYear = allPaths.map((p) => p[y] ?? initialInvestment).sort((a, b) => a - b);
    chartData.push({
      year: `Year ${y}`,
      "5th Percentile": Math.round(valsAtYear[Math.floor(0.05 * valsAtYear.length)] ?? 0),
      "Median": Math.round(valsAtYear[Math.floor(0.5 * valsAtYear.length)] ?? 0),
      "95th Percentile": Math.round(valsAtYear[Math.floor(0.95 * valsAtYear.length)] ?? 0),
    });
  }

  return (
    <CalculatorLayout
      title="Monte Carlo Simulation"
      description="Simulate thousands of possible investment outcomes using random sampling to estimate the range of future portfolio values."
      icon={<span>🎲</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Median Final Value" value={formatCurrency(p50)} highlight />
          <ResultCard label="5th Percentile" value={formatCurrency(p5)} subtext="Worst 5% of outcomes" />
          <ResultCard label="95th Percentile" value={formatCurrency(p95)} subtext="Best 5% of outcomes" />
          <ResultCard label="Probability of Loss" value={formatPercentage(probabilityOfLoss * 100)} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["95th Percentile", "Median", "5th Percentile"]} title="Simulated Portfolio Growth" />
      <CalculatorInput
        input={{ id: "initialInvestment", label: "Initial Investment", type: "number", defaultValue: 10000, suffix: "$", min: 0, step: 100, tooltip: "Starting portfolio value." }}
        value={initialInvestment}
        onChange={setInitialInvestment}
      />
      <CalculatorInput
        input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 8, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Expected average annual return." }}
        value={expectedReturn}
        onChange={setExpectedReturn}
      />
      <CalculatorInput
        input={{ id: "volatility", label: "Annual Volatility (Std Dev)", type: "number", defaultValue: 15, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annualized standard deviation of returns." }}
        value={volatility}
        onChange={setVolatility}
      />
      <PeriodInput
        id="years"
        label="Years"
        value={years}
        unit={yearsUnit}
        onValueChange={setYears}
        onUnitChange={setYearsUnit}
        min={1}
        max={100}
      />
      <CalculatorInput
        input={{ id: "simulations", label: "Number of Simulations", type: "number", defaultValue: 1000, min: 100, max: 10000, step: 100, tooltip: "More simulations produce more accurate results." }}
        value={simulations}
        onChange={setSimulations}
      />
    </CalculatorLayout>
  );
}
