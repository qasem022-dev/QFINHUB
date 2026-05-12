"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export default function GasMileageCalculator() {
  const [distance, setDistance] = React.useState(300);
  const [gallons, setGallons] = React.useState(10);
  const [fuelPrice, setFuelPrice] = React.useState(3.5);

  const safeDistance = isFinite(distance) ? Math.max(0, distance) : 0;
  const safeGallons = isFinite(gallons) ? Math.max(0.1, gallons) : 0.1;
  const safePrice = isFinite(fuelPrice) ? Math.max(0, fuelPrice) : 0;

  const mpg = safeGallons > 0 ? safeDistance / safeGallons : 0;
  const fuelCost = safeGallons * safePrice;
  const costPerMile = safeDistance > 0 ? fuelCost / safeDistance : 0;

  // Add a bar chart showing fuel cost breakdown
  const chartData = [
    { name: "Distance (mi)", value: safeDistance },
    { name: "Fuel Used (gal)", value: safeGallons },
    { name: "Cost per Mile ($)", value: Math.round(costPerMile * 100) / 100 },
  ];

  return (
    <CalculatorLayout
      title="Gas Mileage Calculator"
      description="Calculate your fuel efficiency in miles per gallon and estimate trip fuel costs."
      icon={<span>⛽</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Fuel Efficiency (MPG)" value={formatNumber(mpg, 1)} highlight />
          <ResultCard label="Total Fuel Cost" value={formatCurrency(fuelCost)} />
          <ResultCard label="Cost Per Mile" value={formatCurrency(costPerMile)} subtext={`At $${safePrice.toFixed(2)}/gal`} />
          <ResultCard label="Distance" value={formatNumber(safeDistance, 0)} subtext="Miles driven" />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Trip Summary" height={250} />
      <CalculatorInput
        input={{ id: "distance", label: "Distance Traveled", type: "number", defaultValue: 300, suffix: "miles", min: 0, tooltip: "Total distance driven." }}
        value={distance}
        onChange={setDistance}
      />
      <CalculatorInput
        input={{ id: "gallons", label: "Gallons Used", type: "number", defaultValue: 10, suffix: "gal", min: 0.1, step: 0.1, tooltip: "Total gallons of fuel consumed." }}
        value={gallons}
        onChange={setGallons}
      />
      <CalculatorInput
        input={{ id: "fuelPrice", label: "Fuel Price", type: "number", defaultValue: 3.5, suffix: "$/gal", min: 0, step: 0.01, tooltip: "Price per gallon of fuel." }}
        value={fuelPrice}
        onChange={setFuelPrice}
      />
    </CalculatorLayout>
  );
}
