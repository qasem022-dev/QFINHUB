"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function InvestmentReturnCalculator() {
  const [initial, setInitial] = React.useState(10000);
  const [finalVal, setFinalVal] = React.useState(18000);
  const [years, setYears] = React.useState(5);
  const [dividends, setDividends] = React.useState(1000);

  const totalReturn = finalVal - initial + dividends;
  const absReturnPct = ((totalReturn / initial) * 100);
  const cagr = initial > 0 && years > 0 ? (Math.pow((finalVal + dividends) / initial, 1 / years) - 1) * 100 : 0;

  const chartData = Array.from({ length: years + 1 }, (_, i) => {
    const ratio = i / years;
    const curVal = initial + (finalVal - initial) * ratio;
    const curDiv = dividends * ratio;
    return {
      year: `Year ${i}`,
      "Portfolio Value": Math.round(curVal + curDiv),
      "Initial": Math.round(initial),
    };
  });

  return (
    <CalculatorLayout
      title="Investment Return"
      description="Calculate total investment return including CAGR, absolute return, and annualized performance."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Return" value={formatCurrency(totalReturn)} highlight />
          <ResultCard label="CAGR" value={formatPercentage(cagr)} />
          <ResultCard label="Absolute Return %" value={formatPercentage(absReturnPct)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Portfolio Value", "Initial"]} title="Value Over Time" />
      <CalculatorInput input={{ id: "initial", label: "Initial Investment", type: "number", defaultValue: 10000, suffix: "$", min: 0 }} value={initial} onChange={setInitial} />
      <CalculatorInput input={{ id: "finalVal", label: "Final Value", type: "number", defaultValue: 18000, suffix: "$", min: 0 }} value={finalVal} onChange={setFinalVal} />
      <CalculatorInput input={{ id: "years", label: "Time Period", type: "number", defaultValue: 5, suffix: "years", min: 1, max: 50 }} value={years} onChange={setYears} />
      <CalculatorInput input={{ id: "dividends", label: "Dividends Received", type: "number", defaultValue: 1000, suffix: "$", min: 0 }} value={dividends} onChange={setDividends} />
    </CalculatorLayout>
  );
}
