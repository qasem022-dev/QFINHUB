"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function CustomerAcquisitionCostCalculator() {
  const [marketing, setMarketing] = React.useState(50000);
  const [salesTeam, setSalesTeam] = React.useState(80000);
  const [software, setSoftware] = React.useState(20000);
  const [content, setContent] = React.useState(15000);
  const [ads, setAds] = React.useState(35000);
  const [newCustomers, setNewCustomers] = React.useState(500);

  const safeMarketing = isFinite(marketing) ? Math.max(0, marketing) : 0;
  const safeSalesTeam = isFinite(salesTeam) ? Math.max(0, salesTeam) : 0;
  const safeSoftware = isFinite(software) ? Math.max(0, software) : 0;
  const safeContent = isFinite(content) ? Math.max(0, content) : 0;
  const safeAds = isFinite(ads) ? Math.max(0, ads) : 0;
  const safeNewCustomers = isFinite(newCustomers) ? Math.max(1, newCustomers) : 1;

  const totalSpend = safeMarketing + safeSalesTeam + safeSoftware + safeContent + safeAds;
  const cac = safeNewCustomers > 0 ? totalSpend / safeNewCustomers : 0;

  const chartData = [
    { name: "Marketing", value: safeMarketing },
    { name: "Sales Team", value: safeSalesTeam },
    { name: "Software/Tools", value: safeSoftware },
    { name: "Content", value: safeContent },
    { name: "Ads", value: safeAds },
  ];

  return (
    <CalculatorLayout
      title="Customer Acquisition Cost (CAC) Calculator"
      description="Calculate the cost to acquire each new customer by aggregating all sales and marketing expenses."
      icon={<span>🎯</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Customer Acquisition Cost" value={formatCurrency(cac)} highlight />
          <ResultCard label="Total Spend" value={formatCurrency(totalSpend)} />
          <ResultCard label="New Customers" value={String(safeNewCustomers)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={chartData} xKey="name" yKey="value" title="Spending by Channel" />
      <CalculatorInput input={{ id: "marketing", label: "Marketing Spend", type: "number", defaultValue: 50000, suffix: "$", min: 0, step: 1000, tooltip: "Total marketing department costs." }} value={marketing} onChange={setMarketing} />
      <CalculatorInput input={{ id: "salesTeam", label: "Sales Team Cost", type: "number", defaultValue: 80000, suffix: "$", min: 0, step: 1000, tooltip: "Salaries, commissions, and bonuses for the sales team." }} value={salesTeam} onChange={setSalesTeam} />
      <CalculatorInput input={{ id: "software", label: "Software & Tools", type: "number", defaultValue: 20000, suffix: "$", min: 0, step: 1000, tooltip: "CRM, analytics, and other software costs." }} value={software} onChange={setSoftware} />
      <CalculatorInput input={{ id: "content", label: "Content Creation", type: "number", defaultValue: 15000, suffix: "$", min: 0, step: 1000, tooltip: "Content marketing, videos, and creative production." }} value={content} onChange={setContent} />
      <CalculatorInput input={{ id: "ads", label: "Ad Spend", type: "number", defaultValue: 35000, suffix: "$", min: 0, step: 1000, tooltip: "Paid advertising across all channels." }} value={ads} onChange={setAds} />
      <CalculatorInput input={{ id: "newCustomers", label: "New Customers", type: "number", defaultValue: 500, min: 1, step: 1, tooltip: "Number of new customers acquired in the period." }} value={newCustomers} onChange={setNewCustomers} />
    </CalculatorLayout>
  );
}
