"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function HourlyToSalaryCalculator() {
  const [hourlyRate, setHourlyRate] = React.useState(25);
  const [hoursPerWeek, setHoursPerWeek] = React.useState(40);
  const [paidWeeks, setPaidWeeks] = React.useState(52);
  const [overtimeHours, setOvertimeHours] = React.useState(0);
  const [overtimeMult, setOvertimeMult] = React.useState(1.5);

  const safeRate = isFinite(hourlyRate) ? hourlyRate : 0;
  const safeHours = isFinite(hoursPerWeek) ? hoursPerWeek : 0;
  const safeWeeks = isFinite(paidWeeks) ? paidWeeks : 0;
  const safeOT = isFinite(overtimeHours) ? overtimeHours : 0;
  const safeOTMult = isFinite(overtimeMult) ? overtimeMult : 0;

  const annualBase = safeRate * safeHours * safeWeeks;
  const overtimeAnnual = safeRate * safeOTMult * safeOT * safeWeeks;
  const totalAnnual = annualBase + overtimeAnnual;
  const monthly = safeWeeks > 0 ? totalAnnual / 12 : 0;
  const biweekly = safeWeeks > 0 ? totalAnnual / 26 : 0;
  const weekly = safeWeeks > 0 ? totalAnnual / 52 : 0;
  const daily = safeWeeks > 0 ? totalAnnual / 260 : 0;

  const chartData = [
    { name: "Annual", value: totalAnnual },
    { name: "Monthly", value: monthly },
    { name: "Biweekly", value: biweekly },
    { name: "Weekly", value: weekly },
    { name: "Daily", value: daily },
  ];

  return (
    <CalculatorLayout
      title="Hourly to Salary"
      description="Convert your hourly rate to annual salary and see your earnings by pay period."
      icon={<span>💵</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Annual Salary" value={formatCurrency(totalAnnual)} highlight />
          <ResultCard label="Monthly" value={formatCurrency(monthly)} />
          <ResultCard label="Biweekly" value={formatCurrency(biweekly)} />
          <ResultCard label="Weekly" value={formatCurrency(weekly)} />
          <ResultCard label="Daily" value={formatCurrency(daily)} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["value"]} title="Pay Period Comparison" />
      <CalculatorInput input={{ id: "hourly-rate", label: "Hourly Rate", type: "number", defaultValue: 25, suffix: "$", min: 0, step: 0.5, tooltip: "Your hourly wage before taxes." }} value={hourlyRate} onChange={setHourlyRate} />
      <CalculatorInput input={{ id: "hours-per-week", label: "Hours Per Week", type: "number", defaultValue: 40, suffix: "hrs", min: 1, max: 168, tooltip: "Regular hours worked per week." }} value={hoursPerWeek} onChange={setHoursPerWeek} />
      <CalculatorInput input={{ id: "paid-weeks", label: "Paid Weeks Per Year", type: "number", defaultValue: 52, suffix: "wks", min: 1, max: 52, tooltip: "Weeks per year you work (52 for full-time, less if unpaid time off)." }} value={paidWeeks} onChange={setPaidWeeks} />
      <CalculatorInput input={{ id: "overtime-hours", label: "Overtime Hours/Week", type: "number", defaultValue: 0, suffix: "hrs", min: 0, max: 100, tooltip: "Average overtime hours worked per week." }} value={overtimeHours} onChange={setOvertimeHours} />
      <CalculatorInput input={{ id: "overtime-mult", label: "Overtime Multiplier", type: "select", defaultValue: 1.5, options: [{ label: "1.5x", value: 1.5 }, { label: "2.0x", value: 2.0 }], tooltip: "Overtime pay multiplier (1.5x is standard time-and-a-half)." }} value={overtimeMult} onChange={setOvertimeMult} />
    </CalculatorLayout>
  );
}
