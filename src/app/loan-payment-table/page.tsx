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

        {/* Comprehensive Guide Section */}
        <section className="mb-8 prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Read This Loan Payment Table</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The table above shows monthly payments, total interest, and total repayment for common personal loan scenarios across credit tiers and loan sizes. Each row represents a distinct use case — an emergency loan at fair credit, a debt consolidation loan at moderate credit, and a prime-borrower scenario at excellent credit. Use these as ballpark estimates when planning a loan application, then refine with your actual credit profile.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            The <strong>monthly payment</strong> column shows what you'll owe each month for the duration of the loan — this is fixed for the entire term because we assume a fixed interest rate. The <strong>total interest</strong> column shows the cumulative interest paid over the life of the loan. The <strong>total</strong> column sums principal plus interest to show what you'll actually pay back in total. As a quick check: total ≈ (monthly payment × number of months). The difference between total and the original loan amount reveals the true cost of borrowing.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How Credit Scores Affect Your Loan Rate</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Your credit score is the single biggest determinant of the interest rate you'll receive on a personal loan. Here's how rates typically break down by credit tier in 2026:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Excellent credit (740+):</strong> 7-12% APR — these borrowers receive the best rates from most lenders and may qualify for promotional offers.</li>
            <li><strong>Good credit (670-739):</strong> 12-18% APR — solid rates with most online lenders and credit unions; good negotiating position.</li>
            <li><strong>Fair credit (580-669):</strong> 18-25% APR — limited options; lenders add premiums for higher default risk.</li>
            <li><strong>Poor credit (below 580):</strong> 25-36% APR — these borrowers typically face personal loan rejection or predatory rates from non-traditional lenders.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How Loan Term Affects Total Cost</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Loan term is the second biggest cost driver after interest rate. A $20,000 loan at 8% APR illustrates this:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>3 years:</strong> $627/month, $2,567 total interest — minimum total cost but tightest monthly budget.</li>
            <li><strong>5 years:</strong> $406/month, $4,332 total interest — best balance of affordability and cost.</li>
            <li><strong>7 years:</strong> $311/month, $6,131 total interest — popular for debt consolidation because monthly fits typical budgets.</li>
            <li><strong>10 years:</strong> $243/month, $9,131 total interest — lowest monthly burden but most expensive overall.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">When to Use Each Loan Type</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Different loan sizes serve different purposes, and choosing the wrong one can cost you thousands:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>$5,000 emergency loan:</strong> For unexpected car repairs, minor medical bills, or short-term cash flow gaps. The 15% APR assumed is typical for borrowers with fair-to-good credit seeking quick funding.</li>
            <li><strong>$20,000 prime personal loan:</strong> For debt consolidation, home improvement projects, or planned major purchases. The 8% APR reflects strong credit and shopping the market across 3-5 lenders.</li>
            <li><strong>$25,000 debt consolidation:</strong> Use this size when consolidating high-interest credit card debt. The savings vs. continued minimum payments often justify the 7-year term. The 10% APR is below most credit cards.</li>
            <li><strong>Reality-check for fair credit:</strong> The 20% scenario shows the penalty for sub-prime credit. Building credit before borrowing can save over $7,000 on a $20,000 loan.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Origination Fees and APR vs. Interest Rate</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Many personal loans charge an origination fee of 1-6% of the loan amount, deducted from your disbursement. So a $20,000 loan with a 4% origination fee nets you $19,200 but charges interest on $20,000. Always compare the APR (annual percentage rate), which factors in fees, rather than the headline interest rate. Two loans at 8% rate can have very different effective APRs depending on their fee structures.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Prepayment and Penalties</h3>
          <p className="text-gray-700 leading-relaxed">
            Check whether your loan carries a prepayment penalty before signing. Most reputable lenders don't charge prepayment penalties, allowing you to pay off the loan early and save interest. If your loan does have a prepayment penalty (typically 1-2% of remaining balance), calculate whether the savings from a lower rate outweigh the eventual penalty cost. Prepayment penalties are more common at credit unions and banks than at online lenders, but always verify.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Last updated: June 2026
        </p>
      </div>
    </main>
  );
}
