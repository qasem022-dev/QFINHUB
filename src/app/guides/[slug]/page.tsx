import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, AlertTriangle, ChevronRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllHowToGuides, generateGuideMetaTitle, generateGuideMetaDescription } from "@/lib/programmatic-seo/guides";
import { CalculatorGuideLinks } from "@/components/calculators/calculator-guide-links";
import { CALCULATOR_DECISION_LINKS } from "@/lib/calculator-decision-links";
import type { Metadata } from "next";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllHowToGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getAllHowToGuides().find((g) => g.slug === slug);
  if (!guide) return { title: "Not Found" };

  return {
    title: generateGuideMetaTitle(guide.title),
    description: generateGuideMetaDescription(guide.title),
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getAllHowToGuides().find((g) => g.slug === slug);

  if (!guide) notFound();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
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
            Whether you're planning a major purchase, evaluating an investment, or budgeting for the future, 
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
            Let's walk through a practical example. Enter realistic numbers based on your situation, 
            then adjust one variable at a time to see how it affects the outcome. For instance, 
            try changing the interest rate by 0.5% or extending the term by 5 years — you'll immediately 
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
