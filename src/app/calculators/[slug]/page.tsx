import { Suspense } from "react"; // Phase 10.5 redeploy
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorLayout } from "@/components/calculators";
import { CalculatorSEOContent } from "@/components/calculators/calculator-seo-content";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";
import { LastReviewedBy } from "@/components/layout/last-reviewed";
import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { calculatorContent } from "@/lib/calculators/calculator-content";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { ShareDialog } from "@/components/calculators/share-dialog";
import { BreadcrumbNav } from "@/components/calculators/breadcrumb-nav";
import { RelatedCalculators } from "@/components/calculators/related-calculators";
import { RelatedArticles } from "@/components/calculators/related-articles";
import { RelatedDecisions } from "@/components/calculators/related-decisions";
import { CALCULATOR_BLOG_LINKS } from "@/lib/calculator-blog-links";
import { CALCULATOR_DECISION_LINKS } from "@/lib/calculator-decision-links-v10";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";

interface CalculatorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allCalculators.map((calc) => ({
    slug: calc.slug,
  }));
}

export async function generateMetadata({ params }: CalculatorPageProps) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    return { title: "Calculator Not Found" };
  }

  const content = calculatorContent[slug];

  // CTR-optimized benefit-driven titles for top calculator hubs
  const ctrTitles: Record<string, { title: string; ogTitle: string; metaDesc: string; ogDesc: string }> = {
    "mortgage-affordability": {
      title: "How Much House Can I Afford? Free Calculator (2026)",
      ogTitle: "How Much House Can I Afford? | Free Calculator (2026)",
      metaDesc: "Find your maximum home price in seconds. See what you can afford based on income, debt, and down payment — free instant results, no signup required.",
      ogDesc: "Find your maximum home price instantly. See what you can afford based on income, debt, and down payment. Try it free — no signup, instant results.",
    },
    "compound-interest": {
      title: "Compound Interest Calculator — Calculate Growth by Rate, Years & Contributions",
      ogTitle: "Compound Interest Calculator — Calculate Growth by Rate, Years & Contributions",
      metaDesc: "Calculate compound interest with regular contributions and see exactly how much your money will be worth. Adjust rate, years, and contributions — free instant results, no signup.",
      ogDesc: "Calculate compound interest with contributions and see your future wealth. Adjust rate, years, and contributions — try it free, no signup.",
    },
    "mortgage-calculator": {
      title: "Mortgage Calculator — Estimate Monthly Payment, Interest & Amortization",
      ogTitle: "Mortgage Calculator — Estimate Monthly Payment, Interest & Amortization",
      metaDesc: "See your exact monthly mortgage payment in seconds — principal, interest, taxes & insurance included. Compare 15 vs 30-year terms. Free instant results, no signup.",
      ogDesc: "See your exact monthly mortgage payment instantly — PITI included. Compare loan terms side by side. Try it free — no signup, instant results.",
    },
    "loan-calculator": {
      title: "Loan Calculator — Calculate Monthly Payment, Total Interest & Payoff Schedule",
      ogTitle: "Loan Calculator — Calculate Monthly Payment, Total Interest & Payoff Schedule",
      metaDesc: "Calculate monthly payments for any loan — auto, personal, student, or home. See full amortization and total interest cost. Free instant results, no signup.",
      ogDesc: "Calculate monthly payments for any loan type. See full amortization and total interest. Try it free — no signup, instant results.",
    },
    "retirement-planning": {
      title: "Retirement Calculator: Will You Have Enough to Retire? (Free 2026)",
      ogTitle: "Retirement Calculator | Will You Have Enough to Retire?",
      metaDesc: "Project your retirement savings with compound growth, contributions, and inflation. See if you're on track and what to adjust. Free instant results, no signup.",
      ogDesc: "Project your retirement savings with compound growth and contributions. See if you're on track. Try it free — no signup, instant results.",
    },
    "investment-return": {
      title: "Investment Return Calculator: See How Much Your Money Can Grow (Free)",
      ogTitle: "Investment Return Calculator | See Your Money Grow (Free 2026)",
      metaDesc: "Calculate your exact investment returns with compound growth over any time period. See your portfolio's future value with contributions. Free instant results.",
      ogDesc: "Calculate your investment returns with compound growth. See your portfolio's future value. Try it free — no signup, instant results.",
    },
    "tax-calculator": {
      title: "2026 Tax Calculator: See Exactly What You'll Owe (Free Estimate)",
      ogTitle: "2026 Tax Calculator | See Exactly What You'll Owe (Free)",
      metaDesc: "Enter your income and filing status to estimate your 2026 federal tax bill in seconds. Compare tax brackets, deductions, and credits — free instant results.",
      ogDesc: "Enter your income to estimate your 2026 federal tax bill instantly. Compare tax brackets and deductions. Try it free — no signup needed.",
    },
  };

  const ctr = ctrTitles[slug];

  return {
    title: ctr?.title ?? `${calculator.title} (2026) — Free Online Tool`,
    description: ctr?.metaDesc ?? ((content?.explanation?.slice(0, 160) || calculator.description) + " Get free instant results, no signup required."),
    alternates: {
      canonical: `https://www.qfinhub.com/calculators/${slug}`,
    },
    openGraph: {
      title: ctr?.ogTitle ?? `${calculator.title} (2026) | Free Financial Calculator`,
      description: ctr?.ogDesc ?? ((content?.explanation?.slice(0, 150) || calculator.description) + " Try it free — no signup, instant results."),
    },
  };
}

export default async function CalculatorDetailPage({
  params,
}: CalculatorPageProps) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    notFound();
  }

  const CalculatorComponent = getCalculatorComponent(slug);

  // Fallback: render metadata if no component is registered yet
  if (!CalculatorComponent) {
    return (
      <>
        {/* Back navigation + Share */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/calculators">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                All Calculators
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/calculators/${slug}/embed`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <Code2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Embed</span>
                </Button>
              </Link>
              <ShareDialog
                calculatorSlug={slug}
                calculatorTitle={calculator.title}
              />
            </div>
          </div>
        </div>

        <CalculatorLayout
          title={calculator.title}
          description={calculator.description}
          icon={
            typeof calculator.icon === "string" ? (
              <span className="text-xl">{calculator.icon}</span>
            ) : (
              calculator.icon
            )
          }
          results={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl opacity-30">
                {typeof calculator.icon === "string"
                  ? calculator.icon
                  : "📊"}
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Calculator implementation coming soon
              </p>
              <Badge
                variant="secondary"
                className={`mt-3 ${CATEGORY_COLORS[calculator.category as CategoryType]}`}
              >
                {CATEGORY_LABELS[calculator.category as CategoryType]}
              </Badge>
            </div>
          }
        >
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Input fields will be rendered here when the {calculator.title}{" "}
              implementation is complete.
            </p>
          </div>
        </CalculatorLayout>
      <YMYLDisclaimer />
      {calculatorContent[slug] && (
        <CalculatorSEOContent
          content={calculatorContent[slug]}
          currentSlug={slug}
        />
      )}
    </>
  );
}

  // Build FAQ schema from tips with simple questions
  const faqItems = (calculatorContent[slug]?.tips || []).map((tip, i) => ({
    "@type": "Question",
    name: i === 0
      ? `What is the ${calculator.title}?`
      : i === 1
        ? `How do I use the ${calculator.title}?`
        : `What factors affect ${calculator.title.toLowerCase()} results?`,
    acceptedAnswer: {
      "@type": "Answer",
      text: tip,
    },
  }));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://qfinhub.com/" },
      { "@type": "ListItem", position: 2, name: "Calculators", item: "https://qfinhub.com/calculators" },
      { "@type": "ListItem", position: 3, name: calculator.title, item: `https://qfinhub.com/calculators/${slug}` },
    ],
  };

  const faqLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  } : null;

  // Build HowTo schema from tips as step-by-step instructions
  const howToSteps = (calculatorContent[slug]?.tips || []).map((tip, i) => ({
    "@type": "HowToStep" as const,
    position: i + 1,
    name: `Step ${i + 1}: ${calculator.title}`,
    text: tip,
  }));

  const howToLd = howToSteps.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Use the ${calculator.title}`,
    description: `Step-by-step guide to using the ${calculator.title} effectively. ${calculator.description}`,
    step: howToSteps,
  } : null;

  const calculatorLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: calculator.title,
    description: calculator.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    url: `https://qfinhub.com/calculators/${slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Qasem Mohammed",
      url: "https://qfinhub.com/about",
      sameAs: ["https://www.linkedin.com/in/qasem-mohammed"],
      jobTitle: "AI & Software Engineer, Founder & Lead Developer",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {howToLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/calculators">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All Calculators
            </Button>
          </Link>
          <ShareDialog
            calculatorSlug={slug}
            calculatorTitle={calculator.title}
          />
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <CalculatorComponent />
      </Suspense>
      <YMYLDisclaimer />
      {calculatorContent[slug] && (
        <CalculatorSEOContent
          content={calculatorContent[slug]}
          currentSlug={slug}
        />
      )}

      {/* Widget embed callout — only for calculators with an embeddable widget */}
      {(slug === "mortgage-affordability" || slug === "mortgage-calculator") && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-6">
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5 dark:border-primary-900/30 dark:bg-primary-900/10">
            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
              📌 Have a website?{" "}
              <Link
                href="/widgets/mortgage-affordability-embed"
                prefetch={true}
                className="font-semibold underline underline-offset-2 hover:text-primary-900 dark:hover:text-primary-200"
              >
                Embed this mortgage affordability calculator
              </Link>{" "}
              on your site — free, no signup, no data collection.
            </p>
          </div>
        </div>
      )}

      <LastReviewedBy />
      {/* ── Cross-linking for SEO crawl discovery ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <BreadcrumbNav
          items={[
            { label: "Calculators", href: "/calculators" },
            { label: calculator.title, href: `/calculators/${slug}` },
          ]}
        />
        <RelatedArticles
          calculatorSlug={slug}
          articles={CALCULATOR_BLOG_LINKS[slug] || []}
          maxResults={5}
        />
        <RelatedDecisions
          calculatorSlug={slug}
          decisions={CALCULATOR_DECISION_LINKS[slug] || []}
          maxResults={8}
        />
        <RelatedCalculators
          currentSlug={slug}
          calculators={allCalculators}
          maxResults={6}
        />
      </div>
    </div>
  );
}
