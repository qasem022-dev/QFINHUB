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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20 mb-8">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-3">Bottom Line</h2>
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
            Both calculators serve different purposes and the right choice depends on your specific financial situation.
            We recommend running both calculators with your actual numbers and comparing the results directly.
            Understanding both perspectives gives you a more complete picture for making informed financial decisions.
            All calculators on QFINHUB are 100% free, require no sign-up, and provide instant results with interactive charts.
          </p>
        </div>

        {/* In-Depth Comparison Guide */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            In-Depth Comparison Guide
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Choosing between <strong>{calcA?.title ?? comp.calculatorA}</strong> and{' '}
              <strong>{calcB?.title ?? comp.calculatorB}</strong> comes down to understanding what each
              calculator does best, what assumptions each makes, and how those assumptions fit your
              personal financial situation. Below is a detailed breakdown of when each tool shines,
              what inputs matter most, and how to interpret the results.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              <strong>Accuracy &amp; methodology:</strong> Both calculators are built using industry-standard
              financial formulas verified against authoritative sources including the IRS, CFPB, Federal
              Reserve, and generally accepted financial planning frameworks. See our{' '}
              <Link href="/methodology" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Methodology page
              </Link>{' '}
              for the complete source list and our{' '}
              <Link href="/editorial-policy" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Editorial Policy
              </Link>{' '}
              for how we verify every calculator before publication.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              <strong>Common use cases:</strong> Most people run both calculators with their actual
              numbers and compare the outputs side by side. This side-by-side approach is the most
              reliable way to choose, because the math will tell you which scenario produces the better
              outcome for your specific inputs — rather than relying on general rules of thumb that
              may not apply to your situation.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Beyond the calculator:</strong> For decisions involving significant money — major
              purchases, retirement planning, tax strategy — we recommend running both calculators,
              then consulting a qualified CFP®, CPA, or financial advisor in your jurisdiction. Our
              tools are designed to help you model scenarios and prepare for conversations with
              professionals, not to replace personalized advice.
            </p>
          </div>
        </div>

        {/* How to Choose - Decision Framework */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            How to Choose Between These Calculators
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Use this decision framework to pick the right calculator for your scenario:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Identify your primary question
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  What specific decision are you trying to make? Each calculator answers a slightly
                  different question. Knowing your primary question makes the choice clearer.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Check which assumptions fit
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Each calculator uses specific assumptions (interest rates, timeframes, default
                  values). The calculator whose assumptions most closely match your scenario will
                  give you the most accurate result.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Run both and compare
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  When in doubt, run both calculators with the same inputs. The difference in outputs
                  reveals how sensitive your decision is to the assumptions — and which interpretation
                  better matches reality.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold text-sm">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Adjust inputs to match your scenario
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Every input is editable. Change the default values to match your specific situation —
                  your actual income, your actual loan terms, your actual timeline. The results
                  recalculate instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Related Tools &amp; Resources
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Beyond the two calculators compared above, you may find these related QFINHUB tools useful
            for your specific situation:
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/calculators" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Browse all 125+ QFINHUB calculators
              </Link>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                — including mortgage, loan, investment, retirement, tax, and personal finance tools
              </span>
            </li>
            <li>
              <Link href="/ai-specialist" className="text-primary-600 dark:text-primary-400 underline font-medium">
                AI Financial Specialist
              </Link>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                — describe any financial calculation in plain English and get a custom-built
                interactive calculator in under 10 seconds
              </span>
            </li>
            <li>
              <Link href="/methodology" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Methodology page
              </Link>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                — see the formulas, sources, and verification process behind every QFINHUB calculator
              </span>
            </li>
            <li>
              <Link href="/editorial-policy" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Editorial Policy
              </Link>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                — how we ensure accuracy, handle corrections, and maintain editorial independence
              </span>
            </li>
            <li>
              <Link href="/contact" className="text-primary-600 dark:text-primary-400 underline font-medium">
                Contact us
              </Link>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                — report an error, suggest a new calculator, or ask a question. We respond within 24 hours.
              </span>
            </li>
          </ul>
        </div>

        {/* Final Disclaimer */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 p-5 mb-4">
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Important Disclaimer:</strong> The calculators and comparison information on this
            page are provided for educational and informational purposes only. They do not constitute
            financial, investment, tax, or legal advice. Results may not reflect actual terms offered
            by financial institutions. Always consult a qualified CFP®, CPA, or licensed attorney
            for advice tailored to your specific situation. By using these tools, you agree to our{' '}
            <Link href="/terms" className="underline font-medium">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
