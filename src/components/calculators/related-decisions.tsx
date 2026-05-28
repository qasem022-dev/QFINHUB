import Link from "next/link"; // Phase 10.5
import { Lightbulb } from "lucide-react";

interface DecisionLink {
  slug: string;
  title: string;
}

interface RelatedDecisionsProps {
  calculatorSlug: string;
  decisions: DecisionLink[];
  maxResults?: number;
}

/**
 * V2: Shows decision guide pages that help users answer real financial questions
 * using this calculator. Links from calculator hubs to decision pages.
 */
export function RelatedDecisions({
  calculatorSlug,
  decisions,
  maxResults = 4,
}: RelatedDecisionsProps) {
  if (!decisions || decisions.length === 0) return null;

  const display = decisions.slice(0, maxResults);

  return (
    <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Popular Financial Decisions
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {display.map((d) => (
          <Link
            key={d.slug}
            href={`/decision/${d.slug}`}
            prefetch={true}
            className="group flex items-center gap-2 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200 group-hover:text-amber-900 dark:group-hover:text-amber-100">
              {d.title}
            </span>
            <span className="text-amber-400 dark:text-amber-500 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
