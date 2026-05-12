"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput } from "@/components/calculators/period-input";

const RMD_FACTORS: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
  79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 11.4, 91: 10.2, 92: 9.0,
  93: 7.8, 94: 6.6, 95: 5.4,
};

export default function RequiredMinimumDistributionCalculator() {
  const [accountBalance, setAccountBalance] = React.useState(500000);
  const [age, setAge] = React.useState(72);
  const [type, setType] = React.useState(0); // 0 = Own Account, 1 = Inherited

  const safeBalance = Math.max(0, isFinite(accountBalance) ? accountBalance : 0);
  const safeAge = Math.max(72, Math.min(95, isFinite(age) ? age : 72));

  const factor = RMD_FACTORS[safeAge] ?? RMD_FACTORS[72]!;
  const rmd = safeBalance / factor;

  // Project future RMDs assuming 5% growth
  const growthRate = 0.05;
  const rmdChartData: { age: string; RMD: number; Balance: number }[] = [];
  const ages = [72, 75, 80, 85, 90, 95];
  let projectedBalance = safeBalance;
  for (const a of ages) {
    const f = RMD_FACTORS[a] ?? RMD_FACTORS[72]!;
    rmdChartData.push({
      age: `Age ${a}`,
      RMD: Math.round(projectedBalance / f),
      Balance: Math.round(projectedBalance),
    });
    projectedBalance = projectedBalance * (1 + growthRate);
  }

  return (
    <CalculatorLayout
      title="Required Minimum Distribution (RMD)"
      description="Calculate your Required Minimum Distribution from retirement accounts based on your age and account balance."
      icon={<span>📋</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Required Minimum Distribution" value={formatCurrency(rmd)} highlight />
          <ResultCard label="Distribution Period Factor" value={formatNumber(factor, 1)} subtext={`Age ${safeAge} factor (Uniform Lifetime Table)`} />
          <ResultCard label="Account Type" value={type === 0 ? "Own Account" : "Inherited Account"} />
          <ResultCard label="Account Balance" value={formatCurrency(safeBalance)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={rmdChartData} xKey="age" yKey={["RMD"]} title="RMD at Different Ages" height={250} />
      <CalculatorInput
        input={{ id: "accountBalance", label: "Account Balance", type: "number", defaultValue: 500000, suffix: "$", min: 0, step: 10000, tooltip: "Your current retirement account balance." }}
        value={accountBalance}
        onChange={setAccountBalance}
      />
      <CalculatorInput
        input={{ id: "age", label: "Current Age", type: "slider", defaultValue: 72, min: 72, max: 90, step: 1, suffix: "years", tooltip: "Your current age. RMDs begin at age 72 (or 73 depending on birth year)." }}
        value={age}
        onChange={setAge}
      />
      <CalculatorInput
        input={{ id: "type", label: "Account Type", type: "select", defaultValue: 0, options: [{ label: "Own Account", value: 0 }, { label: "Inherited Account", value: 1 }], tooltip: "Different rules apply for inherited IRA RMDs." }}
        value={type}
        onChange={setType}
      />
    </CalculatorLayout>
  );
}
