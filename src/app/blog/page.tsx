import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts, type BlogPost } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Financial Guides, Calculator Tutorials & Personal Finance Tips",
  description:
    "Practical financial tips, calculator guides, and personal finance insights — written for real people, not experts. Covers mortgages, loans, investing, retirement, taxes, and more.",
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

// Phase 39.4: These slugs redirect to other pages — don't show in blog index
const REDIRECTED_SLUGS = new Set([
  // Thin posts (<500w)
  "retire-by-40-calculator-how-much-needed",
  "monthly-mortgage-payment-formula-tax-insurance",
  "200k-mortgage-payment-30-years",
  "how-much-mortgage-afford-100k-salary",
  "20000-loan-5-years-8-percent-monthly-payment",
  "investment-calculator-withdrawals",
  "treasury-selloff-hits-mortgages-how-to-protect-your-home-loan-plans",
  "housing-affordability-breakthrough-how-new-policies-could-make-homeownership-acc",
  "stablecoin-regulation-and-your-mortgage-what-the-genius-act-means-for-homebuyers",
  "investing-cybersecurity-stocks-are-surging-one-looks-promising-into-earnings",
  // NJ month-year posts
  "fed-minutes-march-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
  "fed-minutes-april-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
  "mortgage-rates-june-2026-current-rates-home-affordability-calculator",
  // 301-redirected Fed news-jacking posts (Phase 39.5 / Jul 12 cleanup)
  "fed-holds-rates-steady-what-the-fomc-statement-means-for-your-mortgage-in-2025",
  "kevin-warsh-fed-rate-decision-how-rising-rates-impact-your-mortgage-affordabilit",
  "fed-rate-hike-ahead-how-rising-inflation-impacts-your-mortgage-and-savings",
  "fed-rate-hike-in-july-2025-how-bond-vigilantes-could-impact-your-mortgage-and-sa",
  "fed-rate-hike-odds-rising-by-july-2027-how-to-protect-your-mortgage-and-savings-",
  "fed-s-rising-inflation-forecast-how-to-protect-your-mortgage-and-savings",
  "usd-surge-fed-policy-how-to-protect-your-mortgage-affordability-in-2025",
  "kevin-warsh-sworn-in-as-fed-chair-what-it-means-for-your-mortgage-and-personal-f",
  "fed-s-new-payment-account-proposal-what-it-means-for-your-mortgage-and-savings",
  "morgan-stanley-bank-exemption-your-mortgage-what-the-fed-s-23a-ruling-means-for-",
  "stephen-m-calk-2025-trust-fed-approval-what-it-means-for-your-mortgage-and-savin",
  "fed-approves-united-texas-bank-conversion-what-it-means-for-your-mortgage-and-sa",
  "federal-reserve-operations-update-how-waller-s-speech-impacts-your-mortgage-affo",
  "fed-s-jefferson-speech-how-economic-outlook-energy-effects-impact-your-mortgage-",
  "stephen-miran-exits-the-fed-how-his-policies-could-impact-your-mortgage-affordab",
  "fed-2025-report-how-household-economic-well-being-impacts-your-mortgage-and-savi",
  "how-the-fed-s-modernization-plans-could-impact-your-mortgage-and-savings-goals",
  "what-the-fed-s-termination-of-enforcement-actions-means-for-your-mortgage-afford",
  "what-the-fed-s-enforcement-action-against-a-former-bank-employee-means-for-your-",
  "what-the-fed-s-enforcement-action-against-community-bankshares-means-for-your-mo",
  "fed-ends-enforcement-actions-against-major-banks-what-it-means-for-your-mortgage",
  "fed-enforcement-action-at-united-bank-what-it-means-for-your-mortgage-and-person",
  "fed-ends-enforcement-on-ubs-credit-suisse-what-it-means-for-your-mortgage-and-sa",
  "federal-reserve-enforcement-action-against-commerce-bank-what-it-means-for-your-",
  "what-the-fed-s-bank-employee-enforcement-actions-mean-for-your-mortgage-and-mone",
  "fed-discount-window-survey-what-it-means-for-your-mortgage-and-savings",
  "fed-approves-burke-herbert-bank-merger-what-it-means-for-your-mortgage-and-savin",
  "what-the-fed-s-approval-of-banco-de-credito-del-peru-means-for-your-mortgage-and",
  "fed-board-resignation-shakes-markets-how-to-protect-your-mortgage-affordability-",
  "fed-chair-change-how-powell-s-pro-tempore-role-and-warsh-s-appointment-could-imp",
  "bowman-s-fed-speech-on-banking-future-what-it-means-for-your-mortgage-and-saving",
  "blackrock-s-saigal-sees-fed-rate-cut-ahead-what-it-means-for-your-mortgage-and-s",
  "stock-market-week-ahead-nvidia-alphabet-earnings-atlanta-fed-how-to-protect-your",
  "rising-bond-yields-and-stock-market-drop-how-fed-hike-anxiety-impacts-your-mortg",
  "ecb-rate-hike-2025-how-a-modest-increase-affects-your-mortgage-and-savings",
  "ecb-rate-hike-impact-on-mortgages-how-to-protect-your-finances",
]);

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
      className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:border-primary-200 dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700 dark:hover:shadow-lg"
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

      {/* ── Featured Topics ── */}
      <section className="bg-gray-50 dark:bg-zinc-900/50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Featured Topics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/blog/fed-and-your-mortgage",
                title: "Fed & Mortgage",
                desc: "How Federal Reserve policy shapes mortgage rates and your home loan",
                icon: "🏠",
              },
              {
                href: "/blog/fomc-rate-decisions-explained",
                title: "FOMC Decisions",
                desc: "How the Fed's interest rate decisions affect your finances",
                icon: "📊",
              },
              {
                href: "/blog/fed-enforcement-actions",
                title: "Fed Enforcement",
                desc: "How the Fed's bank enforcement actions protect consumers",
                icon: "⚖️",
              },
              {
                href: "/blog/fed-personnel-and-policy",
                title: "Fed Leadership",
                desc: "Key Fed officials, speeches, and how they shape policy",
                icon: "👔",
              },
              {
                href: "/blog/fed-and-your-savings-investments",
                title: "Fed & Savings",
                desc: "How Fed policy affects your savings, CDs, and investment returns",
                icon: "💰",
              },
              {
                href: "/blog/fed-bank-mergers-approvals",
                title: "Bank Mergers",
                desc: "How the Fed approves or rejects major bank mergers",
                icon: "🏦",
              },
              {
                href: "/blog/fed-stock-market-and-bonds",
                title: "Fed & Markets",
                desc: "How Fed actions move stock and bond markets",
                icon: "📈",
              },
              {
                href: "/blog/global-central-banks",
                title: "Global Central Banks",
                desc: "ECB, BOE, BOJ and how their policies ripple to your finances",
                icon: "🌍",
              },
            ].map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-primary-200 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="mb-2 block text-2xl">{topic.icon}</span>
                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {topic.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {topic.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog Posts ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Articles</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
              {blogPosts.filter((p) => !REDIRECTED_SLUGS.has(p.slug)).length} articles
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {blogPosts
              .filter((post) => !REDIRECTED_SLUGS.has(post.slug))
              .map((post) => (
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
            Browse All 125 Calculators
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
