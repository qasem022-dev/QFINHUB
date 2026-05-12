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

export default function BiweeklyMortgageCalculator() {
  const [balance, setBalance] = React.useState(250000);
  const [rate, setRate] = React.useState(6);
  const [originalTerm, setOriginalTerm] = React.useState(30);
  const [originalTermUnit, setOriginalTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [yearsRemaining, setYearsRemaining] = React.useState(25);
  const [yearsRemainingUnit, setYearsRemainingUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safeBalance = Math.max(0, balance ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(originalTerm, originalTermUnit));
  const remainingMonths = Math.max(1, toMonths(yearsRemaining, yearsRemainingUnit));
  const mr = safeRate / 100 / 12;

  // Standard monthly
  const monthlyPayment = isFinite(calcMonthlyPayment(safeBalance, safeRate, remainingMonths))
    ? calcMonthlyPayment(safeBalance, safeRate, remainingMonths) : 0;

  // Biweekly: half the monthly payment paid 26 times/year
  const biweeklyPayment = monthlyPayment / 2;
  const biweeklyPerYear = biweeklyPayment * 26;
  const effectiveMonthlyExtra = biweeklyPerYear / 12 - monthlyPayment;
  const effectiveBiweeklyMonthlyPayment = monthlyPayment + effectiveMonthlyExtra;

  // Simulate standard payoff
  let stdBal = safeBalance;
  let stdMonths = 0;
  while (stdBal > 0 && stdMonths < 600) {
    const interest = stdBal * mr;
    let principalPmt = monthlyPayment - interest;
    if (principalPmt > stdBal) principalPmt = stdBal;
    stdBal = Math.max(0, stdBal - principalPmt);
    stdMonths++;
  }

  // Simulate biweekly (13 full payments/year)
  let bwBal = safeBalance;
  let bwMonths = 0;
  while (bwBal > 0 && bwMonths < 600) {
    const interest = bwBal * mr;
    let principalPmt = effectiveBiweeklyMonthlyPayment - interest;
    if (principalPmt > bwBal) principalPmt = bwBal;
    bwBal = Math.max(0, bwBal - principalPmt);
    bwMonths++;
  }

  const standardTotalInterest = monthlyPayment * stdMonths - safeBalance;
  const biweeklyTotalInterest = effectiveBiweeklyMonthlyPayment * bwMonths - safeBalance;
  const interestSavings = Math.max(0, standardTotalInterest - biweeklyTotalInterest);
  const monthsEarly = stdMonths - bwMonths;

  // Chart data - annual snapshots (max 36 years)
  const maxYears = Math.min(Math.ceil(Math.max(stdMonths, bwMonths) / 12), 36);
  const chartData: { year: string; Standard: number; Biweekly: number }[] = [
    { year: "Start", Standard: Math.round(safeBalance), Biweekly: Math.round(safeBalance) },
  ];

  for (let y = 1; y <= maxYears; y++) {
    let sBal = safeBalance;
    for (let m = 1; m <= y * 12; m++) {
      if (m <= stdMonths) {
        const si = sBal * mr;
        let sp = monthlyPayment - si;
        if (sp > sBal) sp = sBal;
        sBal = Math.max(0, sBal - sp);
      }
    }

    let bBal = safeBalance;
    for (let m = 1; m <= y * 12; m++) {
      if (m <= bwMonths) {
        const bi = bBal * mr;
        let bp = effectiveBiweeklyMonthlyPayment - bi;
        if (bp > bBal) bp = bBal;
        bBal = Math.max(0, bBal - bp);
      }
    }

    chartData.push({
      year: `Yr ${y}`,
      Standard: Math.round(sBal),
      Biweekly: Math.round(bBal),
    });
  }

  return (
    <CalculatorLayout
      title="Biweekly Mortgage Calculator 📅"
      description="Compare biweekly payment schedules against standard monthly payments and see interest savings."
      icon={<span>📅</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Standard Monthly Payment" value={formatCurrency(monthlyPayment)} />
          <ResultCard label="Biweekly Payment Amount" value={formatCurrency(biweeklyPayment)} subtext="Paid 26 times per year" />
          <ResultCard label="Effective Monthly (Biweekly)" value={formatCurrency(effectiveBiweeklyMonthlyPayment)} subtext="13 full payments per year" highlight />
          <ResultCard label="Standard Payoff" value={`${Math.floor(stdMonths / 12)} years ${stdMonths % 12} months`} />
          <ResultCard label="Biweekly Payoff" value={`${Math.floor(bwMonths / 12)} years ${bwMonths % 12} months`} subtext={monthsEarly > 0 ? `${formatNumber(monthsEarly)} months sooner` : ""} />
          <ResultCard label="Interest Savings" value={formatCurrency(interestSavings)} />
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate" subtext="No benefit from biweekly payments" />}
        </div>
      }
    >
      <CalculatorChart
        type="line"
        data={chartData}
        xKey="year"
        yKey={["Standard", "Biweekly"]}
        title="Balance: Standard vs. Biweekly"
      />
      <CalculatorInput
        input={{ id: "balance", label: "Loan Balance", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "Current mortgage loan balance." }}
        value={balance}
        onChange={setBalance}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual mortgage interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="originalTerm" label="Original Loan Term" value={originalTerm} unit={originalTermUnit} onValueChange={setOriginalTerm} onUnitChange={setOriginalTermUnit} min={1} max={40} />
      <PeriodInput id="yearsRemaining" label="Years Remaining" value={yearsRemaining} unit={yearsRemainingUnit} onValueChange={setYearsRemaining} onUnitChange={setYearsRemainingUnit} min={1} max={40} />
    </CalculatorLayout>
  );
}
