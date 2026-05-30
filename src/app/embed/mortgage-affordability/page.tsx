/**
 * /embed/mortgage-affordability — Standalone embeddable widget route.
 * Shows the mortgage affordability calculator in a minimal wrapper
 * with branded attribution. Designed to be loaded in an iframe by
 * external sites (real estate blogs, mortgage brokers, etc.).
 *
 * SEO: noindex,follow (set in embed layout). NOT in sitemap.
 */
import MortgageAffordabilityCalculator from "@/components/calculators/impl/mortgage-affordability";

export default function EmbedMortgageAffordabilityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <MortgageAffordabilityCalculator />

      {/* Branded attribution — clean, small, not spammy */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-gray-800">
        <a
          href="https://www.qfinhub.com/widgets/mortgage-affordability-embed?utm_source=embed&utm_medium=widget&utm_campaign=mortgage-affordability"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 transition-colors hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400"
        >
          Powered by <span className="font-semibold text-gray-500 dark:text-gray-400">QFINHUB</span>
        </a>
      </div>
    </div>
  );
}
