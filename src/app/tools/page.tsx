import type { Metadata } from "next";
import Link from "next/link";
import { getAllVariantPages } from "@/lib/programmatic-seo/generator";

export const metadata: Metadata = {
  title:
    "Specialized Financial Tools — Scenario Calculators & Decision Helpers | QFINHUB",
  description:
    "Specialized financial calculators for specific scenarios: state income tax, loan scenarios, mortgage variants, retirement planning edge cases. All free, no signup.",
  alternates: { canonical: "https://www.qfinhub.com/tools" },
  robots: { index: true, follow: true },
};

export default function ToolsIndexPage() {
  const variants = getAllVariantPages().slice(0, 30);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">Specialized Tools</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
          Specialized Financial Tools
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Scenario-specific calculators for less-common but important
          financial decisions — state-by-state income tax, mortgage
          variants, edge-case retirement scenarios, and more.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            What Are Specialized Tools?
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Most people use our core calculators (mortgage, loan,
            retirement, etc.) to answer their most common financial
            questions. But some financial situations are more specific —
            moving to a new state and needing to model the state income
            tax, comparing 15-year vs 30-year mortgages with specific
            principal amounts, or running a Roth conversion analysis for
            an early retirement. For these scenarios, our Specialized
            Tools section hosts pre-calculated calculators tuned to the
            specific decision.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Each specialized tool is generated from a verified formula
            with specific input values pre-filled for the most common
            scenario. You can adjust the inputs to match your personal
            situation, and the tool will recalculate in real time.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            Available Specialized Tools
          </h2>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Below is a sample of specialized tools. The full library
            includes hundreds of pre-calculated scenarios covering every
            US state, common mortgage amounts, and edge-case retirement
            situations.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {variants.map((v) => (
              <Link
                key={v.slug}
                href={`/tools/${v.slug}`}
                className="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {v.title || v.slug}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {v.description || `Pre-calculated scenario for ${v.slug}`}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Why Use Specialized Tools?
          </h2>
          <ul className="space-y-2 text-sm text-blue-900 ml-2">
            <li>
              <strong>Save time.</strong> Pre-filled inputs match the
              most common scenarios — no need to look up rates or
              defaults yourself.
            </li>
            <li>
              <strong>Reduce errors.</strong> Specific scenarios have
              been verified against known outcomes for that exact
              situation.
            </li>
            <li>
              <strong>Compare side-by-side.</strong> Many tools let you
              compare two scenarios (15 vs 30 year mortgage, Roth vs
              Traditional IRA) in a single view.
            </li>
          </ul>
        </section>

        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> Specialized tools provide estimates
            for educational purposes. For decisions involving significant
            money, consult a qualified CFP®, CPA, or licensed attorney in
            your jurisdiction.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Last updated: July 2026
        </p>
      </div>
    </main>
  );
}