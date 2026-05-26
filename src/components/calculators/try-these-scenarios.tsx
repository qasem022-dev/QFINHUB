import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";

interface ScenarioLink {
  slug: string;
  title: string;
  upgraded?: boolean;
}

interface TryTheseScenariosProps {
  calculatorSlug: string;
  scenarios: ScenarioLink[];
  maxResults?: number;
}

export function TryTheseScenarios({
  calculatorSlug,
  scenarios,
  maxResults = 5,
}: TryTheseScenariosProps) {
  if (scenarios.length === 0) return null;

  const display = scenarios.slice(0, maxResults);

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Try These Pre-Calculated Scenarios
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((scenario) => (
          <Link
            key={scenario.slug}
            href={`/scenario/${scenario.slug}`}
            prefetch={true}
            className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-150"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                {scenario.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {scenario.upgraded ? "✨ Upgraded example" : "Pre-calculated example"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href={`/scenario?sitemap`}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          View all {scenarios.length === maxResults ? "scenarios" : `${scenarios.length}+ scenarios`} for this calculator →
        </Link>
      </div>
    </div>
  );
}
