"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calculator,
  TrendingUp,
  Home as HomeIcon,
  Briefcase,
  PiggyBank,
  FileText,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Download,
  Globe,
  Shield,
  Sparkles,
  ChevronRight,
  Layers,
  Percent,
  Landmark,
} from "lucide-react";
import { useLocale } from "./i18n-provider";
import { Footer } from "@/components/layout/footer";
import { getTranslation } from "@/lib/i18n";

const categories = [
  {
    slug: "loan",
    label: "Loan",
    desc: "Calculate payments, interest, and amortization for any type of loan",
    icon: Calculator,
    gradient: "from-blue-500 to-blue-600",
    count: 12,
  },
  {
    slug: "mortgage",
    label: "Mortgage",
    desc: "Compare rates, affordability, rent vs buy, and payoff strategies",
    icon: HomeIcon,
    gradient: "from-emerald-500 to-emerald-600",
    count: 10,
  },
  {
    slug: "investment",
    label: "Investment",
    desc: "Compound interest, portfolio allocation, ROI, CAPM, and more",
    icon: TrendingUp,
    gradient: "from-purple-500 to-purple-600",
    count: 15,
  },
  {
    slug: "retirement",
    label: "Retirement",
    desc: "Plan your future with 401(k), IRA, Social Security, and pension tools",
    icon: PiggyBank,
    gradient: "from-amber-500 to-amber-600",
    count: 8,
  },
  {
    slug: "tax",
    label: "Tax",
    desc: "Estimate income tax, capital gains, self-employment, and effective rates",
    icon: FileText,
    gradient: "from-red-500 to-red-600",
    count: 9,
  },
  {
    slug: "business",
    label: "Business",
    desc: "ROI, break-even, gross margin, DCF, CAC, LTV, and financial ratios",
    icon: Briefcase,
    gradient: "from-cyan-500 to-cyan-600",
    count: 10,
  },
  {
    slug: "basic",
    label: "Basic",
    desc: "Percentage, salary conversion, currency converter, unit converter, and more",
    icon: Percent,
    gradient: "from-sky-500 to-sky-600",
    count: 18,
  },
  {
    slug: "personal",
    label: "Personal Finance",
    desc: "Budget planning, net worth, savings goals, debt payoff, insurance needs",
    icon: Landmark,
    gradient: "from-rose-500 to-rose-600",
    count: 16,
  },
];

const quickCalcs = [
  { name: "Loan Calculator", href: "/calculators/loan-calculator", category: "Loan" },
  { name: "Compound Interest", href: "/calculators/compound-interest", category: "Investment" },
  { name: "Mortgage Calculator", href: "/calculators/mortgage-calculator", category: "Mortgage" },
  { name: "Retirement Planning", href: "/calculators/retirement-planning", category: "Retirement" },
  { name: "Tax Calculator", href: "/calculators/tax-calculator", category: "Tax" },
  { name: "Budget Planner", href: "/calculators/budget-planner", category: "Personal" },
  { name: "ROI Calculator", href: "/calculators/roi-calculator", category: "Business" },
  { name: "Amortization Schedule", href: "/calculators/amortization-schedule", category: "Loan" },
];

const perks = [
  { icon: Calculator, text: "124 Calculators", color: "text-primary-500" },
  { icon: Zap, text: "Instant Results", color: "text-amber-500" },
  { icon: BarChart3, text: "Interactive Charts", color: "text-blue-500" },
  { icon: Download, text: "Export PDF / Image", color: "text-emerald-500" },
  { icon: Globe, text: "English / Español / हिन्दी", color: "text-purple-500" },
  { icon: Shield, text: "100% Free, No Sign-Up", color: "text-green-500" },
];

const features = [
  {
    title: "124 Calculators & Growing",
    desc: "Professional-grade calculators for loans, mortgages, investments, retirement, taxes, business, and personal finance — all in one place.",
    icon: Calculator,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Interactive Charts & Tables",
    desc: "Visualize your financial data with dynamic charts — line graphs, bar charts, pie charts, and amortization tables that update in real time.",
    icon: BarChart3,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Export & Share Results",
    desc: "Download calculation results as high-resolution images or PDF documents. Share them with your advisor, family, or save for your records.",
    icon: Download,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Multi-Language Support",
    desc: "Use QFINHUB in English, Spanish, or Hindi with automatic language detection. More languages coming soon.",
    icon: Globe,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "AI Custom Calculator",
    desc: "Describe your scenario in plain language and our AI builds a custom calculator with inputs, charts, and a personalized financial plan — instantly.",
    icon: Sparkles,
    color: "from-accent-500 to-accent-600",
  },
  {
    title: "Privacy-First & Secure",
    desc: "Most calculators run entirely in your browser — your data never touches our servers. No trackers, no ads, no data selling. Ever.",
    icon: Shield,
    color: "from-cyan-500 to-cyan-600",
  },
];

const stats = [
  { value: "124+", label: "Calculators" },
  { value: "8", label: "Categories" },
  { value: "37", label: "Interactive Now" },
  { value: "3", label: "Languages" },
];

export default function Home() {
  const { locale } = useLocale();
  const t = (path: string) => getTranslation(locale, path);

  return (
    <div className="flex min-h-screen flex-col">
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
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/calculators"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              All Calculators
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" className="hidden sm:inline-flex">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 pb-20 pt-16 dark:from-surface-dark dark:via-surface-dark dark:to-primary-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_center_left,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              124 Financial Calculators — 100% Free, No Sign-Up Required
            </div>

            {/* Headline */}
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              Free Financial Calculators{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-400">
                for Everyone
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Fast, accurate calculators for loans, mortgages, investments,
              retirement, taxes, business, and personal finance. No account
              needed — start calculating in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/calculators">
                <Button
                  size="lg"
                  className="h-14 min-w-[240px] rounded-xl bg-primary-600 px-8 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-all hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Browse All 124 Calculators
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/calculators?cat=investment">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 min-w-[200px] rounded-xl border-gray-300 bg-white/80 px-8 text-base font-semibold text-gray-700 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Investment Calculators
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Perks bar */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {perks.map(({ icon: Icon, text, color }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-gray-400"
                >
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="border-b border-gray-100 bg-white px-4 py-16 dark:border-gray-800 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              All Calculator Categories
            </h2>
            <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
              Choose from 8 categories covering every major personal and
              business finance need. Each calculator is fast, accurate, and
              completely free.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/calculators?cat=${cat.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 dark:bg-surface-dark-elevated"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.gradient} text-white shadow-sm transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {cat.count} calcs
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {cat.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                    Browse {cat.label.toLowerCase()} calculators
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular Calculators Section ── */}
      <section className="bg-gray-50 px-4 py-16 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Most Used Calculators
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              Start with the tools people use most — all free, all instant.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickCalcs.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
              >
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    {calc.category}
                  </span>
                  <h3 className="mt-0.5 text-sm font-semibold text-gray-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                    {calc.name}
                  </h3>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/calculators">
              <Button
                variant="outline"
                className="rounded-xl border-gray-300 px-6 dark:border-gray-600"
              >
                View All 124 Calculators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Everything You Need in One Toolbox
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              Built for speed, accuracy, and ease of use — no finance degree
              required.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white shadow-sm`}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <CheckCircle2 className="mx-auto mb-6 h-12 w-12 text-accent-400" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Calculate?
          </h2>
          <p className="mb-3 text-lg text-gray-300">
            No sign-up required. Start using any calculator instantly — or
            create a free account to save your results.
          </p>
          <p className="mb-8 text-sm text-gray-400">
            100% free. No credit card. No hidden fees. Forever.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/calculators">
              <Button
                size="lg"
                className="h-14 min-w-[200px] rounded-xl bg-accent-600 px-8 text-base font-semibold text-white shadow-lg shadow-accent-600/25 hover:bg-accent-700 transition-all active:scale-[0.98]"
              >
                Start Calculating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calculators?cat=retirement">
              <Button
                size="lg"
                variant="outline"
                className="h-14 min-w-[200px] rounded-xl border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
              >
                Plan Your Retirement
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
