"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function SalesTaxCalculator() {
  const [purchaseAmount, setPurchaseAmount] = React.useState(100);
  const [stateTaxRate, setStateTaxRate] = React.useState(6);
  const [localTaxRate, setLocalTaxRate] = React.useState(2);

  const safePurchase = Math.max(0, isFinite(purchaseAmount) ? purchaseAmount : 0);
  const safeStateRate = Math.max(0, isFinite(stateTaxRate) ? stateTaxRate : 0);
  const safeLocalRate = Math.max(0, isFinite(localTaxRate) ? localTaxRate : 0);

  const stateTax = safePurchase * (safeStateRate / 100);
  const localTax = safePurchase * (safeLocalRate / 100);
  const totalTax = stateTax + localTax;
  const totalWithTax = safePurchase + totalTax;
  const effectiveTotalRate = safePurchase > 0 ? (totalTax / safePurchase) * 100 : 0;

  const pieData = [
    { name: "Purchase Amount", value: Math.round(safePurchase) },
    { name: "State Tax", value: Math.round(stateTax) },
    { name: "Local Tax", value: Math.round(localTax) },
  ];

  return (
    <CalculatorLayout
      title="Sales Tax Calculator"
      description="Calculate sales tax including state and local rates for any purchase amount."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="State Tax" value={formatCurrency(stateTax)} subtext={`${safeStateRate}% state rate`} />
          <ResultCard label="Local Tax" value={formatCurrency(localTax)} subtext={`${safeLocalRate}% local rate`} />
          <ResultCard label="Total Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Total with Tax" value={formatCurrency(totalWithTax)} highlight />
          <ResultCard label="Effective Total Rate" value={formatPercentage(effectiveTotalRate)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Purchase Breakdown" />
      <CalculatorInput
        input={{ id: "purchaseAmount", label: "Purchase Amount", type: "number", defaultValue: 100, suffix: "$", min: 0, step: 10, tooltip: "The total purchase price before tax." }}
        value={purchaseAmount}
        onChange={setPurchaseAmount}
      />
      <CalculatorInput
        input={{ id: "stateTaxRate", label: "State Tax Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 15, step: 0.1, tooltip: "Your state's sales tax rate as a percentage." }}
        value={stateTaxRate}
        onChange={setStateTaxRate}
      />
      <CalculatorInput
        input={{ id: "localTaxRate", label: "Local Tax Rate", type: "number", defaultValue: 2, suffix: "%", min: 0, max: 10, step: 0.1, tooltip: "Local/city sales tax rate as a percentage." }}
        value={localTaxRate}
        onChange={setLocalTaxRate}
      />
    </CalculatorLayout>
  );
}
