import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorLayout } from "@/components/calculators";
import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { ShareDialog } from "@/components/calculators/share-dialog";
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

  return {
    title: `${calculator.title}`,
    description: calculator.description,
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
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
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
      </div>
    );
  }

  // Render the dynamically loaded calculator component
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
      "@type": "Organization",
      name: "QFINHUB",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorLd) }}
      />
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
    </div>
  );
}
