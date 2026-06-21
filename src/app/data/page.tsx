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

        {/* Additional data sections will be added as they become available. */}

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
