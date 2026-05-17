import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* Simple Nav */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/qfinhub-logo.svg"
              alt="QFINHUB"
              className="h-8 w-auto"
              width={144}
              height={32}
            />
          </Link>
          <Link
            href="/calculators"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Calculators
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="mb-6 text-8xl font-bold tracking-tight text-primary-200 dark:text-primary-900">
            404
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Go Home
            </Link>
            <Link
              href="/calculators"
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
            >
              Browse Calculators
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <Link href="/about" className="hover:text-gray-600 dark:hover:text-gray-300">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-gray-600 dark:hover:text-gray-300">
              Contact
            </Link>
            <Link href="/blog" className="hover:text-gray-600 dark:hover:text-gray-300">
              Blog
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
