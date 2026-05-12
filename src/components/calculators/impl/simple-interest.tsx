"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency } from "@/lib/utils";

export default function SimpleInterestCalculator() {
  const [principal, setPrincipal] = React.useState(10000);
  const [rate, setRate] = React.useState(5);
  const [timeValue, setTimeValue] = React.useState(5);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");

  const safePrincipal = Math.max(0, principal ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));

  const r = safeRate / 100;
  const t = Math.max(0, toMonths(timeValue, timeUnit) / 12);
  const interest = safePrincipal * r * t;
  const totalAmount = safePrincipal + interest;
  const safeInterest = isNaN(interest) || !isFinite(interest) ? 0 : interest;
  const safeTotal = isNaN(totalAmount) || !isFinite(totalAmount) ? 0 : totalAmount;

  const maxYears = Math.min(Math.max(Math.ceil(t), 1), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Total Amount": Math.round(safePrincipal + safePrincipal * r * i),
    "Interest": Math.round(safePrincipal * r * i),
    Principal: Math.round(safePrincipal),
  }));

  return (
    <CalculatorLayout
      title="Simple Interest"
      description="Calculate simple interest on loans and investments with clear principal and rate breakdowns."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Amount" value={formatCurrency(safeTotal)} highlight subtext={`${formatCurrency(safePrincipal)} principal + ${formatCurrency(safeInterest)} interest`} />
          <ResultCard label="Interest Earned" value={formatCurrency(safeInterest)} subtext={`At ${safeRate}% for ${t.toFixed(1)} years`} />
          <ResultCard label="Principal" value={formatCurrency(safePrincipal)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Total Amount", "Interest", "Principal"]} title="Growth Over Time" />
      <CalculatorInput input={{ id: "principal", label: "Principal Amount", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The initial amount of money being invested or borrowed." }} value={principal} onChange={setPrincipal} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual simple interest rate." }} value={rate} onChange={setRate} />
      <PeriodInput
        id="time-period"
        label="Time Period"
        value={timeValue}
        unit={timeUnit}
        onValueChange={setTimeValue}
        onUnitChange={setTimeUnit}
        min={1}
        max={50}
      />
    </CalculatorLayout>
  );
}
