"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function TimeValueOfMoney() {
  const [presentValue, setPresentValue] = React.useState(10000);
  const [rate, setRate] = React.useState(7);
  const [periods, setPeriods] = React.useState(10);
  const [periodsUnit, setPeriodsUnit] = React.useState<PeriodUnit>("years");
  const [payment, setPayment] = React.useState(0);

  const safePv = Math.max(0, presentValue ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safePmt = Math.max(0, payment ?? 0);

  const r = safeRate / 100;
  const safeN = Math.max(0, toMonths(periods, periodsUnit) / 12);
  const n = safeN;

  const fv = r !== 0
    ? safePv * Math.pow(1 + r, n) + safePmt * ((Math.pow(1 + r, n) - 1) / r)
    : safePv + safePmt * n;

  const totalContributions = safePv + (isNaN(safePmt * n) ? 0 : safePmt * n);
  const totalInterest = !isNaN(fv) && !isNaN(totalContributions) ? Math.max(0, fv - totalContributions) : 0;

  const safeFv = isNaN(fv) || !isFinite(fv) ? 0 : fv;

  const maxPeriods = Math.min(Math.ceil(n), 36);
  const chartData = Array.from({ length: maxPeriods + 1 }, (_, i) => {
    const y = i;
    const val = r !== 0
      ? safePv * Math.pow(1 + r, y) + safePmt * ((Math.pow(1 + r, y) - 1) / r)
      : safePv + safePmt * y;
    return {
      period: `Period ${y}`,
      Value: isNaN(val) ? 0 : Math.round(val),
    };
  });

  return (
    <CalculatorLayout
      title="Time Value of Money"
      description="Calculate the future value of a lump sum with periodic payments over time."
      icon={<span>⏳</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Future Value" value={formatCurrency(safeFv)} highlight subtext={`From PV: ${formatCurrency(safePv)} + PMT: ${formatCurrency(safePmt)}`} />
          <ResultCard label="Total Contributions" value={formatCurrency(totalContributions)} />
          <ResultCard label="Total Interest Earned" value={formatCurrency(totalInterest)} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="period" yKey="Value" title="Value Over Time" height={250} />
      <CalculatorInput
        input={{ id: "presentValue", label: "Present Value", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The initial lump sum amount (PV)." }}
        value={presentValue}
        onChange={setPresentValue}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput
        id="periods"
        label="Number of Periods"
        value={periods}
        unit={periodsUnit}
        onValueChange={setPeriods}
        onUnitChange={setPeriodsUnit}
        min={1}
        max={50}
      />
      <CalculatorInput
        input={{ id: "payment", label: "Periodic Payment", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Additional payment made each period (PMT)." }}
        value={payment}
        onChange={setPayment}
      />
    </CalculatorLayout>
  );
}
