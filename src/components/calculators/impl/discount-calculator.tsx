"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = React.useState(100);
  const [discount, setDiscount] = React.useState(20);
  const [quantity, setQuantity] = React.useState(1);

  const safeOriginal = isFinite(originalPrice) ? Math.max(0, originalPrice) : 0;
  const safeDiscount = isFinite(discount) ? Math.max(0, Math.min(discount, 100)) : 0;
  const safeQuantity = isFinite(quantity) ? Math.max(1, quantity) : 1;

  const savingsPerItem = safeOriginal * (safeDiscount / 100);
  const finalPricePerItem = safeOriginal - savingsPerItem;
  const totalSavings = savingsPerItem * safeQuantity;
  const totalFinal = finalPricePerItem * safeQuantity;
  const totalOriginal = safeOriginal * safeQuantity;

  const chartData = [
    { name: "Original Price", value: totalOriginal },
    { name: "Final Price", value: totalFinal },
  ];

  return (
    <CalculatorLayout
      title="Discount Calculator"
      description="Calculate savings and final price after applying a percentage discount to one or more items."
      icon={<span>🏷️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Final Price" value={formatCurrency(totalFinal)} highlight />
          <ResultCard label="You Save" value={formatCurrency(totalSavings)} subtext={`${discount}% off ${quantity} item(s)`} />
          <ResultCard label="Price Per Item" value={formatCurrency(finalPricePerItem)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Price Comparison" height={250} />
      <CalculatorInput
        input={{ id: "originalPrice", label: "Original Price", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "The original price of the item before discount." }}
        value={originalPrice}
        onChange={setOriginalPrice}
      />
      <CalculatorInput
        input={{ id: "discount", label: "Discount Percentage", type: "number", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1, tooltip: "The percentage discount being applied." }}
        value={discount}
        onChange={setDiscount}
      />
      <CalculatorInput
        input={{ id: "quantity", label: "Quantity", type: "number", defaultValue: 1, suffix: "items", min: 1, max: 1000, tooltip: "Number of items being purchased." }}
        value={quantity}
        onChange={setQuantity}
      />
    </CalculatorLayout>
  );
}
