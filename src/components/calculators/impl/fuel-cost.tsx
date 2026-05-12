"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export default function FuelCostCalculator() {
  const [distance, setDistance] = React.useState(300);
  const [mpg, setMpg] = React.useState(25);
  const [fuelPrice, setFuelPrice] = React.useState(3.5);

  const safeDistance = isFinite(distance) ? Math.max(0, distance) : 0;
  const safeMpg = isFinite(mpg) ? Math.max(0.1, mpg) : 25;
  const safePrice = isFinite(fuelPrice) ? Math.max(0, fuelPrice) : 0;

  const gallonsNeeded = safeMpg > 0 ? safeDistance / safeMpg : 0;
  const totalCost = gallonsNeeded * safePrice;
  const costPerMile = safeDistance > 0 ? totalCost / safeDistance : 0;

  const chartData = [
    { name: "Fuel Cost", value: totalCost },
    { name: "Fuel Price ($/gal)", value: fuelPrice },
  ];

  return (
    <CalculatorLayout
      title="Fuel Cost Calculator"
      description="Calculate the total fuel cost for a trip based on distance, fuel efficiency, and fuel price."
      icon={<span>🚗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Fuel Cost" value={formatCurrency(totalCost)} highlight />
          <ResultCard label="Gallons Needed" value={formatNumber(gallonsNeeded, 1)} />
          <ResultCard label="Cost Per Mile" value={formatCurrency(costPerMile)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Cost Breakdown" height={250} />
      <CalculatorInput
        input={{ id: "distance", label: "Distance", type: "number", defaultValue: 300, suffix: "miles", min: 0, tooltip: "Total trip distance." }}
        value={distance}
        onChange={setDistance}
      />
      <CalculatorInput
        input={{ id: "mpg", label: "Fuel Efficiency", type: "number", defaultValue: 25, suffix: "MPG", min: 1, max: 100, step: 0.1, tooltip: "Miles per gallon of your vehicle." }}
        value={mpg}
        onChange={setMpg}
      />
      <CalculatorInput
        input={{ id: "fuelPrice", label: "Fuel Price", type: "number", defaultValue: 3.5, suffix: "$/gal", min: 0, step: 0.01, tooltip: "Price per gallon of fuel." }}
        value={fuelPrice}
        onChange={setFuelPrice}
      />
    </CalculatorLayout>
  );
}
