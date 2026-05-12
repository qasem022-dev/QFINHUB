"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber, formatPercentage } from "@/lib/utils";

export default function PercentageCalculator() {
  const [value, setValue] = React.useState(200);
  const [percentage, setPercentage] = React.useState(15);
  const [mode, setMode] = React.useState(0);

  const safeValue = isFinite(value) ? value : 0;
  const safePct = isFinite(percentage) ? percentage : 0;

  let result = 0;
  let label = "";
  let resultFormatted = "";
  let extra1 = "";
  let extra2 = "";

  switch (mode) {
    case 0: // What is X% of Y?
      result = (safePct / 100) * safeValue;
      label = `${safePct}% of ${safeValue}`;
      resultFormatted = formatNumber(result, 2);
      extra1 = `${result} is ${safePct}% of ${safeValue}`;
      extra2 = `${safeValue} × (${safePct} ÷ 100) = ${formatNumber(result, 2)}`;
      break;
    case 1: // X is what % of Y?
      result = safeValue !== 0 ? (safePct / safeValue) * 100 : 0;
      label = `${safePct} is what % of ${safeValue}`;
      resultFormatted = formatPercentage(result);
      extra1 = `${safePct} / ${safeValue} × 100 = ${formatPercentage(result)}`;
      extra2 = `${safePct} is ${formatPercentage(result)} of ${safeValue}`;
      break;
    case 2: // % change from X to Y
      result = safeValue !== 0 ? ((safePct - safeValue) / safeValue) * 100 : 0;
      label = `% change from ${safeValue} to ${safePct}`;
      resultFormatted = formatPercentage(result);
      const direction = result >= 0 ? "increase" : "decrease";
      extra1 = `A ${direction} of ${formatPercentage(Math.abs(result))}`;
      extra2 = `From ${safeValue} to ${safePct}: ${direction === "increase" ? "+" : ""}${formatPercentage(result)}`;
      break;
  }

  return (
    <CalculatorLayout
      title="Percentage Calculator"
      description="Calculate percentages, find what percentage one number is of another, or determine percentage change."
      icon={<span>💯</span>}
      results={
        <div className="space-y-4">
          <ResultCard label={label} value={resultFormatted} highlight />
          <ResultCard label="Explanation" value={extra1} />
          <ResultCard label="Formula" value={extra2} />
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "value", label: "Value", type: "number", defaultValue: 200, min: -999999999, tooltip: "The base value or first number." }}
        value={value}
        onChange={setValue}
      />
      <CalculatorInput
        input={{ id: "percentage", label: "Percentage / Second Value", type: "number", defaultValue: 15, min: -999999999, tooltip: "The percentage value or second number for comparison." }}
        value={percentage}
        onChange={setPercentage}
      />
      <CalculatorInput
        input={{ id: "mode", label: "Mode", type: "select", defaultValue: 0, options: [{ label: "What is X% of Y?", value: 0 }, { label: "X is what % of Y?", value: 1 }, { label: "Percentage Change", value: 2 }], tooltip: "Choose the type of percentage calculation." }}
        value={mode}
        onChange={setMode}
      />
    </CalculatorLayout>
  );
}
