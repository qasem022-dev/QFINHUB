"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
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

export default function VALoanCalculator() {
  const [homePrice, setHomePrice] = React.useState(350000);
  const [downPayment, setDownPayment] = React.useState(0);
  const [rate, setRate] = React.useState(6);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [fundingFee, setFundingFee] = React.useState(2.3);
  const [exempt, setExempt] = React.useState(0);

  const safePrice = Math.max(0, homePrice ?? 0);
  const safeDown = Math.max(0, downPayment ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const safeFee = Math.max(0, Math.min(fundingFee ?? 0, 10));

  const termMonths = Math.max(1, toMonths(term, termUnit));
  const isExempt = exempt === 1;

  const fundingFeeAmount = isExempt ? 0 : safePrice * (safeFee / 100);
  const loanAmount = safePrice - safeDown + fundingFeeAmount;

  const monthlyPayment = isFinite(calcMonthlyPayment(loanAmount, safeRate, termMonths))
    ? calcMonthlyPayment(loanAmount, safeRate, termMonths) : 0;
  const totalCost = monthlyPayment * termMonths;
  const totalInterest = totalCost - loanAmount;

  // Chart data: annual - limit to 36 points
  const maxChartYears = Math.min(term, 36);
  const chartData: { year: string; Payment: number }[] = [];
  for (let y = 1; y <= maxChartYears; y++) {
    chartData.push({
      year: `Yr ${y}`,
      Payment: Math.round(monthlyPayment * 12),
    });
  }

  return (
    <CalculatorLayout
      title="VA Loan Calculator 🎖️"
      description="Calculate monthly payments and funding fee for VA-guaranteed home loans."
      icon={<span>🎖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Funding Fee"
            value={isExempt ? "$0 (Exempt)" : formatCurrency(fundingFeeAmount)}
            subtext={isExempt ? "" : `${formatNumber(safeFee)}% of home price`}
          />
          <ResultCard
            label="Loan Amount (with fee)"
            value={formatCurrency(loanAmount)}
            subtext={`Home: ${formatCurrency(safePrice)} - Down: ${formatCurrency(safeDown)} + Fee: ${formatCurrency(fundingFeeAmount)}`}
          />
          <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} highlight />
          <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
          <ResultCard label="Total Cost Over Term" value={formatCurrency(totalCost)} subtext={`Over ${formatNumber(termMonths)} months`} />
          {safeRate === 0 && <ResultCard label="Note" value="0% VA loan rate" subtext="No interest charged" />}
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={chartData}
        xKey="year"
        yKey={["Payment"]}
        title="Annual Payment Amount"
      />
      <CalculatorInput
        input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 350000, suffix: "$", min: 0, tooltip: "Purchase price of the home." }}
        value={homePrice}
        onChange={setHomePrice}
      />
      <CalculatorInput
        input={{ id: "downPayment", label: "Down Payment", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "VA loans typically require $0 down payment." }}
        value={downPayment}
        onChange={setDownPayment}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual VA loan interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} />
      <CalculatorInput
        input={{ id: "fundingFee", label: "Funding Fee", type: "number", defaultValue: 2.3, suffix: "%", min: 0, max: 5, step: 0.1, tooltip: "VA funding fee varies from 0.5%–3.3% depending on down payment and service history." }}
        value={fundingFee}
        onChange={setFundingFee}
      />
      <CalculatorInput
        input={{ id: "exempt", label: "Exempt from Fee", type: "select", defaultValue: 0, options: [{ label: "No (pay fee)", value: 0 }, { label: "Yes (exempt)", value: 1 }], tooltip: "Veterans with VA disability ratings or surviving spouses may be exempt." }}
        value={exempt}
        onChange={setExempt}
      />
    </CalculatorLayout>
  );
}
