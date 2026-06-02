import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scale, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
import { getCalculatorBySlug } from "@/lib/calculators";
import type { Metadata } from "next";

interface ComparePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllComparisons().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  const comp = getAllComparisons().find((c) => c.slug === slug);
  if (!comp) return { title: "Not Found" };

  const canonicalUrl = `https://www.qfinhub.com/compare/${slug}`;

  return {
    title: comp.title,
    description: comp.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ComparisonPage({ params }: ComparePageProps) {
  const { slug } = await params;
  const comp = getAllComparisons().find((c) => c.slug === slug);
  if (!comp) notFound();

  const calcA = getCalculatorBySlug(comp.calculatorA);
  const calcB = getCalculatorBySlug(comp.calculatorB);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/calculators" className="hover:text-gray-900 dark:hover:text-white">Calculators</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Comparison</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{comp.h1}</h1>
        </div>
        <p className="mb-8 text-gray-500 dark:text-gray-400 max-w-3xl">{comp.description}</p>

        {/* Side by Side */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {calcA?.title ?? comp.calculatorA}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{calcA?.description}</p>
            <Link href={`/calculators/${comp.calculatorA}`}>
              <Button size="sm" className="gap-1.5">
                Open Calculator <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {calcB?.title ?? comp.calculatorB}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{calcB?.description}</p>
            <Link href={`/calculators/${comp.calculatorB}`}>
              <Button size="sm" className="gap-1.5">
                Open Calculator <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Considerations */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Comparison Points</h2>
          <ul className="space-y-3">
            {comp.comparisonPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQs */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {comp.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{faq.question}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* When to Use Each */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">When to Use Each Calculator</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Use {calcA?.title ?? comp.calculatorA} when:
              </h3>
              <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
                <li>• You need a focused calculation for this specific scenario</li>
                <li>• You want detailed breakdowns, charts, and export options</li>
                <li>• You prefer a dedicated tool with full customization</li>
                <li>• You need to save or share this specific result</li>
              </ul>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                Use {calcB?.title ?? comp.calculatorB} when:
              </h3>
              <ul className="space-y-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                <li>• Your situation matches this alternative approach</li>
                <li>• You want to compare results side by side</li>
                <li>• The assumptions in this calculator fit your needs better</li>
                <li>• You're exploring different financial strategies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-3">Bottom Line</h2>
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
            Both calculators serve different purposes and the right choice depends on your specific financial situation. 
            We recommend running both calculators with your actual numbers and comparing the results directly. 
            Understanding both perspectives gives you a more complete picture for making informed financial decisions. 
            All calculators on QFINHUB are 100% free, require no sign-up, and provide instant results with interactive charts.
          </p>
        </div>
      </div>
    </div>
  );
}
