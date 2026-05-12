"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

export default function HomeEquityCalculator() {
  const [homeValue, setHomeValue] = React.useState(350000);
  const [mortgageBalance, setMortgageBalance] = React.useState(220000);
  const [otherLiens, setOtherLiens] = React.useState(10000);

  const safeValue = Math.max(0, homeValue ?? 0);
  const safeMortgage = Math.max(0, mortgageBalance ?? 0);
  const safeLiens = Math.max(0, otherLiens ?? 0);

  const totalLiens = safeMortgage + safeLiens;
  const equity = safeValue - totalLiens;
  const ltv = safeValue > 0 ? (totalLiens / safeValue) * 100 : 0;
  const maxHelocRatio = 0.8;
  const availableEquity = safeValue > 0 ? Math.max(0, safeValue * maxHelocRatio - totalLiens) : 0;

  const pieData = [
    { name: "Equity", value: Math.round(Math.max(0, equity)) },
    { name: "Total Debt", value: Math.round(totalLiens) },
  ];

  return (
    <CalculatorLayout
      title="Home Equity Calculator 🏠"
      description="Calculate your home equity, loan-to-value ratio, and available equity for borrowing."
      icon={<span>🏠</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Home Equity" value={formatCurrency(Math.max(0, equity))} highlight />
          <ResultCard label="Current LTV" value={formatPercentage(ltv / 100)} subtext="Loan-to-Value ratio" />
          <ResultCard label="Available for HELOC" value={formatCurrency(availableEquity)} subtext={`80% max combined LTV`} />
          <ResultCard label="Home Value" value={formatCurrency(safeValue)} />
          <ResultCard label="Mortgage Balance" value={formatCurrency(safeMortgage)} />
          {safeLiens > 0 && (
            <ResultCard label="Other Liens" value={formatCurrency(safeLiens)} />
          )}
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Equity vs. Debt" />
      <CalculatorInput
        input={{ id: "homeValue", label: "Home Value", type: "number", defaultValue: 350000, suffix: "$", min: 0, tooltip: "Current estimated market value of your home." }}
        value={homeValue}
        onChange={setHomeValue}
      />
      <CalculatorInput
        input={{ id: "mortgageBalance", label: "Mortgage Balance", type: "number", defaultValue: 220000, suffix: "$", min: 0, tooltip: "Remaining balance on your primary mortgage." }}
        value={mortgageBalance}
        onChange={setMortgageBalance}
      />
      <CalculatorInput
        input={{ id: "otherLiens", label: "Other Liens", type: "number", defaultValue: 10000, suffix: "$", min: 0, tooltip: "Home equity loans, lines of credit, judgments, etc." }}
        value={otherLiens}
        onChange={setOtherLiens}
      />
    </CalculatorLayout>
  );
}
