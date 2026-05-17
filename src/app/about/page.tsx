import Link from "next/link";
import type { Metadata } from "next";
import { Calculator, Sparkles, Globe, Download, Shield, BarChart3, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Free Financial Calculators for Everyone",
  description:
    "QFINHUB is a free financial tools platform with 124 calculators for loans, mortgages, investments, retirement, taxes, and personal finance. Built for accuracy, privacy, and accessibility — 100% free, no sign-up required.",
  openGraph: {
    title: "About QFINHUB | 124 Free Financial Calculators",
    description:
      "Learn about QFINHUB — a completely free platform with 124 professional financial calculators, AI-powered analysis, multi-language support, and privacy-first design.",
  },
};

const milestones = [
  { number: "124+", label: "Financial Calculators", icon: Calculator },
  { number: "8", label: "Categories Covered", icon: BarChart3 },
  { number: "33", label: "Languages Supported", icon: Globe },
  { number: "100%", label: "Free — Always", icon: Shield },
];

const values = [
  {
    title: "Accuracy First",
    desc: "Every calculator is built on sound mathematical and financial principles. We rigorously test our formulas to ensure reliable, accurate results you can trust.",
    icon: CheckCircle2,
  },
  {
    title: "Truly Free",
    desc: "No hidden fees, no premium tiers, no credit card required. Every calculator, every feature — including our AI Specialist — is completely free to use.",
    icon: Shield,
  },
  {
    title: "Privacy Respecting",
    desc: "Your financial data stays yours. Calculations happen in your browser; nothing is tracked or sold. We use minimal, essential cookies only.",
    icon: Sparkles,
  },
  {
    title: "Built for Everyone",
    desc: "Whether you're planning a budget, comparing mortgage rates, or mapping out retirement — QFINHUB meets you where you are with clear, actionable tools.",
    icon: Globe,
  },
];

const stats = [
  { value: "124+", label: "Calculators Live" },
  { value: "33", label: "Languages" },
  { value: "1,430+", label: "SEO Pages Indexed" },
  { value: "100%", label: "Free Forever" },
];

export default function AboutPage() {
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
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/calculators"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Calculators
            </Link>
            <Link
              href="/ai-specialist"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-1 text-white shadow-sm">
                AI Specialist
              </span>
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-400/10 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            About Us
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Free Financial Tools for{" "}
            <span className="bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
              Everyone
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300">
            QFINHUB is a completely free platform built to make financial
            calculations fast, accurate, and accessible to everyone — from
            students learning personal finance to professionals planning
            complex investments.
          </p>
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Our Mission
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            We believe that understanding your finances should not require a
            degree in economics or a subscription to expensive software. Our
            mission is to provide everyone — regardless of background or budget
            — with professional-grade financial tools that deliver accurate
            results in seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-surface-dark-elevated dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-accent-500" />
              124 calculators and growing
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-surface-dark-elevated dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-accent-500" />
              AI-powered custom analysis
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-surface-dark-elevated dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-accent-500" />
              100% free, no sign-up required
            </span>
          </div>
        </div>
      </section>

      {/* ── What We Offer ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              What We Offer
            </h2>
            <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
              A complete financial toolkit designed for real people making real
              decisions.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                124 Financial Calculators
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                From loan amortization and compound interest to retirement
                planning and tax estimation — our calculators cover every
                major personal finance category. Each tool is built with
                accurate formulas, interactive charts, and clear result
                breakdowns.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Loans
                </span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Mortgages
                </span>
                <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Investments
                </span>
                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Retirement
                </span>
                <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Taxes
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                AI Custom Specialist
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Describe your financial scenario in plain language — "Calculate
                my retirement savings with 7% growth over 30 years" — and our
                AI builds a custom calculator with inputs, charts, and a
                personalized financial plan on the spot.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                  Natural language input
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                  Interactive charts & tables
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                  Save, edit, and reuse
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Multi-Language & Accessible
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                QFINHUB is available in English, Spanish, and Hindi — with
                more languages coming soon. Our responsive design works on
                any device, and we follow accessibility best practices so
                everyone can use our tools.
              </p>
              <div className="mt-4 flex gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🇺🇸 English</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🇪🇸 Español</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🇮🇳 हिन्दी</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                <Download className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Export & Share Results
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Download your calculation results as high-resolution images or
                PDF documents. Share them with your financial advisor, family
                members, or save them for your records.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard & Saved Plans
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Create a free account to save your AI-generated plans and
                calculator results. Access them anytime from your personal
                dashboard — no more re-entering numbers.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-accent-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-accent-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Privacy-First Design
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Most calculators run entirely in your browser — your financial
                data never touches our servers unless you choose to save it.
                We use no advertising trackers and never sell your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            QFINHUB by the Numbers
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-accent-400 md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose QFINHUB ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Why Choose QFINHUB?
          </h2>
          <div className="space-y-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark-elevated"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <value.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {value.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── E-E-A-T Author Section ── */}
      <section className="border-t border-gray-200 bg-white px-4 py-20 dark:border-gray-800 dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              About the Founder
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
              QFINHUB was created by a financial professional with years of
              experience in personal finance, data analysis, and technology.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Author Avatar */}
            <div className="shrink-0">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-5xl text-white shadow-lg md:h-40 md:w-40">
                QM
              </div>
            </div>

            {/* Author Bio */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Qasem Mohammed
              </h3>
              <p className="text-sm text-accent-600 dark:text-accent-400">
                Founder &amp; Lead Developer
              </p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                <p>
                  Qasem is the creator of QFINHUB, a platform built from the
                  ground up to provide free, accurate financial tools for
                  everyone. With expertise spanning financial modeling,
                  data analysis, and full-stack development, he designed every
                  calculator on this site to reflect real-world financial
                  formulas and methodologies.
                </p>
                <p>
                  Before launching QFINHUB, Qasem spent years working with
                  financial data — building analysis tools, developing
                  algorithmic models, and helping individuals understand their
                  personal finances through clear, accessible data. He
                  believes that financial literacy should not require expensive
                  software or a finance degree.
                </p>
                <p>
                  Qasem personally oversees the accuracy of every calculator,
                  reviews all AI-generated content for quality, and ensures
                  that QFINHUB remains 100% free — no hidden fees, no premium
                  tiers, ever.
                </p>
              </div>

              {/* Credentials */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  ✓ Financial Modeling
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  ✓ Data Analysis
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                  ✓ Full-Stack Development
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  ✓ SEO &amp; Content Strategy
                </span>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-700 dark:bg-surface-dark-elevated">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                124+
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Manual Accuracy Checks
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-700 dark:bg-surface-dark-elevated">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                1,600+
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pages Indexed by Google
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-700 dark:bg-surface-dark-elevated">
              <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                100%
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Free &amp; Transparent
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gray-50 px-4 py-20 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Start Using QFINHUB Today
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-500 dark:text-gray-400">
            No sign-up, no credit card, no hidden fees. Just fast, accurate
            financial tools — free for everyone, forever.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/calculators"
              className="inline-flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
            >
              <Calculator className="h-5 w-5" />
              Explore All Calculators
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-8 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Get In Touch
            </Link>
          </div>
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
              <Link
                href="/contact"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Contact Us
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
