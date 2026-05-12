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

function calcRemainingBalance(principal: number, annualRate: number, payment: number, monthsElapsed: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const pmt = Math.max(0, payment ?? 0);
  const mr = r / 100 / 12;
  if (mr === 0) return Math.max(0, p - pmt * Math.max(0, monthsElapsed));
  return Math.max(0, p * Math.pow(1 + mr, monthsElapsed) - pmt * ((Math.pow(1 + mr, monthsElapsed) - 1) / mr));
}

export default function RentVsBuyCalculator() {
  const [rent, setRent] = React.useState(2000);
  const [homePrice, setHomePrice] = React.useState(350000);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [hoa, setHoa] = React.useState(300);
  const [maintenance, setMaintenance] = React.useState(200);
  const [years, setYears] = React.useState(7);
  const [yearsUnit, setYearsUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeRent = Math.max(0, rent ?? 0);
  const safePrice = Math.max(0, homePrice ?? 0);
  const safeDownPct = Math.max(0, Math.min(downPct ?? 0, 100));
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeHoa = Math.max(0, hoa ?? 0);
  const safeMaint = Math.max(0, maintenance ?? 0);

  const totalMonths = Math.max(1, toMonths(years, yearsUnit));
  const actualYears = Math.round(totalMonths / 12);

  const downPayment = safePrice * (safeDownPct / 100);
  const loanAmount = safePrice - downPayment;
  const termMonths = 360; // 30 years
  const mortgagePmt = isFinite(calcMonthlyPayment(loanAmount, safeRate, termMonths)) ? calcMonthlyPayment(loanAmount, safeRate, termMonths) : 0;
  const totalBuyMonthly = mortgagePmt + safeHoa + safeMaint;
  const annualRentIncrease = 0.03;

  // Build chart data (max actualYears points, already limited)
  const chartData: { year: string; "Rent Cost": number; "Buy Cost": number }[] = [
    { year: "Year 0", "Rent Cost": 0, "Buy Cost": Math.round(downPayment) },
  ];

  for (let y = 1; y <= actualYears; y++) {
    const yearlyRent = safeRent * Math.pow(1 + annualRentIncrease, y - 1) * 12;
    const cumulativeRent = chartData[y - 1]!["Rent Cost"] + Math.round(yearlyRent);

    const monthlyPeriods = y * 12;
    const remainingBalance = calcRemainingBalance(loanAmount, safeRate, mortgagePmt, monthlyPeriods);
    const homeValue = Math.round(safePrice * Math.pow(1.03, y));
    const equity = Math.max(0, homeValue - remainingBalance);
    const cumulativeBuyCost = Math.round(downPayment + totalBuyMonthly * 12 * y - equity);

    chartData.push({
      year: `Year ${y}`,
      "Rent Cost": cumulativeRent,
      "Buy Cost": cumulativeBuyCost,
    });
  }

  // Final calculations
  let totalRentCost = 0;
  let currentRent = safeRent;
  for (let y = 1; y <= actualYears; y++) {
    totalRentCost += currentRent * 12;
    currentRent *= (1 + annualRentIncrease);
  }

  const totalBuyOutlay = downPayment + (mortgagePmt + safeHoa + safeMaint) * 12 * actualYears;
  const homeValueEnd = Math.round(safePrice * Math.pow(1.03, actualYears));
  const remainingBalanceFinal = calcRemainingBalance(loanAmount, safeRate, mortgagePmt, actualYears * 12);
  const equity = Math.max(0, homeValueEnd - remainingBalanceFinal);
  const netBuyCost = totalBuyOutlay - equity;
  const buyingCheaper = netBuyCost <= totalRentCost;

  return (
    <CalculatorLayout
      title="Rent vs. Buy 🏠"
      description="Compare the financial outcomes of renting versus buying a home over any time horizon."
      icon={<span>🏠</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Cost of Renting" value={formatCurrency(totalRentCost)} subtext={`Over ${formatNumber(actualYears)} years`} />
          <ResultCard label="Cost of Buying" value={formatCurrency(netBuyCost)} subtext={`After equity of ${formatCurrency(Math.max(0, equity))}`} highlight={buyingCheaper} />
          <ResultCard label="Net Difference" value={formatCurrency(Math.abs(totalRentCost - netBuyCost))} subtext={buyingCheaper ? "Buying is cheaper" : "Renting is cheaper"} />
          <ResultCard label="Monthly Payment (Buy)" value={formatCurrency(totalBuyMonthly)} subtext={`P&I + HOA + Maintenance`} />
          <ResultCard label="Monthly Rent (Year 1)" value={formatCurrency(safeRent)} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Rent Cost", "Buy Cost"]} title="Cumulative Costs" />
      <CalculatorInput input={{ id: "rent", label: "Monthly Rent", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Your current monthly rent payment." }} value={rent} onChange={setRent} />
      <CalculatorInput input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 350000, suffix: "$", min: 0, tooltip: "Purchase price of the home you are considering." }} value={homePrice} onChange={setHomePrice} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1, tooltip: "Percentage you can put down on the home." }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Mortgage Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Expected mortgage interest rate." }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "hoa", label: "Monthly HOA Fees", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Monthly homeowners association fees." }} value={hoa} onChange={setHoa} />
      <CalculatorInput input={{ id: "maintenance", label: "Monthly Maintenance", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Estimated 1% of home value per year for maintenance." }} value={maintenance} onChange={setMaintenance} />
      <PeriodInput id="years" label="Time Horizon" value={years} unit={yearsUnit} onValueChange={setYears} onUnitChange={setYearsUnit} min={1} max={30} />
    </CalculatorLayout>
  );
}
