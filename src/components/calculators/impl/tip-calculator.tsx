"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function TipCalculator() {
  const [bill, setBill] = React.useState(100);
  const [tipPercent, setTipPercent] = React.useState(15);
  const [split, setSplit] = React.useState(2);

  const safeBill = isFinite(bill) ? Math.max(0, bill) : 0;
  const safeTipPct = isFinite(tipPercent) ? Math.max(0, Math.min(tipPercent, 100)) : 0;
  const safeSplit = isFinite(split) ? Math.max(1, Math.round(split)) : 1;

  const tipAmount = safeBill * (safeTipPct / 100);
  const totalBill = safeBill + tipAmount;
  const perPerson = totalBill / safeSplit;
  const tipPerPerson = tipAmount / safeSplit;

  const chartData = [
    { name: "Bill", value: bill },
    { name: "Tip", value: tipAmount },
  ];

  return (
    <CalculatorLayout
      title="Tip Calculator"
      description="Quickly calculate the tip amount, total bill, and how much each person should pay."
      icon={<span>💵</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Bill" value={formatCurrency(totalBill)} highlight />
          <ResultCard label="Tip Amount" value={formatCurrency(tipAmount)} />
          <ResultCard label="Per Person" value={formatCurrency(perPerson)} subtext={`${split} way(s) — ${formatCurrency(tipPerPerson)} tip each`} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={chartData} xKey="name" yKey="value" title="Bill vs Tip" height={250} />
      <CalculatorInput
        input={{ id: "bill", label: "Bill Amount", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "The total bill amount before tip." }}
        value={bill}
        onChange={setBill}
      />
      <CalculatorInput
        input={{ id: "tipPercent", label: "Tip Percentage", type: "number", defaultValue: 15, suffix: "%", min: 0, max: 100, step: 1, tooltip: "The percentage of the bill to leave as a tip." }}
        value={tipPercent}
        onChange={setTipPercent}
      />
      <CalculatorInput
        input={{ id: "split", label: "Split Between", type: "number", defaultValue: 2, suffix: "people", min: 1, max: 100, tooltip: "Number of people splitting the bill." }}
        value={split}
        onChange={setSplit}
      />
    </CalculatorLayout>
  );
}
