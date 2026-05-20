import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";

export const metadata: Metadata = {
  title: "About the Founder",
  description:
    "Qasem Mohammed — AI & Software Engineer, Founder of QFINHUB. Building free, accurate financial calculators with 8+ years of software engineering experience.",
  alternates: {
    canonical: "https://www.qfinhub.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Structured Data — Enhanced Person Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Qasem Mohammed",
            url: "https://qfinhub.com/about",
            jobTitle: "AI & Software Engineer, Founder & Lead Developer",
            worksFor: {
              "@type": "Organization",
              name: "QFINHUB",
              url: "https://www.qfinhub.com",
            },
            description:
              "AI and Software Engineer, Founder and Developer of QFINHUB — a free financial calculator platform with 124+ tools serving users worldwide.",
            image: "https://www.qfinhub.com/images/author/qasem-mohammed.jpg",
            knowsAbout: [
              "Financial Modeling",
              "Software Engineering",
              "Artificial Intelligence",
              "Quantitative Analysis",
              "Full-Stack Development",
              "Algorithm Design",
            ],
            alumniOf: {
              "@type": "EducationalOrganization",
              name: "Computer Science & Engineering",
            },
            sameAs: [
              "https://www.linkedin.com/in/qasem-mohammed",
              "https://github.com/qasem-mohammed",
              "https://x.com/qfinhub",
            ],
            hasCredential: [
              {
                "@type": "EducationalOccupationalCredential",
                name: "AI & Machine Learning Specialization",
                recognizedBy: {
                  "@type": "Organization",
                  name: "DeepLearning.AI",
                },
              },
              {
                "@type": "EducationalOccupationalCredential", 
                name: "Full-Stack Software Development",
                recognizedBy: {
                  "@type": "Organization",
                  name: "Meta",
                },
              },
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Author Photo */}
            <div className="shrink-0">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-lg">
                <Image
                  src="/images/author/qasem-mohammed.jpg"
                  alt="Qasem Mohammed — Founder of QFINHUB"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Name & Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Qasem Mohammed
              </h1>
              <p className="mt-2 text-lg text-blue-600 dark:text-blue-400 font-semibold">
                AI & Software Engineer
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                Founder & Lead Developer, QFINHUB
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  AI Engineering
                </Badge>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Financial Modeling
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Full-Stack Development
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Quantitative Analysis
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Professional Summary
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p>
              I&apos;m an <strong>AI and Software Engineer</strong> with over 8
              years of experience building data-driven applications,
              financial modeling tools, and AI-powered content systems. As the{" "}
              <strong>Founder and Developer of QFINHUB</strong>, I built all 124+
              financial calculators from the ground up — designing the
              algorithms, implementing the user interfaces, and developing the
              automated content generation systems that power the platform.
            </p>
            <p>
              My work sits at the intersection of{" "}
              <strong>software engineering, quantitative finance, and artificial
              intelligence</strong>. I specialize in building systems that make
              complex financial calculations accessible to everyone — no sign-up,
              no paywalls, no ads that compromise the user experience.
            </p>
          </div>
        </section>

        {/* Background & Education */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Background & Education
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p>
              My journey into financial technology began with a deep curiosity
              about how software can simplify complex decisions. I hold a
              Bachelor&apos;s degree in Software Engineering and have spent my
              career building systems that process data at scale — from
              algorithmic trading dashboards to AI-driven content generation
              pipelines.
            </p>
            <p>
              Beyond formal education, I&apos;m a self-taught quantitative
              analyst with extensive study in financial mathematics, including:
            </p>
            <ul>
              <li>Time value of money and discounted cash flow analysis</li>
              <li>Mortgage amortization and loan structuring</li>
              <li>Compound interest modeling and retirement planning</li>
              <li>Tax calculation methodologies and regulatory frameworks</li>
              <li>Risk assessment and portfolio optimization</li>
            </ul>
          </div>
        </section>

        {/* Why QFINHUB */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why I Built QFINHUB
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p>
              I built QFINHUB because I believe accurate financial tools should
              be <strong>free and accessible to everyone</strong>. Too many
              financial platforms hide their calculators behind paywalls,
              require sign-ups, or serve results wrapped in confusing
              advertisements. I wanted to build something different — a clean,
              accurate, and comprehensive calculator platform that anyone can
              use, anywhere, on any device.
            </p>
            <p>
              Every calculator on QFINHUB was personally reviewed by me for
              accuracy before publication. The formulas are based on standard
              financial mathematics — the same equations used by banks, mortgage
              lenders, and financial institutions — and are cross-referenced
              against authoritative sources including IRS publications, CFPB
              guidelines, and Federal Reserve data.
            </p>
          </div>
        </section>

        {/* Methodology & Accuracy */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Methodology & Accuracy Commitment
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p>
              I personally review every calculator on QFINHUB. Here&apos;s how
              I ensure accuracy:
            </p>
            <ol>
              <li>
                <strong>Formula Verification:</strong> Every calculation uses
                industry-standard financial formulas — verified against
                authoritative sources like IRS Publication 936, CFPB mortgage
                guidelines, and Federal Reserve statistical releases.
              </li>
              <li>
                <strong>Edge Case Testing:</strong> Each calculator is tested
                with boundary values (zero, negative, extremely large numbers) to
                ensure graceful handling.
              </li>
              <li>
                <strong>Cross-Validation:</strong> Results are cross-checked
                against manual calculations and trusted third-party tools.
              </li>
              <li>
                <strong>Regular Updates:</strong> Calculators are updated when
                tax laws change, interest rate environments shift, or new
                financial regulations take effect.
              </li>
            </ol>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              📋 Read our full{" "}
              <Link
                href="/editorial-policy"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Editorial Policy
              </Link>{" "}
              for details on our content creation and review process.
            </p>
          </div>
        </section>

        {/* Technical Expertise */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Technical Expertise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "AI & Machine Learning",
                desc: "Designing and deploying LLM-powered content generation systems, automated SEO pipelines, and intelligent financial analysis tools.",
              },
              {
                title: "Full-Stack Development",
                desc: "Building production-grade web applications with Next.js, TypeScript, Python, and modern cloud infrastructure (Vercel, Supabase).",
              },
              {
                title: "Financial Algorithms",
                desc: "Implementing complex financial models — amortization schedules, compound interest projections, tax calculations, and retirement planning.",
              },
              {
                title: "Programmatic SEO",
                desc: "Developing systems that generate thousands of unique, high-quality pages optimized for search engines while maintaining editorial standards.",
              },
              {
                title: "Quantitative Analysis",
                desc: "Applying mathematical and statistical methods to financial data — modeling scenarios, analyzing trends, and optimizing outcomes.",
              },
              {
                title: "Content Systems",
                desc: "Building automated editorial workflows that produce 500+ unique, reviewed, and schema-optimized content pages per day.",
              },
            ].map((skill) => (
              <div
                key={skill.title}
                className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {skill.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Statistics */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            QFINHUB by the Numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "124+", label: "Calculators" },
              { value: "1,700+", label: "Pages Indexed" },
              { value: "33", label: "Languages" },
              { value: "100%", label: "Free Forever" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <YMYLDisclaimer />
      </div>
    </div>
  );
}
