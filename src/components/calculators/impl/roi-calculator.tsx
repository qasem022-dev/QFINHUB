"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function ROICalculator() {
  const [cost, setCost] = React.useState(10000);
  const [finalVal, setFinalVal] = React.useState(15000);
  const [period, setPeriod] = React.useState(3);

  const totalGain = finalVal - cost;
  const roi = cost > 0 ? ((finalVal - cost) / cost) * 100 : 0;
  const annualizedRoi = cost > 0 && period > 0 ? (Math.pow(finalVal / cost, 1 / period) - 1) * 100 : 0;

  const chartData = Array.from({ length: period + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Total Value": Math.round(cost + (finalVal - cost) * (i / period)),
    "Cost Basis": Math.round(cost),
  }));

  return (
    <CalculatorLayout
      title="ROI Calculator"
      description="Calculate return on investment with cost basis, gains, and annualized returns."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total ROI" value={formatPercentage(roi)} highlight />
          <ResultCard label="Annualized ROI" value={formatPercentage(annualizedRoi)} subtext={`Over ${period} years`} />
          <ResultCard label="Total Gain" value={formatCurrency(totalGain)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Total Value", "Cost Basis"]} title="Investment Growth" />
      <CalculatorInput input={{ id: "cost", label: "Initial Cost", type: "number", defaultValue: 10000, suffix: "$", min: 0 }} value={cost} onChange={setCost} />
      <CalculatorInput input={{ id: "finalVal", label: "Final Value", type: "number", defaultValue: 15000, suffix: "$", min: 0 }} value={finalVal} onChange={setFinalVal} />
      <CalculatorInput input={{ id: "period", label: "Time Period", type: "number", defaultValue: 3, suffix: "years", min: 1, max: 50 }} value={period} onChange={setPeriod} />
    </CalculatorLayout>
  );
}
