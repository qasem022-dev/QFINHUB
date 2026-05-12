import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  allCalculators,
  getAllCategories,
} from "@/lib/calculators";

import { CalculatorListingClient } from "@/components/calculators/calculator-listing-client";
import { getCalculatorComponent } from "@/components/calculators/registry";

interface CalculatorsPageProps {
  searchParams: Promise<{ q?: string; cat?: string }>;
}

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
          {implementedSlugs.size} professional financial calculators across{" "}
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
    </div>
  );
}
