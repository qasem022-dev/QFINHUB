"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface MoneyField {
  key: string;
  label: string;
  defaultValue: number;
  tooltip: string;
}

const ASSET_FIELDS: MoneyField[] = [
  {
    key: "cash",
    label: "Cash & Savings",
    defaultValue: 25000,
    tooltip: "Checking, savings, money market accounts, and cash on hand.",
  },
  {
    key: "investments",
    label: "Investments",
    defaultValue: 60000,
    tooltip: "Brokerage accounts, stocks, bonds, mutual funds, ETFs, and crypto.",
  },
  {
    key: "retirement",
    label: "Retirement Accounts",
    defaultValue: 85000,
    tooltip: "401(k), 403(b), IRA, Roth IRA, pension, and other retirement plans.",
  },
  {
    key: "realEstate",
    label: "Real Estate",
    defaultValue: 300000,
    tooltip: "Current market value of homes and land you own, not the mortgage.",
  },
  {
    key: "vehicles",
    label: "Vehicles",
    defaultValue: 22000,
    tooltip: "Current resale value of cars, motorcycles, boats, and RVs.",
  },
  {
    key: "otherAssets",
    label: "Other Assets",
    defaultValue: 8000,
    tooltip: "Jewelry, collectibles, business equity, and other valuables.",
  },
];

const LIABILITY_FIELDS: MoneyField[] = [
  {
    key: "mortgage",
    label: "Mortgage Balance",
    defaultValue: 210000,
    tooltip: "Remaining principal on your home loan, not the monthly payment.",
  },
  {
    key: "autoLoans",
    label: "Auto Loans",
    defaultValue: 14000,
    tooltip: "Outstanding balances on car, motorcycle, or RV loans.",
  },
  {
    key: "studentLoans",
    label: "Student Loans",
    defaultValue: 18000,
    tooltip: "Remaining balance on federal and private student loans.",
  },
  {
    key: "creditCards",
    label: "Credit Card Debt",
    defaultValue: 4500,
    tooltip: "Total revolving balances across all credit cards.",
  },
  {
    key: "otherDebts",
    label: "Other Debts",
    defaultValue: 3000,
    tooltip: "Personal loans, medical debt, tax owed, and other obligations.",
  },
];

const ALL_FIELDS = [...ASSET_FIELDS, ...LIABILITY_FIELDS];

function initialValues(): Record<string, number> {
  return Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.defaultValue]));
}

export default function NetWorthCalculator() {
  const [values, setValues] = React.useState<Record<string, number>>(initialValues);

  const set = React.useCallback(
    (key: string) => (next: number) =>
      setValues((prev) => ({ ...prev, [key]: isFinite(next) ? next : 0 })),
    [],
  );

  const totalAssets = ASSET_FIELDS.reduce((sum, f) => sum + (values[f.key] || 0), 0);
  const totalLiabilities = LIABILITY_FIELDS.reduce(
    (sum, f) => sum + (values[f.key] || 0),
    0,
  );
  const netWorth = totalAssets - totalLiabilities;
  const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const equityPosition = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 0;
  const isPositive = netWorth >= 0;

  const comparisonData = [
    { category: "Assets", amount: Math.round(totalAssets) },
    { category: "Liabilities", amount: Math.round(totalLiabilities) },
    { category: "Net Worth", amount: Math.round(netWorth) },
  ];

  const assetMixData = ASSET_FIELDS.map((f) => ({
    category: f.label,
    amount: Math.round(values[f.key] || 0),
  }));

  const liabilityMixData = LIABILITY_FIELDS.map((f) => ({
    category: f.label,
    amount: Math.round(values[f.key] || 0),
  }));

  const renderField = (f: MoneyField) => (
    <CalculatorInput
      key={f.key}
      input={{
        id: f.key,
        label: f.label,
        type: "number",
        defaultValue: f.defaultValue,
        suffix: "$",
        min: 0,
        tooltip: f.tooltip,
      }}
      value={values[f.key] ?? 0}
      onChange={set(f.key)}
    />
  );

  return (
    <CalculatorLayout
      title="Net Worth Calculator"
      description="Add up what you own and what you owe to see your net worth, broken out by category."
      icon={<span>💎</span>}
      results={
        <div className="space-y-4">
          <ResultCard
            label="Net Worth"
            value={formatCurrency(netWorth)}
            subtext={
              isPositive
                ? "Assets exceed liabilities"
                : "Liabilities exceed assets — negative net worth"
            }
            highlight={isPositive}
          />
          <ResultCard label="Total Assets" value={formatCurrency(totalAssets)} />
          <ResultCard
            label="Total Liabilities"
            value={formatCurrency(totalLiabilities)}
          />
          <ResultCard
            label="Debt-to-Asset Ratio"
            value={formatPercentage(debtToAsset)}
            subtext={
              debtToAsset === 0
                ? "No debt recorded"
                : debtToAsset < 40
                  ? "Low leverage"
                  : debtToAsset < 80
                    ? "Moderate leverage"
                    : "High leverage"
            }
          />
          <ResultCard
            label="Equity Position"
            value={formatPercentage(equityPosition)}
            subtext="Share of your assets you own outright"
          />
        </div>
      }
    >
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          What you own
        </h3>
        {ASSET_FIELDS.map(renderField)}
      </section>

      <section className="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          What you owe
        </h3>
        {LIABILITY_FIELDS.map(renderField)}
      </section>

      <CalculatorChart
        format="currency"
        type="bar"
        data={comparisonData}
        xKey="category"
        yKey="amount"
        title="Assets vs Liabilities vs Net Worth"
      />

      <CalculatorChart
        format="currency"
        type="bar"
        data={assetMixData}
        xKey="category"
        yKey="amount"
        title="Asset Breakdown"
      />

      <CalculatorChart
        format="currency"
        type="bar"
        data={liabilityMixData}
        xKey="category"
        yKey="amount"
        title="Liability Breakdown"
      />
    </CalculatorLayout>
  );
}
