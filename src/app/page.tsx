"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLocale } from "./i18n-provider";
import { getTranslation } from "@/lib/i18n";

export default function Home() {
  const { locale } = useLocale();

  const t = (path: string) => getTranslation(locale, path);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
            AI-Powered Financial Intelligence
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {t("hero.title").split("Finance Toolkit")[0]}
            <span className="bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
              Finance Toolkit
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300 sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/calculators">
              <Button
                size="lg"
                className="h-14 min-w-[200px] rounded-xl bg-accent-600 px-8 text-base font-semibold text-white shadow-lg shadow-accent-600/30 hover:bg-accent-700"
              >
                {t("hero.cta")}
              </Button>
            </Link>
            <Link href="/ai-specialist">
              <Button
                size="lg"
                variant="outline"
                className="h-14 min-w-[200px] rounded-xl border-gray-600 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10"
              >
                {t("hero.ctaAlt")}
              </Button>
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "60+", label: t("features.calculators").replace(/60\+ /, "") },
              { value: "AI", label: "Custom Plans" },
              { value: "3", label: "Languages" },
              { value: "100%", label: "Free" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-700/50 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-accent-400 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-20 dark:bg-surface-dark">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Everything You Need for Financial Analysis
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-gray-500 dark:text-gray-400">
            {t("hero.subtitle")}
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated dark:hover:border-primary-700"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Start Your Financial Journey
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Create custom financial plans with AI, explore 60+ calculators, and
            make smarter financial decisions.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="h-14 min-w-[200px] rounded-xl bg-accent-600 px-8 text-base font-semibold text-white shadow-lg shadow-accent-600/30 hover:bg-accent-700"
            >
              {t("auth.signUp")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 dark:border-gray-700 dark:bg-surface-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary-600 to-accent-600" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              QFINHUB
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    titleKey: "features.calculators",
    descKey: "features.calculatorsDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
        />
      </svg>
    ),
  },
  {
    titleKey: "features.ai",
    descKey: "features.aiDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
  },
  {
    titleKey: "features.dashboard",
    descKey: "features.dashboardDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
    ),
  },
  {
    titleKey: "features.languages",
    descKey: "features.languagesDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.78.173 2.653.334 1.078.193 2.12.456 3.123.78m0 0l-3.683 2.873M21 5.25v3"
        />
      </svg>
    ),
  },
  {
    titleKey: "features.widgets",
    descKey: "features.widgetsDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
  },
  {
    titleKey: "features.design",
    descKey: "features.designDesc",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
];
