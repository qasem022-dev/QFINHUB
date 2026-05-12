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

export default function PMICalculator() {
  const [homePrice, setHomePrice] = React.useState(300000);
  const [downPct, setDownPct] = React.useState(10);
  const [rate, setRate] = React.useState(6.5);
  const [term, setTerm] = React.useState(30);
  const [termUnit, setTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");

  const safePrice = Math.max(0, homePrice ?? 0);
  const safeDownPct = Math.max(0, Math.min(downPct ?? 0, 100));
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));

  const termMonths = Math.max(1, toMonths(term, termUnit));
  const loanAmount = safePrice * (1 - safeDownPct / 100);
  const ltv = safePrice > 0 ? (loanAmount / safePrice) * 100 : 0;
  const mr = safeRate / 100 / 12;

  // Base P&I payment
  const basePI = isFinite(calcMonthlyPayment(loanAmount, safeRate, termMonths))
    ? calcMonthlyPayment(loanAmount, safeRate, termMonths) : 0;

  // PMI: 0.78% annual if LTV > 80%
  const pmiRate = 0.78;
  const monthlyPMI = ltv > 80 ? (loanAmount * (pmiRate / 100 / 12)) : 0;
  const totalWithPMI = basePI + monthlyPMI;

  // Simulate months until LTV reaches 78%
  let bal = loanAmount;
  let monthsUntilCancel = termMonths;
  const targetLTV = 0.78 * homePrice;

  for (let m = 1; m <= termMonths; m++) {
    const interest = bal * mr;
    const principalPmt = basePI - interest;
    bal = Math.max(0, bal - principalPmt);

    if (bal <= targetLTV) {
      monthsUntilCancel = m;
      break;
    }
  }

  const isPMIApplicable = ltv > 80;

  // Chart data: payment with vs without PMI
  const chartData: { year: string; WithPMI: number; WithoutPMI: number }[] = [];
  for (let y = 1; y <= term; y++) {
    const withPMI = y <= Math.ceil(monthsUntilCancel / 12) ? totalWithPMI * 12 : basePI * 12;
    chartData.push({
      year: `Yr ${y}`,
      WithPMI: Math.round(withPMI),
      WithoutPMI: Math.round(basePI * 12),
    });
  }

  return (
    <CalculatorLayout
      title="PMI Calculator 🛡️"
      description="Calculate private mortgage insurance costs and when PMI will automatically terminate."
      icon={<span>🛡️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Base P&amp;I Payment" value={formatCurrency(basePI)} />
          {isPMIApplicable ? (
            <>
              <ResultCard label="Monthly PMI" value={formatCurrency(monthlyPMI)} subtext={`${formatNumber(pmiRate)}% annual rate`} />
              <ResultCard label="Total Payment (with PMI)" value={formatCurrency(totalWithPMI)} highlight />
              <ResultCard label="Months Until PMI Cancellation" value={`${formatNumber(monthsUntilCancel)} months (${(monthsUntilCancel / 12).toFixed(1)} years)`} subtext="When amortized LTV reaches 78%" />
            </>
          ) : (
            <ResultCard label="PMI Not Required" value="$0" subtext="20%+ down payment" highlight />
          )}
          <ResultCard label="Loan Amount" value={formatCurrency(loanAmount)} subtext={`${formatNumber(safeDownPct)}% down on ${formatCurrency(safePrice)}`} />
          <ResultCard label="Initial LTV" value={`${ltv.toFixed(1)}%`} />
        </div>
      }
    >
      <CalculatorChart
        type="area"
        data={chartData}
        xKey="year"
        yKey={["WithPMI", "WithoutPMI"]}
        title="Annual Payment: With vs. Without PMI"
      />
      <CalculatorInput
        input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 300000, suffix: "$", min: 0, tooltip: "The purchase price of the home." }}
        value={homePrice}
        onChange={setHomePrice}
      />
      <CalculatorInput
        input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 10, suffix: "%", min: 3, max: 50, step: 1, tooltip: "PMI required when down payment is under 20%." }}
        value={downPct}
        onChange={setDownPct}
      />
      <CalculatorInput
        input={{ id: "rate", label: "Interest Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Annual mortgage interest rate." }}
        value={rate}
        onChange={setRate}
      />
      <PeriodInput id="term" label="Loan Term" value={term} unit={termUnit} onValueChange={setTerm} onUnitChange={setTermUnit} min={1} max={40} />
    </CalculatorLayout>
  );
}
