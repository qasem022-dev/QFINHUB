import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { decisionPages } from "@/lib/decision-pages";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";
import { LastReviewedBy } from "@/components/layout/last-reviewed";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return decisionPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = decisionPages.find((p) => p.slug === slug);
  if (!page) return { title: "Not Found" };

  return {
    title: page.title,
    description: page.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.qfinhub.com/decision/${slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "article",
    },
  };
}

export default async function DecisionPage({ params }: Props) {
  const { slug } = await params;
  const page = decisionPages.find((p) => p.slug === slug);
  if (!page) notFound();

  const schema = page.schemaType === "FAQPage"
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/<[^>]+>/g, "").slice(0, 300) },
        })),
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        description: page.description,
        author: { "@type": "Person", name: "Qasem Mohammed", url: "https://qfinhub.com/about" },
        datePublished: "2026-05-28",
      };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/calculators" className="hover:text-blue-600">Calculators</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{page.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{page.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{page.description}</p>
        </div>

        {/* Short Answer */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">📊 The Short Answer</p>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{page.shortAnswer}</p>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Key Numbers</h2>
          <div className="space-y-4">
            {page.results.map((r, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex-shrink-0 w-32 text-right">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{r.value}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{r.label}</p>
                  {r.detail && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{page.table.caption}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                {page.table.headers.map((h, i) => (
                  <th key={i} className="py-3 px-3 text-left font-semibold text-gray-900 dark:text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.table.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-2.5 px-3 ${j === 0 ? "font-medium text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assumptions */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assumptions</h2>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
            {page.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>

        {/* Methodology */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How We Calculated This</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{page.methodology}</p>
        </div>

        {/* Alternatives */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Alternative Paths</h2>
          <div className="space-y-4">
            {page.alternatives.map((alt, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{alt.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Outcome:</strong> {alt.outcome}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Pros</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-0.5">
                      {alt.pros.map((p, j) => <li key={j}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Cons</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-0.5">
                      {alt.cons.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Risks & Tradeoffs</h2>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
            {page.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* What This Means */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 mb-8">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">💡 What This Means For You</p>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{page.whatThisMeans}</p>
        </div>

        {/* Next Steps */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Next Steps</h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal pl-5">
            {page.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {page.faqs.map((faq, i) => (
                <details key={i} className="group border-b border-gray-100 dark:border-gray-800 pb-4">
                  <summary className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600">{faq.question}</summary>
                  <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Related Calculators */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Use These Free Calculators</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {page.calculatorLinks.map((slug) => (
              <Link
                key={slug}
                href={`/calculators/${slug}`}
                className="p-4 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium text-sm transition-colors"
              >
                {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} →
              </Link>
            ))}
          </div>
        </div>

        {/* Supporting Articles */}
        {page.supportingLinks.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Read More</h2>
            <div className="space-y-2">
              {page.supportingLinks.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors"
                >
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>
        )}

        <YMYLDisclaimer />
        <LastReviewedBy />
      </div>
    </div>
  );
}
