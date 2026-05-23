"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

export interface RelatedCalc {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export function PeopleAlsoCalculated({
  currentSlug,
  calculators,
}: {
  currentSlug: string;
  calculators: RelatedCalc[];
}) {
  // Filter out current calculator
  const related = calculators.filter((c) => c.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          People Also Calculated
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {related.map((calc) => (
          <Link
            key={calc.slug}
            href={`/calculators/${calc.slug}`}
            prefetch={true}
            className="group flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-surface-dark hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-150"
          >
            <span className="text-2xl flex-shrink-0">{calc.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {calc.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {calc.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
