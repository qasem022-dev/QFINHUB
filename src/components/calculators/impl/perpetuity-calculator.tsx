"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard, PeriodInput } from "..";
import type { PeriodUnit } from "..";
import { toPeriods } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function PerpetuityCalculator() {
  const [payment, setPayment] = React.useState(1000);
  const [discountRate, setDiscountRate] = React.useState(5);
  const [growthRate, setGrowthRate] = React.useState(0);
  const [payFreq, setPayFreq] = React.useState(1);
  const [payFreqUnit, setPayFreqUnit] = React.useState<PeriodUnit>("years");

  const safePayment = Math.max(0, payment ?? 0);
  const safeR = Math.max(0.01, Math.min(discountRate ?? 0, 100)) / 100;
  const safeG = Math.max(0, Math.min(growthRate ?? 0, 50)) / 100;

  // Convert periodic payment to annual equivalent
  const periodsPerYear = 12 / Math.max(1, toPeriods(payFreq, payFreqUnit));
  const annualPayment = safePayment * periodsPerYear;

  let pv = 0;
  let label = "Constant Perpetuity";

  if (safeG === 0 && safeR > 0) {
    pv = annualPayment / safeR;
    label = "Constant Perpetuity";
  } else if (safeG > 0 && safeR > safeG) {
    pv = annualPayment / (safeR - safeG);
    label = "Growing Perpetuity";
  } else if (safeR <= 0) {
    pv = Infinity;
    label = "Invalid — rate must be positive";
  } else {
    pv = Infinity;
    label = "Invalid — growth rate must be less than discount rate";
  }

  const displayPv = pv === Infinity ? "N/A" : formatCurrency(pv);
  const annualPv = annualPayment / safeR;

  const barData = [
    { metric: "Annual Payment", value: Math.round(annualPayment) },
    { metric: "PV (No Growth)", value: Math.round(annualPv) },
    { metric: "PV (With Growth)", value: safeG > 0 && safeR > safeG ? Math.round(annualPayment / (safeR - safeG)) : 0 },
  ];

  return (
    <CalculatorLayout
      title="Perpetuity Calculator"
      description="Calculate the present value of a perpetuity — a stream of equal payments continuing indefinitely."
      icon={<span>♾️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Present Value" value={displayPv} highlight subtext={pv !== Infinity ? `At ${discountRate}% discount rate` : undefined} />
          <ResultCard label="Type" value={label} />
          <ResultCard label="Annual Payment" value={formatCurrency(annualPayment)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={barData} xKey="metric" yKey="value" title="Perpetuity Values ($)" />
      <CalculatorInput
        input={{ id: "payment", label: "Periodic Payment", type: "number", defaultValue: 1000, suffix: "$", min: 0.01, step: 10, tooltip: "The fixed payment amount per period." }}
        value={payment}
        onChange={setPayment}
      />
      <PeriodInput id="payFreq" label="Payment Frequency" value={payFreq} unit={payFreqUnit} onValueChange={setPayFreq} onUnitChange={setPayFreqUnit} min={1} max={12} />
      <CalculatorInput
        input={{ id: "discountRate", label: "Discount Rate", type: "number", defaultValue: 5, suffix: "%", min: 0.01, max: 100, step: 0.1, tooltip: "The required rate of return." }}
        value={discountRate}
        onChange={setDiscountRate}
      />
      <CalculatorInput
        input={{ id: "growthRate", label: "Growth Rate", type: "number", defaultValue: 0, suffix: "%", min: 0, max: 50, step: 0.1, tooltip: "Rate at which payments grow each period (0 for constant perpetuity). Must be less than discount rate." }}
        value={growthRate}
        onChange={setGrowthRate}
      />
    </CalculatorLayout>
  );
}
