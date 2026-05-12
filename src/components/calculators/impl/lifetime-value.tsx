"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput, toMonths, toPeriods } from "..";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

export default function LifetimeValueCalculator() {
  const [purchaseValue, setPurchaseValue] = React.useState(100);
  const [frequency, setFrequency] = React.useState(4);
  const [retentionRate, setRetentionRate] = React.useState(75);
  const [cac, setCac] = React.useState(200);
  const [grossMargin, setGrossMargin] = React.useState(40);
  const [lifespanValue, setLifespanValue] = React.useState(1);
  const [lifespanUnit, setLifespanUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const churnRate = 1 - retentionRate / 100;
  const avgLifespan = churnRate > 0 ? 1 / churnRate : Infinity;
  const annualRevenue = purchaseValue * frequency;
  const rawLtv = isFinite(avgLifespan) ? annualRevenue * avgLifespan * (grossMargin / 100) : Infinity;
  const ltv = isFinite(rawLtv) ? rawLtv : 0;
  const ltvCacRatio = cac > 0 && isFinite(ltv) ? ltv / cac : 0;

  // Lifespan in user-selected unit
  const lifespanInMonths = isFinite(avgLifespan) ? avgLifespan * 12 : Infinity;
  const safeLifespanValue = isFinite(lifespanValue) ? Math.max(1, lifespanValue) : 1;
  const displayLifespan = isFinite(avgLifespan)
    ? avgLifespan * (lifespanUnit === "years" ? 1 : lifespanUnit === "months" ? 12 : lifespanUnit === "weeks" ? 52 : 365)
    : Infinity;

  // LTV over user-selected period
  const periodYears = toMonths(safeLifespanValue, lifespanUnit) / 12;
  const ltvOverPeriod = periodYears > 0 && isFinite(avgLifespan)
    ? Math.min(periodYears, avgLifespan) * annualRevenue * (grossMargin / 100)
    : 0;

  const chartData = [
    { name: "LTV", value: isFinite(ltv) ? Math.round(ltv * 100) / 100 : 0 },
    { name: "CAC", value: isFinite(cac) ? Math.round(cac * 100) / 100 : 0 },
  ];

  const lifespanUnitLabel = lifespanUnit === "years" ? "yr" : lifespanUnit === "months" ? "mo" : lifespanUnit === "weeks" ? "wk" : "day";

  return (
    <CalculatorLayout
      title="Customer Lifetime Value (LTV) Calculator"
      description="Calculate customer lifetime value, LTV/CAC ratio, and customer lifespan based on purchase behavior and retention."
      icon={<span>💎</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Customer Lifetime Value" value={isFinite(ltv) ? formatCurrency(ltv) : "∞"} highlight />
          <ResultCard label="LTV / CAC Ratio" value={isFinite(ltvCacRatio) ? formatNumber(ltvCacRatio, 2) : "∞"} subtext={isFinite(ltvCacRatio) ? (ltvCacRatio >= 3 ? "Healthy ratio ✓" : "Below 3x target ✗") : "Infinite retention"} />
          <ResultCard label="Customer Lifespan" value={isFinite(displayLifespan) ? `${formatNumber(displayLifespan, 1)} ${lifespanUnitLabel}${displayLifespan > 1 ? 's' : ''}` : "∞"} subtext={isFinite(avgLifespan) ? "Based on retention rate" : "100% retention"} />
          <ResultCard label={`LTV (${safeLifespanValue} ${lifespanUnitLabel}${safeLifespanValue > 1 ? 's' : ''})`} value={isFinite(ltvOverPeriod) ? formatCurrency(ltvOverPeriod) : "∞"} subtext={isFinite(avgLifespan) ? `Over ${safeLifespanValue} ${lifespanUnitLabel}${safeLifespanValue > 1 ? 's' : ''}` : "Infinite retention"} />
          <ResultCard label="Annual Revenue per Customer" value={formatCurrency(annualRevenue)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="LTV vs CAC" />
      <CalculatorInput input={{ id: "purchaseValue", label: "Avg Purchase Value", type: "number", defaultValue: 100, suffix: "$", min: 0, step: 0.01, tooltip: "Average amount a customer spends per purchase." }} value={purchaseValue} onChange={setPurchaseValue} />
      <CalculatorInput input={{ id: "frequency", label: "Purchase Frequency / Year", type: "number", defaultValue: 4, min: 0, step: 0.1, tooltip: "How many times a customer purchases per year." }} value={frequency} onChange={setFrequency} />
      <CalculatorInput input={{ id: "retentionRate", label: "Customer Retention Rate", type: "number", defaultValue: 75, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Percentage of customers retained year over year. At 100%, customer lifespan is infinite." }} value={retentionRate} onChange={setRetentionRate} />
      <CalculatorInput input={{ id: "cac", label: "Customer Acquisition Cost", type: "number", defaultValue: 200, suffix: "$", min: 0, step: 0.01, tooltip: "Cost to acquire one new customer." }} value={cac} onChange={setCac} />
      <CalculatorInput input={{ id: "grossMargin", label: "Gross Margin", type: "number", defaultValue: 40, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Profit margin percentage on each sale." }} value={grossMargin} onChange={setGrossMargin} />
      <PeriodInput id="lifespanPeriod" label="Display Lifespan In" value={lifespanValue} unit={lifespanUnit} onValueChange={setLifespanValue} onUnitChange={setLifespanUnit} min={1} max={100} />
    </CalculatorLayout>
  );
}
