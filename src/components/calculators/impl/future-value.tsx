"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function FutureValueCalculator() {
  const [presentValue, setPresentValue] = React.useState(10000);
  const [rate, setRate] = React.useState(8);
  const [timeValue, setTimeValue] = React.useState(10);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);
  const [compounding, setCompounding] = React.useState(12);

  const safePv = Math.max(0, presentValue ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safePmt = Math.max(0, monthlyContribution ?? 0);
  const safeCompounding = Math.max(1, compounding ?? 1);

  const r = safeRate / 100;
  const n = safeCompounding;
  const t = Math.max(0, toMonths(timeValue, timeUnit) / 12);
  const pmt = safePmt;

  const safeFV = (y: number): number => {
    if (r === 0) return safePv + pmt * 12 * y;
    const factor = Math.pow(1 + r / n, n * y);
    return safePv * factor + pmt * ((factor - 1) / (r / n));
  };

  const futureValue = safeFV(t);
  const totalContributions = safePv + pmt * 12 * t;
  const totalInterest = !isNaN(futureValue) && isFinite(futureValue) ? Math.max(0, futureValue - totalContributions) : 0;
  const effectiveAnnualRate = r === 0 ? 0 : (Math.pow(1 + r / n, n) - 1) * 100;

  const interestPct = futureValue > 0 ? ((totalInterest / futureValue) * 100) : 0;

  // Inflation-adjusted future value
  const inflationRate = 3;
  const realFV = futureValue / Math.pow(1 + inflationRate / 100, t);

  const maxYears = Math.min(Math.ceil(t), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const fv = safeFV(i);
    const contrib = safePv + pmt * 12 * i;
    return {
      year: `Year ${i}`,
      "Balance": isNaN(fv) || !isFinite(fv) ? 0 : Math.round(fv),
      "Contributions": Math.round(contrib),
    };
  });

  return (
    <CalculatorLayout
      title="Future Value"
      description="Calculate the future value of an investment with regular contributions, compounding frequency, and detailed growth projections."
      icon={<span>🔮</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Future Value"
            value={formatCurrency(futureValue)}
            highlight
          />
          <ResultCard
            label="Total Contributions"
            value={formatCurrency(totalContributions)}
          />
          <ResultCard
            label="Total Interest"
            value={formatCurrency(totalInterest)}
            subtext={futureValue > 0 ? `${interestPct.toFixed(1)}% of final value` : undefined}
          />
          <ResultCard
            label="Inflation-Adjusted"
            value={formatCurrency(realFV)}
            subtext={`At ${inflationRate}% inflation`}
          />
          <ResultCard
            label="Effective Annual Rate"
            value={formatPercentage(effectiveAnnualRate)}
            subtext={`Nominal rate: ${rate}%`}
          />
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={chartData}
        xKey="year"
        yKey={["Balance", "Contributions"]}
        title="Growth Over Time"
      />
      <CalculatorInput
        input={{ id: "presentValue", label: "Present Value", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The initial amount of money you are investing or saving today." }}
        value={presentValue}
        onChange={setPresentValue}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 8, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual rate of return you expect to earn." }}
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
        input={{ id: "monthlyContribution", label: "Monthly Contribution", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "The amount you plan to add each month." }}
        value={monthlyContribution}
        onChange={setMonthlyContribution}
      />
      <CalculatorInput
        input={{ id: "compounding", label: "Compounding Frequency", type: "select", defaultValue: 12, options: [{ label: "Annually (1)", value: 1 }, { label: "Quarterly (4)", value: 4 }, { label: "Monthly (12)", value: 12 }, { label: "Daily (365)", value: 365 }], tooltip: "How often interest is compounded per year." }}
        value={compounding}
        onChange={setCompounding}
      />
    </CalculatorLayout>
  );
}
