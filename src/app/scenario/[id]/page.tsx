import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";
import { LastReviewedBy } from "@/components/layout/last-reviewed";
import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { calculatorContent } from "@/lib/calculators/calculator-content";
import { blogPosts } from "@/lib/blog/posts";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";

import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────

interface ScenarioData {
  slug: string;
  calculatorSlug: string;
  calculatorName: string;
  category: string;
  params: Record<string, number>;
  computed: Record<string, unknown>;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  resultsSummary: string;
  keyFactors: string;
  comparison: string;
  tips: string;
  faqs: Array<{ question: string; answer: string }>;
  disclaimer: string;
  generatedAt: string;
}

interface ScenarioIndex {
  [slug: string]: {
    batch: string;
    title: string;
    calculatorSlug: string;
    category: string;
  };
}

// ─── Cache ───────────────────────────────────────────────────────

let cachedIndex: ScenarioIndex | null = null;
let cachedBatches: Map<string, ScenarioData[]> = new Map();

function loadIndex(): ScenarioIndex {
  if (cachedIndex) return cachedIndex;
  const indexPath = join(process.cwd(), "public", "data", "scenarios", "index.json");
  if (!existsSync(indexPath)) return {};
  cachedIndex = JSON.parse(readFileSync(indexPath, "utf-8"));
  return cachedIndex!;
}

function loadBatch(filename: string): ScenarioData[] {
  if (cachedBatches.has(filename)) return cachedBatches.get(filename)!;
  const batchPath = join(process.cwd(), "public", "data", "scenarios", filename);
  if (!existsSync(batchPath)) return [];
  const data = JSON.parse(readFileSync(batchPath, "utf-8"));
  cachedBatches.set(filename, data);
  return data;
}

function getScenarioData(slug: string): ScenarioData | null {
  const index = loadIndex();
  const entry = index[slug];
  if (!entry) return null;
  const batch = loadBatch(entry.batch);
  return batch.find((p) => p.slug === slug) || null;
}

// ═════════════════════════════════════════════════════════════════
// ISR Configuration — allow any slug, revalidate weekly
// ═════════════════════════════════════════════════════════════════

export const dynamicParams = true;
export const revalidate = 604800; // 7 days

// Pre-render the latest 500 pages for fast initial loads
export function generateStaticParams() {
  const index = loadIndex();
  // Get 500 most recently generated slugs (assuming index order matches)
  const slugs = Object.keys(index).slice(-500);
  return slugs.map((slug) => ({ id: slug }));
}

// ═════════════════════════════════════════════════════════════════
// Metadata
// ═════════════════════════════════════════════════════════════════

interface ScenarioPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ScenarioPageProps) {
  const { id } = await params;
  const scenario = getScenarioData(id);

  if (!scenario) {
    return { title: "Scenario Not Found" };
  }

  return {
    title: scenario.title,
    description: scenario.metaDescription,
    alternates: {
      canonical: `https://www.qfinhub.com/scenario/${id}`,
    },
    openGraph: {
      title: `${scenario.title} | QFINHUB`,
      description: scenario.metaDescription,
      type: "article" as const,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
// Page Component
// ═════════════════════════════════════════════════════════════════

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { id } = await params;
  const scenario = getScenarioData(id);

  if (!scenario) notFound();

  const calculator = getCalculatorBySlug(scenario.calculatorSlug);
  const category = (scenario.category as CategoryType) || "basic";
  const CalculatorComponent = getCalculatorComponent(scenario.calculatorSlug);

  // Build structured data
  const schemaData = buildSchema(scenario);
  const relatedCalculators = getRelatedCalculators(scenario);
  const relatedBlogPosts = getRelatedBlogPosts(scenario);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/calculators" className="hover:text-blue-600">Calculators</Link>
            <span>/</span>
            <Link href={`/calculators/${scenario.calculatorSlug}`} className="hover:text-blue-600">
              {scenario.calculatorName}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">
              {scenario.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Calculator Section */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Badge className={CATEGORY_COLORS[category]}>
              {CATEGORY_LABELS[category]}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {scenario.h1}
          </h1>
          <div
            className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: scenario.intro }}
          />

          {/* Calculator Component (pre-filled) */}
          {CalculatorComponent ? (
            <Card>
              <CardHeader>
                <CardTitle>{scenario.calculatorName}</CardTitle>
                <CardDescription>{scenario.metaDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <CalculatorComponent key={id} />
              </CardContent>
            </Card>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-800 dark:text-amber-200">
              Calculator is loading. Please use our full calculator at{" "}
              <Link
                href={`/calculators/${scenario.calculatorSlug}`}
                className="underline font-semibold"
              >
                {scenario.calculatorName}
              </Link>.
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Results Breakdown for This Scenario
          </h2>
          <div
            className="text-gray-600 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: scenario.resultsSummary }}
          />
          {scenario.computed && Object.keys(scenario.computed).length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(scenario.computed).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-white font-mono">
                        {typeof value === "number"
                          ? key.toLowerCase().includes("pct") || key.toLowerCase().includes("rate")
                            ? `${value}%`
                            : value >= 1000
                              ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : value
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Key Factors */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Key Factors That Affect Your Results
          </h2>
          <div
            className="text-gray-600 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: scenario.keyFactors }}
          />
        </div>

        {/* Comparison */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How This Compares to Other Scenarios
          </h2>
          <div
            className="text-gray-600 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: scenario.comparison }}
          />
        </div>

        {/* Tips */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Actionable Tips for This Scenario
          </h2>
          <div
            className="text-gray-600 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: scenario.tips }}
          />
        </div>

        {/* FAQs */}
        {scenario.faqs && scenario.faqs.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {scenario.faqs.map((faq, i) => (
                <details key={i} className="group border-b border-gray-100 dark:border-gray-800 pb-4">
                  <summary className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    {faq.question}
                  </summary>
                  <div
                    className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Related Calculators */}
        {relatedCalculators.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Related Calculators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedCalculators.slice(0, 8).map((calc) => (
                <Link
                  key={calc.slug}
                  href={`/calculators/${calc.slug}`}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {calc.title || calc.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Blog Posts */}
        {relatedBlogPosts.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Related Guides & Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedBlogPosts.slice(0, 4).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {post.title || post.slug}
                  </div>
                  {post.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {post.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <YMYLDisclaimer />
        <LastReviewedBy />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════

function buildSchema(scenario: ScenarioData) {
  const url = `https://www.qfinhub.com/scenario/${scenario.slug}`;
  
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.qfinhub.com" },
      { "@type": "ListItem", position: 2, name: "Calculators", item: "https://www.qfinhub.com/calculators" },
      { "@type": "ListItem", position: 3, name: scenario.calculatorName, item: `https://www.qfinhub.com/calculators/${scenario.calculatorSlug}` },
      { "@type": "ListItem", position: 4, name: scenario.title },
    ],
  };

  const webApp = {
    "@type": "SoftwareApplication",
    name: scenario.title,
    description: scenario.metaDescription,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Qasem Mohammed", url: "https://qfinhub.com/about" },
  };

  const howTo = {
    "@type": "HowTo",
    name: `How to Use the ${scenario.calculatorName}`,
    description: `Step-by-step guide to calculating your specific ${scenario.calculatorName.toLowerCase()} scenario.`,
    step: [
      { "@type": "HowToStep", position: 1, name: "Review the pre-filled parameters", text: `The calculator above is pre-configured with the specific numbers for this scenario: ${scenario.title}.` },
      { "@type": "HowToStep", position: 2, name: "Review your results", text: "The calculator instantly shows your results including detailed breakdowns specific to your numbers." },
      { "@type": "HowToStep", position: 3, name: "Adjust and compare", text: "Modify any input field to compare different rates, amounts, or terms and find your optimal scenario." },
    ],
  };

  const faqPage = scenario.faqs && scenario.faqs.length > 0
    ? {
        "@type": "FAQPage",
        mainEntity: scenario.faqs.slice(0, 5).map((faq: { question: string; answer: string }) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer.replace(/<[^>]+>/g, "").substring(0, 300),
          },
        })),
      }
    : null;

  const graph = [webApp, howTo, faqPage].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [...graph, breadcrumb],
  };
}

function getRelatedCalculators(scenario: ScenarioData) {
  const allCalcs = calculatorContent || {};
  const related: Array<{ slug: string; title: string }> = [];

  // Get calculators in the same category
  for (const [slug, content] of Object.entries(allCalcs)) {
    if (slug === scenario.calculatorSlug) continue;
    if (content && (content as { relatedCalculators?: string[] }).relatedCalculators?.includes(scenario.calculatorSlug)) {
      related.push({ slug, title: slug.replace(/-/g, " ") });
    }
  }

  // Add a few more from calculator registry
  const calculator = getCalculatorBySlug(scenario.calculatorSlug);
  if (calculator) {
    const sameCategory = allCalculators.filter(
      (c: { category: string; slug: string }) =>
        c.category === calculator.category && c.slug !== scenario.calculatorSlug
    );
    for (const c of sameCategory.slice(0, 4)) {
      if (!related.find((r) => r.slug === c.slug)) {
        related.push({ slug: c.slug, title: c.title || c.slug });
      }
    }
  }

  return related;
}

function getRelatedBlogPosts(scenario: ScenarioData) {
  return (blogPosts || [])
    .filter(
      (post: { relatedCalculators?: string[] }) =>
        post.relatedCalculators?.includes(scenario.calculatorSlug)
    )
    .slice(0, 4)
    .map((post: { slug: string; title?: string; description?: string }) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
    }));
}
