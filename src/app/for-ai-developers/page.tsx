import type { Metadata } from "next";
import { Code2, Link2, Puzzle, Brain, Globe, Download, Copy, ExternalLink } from "lucide-react";
import { getCalculatorBySlug } from "@/lib/calculators";

export const metadata: Metadata = {
  title: "For AI Developers — Embed Free Financial Calculators",
  description:
    "Give your LLM, AI agent, or chatbot accurate financial calculations. Embed QFINHUB calculators via iframe, URL params, or JSON-LD. Designed for AI engineers building with ChatGPT, Claude, Gemini, and custom LLMs.",
  openGraph: {
    title: "For AI Developers — Embed Free Financial Calculators | QFINHUB",
    description:
      "Accurate financial math for your AI. Iframe embeds, URL parameter API, and JSON-LD structured data for LLM integration.",
  },
  alternates: {
    canonical: "https://www.qfinhub.com/for-ai-developers",
  },
};

const TOP_CALCULATORS = [
  { slug: "mortgage-calculator", title: "Mortgage Calculator" },
  { slug: "compound-interest", title: "Compound Interest" },
  { slug: "retirement-planning", title: "Retirement Planning" },
  { slug: "loan-calculator", title: "Loan Calculator" },
  { slug: "debt-payoff", title: "Debt Payoff" },
  { slug: "budget-planner", title: "Budget Planner" },
  { slug: "auto-loan", title: "Auto Loan" },
  { slug: "savings-goal", title: "Savings Goal" },
  { slug: "net-worth", title: "Net Worth" },
  { slug: "investment-return", title: "Investment Return" },
  { slug: "tax-calculator", title: "Tax Calculator" },
  { slug: "roi-calculator", title: "ROI Calculator" },
];

export default function ForAIDevelopersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Brain className="h-4 w-4" />
            Built for AI Engineers & LLM Developers
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Give Your AI Accurate
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              {" "}Financial Calculations
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
            LLMs hallucinate math. QFINHUB doesn&apos;t. Embed our calculators in your
            AI agent, chatbot, or application — accurate results every time,
            zero API keys required.
          </p>
        </div>
      </section>

      {/* Integration Methods */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-zinc-900">
          Three Ways to Integrate
        </h2>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Method 1: Iframe */}
          <div className="card-premium p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
              1. Iframe Embed
            </h3>
            <p className="mb-4 text-sm text-zinc-600">
              Drop a calculator into any HTML page. Responsive, styled, and works
              everywhere — blogs, dashboards, AI chat UIs.
            </p>
            <div className="rounded-lg bg-zinc-900 p-4">
              <pre className="text-xs text-green-400 overflow-x-auto">
{`<iframe
  src="https://www.qfinhub.com/widgets/embed/mortgage-calculator"
  width="100%"
  height="600"
  style="border:1px solid #e4e4e7;border-radius:12px"
  title="Free Mortgage Calculator"
></iframe>`}
              </pre>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Works with ChatGPT Plugins, Claude Artifacts, custom GPTs, and any
              HTML-rendering LLM interface.
            </p>
          </div>

          {/* Method 2: URL params */}
          <div className="card-premium p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Link2 className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
              2. Direct URL Linking
            </h3>
            <p className="mb-4 text-sm text-zinc-600">
              Link directly to calculators. LLMs can generate URLs that open
              pre-filled calculators for users.
            </p>
            <div className="rounded-lg bg-zinc-900 p-4">
              <pre className="text-xs text-green-400 overflow-x-auto">
{`https://www.qfinhub.com/calculators/
  mortgage-calculator`}
              </pre>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Have your LLM output a direct link. Users click once and see their
              calculation — no hallucinated numbers.
            </p>
          </div>

          {/* Method 3: JSON-LD */}
          <div className="card-premium p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Puzzle className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
              3. Structured Data
            </h3>
            <p className="mb-4 text-sm text-zinc-600">
              Every calculator page includes JSON-LD structured data
              (SoftwareApplication + HowTo schema). AI crawlers parse this
              automatically.
            </p>
            <div className="rounded-lg bg-zinc-900 p-4">
              <pre className="text-xs text-green-400 overflow-x-auto">
{`{
  "@type": "SoftwareApplication",
  "name": "Mortgage Calculator",
  "applicationCategory":
    "FinanceApplication",
  "url": "https://qfinhub.com/
    calculators/mortgage-calculator"
}`}
              </pre>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Google AI Overviews, ChatGPT browsing, and Perplexity all
              read JSON-LD to understand calculator capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Available Calculators */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
            Available Embeddable Calculators
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOP_CALCULATORS.map((calc) => (
              <a
                key={calc.slug}
                href={`/widgets/embed/${calc.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-premium flex items-center justify-between p-4"
              >
                <span className="text-sm font-medium text-zinc-900">
                  {calc.title}
                </span>
                <ExternalLink className="h-4 w-4 text-zinc-400" />
              </a>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a
              href="/widgets"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all 124 embeddable calculators →
            </a>
          </div>
        </div>
      </section>

      {/* Why QFINHUB for AI */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          Why AI Engineers Choose QFINHUB
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Brain,
              title: "No Hallucination",
              desc: "LLMs guess math — QFINHUB computes it. Every result is calculated by verified financial formulas, not statistical token prediction.",
            },
            {
              icon: Globe,
              title: "Zero API Keys",
              desc: "No registration, no API tokens, no rate limits. Copy an iframe tag and you're done. Works in any environment.",
            },
            {
              icon: Download,
              title: "Export-Ready",
              desc: "Users can download results as PDF or image. Your AI provides the link, QFINHUB handles the output.",
            },
            {
              icon: Copy,
              title: "Copy-Paste Simple",
              desc: "One iframe tag. That's it. No SDK, no npm install, no backend. Your AI just needs to output HTML.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-premium p-6">
                <Icon className="mb-3 h-6 w-6 text-blue-600" />
                <h3 className="mb-2 text-base font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
            Use Cases
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "ChatGPT Custom GPTs",
                desc: "Add a mortgage calculator action to your custom GPT. Users get accurate home affordability estimates without leaving the chat.",
              },
              {
                title: "Claude Artifacts",
                desc: "Embed a compound interest calculator in a Claude Artifact. Interactive charts update as users adjust their inputs.",
              },
              {
                title: "AI-Powered Finance Apps",
                desc: "Use QFINHUB calculators as the math engine for your AI finance app. Your AI handles the conversation, we handle the numbers.",
              },
              {
                title: "LLM Agent Tool Use",
                desc: "Give your LLM agent a 'calculate_mortgage' tool by linking to QFINHUB. The agent provides the link, users get accurate results.",
              },
            ].map((useCase) => (
              <div key={useCase.title} className="card-premium p-5">
                <h3 className="mb-1.5 text-sm font-semibold text-zinc-900">
                  {useCase.title}
                </h3>
                <p className="text-sm text-zinc-600">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to Give Your AI Real Math?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-200">
          Browse our 124 embeddable calculators and start integrating in under 60
          seconds.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="/widgets"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-900 shadow-lg transition-all hover:bg-blue-50 active:scale-[0.98]"
          >
            <Code2 className="h-5 w-5" />
            Browse Widgets
          </a>
          <a
            href="/calculators"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            Explore All Calculators
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
