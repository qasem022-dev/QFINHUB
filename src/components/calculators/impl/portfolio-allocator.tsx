"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function PortfolioAllocator() {
  const [stockPct, setStockPct] = React.useState(60);
  const [bondPct, setBondPct] = React.useState(30);
  const [cashPct, setCashPct] = React.useState(10);
  const [expectedStockReturn, setExpectedStockReturn] = React.useState(8);
  const [expectedBondReturn, setExpectedBondReturn] = React.useState(4);
  const [expectedCashReturn, setExpectedCashReturn] = React.useState(2);
  const [totalInvestment, setTotalInvestment] = React.useState(100000);

  const stockRisk = 15;
  const bondRisk = 5;
  const cashRisk = 1;

  const safeStockPct = isFinite(stockPct) ? Math.max(0, Math.min(stockPct, 100)) : 0;
  const safeBondPct = isFinite(bondPct) ? Math.max(0, Math.min(bondPct, 100)) : 0;
  const safeCashPct = isFinite(cashPct) ? Math.max(0, Math.min(cashPct, 100)) : 0;
  const safeStockRet = isFinite(expectedStockReturn) ? expectedStockReturn : 0;
  const safeBondRet = isFinite(expectedBondReturn) ? expectedBondReturn : 0;
  const safeCashRet = isFinite(expectedCashReturn) ? expectedCashReturn : 0;
  const safeTotalInv = isFinite(totalInvestment) ? Math.max(0, totalInvestment) : 0;

  const stockWeight = safeStockPct / 100;
  const bondWeight = safeBondPct / 100;
  const cashWeight = safeCashPct / 100;

  const totalAllocPct = safeStockPct + safeBondPct + safeCashPct;
  const normalizedStockW = totalAllocPct > 0 ? stockWeight / (totalAllocPct / 100) : 0;
  const normalizedBondW = totalAllocPct > 0 ? bondWeight / (totalAllocPct / 100) : 0;
  const normalizedCashW = totalAllocPct > 0 ? cashWeight / (totalAllocPct / 100) : 0;

  const weightedReturn =
    normalizedStockW * safeStockRet +
    normalizedBondW * safeBondRet +
    normalizedCashW * safeCashRet;

  const weightedRisk = Math.sqrt(
    Math.pow(normalizedStockW * stockRisk, 2) +
      Math.pow(normalizedBondW * bondRisk, 2) +
      Math.pow(normalizedCashW * cashRisk, 2),
  );

  const stockAmount = safeTotalInv * normalizedStockW;
  const bondAmount = safeTotalInv * normalizedBondW;
  const cashAmount = safeTotalInv * normalizedCashW;

  const pieData = [
    { name: "Stocks", value: Math.round(normalizedStockW * 100) },
    { name: "Bonds", value: Math.round(normalizedBondW * 100) },
    { name: "Cash", value: Math.round(normalizedCashW * 100) },
  ];

  return (
    <CalculatorLayout
      title="Portfolio Allocator"
      description="Design your asset allocation and see expected return, risk, and dollar amounts for each position."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Expected Return" value={formatPercentage(weightedReturn)} highlight />
          <ResultCard label="Portfolio Risk" value={formatPercentage(weightedRisk)} highlight />
          <ResultCard label="Stock Allocation" value={formatCurrency(stockAmount)} subtext={`${stockPct.toFixed(0)}% of portfolio`} />
          <ResultCard label="Bond Allocation" value={formatCurrency(bondAmount)} subtext={`${bondPct.toFixed(0)}% of portfolio`} />
          <ResultCard label="Cash Allocation" value={formatCurrency(cashAmount)} subtext={`${cashPct.toFixed(0)}% of portfolio`} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Portfolio Allocation" />
      <CalculatorInput
        input={{
          id: "stockPct",
          label: "Stocks %",
          type: "slider",
          defaultValue: 60,
          min: 0,
          max: 100,
          step: 1,
          suffix: "%",
          tooltip: "Percentage of portfolio allocated to equities.",
        }}
        value={stockPct}
        onChange={setStockPct}
      />
      <CalculatorInput
        input={{
          id: "bondPct",
          label: "Bonds %",
          type: "slider",
          defaultValue: 30,
          min: 0,
          max: 100,
          step: 1,
          suffix: "%",
          tooltip: "Percentage of portfolio allocated to bonds.",
        }}
        value={bondPct}
        onChange={setBondPct}
      />
      <CalculatorInput
        input={{
          id: "cashPct",
          label: "Cash %",
          type: "slider",
          defaultValue: 10,
          min: 0,
          max: 100,
          step: 1,
          suffix: "%",
          tooltip: "Percentage of portfolio held as cash or cash equivalents.",
        }}
        value={cashPct}
        onChange={setCashPct}
      />
      <CalculatorInput
        input={{
          id: "expectedStockReturn",
          label: "Expected Stock Return",
          type: "number",
          defaultValue: 8,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Expected annual return for the stock portion.",
        }}
        value={expectedStockReturn}
        onChange={setExpectedStockReturn}
      />
      <CalculatorInput
        input={{
          id: "expectedBondReturn",
          label: "Expected Bond Return",
          type: "number",
          defaultValue: 4,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Expected annual return for the bond portion.",
        }}
        value={expectedBondReturn}
        onChange={setExpectedBondReturn}
      />
      <CalculatorInput
        input={{
          id: "expectedCashReturn",
          label: "Expected Cash Return",
          type: "number",
          defaultValue: 2,
          min: 0,
          max: 100,
          step: 0.1,
          suffix: "%",
          tooltip: "Expected annual return for cash holdings.",
        }}
        value={expectedCashReturn}
        onChange={setExpectedCashReturn}
      />
      <CalculatorInput
        input={{
          id: "totalInvestment",
          label: "Total Investment",
          type: "number",
          defaultValue: 100000,
          min: 0,
          step: 1000,
          suffix: "$",
          tooltip: "Total amount of money to allocate across assets.",
        }}
        value={totalInvestment}
        onChange={setTotalInvestment}
      />
    </CalculatorLayout>
  );
}
