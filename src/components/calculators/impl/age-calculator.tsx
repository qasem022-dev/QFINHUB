"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function AgeCalculator() {
  const [birthYear, setBirthYear] = React.useState(1990);
  const [birthMonth, setBirthMonth] = React.useState(6);
  const [birthDay, setBirthDay] = React.useState(15);

  const today = new Date();
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = !isNaN(birthDate.getTime()) ? Math.round((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Calculate days until next birthday
  let nextBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
  }
  const daysUntilBirthday = !isNaN(nextBirthday.getTime()) ? Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const monthsUntilBirthday = Math.floor(daysUntilBirthday / 30);
  const remainingDaysUntilBirthday = daysUntilBirthday % 30;

  const valid = !isNaN(birthDate.getTime()) && birthDate <= today;

  return (
    <CalculatorLayout
      title="Age Calculator"
      description="Calculate your exact age in years, months, and days based on your birth date."
      icon={<span>🎂</span>}
      results={
        <div className="space-y-4">
          {valid ? (
            <>
              <ResultCard label="Your Age" value={`${years} years, ${months} months, ${days} days`} highlight />
              <ResultCard label="Total Days Alive" value={formatNumber(totalDays, 0)} />
              <ResultCard label="Next Birthday In" value={monthsUntilBirthday > 0 ? `${monthsUntilBirthday} month(s), ${remainingDaysUntilBirthday} day(s)` : `${daysUntilBirthday} day(s)`} />
            </>
          ) : (
            <ResultCard label="Error" value="Birth date cannot be in the future" highlight />
          )}
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "birthYear", label: "Birth Year", type: "number", defaultValue: 1990, min: 1900, max: 2100, tooltip: "Your year of birth." }}
        value={birthYear}
        onChange={setBirthYear}
      />
      <CalculatorInput
        input={{ id: "birthMonth", label: "Birth Month", type: "number", defaultValue: 6, min: 1, max: 12, tooltip: "Your birth month (1-12)." }}
        value={birthMonth}
        onChange={setBirthMonth}
      />
      <CalculatorInput
        input={{ id: "birthDay", label: "Birth Day", type: "number", defaultValue: 15, min: 1, max: 31, tooltip: "Your birth day (1-31)." }}
        value={birthDay}
        onChange={setBirthDay}
      />
    </CalculatorLayout>
  );
}
