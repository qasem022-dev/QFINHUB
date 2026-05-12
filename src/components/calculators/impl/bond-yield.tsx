"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function BondYieldCalculator() {
  const [faceValue, setFaceValue] = React.useState(1000);
  const [currentPrice, setCurrentPrice] = React.useState(950);
  const [couponRate, setCouponRate] = React.useState(5);
  const [yearsToMaturity, setYearsToMaturity] = React.useState(10);
  const [maturityUnit, setMaturityUnit] = React.useState<PeriodUnit>("years");

  const safeFaceValue = Math.max(1, faceValue ?? 0);
  const safePrice = Math.max(0.01, currentPrice ?? 0);
  const safeCouponRate = Math.max(0, Math.min(couponRate ?? 0, 100));

  const annualCoupon = safeFaceValue * (safeCouponRate / 100);
  const currentYield = safePrice > 0 ? (annualCoupon / safePrice) * 100 : 0;
  const maturityYears = Math.max(0.01, toMonths(yearsToMaturity, maturityUnit) / 12);
  const ytmNumerator = annualCoupon + (safeFaceValue - safePrice) / maturityYears;
  const ytmDenominator = (safeFaceValue + safePrice) / 2;
  const ytm = ytmDenominator > 0 ? (ytmNumerator / ytmDenominator) * 100 : 0;

  const safeYtm = isNaN(ytm) || !isFinite(ytm) ? 0 : ytm;
  const premiumDiscount = safePrice > safeFaceValue ? "Premium" : safePrice < safeFaceValue ? "Discount" : "At Par";

  // Chart: yield comparison across maturity years
  const chartData = Array.from({ length: Math.min(Math.round(maturityYears), 30) + 1 }, (_, i) => {
    const y = i;
    const ytmNum = annualCoupon + (safeFaceValue - safePrice) / Math.max(y, 0.5);
    const ytmDen = (safeFaceValue + safePrice) / 2;
    const ytmAtYear = ytmDen > 0 ? (ytmNum / ytmDen) * 100 : 0;
    return {
      year: `Year ${y}`,
      "Current Yield": Math.round(currentYield * 100) / 100,
      "YTM": Math.round((isNaN(ytmAtYear) || !isFinite(ytmAtYear) ? 0 : ytmAtYear) * 100) / 100,
    };
  });

  return (
    <CalculatorLayout
      title="Bond Yield Calculator"
      description="Calculate current yield and yield-to-maturity (YTM) for a bond given its price, coupon rate, and time to maturity."
      icon={<span>🏦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Coupon" value={formatCurrency(annualCoupon)} highlight subtext={`${safeCouponRate}% of ${formatCurrency(safeFaceValue)}`} />
          <ResultCard label="Current Yield" value={formatPercentage(currentYield)} subtext={`Based on current price of ${formatCurrency(safePrice)}`} />
          <ResultCard label="Yield to Maturity" value={formatPercentage(safeYtm)} subtext="Approximate YTM (formula approximation)" />
          <ResultCard label="Bond Status" value={premiumDiscount} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Current Yield", "YTM"]} title="Yield Over Time (%)" />
      <CalculatorInput
        input={{ id: "faceValue", label: "Face Value", type: "number", defaultValue: 1000, suffix: "$", min: 1, step: 10, tooltip: "The bond's par value paid at maturity." }}
        value={faceValue}
        onChange={setFaceValue}
      />
      <CalculatorInput
        input={{ id: "currentPrice", label: "Current Price", type: "number", defaultValue: 950, suffix: "$", min: 0.01, step: 0.01, tooltip: "The current market price of the bond." }}
        value={currentPrice}
        onChange={setCurrentPrice}
      />
      <CalculatorInput
        input={{ id: "couponRate", label: "Coupon Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate paid by the bond." }}
        value={couponRate}
        onChange={setCouponRate}
      />
      <PeriodInput
        id="yearsToMaturity"
        label="Years to Maturity"
        value={yearsToMaturity}
        unit={maturityUnit}
        onValueChange={setYearsToMaturity}
        onUnitChange={setMaturityUnit}
        min={1}
        max={100}
      />
    </CalculatorLayout>
  );
}
