"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function Four01kCalculator() {
  const [balance, setBalance] = React.useState(25000);
  const [annualContrib, setAnnualContrib] = React.useState(15000);
  const [employerMatch, setEmployerMatch] = React.useState(50);
  const [matchLimit, setMatchLimit] = React.useState(6);
  const [returnRate, setReturnRate] = React.useState(7);
  const [yearsToRetire, setYearsToRetire] = React.useState(30);

  const r = returnRate / 100;

  // Employee contribution per year
  const salary = annualContrib / (matchLimit / 100); // implied salary
  const matchableContrib = Math.min(annualContrib, salary * (matchLimit / 100));
  const employerContrib = matchableContrib * (employerMatch / 100);
  const totalAnnualContrib = annualContrib + employerContrib;

  let totalEmployeeContrib = 0;
  let totalEmployerContrib = 0;
  let currentBalance = balance;

  const chartData: { year: string; "Your Contributions": number; "Employer Contributions": number; "Investment Growth": number }[] = [];

  for (let y = 0; y <= yearsToRetire; y++) {
    const growthPortion = currentBalance - totalEmployeeContrib - totalEmployerContrib;
    if (y === 0) {
      chartData.push({
        year: `Year ${y}`,
        "Your Contributions": Math.round(balance),
        "Employer Contributions": 0,
        "Investment Growth": 0,
      });
    } else {
      currentBalance = currentBalance * (1 + r) + totalAnnualContrib;
      totalEmployeeContrib += annualContrib;
      totalEmployerContrib += employerContrib;
      chartData.push({
        year: `Year ${y}`,
        "Your Contributions": Math.round(totalEmployeeContrib + balance),
        "Employer Contributions": Math.round(totalEmployerContrib),
        "Investment Growth": Math.round(currentBalance - totalEmployeeContrib - totalEmployerContrib - balance),
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
          <ResultCard label="Your Contributions" value={formatCurrency(totalEmployeeContrib + balance)} subtext={`Over ${yearsToRetire} years`} />
          <ResultCard label="Employer Contributions" value={formatCurrency(totalEmployerContrib)} />
        </div>
      }
    >
      <CalculatorChart type="area" data={chartData} xKey="year" yKey={["Your Contributions", "Employer Contributions", "Investment Growth"]} title="401(k) Growth Breakdown" />
      <CalculatorInput input={{ id: "balance", label: "Current 401(k) Balance", type: "number", defaultValue: 25000, suffix: "$", min: 0 }} value={balance} onChange={setBalance} />
      <CalculatorInput input={{ id: "annualContrib", label: "Annual Contribution", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "Your annual pre-tax contribution." }} value={annualContrib} onChange={setAnnualContrib} />
      <CalculatorInput input={{ id: "employerMatch", label: "Employer Match", type: "number", defaultValue: 50, suffix: "%", min: 0, max: 100, tooltip: "Percentage of your contribution your employer matches (e.g., 50% means they match $0.50 per $1)." }} value={employerMatch} onChange={setEmployerMatch} />
      <CalculatorInput input={{ id: "matchLimit", label: "Match Limit", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.5, tooltip: "Maximum percentage of salary your employer will match." }} value={matchLimit} onChange={setMatchLimit} />
      <CalculatorInput input={{ id: "returnRate", label: "Expected Annual Return", type: "number", defaultValue: 7, suffix: "%", min: 0, max: 30, step: 0.1 }} value={returnRate} onChange={setReturnRate} />
      <CalculatorInput input={{ id: "yearsToRetire", label: "Years to Retirement", type: "number", defaultValue: 30, suffix: "years", min: 1, max: 50 }} value={yearsToRetire} onChange={setYearsToRetire} />
    </CalculatorLayout>
  );
}
