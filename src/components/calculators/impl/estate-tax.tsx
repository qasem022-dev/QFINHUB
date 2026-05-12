"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

const FEDERAL_EXEMPTION_2024 = 12920000;
const FEDERAL_ESTATE_RATE = 0.40;

export default function EstateTaxCalculator() {
  const [estateValue, setEstateValue] = React.useState(5000000);
  const [stateExemption, setStateExemption] = React.useState(5000000);
  const [federalExemption, setFederalExemption] = React.useState(FEDERAL_EXEMPTION_2024);
  const [stateRate, setStateRate] = React.useState(16);
  const [previousGifts, setPreviousGifts] = React.useState(0);

  const safeEstate = Math.max(0, isFinite(estateValue) ? estateValue : 0);
  const safeStateExempt = Math.max(0, isFinite(stateExemption) ? stateExemption : 0);
  const safeFedExempt = Math.max(0, isFinite(federalExemption) ? federalExemption : 0);
  const safeStateRate = Math.max(0, isFinite(stateRate) ? stateRate : 0);
  const safeGifts = Math.max(0, isFinite(previousGifts) ? previousGifts : 0);

  const taxableEstate = Math.max(0, safeEstate - safeFedExempt - safeGifts);
  const stateTaxable = Math.max(0, safeEstate - safeStateExempt);
  const federalTax = taxableEstate * FEDERAL_ESTATE_RATE;
  const stateTax = stateTaxable * (safeStateRate / 100);
  const totalTax = federalTax + stateTax;
  const netToHeirs = Math.max(0, safeEstate - totalTax);
  const effectiveTaxRate = safeEstate > 0 ? (totalTax / safeEstate) * 100 : 0;

  const pieData = [
    { name: "Net to Heirs", value: Math.round(netToHeirs) },
    { name: "Federal Estate Tax", value: Math.round(federalTax) },
    { name: "State Estate Tax", value: Math.round(stateTax) },
  ];

  return (
    <CalculatorLayout
      title="Estate Tax Calculator"
      description="Estimate federal and state estate taxes on your taxable estate, and calculate what your heirs will receive."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Federal Estate Tax" value={formatCurrency(federalTax)} subtext={`Taxable estate: ${formatCurrency(taxableEstate)}`} />
          <ResultCard label="State Estate Tax" value={formatCurrency(stateTax)} subtext={`${safeStateRate}% rate`} />
          <ResultCard label="Total Estate Tax" value={formatCurrency(totalTax)} highlight />
          <ResultCard label="Net to Heirs" value={formatCurrency(netToHeirs)} highlight />
          <ResultCard label="Effective Tax Rate" value={`${effectiveTaxRate.toFixed(1)}%`} subtext={`Federal exemption: ${formatCurrency(safeFedExempt)}`} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Estate Distribution" height={300} />
      <CalculatorInput
        input={{ id: "estateValue", label: "Total Estate Value", type: "number", defaultValue: 5000000, suffix: "$", min: 0, step: 100000, tooltip: "The total fair market value of all assets in the estate." }}
        value={estateValue}
        onChange={setEstateValue}
      />
      <CalculatorInput
        input={{ id: "stateExemption", label: "State Exemption Amount", type: "number", defaultValue: 5000000, suffix: "$", min: 0, step: 100000, tooltip: "State-level estate tax exemption." }}
        value={stateExemption}
        onChange={setStateExemption}
      />
      <CalculatorInput
        input={{ id: "federalExemption", label: "Federal Exemption Amount", type: "number", defaultValue: FEDERAL_EXEMPTION_2024, suffix: "$", min: 0, step: 100000, tooltip: "Federal estate tax exemption for 2024: $12.92 million." }}
        value={federalExemption}
        onChange={setFederalExemption}
      />
      <CalculatorInput
        input={{ id: "stateRate", label: "State Estate Tax Rate", type: "number", defaultValue: 16, suffix: "%", min: 0, max: 40, step: 0.5, tooltip: "Your state's estate tax rate as a percentage." }}
        value={stateRate}
        onChange={setStateRate}
      />
      <CalculatorInput
        input={{ id: "previousGifts", label: "Previous Taxable Gifts", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 10000, tooltip: "Lifetime taxable gifts that reduce the federal exemption." }}
        value={previousGifts}
        onChange={setPreviousGifts}
      />
    </CalculatorLayout>
  );
}
