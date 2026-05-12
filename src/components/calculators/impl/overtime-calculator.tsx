"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function OvertimeCalculator() {
  const [hourlyRate, setHourlyRate] = React.useState(25);
  const [regularHours, setRegularHours] = React.useState(40);
  const [overtimeHours, setOvertimeHours] = React.useState(5);
  const [overtimeMult, setOvertimeMult] = React.useState(1.5);

  const safeRate = isFinite(hourlyRate) ? hourlyRate : 0;
  const safeReg = isFinite(regularHours) ? regularHours : 0;
  const safeOT = isFinite(overtimeHours) ? overtimeHours : 0;
  const safeOTMult = isFinite(overtimeMult) ? overtimeMult : 0;

  const regularPay = safeRate * safeReg;
  const otPay = safeRate * safeOTMult * safeOT;
  const totalPay = regularPay + otPay;
  const totalHours = safeReg + safeOT;
  const effectiveHourly = totalHours > 0 ? totalPay / totalHours : 0;

  const chartData = [
    { name: "Regular Pay", value: regularPay },
    { name: "Overtime Pay", value: otPay },
  ];

  return (
    <CalculatorLayout
      title="Overtime Calculator"
      description="Calculate your weekly pay including overtime at the standard multiplier."
      icon={<span>⏰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Regular Pay" value={formatCurrency(regularPay)} />
          <ResultCard label="Overtime Pay" value={formatCurrency(otPay)} />
          <ResultCard label="Total Pay" value={formatCurrency(totalPay)} highlight />
          <ResultCard label="Effective Hourly Rate" value={formatCurrency(effectiveHourly)} />
          <ResultCard label="Total Hours" value={formatNumber(totalHours)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["value"]} title="Regular vs Overtime Pay" />
      <CalculatorInput input={{ id: "hourly-rate", label: "Hourly Rate", type: "number", defaultValue: 25, suffix: "$", min: 0, step: 0.5, tooltip: "Your standard hourly wage." }} value={hourlyRate} onChange={setHourlyRate} />
      <CalculatorInput input={{ id: "regular-hours", label: "Regular Hours", type: "number", defaultValue: 40, suffix: "hrs", min: 0, max: 168, tooltip: "Regular hours worked per week." }} value={regularHours} onChange={setRegularHours} />
      <CalculatorInput input={{ id: "overtime-hours", label: "Overtime Hours", type: "number", defaultValue: 5, suffix: "hrs", min: 0, max: 100, tooltip: "Overtime hours worked per week." }} value={overtimeHours} onChange={setOvertimeHours} />
      <CalculatorInput input={{ id: "overtime-mult", label: "Overtime Multiplier", type: "select", defaultValue: 1.5, options: [{ label: "1.5x", value: 1.5 }, { label: "2.0x", value: 2.0 }], tooltip: "Overtime pay multiplier (1.5x is time-and-a-half)." }} value={overtimeMult} onChange={setOvertimeMult} />
    </CalculatorLayout>
  );
}
