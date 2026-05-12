"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function LeaseVsBuyCalculator() {
  const [vehiclePrice, setVehiclePrice] = React.useState(40000);
  const [leaseTerm, setLeaseTerm] = React.useState(36);
  const [leaseTermUnit, setLeaseTermUnit] = React.useState<PeriodUnit>("months");
  const [moneyFactor, setMoneyFactor] = React.useState(0.0025);
  const [residualPercent, setResidualPercent] = React.useState(55);
  const [buyApr, setBuyApr] = React.useState(6);
  const [buyTerm, setBuyTerm] = React.useState(60);
  const [buyTermUnit, setBuyTermUnit] = React.useState<PeriodUnit>("months");
  const [downPayment, setDownPayment] = React.useState(5000);

  const safePrice = Math.max(0, vehiclePrice ?? 0);
  const safeMoneyFactor = Math.max(0, Math.min(moneyFactor ?? 0, 0.1));
  const safeResidualPct = Math.max(0, Math.min(residualPercent ?? 0, 100));
  const safeBuyApr = Math.max(0, Math.min(buyApr ?? 0, 100));
  const safeDown = Math.max(0, downPayment ?? 0);

  const leaseTermMonths = Math.max(1, toMonths(leaseTerm, leaseTermUnit));
  const buyTermMonths = Math.max(1, toMonths(buyTerm, buyTermUnit));

  // Lease calculation
  const residualValue = safePrice * (safeResidualPct / 100);
  const capCost = safePrice;
  const depFee = (capCost - residualValue) / leaseTermMonths;
  const mfFee = (capCost + residualValue) * safeMoneyFactor;
  const leasePayment = depFee + mfFee;

  // Buy calculation
  const loanAmount = Math.max(0, safePrice - safeDown);
  const buyPayment = isFinite(calcMonthlyPayment(loanAmount, safeBuyApr, buyTermMonths))
    ? calcMonthlyPayment(loanAmount, safeBuyApr, buyTermMonths) : 0;
  const buyTotal = buyPayment * buyTermMonths + safeDown;

  // Total lease cost
  const totalLeaseCost = leasePayment * leaseTermMonths + safeDown;
  const monthlyDiff = buyPayment - leasePayment;

  const chartData = [
    { name: "Lease", "Monthly Payment": Math.round(leasePayment), "Total Cost": Math.round(totalLeaseCost) },
    { name: "Buy", "Monthly Payment": Math.round(buyPayment), "Total Cost": Math.round(buyTotal) },
  ];

  return (
    <CalculatorLayout
      title="Lease vs. Buy Calculator 🏷️"
      description="Compare the total cost of leasing versus buying a vehicle or asset over time."
      icon={<span>🏷️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Lease Monthly Payment" value={formatCurrency(leasePayment)} />
          <ResultCard label="Buy Monthly Payment" value={formatCurrency(buyPayment)} />
          <ResultCard label="Monthly Difference" value={formatCurrency(Math.abs(monthlyDiff))} subtext={monthlyDiff > 0 ? "Buy is cheaper monthly" : monthlyDiff < 0 ? "Lease is cheaper monthly" : "Same monthly"} highlight={monthlyDiff !== 0} />
          <ResultCard label="Total Lease Cost" value={formatCurrency(totalLeaseCost)} subtext={`${formatNumber(leaseTermMonths)} months`} />
          <ResultCard label="Total Buy Cost" value={formatCurrency(buyTotal)} subtext={`${formatNumber(buyTermMonths)} months + down payment`} />
          <ResultCard label="Total Difference" value={formatCurrency(Math.abs(totalLeaseCost - buyTotal))} subtext={totalLeaseCost < buyTotal ? "Lease costs less overall" : "Buy costs less overall"} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["Monthly Payment", "Total Cost"]} title="Lease vs Buy Comparison" />
      <CalculatorInput input={{ id: "vehiclePrice", label: "Vehicle Price", type: "number", defaultValue: 40000, suffix: "$", min: 0, tooltip: "The purchase price of the vehicle." }} value={vehiclePrice} onChange={setVehiclePrice} />
      <CalculatorInput input={{ id: "downPayment", label: "Down Payment", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Cash paid upfront (applies to both lease and buy)." }} value={downPayment} onChange={setDownPayment} />
      <PeriodInput id="leaseTerm" label="Lease Term" value={leaseTerm} unit={leaseTermUnit} onValueChange={setLeaseTerm} onUnitChange={setLeaseTermUnit} min={6} max={120} />
      <CalculatorInput input={{ id: "moneyFactor", label: "Lease Money Factor", type: "number", defaultValue: 0.0025, min: 0, max: 0.01, step: 0.0001, tooltip: "The money factor equivalent of the lease APR. Multiply by 2400 to get APR." }} value={moneyFactor} onChange={setMoneyFactor} />
      <CalculatorInput input={{ id: "residualPercent", label: "Lease Residual (%)", type: "number", defaultValue: 55, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Estimated percentage of MSRP retained as residual value at lease end." }} value={residualPercent} onChange={setResidualPercent} />
      <CalculatorInput input={{ id: "buyApr", label: "Buy APR", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Annual percentage rate if financing the purchase." }} value={buyApr} onChange={setBuyApr} />
      <PeriodInput id="buyTerm" label="Buy Loan Term" value={buyTerm} unit={buyTermUnit} onValueChange={setBuyTerm} onUnitChange={setBuyTermUnit} min={6} max={120} />
    </CalculatorLayout>
  );
}
