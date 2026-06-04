import Link from "next/link";
import type { Metadata } from "next";
import { allCalculators } from "@/lib/calculators";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Financial Calculator Guides — How to Use Every Calculator",
  description:
    "Step-by-step guides for all 125 QFINHUB financial calculators. Learn how to use mortgage, investment, retirement, tax, and loan calculators in 30 seconds or less.",
  alternates: { canonical: "https://www.qfinhub.com/guides" },
  robots: { index: true, follow: true },
};

export default function GuidesHubPage() {
  const categories = [...new Set(allCalculators.map((c) => c.category))];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Free Financial Calculator Guides
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Step-by-step instructions for every QFINHUB calculator. Learn how to use each tool in 30 seconds — with examples, formulas, and pro tips.
        </p>
      </div>

      <div className="grid gap-8">
        {categories.map((category) => {
          const calcs = allCalculators.filter((c) => c.category === category);
          return (
            <section key={category}>
              <h2 className="mb-4 text-xl font-semibold capitalize text-gray-900 dark:text-white">
                {category} Guides
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {calcs.map((calc) => (
                  <Link
                    key={calc.slug}
                    href={`/guides/how-to-use-${calc.slug}`}
                    prefetch={true}
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{calc.icon || "📘"}</span>
                      <span className="text-sm font-medium text-gray-900 truncate dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                        How to Use {calc.title}
                      </span>
                    </div>
                    <BookOpen className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-primary-600" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-zinc-200 bg-gray-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Need a calculator instead?
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Browse all 125 free financial calculators — no sign-up required.
        </p>
        <Link
          href="/calculators"
          prefetch={true}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700"
        >
          Browse All Calculators <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
