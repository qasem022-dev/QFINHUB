import { Suspense } from "react";
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
import { CALCULATOR_DECISION_LINKS } from "@/lib/calculator-decision-links";
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

  return {
    title: `${calculator.title} (2026) — Free Online Tool`,
    description: (content?.explanation?.slice(0, 160) || calculator.description) + " Get free instant results, no signup required.",
    alternates: {
      canonical: `https://www.qfinhub.com/calculators/${slug}`,
    },
    openGraph: {
      title: `${calculator.title} (2026) | Free Financial Calculator`,
      description: (content?.explanation?.slice(0, 150) || calculator.description) + " Try it free — no signup, instant results.",
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
          maxResults={4}
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
