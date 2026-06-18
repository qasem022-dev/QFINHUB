import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Personal Loan Payment Table — Compare Monthly Payments by Amount & Rate | QFINHUB",
  description:
    "Quick-reference loan payment tables for personal loans from $5,000 to $30,000. Compare monthly payments across different rates and terms. Free, no signup required.",
  alternates: { canonical: "https://www.qfinhub.com/loan-payment-table" },
  robots: { index: true, follow: true },
};

const scenarios = [
  {
    useCase: "Small Emergency Loan",
    amount: "$5,000",
    apr: "15%",
    term: "3 years",
    payment: "$173.00",
    interest: "$1,228",
    total: "$6,228",
    slug: "small-emergency-loan-5000-15-percent",
  },
  {
    useCase: "Good Credit Personal Loan",
    amount: "$20,000",
    apr: "8%",
    term: "5 years",
    payment: "$405.53",
    interest: "$4,332",
    total: "$24,332",
    slug: "good-credit-loan-20000-8-percent",
  },
  {
    useCase: "Debt Consolidation",
    amount: "$25,000",
    apr: "10%",
    term: "7 years",
    payment: "$415.19",
    interest: "$9,876",
    total: "$34,876",
    slug: "debt-consolidation-loan-25000-10-percent",
  },
  {
    useCase: "Fair Credit Reality Check",
    amount: "$20,000",
    apr: "20%",
    term: "5 years",
    payment: "$529.88",
    interest: "$11,793",
    total: "$31,793",
    slug: "fair-credit-loan-20000-20-percent",
  },
];

const faq = [
  {
    q: "Why do different loan amounts have different rates?",
    a: "Smaller loans (under $10K) often carry higher rates because lenders have minimum processing costs. Larger loans ($20K+) can offer lower rates because the lender earns more total interest. Your credit score is the biggest factor — excellent credit can get 7-10%, while fair credit may see 15-25%.",
  },
  {
    q: "How accurate are these payment estimates?",
    a: "These use standard amortization math and are mathematically correct for the stated inputs. However, your actual loan may include origination fees (1-8% of the loan), prepayment penalties, or variable rates — none of which are reflected here. Always get the full APR (which includes fees) from your lender.",
  },
  {
    q: "Which loan scenario is right for me?",
    a: "Click through to each scenario page for detailed guidance. Generally: (1) Emergency loans — borrow only what you need, (2) Good credit — you have the most options and lowest rates, (3) Consolidation — only if you'll save vs current debt, (4) Fair credit — consider improving credit first if possible.",
  },
];

export default function LoanPaymentTablePage() {
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
            <li className="text-gray-900">Loan Payment Table</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
          Personal Loan Payment Tables
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Monthly payments at a glance. These tables show estimated monthly payments for common personal loan amounts, rates, and terms. Use these as a quick reference — for your exact numbers, try our free Loan Calculator.
        </p>

        <div className="mb-8">
          <Link
            href="/calculators/loan-calculator"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Calculate your exact loan payment →
          </Link>
        </div>

        {/* Scenarios Table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Starter Loan Scenarios — Real-World Examples</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Use Case</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">APR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Term</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Monthly</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scenarios.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.useCase}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.apr}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.term}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700">{s.payment}</td>
                    <td className="px-4 py-3 text-sm text-orange-600">{s.interest}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.total}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/loan-scenarios/${s.slug}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Methodology</h2>
          <p className="text-gray-700 leading-relaxed">
            All payments calculated using the standard amortization formula:{" "}
            <code className="bg-gray-100 px-1 rounded text-sm">Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]</code>
            , where P = principal, r = monthly interest rate (APR/12), n = total number of payments (term × 12).
            Assumes fixed rate, no fees, no prepayment penalties. Actual loan terms may differ.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <dt className="font-semibold text-gray-900 mb-1">{item.q}</dt>
                <dd className="text-gray-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Explore More */}
        <section className="mb-8 rounded-lg bg-gray-50 border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Explore More</h2>
          <ul className="space-y-2">
            <li><Link href="/calculators/loan-calculator" className="text-blue-600 hover:text-blue-800 hover:underline text-sm">→ Try the Loan Calculator with your exact numbers</Link></li>
            <li><Link href="/data" className="text-blue-600 hover:text-blue-800 hover:underline text-sm">→ Browse the QFINHUB Data Hub</Link></li>
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> These are educational estimates, not loan offers. Actual rates depend on your credit profile, income, and lender. APR shown is interest rate only and may not include origination fees. Always compare the full APR from multiple lenders before borrowing.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Last updated: June 2026
        </p>
      </div>
    </main>
  );
}
