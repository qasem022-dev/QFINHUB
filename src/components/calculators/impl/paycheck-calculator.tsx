"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function PaycheckCalculator() {
  const [salary, setSalary] = React.useState(75000);
  const [payFreq, setPayFreq] = React.useState(26); // 52=Weekly, 26=Biweekly, 24=Semi-Monthly, 12=Monthly
  const [state, setState] = React.useState(1); // 1=CA, 2=TX, 3=NY, 4=FL, 5=IL, 6=Other
  const [preTax, setPreTax] = React.useState(0);
  const [postTax, setPostTax] = React.useState(0);
  const [filingStatus, setFilingStatus] = React.useState(1); // 1=Single, 2=Married

  const freqMap: Record<number, { label: string; factor: number }> = {
    52: { label: "Weekly", factor: 52 },
    26: { label: "Biweekly", factor: 26 },
    24: { label: "Semi-Monthly", factor: 24 },
    12: { label: "Monthly", factor: 12 },
  };

  const stateRates: Record<number, number> = {
    1: 0.05,   // CA
    2: 0,      // TX
    3: 0.04,   // NY
    4: 0,      // FL
    5: 0.0375, // IL
    6: 0.04,   // Other
  };

  const safeSalary = isFinite(salary) && salary >= 0 ? salary : 0;
  const safePreTax = isFinite(preTax) ? preTax : 0;
  const safePostTax = isFinite(postTax) ? postTax : 0;

  const factor = freqMap[payFreq]?.factor || 26;
  const grossPerPeriod = factor > 0 ? safeSalary / factor : 0;
  const taxableIncome = Math.max(0, grossPerPeriod - safePreTax);

  // Federal: ~12% effective
  const federalTax = taxableIncome * 0.12;
  const stateTaxRate = stateRates[state] || 0.04;
  const stateTax = taxableIncome * stateTaxRate;

  const ssWageBase = 168600;
  const ss = factor > 0 ? Math.min(safeSalary, ssWageBase) / factor * 0.062 : 0;
  const medicare = factor > 0 ? safeSalary / factor * 0.0145 : 0;
  const netPay = grossPerPeriod - federalTax - stateTax - ss - medicare - safePreTax - safePostTax;

  const freqLabel = freqMap[payFreq]?.label || "Biweekly";
  const stateLabels: Record<number, string> = { 1: "CA", 2: "TX", 3: "NY", 4: "FL", 5: "IL", 6: "Other" };

  const pieData = [
    { name: "Net Pay", value: netPay },
    { name: "Federal Tax", value: federalTax },
    { name: "State Tax", value: stateTax },
    { name: "Social Security", value: ss },
    { name: "Medicare", value: medicare },
    { name: "Pre-Tax Deductions", value: safePreTax },
    { name: "Post-Tax Deductions", value: safePostTax },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Paycheck Calculator"
      description="Estimate your take-home pay after federal, state, and FICA taxes."
      icon={<span>📄</span>}
      results={
        <div className="space-y-4">
          <ResultCard label={`Gross Pay (${freqLabel})`} value={formatCurrency(grossPerPeriod)} />
          <ResultCard label="Federal Tax" value={formatCurrency(federalTax)} />
          <ResultCard label="State Tax" value={formatCurrency(stateTax)} />
          <ResultCard label="Social Security" value={formatCurrency(ss)} />
          <ResultCard label="Medicare" value={formatCurrency(medicare)} />
          <ResultCard label="Net Pay" value={formatCurrency(Math.max(0, netPay))} highlight />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey={["value"]} title="Paycheck Breakdown" />
      <CalculatorInput input={{ id: "salary", label: "Annual Salary", type: "number", defaultValue: 75000, suffix: "$", min: 0, tooltip: "Your total annual salary before taxes and deductions." }} value={salary} onChange={setSalary} />
      <CalculatorInput input={{ id: "pay-freq", label: "Pay Frequency", type: "select", defaultValue: 26, options: [{ label: "Weekly", value: 52 }, { label: "Biweekly", value: 26 }, { label: "Semi-Monthly", value: 24 }, { label: "Monthly", value: 12 }], tooltip: "How often you get paid." }} value={payFreq} onChange={setPayFreq} />
      <CalculatorInput input={{ id: "state", label: "State", type: "select", defaultValue: 1, options: [{ label: "CA", value: 1 }, { label: "TX", value: 2 }, { label: "NY", value: 3 }, { label: "FL", value: 4 }, { label: "IL", value: 5 }, { label: "Other", value: 6 }], tooltip: "Your state of residence for state tax calculation." }} value={state} onChange={setState} />
      <CalculatorInput input={{ id: "pre-tax", label: "Pre-Tax Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Per-period pre-tax deductions (401k, HSA, health insurance)." }} value={preTax} onChange={setPreTax} />
      <CalculatorInput input={{ id: "post-tax", label: "Post-Tax Deductions", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Per-period post-tax deductions (Roth IRA, garnishments)." }} value={postTax} onChange={setPostTax} />
      <CalculatorInput input={{ id: "filing-status", label: "Filing Status", type: "select", defaultValue: 1, options: [{ label: "Single", value: 1 }, { label: "Married", value: 2 }], tooltip: "Your tax filing status (affects federal tax calculations)." }} value={filingStatus} onChange={setFilingStatus} />
    </CalculatorLayout>
  );
}
