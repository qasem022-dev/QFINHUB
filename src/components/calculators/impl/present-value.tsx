"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency } from "@/lib/utils";

export default function PresentValueCalculator() {
  const [futureValue, setFutureValue] = React.useState(100000);
  const [rate, setRate] = React.useState(7);
  const [timeValue, setTimeValue] = React.useState(10);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");
  const [compounding, setCompounding] = React.useState(12);

  const safeFv = Math.max(0, futureValue ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeCompounding = Math.max(1, compounding ?? 1);

  const r = safeRate / 100;
  const n = safeCompounding;
  const t = Math.max(0.01, toMonths(timeValue, timeUnit) / 12);

  const presentValue = safeFv / Math.pow(1 + r / n, n * t);
  const discountFactor = 1 / Math.pow(1 + r / n, n * t);
  const totalDiscount = safeFv - presentValue;

  const safePv = isNaN(presentValue) || !isFinite(presentValue) ? 0 : presentValue;
  const safeDiscount = isNaN(totalDiscount) || !isFinite(totalDiscount) ? 0 : totalDiscount;
  const safeDiscountFactor = isNaN(discountFactor) || !isFinite(discountFactor) ? 0 : discountFactor;

  const maxYears = Math.min(Math.ceil(t), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Present Value": Math.round(safeFv / Math.pow(1 + r / n, n * i)),
    "Future Value": Math.round(safeFv),
  }));

  return (
    <CalculatorLayout
      title="Present Value"
      description="Calculate the present value of a future sum of money adjusted for time value and compounding frequency."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Present Value"
            value={formatCurrency(safePv)}
            highlight
          />
          <ResultCard
            label="Discount Factor"
            value={safeDiscountFactor.toFixed(4)}
            subtext={`${(safeDiscountFactor * 100).toFixed(2)}% of future value`}
          />
          <ResultCard
            label="Total Discount"
            value={formatCurrency(safeDiscount)}
            subtext={`${safeFv > 0 ? ((safeDiscount / safeFv) * 100).toFixed(1) : 0}% of future value`}
          />
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Present Value", "Future Value"]}
        title="Present Value Over Time"
      />
      <CalculatorInput
        input={{ id: "futureValue", label: "Future Value", type: "number", defaultValue: 100000, suffix: "$", min: 0, tooltip: "The future amount of money you want to discount back to today." }}
        value={futureValue}
        onChange={setFutureValue}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Annual Discount Rate", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual rate of return or discount rate used to calculate present value." }}
        value={rate}
        onChange={setRate}
      />
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
      <CalculatorInput
        input={{ id: "compounding", label: "Compounding Frequency", type: "select", defaultValue: 12, options: [{ label: "Annually (1)", value: 1 }, { label: "Quarterly (4)", value: 4 }, { label: "Monthly (12)", value: 12 }, { label: "Daily (365)", value: 365 }], tooltip: "How often discounting is compounded per year." }}
        value={compounding}
        onChange={setCompounding}
      />
    </CalculatorLayout>
  );
}
