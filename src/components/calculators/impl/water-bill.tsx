"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function WaterBillCalculator() {
  const [gallonsUsed, setGallonsUsed] = React.useState(3000);
  const [ratePerGallon, setRatePerGallon] = React.useState(0.005);
  const [baseFee, setBaseFee] = React.useState(15);

  const safeGallons = isFinite(gallonsUsed) ? Math.max(0, gallonsUsed) : 0;
  const safeRate = isFinite(ratePerGallon) ? Math.max(0, ratePerGallon) : 0;
  const safeFee = isFinite(baseFee) ? Math.max(0, baseFee) : 0;

  const usageCost = safeGallons * safeRate;
  const totalBill = usageCost + safeFee;

  const chartData = [
    { name: "Usage Charges", value: usageCost },
    { name: "Base Fee", value: baseFee },
  ];

  return (
    <CalculatorLayout
      title="Water Bill Calculator"
      description="Calculate your water bill based on gallons used, rate per gallon, and any base service fee."
      icon={<span>🚰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Bill" value={formatCurrency(totalBill)} highlight />
          <ResultCard label="Usage Charges" value={formatCurrency(usageCost)} subtext={`${gallonsUsed.toLocaleString()} gal × $${ratePerGallon}/gal`} />
          <ResultCard label="Base Fee" value={formatCurrency(baseFee)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={chartData} xKey="name" yKey="value" title="Bill Breakdown" height={250} />
      <CalculatorInput
        input={{ id: "gallonsUsed", label: "Gallons Used", type: "number", defaultValue: 3000, suffix: "gal", min: 0, tooltip: "Total gallons of water used during the billing period." }}
        value={gallonsUsed}
        onChange={setGallonsUsed}
      />
      <CalculatorInput
        input={{ id: "ratePerGallon", label: "Rate Per Gallon", type: "number", defaultValue: 0.005, suffix: "$", min: 0, step: 0.0001, tooltip: "Cost per gallon of water." }}
        value={ratePerGallon}
        onChange={setRatePerGallon}
      />
      <CalculatorInput
        input={{ id: "baseFee", label: "Base Service Fee", type: "number", defaultValue: 15, suffix: "$", min: 0, tooltip: "Fixed base fee for water service." }}
        value={baseFee}
        onChange={setBaseFee}
      />
    </CalculatorLayout>
  );
}
