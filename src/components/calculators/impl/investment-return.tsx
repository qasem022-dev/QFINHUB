"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function InvestmentReturnCalculator() {
  const [initial, setInitial] = React.useState(10000);
  const [finalVal, setFinalVal] = React.useState(18000);
  const [timeValue, setTimeValue] = React.useState(5);
  const [timeUnit, setTimeUnit] = React.useState<PeriodUnit>("years");
  const [dividends, setDividends] = React.useState(1000);

  const safeInitial = Math.max(0, initial ?? 0);
  const safeFinal = Math.max(0, finalVal ?? 0);
  const safeDividends = Math.max(0, dividends ?? 0);

  const t = Math.max(0.01, toMonths(timeValue, timeUnit) / 12);
  const totalReturn = safeFinal - safeInitial + safeDividends;
  const absReturnPct = safeInitial > 0 ? ((totalReturn / safeInitial) * 100) : 0;
  const rawCagr = safeInitial > 0 && t > 0 ? (Math.pow((safeFinal + safeDividends) / safeInitial, 1 / t) - 1) * 100 : 0;
  const cagr = isNaN(rawCagr) || !isFinite(rawCagr) ? 0 : rawCagr;

  const maxYears = Math.min(Math.ceil(t), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const ratio = t > 0 ? i / t : 0;
    const curVal = safeInitial + (safeFinal - safeInitial) * ratio;
    const curDiv = safeDividends * ratio;
    return {
      year: `Year ${i}`,
      "Portfolio Value": Math.round(curVal + curDiv),
      "Initial": Math.round(safeInitial),
    };
  });

  return (
    <CalculatorLayout
      title="Investment Return"
      description="Calculate total investment return including CAGR, absolute return, and annualized performance."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Return" value={formatCurrency(totalReturn)} highlight subtext={`${absReturnPct.toFixed(1)}% absolute return`} />
          <ResultCard label="CAGR" value={formatPercentage(cagr)} subtext={`Over ${t.toFixed(1)} years`} highlight />
          <ResultCard label="Absolute Return %" value={formatPercentage(absReturnPct)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Portfolio Value", "Initial"]} title="Value Over Time" />
      <CalculatorInput input={{ id: "initial", label: "Initial Investment", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The initial amount invested." }} value={initial} onChange={setInitial} />
      <CalculatorInput input={{ id: "finalVal", label: "Final Value", type: "number", defaultValue: 18000, suffix: "$", min: 0, tooltip: "The ending value of the investment." }} value={finalVal} onChange={setFinalVal} />
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
      <CalculatorInput input={{ id: "dividends", label: "Dividends Received", type: "number", defaultValue: 1000, suffix: "$", min: 0, tooltip: "Total dividends or income received over the holding period." }} value={dividends} onChange={setDividends} />
    </CalculatorLayout>
  );
}
