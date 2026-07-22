import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, AlertTriangle, ChevronRight, Scale, Home as HomeIcon, DollarSign, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllHowToGuides, generateGuideMetaTitle, generateGuideMetaDescription } from "@/lib/programmatic-seo/guides";
import { getAllMortgageByIncomeGuides } from "@/lib/programmatic-seo/mortgage-by-income";
import { getAllInvestmentMethodGuides } from "@/lib/programmatic-seo/investment-methods";
import { CalculatorGuideLinks } from "@/components/calculators/calculator-guide-links";
import { CALCULATOR_DECISION_LINKS } from "@/lib/calculator-decision-links";
import type { Metadata } from "next";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

type ResolvedGuide =
  | { kind: "how-to"; data: ReturnType<typeof getAllHowToGuides>[number] }
  | { kind: "mortgage-by-income"; data: ReturnType<typeof getAllMortgageByIncomeGuides>[number] }
  | { kind: "investment-method"; data: ReturnType<typeof getAllInvestmentMethodGuides>[number] };

function resolveGuide(slug: string): ResolvedGuide | undefined {
  const howTo = getAllHowToGuides().find((g) => g.slug === slug);
  if (howTo) return { kind: "how-to", data: howTo };
  const byIncome = getAllMortgageByIncomeGuides().find((g) => g.slug === slug);
  if (byIncome) return { kind: "mortgage-by-income", data: byIncome };
  const invMethod = getAllInvestmentMethodGuides().find((g) => g.slug === slug);
  if (invMethod) return { kind: "investment-method", data: invMethod };
  return undefined;
}

export function generateStaticParams() {
  const howTo = getAllHowToGuides().map((g) => ({ slug: g.slug }));
  const byIncome = getAllMortgageByIncomeGuides().map((g) => ({ slug: g.slug }));
  const invMethod = getAllInvestmentMethodGuides().map((g) => ({ slug: g.slug }));
  return [...howTo, ...byIncome, ...invMethod];
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveGuide(slug);
  if (!resolved) return { title: "Not Found" };

  const canonicalUrl = `https://www.qfinhub.com/guides/${slug}`;
  const title = resolved.kind === "how-to"
    ? generateGuideMetaTitle(resolved.data.title)
    : resolved.data.title;
  const description = resolved.kind === "how-to"
    ? generateGuideMetaDescription(resolved.data.title)
    : resolved.data.description;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const resolved = resolveGuide(slug);
  if (!resolved) notFound();

  const canonicalUrl = `https://www.qfinhub.com/guides/${slug}`;

  if (resolved.kind === "mortgage-by-income") {
    return <MortgageByIncomeView guide={resolved.data} canonicalUrl={canonicalUrl} />;
  }

  if (resolved.kind === "investment-method") {
    return <InvestmentMethodView guide={resolved.data} canonicalUrl={canonicalUrl} />;
  }

  // At this point, resolved.kind === "how-to" (the only remaining branch)
  const guide = resolved.data;

  // Phase 16.12G: Article schema for guide pages (overrides layout's generic WebApplication)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.h1,
    "description": guide.description,
    "url": canonicalUrl,
    "datePublished": "2025-01-01",
    "dateModified": new Date().toISOString().split("T")[0],
    "author": {
      "@type": "Organization",
      "name": "QFINHUB"
    },
    "publisher": {
      "@type": "Organization",
      "name": "QFINHUB",
      "url": "https://www.qfinhub.com"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/calculators" className="hover:text-gray-900 dark:hover:text-white">Calculators</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 dark:text-white">Guide</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{guide.h1}</h1>
        </div>
        <p className="mb-8 text-gray-500 dark:text-gray-400">{guide.description}</p>

        {/* Calculator Link */}
        <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
          <Link
            href={`/calculators/${guide.calculatorId}`}
            className="flex items-center justify-between text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
          >
            <span>Open the calculator →</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>

        {/* Why This Matters */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Why This Calculator Matters</h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Understanding how to use this calculator correctly can save you time and help you make better financial decisions. 
            Whether you&apos;re planning a major purchase, evaluating an investment, or budgeting for the future, 
            getting accurate numbers is the first step. This guide walks you through each input field, explains what the results mean, 
            and shows you how to avoid common pitfalls that could lead to incorrect calculations.
          </p>
        </div>

        {/* Step-by-step */}
        <div className="space-y-4 mb-8">
          {guide.steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark-elevated"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Real-World Example */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20 mb-4">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">Real-World Example</h2>
          <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-400">
            Let&apos;s walk through a practical example. Enter realistic numbers based on your situation, 
            then adjust one variable at a time to see how it affects the outcome. For instance, 
            try changing the interest rate by 0.5% or extending the term by 5 years — you&apos;ll immediately 
            see how small changes can have significant financial impacts over time. 
            Use the export feature to save or share your results with a financial advisor.
          </p>
        </div>

        {/* Tips */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20 mb-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Pro Tips</h3>
              <ul className="space-y-1.5">
                {guide.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Common Mistakes to Avoid</h3>
              <ul className="space-y-1.5">
                {guide.commonMistakes.map((mistake, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {guide.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{faq.question}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Calculators — contextual internal links for crawl depth */}
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
          <h2 className="text-base font-semibold text-indigo-800 dark:text-indigo-300 mb-3">
            Explore Related Calculators
          </h2>
          <div className="flex flex-wrap gap-2">
            <CalculatorGuideLinks calculatorId={guide.calculatorId} />
          </div>
        </div>

        {/* Related Financial Decisions */}
        {(() => {
          const decisions = CALCULATOR_DECISION_LINKS[guide.calculatorId];
          if (!decisions?.length) return null;
          return (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
              <h2 className="text-base font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                <Scale className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                Make a Smart Financial Decision
              </h2>
              <div className="flex flex-wrap gap-2">
                {decisions.slice(0, 5).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/decision/${d.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 dark:bg-surface-dark-elevated dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                  >
                    {d.title}
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Back */}
        <div className="mt-8">
          <Link href={`/calculators/${guide.calculatorId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Mortgage-by-Income Guide View — original long-form expert content
// ───────────────────────────────────────────────────────────────────

import type { MortgageByIncomeGuide } from "@/lib/programmatic-seo/mortgage-by-income";

function MortgageByIncomeView({
  guide,
  canonicalUrl,
}: {
  guide: MortgageByIncomeGuide;
  canonicalUrl: string;
}) {
  const aff = guide.affordability;
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.h1,
    "description": guide.description,
    "url": canonicalUrl,
    "datePublished": "2026-07-20",
    "dateModified": new Date().toISOString().split("T")[0],
    "author": { "@type": "Organization", "name": "QFINHUB" },
    "publisher": { "@type": "Organization", "name": "QFINHUB", "url": "https://www.qfinhub.com" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/calculators/mortgage-calculator" className="hover:text-gray-900 dark:hover:text-white">Mortgage Calculator</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 dark:text-white">By Income</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <HomeIcon className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{guide.h1}</h1>
        </div>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{guide.intro}</p>

        {/* Quick Answer Card — the most-searched snippet */}
        <div className="mb-8 rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-blue-50 p-6 dark:border-primary-700 dark:from-primary-900/30 dark:to-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-base font-bold text-primary-900 dark:text-primary-200">Quick Answer</h2>
          </div>
          <p className="text-sm text-primary-800 dark:text-primary-300 mb-4">
            On <strong>{guide.incomeDisplay}/year</strong>, you can afford a home priced between <strong>{fmt(aff.conservativeMaxHome)}</strong> (conservative, 28% DTI, no other debt) and <strong>{fmt(aff.aggressiveMaxHome)}</strong> (aggressive, 36% DTI). Most lenders and financial planners recommend the <strong>moderate</strong> target of <strong>{fmt(aff.moderateMaxHome)}</strong>.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/80 p-3 dark:bg-zinc-900/40">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Conservative</div>
              <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{fmt(aff.conservativeMaxHome)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fmt(aff.monthlyPaymentConservative)}/mo · 28% DTI</div>
            </div>
            <div className="rounded-lg bg-white/80 p-3 dark:bg-zinc-900/40">
              <div className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">Recommended</div>
              <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{fmt(aff.moderateMaxHome)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fmt(aff.monthlyPaymentModerate)}/mo · 33% DTI</div>
            </div>
            <div className="rounded-lg bg-white/80 p-3 dark:bg-zinc-900/40">
              <div className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">Aggressive</div>
              <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{fmt(aff.aggressiveMaxHome)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fmt(aff.monthlyPaymentAggressive)}/mo · 36% DTI</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/calculators/mortgage-calculator"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Calculator className="h-4 w-4" />
              Run Your Numbers
            </Link>
            <Link
              href="/decision/how-much-house-can-i-afford"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:bg-zinc-900 dark:text-primary-300"
            >
              <Scale className="h-4 w-4" />
              See the Full Decision Guide
            </Link>
          </div>
        </div>

        {/* Income Context Card */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Income Context for {guide.incomeDisplay}/Year</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Housing budget guideline:</strong> {guide.incomeContext.housingBudgetPct} of gross monthly income (PITI)</li>
            <li><strong>vs. US median:</strong> {guide.incomeContext.medianComparison}</li>
            <li><strong>Location context:</strong> {guide.incomeContext.locationContext}</li>
            <li><strong>Lifestyle guidance:</strong> {guide.incomeContext.lifestyleNotes}</li>
            <li><strong>Other debt assumption:</strong> {guide.incomeContext.otherDebtAssumption}</li>
          </ul>
        </div>

        {/* Body Sections */}
        {guide.sections.map((section, i) => (
          <div key={i} className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{section.heading}</h2>
            <div className="prose prose-sm prose-gray max-w-none dark:prose-invert">
              {section.body.split('\n\n').map((para, j) => (
                <p key={j} className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{para}</p>
              ))}
            </div>
          </div>
        ))}

        {/* FAQs */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {guide.faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Calculators — internal links for crawl + utility */}
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
          <h2 className="text-base font-semibold text-indigo-800 dark:text-indigo-300 mb-3">
            <Calculator className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            See Your Exact Numbers
          </h2>
          <div className="flex flex-wrap gap-2">
            {guide.relatedCalculatorSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/tools/${slug}`}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-surface-dark-elevated dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              >
                {slug.replace(/-/g, ' ').replace(/\bpct\b/, '%')}
                <ChevronRight className="h-3 w-3 opacity-50" />
              </Link>
            ))}
          </div>
        </div>

        {/* Income Cluster Cross-Links */}
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
          <h2 className="text-base font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
            <DollarSign className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Other Income Levels
          </h2>
          <div className="flex flex-wrap gap-2">
            {getAllMortgageByIncomeGuides()
              .filter(g => g.slug !== guide.slug)
              .map(g => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 dark:bg-surface-dark-elevated dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                >
                  {g.incomeDisplay}/yr
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </Link>
              ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-8">
          <Link href="/calculators/mortgage-calculator">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Mortgage Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Investment Method View — methodology explainer with worked examples
// ───────────────────────────────────────────────────────────────────

import type { InvestmentMethodGuide } from "@/lib/programmatic-seo/investment-methods";
import { TrendingUp } from "lucide-react";

function InvestmentMethodView({
  guide,
  canonicalUrl,
}: {
  guide: InvestmentMethodGuide;
  canonicalUrl: string;
}) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.h1,
    "description": guide.description,
    "url": canonicalUrl,
    "datePublished": "2026-07-20",
    "dateModified": new Date().toISOString().split("T")[0],
    "author": { "@type": "Organization", "name": "QFINHUB" },
    "publisher": { "@type": "Organization", "name": "QFINHUB", "url": "https://www.qfinhub.com" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/calculators/investment-return" className="hover:text-gray-900 dark:hover:text-white">Investment Calculator</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 dark:text-white">Methodology</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{guide.h1}</h1>
        </div>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{guide.description}</p>

        {/* Formula Card */}
        <div className="mb-8 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-blue-50 p-6 dark:border-emerald-700 dark:from-emerald-900/30 dark:to-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">The Formula</h2>
          </div>
          <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white mb-3 break-words">{guide.formula}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{guide.formulaExplanation}</p>
        </div>

        {/* When to Use */}
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
            <Scale className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            When to Use {guide.method}
          </h2>
          <ul className="space-y-1.5">
            {guide.whenToUse.map((use, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                {use}
              </li>
            ))}
          </ul>
        </div>

        {/* Worked Examples */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Worked Examples</h2>
          {guide.workedExamples.map((ex, i) => (
            <div key={i} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{ex.scenario}</h3>

              <div className="mb-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-900/40">
                <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Given</div>
                <ul className="space-y-1">
                  {ex.given.map((g, j) => (
                    <li key={j} className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{g.label}:</strong> {g.value}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <div className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">Calculation</div>
                <ol className="space-y-1 list-decimal list-inside text-sm text-amber-900 dark:text-amber-200 font-mono">
                  {ex.calculation.map((c, j) => <li key={j}>{c}</li>)}
                </ol>
              </div>

              <div className="mb-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <div className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Result</div>
                <div className="text-base font-bold text-emerald-900 dark:text-emerald-200">{ex.result}</div>
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 italic border-l-4 border-indigo-300 pl-3 dark:border-indigo-700">
                💡 {ex.insight}
              </div>
            </div>
          ))}
        </div>

        {/* Pitfalls */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Common Pitfalls to Avoid</h2>
          </div>
          <div className="space-y-4">
            {guide.pitfalls.map((p, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">{p.title}</h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">{p.description}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Fix:</strong> {p.fix}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {guide.faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-link to calculator */}
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
          <h2 className="text-base font-semibold text-indigo-800 dark:text-indigo-300 mb-3">
            <Calculator className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Apply This to Real Numbers
          </h2>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
            See your exact investment return with our free calculator — handles dividends, taxes, and contributions.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/calculators/investment-return"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Calculator className="h-4 w-4" />
              Investment Return Calculator
            </Link>
            <Link
              href="/decision/pay-off-debt-or-invest"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-zinc-900 dark:text-indigo-300"
            >
              <Scale className="h-4 w-4" />
              Pay Off Debt or Invest?
            </Link>
          </div>
        </div>

        {/* Method Cluster Cross-Links */}
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
          <h2 className="text-base font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
            <Lightbulb className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Other Investment Return Methods
          </h2>
          <div className="flex flex-wrap gap-2">
            {getAllInvestmentMethodGuides()
              .filter(g => g.slug !== guide.slug)
              .map(g => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 dark:bg-surface-dark-elevated dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                >
                  {g.method}
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </Link>
              ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-8">
          <Link href="/calculators/investment-return">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Investment Return Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
