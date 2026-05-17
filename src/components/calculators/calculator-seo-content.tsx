import { CalculatorContent } from "@/types/calculator-content";
import Link from "next/link";

interface CalculatorSEOContentProps {
  content: CalculatorContent;
  currentSlug: string;
}

/**
 * Renders educational SEO content (500-800 words) on calculator pages.
 * This helps with Google E-E-A-T, YMYL compliance, and organic search ranking.
 */
export function CalculatorSEOContent({
  content,
  currentSlug,
}: CalculatorSEOContentProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-gray max-w-4xl dark:prose-invert mx-auto">
        {/* Explanation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            What Is This Calculator?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">
            {content.explanation}
          </p>
        </section>

        {/* Formula */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            The Formula
          </h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <p className="text-center text-lg font-mono font-medium text-gray-800 dark:text-gray-200">
              {content.formula}
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {content.formulaDescription}
          </p>
        </section>

        {/* Real-World Use Case */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Why This Matters — Real-World Application
          </h2>
          <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">
            {content.realWorldUse}
          </p>
        </section>

        {/* Example */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Practical Example
          </h2>
          <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 p-5 dark:border-accent-900/30 dark:bg-accent-900/10">
            <p className="text-sm leading-relaxed text-accent-800 dark:text-accent-200">
              {content.example}
            </p>
          </div>
        </section>

        {/* Key Factors */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Key Factors That Affect Your Results
          </h2>
          <ul className="mt-3 space-y-2">
            {content.keyFactors.map((factor, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span className="text-sm">{factor}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tips */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tips for Using This Calculator
          </h2>
          <ul className="mt-3 space-y-2">
            {content.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
              >
                <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Related Calculators */}
        {content.relatedCalculators.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Related Calculators
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.relatedCalculators
                .filter((slug) => slug !== currentSlug)
                .slice(0, 6)
                .map((slug) => (
                  <Link
                    key={slug}
                    href={`/calculators/${slug}`}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-surface-dark-elevated dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                  >
                    {formatSlug(slug)}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
