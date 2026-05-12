"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ClosingCostsCalculator() {
  const [homePrice, setHomePrice] = React.useState(350000);
  const [loanAmount, setLoanAmount] = React.useState(280000);
  const [originationFee, setOriginationFee] = React.useState(1);
  const [appraisal, setAppraisal] = React.useState(500);
  const [titleInsurance, setTitleInsurance] = React.useState(1500);
  const [escrow, setEscrow] = React.useState(800);
  const [inspection, setInspection] = React.useState(400);
  const [recording, setRecording] = React.useState(150);
  const [transferTax, setTransferTax] = React.useState(0.5);
  const [otherCosts, setOtherCosts] = React.useState(0);

  const safePrice = Math.max(0, homePrice ?? 0);
  const safeLoan = Math.max(0, loanAmount ?? 0);
  const safeOrigFee = Math.max(0, Math.min(originationFee ?? 0, 10));
  const safeAppraisal = Math.max(0, appraisal ?? 0);
  const safeTitle = Math.max(0, titleInsurance ?? 0);
  const safeEscrow = Math.max(0, escrow ?? 0);
  const safeInspection = Math.max(0, inspection ?? 0);
  const safeRecording = Math.max(0, recording ?? 0);
  const safeTransferTax = Math.max(0, Math.min(transferTax ?? 0, 10));
  const safeOther = Math.max(0, otherCosts ?? 0);

  const originationFeeAmt = safeLoan * (safeOrigFee / 100);
  const transferTaxAmt = safePrice * (safeTransferTax / 100);

  const costItems = [
    { label: "Origination Fee", value: originationFeeAmt },
    { label: "Appraisal Fee", value: safeAppraisal },
    { label: "Title Insurance", value: safeTitle },
    { label: "Escrow / Settlement", value: safeEscrow },
    { label: "Home Inspection", value: safeInspection },
    { label: "Recording Fees", value: safeRecording },
    { label: "Transfer Tax", value: transferTaxAmt },
    { label: "Other Costs", value: safeOther },
  ];

  const totalCosts = costItems.reduce((sum, item) => sum + item.value, 0);

  const pieData = costItems
    .filter((item) => item.value > 0)
    .map((item) => ({
      name: item.label,
      value: Math.round(item.value),
    }));

  return (
    <CalculatorLayout
      title="Closing Costs Calculator 📋"
      description="Estimate total closing costs for buying or refinancing a home including fees and taxes."
      icon={<span>📋</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Closing Costs" value={formatCurrency(totalCosts)} highlight />
          <ResultCard
            label="As % of Purchase Price"
            value={`${((totalCosts / safePrice) * 100).toFixed(2)}%`}
            subtext={`Home price: ${formatCurrency(safePrice)}`}
          />
          {costItems.map((item) => (
            <ResultCard
              key={item.label}
              label={item.label}
              value={formatCurrency(item.value)}
            />
          ))}
        </div>
      }
    >
      <CalculatorChart
        type="pie"
        data={pieData}
        xKey="name"
        yKey="value"
        title="Closing Cost Breakdown"
      />
      <CalculatorInput
        input={{ id: "homePrice", label: "Home Purchase Price", type: "number", defaultValue: 350000, suffix: "$", min: 0 }}
        value={homePrice}
        onChange={setHomePrice}
      />
      <CalculatorInput
        input={{ id: "loanAmount", label: "Loan Amount", type: "number", defaultValue: 280000, suffix: "$", min: 0 }}
        value={loanAmount}
        onChange={setLoanAmount}
      />
      <CalculatorInput
        input={{ id: "originationFee", label: "Origination Fee", type: "number", defaultValue: 1, suffix: "%", min: 0, max: 5, step: 0.1, tooltip: "Typically 0.5–1% of loan amount" }}
        value={originationFee}
        onChange={setOriginationFee}
      />
      <CalculatorInput
        input={{ id: "appraisal", label: "Appraisal Fee", type: "number", defaultValue: 500, suffix: "$", min: 0 }}
        value={appraisal}
        onChange={setAppraisal}
      />
      <CalculatorInput
        input={{ id: "titleInsurance", label: "Title Insurance", type: "number", defaultValue: 1500, suffix: "$", min: 0 }}
        value={titleInsurance}
        onChange={setTitleInsurance}
      />
      <CalculatorInput
        input={{ id: "escrow", label: "Escrow / Settlement", type: "number", defaultValue: 800, suffix: "$", min: 0 }}
        value={escrow}
        onChange={setEscrow}
      />
      <CalculatorInput
        input={{ id: "inspection", label: "Home Inspection", type: "number", defaultValue: 400, suffix: "$", min: 0 }}
        value={inspection}
        onChange={setInspection}
      />
      <CalculatorInput
        input={{ id: "recording", label: "Recording Fees", type: "number", defaultValue: 150, suffix: "$", min: 0 }}
        value={recording}
        onChange={setRecording}
      />
      <CalculatorInput
        input={{ id: "transferTax", label: "Transfer Tax", type: "number", defaultValue: 0.5, suffix: "%", min: 0, max: 5, step: 0.1, tooltip: "Percentage of home price" }}
        value={transferTax}
        onChange={setTransferTax}
      />
      <CalculatorInput
        input={{ id: "otherCosts", label: "Other Costs", type: "number", defaultValue: 0, suffix: "$", min: 0, tooltip: "Any additional fees not listed above" }}
        value={otherCosts}
        onChange={setOtherCosts}
      />
    </CalculatorLayout>
  );
}
