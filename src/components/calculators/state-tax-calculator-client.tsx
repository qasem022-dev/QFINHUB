"use client";

import React from "react";
import { CalculatorInput } from "@/components/calculators/calculator-input";
import { ResultCard } from "@/components/calculators/result-card";
import { formatCurrency } from "@/lib/utils";
import { calculateStateTax, type StateTaxData } from "@/lib/state-income-tax";

interface Props {
  state: string;
  stateData: StateTaxData;
}

export function StateTaxCalculatorClient({ state, stateData }: Props) {
  const [income, setIncome] = React.useState(75000);
  const [filingStatus, setFilingStatus] = React.useState(0);

  const taxOwed = calculateStateTax(income, state);
  const effectiveRateCalc = income > 0 ? (taxOwed / income) * 100 : 0;
  const takeHome = income - taxOwed;

  return (
    <>
      {/* Input: Annual Income */}
      <CalculatorInput
        input={{
          id: "income",
          label: "Annual Income",
          type: "number",
          defaultValue: 75000,
          min: 0,
          max: 10000000,
          step: 1000,
          suffix: "USD",
          placeholder: "75000",
          tooltip: "Your total annual taxable income before deductions.",
        }}
        value={income}
        onChange={setIncome}
      />

      {/* Input: Filing Status */}
      <CalculatorInput
        input={{
          id: "filingStatus",
          label: "Filing Status",
          type: "select",
          defaultValue: 0,
          options: [
            { value: 0, label: "Single" },
            { value: 1, label: "Married Filing Jointly" },
          ],
          tooltip: "Your federal filing status affects some state tax calculations.",
        }}
        value={filingStatus}
        onChange={setFilingStatus}
      />

      {/* Result: Tax Owed */}
      <ResultCard
        label={`Estimated ${stateData.name} State Tax`}
        value={formatCurrency(taxOwed)}
        subtext={`${effectiveRateCalc.toFixed(2)}% effective rate`}
        prefix={<span>💰</span>}
      />

      {/* Result: Take-Home */}
      <ResultCard
        label="Take-Home After State Tax"
        value={formatCurrency(takeHome)}
        subtext={`${(100 - effectiveRateCalc).toFixed(2)}% of income`}
        prefix={<span>🏠</span>}
      />

      {/* Result: Rate Summary */}
      <ResultCard
        label="State Tax Rate"
        value={
          stateData.flatRate !== undefined
            ? `${(stateData.flatRate * 100).toFixed(2)}%`
            : "Progressive"
        }
        subtext={
          stateData.flatRate !== undefined
            ? "Flat rate — same on every dollar"
            : "Multiple brackets — higher income taxed more"
        }
        prefix={<span>📊</span>}
      />
    </>
  );
}