"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { ShareableResultCard } from "@/components/calculators/shareable-result-card";
import { PeriodInput, toMonths } from "@/components/calculators/period-input";
import { formatCurrency, formatNumber } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const p = Math.max(0, principal ?? 0);
  const r = Math.max(0, Math.min(annualRate ?? 0, 100));
  const t = Math.max(1, termMonths ?? 1);
  if (r === 0) return p / t;
  const mr = r / 100 / 12;
  return (p * mr * Math.pow(1 + mr, t)) / (Math.pow(1 + mr, t) - 1);
}

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = React.useState(350000);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [startDate, setStartDate] = React.useState<string>("");
  const [taxes, setTaxes] = React.useState(3000);
  const [insurance, setInsurance] = React.useState(1200);

  const safePrice = Math.max(0, homePrice ?? 0);
  const safeDownPct = Math.max(0, Math.min(downPct ?? 0, 100));
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeTaxes = Math.max(0, taxes ?? 0);
  const safeInsurance = Math.max(0, insurance ?? 0);

  const downPayment = safePrice * (safeDownPct / 100);
  const loanAmount = safePrice - downPayment;
  const termMonths = Math.max(1, toMonths(term, termUnit));
  const pAndI = isFinite(calcMonthlyPayment(loanAmount, safeRate, termMonths)) ? calcMonthlyPayment(loanAmount, safeRate, termMonths) : 0;
  const monthlyTaxes = safeTaxes / 12;
  const monthlyInsurance = safeInsurance / 12;
  const hasPMI = safeDownPct < 20 && loanAmount > 0;
  const pmiRate = hasPMI ? (loanAmount * 0.005) / 12 : 0;
  const totalMonthly = pAndI + monthlyTaxes + monthlyInsurance + pmiRate;
  const totalPayment = totalMonthly * termMonths;
  const totalInterest = (pAndI * termMonths) - loanAmount;

  const pieData = [
    { name: "Principal & Interest", value: Math.round(pAndI * 12) },
    { name: "Property Taxes", value: Math.round(safeTaxes) },
    { name: "Insurance", value: Math.round(safeInsurance) },
    ...(hasPMI ? [{ name: "PMI", value: Math.round(pmiRate * 12) }] : []),
  ];

  return (
    <CalculatorLayout
      title="Mortgage Calculator 🏠"
      description="Estimate monthly mortgage payments including principal, interest, taxes, and insurance."
      icon={<span>🏠</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Payment" value={formatCurrency(totalMonthly)} highlight />
          <ResultCard label="Principal + Interest" value={formatCurrency(pAndI)} />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} subtext={`Over ${formatNumber(termMonths)} months`} />
          <ResultCard label="Down Payment" value={formatCurrency(downPayment)} subtext={`${formatNumber(safeDownPct)}% of home price`} />
          {hasPMI && <ResultCard label="Monthly PMI" value={formatCurrency(pmiRate)} subtext="Required for &lt; 20% down" />}
          {safeRate === 0 && <ResultCard label="Note" value="0% mortgage rate" subtext="No interest charged" />}
        </div>
      }
    >
      <ShareableResultCard
        calculatorName="Mortgage Calculator"
        resultLabel="Monthly Payment"
        resultValue={formatCurrency(totalMonthly)}
        secondaryLabel="Principal + Interest"
        secondaryValue={formatCurrency(pAndI)}
        details={[
          { label: "Home Price", value: formatCurrency(safePrice) },
          { label: "Down Payment", value: formatCurrency(downPayment) + ` (${safeDownPct}%)` },
          { label: "Interest Rate", value: `${safeRate}%` },
          { label: "Loan Term", value: `${term} ${termUnit}` },
          { label: "Total Interest", value: formatCurrency(totalInterest) },
        ]}
        url={typeof window !== "undefined" ? window.location.href : `https://www.qfinhub.com/calculators/mortgage-calculator`}
      />
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Annual Payment Breakdown" />
      <CalculatorInput input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 350000, suffix: "$", min: 0, tooltip: "The purchase price of the home." }} value={homePrice} onChange={setHomePrice} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1, tooltip: "Percentage of home price paid upfront. Below 20% requires PMI." }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual mortgage interest rate." }} value={rate} onChange={setRate} />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} showDatePicker startDate={startDate} onStartDateChange={setStartDate} />
      <CalculatorInput input={{ id: "taxes", label: "Annual Property Taxes", type: "number", defaultValue: 3000, suffix: "$", min: 0, tooltip: "Yearly property tax amount." }} value={taxes} onChange={setTaxes} />
      <CalculatorInput input={{ id: "insurance", label: "Annual Home Insurance", type: "number", defaultValue: 1200, suffix: "$", min: 0, tooltip: "Yearly homeowners insurance premium." }} value={insurance} onChange={setInsurance} />
    </CalculatorLayout>
  );
}
