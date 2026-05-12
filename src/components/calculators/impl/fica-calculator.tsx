"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils";

export default function FicaCalculator() {
  const [wages, setWages] = React.useState(100000);
  const [filingStatus, setFilingStatus] = React.useState(1); // 1=Single, 2=Married
  const [selfEmployed, setSelfEmployed] = React.useState(0); // 0=No, 1=Yes

  const safeWages = isFinite(wages) && wages >= 0 ? wages : 0;

  const ssWageBase = 168600;
  const ssWages = Math.min(safeWages, ssWageBase);

  let ssTax: number;
  let medicareTax: number;
  let additionalMedicare: number;

  if (selfEmployed === 1) {
    ssTax = ssWages * 0.124;
    medicareTax = safeWages * 0.029;
    additionalMedicare = Math.max(0, safeWages - 200000) * 0.009;
  } else {
    ssTax = ssWages * 0.062;
    medicareTax = safeWages * 0.0145;
    additionalMedicare = Math.max(0, safeWages - 200000) * 0.009;
  }

  const totalFica = ssTax + medicareTax + additionalMedicare;
  const effectiveRate = safeWages > 0 ? totalFica / safeWages : 0;

  const pieData = [
    { name: "Social Security", value: isFinite(ssTax) ? ssTax : 0 },
    { name: "Medicare", value: isFinite(medicareTax) ? medicareTax : 0 },
    { name: "Additional Medicare", value: isFinite(additionalMedicare) ? additionalMedicare : 0 },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="FICA Calculator"
      description="Calculate your Social Security and Medicare taxes (FICA) including additional Medicare tax."
      icon={<span>🏛️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Social Security Tax" value={formatCurrency(ssTax)} />
          <ResultCard label="Medicare Tax" value={formatCurrency(medicareTax)} />
          <ResultCard label="Additional Medicare Tax" value={formatCurrency(additionalMedicare)} />
          <ResultCard label="Total FICA Tax" value={formatCurrency(totalFica)} highlight />
          <ResultCard label="Effective FICA Rate" value={formatPercentage(effectiveRate)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey={["value"]} title="FICA Tax Breakdown" />
      <CalculatorInput input={{ id: "wages", label: "Annual Wages", type: "number", defaultValue: 100000, suffix: "$", min: 0, tooltip: "Your total annual wages or self-employment income." }} value={wages} onChange={setWages} />
      <CalculatorInput input={{ id: "filing-status", label: "Filing Status", type: "select", defaultValue: 1, options: [{ label: "Single", value: 1 }, { label: "Married", value: 2 }], tooltip: "Your tax filing status (affects additional Medicare thresholds)." }} value={filingStatus} onChange={setFilingStatus} />
      <CalculatorInput input={{ id: "self-employed", label: "Self-Employed", type: "select", defaultValue: 0, options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }], tooltip: "Self-employed individuals pay both the employee and employer portions of FICA." }} value={selfEmployed} onChange={setSelfEmployed} />
    </CalculatorLayout>
  );
}
