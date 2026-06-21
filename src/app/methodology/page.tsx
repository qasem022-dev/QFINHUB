import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Methodology — How QFINHUB Calculators Work",
  description: "Learn how QFINHUB calculators are built, tested, and maintained. Our formulas are sourced from IRS, CFPB, Federal Reserve, and industry standards.",
  alternates: { canonical: "https://www.qfinhub.com/methodology" },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Methodology</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">How Our Calculators Work</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Every calculator on QFINHUB is built using industry-standard financial formulas sourced from authoritative 
              organizations including the <strong>Internal Revenue Service (IRS)</strong>, the <strong>Consumer Financial 
              Protection Bureau (CFPB)</strong>, the <strong>Federal Reserve</strong>, and generally accepted accounting 
              principles (GAAP).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Formula Sources</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Mortgage & Loan Calculators</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Based on the standard amortization formula: M = P × [r(1+r)^n] / [(1+r)^n − 1], 
                  as defined by the CFPB in Regulation Z (Truth in Lending Act) and Freddie Mac guidelines.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Compound Interest & Investment Calculators</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Using the compound interest formula: A = P(1 + r/n)^(nt). Rates and projections follow 
                  SEC guidelines for illustrated returns and the Federal Reserve&apos;s historical data for 
                  benchmark comparisons.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tax Calculators</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Based on current IRS tax brackets, standard deductions, and applicable credits 
                  as published in IRS Publication 17 and annual revenue procedures. Updated within 
                  48 hours of IRS announcements when possible.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Retirement & 401(k) Calculators</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Projections use IRS contribution limits, Social Security Administration benefit formulas, 
                  and Monte Carlo simulation models based on historical market data from the Federal Reserve 
                  Economic Database (FRED).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Data Accuracy & Testing</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• All calculators are tested against known benchmark scenarios before publication</li>
              <li>• Edge cases (zero values, extreme rates, long timeframes) are validated programmatically</li>
              <li>• Tax brackets and limits are updated as quickly as possible after official changes</li>
              <li>• Each calculator includes rounding to 2 decimal places for monetary values</li>
              <li>• Results are validated against Excel/Google Sheets using the same formulas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Limitations</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Our calculators provide estimates for educational and planning purposes. They do not constitute 
              financial, tax, or legal advice. Results may not reflect actual terms offered by financial 
              institutions, which can vary based on credit history, location, and market conditions.
              Always consult a qualified financial advisor before making major financial decisions.
            </p>
          </section>

          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-5 border border-primary-200 dark:border-primary-800 mt-8">
            <p className="text-sm text-primary-800 dark:text-primary-200">
              <strong>Last reviewed:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} by Qasem Mohammed, AI &amp; Software Engineer, Founder of QFINHUB. 
              <Link href="/about" className="underline ml-1">View author credentials →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
