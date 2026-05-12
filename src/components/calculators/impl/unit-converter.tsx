"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function UnitConverter() {
  const [value, setValue] = React.useState(1);
  const [fromUnit, setFromUnit] = React.useState(0);
  const [toUnit, setToUnit] = React.useState(1);

  interface ConversionInfo {
    label: string;
    factor: number;
    group: string;
  }

  // Conversion factors relative to base unit
  const conversionGroups: ConversionInfo[] = [
    { label: "km", factor: 0.621371, group: "distance" },
    { label: "miles", factor: 1, group: "distance" },
    { label: "kg", factor: 1, group: "mass" },
    { label: "lbs", factor: 0.453592, group: "mass" },
    { label: "Celsius", factor: 0, group: "temperature" }, // special
    { label: "Fahrenheit", factor: 0, group: "temperature" }, // special
    { label: "Liters", factor: 1, group: "volume" },
    { label: "Gallons", factor: 3.78541, group: "volume" },
  ];

  const units: { label: string; value: number }[] = [
    { label: "Kilometers (km)", value: 0 },
    { label: "Miles (mi)", value: 1 },
    { label: "Kilograms (kg)", value: 2 },
    { label: "Pounds (lbs)", value: 3 },
    { label: "Celsius (°C)", value: 4 },
    { label: "Fahrenheit (°F)", value: 5 },
    { label: "Liters (L)", value: 6 },
    { label: "Gallons (gal)", value: 7 },
  ];

  const safeValue = isFinite(value) ? value : 0;

  const convert = (val: number, from: number, to: number): number => {
    const fromInfo = conversionGroups[from];
    const toInfo = conversionGroups[to];

    if (!fromInfo || !toInfo) return 0;

    // Temperature conversion is special
    if (fromInfo.group === "temperature" && toInfo.group === "temperature") {
      // Celsius
      if (from === 4 && to === 5) return val * 9 / 5 + 32; // C to F
      if (from === 5 && to === 4) return (val - 32) * 5 / 9; // F to C
      return val; // Same unit
    }

    // Check if units are in the same group
    if (fromInfo.group !== toInfo.group) return 0;

    // Convert: val * (from_factor) / to_factor to get target
    return val * fromInfo.factor / toInfo.factor;
  };

  const convertedValue = convert(safeValue, fromUnit, toUnit);
  const invertedValue = convert(1, toUnit, fromUnit);

  const fromLabel = (units.find(u => u.value === fromUnit)?.label ?? "Kilometers (km)").split(" (")[0] ?? "Unit A";
  const toLabel = (units.find(u => u.value === toUnit)?.label ?? "Miles (mi)").split(" (")[0] ?? "Unit B";

  const fromInfo = conversionGroups[fromUnit];
  const toInfo = conversionGroups[toUnit];
  const sameGroup = fromInfo && toInfo && fromInfo.group === toInfo.group;

  // Chart data for bar comparison
  const chartData = sameGroup ? [
    { name: fromLabel, value: safeValue },
    { name: toLabel, value: convertedValue },
  ] : [];

  return (
    <CalculatorLayout
      title="Unit Converter"
      description="Convert between different units of measurement for distance, mass, temperature, and volume."
      icon={<span>📐</span>}
      results={
        <div className="space-y-4">
          <ResultCard label={`${fromLabel} → ${toLabel}`} value={formatNumber(convertedValue, 4)} highlight />
          <ResultCard label={`1 ${fromLabel} =`} value={`${formatNumber(invertedValue, 4)} ${toLabel}`} subtext="Inverse rate" />
          <ResultCard label={`1 ${toLabel} =`} value={`${formatNumber(convert(1, fromUnit, toUnit), 4)} ${fromLabel}`} subtext="Forward rate" />
          <ResultCard label="Group" value={fromInfo?.group ?? "N/A"} />
        </div>
      }
    >
      {sameGroup && chartData.length > 0 && (
        <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Value Comparison" height={250} />
      )}
      <CalculatorInput
        input={{ id: "value", label: "Value to Convert", type: "number", defaultValue: 1, min: -9999999, tooltip: "The numeric value to convert." }}
        value={value}
        onChange={setValue}
      />
      <CalculatorInput
        input={{ id: "fromUnit", label: "From Unit", type: "select", defaultValue: 0, options: units, tooltip: "The unit you are converting from." }}
        value={fromUnit}
        onChange={setFromUnit}
      />
      <CalculatorInput
        input={{ id: "toUnit", label: "To Unit", type: "select", defaultValue: 1, options: units, tooltip: "The unit you are converting to." }}
        value={toUnit}
        onChange={setToUnit}
      />
    </CalculatorLayout>
  );
}
