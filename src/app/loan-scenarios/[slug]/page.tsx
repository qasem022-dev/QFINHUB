import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLoanScenario, allLoanScenarioSlugs } from "@/data/loan-scenarios";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allLoanScenarioSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const scenario = getLoanScenario(slug);
  if (!scenario) return { title: "Scenario Not Found" };

  return {
    title: scenario.title,
    description: scenario.metaDescription,
    alternates: { canonical: `https://www.qfinhub.com/loan-scenarios/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function LoanScenarioPage({ params }: Props) {
  const { slug } = await params;
  const scenario = getLoanScenario(slug);

  if (!scenario) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/calculators/loan-calculator" className="hover:text-blue-600">Loan Calculator</Link></li>
            <li>/</li>
            <li><Link href="/loan-payment-table" className="hover:text-blue-600">Loan Scenarios</Link></li>
            <li>/</li>
            <li className="text-gray-900">{scenario.h1}</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6">
          {scenario.h1}
        </h1>

        {/* Above Fold — Direct Answer */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Monthly Payment</p>
              <p className="text-3xl font-bold text-blue-700">{scenario.aboveFold.monthlyPayment}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interest</p>
              <p className="text-3xl font-bold text-orange-600">{scenario.aboveFold.totalInterest}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Repayment</p>
              <p className="text-3xl font-bold text-gray-900">{scenario.aboveFold.totalRepayment}</p>
            </div>
          </div>
          {scenario.aboveFold.highlight && (
            <p className="mt-4 text-center text-sm font-medium text-green-700">
              {scenario.aboveFold.highlight}
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-500">
            Term: {scenario.aboveFold.term}
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/calculators/loan-calculator"
              className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {scenario.aboveFold.cta}
            </Link>
          </div>
        </div>

        {/* Assumptions Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Loan Assumptions</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100">
                {scenario.assumptions.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* What This Means */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What This Means in Real Life</h2>
          <p className="text-gray-700 leading-relaxed">{scenario.whatThisMeans}</p>
        </section>

        {/* When It Makes Sense */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-3">When This Loan Makes Sense</h2>
          <p className="text-gray-700 leading-relaxed">{scenario.whenItMakesSense}</p>
        </section>

        {/* When It's Risky */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-red-700 mb-3">When This Loan Is Risky</h2>
          <p className="text-gray-700 leading-relaxed">{scenario.whenItIsRisky}</p>
        </section>

        {/* Extra Section (Credit Improvement Path, etc.) */}
        {scenario.extraSection && (
          <section className="mb-8 rounded-lg bg-amber-50 border border-amber-200 p-6">
            <h2 className="text-xl font-semibold text-amber-800 mb-3">{scenario.extraSection.title}</h2>
            <p className="text-gray-700 leading-relaxed">{scenario.extraSection.content}</p>
          </section>
        )}

        {/* Comparison Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{scenario.comparisonTable.title}</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Scenario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Monthly</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scenario.comparisonTable.rows.map((row, i) => (
                  <tr key={i} className={row.scenario.includes("THIS PAGE") ? "bg-blue-50 font-medium" : i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.scenario}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.monthly}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.totalInterest}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">
            💡 {scenario.comparisonTable.takeaway}
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {scenario.faq.map((item, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <dt className="font-semibold text-gray-900 mb-1">{item.q}</dt>
                <dd className="text-gray-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Internal Links */}
        <section className="mb-8 rounded-lg bg-gray-50 border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Explore More</h2>
          <ul className="space-y-2">
            {scenario.internalLinks.map((link, i) => (
              <li key={i}>
                <Link href={link.url} className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                  → {link.anchor}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> {scenario.disclaimer}
          </p>
        </section>
      </div>
    </main>
  );
}
