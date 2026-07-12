import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Editorial Policy — How QFINHUB Ensures Accuracy, Reviews Content & Maintains Independence",
  description:
    "QFINHUB's editorial standards: every calculator, scenario, and article is reviewed by a human expert before publication. We cite primary sources (IRS, CFPB, Federal Reserve) and disclose AI use.",
  alternates: { canonical: "https://www.qfinhub.com/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Editorial Policy
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          QFINHUB publishes financial calculators, pre-calculated scenarios,
          and educational content to help individuals make informed financial
          decisions. This page documents the standards, processes, and
          safeguards that ensure every piece of content on QFINHUB is
          accurate, transparent, and editorially independent.
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-10">
          {/* 1. Commitment */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Our Commitment to You
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Financial decisions have real consequences. A wrong mortgage
              calculation can cost a family thousands of dollars. A
              miscalculated tax estimate can trigger an audit. A poorly-modeled
              retirement projection can leave someone working five years
              longer than they needed to.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              That&apos;s why every calculator, scenario, article, and piece
              of educational content on QFINHUB passes through a documented
              editorial workflow before publication. We do not publish
              unverified material, and we correct verified errors quickly and
              transparently. Our commitment is to be the most accurate,
              most transparent, and most useful free financial calculator
              platform on the web.
            </p>
          </section>

          {/* 2. Review Process */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Editorial Review Process
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
              Every calculator and content piece on QFINHUB passes through a
              five-stage review process. Stages 1-3 are mandatory before
              publication; stages 4-5 are ongoing.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Stage 1 — Formula Verification
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Every calculator formula is verified against primary
                  sources — IRS publications (Publication 17 for income tax,
                  Publication 936 for home mortgage interest, etc.), CFPB
                  regulations (Regulation Z for Truth in Lending, TILA-RESPA
                  integrated disclosures), Federal Reserve data (FRED for
                  historical rates and yields), and industry standards (NAHB
                  for mortgage conventions, AICPA for accounting, FFIEC for
                  banking rules). We cross-check results against Excel,
                  Google Sheets, and at least one independent reference
                  calculator before publication.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Stage 2 — Edge-Case &amp; Boundary Testing
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Calculators are tested with extreme inputs (zero rates,
                  zero principal, very long timeframes, very small payments,
                  negative amortization scenarios) to ensure they produce
                  meaningful results or clear user-facing messages. We never
                  publish a calculator that crashes, returns NaN, or produces
                  nonsensical numbers for valid inputs.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Stage 3 — Expert Editorial Review
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Every calculator and content piece is personally reviewed
                  by{" "}
                  <Link
                    href="/about"
                    className="text-primary-600 dark:text-primary-400 underline font-medium"
                  >
                    Qasem Mohammed
                  </Link>
                  , AI &amp; Software Engineer and Founder of QFINHUB, who
                  holds credentials from DeepLearning.AI (AI &amp; Machine
                  Learning Specialization) and Meta (Full-Stack Software
                  Development). Qasem personally hand-verifies at least three
                  representative scenarios per calculator before approving
                  it for publication.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Stage 4 — Continuous Monitoring
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  After publication, every calculator is monitored by an
                  automated regression test suite that re-runs standard
                  benchmark scenarios nightly. Any drift triggers an
                  immediate investigation. User-reported errors are
                  investigated within 48 hours.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Stage 5 — Regular Updates
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  Tax brackets, contribution limits, and rate data are
                  updated as quickly as possible after official
                  announcements — typically within 48 hours of IRS, SSA,
                  or HUD publication. Each calculator page displays a
                  &quot;Last reviewed&quot; date so users know how current
                  the information is.
                </p>
              </div>
            </div>
          </section>

          {/* 3. AI Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              AI &amp; Automation Disclosure
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              QFINHUB uses artificial intelligence and automation to assist
              with content creation, formula verification, and calculator
              testing. We believe in being transparent about how AI is used
              — both for compliance with platform policies and for building
              trust with our users.
            </p>

            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Where AI Assists
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  AI tools help draft educational content (such as guides
                  and blog posts), generate calculator descriptions, suggest
                  formula implementations, and surface edge cases for
                  testing. AI also powers our interactive Q&amp;A feature
                  (the AI Specialist) to help users explore financial
                  scenarios conversationally.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Human Responsibility &amp; Oversight
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  All AI-assisted content is reviewed and approved by Qasem
                  Mohammed, the owner and developer of QFINHUB, before
                  publication. Final responsibility for accuracy, formula
                  correctness, and editorial standards rests with the human
                  reviewer. No content is published solely by AI without
                  human oversight. If we ever publish AI-generated content
                  without meaningful human review, please report it to us
                  immediately — we will investigate.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Questions About a Specific Page?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  If you have questions about how a specific piece of content
                  was created, reviewed, or sourced, contact us at{" "}
                  <a
                    href="mailto:q.finhub@gmail.com"
                    className="text-primary-600 dark:text-primary-400 underline font-medium"
                  >
                    q.finhub@gmail.com
                  </a>
                  . We will respond with full disclosure of the content&apos;s
                  editorial history within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Editorial Independence */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Editorial Independence
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              QFINHUB operates with full editorial independence. Our
              calculators and content are not influenced by advertisers,
              partners, or financial institutions. We do not accept payment
              for favorable placement or biased results, and we do not allow
              advertiser relationships to influence our editorial output in
              any way.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our editors and reviewers have no financial stake in any
              product, calculator, or recommendation we publish. When we
              display advertising (currently through Google AdSense), it is
              clearly distinguished from editorial content and labeled as
              such. Our editorial team has no visibility into which specific
              advertisers appear on which pages.
            </p>
          </section>

          {/* 5. Corrections Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Corrections Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Despite our rigorous review process, mistakes happen. When
              they do, we fix them quickly, transparently, and with credit to
              whoever found them.
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>How to report an error:</strong> Email{" "}
                <a
                  href="mailto:q.finhub@gmail.com"
                  className="text-primary-600 dark:text-primary-400 underline font-medium"
                >
                  q.finhub@gmail.com
                </a>{" "}
                with the page URL, the inputs you used, the result you got,
                and (if known) the expected correct result.
              </li>
              <li>
                <strong>Response time:</strong> We acknowledge all error
                reports within 24 hours and complete investigation within 48
                hours. Critical errors (those that could lead to material
                financial harm) are prioritized and corrected within 4 hours.
              </li>
              <li>
                <strong>Correction process:</strong> Verified errors are
                corrected within 24 hours, and the affected page is updated
                with a correction notice acknowledging the issue and the
                reporter (unless they request anonymity).
              </li>
              <li>
                <strong>Pattern corrections:</strong> If we discover an error
                affects multiple calculators or pages, we fix all instances
                simultaneously and notify users via our site update log.
              </li>
            </ul>
          </section>

          {/* 6. Content Types */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Content Types &amp; Their Standards
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              QFINHUB publishes several types of content, each governed by
              specific standards:
            </p>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Calculators:</strong> Interactive tools using
                verified formulas. Every calculator must pass all five
                review stages above. Updates triggered by tax-law changes
                within 48 hours.
              </li>
              <li>
                <strong>Pre-Calculated Scenarios:</strong> Pre-filled
                calculator results for common real-world use cases
                (e.g., &quot;What&apos;s the monthly payment on a $300K
                mortgage at 7% for 30 years?&quot;). Generated
                programmatically with verified parameters and reviewed
                for sanity by a human editor before publication.
              </li>
              <li>
                <strong>Blog Posts &amp; Guides:</strong> Educational
                articles on personal finance topics. Fact-checked against
                primary sources. Each post is reviewed by Qasem before
                publication and updated when underlying facts change.
              </li>
              <li>
                <strong>Comparison Pages:</strong> Side-by-side comparisons
                of financial products, tools, or strategies. Based on
                publicly available data and disclosed methodology.
              </li>
              <li>
                <strong>Decision Tools:</strong> Interactive decision
                frameworks (e.g., &quot;Should I rent or buy?&quot;) that
                walk users through tradeoffs. Reviewed for neutrality and
                balanced presentation.
              </li>
            </ul>
          </section>

          {/* 7. Sourcing Standards */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Sourcing Standards
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We cite only authoritative primary sources. When we make a
              factual claim, you can trace it back to one of the following
              categories of sources:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-2">
              <li>
                <strong>Government sources:</strong> IRS, CFPB, Federal
                Reserve, Bureau of Labor Statistics, Social Security
                Administration, HUD, FHA, Freddie Mac, Fannie Mae
              </li>
              <li>
                <strong>Industry standards bodies:</strong> NAHB (National
                Association of Home Builders), AICPA (American Institute of
                CPAs), FFIEC (Federal Financial Institutions Examination
                Council), GASB (Governmental Accounting Standards Board)
              </li>
              <li>
                <strong>Peer-reviewed academic research:</strong> For any
                claim about personal finance behavior, savings rates, or
                market returns, we cite published academic research when
                available
              </li>
              <li>
                <strong>Established financial publishers:</strong> Wall
                Street Journal, Bloomberg, Reuters, Financial Times (for
                market data and breaking news context only)
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We do not cite anonymous sources, unverified Reddit posts,
              affiliate-style &quot;review&quot; sites, or other content
              farms as authoritative sources.
            </p>
          </section>

          {/* Footer signature */}
          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-5 border border-primary-200 dark:border-primary-800 mt-10">
            <p className="text-sm text-primary-900 dark:text-primary-100 leading-relaxed">
              <strong>Policy last updated:</strong>{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              by Qasem Mohammed, AI &amp; Software Engineer, Founder of
              QFINHUB. For questions about our editorial standards, contact{" "}
              <a
                href="mailto:q.finhub@gmail.com"
                className="underline font-medium"
              >
                q.finhub@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}