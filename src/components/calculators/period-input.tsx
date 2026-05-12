"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";

export type PeriodUnit = "days" | "weeks" | "months" | "years";

interface PeriodInputProps {
  id: string;
  label: string;
  value: number;
  unit: PeriodUnit;
  onValueChange: (value: number) => void;
  onUnitChange: (unit: PeriodUnit) => void;
  min?: number;
  max?: number;
  step?: number;
  showDatePicker?: boolean;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
}

const unitLabels: Record<PeriodUnit, string> = {
  days: "Days",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

const unitInMonths: Record<PeriodUnit, number> = {
  days: 1 / 30.44,
  weeks: 1 / 4.345,
  months: 1,
  years: 12,
};

const unitInPeriods: Record<PeriodUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30.44,
  years: 365.25,
};

/** Convert (value + unit) to months */
export function toMonths(value: number, unit: PeriodUnit): number {
  return value * unitInMonths[unit];
}

/** Convert (value + unit) to total days */
export function toDays(value: number, unit: PeriodUnit): number {
  return value * unitInPeriods[unit];
}

/** Convert (value + unit) to total periods (payments) — assumes monthly payments */
export function toPeriods(value: number, unit: PeriodUnit): number {
  if (unit === "years") return value * 12;
  if (unit === "months") return value;
  if (unit === "weeks") return Math.round(value / 4.345);
  return Math.round(value / 30.44);
}

/** Format a date string for display */
export function formatStartDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Get an end date from start date + period */
export function getEndDate(startDate: string, value: number, unit: PeriodUnit): Date | null {
  if (!startDate) return null;
  try {
    const d = new Date(startDate);
    if (unit === "years") d.setFullYear(d.getFullYear() + value);
    else if (unit === "months") d.setMonth(d.getMonth() + value);
    else if (unit === "weeks") d.setDate(d.getDate() + value * 7);
    else d.setDate(d.getDate() + value);
    return d;
  } catch {
    return null;
  }
}

export function PeriodInput({
  id,
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
  min = 1,
  max = 100,
  step = 1,
  showDatePicker = false,
  startDate,
  onStartDateChange,
}: PeriodInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      <div className="flex gap-2">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onValueChange(v);
            else if (e.target.value === "") onValueChange(0);
          }}
          min={min}
          max={max}
          step={step}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as PeriodUnit)}
          className="h-10 w-[110px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="days">{unitLabels.days}</option>
          <option value="weeks">{unitLabels.weeks}</option>
          <option value="months">{unitLabels.months}</option>
          <option value="years">{unitLabels.years}</option>
        </select>
      </div>
      {showDatePicker && onStartDateChange && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="date"
            value={startDate || ""}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <span className="shrink-0 text-xs text-gray-400">Start date</span>
        </div>
      )}
    </div>
  );
}
