import Link from "next/link";

/**
 * YMYL (Your Money or Your Life) Disclaimer
 *
 * Google requires YMYL pages (financial, health, legal) to have clear disclaimers
 * stating the content is for informational purposes only and not professional advice.
 * This component renders the disclaimer for calculator pages.
 */
export function YMYLDisclaimer() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Important Disclaimer — Not Financial Advice
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              The results from this calculator are for informational and educational purposes only.
              They are not a guarantee of actual outcomes and should not be considered financial,
              investment, tax, or legal advice. Always consult a qualified professional for advice
              tailored to your specific financial situation. See our{" "}
              <Link
                href="/terms"
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
              >
                Privacy Policy
              </Link>{" "}
              for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
