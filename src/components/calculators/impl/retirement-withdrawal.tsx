"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function RetirementWithdrawalCalculator() {
  const [totalSavings, setTotalSavings] = React.useState(1000000);
  const [retirementAge, setRetirementAge] = React.useState(65);
  const [expectedReturn, setExpectedReturn] = React.useState(6);
  const [strategy, setStrategy] = React.useState(0); // 0 = 4% Rule, 1 = Fixed Dollar
  const [fixedWithdrawal, setFixedWithdrawal] = React.useState(40000);
  const [retirementYears, setRetirementYears] = React.useState(20);
  const [retirementYearsUnit, setRetirementYearsUnit] = React.useState<PeriodUnit>("years");

  const safeSavings = Math.max(0, isFinite(totalSavings) ? totalSavings : 0);
  const safeReturn = Math.max(0, isFinite(expectedReturn) ? expectedReturn : 0);
  const safeFixedWithdrawal = Math.max(0, isFinite(fixedWithdrawal) ? fixedWithdrawal : 0);

  const r = safeReturn / 100;
  const retirementYearsInYears = toMonths(retirementYears, retirementYearsUnit) / 12;
  const annualWithdrawal = strategy === 0 ? safeSavings * 0.04 : safeFixedWithdrawal;
  const monthlyWithdrawal = annualWithdrawal / 12;

  // Simulate balance over time
  let balance = safeSavings;
  let yearsLasted = 0;
  const balanceChartData: { year: string; "Portfolio Balance": number }[] = [
    { year: "Start", "Portfolio Balance": Math.round(balance) },
  ];

  const MAX_ITERATIONS = Math.min(100, Math.ceil(retirementYearsInYears) + 10);
  if (annualWithdrawal > 0) {
    for (let y = 0; y < MAX_ITERATIONS; y++) {
      if (balance <= 0) break;
      balance = balance * (1 + r) - annualWithdrawal;
      yearsLasted = y + 1;
      balanceChartData.push({
        year: `Year ${y + 1}`,
        "Portfolio Balance": Math.round(Math.max(0, balance)),
      });
      if (balance <= 0) break;
    }
  }

  const willOutliveSavings = balance > 0;

  // Safe withdrawal rate scenarios
  const swr3 = safeSavings * 0.03;
  const swr4 = safeSavings * 0.04;
  const swr5 = safeSavings * 0.05;

  return (
    <CalculatorLayout
      title="Retirement Withdrawal Calculator"
      description="Simulate retirement withdrawals using the 4% rule or a fixed-dollar strategy and see how long your savings last."
      icon={<span>💸</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Withdrawal" value={formatCurrency(annualWithdrawal)} highlight subtext={strategy === 0 ? "4% Rule" : "Fixed Dollar Strategy"} />
          <ResultCard label="Monthly Withdrawal" value={formatCurrency(monthlyWithdrawal)} />
          <ResultCard label="Years Money Lasts" value={willOutliveSavings ? `${formatNumber(yearsLasted, 0)}+ years` : formatNumber(yearsLasted, 0)} highlight subtext={willOutliveSavings ? "✅ Portfolio outlives retirement horizon" : yearsLasted < retirementYearsInYears ? "⚠️ Savings may run out before life expectancy" : "✅ Savings cover expected retirement period"} />
          <ResultCard label="Retirement Period" value={`${formatNumber(retirementYearsInYears, 0)} years`} subtext={`Age ${retirementAge} to ${retirementAge + retirementYearsInYears}`} />
          <ResultCard label="3% SWR Annual" value={formatCurrency(swr3)} subtext="Conservative withdrawal" />
          <ResultCard label="5% SWR Annual" value={formatCurrency(swr5)} subtext="Aggressive withdrawal" />
        </div>
      }
    >
      <CalculatorChart type="area" data={balanceChartData} xKey="year" yKey={["Portfolio Balance"]} title="Portfolio Balance Over Time" height={300} />
      <CalculatorInput
        input={{ id: "totalSavings", label: "Total Retirement Savings", type: "number", defaultValue: 1000000, suffix: "$", min: 0, step: 10000, tooltip: "Your total retirement savings balance at retirement." }}
        value={totalSavings}
        onChange={setTotalSavings}
      />
      <CalculatorInput
        input={{ id: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, suffix: "years", min: 40, max: 80, step: 1, tooltip: "The age at which you plan to retire." }}
        value={retirementAge}
        onChange={setRetirementAge}
      />
      <PeriodInput
        id="retirementYears"
        label="Retirement Period"
        value={retirementYears}
        unit={retirementYearsUnit}
        onValueChange={setRetirementYears}
        onUnitChange={setRetirementYearsUnit}
        min={1}
        max={50}
      />
      <CalculatorInput
        input={{ id: "expectedReturn", label: "Expected Annual Return", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Expected average annual return during retirement." }}
        value={expectedReturn}
        onChange={setExpectedReturn}
      />
      <CalculatorInput
        input={{ id: "strategy", label: "Withdrawal Strategy", type: "select", defaultValue: 0, options: [{ label: "4% Rule", value: 0 }, { label: "Fixed Dollar", value: 1 }], tooltip: "Choose the 4% rule for inflation-adjusted withdrawals or a fixed dollar amount." }}
        value={strategy}
        onChange={(v) => { setStrategy(v); }}
      />
      {strategy === 1 && (
        <CalculatorInput
          input={{ id: "fixedWithdrawal", label: "Annual Withdrawal Amount", type: "number", defaultValue: 40000, suffix: "$", min: 0, step: 1000, tooltip: "Fixed dollar amount you plan to withdraw each year." }}
          value={fixedWithdrawal}
          onChange={setFixedWithdrawal}
        />
      )}
    </CalculatorLayout>
  );
}
