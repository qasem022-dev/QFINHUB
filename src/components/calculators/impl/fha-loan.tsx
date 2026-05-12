"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function FHALoanCalculator() {
  const [homePrice, setHomePrice] = React.useState(300000);
  const [downPct, setDownPct] = React.useState(3.5);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [mipRate, setMipRate] = React.useState(0.85);

  const safePrice = Math.max(0, homePrice ?? 0);
  const safeDownPct = Math.max(0, Math.min(downPct ?? 0, 100));
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeMipRate = Math.max(0, Math.min(mipRate ?? 0, 5));

  const termMonths = Math.max(1, toMonths(term, termUnit));
  const downPayment = safePrice * (safeDownPct / 100);
  const baseLoan = safePrice - downPayment;

  const monthlyPI = isFinite(calcMonthlyPayment(baseLoan, safeRate, termMonths))
    ? calcMonthlyPayment(baseLoan, safeRate, termMonths) : 0;
  const monthlyMIP = baseLoan * (safeMipRate / 100 / 12);
  const totalMonthly = monthlyPI + monthlyMIP;

  const totalInterest = monthlyPI * termMonths - baseLoan;
  const totalMIP = monthlyMIP * termMonths;
  const totalCost = baseLoan + totalInterest + totalMIP;

  // Chart data: annual - limit to 36 points
  const maxChartYears = Math.min(term, 36);
  const chartData: { year: string; PrincipalInterest: number; MIP: number }[] = [];
  for (let y = 1; y <= maxChartYears; y++) {
    chartData.push({
      year: `Yr ${y}`,
      PrincipalInterest: Math.round(monthlyPI * 12),
      MIP: Math.round(monthlyMIP * 12),
    });
  }

  return (
    <CalculatorLayout
      title="FHA Loan Calculator 🏛️"
      description="Estimate monthly payments and MIP costs for FHA-insured home loans."
      icon={<span>🏛️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Base Loan Amount" value={formatCurrency(baseLoan)} subtext={`Down payment: ${formatCurrency(downPayment)} (${formatNumber(safeDownPct)}%)`} />
          <ResultCard label="Monthly P&amp;I" value={formatCurrency(monthlyPI)} />
          <ResultCard label="Monthly MIP" value={formatCurrency(monthlyMIP)} subtext={`${formatNumber(safeMipRate)}% annual rate`} />
          <ResultCard label="Total Monthly Payment" value={formatCurrency(totalMonthly)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
          <ResultCard label="Total MIP Paid" value={formatCurrency(totalMIP)} />
          <ResultCard label="Total Cost" value={formatCurrency(totalCost)} subtext={`Over ${formatNumber(termMonths)} months`} />
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate" subtext="MIP still applies" />}
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={chartData}
        xKey="year"
        yKey={["PrincipalInterest", "MIP"]}
        title="P&amp;I vs. MIP Per Year"
      />
      <CalculatorInput
        input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 300000, suffix: "$", min: 0, tooltip: "Purchase price of the home." }}
        value={homePrice}
        onChange={setHomePrice}
      />
      <CalculatorInput
        input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 3.5, suffix: "%", min: 3.5, max: 20, step: 0.5, tooltip: "Minimum FHA down payment is 3.5%." }}
        value={downPct}
        onChange={setDownPct}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual mortgage interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} />
      <CalculatorInput
        input={{ id: "mipRate", label: "Annual MIP Rate", type: "number", defaultValue: 0.85, suffix: "%", min: 0, max: 2, step: 0.05, tooltip: "Upfront MIP is typically 1.75% of base loan; annual MIP varies (0.45%–1.05%)." }}
        value={mipRate}
        onChange={setMipRate}
      />
    </CalculatorLayout>
  );
}
