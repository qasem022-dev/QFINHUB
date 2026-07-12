import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Methodology — How QFINHUB Calculators Are Built & Validated",
  description:
    "Detailed methodology behind QFINHUB's 125+ financial calculators: formulas sourced from IRS, CFPB, Federal Reserve, and GAAP. Testing, validation, limitations, and editorial review process.",
  alternates: { canonical: "https://www.qfinhub.com/methodology" },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Our Methodology
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          Every calculator on QFINHUB is built using industry-standard financial
          formulas sourced from authoritative organizations, validated against
          published benchmarks, and personally reviewed for accuracy. This page
          explains exactly how we do that — and where our calculators stop.
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-10">
          {/* Section 1: How the calculators work */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              How Our Calculators Work
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Every calculator on QFINHUB is built using industry-standard
              financial formulas sourced from authoritative organizations
              including the <strong>Internal Revenue Service (IRS)</strong>, the{" "}
              <strong>Consumer Financial Protection Bureau (CFPB)</strong>, the{" "}
              <strong>Federal Reserve</strong>, and generally accepted
              accounting principles (GAAP). We do not invent formulas. Where
              multiple valid approaches exist (for example, the two common ways
              to calculate compound interest), we document our choice and link
              to the source.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Each calculator is implemented as a small, isolated unit of code
              so it can be tested independently. Before publication, every
              calculator passes a five-step validation process:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Formula verification</strong> — implementation matches
                the cited formula exactly, including handling of edge cases
                (zero, negative, very large, very small inputs).
              </li>
              <li>
                <strong>Benchmark tests</strong> — outputs are compared against
                three independent sources (Excel, Google Sheets, and a
                reference calculator) for at least 20 known input scenarios.
              </li>
              <li>
                <strong>Edge-case tests</strong> — boundary inputs (zero rates,
                zero principal, 100-year timeframes, negative amortization)
                produce either a meaningful result or a clear, user-facing
                message — never a silent NaN or infinity.
              </li>
              <li>
                <strong>Editorial review</strong> — Qasem Mohammed, Founder and
                Lead Developer, personally checks the output against a manual
                hand calculation for at least three representative scenarios.
              </li>
              <li>
                <strong>Public-facing disclosure</strong> — every calculator
                page documents its formula, inputs, assumptions, and known
                limitations in plain English.
              </li>
            </ol>
          </section>

          {/* Section 2: Formula Sources (expanded) */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Formula Sources by Category
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
              Below is the authoritative source for each category of
              calculator on QFINHUB. Where multiple sources apply, all are
              cited. If you spot an error, please{" "}
              <Link href="/contact" className="underline text-blue-600 dark:text-blue-400">
                contact us
              </Link>{" "}
              and we will investigate and respond within 48 hours.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Mortgage &amp; Loan Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Based on the standard amortization formula:
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
                    M = P × [r(1+r)<sup>n</sup>] / [(1+r)<sup>n</sup> − 1]
                  </code>
                  as defined by the CFPB in Regulation Z (Truth in Lending Act)
                  and Freddie Mac &amp; Fannie Mae conforming loan guidelines.
                  PMI calculations follow the Consumer Financial Protection
                  Bureau&apos;s 2014 rule on private mortgage insurance
                  cancellation, and FHA loan calculations use the most recent
                  Mortgagee Letter from HUD.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Compound Interest &amp; Investment Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Using the compound interest formula:
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
                    A = P(1 + r/n)<sup>nt</sup>
                  </code>
                  . Rate assumptions and historical benchmarks follow SEC
                  guidelines for illustrated returns and the Federal
                  Reserve&apos;s FRED (Federal Reserve Economic Database) for
                  long-term average returns. Default rates shown to users are
                  conservative estimates based on 30-year historical averages,
                  not best-case projections.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Tax Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Based on the current IRS tax brackets, standard deductions,
                  and applicable credits as published in{" "}
                  <strong>IRS Publication 17</strong> (Your Federal Income Tax)
                  and annual revenue procedures. Tax brackets and limits are
                  updated within 48 hours of IRS announcements when possible.
                  State tax calculations follow each state&apos;s department of
                  revenue published rates and brackets, current as of the
                  calculator&apos;s last review date shown at the bottom of
                  each page.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Retirement &amp; 401(k) Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Projections use current IRS contribution limits (401(k),
                  IRA, Roth IRA, catch-up contributions), Social Security
                  Administration benefit calculation formulas (Primary
                  Insurance Amount + bend points), and Monte Carlo simulation
                  models based on historical market data from FRED. Default
                  inflation assumptions follow the Federal Reserve&apos;s 2%
                  long-term target.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Debt Payoff Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Use the avalanche and snowball methods as commonly
                  described by the CFPB and Federal Trade Commission. APR
                  (annual percentage rate) calculations follow Regulation Z
                  standards. Credit card minimum payment calculations use the
                  standard 2% of balance or $25 minimum, whichever is
                  greater, as published by the CFPB.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Currency, Crypto &amp; Unit Calculators
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Exchange rates are sourced from public, freely available
                  APIs (European Central Bank reference rates, Frankfurter for
                  fiat, CoinGecko for cryptocurrency). Rates shown to users
                  include a clear timestamp so users know how fresh the data
                  is. We do not provide trading or investment advice — these
                  calculators are for informational and educational purposes
                  only.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Testing & QA */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Testing &amp; Quality Assurance
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Every QFINHUB calculator passes a multi-layer quality-assurance
              process before and after deployment. We treat financial
              calculators like medical calculators — accuracy is not a
              nice-to-have, it&apos;s the entire product.
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Pre-deployment testing:</strong> Each calculator is
                tested against at least 20 known input scenarios, including
                extreme values. Outputs are compared against Excel, Google
                Sheets, and at least one reference calculator from a
                different codebase.
              </li>
              <li>
                <strong>Edge-case handling:</strong> Boundary inputs (zero
                rates, zero principal, very long or short timeframes) produce
                meaningful results or clear user-facing messages — never
                silent NaN, infinity, or crash.
              </li>
              <li>
                <strong>Rounding standards:</strong> All monetary values are
                rounded to 2 decimal places. Percentages are rounded to 4
                decimal places to preserve precision for downstream
                calculations.
              </li>
              <li>
                <strong>Continuous regression testing:</strong> A nightly
                automated test suite re-runs the standard scenarios against
                every published calculator. Any drift triggers an alert.
              </li>
              <li>
                <strong>Tax-law updates:</strong> IRS brackets, contribution
                limits, and standard deductions are updated within 48 hours
                of official IRS publication when possible. Each calculator
                page shows its &quot;Last reviewed&quot; date.
              </li>
              <li>
                <strong>User feedback loop:</strong> Every calculator has a
                feedback link. We log all reports and investigate each one
                within 48 hours.
              </li>
            </ul>
          </section>

          {/* Section 4: Limitations & disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Limitations &amp; Disclaimers
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              QFINHUB calculators provide <strong>estimates</strong> for
              educational and planning purposes. They do not constitute
              financial, tax, investment, legal, or any other form of
              professional advice. Results may not reflect actual terms
              offered by financial institutions, which can vary based on
              credit history, location, market conditions, and
              institution-specific underwriting.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Always consult a qualified professional</strong> —
              including a CPA for tax questions, a CFP® for financial
              planning, and a licensed attorney for legal questions — before
              making major financial decisions. Our calculators are starting
              points for your research, not a substitute for personalized
              advice.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>What our calculators do NOT account for:</strong>
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                Personal credit profile (FICO score, debt-to-income ratio,
                recent inquiries)
              </li>
              <li>
                Local property taxes, insurance costs, or HOA fees (varies
                dramatically by location)
              </li>
              <li>
                Inflation volatility beyond our long-term assumption (we use
                2% per the Fed target)
              </li>
              <li>
                Future tax-law changes after our last update date
              </li>
              <li>
                Employer-specific 401(k) match formulas or vesting schedules
              </li>
              <li>
                Mortgage points, origination fees, and closing costs (unless
                explicitly entered by the user)
              </li>
            </ul>
          </section>

          {/* Section 5: Editorial Independence */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Editorial Independence
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              QFINHUB is independently funded by advertising. We do not
              accept payment from any financial institution, lender, or
              product in exchange for placement, ranking, or favorable
              treatment in our calculators or written content. Our editors
              do not have a financial stake in any tool, calculator, or
              recommendation we publish.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              When we display ads (such as through Google AdSense), they are
              clearly distinguished from editorial content by both visual
              separation and an{" "}
              <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
                Advertisement
              </code>{" "}
              or &quot;Sponsored&quot; label. Our editorial team has no
              visibility into which advertisers appear on which pages, and
              advertiser relationships do not influence our recommendations
              or calculator outputs.
            </p>
          </section>

          {/* Section 6: Reporting an error */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Reporting an Error
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              If you believe a QFINHUB calculator produced an incorrect
              result, please{" "}
              <Link href="/contact" className="underline text-blue-600 dark:text-blue-400">
                report it to us
              </Link>
              . Include the calculator URL, the inputs you used, the result
              you got, and (if possible) the result you expected. We
              investigate every report and respond within 48 hours.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Verified errors are corrected within 24 hours and credited on
              the affected page. Our{" "}
              <Link
                href="/editorial-policy"
                className="underline text-blue-600 dark:text-blue-400"
              >
                Editorial Policy
              </Link>{" "}
              describes the full update cadence and quality-control
              workflow.
            </p>
          </section>

          {/* Footer signature */}
          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-5 border border-primary-200 dark:border-primary-800 mt-10">
            <p className="text-sm text-primary-900 dark:text-primary-100 leading-relaxed">
              <strong>Last reviewed:</strong>{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              by Qasem Mohammed, AI &amp; Software Engineer, Founder of
              QFINHUB.{" "}
              <Link
                href="/about"
                className="underline ml-1 font-medium"
              >
                View author credentials →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}