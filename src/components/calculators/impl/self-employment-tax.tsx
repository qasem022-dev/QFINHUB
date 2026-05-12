"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const SE_TAX_RATE = 0.153;
const SOCIAL_SECURITY_RATE = 0.124;
const MEDICARE_RATE = 0.029;
const SE_EARNINGS_MULTIPLIER = 0.9235;
const SOCIAL_SECURITY_WAGE_BASE = 168600;

export default function SelfEmploymentTaxCalculator() {
  const [netEarnings, setNetEarnings] = React.useState(80000);
  const [w2Wages, setW2Wages] = React.useState(0);
  const [otherDeductions, setOtherDeductions] = React.useState(0);

  const safeEarnings = Math.max(0, isFinite(netEarnings) ? netEarnings : 0);
  const safeW2 = Math.max(0, isFinite(w2Wages) ? w2Wages : 0);
  const safeDeductions = Math.max(0, isFinite(otherDeductions) ? otherDeductions : 0);

  const seEarnings = safeEarnings * SE_EARNINGS_MULTIPLIER;
  const remainingSsBase = Math.max(0, SOCIAL_SECURITY_WAGE_BASE - safeW2);
  const socialSecurityTax = Math.min(seEarnings, remainingSsBase) * SOCIAL_SECURITY_RATE;
  const medicareTax = seEarnings * MEDICARE_RATE;
  const totalSeTax = socialSecurityTax + medicareTax;
  const deductiblePortion = totalSeTax * 0.5;
  const effectiveTaxRate = safeEarnings > 0 ? (totalSeTax - deductiblePortion) / safeEarnings : 0;
  const scheduleSeDeduction = deductiblePortion;
  const adjustedGrossIncome = Math.max(0, safeEarnings - scheduleSeDeduction - safeDeductions);

  const pieData = [
    { name: "Social Security", value: Math.round(socialSecurityTax) },
    { name: "Medicare", value: Math.round(medicareTax) },
    { name: "Deductible Portion", value: Math.round(deductiblePortion) },
  ];

  return (
    <CalculatorLayout
      title="Self-Employment Tax"
      description="Calculate your self-employment tax (Social Security and Medicare) based on net earnings, including the deductible portion."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Self-Employment Tax" value={formatCurrency(totalSeTax)} highlight />
          <ResultCard label="Social Security Portion" value={formatCurrency(socialSecurityTax)} />
          <ResultCard label="Medicare Portion" value={formatCurrency(medicareTax)} />
          <ResultCard label="Deductible Portion" value={formatCurrency(deductiblePortion)} highlight subtext="50% of SE tax — deductible on Form 1040 Schedule 1" />
          <ResultCard label="Effective Tax Rate" value={formatPercentage(effectiveTaxRate)} subtext={`${SE_TAX_RATE * 100}% gross rate`} />
          <ResultCard label="Adj. Gross Income After SE Deduction" value={formatCurrency(adjustedGrossIncome)} subtext="For Form 1040 line 11" />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="SE Tax Breakdown" />
      <CalculatorInput
        input={{ id: "netEarnings", label: "Net Earnings from Self-Employment", type: "number", defaultValue: 80000, suffix: "$", min: 0, step: 1000, tooltip: "Your net self-employment income after business expenses (Schedule C line 31 or Schedule F line 34)." }}
        value={netEarnings}
        onChange={setNetEarnings}
      />
      <CalculatorInput
        input={{ id: "w2Wages", label: "W-2 Wages", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 1000, tooltip: "Any W-2 wages subject to FICA. These reduce the Social Security wage base available for self-employment." }}
        value={w2Wages}
        onChange={setW2Wages}
      />
      <CalculatorInput
        input={{ id: "otherDeductions", label: "Above-the-Line Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 500, tooltip: "Health insurance premiums, retirement contributions (SEP IRA, Solo 401(k)), and other adjustments to income." }}
        value={otherDeductions}
        onChange={setOtherDeductions}
      />
    </CalculatorLayout>
  );
}
