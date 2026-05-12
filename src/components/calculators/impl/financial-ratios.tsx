"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";

export default function FinancialRatiosCalculator() {
  const [netIncome, setNetIncome] = React.useState(500000);
  const [revenue, setRevenue] = React.useState(5000000);
  const [totalAssets, setTotalAssets] = React.useState(8000000);
  const [equity, setEquity] = React.useState(4000000);
  const [liabilities, setLiabilities] = React.useState(4000000);
  const [marketPrice, setMarketPrice] = React.useState(50);
  const [eps, setEps] = React.useState(3.5);
  const [sharesOutstanding, setSharesOutstanding] = React.useState(100000);

  // Calculate ratios
  const peRatio = eps > 0 ? marketPrice / eps : Infinity;
  const bookValuePerShare = sharesOutstanding > 0 ? equity / sharesOutstanding : 0;
  const pbRatio = bookValuePerShare > 0 ? marketPrice / bookValuePerShare : Infinity;
  const roe = equity > 0 ? (netIncome / equity) * 100 : 0;
  const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  const debtToEquity = equity > 0 ? liabilities / equity : Infinity;
  const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  const safeRoe = isNaN(roe) || !isFinite(roe) ? 0 : roe;
  const safeRoa = isNaN(roa) || !isFinite(roa) ? 0 : roa;
  const safeProfitMargin = isNaN(profitMargin) || !isFinite(profitMargin) ? 0 : profitMargin;
  const safeDtE = isNaN(debtToEquity) || !isFinite(debtToEquity) ? Infinity : debtToEquity;

  const chartData = [
    { ratio: "ROE (%)", value: Math.round(roe * 100) / 100 },
    { ratio: "ROA (%)", value: Math.round(roa * 100) / 100 },
    { ratio: "Profit Margin (%)", value: Math.round(profitMargin * 100) / 100 },
    { ratio: "D/E", value: Math.round(debtToEquity * 100) / 100 },
  ];

  return (
    <CalculatorLayout
      title="Financial Ratios Calculator"
      description="Compute key financial ratios including P/E, P/B, ROE, ROA, Debt-to-Equity, and Profit Margin from company financial data."
      icon={<span>📊</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="P/E Ratio" value={peRatio === Infinity ? "N/A (no earnings)" : peRatio.toFixed(2)} highlight subtext="Price-to-Earnings" />
          <ResultCard label="P/B Ratio" value={pbRatio === Infinity ? "N/A" : pbRatio.toFixed(2)} subtext="Price-to-Book" />
          <ResultCard label="ROE" value={`${safeRoe.toFixed(2)}%`} subtext="Return on Equity" />
          <ResultCard label="ROA" value={`${safeRoa.toFixed(2)}%`} subtext="Return on Assets" />
          <ResultCard label="Debt-to-Equity" value={safeDtE === Infinity ? "N/A" : safeDtE.toFixed(2)} />
          <ResultCard label="Profit Margin" value={`${safeProfitMargin.toFixed(2)}%`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="ratio" yKey="value" title="Key Financial Ratios" />
      <CalculatorInput
        input={{ id: "netIncome", label: "Net Income", type: "number", defaultValue: 500000, suffix: "$", min: 0, step: 1000, tooltip: "Company's net profit after taxes." }}
        value={netIncome}
        onChange={setNetIncome}
      />
      <CalculatorInput
        input={{ id: "revenue", label: "Revenue", type: "number", defaultValue: 5000000, suffix: "$", min: 0, step: 1000, tooltip: "Total revenue or sales." }}
        value={revenue}
        onChange={setRevenue}
      />
      <CalculatorInput
        input={{ id: "totalAssets", label: "Total Assets", type: "number", defaultValue: 8000000, suffix: "$", min: 0, step: 1000, tooltip: "Total assets on the balance sheet." }}
        value={totalAssets}
        onChange={setTotalAssets}
      />
      <CalculatorInput
        input={{ id: "equity", label: "Shareholder Equity", type: "number", defaultValue: 4000000, suffix: "$", min: 0, step: 1000, tooltip: "Total shareholders' equity." }}
        value={equity}
        onChange={setEquity}
      />
      <CalculatorInput
        input={{ id: "liabilities", label: "Total Liabilities", type: "number", defaultValue: 4000000, suffix: "$", min: 0, step: 1000, tooltip: "Total liabilities on the balance sheet." }}
        value={liabilities}
        onChange={setLiabilities}
      />
      <CalculatorInput
        input={{ id: "marketPrice", label: "Market Price per Share", type: "number", defaultValue: 50, suffix: "$", min: 0.01, step: 0.01, tooltip: "Current stock price." }}
        value={marketPrice}
        onChange={setMarketPrice}
      />
      <CalculatorInput
        input={{ id: "eps", label: "Earnings per Share (EPS)", type: "number", defaultValue: 3.5, suffix: "$", min: 0, step: 0.01, tooltip: "Net income divided by shares outstanding." }}
        value={eps}
        onChange={setEps}
      />
      <CalculatorInput
        input={{ id: "sharesOutstanding", label: "Shares Outstanding", type: "number", defaultValue: 100000, min: 1, step: 100, tooltip: "Total number of outstanding shares." }}
        value={sharesOutstanding}
        onChange={setSharesOutstanding}
      />
    </CalculatorLayout>
  );
}
