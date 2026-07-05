import Link from "next/link";
import type { Metadata } from "next";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
import { ArrowRight, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Financial Calculator Comparisons — Side-by-Side Analysis",
  description:
    "Compare financial calculators side by side. See which mortgage, investment, retirement, and loan calculator fits your needs — with detailed breakdowns.",
  alternates: { canonical: "https://www.qfinhub.com/compare" },
  robots: { index: true, follow: true },
};

export default function CompareHubPage() {
  const comparisons = getAllComparisons();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Financial Calculator Comparisons
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Side-by-side analysis of top financial tools. Find the right calculator for mortgages, investing, retirement, and more.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.map((comp) => (
          <Link
            key={comp.slug}
            href={`/compare/${comp.slug}`}
            prefetch={true}
            className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="h-5 w-5 shrink-0 text-primary-500" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                  {comp.title || comp.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </h3>
                {comp.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {comp.description}
                  </p>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-gray-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Need a Calculator?
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Browse all 126 free financial calculators.
          </p>
          <Link
            href="/calculators"
            prefetch={true}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700"
          >
            Browse Calculators <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-gray-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Read Our Guides
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Learn how to use each calculator in 30 seconds.
          </p>
          <Link
            href="/guides"
            prefetch={true}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700"
          >
            View Guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
