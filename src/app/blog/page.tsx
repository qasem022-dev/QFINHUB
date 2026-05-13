import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts, type BlogPost } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical financial tips, calculator guides, and personal finance insights from QFINHUB. Learn about mortgages, loans, investing, retirement, taxes, and more.",
  openGraph: {
    title: "Blog | QFINHUB",
    description:
      "Practical financial tips, calculator guides, and personal finance insights — written for real people, not experts.",
    images: ["/og-image.png"],
    url: "https://www.qfinhub.com/blog",
  },
  alternates: {
    canonical: "https://www.qfinhub.com/blog",
  },
};

const categoryLabels: Record<BlogPost["category"], string> = {
  mortgage: "Mortgage",
  loan: "Loans",
  investment: "Investing",
  retirement: "Retirement",
  tax: "Tax",
  personal: "Personal Finance",
};

const categoryColors: Record<BlogPost["category"], string> = {
  mortgage: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  loan: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  investment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  retirement: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  tax: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  personal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-200 dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
            categoryColors[post.category]
          )}
        >
          <Tag className="h-3 w-3" />
          {categoryLabels[post.category]}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          {formatDate(post.publishedAt)}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {post.readingTime} min read
        </span>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
        {post.title}
      </h2>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {post.description}
      </p>

      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
        Read Article
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function BlogPage() {
  const categories: BlogPost["category"][] = [
    "mortgage",
    "loan",
    "investment",
    "retirement",
    "tax",
    "personal",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* ── Navbar ── */}
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
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              Calculators
            </Link>
            <Link
              href="/about"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              About
            </Link>
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            Financial Insights
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

      {/* ── Blog Posts ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Related Calculators Section ── */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 dark:border-gray-700 dark:bg-surface-dark-elevated">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Try the Calculators Behind the Articles
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Each blog post is built around real financial math. Use our free
            calculators to apply these principles to your own situation.
          </p>
          <Link
            href="/calculators"
            className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.98]"
          >
            Browse All 124 Calculators
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
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
                href="/calculators"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Calculators
              </Link>
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
