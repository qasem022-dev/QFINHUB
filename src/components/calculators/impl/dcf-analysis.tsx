"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function DCFAnalysisCalculator() {
  const [investment, setInvestment] = React.useState(1000000);
  const [cf1, setCf1] = React.useState(200000);
  const [cf2, setCf2] = React.useState(250000);
  const [cf3, setCf3] = React.useState(300000);
  const [cf4, setCf4] = React.useState(350000);
  const [cf5, setCf5] = React.useState(400000);
  const [discountRate, setDiscountRate] = React.useState(10);
  const [terminalGrowth, setTerminalGrowth] = React.useState(2);

  const cashFlows = [cf1, cf2, cf3, cf4, cf5];
  const r = discountRate / 100;
  const g = terminalGrowth / 100;

  const pvs = cashFlows.map((cf, t) => cf / Math.pow(1 + r, t + 1));
  const totalPV = pvs.reduce((sum, pv) => sum + pv, 0);

  const terminalCF = cf5 * (1 + g);
  const rawTerminalValue = r > g ? terminalCF / (r - g) : 0;
  const terminalValue = isFinite(rawTerminalValue) ? rawTerminalValue : 0;
  const pvTerminal = isFinite(terminalValue) ? terminalValue / Math.pow(1 + r, 5) : 0;

  const dcf = totalPV + pvTerminal;
  const npv = dcf - investment;

  const safeNpv = isFinite(npv) ? npv : 0;
  const safeDcf = isFinite(dcf) ? dcf : 0;

  const chartData = pvs.map((pv, i) => ({
    year: `Year ${i + 1}`,
    "Present Value": isFinite(pv) ? Math.round(pv * 100) / 100 : 0,
  }));
  chartData.push({ year: "Terminal", "Present Value": isFinite(pvTerminal) ? Math.round(pvTerminal * 100) / 100 : 0 });

  return (
    <CalculatorLayout
      title="DCF Analysis"
      description="Discounted cash flow analysis to calculate net present value of an investment with explicit 5-year projections and terminal value."
      icon={<span>📈</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Net Present Value (NPV)" value={formatCurrency(safeNpv)} highlight subtext={safeNpv >= 0 ? "Investment is undervalued ✓" : "Investment is overvalued ✗"} />
          <ResultCard label="Total DCF" value={formatCurrency(safeDcf)} />
          <ResultCard label="Terminal Value" value={formatCurrency(terminalValue)} subtext={`PV: ${formatCurrency(pvTerminal)}`} />
          <ResultCard label="Discount Rate" value={formatPercentage(discountRate)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="year" yKey="Present Value" title="Present Value of Cash Flows" />
      <CalculatorInput input={{ id: "investment", label: "Initial Investment", type: "number", defaultValue: 1000000, suffix: "$", min: 0, step: 1000, tooltip: "The upfront cost of the investment or project." }} value={investment} onChange={setInvestment} />
      <CalculatorInput input={{ id: "cf1", label: "Year 1 Cash Flow", type: "number", defaultValue: 200000, suffix: "$", step: 1000, tooltip: "Projected cash flow for year 1." }} value={cf1} onChange={setCf1} />
      <CalculatorInput input={{ id: "cf2", label: "Year 2 Cash Flow", type: "number", defaultValue: 250000, suffix: "$", step: 1000, tooltip: "Projected cash flow for year 2." }} value={cf2} onChange={setCf2} />
      <CalculatorInput input={{ id: "cf3", label: "Year 3 Cash Flow", type: "number", defaultValue: 300000, suffix: "$", step: 1000, tooltip: "Projected cash flow for year 3." }} value={cf3} onChange={setCf3} />
      <CalculatorInput input={{ id: "cf4", label: "Year 4 Cash Flow", type: "number", defaultValue: 350000, suffix: "$", step: 1000, tooltip: "Projected cash flow for year 4." }} value={cf4} onChange={setCf4} />
      <CalculatorInput input={{ id: "cf5", label: "Year 5 Cash Flow", type: "number", defaultValue: 400000, suffix: "$", step: 1000, tooltip: "Projected cash flow for year 5." }} value={cf5} onChange={setCf5} />
      <CalculatorInput input={{ id: "discountRate", label: "Discount Rate", type: "number", defaultValue: 10, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The required rate of return or cost of capital." }} value={discountRate} onChange={setDiscountRate} />
      <CalculatorInput input={{ id: "terminalGrowth", label: "Terminal Growth Rate", type: "number", defaultValue: 2, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Perpetual growth rate after year 5." }} value={terminalGrowth} onChange={setTerminalGrowth} />
    </CalculatorLayout>
  );
}
