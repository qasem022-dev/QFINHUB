import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, ArrowRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "QFINHUB Blog — Financial tips, calculator guides, and personal finance insights coming soon. Stay tuned for practical advice.",
  openGraph: {
    title: "Blog | QFINHUB",
    description:
      "Financial tips, calculator guides, and personal finance insights — coming soon.",
  },
};

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-surface-dark/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/qfinhub-logo.svg"
              alt="QFINHUB"
              className="h-8 w-auto"
              width={144}
              height={32}
            />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/calculators"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Calculators
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            Coming Soon
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            QFINHUB Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300">
            Practical financial tips, calculator guides, and personal finance
            insights — written for real people, not experts.
          </p>
        </div>
      </section>

      {/* Coming Soon Content */}
      <section className="flex-1 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
            <Newspaper className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            We&apos;re Writing Something Great
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-500 dark:text-gray-400">
            Our blog is in the works. We&apos;re preparing practical articles
            on loan strategies, investment basics, retirement planning tips,
            tax optimization, and guides for getting the most out of every
            QFINHUB calculator.
          </p>
          <p className="mb-8 text-sm text-gray-400 dark:text-gray-500">
            In the meantime, explore our calculators or reach out with topics
            you&apos;d like us to cover.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/calculators"
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Browse 124 Calculators
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-6 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <Mail className="h-4 w-4" />
              Suggest a Topic
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/qfinhub-logo.svg"
                alt="QFINHUB"
                className="h-7 w-auto"
                width={126}
                height={28}
              />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/about"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
