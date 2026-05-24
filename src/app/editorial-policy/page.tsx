import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy — How We Ensure Accuracy at QFINHUB",
  description: "Our editorial standards: every calculator, scenario, and article is reviewed by Qasem Mohammed, AI & Software Engineer. We cite IRS, CFPB, and Federal Reserve sources.",
  alternates: { canonical: "https://www.qfinhub.com/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Editorial Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Our Commitment to Accuracy</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              QFINHUB publishes financial calculators, pre-calculated scenarios, and educational content 
              to help individuals make informed financial decisions. We are committed to accuracy, 
              transparency, and editorial independence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Review Process</h2>
            <div className="space-y-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">1. Formula Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Every calculator formula is verified against IRS publications, CFPB guidelines, 
                  and Federal Reserve data. We cross-check results against Excel and Google Sheets.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2. Expert Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All content is reviewed by Qasem Mohammed, AI &amp; Software Engineer with expertise 
                  in financial modeling and software development. Content is reviewed before publication 
                  and updated when tax laws or financial regulations change.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">3. Source Attribution</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  We cite authoritative sources including the IRS, CFPB, Federal Reserve, Bureau of Labor 
                  Statistics, and Social Security Administration. Our <Link href="/methodology" className="text-primary-600 hover:underline">Methodology page</Link> details our formula sources.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">4. Regular Updates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tax brackets, contribution limits, and rate data are updated within 48 hours of 
                  official announcements. Each page displays a &quot;Last Reviewed&quot; date.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Editorial Independence</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              QFINHUB operates with full editorial independence. Our calculators and content are 
              not influenced by advertisers, partners, or financial institutions. We do not accept 
              payment for favorable placement or biased results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Corrections Policy</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              If you find an error in any calculator or content, please contact us immediately at{" "}
              <a href="mailto:q.finhub@gmail.com" className="text-primary-600 hover:underline">
                q.finhub@gmail.com
              </a>. We investigate all reports within 24 hours and correct verified errors promptly, 
              noting the correction date on the affected page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Content Types</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              QFINHUB publishes the following content types, each with specific standards:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 mt-2">
              <li>• <strong>Calculators:</strong> Interactive tools using verified formulas. Tested against known benchmarks.</li>
              <li>• <strong>Pre-Calculated Scenarios:</strong> Pre-filled calculator results for common use cases. Generated programmatically with verified parameters.</li>
              <li>• <strong>Blog Posts:</strong> Educational articles on financial topics. Fact-checked against primary sources.</li>
              <li>• <strong>Comparison Pages:</strong> Side-by-side comparisons of financial products/tools. Based on publicly available data.</li>
            </ul>
          </section>

          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-5 border border-primary-200 dark:border-primary-800 mt-8">
            <p className="text-sm text-primary-800 dark:text-primary-200">
              <strong>Policy last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. 
              For questions about our editorial standards, contact{" "}
              <a href="mailto:q.finhub@gmail.com" className="underline">q.finhub@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
