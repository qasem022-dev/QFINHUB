"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function NetWorthCalculator() {
  const [assets, setAssets] = React.useState(250000);
  const [liabilities, setLiabilities] = React.useState(150000);

  const safeAssets = isFinite(assets) ? assets : 0;
  const safeLiabilities = isFinite(liabilities) ? liabilities : 0;
  const netWorth = safeAssets - safeLiabilities;
  const dti = safeAssets > 0 ? (safeLiabilities / safeAssets) * 100 : 0;

  const chartData = [
    { category: "Assets", amount: Math.round(safeAssets) },
    { category: "Liabilities", amount: Math.round(safeLiabilities) },
    { category: "Net Worth", amount: Math.round(netWorth) },
  ];

  return (
    <CalculatorLayout
      title="Net Worth Calculator"
      description="Track your net worth by adding assets and liabilities with real-time totals."
      icon={<span>💎</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Net Worth" value={formatCurrency(netWorth)} highlight={netWorth >= 0} />
          <ResultCard label="Total Assets" value={formatCurrency(safeAssets)} />
          <ResultCard label="Total Liabilities" value={formatCurrency(safeLiabilities)} />
          <ResultCard label="Debt-to-Asset Ratio" value={formatPercentage(dti)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="category" yKey="amount" title="Assets vs Liabilities" />
      <CalculatorInput input={{ id: "assets", label: "Total Assets", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "Cash, investments, property, vehicles, and other valuables." }} value={assets} onChange={setAssets} />
      <CalculatorInput input={{ id: "liabilities", label: "Total Liabilities", type: "number", defaultValue: 150000, suffix: "$", min: 0, tooltip: "Mortgages, loans, credit card debt, and other obligations." }} value={liabilities} onChange={setLiabilities} />
    </CalculatorLayout>
  );
}
