import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
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
  Star,
  Sparkles,
  Percent,
  Landmark,
  Search,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const categories = [
  {
    slug: "loan",
    label: "Loan",
    desc: "Calculate payments, interest, and amortization for any type of loan",
    icon: Calculator,
    gradient: "from-blue-500 to-blue-600",
    count: 12,
    useCase: "Plan your next car, personal, or student loan",
  },
  {
    slug: "mortgage",
    label: "Mortgage",
    desc: "Compare rates, affordability, rent vs buy, and payoff strategies",
    icon: HomeIcon,
    gradient: "from-emerald-500 to-emerald-600",
    count: 10,
    useCase: "Find out how much home you can afford",
  },
  {
    slug: "investment",
    label: "Investment",
    desc: "Compound interest, portfolio allocation, ROI, CAPM, and more",
    icon: TrendingUp,
    gradient: "from-purple-500 to-purple-600",
    count: 15,
    useCase: "Grow your money with smart investing",
  },
  {
    slug: "retirement",
    label: "Retirement",
    desc: "Plan your future with 401(k), IRA, Social Security, and pension tools",
    icon: PiggyBank,
    gradient: "from-amber-500 to-amber-600",
    count: 8,
    useCase: "Retire with confidence — know your number",
  },
  {
    slug: "tax",
    label: "Tax",
    desc: "Estimate income tax, capital gains, self-employment, and effective rates",
    icon: FileText,
    gradient: "from-red-500 to-red-600",
    count: 9,
    useCase: "Never be surprised at tax time again",
  },
  {
    slug: "business",
    label: "Business",
    desc: "ROI, break-even, gross margin, DCF, CAC, LTV, and financial ratios",
    icon: Briefcase,
    gradient: "from-cyan-500 to-cyan-600",
    count: 10,
    useCase: "Make data-driven business decisions",
  },
  {
    slug: "basic",
    label: "Basic",
    desc: "Percentage, salary conversion, currency converter, unit converter, and more",
    icon: Percent,
    gradient: "from-sky-500 to-sky-600",
    count: 18,
    useCase: "Everyday math, done in seconds",
  },
  {
    slug: "personal",
    label: "Personal Finance",
    desc: "Budget planning, net worth, savings goals, debt payoff, insurance needs",
    icon: Landmark,
    gradient: "from-rose-500 to-rose-600",
    count: 16,
    useCase: "Take control of your financial life",
  },
];

const quickCalcs = [
  { name: "Mortgage Calculator", href: "/calculators/mortgage-calculator", category: "Mortgage" },
  { name: "Mortgage Affordability", href: "/calculators/mortgage-affordability", category: "Mortgage" },
  { name: "Loan Calculator", href: "/calculators/loan-calculator", category: "Loan" },
  { name: "Compound Interest", href: "/calculators/compound-interest", category: "Investment" },
  { name: "Investment Return", href: "/calculators/investment-return", category: "Investment" },
  { name: "Retirement Planning", href: "/calculators/retirement-planning", category: "Retirement" },
  { name: "Tax Calculator", href: "/calculators/tax-calculator", category: "Tax" },
  { name: "Budget Planner", href: "/calculators/budget-planner", category: "Personal" },
  { name: "Debt Payoff", href: "/calculators/debt-payoff", category: "Personal" },
  { name: "Credit Card Payoff", href: "/calculators/credit-card-payoff", category: "Personal" },
  { name: "401k Calculator", href: "/calculators/401k-calculator", category: "Retirement" },
  { name: "Amortization Schedule", href: "/calculators/amortization-schedule", category: "Loan" },
];

const perks = [
  { icon: Calculator, text: "125 Live Calculators", color: "text-primary-500" },
  { icon: Zap, text: "Instant Results — No Wait", color: "text-amber-500" },
  { icon: BarChart3, text: "Interactive Charts on Every Tool", color: "text-blue-500" },
  { icon: Download, text: "Export as PDF or Image", color: "text-emerald-500" },
  { icon: Globe, text: "English · Español · हिन्दी", color: "text-purple-500" },
  { icon: Shield, text: "100% Free · No Sign-Up Needed", color: "text-green-500" },
];

const useCases = [
  {
    icon: HomeIcon,
    title: "Buying a Home?",
    desc: "Compare mortgage rates, calculate affordability, and see if renting or buying makes more financial sense — in under 30 seconds.",
    link: "/calculators?cat=mortgage",
    linkText: "Try Mortgage Tools",
  },
  {
    icon: TrendingUp,
    title: "Planning Investments?",
    desc: "See how compound interest grows your money. Optimize your portfolio allocation and calculate your expected returns.",
    link: "/calculators?cat=investment",
    linkText: "Explore Investment Tools",
  },
  {
    icon: PiggyBank,
    title: "Saving for Retirement?",
    desc: "Model your 401(k) growth, compare Roth vs Traditional IRA, estimate Social Security benefits, and plan your retirement income.",
    link: "/calculators?cat=retirement",
    linkText: "Plan Your Retirement",
  },
  {
    icon: FileText,
    title: "Filing Taxes?",
    desc: "Estimate your tax bill, calculate capital gains, find your effective tax rate, and plan for self-employment taxes.",
    link: "/calculators?cat=tax",
    linkText: "Tax Calculator Tools",
  },
];

const features = [
  {
    title: "124 Calculators — All Free",
    desc: "Professional-grade calculators for loans, mortgages, investments, retirement, taxes, business, and personal finance. Every single one is 100% free.",
    icon: Calculator,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Interactive Charts on Every Tool",
    desc: "Visualize your financial data with dynamic line graphs, bar charts, pie charts, and amortization tables that update instantly as you adjust inputs.",
    icon: BarChart3,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Export & Share Results",
    desc: "Download any calculation as a high-resolution image or PDF. Share with your financial advisor, family, or save for your records.",
    icon: Download,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Multi-Language Support",
    desc: "Use QFINHUB in English, Spanish, or Hindi with automatic language detection. We're adding more languages to make finance accessible to everyone.",
    icon: Globe,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "AI Custom Calculator",
    desc: "Describe what you need in plain language and our AI builds a custom calculator with inputs, charts, and a personalized financial plan — instantly.",
    icon: Sparkles,
    color: "from-accent-500 to-accent-600",
  },
  {
    title: "Privacy-First Design",
    desc: "Calculations run in your browser — your data never touches our servers unless you choose to save it. No trackers, no ads, no data selling.",
    icon: Shield,
    color: "from-cyan-500 to-cyan-600",
  },
];

const stats = [
  { value: "124", label: "Live Calculators", icon: Calculator },
  { value: "8", label: "Categories", icon: BarChart3 },
  { value: "Instant", label: "No Account Required", icon: Zap },
  { value: "100%", label: "Free — Always", icon: Shield },
];

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.qfinhub.com",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Global Search Bar ── */}
      <section className="border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-surface-dark">
        <div className="mx-auto max-w-3xl">
          <form action="/calculators" method="GET" className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                type="search"
                placeholder='Search all 124 calculators — "mortgage", "retirement", "compound interest"...'
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-500"
              />
            </div>
            <Button type="submit" className="h-11 shrink-0 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 pb-20 pt-16 dark:from-surface-dark dark:via-surface-dark dark:to-primary-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_center_left,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_center_right,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              <strong>125 Free Calculators</strong> — Instant, Accurate, No Sign-Up
            </div>

            {/* Headline with calculator emoji feel */}
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              Free Financial Calculators{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-400">
                for Real Life
              </span>
            </h1>

            {/* Subtitle — utility-focused, no marketing fluff */}
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Fast, accurate calculators for loans, mortgages, investments,
              retirement, taxes, business, and personal finance. No account
              needed. Just enter your numbers and get answers instantly.
            </p>

            {/* CTA Buttons — big, bold, action-oriented */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="min-h-[56px] w-full sm:w-auto rounded-xl bg-primary-600 px-8 text-base font-semibold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 active:scale-[0.98] touch-manipulation">
                <Link href="/calculators" prefetch={true}>
                  <Calculator className="mr-2 h-5 w-5" />
                  Browse All 125 Calculators
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[56px] w-full sm:w-auto rounded-xl border-gray-300 bg-white/80 px-8 text-base font-semibold text-gray-700 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                <Link href="/calculators?cat=mortgage" prefetch={true}>
                  <HomeIcon className="mr-2 h-5 w-5" />
                  Mortgage Calculators
                </Link>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                <Users className="h-3.5 w-3.5" />
                Used by thousands monthly
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                Featured in AI Overviews
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm dark:bg-purple-900/30 dark:text-purple-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                124 free tools, no account needed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm dark:bg-amber-900/30 dark:text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-500" />
                4.9 ★ — rated by users
              </span>
            </div>

            {/* Stats Row */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Icon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 md:text-3xl">
                        {stat.value}
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
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

      {/* ── Use Cases Section — "What are you here for?" ── */}
      <section className="border-b border-gray-100 bg-white px-4 py-16 dark:border-gray-800 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              What Are You Working On?
            </h2>
            <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
              Pick your goal below and we&apos;ll take you straight to the right tools.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <Link
                  key={uc.title}
                  href={uc.link}
                  prefetch={true}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-[transform,box-shadow] duration-200 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                    {uc.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {uc.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 transition-[gap] group-hover:gap-2 dark:text-primary-400">
                    {uc.linkText}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="border-b border-gray-100 bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              All Calculator Categories
            </h2>
            <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
              Choose from 8 categories covering every major personal and
              business finance need.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/calculators?cat=${cat.slug}`}
                  prefetch={true}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-[transform,box-shadow] duration-200 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.gradient} text-white shadow-sm transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {cat.count}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {cat.useCase}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular Calculators Section ── */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Most Used Calculators
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              Start with the tools people use most — enter your numbers, get
              answers instantly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickCalcs.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                prefetch={true}
                className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:border-primary-200 hover:shadow-md hover:scale-[1.01] dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700 dark:hover:shadow-lg"
              >
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    {calc.category}
                  </span>
                  <h3 className="mt-0.5 text-sm font-semibold text-gray-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                    {calc.name}
                  </h3>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="rounded-xl border-zinc-300 px-6 dark:border-zinc-600">
              <Link href="/calculators" prefetch={true}>
                View All 125 Calculators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-gray-50 px-4 py-16 dark:bg-surface-dark/50">
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
                className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:border-primary-200 hover:shadow-md hover:scale-[1.01] dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700 dark:hover:shadow-lg"
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

      {/* ── Top Calculators Section ── */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Top Financial Calculators
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              Our most popular tools — free, instant, no sign-up required.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Compound Interest", slug: "compound-interest", desc: "See how your money grows with compound returns over time", icon: "📈" },
              { name: "Mortgage Calculator", slug: "mortgage-calculator", desc: "Calculate monthly payments, total interest, and amortization", icon: "🏠" },
              { name: "Retirement Planning", slug: "retirement-planning", desc: "Plan your retirement with projections and withdrawal strategies", icon: "🏖️" },
              { name: "Loan Calculator", slug: "loan-calculator", desc: "Calculate payments for any loan type with full schedule", icon: "💰" },
              { name: "401(k) Calculator", slug: "401k-calculator", desc: "Estimate your 401(k) balance with employer match", icon: "🏦" },
              { name: "Tax Calculator", slug: "tax-calculator", desc: "Estimate your tax liability with marginal rate brackets", icon: "📋" },
              { name: "Debt Payoff", slug: "debt-payoff", desc: "Compare snowball vs avalanche strategies side by side", icon: "💳" },
              { name: "Budget Planner", slug: "budget-planner", desc: "Create a 50/30/20 budget in seconds", icon: "📊" },
              { name: "Investment Return", slug: "investment-return", desc: "Calculate CAGR, absolute return, and annualized performance", icon: "📉" },
              { name: "ROI Calculator", slug: "roi-calculator", desc: "Measure return on investment for any project", icon: "🎯" },
              { name: "FIRE Calculator", slug: "early-retirement", desc: "Calculate your path to financial independence", icon: "🔥" },
              { name: "APR Calculator", slug: "apr-calculator", desc: "Compare loan offers with true annual percentage rate", icon: "💵" },
            ].map((calc) => (
              <Link
                key={calc.slug}
                href={`/calculators/${calc.slug}`}
                prefetch={true}
                className="group flex flex-col gap-2 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:bg-white dark:hover:bg-zinc-800/80 transition-all duration-150"
              >
                <span className="text-2xl">{calc.icon}</span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {calc.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {calc.desc}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="rounded-xl border-zinc-300 px-6 dark:border-zinc-600">
              <Link href="/calculators" prefetch={true}>
                View All 125 Calculators <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Calculator className="h-8 w-8 text-accent-400" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            Start Using 125 Free Calculators
          </h2>
          <p className="mb-3 text-lg text-gray-300">
            No sign-up. No credit card. No limits. Just fast, accurate
            financial tools — free for everyone, forever.
          </p>
          <p className="mb-8 flex items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-400" /> Instant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-400" /> Accurate
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-400" /> Free
            </span>
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 min-w-[220px] rounded-xl bg-accent-600 px-8 text-base font-semibold text-white shadow-lg shadow-accent-600/25 hover:bg-accent-700 active:scale-[0.98] touch-manipulation">
              <Link href="/calculators" prefetch={true}>
                <Calculator className="mr-2 h-5 w-5" />
                Find Your Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 min-w-[180px] rounded-xl border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30">
              <Link href="/about" prefetch={true}>
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}