import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

interface BlogLink {
  slug: string;
  title: string;
}

interface RelatedArticlesProps {
  calculatorSlug: string;
  articles: BlogLink[];
  maxResults?: number;
}

/**
 * V2: Shows blog posts that directly support this calculator hub.
 * Replaces TryTheseScenarios which linked to noindexed scenario pages.
 */
export function RelatedArticles({
  calculatorSlug,
  articles,
  maxResults = 5,
}: RelatedArticlesProps) {
  if (!articles || articles.length === 0) return null;

  const display = articles.slice(0, maxResults);

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Related Guides & Articles
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            prefetch={true}
            className="group flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-150"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Learn more →
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
