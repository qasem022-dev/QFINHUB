import type { Metadata } from "next";
import Link from "next/link";
import { decisionPages } from "@/lib/decision-pages";

export const metadata: Metadata = {
  title:
    "Financial Decision Tools — Should I Refinance, Rent vs Buy, Pay Debt or Invest | QFINHUB",
  description:
    "Interactive financial decision tools that walk you through real-world tradeoffs: rent vs buy, refinance or not, pay debt or invest, retire early, and 20+ more scenarios.",
  alternates: { canonical: "https://www.qfinhub.com/decision" },
  robots: { index: true, follow: true },
};

export default function DecisionIndexPage() {
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
            <li className="text-gray-900">Decision Tools</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
          Financial Decision Tools
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Real financial decisions rarely have one right answer. Our decision
          tools walk you through the tradeoffs of common personal finance
          choices — when to rent vs buy, whether to refinance, how to
          prioritize debt payoff vs investing, and more.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            What Are Decision Tools?
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Most financial calculators answer a single numerical question:
            what is the monthly payment on this loan, or how much will I
            have saved by age 65 if I contribute X per month? Decision tools
            go further. They help you think through the qualitative
            tradeoffs between two or more options — the kind of decisions
            that can&apos;t be reduced to a single formula but where a
            structured framework can help you think more clearly.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Each QFINHUB decision tool presents a real-world financial
            scenario (such as &quot;Should I pay off my student loans early
            or invest the money?&quot;), walks you through the key factors
            to consider, helps you input your personal numbers, and then
            summarizes the tradeoffs in plain English. We do not tell you
            what to do — we help you think it through more clearly.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            All decision tools follow our standard editorial process:
            reviewed by Qasem Mohammed (Founder), based on established
            financial planning frameworks, and updated as tax laws and
            economic conditions change.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            Available Decision Tools ({decisionPages.length})
          </h2>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Each tool below walks you through a specific decision with a
            framework, calculator inputs, and a clear summary of the
            tradeoffs. All tools are free, no sign-up required.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {decisionPages.map((page) => (
              <Link
                key={page.slug}
                href={`/decision/${page.slug}`}
                className="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {page.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            How to Use Decision Tools
          </h2>
          <ol className="space-y-2 text-sm text-blue-900 ml-2 list-decimal list-inside">
            <li>
              <strong>Pick the decision you&apos;re facing.</strong> Browse
              the list above or search for your specific question.
            </li>
            <li>
              <strong>Read the framework section.</strong> Each tool
              explains the key factors that professionals consider when
              evaluating this decision.
            </li>
            <li>
              <strong>Enter your numbers.</strong> Provide your personal
              financial situation — loan balances, income, savings rate,
              timeline, etc.
            </li>
            <li>
              <strong>Review the tradeoffs.</strong> The tool summarizes
              the pros and cons of each option based on your inputs. You
              make the final call.
            </li>
          </ol>
        </section>

        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important:</strong> Decision tools help you think
            through tradeoffs — they don&apos;t replace professional advice.
            For major financial decisions, consult a qualified CFP®, CPA, or
            licensed attorney in your jurisdiction.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Last updated: July 2026
        </p>
      </div>
    </main>
  );
}