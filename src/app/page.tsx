"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calculator, TrendingUp, Home as HomeIcon, Briefcase, PiggyBank, FileText, ArrowRight, CheckCircle2, Zap, BarChart3, Download, Globe, Shield } from "lucide-react";
import { useLocale } from "./i18n-provider";
import { Footer } from "@/components/layout/footer";
import { getTranslation } from "@/lib/i18n";

const categories = [
  { slug: "loan", labelKey: "hero.categoryLoan", icon: Calculator, color: "from-blue-500 to-blue-600", count: 12 },
  { slug: "mortgage", labelKey: "hero.categoryMortgage", icon: HomeIcon, color: "from-emerald-500 to-emerald-600", count: 10 },
  { slug: "investment", labelKey: "hero.categoryInvestment", icon: TrendingUp, color: "from-purple-500 to-purple-600", count: 15 },
  { slug: "retirement", labelKey: "hero.categoryRetirement", icon: PiggyBank, color: "from-amber-500 to-amber-600", count: 8 },
  { slug: "tax", labelKey: "hero.categoryTax", icon: FileText, color: "from-red-500 to-red-600", count: 9 },
  { slug: "personal", labelKey: "hero.categoryPersonal", icon: Briefcase, color: "from-cyan-500 to-cyan-600", count: 16 },
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
  { icon: Zap, text: "Instant calculations", color: "text-amber-500" },
  { icon: BarChart3, text: "Interactive charts", color: "text-blue-500" },
  { icon: Download, text: "Export as PDF / Image", color: "text-emerald-500" },
  { icon: Globe, text: "3 languages supported", color: "text-purple-500" },
  { icon: Shield, text: "100% free, no hidden fees", color: "text-green-500" },
];

export default function Home() {
  const { locale } = useLocale();

  const t = (path: string) => getTranslation(locale, path);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 pb-20 pt-16 dark:from-surface-dark dark:via-surface-dark dark:to-primary-950/20">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_center_left,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              {t("homepage.badge")} &mdash; {t("homepage.trusted")}
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/calculators">
                <Button
                  size="lg"
                  className="h-14 min-w-[220px] rounded-xl bg-primary-600 px-8 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-all hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/calculators?category=investment">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 min-w-[220px] rounded-xl border-gray-300 bg-white/80 px-8 text-base font-semibold text-gray-700 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Investment Calculators
                </Button>
              </Link>
            </div>

            {/* Perks bar */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {perks.map(({ icon: Icon, text, color }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-gray-400"
                >
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Category Grid ── */}
          <div className="mt-16">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("hero.categories")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map(({ slug, labelKey, icon: Icon, color, count }) => (
                <Link
                  key={slug}
                  href={`/calculators?category=${slug}`}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 dark:bg-surface-dark-elevated"
                >
                  <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t(labelKey)}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">{count} calculators</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Calculators Section ── */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              {t("homepage.popularCalcs")}
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              {t("homepage.sectionTitle")}
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
                {t("homepage.viewAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-gray-50 px-4 py-16 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              {t("homepage.sectionTitle")}
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              Built for speed, accuracy, and ease of use.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
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
            {t("homepage.ctaTitle")}
          </h2>
          <p className="mb-3 text-lg text-gray-300">
            {t("homepage.ctaDesc")}
          </p>
          <p className="mb-8 text-sm text-gray-400">
            {t("homepage.noSignup")}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/calculators">
              <Button
                size="lg"
                className="h-14 min-w-[200px] rounded-xl bg-accent-600 px-8 text-base font-semibold text-white shadow-lg shadow-accent-600/25 hover:bg-accent-700 transition-all active:scale-[0.98]"
              >
                {t("homepage.ctaButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calculators">
              <Button
                size="lg"
                variant="outline"
                className="h-14 min-w-[200px] rounded-xl border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
              >
                {t("homepage.ctaSecondary")}
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

const features = [
  {
    title: "124 Calculators & Growing",
    desc: "Comprehensive calculators for loans, mortgages, investments, retirement, taxes, bonds, options, and more.",
    icon: Calculator,
  },
  {
    title: "AI Custom Calculator",
    desc: "Describe your needs in plain language and get a custom, editable calculator generated instantly.",
    icon: TrendingUp,
  },
  {
    title: "Save & Track Results",
    desc: "Save your custom calculators and financial plans to access from your personal dashboard anytime.",
    icon: BarChart3,
  },
  {
    title: "Multi-Language Support",
    desc: "Use QFINHUB in English, Spanish, or Hindi with automatic language detection.",
    icon: Globe,
  },
  {
    title: "Share & Export",
    desc: "Share results as images or PDFs. Embed any calculator on your own website.",
    icon: Download,
  },
  {
    title: "Clean & Fast Design",
    desc: "Lightweight, responsive design that works perfectly on mobile, tablet, or desktop.",
    icon: Zap,
  },
];
