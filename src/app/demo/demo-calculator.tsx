"use client";

import { useMemo, useState } from "react";

type Props = {
  /** Prospect company name passed through the ?co= param. */
  brand: string;
  /** Their domain, used for the "this is a preview" line. */
  domain: string;
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

/**
 * Standalone mortgage payment calculator used for prospect demos.
 *
 * Deliberately self-contained: it must not import the main calculator registry,
 * because a demo has to render reliably for a stranger on a cold click — a broken
 * demo costs more credibility than no demo at all.
 */
export default function DemoCalculator({ brand, domain }: Props) {
  const [homePrice, setHomePrice] = useState(450000);
  const [downPayment, setDownPayment] = useState(90000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const [submitted, setSubmitted] = useState(false);

  const { loan, monthly, totalInterest, totalPaid, principalPct } = useMemo(() => {
    const loanAmount = Math.max(0, homePrice - downPayment);
    const months = Math.max(1, Math.round(years * 12));
    const mr = rate / 100 / 12;
    const payment =
      mr === 0
        ? loanAmount / months
        : (loanAmount * mr * Math.pow(1 + mr, months)) /
          (Math.pow(1 + mr, months) - 1);
    const paid = payment * months;
    const interest = paid - loanAmount;
    return {
      loan: loanAmount,
      monthly: payment,
      totalInterest: interest,
      totalPaid: paid,
      principalPct: paid > 0 ? (loanAmount / paid) * 100 : 0,
    };
  }, [homePrice, downPayment, rate, years]);

  const field =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const label = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="price">Home price</label>
            <input
              id="price" type="number" min={0} step={5000} className={`${field} mt-1`}
              value={homePrice}
              onChange={(e) => setHomePrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className={label} htmlFor="down">Down payment</label>
            <input
              id="down" type="number" min={0} step={5000} className={`${field} mt-1`}
              value={downPayment}
              onChange={(e) => setDownPayment(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className={label} htmlFor="rate">Interest rate (%)</label>
            <input
              id="rate" type="number" min={0} step={0.125} className={`${field} mt-1`}
              value={rate}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className={label} htmlFor="term">Term</label>
            <select
              id="term" className={`${field} mt-1`}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            >
              {[10, 15, 20, 25, 30].map((y) => (
                <option key={y} value={y}>{y} years</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/40">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Loan amount
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {usd(loan)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${Math.min(100, Math.max(0, principalPct))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {principalPct.toFixed(0)}% of what you pay is principal,{" "}
            {(100 - principalPct).toFixed(0)}% is interest
          </p>
        </div>
      </div>

      {/* Result + lead capture */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="rounded-2xl bg-primary-600 p-6 text-white">
          <p className="text-sm font-medium text-primary-100">Estimated monthly payment</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{usd(monthly)}</p>
          <dl className="mt-4 space-y-1.5 text-sm text-primary-50">
            <div className="flex justify-between">
              <dt>Total interest</dt><dd className="font-semibold">{usd(totalInterest)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total paid</dt><dd className="font-semibold">{usd(totalPaid)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {submitted ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-green-600 dark:text-green-400">
                Lead captured.
              </span>{" "}
              In your live version this posts straight to your CRM and emails you the
              details. In this preview nothing was stored.
            </p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Get this quote emailed to you
              </p>
              <input required placeholder="Name" className={field} />
              <input required type="email" placeholder="Email" className={field} />
              <input type="tel" placeholder="Phone (optional)" className={field} />
              <button
                type="submit"
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                Send my quote
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Preview form — nothing is stored.
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="lg:col-span-5 text-sm text-gray-500 dark:text-gray-400">
        Live sample prepared for <strong className="text-gray-700 dark:text-gray-200">{brand}</strong>.
        Same engine as the calculators running in production on qfinhub.com — this one
        is wearing your name instead of ours.
      </p>
    </div>
  );
}
