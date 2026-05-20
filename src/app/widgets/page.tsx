import { allCalculators } from "@/lib/calculators";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";
import type { Metadata } from "next";
import { WidgetCard } from "./widget-card";

export const metadata: Metadata = {
  title: "Free Embeddable Financial Calculator Widgets",
  description:
    "Add free financial calculators to your website in seconds. Copy-paste iframe embed codes for mortgage, compound interest, retirement, and 100+ calculators. No sign-up, completely free.",
  openGraph: {
    title: "Free Embeddable Financial Calculator Widgets — QFINHUB",
    description:
      "Embed free financial calculators on your blog, finance site, or WordPress. Mortgages, investing, retirement, debt, taxes, and more. Just copy and paste.",
  },
  alternates: {
    canonical: "https://www.qfinhub.com/widgets",
  },
};

// Top embeddable calculators (most popular ones)
const EMBEDDABLE_CALCULATORS = [
  "mortgage-calculator",
  "compound-interest",
  "retirement-planning",
  "loan-calculator",
  "debt-payoff",
  "budget-planner",
  "auto-loan",
  "savings-goal",
  "net-worth",
  "investment-return",
  "tax-calculator",
  "roi-calculator",
];

export default function WidgetsPage() {
  const embeddable = allCalculators.filter((c) =>
    EMBEDDABLE_CALCULATORS.includes(c.slug)
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Free Embeddable Financial Calculator Widgets
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto mb-8">
            Add powerful financial calculators to your website in 30 seconds.
            Copy the embed code, paste into your HTML, done. No API key, no
            sign-up, completely free.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-zinc-500">
            <span className="bg-zinc-100 px-3 py-1 rounded-full">
              ✅ No sign-up required
            </span>
            <span className="bg-zinc-100 px-3 py-1 rounded-full">
              📱 Mobile responsive
            </span>
            <span className="bg-zinc-100 px-3 py-1 rounded-full">
              🎨 Matches your site style
            </span>
            <span className="bg-zinc-100 px-3 py-1 rounded-full">
              ⚡ Lightweight iframe
            </span>
          </div>
        </div>
      </section>

      {/* Widget Grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">
          Available Widgets ({embeddable.length})
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {embeddable.map((calc) => (
            <WidgetCard key={calc.slug} calculator={calc} />
          ))}
        </div>
      </section>

      {/* How to Use */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">
            How to Embed a Calculator
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white rounded-xl p-6 border border-zinc-200">
              <div className="text-3xl mb-3">1️⃣</div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Pick a Calculator
              </h3>
              <p className="text-sm text-zinc-600">
                Choose from 12 popular financial calculators — mortgages, investing,
                retirement, debt, and more.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-zinc-200">
              <div className="text-3xl mb-3">2️⃣</div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Copy the Code
              </h3>
              <p className="text-sm text-zinc-600">
                Click "Copy Embed Code" on any widget card. The iframe code is
                automatically copied to your clipboard.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-zinc-200">
              <div className="text-3xl mb-3">3️⃣</div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Paste & Publish
              </h3>
              <p className="text-sm text-zinc-600">
                Paste into your blog post, WordPress page, or any HTML. The
                calculator works instantly — no backend needed.
              </p>
            </div>
          </div>

          {/* Example code */}
          <div className="mt-10 bg-zinc-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
              {`<!-- Example: Add this to your HTML -->\n<iframe\n  src="https://www.qfinhub.com/widgets/embed/mortgage-calculator"\n  width="100%"\n  height="600"\n  frameborder="0"\n  title="Free Mortgage Calculator"\n  style="border: 1px solid #e4e4e7; border-radius: 12px;"\n></iframe>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">
          Who Uses These Widgets?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
          {[
            {
              title: "Finance Bloggers",
              desc: "Add interactive mortgage and investing calculators to finance blog posts for higher engagement.",
            },
            {
              title: "Real Estate Agents",
              desc: "Embed mortgage affordability and refinance calculators on property listing pages.",
            },
            {
              title: "WordPress Sites",
              desc: "Paste into any WordPress page or post. Works with Gutenberg, Elementor, and classic editor.",
            },
            {
              title: "Financial Advisors",
              desc: "Add retirement, savings, and net worth calculators to client-facing websites.",
            },
          ].map((useCase) => (
            <div
              key={useCase.title}
              className="bg-white rounded-xl p-6 border border-zinc-200"
            >
              <h3 className="font-semibold text-zinc-900 mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-zinc-600">{useCase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes, completely free. No API keys, no sign-ups, no hidden costs. Just copy and paste the embed code.",
              },
              {
                q: "Does it work on mobile?",
                a: "Yes, all widgets are fully responsive and work on phones, tablets, and desktops.",
              },
              {
                q: "Can I customize the appearance?",
                a: "You can adjust the iframe width and height. The calculator uses a clean, neutral design that fits most sites.",
              },
              {
                q: "Will it slow down my site?",
                a: "No. The iframe loads asynchronously and doesn't block your page rendering. It's a lightweight component without heavy dependencies.",
              },
              {
                q: "Do you get my users' data?",
                a: "No. All calculations happen in the browser. QFINHUB does not collect, store, or track any data entered into embedded calculators.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="bg-white rounded-xl border border-zinc-200 group"
              >
                <summary className="px-6 py-4 cursor-pointer font-medium text-zinc-900 hover:text-zinc-700 transition-colors">
                  {faq.q}
                </summary>
                <div className="px-6 pb-4 text-sm text-zinc-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
