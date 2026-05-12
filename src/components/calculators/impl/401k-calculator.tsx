"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function Four01kCalculator() {
  const [balance, setBalance] = React.useState(25000);
  const [annualContrib, setAnnualContrib] = React.useState(15000);
  const [employerMatch, setEmployerMatch] = React.useState(50);
  const [matchLimit, setMatchLimit] = React.useState(6);
  const [returnRate, setReturnRate] = React.useState(7);
  const [yearsToRetire, setYearsToRetire] = React.useState(30);
  const [yearsToRetireUnit, setYearsToRetireUnit] = React.useState<PeriodUnit>("years");

  const safeBalance = Math.max(0, isFinite(balance) ? balance : 0);
  const safeAnnualContrib = Math.max(0, isFinite(annualContrib) ? annualContrib : 0);
  const safeMatch = Math.max(0, isFinite(employerMatch) ? employerMatch : 0);
  const safeMatchLimit = Math.max(0, isFinite(matchLimit) ? matchLimit : 0);
  const safeReturnRate = Math.max(0, isFinite(returnRate) ? returnRate : 0);

  const r = safeReturnRate / 100;
  const yearsToRetireInYears = toMonths(yearsToRetire, yearsToRetireUnit) / 12;

  // Employee contribution per year (guard against matchLimit=0)
  const salary = safeMatchLimit > 0 ? safeAnnualContrib / (safeMatchLimit / 100) : 0;
  const matchableContrib = safeMatchLimit > 0 ? Math.min(safeAnnualContrib, salary * (safeMatchLimit / 100)) : 0;
  const employerContrib = matchableContrib * (safeMatch / 100);
  const totalAnnualContrib = safeAnnualContrib + employerContrib;

  let totalEmployeeContrib = 0;
  let totalEmployerContrib = 0;
  let currentBalance = safeBalance;

  const chartData: { year: string; "Your Contributions": number; "Employer Contributions": number; "Investment Growth": number }[] = [];

  const maxYears = Math.min(Math.round(yearsToRetireInYears), 36);

  for (let y = 0; y <= maxYears; y++) {
    const growthPortion = currentBalance - totalEmployeeContrib - totalEmployerContrib;
    if (y === 0) {
      chartData.push({
        year: `Year ${y}`,
        "Your Contributions": Math.round(safeBalance),
        "Employer Contributions": 0,
        "Investment Growth": 0,
      });
    } else {
      currentBalance = currentBalance * (1 + r) + totalAnnualContrib;
      if (!isFinite(currentBalance)) currentBalance = 0;
      totalEmployeeContrib += safeAnnualContrib;
      totalEmployerContrib += employerContrib;
      chartData.push({
        year: `Year ${y}`,
        "Your Contributions": Math.round(totalEmployeeContrib + safeBalance),
        "Employer Contributions": Math.round(totalEmployerContrib),
        "Investment Growth": Math.round(currentBalance - totalEmployeeContrib - totalEmployerContrib - safeBalance),
      });
    }
  }

  const futureBalance = currentBalance;

  return (
    <CalculatorLayout
      title="401(k) Calculator"
      description="Estimate your 401(k) balance at retirement with employer match and contribution growth."
      icon={<span>🏦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Future Balance" value={formatCurrency(futureBalance)} highlight />
          <ResultCard label="Your Contributions" value={formatCurrency(totalEmployeeContrib + safeBalance)} subtext={`Over ${maxYears} years`} />
          <ResultCard label="Employer Match Total" value={formatCurrency(totalEmployerContrib)} highlight subtext={`${safeMatch}% match on first ${safeMatchLimit}% of salary`} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["Your Contributions", "Employer Contributions", "Investment Growth"]} title="401(k) Growth Breakdown" />
      <CalculatorInput input={{ id: "balance", label: "Current 401(k) Balance", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "Your current 401(k) account balance." }} value={balance} onChange={setBalance} />
      <CalculatorInput input={{ id: "annualContrib", label: "Annual Contribution", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "Your annual pre-tax contribution." }} value={annualContrib} onChange={setAnnualContrib} />
      <CalculatorInput input={{ id: "employerMatch", label: "Employer Match", type: "number", defaultValue: 50, suffix: "%", min: 0, max: 100, tooltip: "Percentage of your contribution your employer matches (e.g., 50% means they match $0.50 per $1)." }} value={employerMatch} onChange={setEmployerMatch} />
      <CalculatorInput input={{ id: "matchLimit", label: "Match Limit", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.5, tooltip: "Maximum percentage of salary your employer will match." }} value={matchLimit} onChange={setMatchLimit} />
      <CalculatorInput input={{ id: "returnRate", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1, tooltip: "Expected average annual return on your 401(k) investments." }} value={returnRate} onChange={setReturnRate} />
      <PeriodInput
        id="yearsToRetire"
        label="Years to Retirement"
        value={yearsToRetire}
        unit={yearsToRetireUnit}
        onValueChange={setYearsToRetire}
        onUnitChange={setYearsToRetireUnit}
        min={1}
        max={50}
      />
    </CalculatorLayout>
  );
}
