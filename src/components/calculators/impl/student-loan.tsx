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

export default function StudentLoanCalculator() {
  const [totalLoan, setTotalLoan] = React.useState(35000);
  const [rate, setRate] = React.useState(5.5);
  const [standardTerm, setStandardTerm] = React.useState(10);
  const [standardTermUnit, setStandardTermUnit] = React.useState<"days" | "weeks" | "months" | "years">("years");
  const [customPayment, setCustomPayment] = React.useState(0);

  const safeLoan = Math.max(0, totalLoan ?? 0);
  const safeRate = Math.max(0, Math.min(rate ?? 0, 100));
  const termMonths = Math.max(1, toMonths(standardTerm, standardTermUnit));
  const standardPayment = isFinite(calcMonthlyPayment(safeLoan, safeRate, termMonths)) ? calcMonthlyPayment(safeLoan, safeRate, termMonths) : 0;
  const useCustom = customPayment > 0;

  // If custom payment, calculate payoff time
  let payoffMonths = 0;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const mr = safeRate / 100 / 12;

  if (useCustom) {
    let balance = safeLoan;
    const payment = customPayment;
    while (balance > 0 && payoffMonths < 600) {
      const interest = balance * mr;
      const principalPmt = Math.min(payment - interest, balance);
      if (principalPmt <= 0) break;
      totalInterestPaid += interest;
      balance -= principalPmt;
      payoffMonths++;
    }
    totalPaid = safeLoan + totalInterestPaid;
  } else {
    payoffMonths = termMonths;
    totalPaid = standardPayment * termMonths;
    totalInterestPaid = totalPaid - safeLoan;
  }

  const monthlyDisplay = useCustom ? customPayment : standardPayment;
  const isUnpaid = useCustom && payoffMonths >= 600;

  // Build chart data
  const chartData: { label: string; Amount: number }[] = [
    { label: "Total Loan", Amount: Math.round(safeLoan) },
    { label: "Total Interest", Amount: Math.round(totalInterestPaid) },
  ];

  return (
    <CalculatorLayout
      title="Student Loan Calculator 🎓"
      description="Plan student loan repayment with standard or custom payment schedules."
      icon={<span>🎓</span>}
      results={
        <div className="space-y-4">
          <ResultCard label={useCustom ? "Payoff Time" : "Monthly Payment"} value={useCustom ? `${formatNumber(payoffMonths)} mo (${(payoffMonths / 12).toFixed(1)} yrs)` : formatCurrency(standardPayment)} highlight />
          {!useCustom && <ResultCard label="Standard Term" value={`${standardTerm} ${standardTermUnit}`} subtext={`${formatNumber(termMonths)} months`} />}
          <ResultCard label="Total Interest" value={formatCurrency(totalInterestPaid)} />
          <ResultCard label="Total Cost" value={formatCurrency(totalPaid)} subtext={`Over ${formatNumber(payoffMonths)} months`} />
          {useCustom && <ResultCard label="Custom Monthly Payment" value={formatCurrency(customPayment)} />}
          {isUnpaid && (
            <ResultCard label="⚠️ Payment Too Low" value="May never pay off" subtext="Payment doesn't cover growing interest" />
          )}
          {safeRate === 0 && <ResultCard label="Note" value="0% interest rate" subtext="Payments go entirely to principal" />}
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="label" yKey="Amount" title="Loan vs Interest Breakdown" />
      <CalculatorInput input={{ id: "totalLoan", label: "Total Loan Amount", type: "number", defaultValue: 35000, suffix: "$", min: 0, tooltip: "Your total student loan balance across all loans." }} value={totalLoan} onChange={setTotalLoan} />
      <CalculatorInput input={{ id: "rate", label: "Annual Interest Rate", type: "number", defaultValue: 5.5, suffix: "%", min: 0, max: 20, step: 0.1, tooltip: "Weighted average interest rate across all student loans." }} value={rate} onChange={setRate} />
      <PeriodInput id="standardTerm" label="Standard Term" value={standardTerm} unit={standardTermUnit} onValueChange={setStandardTerm} onUnitChange={setStandardTermUnit} min={5} max={30} />
      <CalculatorInput input={{ id: "customPayment", label: "Custom Monthly Payment (0 = standard)", type: "number", defaultValue: 0, suffix: "$", min: 0, step: 1, tooltip: "Enter a custom payment amount to see how it affects payoff time. Leave at 0 to use the standard term." }} value={customPayment} onChange={setCustomPayment} />
    </CalculatorLayout>
  );
}
