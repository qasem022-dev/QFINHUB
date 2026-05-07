"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = React.useState(10000);
  const [rate, setRate] = React.useState(7);
  const [years, setYears] = React.useState(10);
  const [compoundings, setCompoundings] = React.useState(12);
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);

  const r = rate / 100;
  const n = compoundings;
  const t = years;
  const pmt = monthlyContribution;

  const futureValue =
    principal * Math.pow(1 + r / n, n * t) +
    pmt * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));

  const totalContributions = principal + pmt * 12 * t;
  const totalInterest = futureValue - totalContributions;

  const chartData = Array.from({ length: t + 1 }, (_, i) => {
    const y = i;
    const fv =
      principal * Math.pow(1 + r / n, n * y) +
      pmt * ((Math.pow(1 + r / n, n * y) - 1) / (r / n));
    const contrib = principal + pmt * 12 * y;
    return {
      year: `Year ${y}`,
      "Total Value": Math.round(fv),
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
            subtext={futureValue > 0 ? `${((totalInterest / futureValue) * 100).toFixed(1)}% of final value` : undefined}
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
      <CalculatorInput
        input={{ id: "years", label: "Time Period", type: "number", defaultValue: 10, suffix: "years", min: 1, max: 50, tooltip: "How many years you plan to let the investment grow." }}
        value={years}
        onChange={setYears}
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
