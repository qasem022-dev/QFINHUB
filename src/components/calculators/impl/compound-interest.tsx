"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = React.useState(10000);
  const [rate, setRate] = React.useState(7);
  const [timeValue, setTimeValue] = React.useState(10);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");
  const [compoundings, setCompoundings] = React.useState(12);
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);

  const safePrincipal = Math.max(0, principal ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safePmt = Math.max(0, monthlyContribution ?? 0);
  const safeCompoundings = Math.max(1, compoundings ?? 1);

  const r = safeRate / 100;
  const n = safeCompoundings;
  const t = Math.max(0, toMonths(timeValue, timeUnit) / 12);
  const pmt = safePmt;

  const safeFV = (y: number): number => {
    if (r === 0) return safePrincipal + pmt * 12 * y;
    const factor = Math.pow(1 + r / n, n * y);
    return safePrincipal * factor + pmt * ((factor - 1) / (r / n));
  };

  const futureValue = safeFV(t);
  const totalContributions = safePrincipal + pmt * 12 * t;
  const totalInterest = !isNaN(futureValue) && isFinite(futureValue) ? Math.max(0, futureValue - totalContributions) : 0;
  const interestPct = futureValue > 0 ? ((totalInterest / futureValue) * 100) : 0;

  const maxYears = Math.min(Math.ceil(t), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const fv = safeFV(i);
    const contrib = safePrincipal + pmt * 12 * i;
    return {
      year: `Year ${i}`,
      "Total Value": isNaN(fv) || !isFinite(fv) ? 0 : Math.round(fv),
      Contributions: Math.round(contrib),
    };
  });

  return (
    <CalculatorLayout
      title="Compound Interest"
      description="Calculate compound interest with regular contributions, variable rates, and detailed growth charts."
      icon={<span>📈</span>}
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
            label="Total Interest Earned"
            value={formatCurrency(totalInterest)}
            subtext={futureValue > 0 ? `${interestPct.toFixed(1)}% of final value` : undefined}
          />
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Total Value", "Contributions"]}
        title="Growth Over Time"
      />
      <CalculatorInput
        input={{ id: "principal", label: "Principal Amount", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The initial amount of money you are investing or saving." }}
        value={principal}
        onChange={setPrincipal}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The annual rate of return you expect to earn." }}
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
        input={{ id: "compoundings", label: "Compound Frequency", type: "select", defaultValue: 12, options: [{ label: "Annually (1)", value: 1 }, { label: "Semi-Annually (2)", value: 2 }, { label: "Quarterly (4)", value: 4 }, { label: "Monthly (12)", value: 12 }, { label: "Daily (365)", value: 365 }], tooltip: "How often interest is compounded per year." }}
        value={compoundings}
        onChange={setCompoundings}
      />
      <CalculatorInput
        input={{ id: "monthlyContribution", label: "Monthly Contribution", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "The amount you plan to add each month." }}
        value={monthlyContribution}
        onChange={setMonthlyContribution}
      />
    </CalculatorLayout>
  );
}
