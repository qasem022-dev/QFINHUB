"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function CashFlowCalculator() {
  const [netIncome, setNetIncome] = React.useState(200000);
  const [depreciation, setDepreciation] = React.useState(30000);
  const [arChange, setArChange] = React.useState(-10000);
  const [inventoryChange, setInventoryChange] = React.useState(-15000);
  const [apChange, setApChange] = React.useState(8000);
  const [equipment, setEquipment] = React.useState(-50000);
  const [propertySales, setPropertySales] = React.useState(0);
  const [dividends, setDividends] = React.useState(-20000);
  const [debtIssued, setDebtIssued] = React.useState(50000);
  const [buybacks, setBuybacks] = React.useState(-10000);

  const operatingCF = isFinite(netIncome + depreciation + arChange + inventoryChange + apChange) ? netIncome + depreciation + arChange + inventoryChange + apChange : 0;
  const investingCF = isFinite(equipment + propertySales) ? equipment + propertySales : 0;
  const financingCF = isFinite(debtIssued + dividends + buybacks) ? debtIssued + dividends + buybacks : 0;
  const netCF = isFinite(operatingCF + investingCF + financingCF) ? operatingCF + investingCF + financingCF : 0;

  const chartData = [
    { name: "Operating", value: operatingCF },
    { name: "Investing", value: investingCF },
    { name: "Financing", value: financingCF },
  ];

  return (
    <CalculatorLayout
      title="Cash Flow Calculator"
      description="Calculate operating, investing, and financing cash flows from financial statement data."
      icon={<span>💵</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Operating Cash Flow" value={formatCurrency(operatingCF)} highlight />
          <ResultCard label="Investing Cash Flow" value={formatCurrency(investingCF)} />
          <ResultCard label="Financing Cash Flow" value={formatCurrency(financingCF)} />
          <ResultCard label="Net Cash Flow" value={formatCurrency(netCF)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Cash Flow Categories" />
      <CalculatorInput input={{ id: "netIncome", label: "Net Income", type: "number", defaultValue: 200000, suffix: "$", min: 0, step: 1000, tooltip: "Net profit from the income statement." }} value={netIncome} onChange={setNetIncome} />
      <CalculatorInput input={{ id: "depreciation", label: "Depreciation & Amortization", type: "number", defaultValue: 30000, suffix: "$", step: 1000, tooltip: "Non-cash depreciation and amortization expenses." }} value={depreciation} onChange={setDepreciation} />
      <CalculatorInput input={{ id: "arChange", label: "Change in AR", type: "number", defaultValue: -10000, suffix: "$", step: 1000, tooltip: "Change in Accounts Receivable (negative = increase in AR)." }} value={arChange} onChange={setArChange} />
      <CalculatorInput input={{ id: "inventoryChange", label: "Change in Inventory", type: "number", defaultValue: -15000, suffix: "$", step: 1000, tooltip: "Change in Inventory (negative = increase in inventory)." }} value={inventoryChange} onChange={setInventoryChange} />
      <CalculatorInput input={{ id: "apChange", label: "Change in AP", type: "number", defaultValue: 8000, suffix: "$", step: 1000, tooltip: "Change in Accounts Payable (positive = increase in AP)." }} value={apChange} onChange={setApChange} />
      <CalculatorInput input={{ id: "equipment", label: "Equipment Purchases", type: "number", defaultValue: -50000, suffix: "$", step: 1000, tooltip: "Capital expenditures (negative = cash outflow)." }} value={equipment} onChange={setEquipment} />
      <CalculatorInput input={{ id: "propertySales", label: "Property Sales", type: "number", defaultValue: 0, suffix: "$", step: 1000, tooltip: "Proceeds from property/asset sales." }} value={propertySales} onChange={setPropertySales} />
      <CalculatorInput input={{ id: "dividends", label: "Dividends Paid", type: "number", defaultValue: -20000, suffix: "$", step: 1000, tooltip: "Dividends paid (negative = cash outflow)." }} value={dividends} onChange={setDividends} />
      <CalculatorInput input={{ id: "debtIssued", label: "Debt Issued", type: "number", defaultValue: 50000, suffix: "$", step: 1000, tooltip: "Proceeds from debt issuance." }} value={debtIssued} onChange={setDebtIssued} />
      <CalculatorInput input={{ id: "buybacks", label: "Stock Buybacks", type: "number", defaultValue: -10000, suffix: "$", step: 1000, tooltip: "Stock buybacks (negative = cash outflow)." }} value={buybacks} onChange={setBuybacks} />
    </CalculatorLayout>
  );
}
