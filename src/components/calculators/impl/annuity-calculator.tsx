"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function AnnuityCalculator() {
  const [payment, setPayment] = React.useState(1000);
  const [rate, setRate] = React.useState(5);
  const [periods, setPeriods] = React.useState(20);
  const [periodUnit, setPeriodUnit] = React.useState<PeriodUnit>("years");
  const [annuityType, setAnnuityType] = React.useState(0); // 0 = ordinary, 1 = due

  const safePayment = Math.max(0, payment ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safePeriods = Math.max(1, Math.round(toMonths(periods, periodUnit) / 12));

  const r = safeRate / 100;
  const n = safePeriods;

  // Future Value
  const fvOrdinary = r !== 0 ? safePayment * ((Math.pow(1 + r, n) - 1) / r) : safePayment * n;
  const fv = annuityType === 0 ? fvOrdinary : fvOrdinary * (1 + r);

  // Present Value
  const pvOrdinary = r !== 0 ? safePayment * ((1 - Math.pow(1 + r, -n)) / r) : safePayment * n;
  const pv = annuityType === 0 ? pvOrdinary : pvOrdinary * (1 + r);

  const totalPayments = safePayment * n;

  const safeFv = isNaN(fv) || !isFinite(fv) ? 0 : fv;
  const safePv = isNaN(pv) || !isFinite(pv) ? 0 : pv;

  // Chart data - growth over time
  const maxPeriods = Math.min(n, 36);
  const chartData = Array.from({ length: maxPeriods + 1 }, (_, i) => ({
    period: `Year ${i}`,
    "Future Value": Math.round(
      r !== 0
        ? safePayment * ((Math.pow(1 + r, i) - 1) / r) * (annuityType === 0 ? 1 : 1 + r)
        : safePayment * i * (annuityType === 0 ? 1 : 1)
    ),
  }));

  const comparisonData = [
    { type: "Ordinary FV", value: Math.round(fvOrdinary) },
    { type: "Due FV", value: Math.round(fvOrdinary * (1 + r)) },
    { type: "Ordinary PV", value: Math.round(pvOrdinary) },
    { type: "Due PV", value: Math.round(pvOrdinary * (1 + r)) },
  ];

  return (
    <CalculatorLayout
      title="Annuity Calculator"
      description="Calculate the future value and present value of an annuity with ordinary or annuity-due payment schedules."
      icon={<span>📆</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Future Value" value={formatCurrency(safeFv)} highlight subtext={annuityType === 0 ? "Ordinary annuity (end)" : "Annuity due (beginning)"} />
          <ResultCard label="Present Value" value={formatCurrency(safePv)} />
          <ResultCard label="Total Payments" value={formatCurrency(totalPayments)} subtext={`${n} payments of ${formatCurrency(safePayment)}`} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="period" yKey={["Future Value"]} title="Annuity Growth Over Time" />
      <CalculatorChart type="bar" data={comparisonData} xKey="type" yKey="value" title="Ordinary vs Due Comparison" />
      <CalculatorInput
        input={{ id: "payment", label: "Payment Amount", type: "number", defaultValue: 1000, suffix: "$", min: 0, step: 10, tooltip: "Amount paid/received each period." }}
        value={payment}
        onChange={setPayment}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Periodic interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput
        id="periods"
        label="Number of Periods"
        value={periods}
        unit={periodUnit}
        onValueChange={setPeriods}
        onUnitChange={setPeriodUnit}
        min={1}
        max={100}
      />
      <CalculatorInput
        input={{ id: "annuityType", label: "Annuity Type", type: "select", defaultValue: 0, options: [{ label: "Ordinary (end)", value: 0 }, { label: "Annuity Due (beginning)", value: 1 }], tooltip: "Ordinary pays at end of period; Due pays at beginning." }}
        value={annuityType}
        onChange={setAnnuityType}
      />
    </CalculatorLayout>
  );
}
