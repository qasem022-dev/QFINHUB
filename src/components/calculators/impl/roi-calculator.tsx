"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function ROICalculator() {
  const [cost, setCost] = React.useState(10000);
  const [finalVal, setFinalVal] = React.useState(15000);
  const [period, setPeriod] = React.useState(3);
  const [periodUnit, setPeriodUnit] = React.useState<PeriodUnit>("years");

  const safeCost = Math.max(0, cost ?? 0);
  const safeFinal = Math.max(0, finalVal ?? 0);

  const totalGain = safeFinal - safeCost;
  const roi = safeCost > 0 ? ((safeFinal - safeCost) / safeCost) * 100 : 0;
  const periodYears = Math.max(0.01, toMonths(period, periodUnit) / 12);
  const annualizedRoi = safeCost > 0 && periodYears > 0 ? (Math.pow(safeFinal / safeCost, 1 / periodYears) - 1) * 100 : 0;

  const safeRoi = isNaN(roi) || !isFinite(roi) ? 0 : roi;
  const safeAnnRoi = isNaN(annualizedRoi) || !isFinite(annualizedRoi) ? 0 : annualizedRoi;
  const safeGain = isNaN(totalGain) || !isFinite(totalGain) ? 0 : totalGain;

  const maxYears = Math.min(Math.max(Math.round(periodYears), 1), 36);
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Total Value": isFinite(safeCost + (safeFinal - safeCost) * (i / (periodYears || 1))) ? Math.round(safeCost + (safeFinal - safeCost) * (i / (periodYears || 1))) : 0,
    "Cost Basis": Math.round(safeCost),
  }));

  return (
    <CalculatorLayout
      title="ROI Calculator"
      description="Calculate return on investment with cost basis, gains, and annualized returns."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total ROI" value={formatPercentage(safeRoi)} highlight subtext={`Total gain: ${formatCurrency(safeGain)}`} />
          <ResultCard label="Annualized ROI" value={formatPercentage(safeAnnRoi)} subtext={`Over ${periodYears.toFixed(1)} years`} />
          <ResultCard label="Total Gain" value={formatCurrency(safeGain)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Total Value", "Cost Basis"]} title="Investment Growth" />
      <CalculatorInput input={{ id: "cost", label: "Initial Cost", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "The total cost or initial investment amount." }} value={cost} onChange={setCost} />
      <CalculatorInput input={{ id: "finalVal", label: "Final Value", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "The ending value of the investment after the holding period." }} value={finalVal} onChange={setFinalVal} />
      <PeriodInput
        id="period"
        label="Time Period"
        value={period}
        unit={periodUnit}
        onValueChange={setPeriod}
        onUnitChange={setPeriodUnit}
        min={1}
        max={50}
      />
    </CalculatorLayout>
  );
}
