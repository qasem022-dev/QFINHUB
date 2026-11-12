import type { Metadata } from "next";
import DemoCalculator from "./demo-calculator";

export const metadata: Metadata = {
  title: "Mortgage calculator — preview",
  description: "A live sample mortgage calculator prepared for your site.",
  // Preview pages are per-prospect and must never be indexed or crawled.
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<{ co?: string; ref?: string }>;

/** Strip anything that is not a plain brand name or hostname. */
function clean(value: string | undefined, fallback: string, max = 60): string {
  if (!value) return fallback;
  const stripped = value.replace(/[<>"'`\\]/g, "").trim().slice(0, max);
  return stripped || fallback;
}

export default async function DemoPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const brand = clean(sp.co, "your company");
  const domain = clean(sp.ref, "your site").replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-2 border-b border-gray-200 pb-6 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
              Prepared for {brand}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Mortgage calculator
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A live sample for {domain} — fully working, not a screenshot.
            </p>
          </div>
          <a
            href="https://www.qfinhub.com/services"
            className="text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400"
          >
            Built by QFINHUB
          </a>
        </header>

        <DemoCalculator brand={brand} domain={domain} />

        <footer className="mt-10 rounded-2xl bg-gray-900 p-8 text-center dark:bg-gray-800">
          <p className="text-lg font-semibold text-white">
            Want this live on {domain}?
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-300">
            Reply to the email this link came from. Your branding, your rates, and the
            lead form wired to your CRM — inside 72 hours.
          </p>
        </footer>
      </div>
    </div>
  );
}
