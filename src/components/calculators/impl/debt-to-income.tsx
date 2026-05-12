"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function DebtToIncomeCalculator() {
  const [income, setIncome] = React.useState(6000);
  const [housing, setHousing] = React.useState(1500);
  const [autoLoan, setAutoLoan] = React.useState(400);
  const [creditCard, setCreditCard] = React.useState(200);
  const [studentLoan, setStudentLoan] = React.useState(300);
  const [otherDebt, setOtherDebt] = React.useState(100);

  const safeIncome = isFinite(income) ? income : 0;
  const totalDebt = (isFinite(housing) ? housing : 0)
    + (isFinite(autoLoan) ? autoLoan : 0)
    + (isFinite(creditCard) ? creditCard : 0)
    + (isFinite(studentLoan) ? studentLoan : 0)
    + (isFinite(otherDebt) ? otherDebt : 0);
  const dti = safeIncome > 0 ? (totalDebt / safeIncome) * 100 : 0;
  const frontEnd = safeIncome > 0 ? ((isFinite(housing) ? housing : 0) / safeIncome) * 100 : 0;
  const backEnd = safeIncome > 0 ? (totalDebt / safeIncome) * 100 : 0;

  const qualification = dti <= 36 ? "Good" : dti <= 43 ? "Fair" : dti <= 50 ? "Poor" : "Very Poor";

  const pieData = [
    { name: "Housing", value: housing },
    { name: "Auto Loan", value: autoLoan },
    { name: "Credit Card", value: creditCard },
    { name: "Student Loan", value: studentLoan },
    { name: "Other Debt", value: otherDebt },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Debt-to-Income Ratio"
      description="Calculate your DTI ratio to understand your debt levels and loan qualification."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="DTI Ratio" value={formatPercentage(dti / 100)} highlight />
          <ResultCard label="Front-End Ratio" value={formatPercentage(frontEnd / 100)} />
          <ResultCard label="Back-End Ratio" value={formatPercentage(backEnd / 100)} />
          <ResultCard label="Total Monthly Debt" value={formatCurrency(totalDebt)} />
          <ResultCard label="Qualification" value={qualification} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Debt Breakdown" />
      <CalculatorInput input={{ id: "income", label: "Monthly Gross Income", type: "number", defaultValue: 6000, suffix: "$", min: 0, tooltip: "Your total monthly income before taxes." }} value={income} onChange={setIncome} />
      <CalculatorInput input={{ id: "housing", label: "Housing Debt", type: "number", defaultValue: 1500, suffix: "$", min: 0, tooltip: "Mortgage or rent payment." }} value={housing} onChange={setHousing} />
      <CalculatorInput input={{ id: "auto-loan", label: "Auto Loan", type: "number", defaultValue: 400, suffix: "$", min: 0, tooltip: "Monthly car loan payment." }} value={autoLoan} onChange={setAutoLoan} />
      <CalculatorInput input={{ id: "credit-card", label: "Credit Card", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Minimum monthly credit card payments." }} value={creditCard} onChange={setCreditCard} />
      <CalculatorInput input={{ id: "student-loan", label: "Student Loan", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Monthly student loan payment." }} value={studentLoan} onChange={setStudentLoan} />
      <CalculatorInput input={{ id: "other-debt", label: "Other Debt", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "Personal loans, alimony, child support, etc." }} value={otherDebt} onChange={setOtherDebt} />
    </CalculatorLayout>
  );
}
