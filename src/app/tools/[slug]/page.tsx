import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorLayout } from "@/components/calculators";
import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import {
  getAllVariantPages,
  getVariantBySlug,
} from "@/lib/programmatic-seo/generator";
import { parseVariantSlug } from "@/lib/programmatic-seo/seo-utils";
import { ShareDialog } from "@/components/calculators/share-dialog";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";

interface ToolsPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  const variants = getAllVariantPages();
  return variants.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: ToolsPageProps) {
  const { slug } = await params;
  const variant = getVariantBySlug(slug);

  if (!variant) {
    return { title: "Calculator Not Found" };
  }

  return {
    title: variant.meta.title,
    description: variant.meta.description,
    openGraph: {
      title: variant.meta.title,
      description: variant.meta.description,
    },
    alternates: {
      canonical: `https://www.qfinhub.com/tools/${slug}`,
    },
  };
}

function VariantContentPage({ variant }: { variant: NonNullable<ReturnType<typeof getVariantBySlug>> }) {
  const calculator = getCalculatorBySlug(variant.calculatorId);
  const category = calculator?.category ?? "basic";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                name: variant.meta.title,
                description: variant.meta.description,
                applicationCategory: "FinanceApplication",
                operatingSystem: "All",
                url: `https://qfinhub.com/tools/${variant.slug}`,
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                author: { "@type": "Person", name: "Qasem Mohammed", url: "https://qfinhub.com/about", sameAs: ["https://www.linkedin.com/in/qasem-mohammed"], jobTitle: "AI & Software Engineer, Founder & Lead Developer" },
              },
              variant.schema.howToSchema,
              ...(variant.faqs.length > 0
                ? [
                    {
                      "@type": "FAQPage",
                      mainEntity: variant.faqs.map(
                        (faq: { question: string; answer: string }) => ({
                          "@type": "Question",
                          name: faq.question,
                          acceptedAnswer: {
                            "@type": "Answer",
                            text: faq.answer,
                          },
                        })
                      ),
                    },
                  ]
                : []),
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://qfinhub.com/" },
                  { "@type": "ListItem", position: 2, name: "Tools", item: "https://qfinhub.com/tools" },
                  { "@type": "ListItem", position: 3, name: variant.meta.title, item: `https://qfinhub.com/tools/${variant.slug}` },
                ],
              },
            ],
          }),
        }}
      />

      {/* Navigation */}
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
            calculatorSlug={`tools/${variant.slug}`}
            calculatorTitle={variant.meta.title}
          />
        </div>
      </div>

      {/* Calculator with Pre-filled Values */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <CalculatorLayout
          title={variant.h1}
          description={variant.description}
          icon={
            <span className="text-xl">
              {calculator?.icon ?? "📊"}
            </span>
          }
          results={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Adjust the values below to see your results
              </p>
              {variant.faqs.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`mt-3 ${CATEGORY_COLORS[category as CategoryType]}`}
                >
                  {CATEGORY_LABELS[category as CategoryType] ?? "Finance"}
                </Badge>
              )}
            </div>
          }
        >
          <RenderedVariantCalculator variant={variant} />
        </CalculatorLayout>
      </Suspense>

      {/* Unique SEO Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-gray max-w-3xl dark:prose-invert mx-auto">
          {/* Intro Content */}
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(variant.content) }}
          />

          {/* How to Use */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">How to Use This Calculator</h3>
            <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-400">
              Enter your specific numbers in the input fields above. Adjust the key parameters — 
              interest rate, loan term, down payment, or monthly contribution — to match your situation. 
              The calculator updates instantly, showing your results with interactive charts. 
              You can export your results as a PDF or image, or share them directly with your financial advisor. 
              All calculations run in your browser — no sign-up required, and your data stays private.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Key Benefits</h3>
            <ul className="space-y-1.5 text-sm text-emerald-700 dark:text-emerald-400 list-disc pl-5">
              <li>Instant results — no waiting, no loading screens</li>
              <li>Interactive charts that update as you adjust inputs</li>
              <li>Export to PDF or image for your records</li>
              <li>100% free — no account, no credit card, no limits</li>
              <li>Privacy-first — your financial data never leaves your device</li>
            </ul>
          </div>

          {/* Related Variant Links */}
          {variant.relatedLinks.length > 0 && (
            <div className="mt-12 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Related Calculations
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {variant.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-primary-600 transition-colors hover:border-primary-200 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-800 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RenderedVariantCalculator({
  variant,
}: {
  variant: NonNullable<ReturnType<typeof getVariantBySlug>>;
}) {
  const CalculatorComponent = getCalculatorComponent(variant.calculatorId);

  if (!CalculatorComponent) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          The {variant.meta.title} calculator will be available soon.
        </p>
      </div>
    );
  }

  return <CalculatorComponent />;
}

function renderMarkdownToHtml(markdown: string): string {
  // Simple markdown renderer for the content sections
  const lines = markdown.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      if (inList) { html += "</ul>\n"; inList = false; }
      html += `<h3 class="text-xl font-semibold mt-8 mb-3 text-gray-900 dark:text-white">${escHtml(trimmed.slice(4))}</h3>\n`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html += "</ul>\n"; inList = false; }
      html += `<h2 class="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-white">${escHtml(trimmed.slice(3))}</h2>\n`;
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html += "</ul>\n"; inList = false; }
      html += `<h1 class="text-3xl font-bold mt-4 mb-4 text-gray-900 dark:text-white">${escHtml(trimmed.slice(2))}</h1>\n`;
    }
    // List items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html += '<ul class="list-disc pl-6 space-y-2 mb-4 text-gray-600 dark:text-gray-400">\n';
        inList = true;
      }
      html += `<li>${escHtml(trimmed.slice(2))}</li>\n`;
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        html += '<ol class="list-decimal pl-6 space-y-2 mb-4 text-gray-600 dark:text-gray-400">\n';
        inList = true;
      }
      html += `<li>${escHtml(trimmed.replace(/^\d+\.\s/, ""))}</li>\n`;
    }
    // Regular paragraph
    else {
      if (inList) { html += "</ul>\n"; inList = false; }
      html += `<p class="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">${escHtml(trimmed)}</p>\n`;
    }
  }

  if (inList) html += "</ul>\n";
  return html;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function ToolsSlugPage({ params }: ToolsPageProps) {
  const { slug } = await params;
  const variant = getVariantBySlug(slug);

  // If no variant found, check if it's a direct calculator slug and redirect
  if (!variant) {
    const calculator = getCalculatorBySlug(slug);
    if (calculator) {
      redirect(`/calculators/${slug}`);
    }
    notFound();
  }

  return <VariantContentPage variant={variant} />;
}
