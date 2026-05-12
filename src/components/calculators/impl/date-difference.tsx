"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function DateDifference() {
  const [startMonth, setStartMonth] = React.useState(1);
  const [startDay, setStartDay] = React.useState(1);
  const [startYear, setStartYear] = React.useState(2024);
  const [endMonth, setEndMonth] = React.useState(1);
  const [endDay, setEndDay] = React.useState(1);
  const [endYear, setEndYear] = React.useState(2025);

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = !isNaN(diffMs) ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : 0;
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = !isNaN(startYear) && !isNaN(endYear) ? (endYear - startYear) * 12 + (endMonth - startMonth) : 0;
  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  const valid = !isNaN(diffDays) && diffDays >= 0;

  return (
    <CalculatorLayout
      title="Date Difference Calculator"
      description="Calculate the number of days, weeks, months, and years between two dates."
      icon={<span>📅</span>}
      results={
        <div className="space-y-4">
          {valid ? (
            <>
              <ResultCard label="Days" value={formatNumber(diffDays, 0)} highlight />
              <ResultCard label="Weeks" value={formatNumber(diffWeeks, 0)} subtext={`${diffDays % 7} day(s) remainder`} />
              <ResultCard label="Months" value={formatNumber(diffMonths, 0)} />
              <ResultCard label="Years" value={`${diffYears} year(s), ${remainingMonths} month(s)`} />
            </>
          ) : (
            <ResultCard label="Error" value="End date must be after start date" highlight />
          )}
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "startMonth", label: "Start Month", type: "number", defaultValue: 1, min: 1, max: 12, tooltip: "Start month (1-12)." }}
        value={startMonth}
        onChange={setStartMonth}
      />
      <CalculatorInput
        input={{ id: "startDay", label: "Start Day", type: "number", defaultValue: 1, min: 1, max: 31, tooltip: "Start day (1-31)." }}
        value={startDay}
        onChange={setStartDay}
      />
      <CalculatorInput
        input={{ id: "startYear", label: "Start Year", type: "number", defaultValue: 2024, min: 1900, max: 2100, tooltip: "Start year." }}
        value={startYear}
        onChange={setStartYear}
      />
      <CalculatorInput
        input={{ id: "endMonth", label: "End Month", type: "number", defaultValue: 1, min: 1, max: 12, tooltip: "End month (1-12)." }}
        value={endMonth}
        onChange={setEndMonth}
      />
      <CalculatorInput
        input={{ id: "endDay", label: "End Day", type: "number", defaultValue: 1, min: 1, max: 31, tooltip: "End day (1-31)." }}
        value={endDay}
        onChange={setEndDay}
      />
      <CalculatorInput
        input={{ id: "endYear", label: "End Year", type: "number", defaultValue: 2025, min: 1900, max: 2100, tooltip: "End year." }}
        value={endYear}
        onChange={setEndYear}
      />
    </CalculatorLayout>
  );
}
