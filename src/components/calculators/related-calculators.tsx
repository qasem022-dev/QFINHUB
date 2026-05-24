import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { CalculatorConfig, CategoryType } from "@/types/calculator";
import { CATEGORY_LABELS } from "@/types/calculator";

interface RelatedCalculatorsProps {
  currentSlug: string;
  calculators: CalculatorConfig[];
  maxResults?: number;
}

export function RelatedCalculators({
  currentSlug,
  calculators,
  maxResults = 6,
}: RelatedCalculatorsProps) {
  // Get current calculator
  const current = calculators.find((c) => c.slug === currentSlug);
  if (!current) return null;

  // Get calculators in the same category, excluding current
  const sameCategory = calculators.filter(
    (c) => c.slug !== currentSlug && c.category === current.category
  );

  // Get calculators from other categories to fill remaining slots
  const others = calculators.filter(
    (c) => c.slug !== currentSlug && c.category !== current.category
  );

  // Prioritize same category, then fill with others
  const related = [...sameCategory, ...others].slice(0, maxResults);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-10">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
          Related Calculators
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((calc) => (
          <Link
            key={calc.slug}
            href={`/calculators/${calc.slug}`}
            prefetch={true}
            className="group flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-150"
          >
            <span className="text-2xl flex-shrink-0">{calc.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {calc.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {calc.description}
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {CATEGORY_LABELS[calc.category as CategoryType] || calc.category}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-primary-500 transition-colors mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
