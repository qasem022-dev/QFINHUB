"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function SimpleInterestCalculator() {
  const [principal, setPrincipal] = React.useState(10000);
  const [rate, setRate] = React.useState(5);
  const [years, setYears] = React.useState(5);

  const r = rate / 100;
  const interest = principal * r * years;
  const totalAmount = principal + interest;

  const chartData = Array.from({ length: years + 1 }, (_, i) => ({
    year: `Year ${i}`,
    "Total Amount": Math.round(principal + principal * r * i),
    Principal: Math.round(principal),
  }));

  return (
    <CalculatorLayout
      title="Simple Interest"
      description="Calculate simple interest on loans and investments with clear principal and rate breakdowns."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Amount" value={formatCurrency(totalAmount)} highlight />
          <ResultCard label="Interest Earned" value={formatCurrency(interest)} />
          <ResultCard label="Principal" value={formatCurrency(principal)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Total Amount", "Principal"]} title="Growth Over Time" />
      <CalculatorInput input={{ id: "principal", label: "Principal Amount", type: "number", defaultValue: 10000, suffix: "$", min: 0 }} value={principal} onChange={setPrincipal} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 100, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "years", label: "Time Period", type: "number", defaultValue: 5, suffix: "years", min: 1, max: 50 }} value={years} onChange={setYears} />
    </CalculatorLayout>
  );
}
