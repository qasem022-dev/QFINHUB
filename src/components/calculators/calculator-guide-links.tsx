import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { allCalculators } from "@/lib/calculators";
import { calculatorContent } from "@/lib/calculators/calculator-content";

/**
 * Renders contextual links to related calculators for guide pages.
 * Uses the calculator's relatedCalculators from SEO content data.
 */
export function CalculatorGuideLinks({ calculatorId }: { calculatorId: string }) {
  const content = calculatorContent[calculatorId];
  if (!content?.relatedCalculators?.length) return null;

  const relatedSlugs = content.relatedCalculators
    .filter((s: string) => s !== calculatorId)
    .slice(0, 5);

  if (!relatedSlugs.length) return null;

  return (
    <>
      {relatedSlugs.map((slug: string) => {
        const related = allCalculators.find((c) => c.slug === slug);
        if (!related) return null;
        return (
          <Link
            key={slug}
            href={`/calculators/${slug}`}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-surface-dark-elevated dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            {related.title}
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Link>
        );
      })}
    </>
  );
}
