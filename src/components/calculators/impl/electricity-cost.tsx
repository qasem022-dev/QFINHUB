"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export default function ElectricityCostCalculator() {
  const [wattage, setWattage] = React.useState(1000);
  const [hoursPerDay, setHoursPerDay] = React.useState(8);
  const [days, setDays] = React.useState(30);
  const [rate, setRate] = React.useState(0.12);

  const safeWattage = isFinite(wattage) ? Math.max(0, wattage) : 0;
  const safeHoursPerDay = isFinite(hoursPerDay) ? Math.max(0, Math.min(hoursPerDay, 24)) : 0;
  const safeDays = isFinite(days) ? Math.max(1, days) : 30;
  const safeRate = isFinite(rate) ? Math.max(0, rate) : 0;

  const totalHours = safeHoursPerDay * safeDays;
  const kwh = (safeWattage / 1000) * totalHours;
  const totalCost = kwh * safeRate;

  // Daily breakdown for chart
  const chartData = Array.from({ length: safeDays > 30 ? 5 : Math.max(safeDays, 1) }, (_, i) => ({
    day: `Day ${i + 1}`,
    Cost: Math.round(((safeWattage / 1000) * safeHoursPerDay * safeRate) * 100) / 100,
  }));

  return (
    <CalculatorLayout
      title="Electricity Cost Calculator"
      description="Calculate the energy consumption and cost of running an electrical appliance over time."
      icon={<span>💡</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Cost" value={formatCurrency(totalCost)} highlight />
          <ResultCard label="Energy Used" value={`${formatNumber(kwh, 2)} kWh`} />
          <ResultCard label="Daily Cost" value={formatCurrency((wattage / 1000) * hoursPerDay * rate)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData.slice(0, 7)} xKey="day" yKey="Cost" title="Daily Cost Breakdown" height={250} />
      <CalculatorInput
        input={{ id: "wattage", label: "Appliance Wattage", type: "number", defaultValue: 1000, suffix: "W", min: 1, max: 100000, tooltip: "Power rating of the appliance in watts." }}
        value={wattage}
        onChange={setWattage}
      />
      <CalculatorInput
        input={{ id: "hoursPerDay", label: "Hours Used Per Day", type: "number", defaultValue: 8, suffix: "hrs", min: 0, max: 24, tooltip: "How many hours per day the appliance is used." }}
        value={hoursPerDay}
        onChange={setHoursPerDay}
      />
      <CalculatorInput
        input={{ id: "days", label: "Days Used", type: "number", defaultValue: 30, suffix: "days", min: 1, max: 365, tooltip: "Number of days the appliance is used." }}
        value={days}
        onChange={setDays}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Electricity Rate", type: "number", defaultValue: 0.12, suffix: "$/kWh", min: 0, step: 0.001, tooltip: "Electricity rate in dollars per kilowatt-hour." }}
        value={rate}
        onChange={setRate}
      />
    </CalculatorLayout>
  );
}
