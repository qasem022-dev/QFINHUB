"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function InsuranceNeedsCalculator() {
  const [annualIncome, setAnnualIncome] = React.useState(80000);
  const [yearsToReplace, setYearsToReplace] = React.useState(7);
  const [yearsToReplaceUnit, setYearsToReplaceUnit] = React.useState<PeriodUnit>("years");
  const [mortgage, setMortgage] = React.useState(250000);
  const [debts, setDebts] = React.useState(30000);
  const [collegeCosts, setCollegeCosts] = React.useState(100000);
  const [finalExpenses, setFinalExpenses] = React.useState(15000);
  const [currentCoverage, setCurrentCoverage] = React.useState(100000);
  const [spouseIncome, setSpouseIncome] = React.useState(40000);

  const safeIncome = Math.max(0, isFinite(annualIncome) ? annualIncome : 0);
  const safeYears = Math.max(0, isFinite(yearsToReplace) ? toMonths(yearsToReplace, yearsToReplaceUnit) / 12 : 0);
  const safeMortgage = Math.max(0, isFinite(mortgage) ? mortgage : 0);
  const safeDebts = Math.max(0, isFinite(debts) ? debts : 0);
  const safeCollege = Math.max(0, isFinite(collegeCosts) ? collegeCosts : 0);
  const safeFinal = Math.max(0, isFinite(finalExpenses) ? finalExpenses : 0);
  const safeCoverage = Math.max(0, isFinite(currentCoverage) ? currentCoverage : 0);
  const safeSpouse = Math.max(0, isFinite(spouseIncome) ? spouseIncome : 0);

  const incomeReplacement = safeIncome * safeYears;
  const totalNeeds = incomeReplacement + safeMortgage + safeDebts + safeCollege + safeFinal;
  const spouseContribution = safeSpouse * 0.3 * safeYears;
  const gap = Math.max(0, totalNeeds - safeCoverage - spouseContribution);
  const debtExpenses = safeMortgage + safeDebts + safeCollege + safeFinal;

  const stackData = [
    { name: "Income Replacement", value: Math.round(incomeReplacement) },
    { name: "Mortgage", value: Math.round(safeMortgage) },
    { name: "Debts", value: Math.round(safeDebts) },
    { name: "College Costs", value: Math.round(safeCollege) },
    { name: "Final Expenses", value: Math.round(safeFinal) },
  ];

  return (
    <CalculatorLayout
      title="Insurance Needs"
      description="Determine how much life insurance coverage you need to protect your family."
      icon={<span>🛡️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Insurance Need" value={formatCurrency(totalNeeds)} highlight />
          <ResultCard label="Income Replacement" value={formatCurrency(incomeReplacement)} subtext={`${safeYears} years at ${formatCurrency(safeIncome)}/yr`} />
          <ResultCard label="Debt & Expenses" value={formatCurrency(debtExpenses)} />
          <ResultCard label="Current Coverage" value={formatCurrency(safeCoverage)} />
          <ResultCard label="Insurance Gap" value={formatCurrency(gap)} highlight />
        </div>
      }
    >
      <CalculatorChart type="bar" data={stackData} xKey="name" yKey="value" title="Needs Breakdown" />
      <CalculatorInput input={{ id: "annual-income", label: "Annual Income", type: "number", defaultValue: 80000, suffix: "$", min: 0, tooltip: "Your current annual income." }} value={annualIncome} onChange={setAnnualIncome} />
      <PeriodInput
        id="years-to-replace"
        label="Years to Replace"
        value={yearsToReplace}
        unit={yearsToReplaceUnit}
        onValueChange={setYearsToReplace}
        onUnitChange={setYearsToReplaceUnit}
        min={1}
        max={30}
      />
      <CalculatorInput input={{ id: "mortgage", label: "Outstanding Mortgage", type: "number", defaultValue: 250000, suffix: "$", min: 0, tooltip: "Remaining balance on your mortgage." }} value={mortgage} onChange={setMortgage} />
      <CalculatorInput input={{ id: "debts", label: "Other Debts", type: "number", defaultValue: 30000, suffix: "$", min: 0, tooltip: "Car loans, credit cards, personal loans, etc." }} value={debts} onChange={setDebts} />
      <CalculatorInput input={{ id: "college-costs", label: "College Costs", type: "number", defaultValue: 100000, suffix: "$", min: 0, tooltip: "Estimated future college costs for children." }} value={collegeCosts} onChange={setCollegeCosts} />
      <CalculatorInput input={{ id: "final-expenses", label: "Final Expenses", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "Funeral and estate settlement costs." }} value={finalExpenses} onChange={setFinalExpenses} />
      <CalculatorInput input={{ id: "current-coverage", label: "Current Life Insurance", type: "number", defaultValue: 100000, suffix: "$", min: 0, tooltip: "Life insurance coverage you already have." }} value={currentCoverage} onChange={setCurrentCoverage} />
      <CalculatorInput input={{ id: "spouse-income", label: "Spouse Annual Income", type: "number", defaultValue: 40000, suffix: "$", min: 0, tooltip: "Your spouse's annual income." }} value={spouseIncome} onChange={setSpouseIncome} />
    </CalculatorLayout>
  );
}
