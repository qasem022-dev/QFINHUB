import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import {
  allCalculators,
  getAllCategories,
} from "@/lib/calculators";

import { CalculatorListingClient } from "@/components/calculators/calculator-listing-client";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { CATEGORY_LABELS, type CategoryType } from "@/types/calculator";

interface CalculatorsPageProps {
  searchParams: Promise<{ q?: string; cat?: string }>;
}

export const metadata: Metadata = {
  title: "All 125+ Financial Calculators",
  description:
    "Browse all 125+ free financial calculators across 8 categories — loans, mortgages, investments, retirement, taxes, business, personal finance, and basic calculators. Fast, accurate, and 100% free.",
  openGraph: {
    title: "All 125+ Free Financial Calculators | QFINHUB",
    description:
      "Browse and use 125+ reliable financial calculators across 8 categories. No sign-up required.",
    images: ["/og-image.png"],
    url: "https://www.qfinhub.com/calculators",
  },
  alternates: {
    canonical: "https://www.qfinhub.com/calculators",
  },
};

export default async function CalculatorsPage({ searchParams }: CalculatorsPageProps) {
  const params = await searchParams;
  const initialSearch = params.q ?? "";
  const initialCategory = params.cat ?? "all";
  const categories = getAllCategories();

  // Calculate initial counts for SSR
  const implementedSlugs = new Set<string>();
  for (const calc of allCalculators) {
    if (getCalculatorComponent(calc.slug)) {
      implementedSlugs.add(calc.slug);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Financial Calculators
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {implementedSlugs.size} reliable financial calculators across{" "}
          {categories.length} categories. Browse, calculate, and export
          your results.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <CalculatorListingClient
          calculators={allCalculators}
          categories={categories}
          initialSearch={initialSearch}
          initialCategory={initialCategory}
        />
      </Suspense>

      {/* Server-rendered cards for SEO/crawlers — hidden when JS is active */}
      <noscript>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {allCalculators.map((calc) => (
            <a
              key={calc.slug}
              href={`/calculators/${calc.slug}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{calc.icon}</span>
                <div>
                  <h3 className="font-semibold text-zinc-900">{calc.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{calc.description}</p>
                  <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {CATEGORY_LABELS[calc.category as CategoryType] ?? calc.category}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </noscript>

      {/* Popular pre-calculated scenarios — surfaces /tools/* for crawl discovery */}
      <section className="mt-16 border-t border-zinc-100 pt-12 dark:border-zinc-800">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Popular Pre-Calculated Scenarios</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            See worked examples for the most common financial questions — then plug your own numbers in.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "$10K Invested for 10 Years", slug: "investment-10k-10yr" },
            { label: "$100K for 15 Years", slug: "investment-100k-15yr" },
            { label: "$60K Salary — Single", slug: "tax-60k-single" },
            { label: "$100K — Married Joint", slug: "tax-100k-married-joint" },
            { label: "6-Month Emergency Fund", slug: "emergency-fund-5k-6mo" },
            { label: "Net Worth at 40", slug: "net-worth-40s-peak" },
            { label: "DTI 28% on $75K", slug: "dti-75k-28pct" },
            { label: "Lean FIRE — $40K Expenses", slug: "fire-40k-lean-800k" },
          ].map((t) => (
            <a
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              {t.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
