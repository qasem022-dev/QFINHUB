import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How QFINHUB creates, reviews, and updates financial calculator content. Our commitment to accuracy, transparency, and editorial integrity.",
  alternates: {
    canonical: "https://www.qfinhub.com/editorial-policy",
  },
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Editorial Policy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Our commitment to accuracy, transparency, and editorial integrity.
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Content Creation */}
          <section>
            <h2>How We Create Content</h2>
            <p>
              Every page on QFINHUB is built with a single goal: providing
              accurate, helpful financial calculations that anyone can
              understand. Our content creation process follows these principles:
            </p>
            <ol>
              <li>
                <strong>Formula-Driven Accuracy:</strong> All calculator results
                are computed using standard financial formulas — the same
                equations used by banks, mortgage lenders, and financial
                institutions. We cite our sources and document our methodology.
              </li>
              <li>
                <strong>AI-Assisted, Human-Reviewed:</strong> We use AI tools to
                generate educational content at scale, but every page is
                reviewed by our founder,{" "}
                <Link href="/about" className="text-blue-600 dark:text-blue-400">
                  Qasem Mohammed
                </Link>
                , for accuracy, clarity, and helpfulness before publication.
              </li>
              <li>
                <strong>Original Analysis:</strong> Scenario pages contain
                actual computed values — not templates with replaced numbers.
                Each page&apos;s results are unique to its specific parameters.
              </li>
            </ol>
          </section>

          {/* Review Process */}
          <section>
            <h2>Our Review Process</h2>
            <p>Every piece of content on QFINHUB goes through:</p>
            <ul>
              <li>
                <strong>Formula Verification:</strong> The underlying
                mathematical formulas are verified against authoritative sources
                (IRS publications, CFPB guidelines, Federal Reserve data).
              </li>
              <li>
                <strong>Edge Case Testing:</strong> Calculators are tested with
                extreme values to ensure accurate results in all scenarios.
              </li>
              <li>
                <strong>Content Accuracy Check:</strong> Educational content is
                reviewed to ensure explanations, examples, and tips are accurate
                and helpful — not misleading or oversimplified.
              </li>
              <li>
                <strong>Schema Validation:</strong> Structured data (JSON-LD) is
                validated to ensure proper rendering in search results.
              </li>
            </ul>
          </section>

          {/* Update Frequency */}
          <section>
            <h2>How Often We Update Content</h2>
            <ul>
              <li>
                <strong>Calculators:</strong> Reviewed quarterly, or immediately
                when relevant tax laws, interest rate benchmarks, or financial
                regulations change.
              </li>
              <li>
                <strong>Blog Posts & Guides:</strong> Published weekly;
                older posts are reviewed and updated annually or when
                information becomes outdated.
              </li>
              <li>
                <strong>Scenario Pages:</strong> Generated daily with fresh
                computed values; reviewed for accuracy before publication.
              </li>
              <li>
                <strong>Static Pages</strong> (About, Privacy, Terms, Editorial
                Policy): Reviewed monthly for accuracy and compliance.
              </li>
            </ul>
          </section>

          {/* Fact-Checking */}
          <section>
            <h2>Fact-Checking & Sources</h2>
            <p>We cross-reference our financial formulas and educational
            content against authoritative sources including:</p>
            <ul>
              <li>Internal Revenue Service (IRS) publications and tax code</li>
              <li>
                Consumer Financial Protection Bureau (CFPB) mortgage guidelines
              </li>
              <li>Federal Reserve statistical releases and interest rate data</li>
              <li>
                U.S. Bureau of Labor Statistics (BLS) for inflation and
                economic data
              </li>
              <li>
                Standard financial mathematics textbooks and academic references
              </li>
            </ul>
            <p>
              When we cite specific data points (tax rates, contribution limits,
              standard deductions), we link to the official source wherever
              possible.
            </p>
          </section>

          {/* Corrections */}
          <section>
            <h2>Corrections Policy</h2>
            <p>
              If we discover an error — whether in a calculator&apos;s formula,
              educational content, or factual claim — we correct it immediately
              and note the correction date. Significant corrections are
              documented at the bottom of the affected page.
            </p>
            <p>
              If you believe you&apos;ve found an error, please{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400">
                contact us
              </Link>
              . We investigate all accuracy reports within 48 hours.
            </p>
          </section>

          {/* Transparency */}
          <section>
            <h2>Transparency</h2>
            <ul>
              <li>
                <strong>No Paywalls:</strong> All calculators and content are
                free — we never hide results behind sign-ups or payments.
              </li>
              <li>
                <strong>Clear Disclaimers:</strong> Every calculator page
                includes a YMYL disclaimer stating that results are educational
                estimates, not financial advice.
              </li>
              <li>
                <strong>Author Attribution:</strong> Every page identifies who
                created and reviewed the content, with links to our{" "}
                <Link href="/about" className="text-blue-600 dark:text-blue-400">
                  founder&apos;s profile
                </Link>
                .
              </li>
              <li>
                <strong>Formula Documentation:</strong> Each calculator explains
                the formula it uses in plain language, so you can verify the
                math yourself.
              </li>
            </ul>
          </section>

          {/* Last Reviewed */}
          <section>
            <h2>How to Check When a Page Was Last Reviewed</h2>
            <p>
              Every calculator and content page on QFINHUB displays a{" "}
              <strong>&ldquo;Last reviewed by Qasem Mohammed&rdquo;</strong>{" "}
              date at the bottom of the page. This date reflects the most recent
              editorial review — not just a minor typo fix, but a substantive
              review of the calculator&apos;s accuracy, formula, and educational
              content.
            </p>
          </section>
        </div>

        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" — "}
            <Link href="/about" className="underline">
              Qasem Mohammed
            </Link>
            , Founder & Lead Developer
          </p>
        </div>
      </div>
    </div>
  );
}
