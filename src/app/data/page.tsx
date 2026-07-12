import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Financial Data Tables — Loan Payments, Mortgage Affordability & More | QFINHUB",
  description:
    "Free financial reference data: loan payment tables, mortgage affordability tables, compound interest growth. Downloadable CSV files. No signup required. Cite our data in your research.",
  alternates: { canonical: "https://www.qfinhub.com/data" },
  robots: { index: true, follow: true },
};

export default function DataHubPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Data Hub</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
          Free Financial Data Tables
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Original data and reference tables for journalists, researchers, and personal finance readers. No signup required. All data calculated using standard financial formulas.
        </p>

        {/* Section 1: Loan Payment Tables */}
        <section className="mb-10 rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Personal Loan Payment Tables
          </h2>
          <p className="text-gray-700 mb-4">
            Monthly payments for personal loans from $5,000 to $30,000 across different rates and terms. Includes real-world scenarios: emergency loans, debt consolidation, and fair-credit borrowing.
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <Link
              href="/loan-payment-table"
              className="inline-block rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Full Loan Payment Table →
            </Link>
            <Link
              href="/calculators/loan-calculator"
              className="inline-block rounded-md border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              Try the Loan Calculator
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Methodology: Standard amortization formula. Fixed rate assumption. See full details on the loan payment table page.
          </p>
        </section>

        {/* Section 2: About the Data Hub */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            About the QFINHUB Data Hub
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            The QFINHUB Data Hub is a growing collection of original financial
            reference tables, downloadable datasets, and pre-calculated
            scenarios designed for journalists, researchers, students, and
            curious individuals who need accurate, citable financial data
            without paying for a Bloomberg terminal or wrestling with a
            spreadsheet full of broken formulas.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Every table in this hub is generated using the same verified
            formulas that power our calculators. The numbers you see here
            match what you would calculate by hand using a textbook formula
            and a careful spreadsheet — and they match what our interactive
            calculators return to users every day. We publish the formula
            and the source data so you can verify, replicate, or extend the
            analysis for your own work.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Unlike many financial data publishers, QFINHUB does not gate
            data behind a paywall, an email capture, or a registration
            form. Every dataset is freely accessible and free to use, with
            attribution. If you find our data useful in your research or
            reporting, please cite us using one of the formats below — it
            helps us justify the continued investment in keeping this
            resource free.
          </p>
        </section>

        {/* Section 3: Available Data Categories */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Data Categories Available
          </h2>
          <p className="text-gray-700 mb-5 leading-relaxed">
            We currently publish data in the following categories. More
            categories are added every quarter based on user requests and
            research demand.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                📊 Loan &amp; Mortgage Payment Tables
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Monthly payment amounts for fixed-rate loans and mortgages
                across a wide range of principal amounts, interest rates,
                and term lengths. Useful for comparing lender offers,
                budgeting, and financial planning. Includes both
                amortization schedule data and total interest paid over
                the life of the loan.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                💰 Compound Interest Growth Curves
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Year-by-year growth projections for savings and
                investments at different interest rates and contribution
                levels. Based on the standard compound interest formula
                with configurable compounding frequency (daily, monthly,
                quarterly, annually). Useful for retirement planning,
                college savings projections, and savings goal modeling.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                🏠 Mortgage Affordability Tables
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Maximum affordable home price by income level, down
                payment, interest rate, and debt-to-income ratio. Includes
                principal, interest, property taxes, insurance (PITI),
                and PMI estimates where applicable. Useful for first-time
                homebuyers and affordability research.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                📈 Federal Tax Bracket Tables
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Current and historical federal income tax brackets for
                single, married filing jointly, married filing separately,
                and head of household filers. Updated within 48 hours of
                IRS publication. Source: IRS Revenue Procedures.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: How Our Data Is Generated */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            How Our Data Is Generated
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Every dataset published in the QFINHUB Data Hub is generated by
            the same verified code that powers our interactive calculators.
            Our calculation engine has been tested against known benchmark
            scenarios and cross-validated against Excel, Google Sheets, and
            at least one independent reference source before publication.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            The data generation process is fully reproducible. Every table
            is produced by running a specific formula across a defined
            input space. We publish both the formula and the input
            parameters so you can regenerate the data yourself in any tool
            you prefer.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            For example, our loan payment tables are generated by applying
            the standard amortization formula — M = P × [r(1+r)<sup>n</sup>] /
            [(1+r)<sup>n</sup> − 1] — across a grid of principal amounts
            ($5,000 to $30,000 in $1,000 increments), interest rates (5%
            to 36% APR in 1% increments), and term lengths (1 to 7 years).
            That&apos;s 26 × 32 × 7 = 5,824 individual calculations per
            table, each one verified programmatically before publication.
          </p>
        </section>

        {/* Section 5: Update Cadence */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Update Cadence
          </h2>
          <ul className="space-y-2 text-gray-700 ml-2">
            <li>
              <strong>Loan &amp; mortgage tables:</strong> Updated annually
              (or sooner if benchmark rates shift materially mid-year).
            </li>
            <li>
              <strong>Tax bracket tables:</strong> Updated within 48 hours
              of IRS publication of new annual brackets (typically
              October-November each year).
            </li>
            <li>
              <strong>Compound interest curves:</strong> Updated annually
              with current Federal Reserve long-term rate assumptions.
            </li>
            <li>
              <strong>Mortgage affordability tables:</strong> Updated
              quarterly as median home prices and median incomes shift.
            </li>
          </ul>
        </section>

        {/* Section 6: Use Cases */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Common Use Cases
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            The QFINHUB Data Hub is used by:
          </p>
          <ul className="space-y-2 text-gray-700 ml-2">
            <li>
              <strong>Personal finance journalists</strong> writing about
              loan affordability, mortgage rates, or retirement planning
            </li>
            <li>
              <strong>Academic researchers</strong> studying consumer
              debt, savings behavior, or wealth inequality
            </li>
            <li>
              <strong>Financial advisors</strong> preparing client
              presentations and retirement projections
            </li>
            <li>
              <strong>Real estate professionals</strong> providing
              clients with quick affordability estimates
            </li>
            <li>
              <strong>Students</strong> learning about compound interest,
              amortization, and tax calculations
            </li>
            <li>
              <strong>Personal finance bloggers</strong> wanting to cite
              authoritative data in their articles
            </li>
          </ul>
        </section>

        {/* Cite This Data */}
        <section className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-3">Cite This Data</h2>
          <p className="text-sm text-green-700 mb-4">
            You're welcome to cite QFINHUB data in your research, articles, or analysis. Use the citation formats below.
          </p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-green-800">APA</p>
              <p className="text-green-700 font-mono text-xs">QFINHUB. (2026). Personal Loan Payment Tables. Retrieved [date], from https://qfinhub.com/data</p>
            </div>
            <div>
              <p className="font-semibold text-green-800">MLA</p>
              <p className="text-green-700 font-mono text-xs">&ldquo;Personal Loan Payment Tables.&rdquo; QFINHUB, 2026, qfinhub.com/data. Accessed [date].</p>
            </div>
            <div>
              <p className="font-semibold text-green-800">Chicago</p>
              <p className="text-green-700 font-mono text-xs">&ldquo;Personal Loan Payment Tables.&rdquo; QFINHUB. Accessed [date]. https://qfinhub.com/data.</p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> All data is calculated using standard financial formulas and publicly available information. This is educational reference data, not financial advice. Always verify calculations for your specific situation.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Last updated: June 2026
        </p>
      </div>
    </main>
  );
}
