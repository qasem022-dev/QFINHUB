import Link from "next/link";

/**
 * Last Reviewed By — E-E-A-T trust signal for Google.
 * Shows: "Last reviewed by Qasem Mohammed — [date]" 
 * with link to editorial policy.
 * 
 * Renders on every calculator page, scenario page, and blog post.
 */

interface LastReviewedProps {
  date?: string; // ISO date string, defaults to today
  className?: string;
}

export function LastReviewedBy({ date, className = "" }: LastReviewedProps) {
  const reviewDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div
      className={`mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Author initials avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
            QM
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Last reviewed by{" "}
              <Link
                href="/about"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Qasem Mohammed
              </Link>
            </strong>
            {" — "}
            <span className="text-gray-500 dark:text-gray-400">
              {reviewDate}
            </span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            AI & Software Engineer, Founder & Lead Developer at QFINHUB{" "}
            <span className="mx-1">·</span>{" "}
            <Link
              href="/editorial-policy"
              className="hover:underline"
            >
              Editorial Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
