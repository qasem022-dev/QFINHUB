"use client";

import { useState, useCallback } from "react";

interface Props {
  stateName: string;
  stateKey: string;
}

export function StateTaxCalculator({ stateName, stateKey }: Props) {
  const [annualIncome, setAnnualIncome] = useState<string>("75000");
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("single");
  const [result, setResult] = useState<{ tax: number; effectiveRate: number; takeHome: number; taxableIncome: number } | null>(null);
  const [error, setError] = useState<string>("");

  const calculate = useCallback(() => {
    setError("");
    const income = parseFloat(annualIncome.replace(/,/g, ""));
    if (isNaN(income) || income < 0) {
      setError("Please enter a valid income amount.");
      return;
    }

    const STANDARD_DEDUCTIONS: Record<string, number> = {
      california: 10422,
      "new-york": 27900,
      texas: 0,
      florida: 0,
      illinois: 2600,
      pennsylvania: 4600,
      washington: 0,
      massachusetts: 4400,
      colorado: 14600,
      arizona: 14600,
    };

    const FLAT_RATES: Record<string, number> = {
      texas: 0,
      florida: 0,
      washington: 0,
      illinois: 0.0495,
      pennsylvania: 0.0307,
      massachusetts: 0.05,
      colorado: 0.044,
      arizona: 0.025,
    };

    const stdDeduction = STANDARD_DEDUCTIONS[stateKey] ?? 0;
    const taxableIncome = Math.max(0, income - stdDeduction);
    let tax = 0;

    if (stateKey in FLAT_RATES) {
      tax = taxableIncome * (FLAT_RATES[stateKey] ?? 0);
    } else if (stateKey === "california") {
      // CA progressive brackets
      const caps = [10422, 24710, 38959, 54081, 68349, 349137, 418961, 698271];
      const rates = [0.01, 0.02, 0.04, 0.06, 0.08, 0.093, 0.103, 0.113, 0.123];
      let prev = 0;
      for (let i = 0; i < caps.length; i++) {
        if (taxableIncome <= prev) break;
        const inBracket = Math.min(taxableIncome, caps[i]!) - prev;
        if (inBracket > 0) tax += inBracket * rates[i]!;
        prev = caps[i]!;
      }
    } else if (stateKey === "new-york") {
      // NY progressive brackets
      const caps = [8500, 11700, 13900, 80650, 215400, 1077550];
      const rates = [0.04, 0.045, 0.0525, 0.0585, 0.0625, 0.0685, 0.0965];
      let prev = 0;
      for (let i = 0; i < caps.length; i++) {
        if (taxableIncome <= prev) break;
        const inBracket = Math.min(taxableIncome, caps[i]!) - prev;
        if (inBracket > 0) tax += inBracket * rates[i]!;
        prev = caps[i]!;
      }
    }

    setResult({
      tax,
      effectiveRate: income > 0 ? (tax / income) * 100 : 0,
      takeHome: income - tax,
      taxableIncome,
    });
  }, [annualIncome, stateKey]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtPct = (n: number) => n.toFixed(2) + "%";

  return (
    <div className="space-y-6">
      {/* ── Inputs ── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Annual Gross Income
          </label>
          <input
            type="text"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value)}
            placeholder="e.g. 75000"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Before any deductions — your gross annual salary or net self-employment income.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filing Status
          </label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as "single" | "married")}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={calculate}
        className="w-full rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-700 active:bg-primary-800 sm:w-auto"
      >
        Calculate {stateName} State Tax
      </button>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">
          {/* Primary result */}
          <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/50 p-6 dark:border-primary-800 dark:bg-primary-900/20">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Est. {stateName} Tax</p>
                <p className="mt-1 text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {fmt(result.tax)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Effective rate: {fmtPct(result.effectiveRate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxable Income</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {fmt(result.taxableIncome)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  After standard deduction
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Take-Home After State Tax</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {fmt(result.takeHome)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Per year after {stateName} tax
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Take-Home</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {fmt(result.takeHome / 12)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  After state income tax
                </p>
              </div>
            </div>
          </div>

          {/* Context note */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-gray-400">
            <strong>Note:</strong> This estimate uses the {stateName} standard deduction for {filingStatus === "single" ? "single filers" : "married filers filing jointly"} and the {stateKey === "california" ? "latest progressive brackets" : stateKey === "new-york" ? "latest progressive brackets" : "flat rate"}. It does not include local income taxes (e.g., NYC, Philadelphia), property tax, or sales tax. Your actual tax liability may differ based on deductions, credits, and other state-specific rules. Consult a tax professional for personalized advice.
          </div>
        </div>
      )}
    </div>
  );
}
