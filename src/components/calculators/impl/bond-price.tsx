"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodInput, toMonths, type PeriodUnit } from "@/components/calculators/period-input";

export default function BondPriceCalculator() {
  const [faceValue, setFaceValue] = React.useState(1000);
  const [couponRate, setCouponRate] = React.useState(5);
  const [ytm, setYtm] = React.useState(6);
  const [yearsToMaturity, setYearsToMaturity] = React.useState(10);
  const [maturityUnit, setMaturityUnit] = React.useState<PeriodUnit>("years");
  const [paymentsPerYear, setPaymentsPerYear] = React.useState(2);

  const safeFaceValue = Math.max(1, faceValue ?? 0);
  const safeCouponRate = Math.max(0, Math.min(couponRate ?? 0, 100));
  const safeYtm = Math.max(0, Math.min(ytm ?? 0, 100));
  const safePayments = Math.max(1, paymentsPerYear ?? 1);

  const couponPmt = safeFaceValue * (safeCouponRate / 100) / safePayments;
  const n = Math.max(1, (toMonths(yearsToMaturity, maturityUnit) / 12) * safePayments);
  const r = (safeYtm / 100) / safePayments;

  const pvCoupons = Math.abs(r) > 1e-10
    ? couponPmt * ((1 - Math.pow(1 + r, -n)) / r)
    : couponPmt * n;
  const pvFace = safeFaceValue / Math.pow(1 + r, n);
  const bondPrice = pvCoupons + pvFace;
  const safeBondPrice = isNaN(bondPrice) || !isFinite(bondPrice) ? 0 : bondPrice;

  const premiumDiscount = safeBondPrice > safeFaceValue ? "Premium" : safeBondPrice < safeFaceValue ? "Discount" : "At Par";

  // Yield impact chart
  const yieldImpactData = Array.from({ length: 11 }, (_, i) => {
    const y = Math.max(0.1, safeYtm - 3 + i);
    const r2 = (y / 100) / safePayments;
    const pvC = Math.abs(r2) > 1e-10
      ? couponPmt * ((1 - Math.pow(1 + r2, -n)) / r2)
      : couponPmt * n;
    const pvF = safeFaceValue / Math.pow(1 + r2, n);
    return {
      ytm: `${y.toFixed(1)}%`,
      Price: Math.round((pvC + pvF) * 100) / 100,
    };
  });

  const barData = [
    { component: "Coupon PV", value: Math.round(pvCoupons * 100) / 100 },
    { component: "Face Value PV", value: Math.round(pvFace * 100) / 100 },
    { component: "Bond Price", value: Math.round(safeBondPrice * 100) / 100 },
  ];

  return (
    <CalculatorLayout
      title="Bond Price Calculator"
      description="Calculate the fair price of a bond by discounting its future coupon payments and face value using the yield to maturity."
      icon={<span>📜</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Bond Price" value={formatCurrency(safeBondPrice)} highlight subtext={premiumDiscount === "Premium" ? "Above face value" : premiumDiscount === "Discount" ? "Below face value" : "At par"} />
          <ResultCard label="Status" value={premiumDiscount} subtext={`Face value: ${formatCurrency(safeFaceValue)}`} />
          <ResultCard label="Total Coupon PV" value={formatCurrency(pvCoupons)} subtext={`${safePayments} payments/year`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={barData} xKey="component" yKey="value" title="Bond Price Breakdown ($)" />
      <CalculatorChart type="line" data={yieldImpactData} xKey="ytm" yKey="Price" title="Price vs YTM" />
      <CalculatorInput
        input={{ id: "faceValue", label: "Face Value", type: "number", defaultValue: 1000, suffix: "$", min: 1, step: 10, tooltip: "The bond's par value paid at maturity." }}
        value={faceValue}
        onChange={setFaceValue}
      />
      <CalculatorInput
        input={{ id: "couponRate", label: "Coupon Rate", type: "number", defaultValue: 5, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "Annual interest rate paid by the bond." }}
        value={couponRate}
        onChange={setCouponRate}
      />
      <CalculatorInput
        input={{ id: "ytm", label: "Yield to Maturity", type: "number", defaultValue: 6, suffix: "%", min: 0, max: 100, step: 0.1, tooltip: "The market discount rate (YTM)." }}
        value={ytm}
        onChange={setYtm}
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
      <CalculatorInput
        input={{ id: "paymentsPerYear", label: "Payments per Year", type: "select", defaultValue: 2, options: [{ label: "Annual (1)", value: 1 }, { label: "Semi-Annual (2)", value: 2 }, { label: "Quarterly (4)", value: 4 }, { label: "Monthly (12)", value: 12 }], tooltip: "How often coupon payments are made." }}
        value={paymentsPerYear}
        onChange={setPaymentsPerYear}
      />
    </CalculatorLayout>
  );
}
