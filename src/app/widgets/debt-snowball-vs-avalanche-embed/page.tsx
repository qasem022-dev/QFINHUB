/**
 * /widgets/debt-snowball-vs-avalanche-embed — Widget Landing Page
 *
 * SEO landing page for the embeddable Debt Snowball vs Avalanche comparison.
 * Shows both calculators live side-by-side with comparison content.
 *
 * SEO: index,follow | self-canonical | in sitemap
 * Schema: WebApplication + FAQPage + BreadcrumbList
 */
import type { Metadata } from "next";
import Link from "next/link";
import { EmbedCodeBox } from "@/components/widgets/embed-code-box";

const embedCode = `<iframe
  src="https://www.qfinhub.com/widgets/embed/debt-snowball"
  width="49%"
  height="600"
  style="border:0;max-width:100%;min-width:300px;"
  loading="lazy"
  title="Debt Snowball Calculator">
</iframe>
<iframe
  src="https://www.qfinhub.com/widgets/embed/debt-payoff"
  width="49%"
  height="600"
  style="border:0;max-width:100%;min-width:300px;"
  loading="lazy"
  title="Debt Avalanche Calculator">
</iframe>`;

const singleEmbedCode = `<iframe
  src="https://www.qfinhub.com/widgets/embed/debt-payoff"
  width="100%"
  height="650"
  style="border:0;max-width:100%;"
  loading="lazy"
  title="Debt Payoff Calculator (Snowball + Avalanche)">
</iframe>`;

export const metadata: Metadata = {
  title: "Free Debt Snowball vs Avalanche Calculator Widget — Embed on Your Site",
  description:
    "Embed a free side-by-side Debt Snowball vs Avalanche comparison calculator on your website. Help readers see exactly which debt payoff method saves more — personalized results, no signup, 100% free.",
  keywords: [
    "debt snowball vs avalanche",
    "debt payoff calculator",
    "embed debt calculator",
    "free widget",
    "debt repayment tool",
    "snowball method",
    "avalanche method",
    "personal finance widget",
  ],
  robots: "index, follow",
  alternates: {
    canonical: "https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed",
  },
  openGraph: {
    title: "Free Debt Snowball vs Avalanche Calculator Widget — Embed on Your Site",
    description:
      "Embed a free side-by-side comparison calculator for the two most popular debt repayment methods. Personalized results, zero data collection.",
    url: "https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed",
    type: "website",
  },
};

export default function DebtSnowballVsAvalancheWidgetPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.qfinhub.com/" },
              { "@type": "ListItem", position: 2, name: "Widgets", item: "https://www.qfinhub.com/widgets" },
              { "@type": "ListItem", position: 3, name: "Debt Snowball vs Avalanche Widget", item: "https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed" },
            ],
          }),
        }}
      />

      {/* WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Debt Snowball vs Avalanche Comparison Widget",
            url: "https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed",
            description: "Free embeddable side-by-side comparison calculator for debt snowball and avalanche repayment methods.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            author: {
              "@type": "Person",
              name: "Qasem Mohammed",
              url: "https://qfinhub.com/about",
            },
          }),
        }}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is the debt snowball vs avalanche widget free to use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, the widget is 100% free. No signup required, no personal data collected, no usage limits.",
                },
              },
              {
                "@type": "Question",
                name: "How do I embed this widget on my website?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Copy the iframe code from this page and paste it into your website's HTML. It works with WordPress, Squarespace, Wix, Webflow, and any other platform that supports custom HTML.",
                },
              },
              {
                "@type": "Question",
                name: "What's the difference between snowball and avalanche methods?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Debt Snowball pays off the smallest balance first for quick psychological wins. Debt Avalanche pays off the highest interest rate first to save the most money in interest. Our widget lets readers compare both methods with their actual numbers.",
                },
              },
              {
                "@type": "Question",
                name: "Does the widget collect user data?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. The widget does not collect, store, or transmit any personal data. All calculations happen in the user's browser.",
                },
              },
              {
                "@type": "Question",
                name: "Can I customize the widget size?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, adjust the height and width attributes in the iframe code. We recommend at least 600px height. For a single calculator, use the single-calculator embed code (100% width).",
                },
              },
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Free Debt Snowball vs Avalanche Calculator Widget
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          Embed a side-by-side debt repayment comparison calculator on your website. Help your readers
          see exactly which method — snowball or avalanche — will save them more money and get them
          debt-free faster. No signup, no data collection, 100% free.
        </p>
      </div>

      {/* Live Preview — Side by Side */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Live Preview — Side-by-Side Comparison
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-900/30">
                🏆 Debt Snowball Method (Smallest Balance First)
              </div>
              <iframe
                src="/embed/debt-snowball"
                width="100%"
                height="600"
                style={{ border: 0 }}
                loading="lazy"
                title="Debt Snowball Calculator — Live Preview"
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-900/30">
                💰 Debt Avalanche Method (Highest APR First)
              </div>
              <iframe
                src="/embed/debt-payoff"
                width="100%"
                height="600"
                style={{ border: 0 }}
                loading="lazy"
                title="Debt Avalanche Calculator — Live Preview"
                className="w-full"
              />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          ↑ These are the actual embeddable calculators. Try entering your debts to see which method works best for you.
        </p>
      </section>

      {/* Embed Code — Side by Side */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Embed Code — Side-by-Side Comparison
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Copy and paste this code to show both methods side by side on desktop. On mobile, they stack automatically.
        </p>
        <EmbedCodeBox code={embedCode} label="Side-by-Side Embed Code (Snowball + Avalanche)" />
      </section>

      {/* Embed Code — Single */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Embed Code — Single Calculator
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Prefer a single calculator that covers both methods? Use this code — the debt payoff calculator handles both snowball and avalanche strategies.
        </p>
        <EmbedCodeBox code={singleEmbedCode} label="Single Calculator Embed Code" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Works with WordPress, Squarespace, Wix, Webflow, and any platform that supports custom HTML.
          Adjust <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">height</code> as needed
          — we recommend 600px minimum.
        </p>
      </section>

      {/* What the Widget Does */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          What This Widget Does
        </h2>
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p>
            The Debt Snowball vs Avalanche Widget lets your readers compare the two most popular
            debt repayment strategies side by side:
          </p>
          <ul className="mt-3 space-y-1">
            <li><strong>Debt Snowball:</strong> Pay off your smallest debt first for quick psychological wins. As each debt is eliminated, you roll that payment into the next one — building momentum like a snowball.</li>
            <li><strong>Debt Avalanche:</strong> Pay off your highest-interest debt first to minimize total interest paid. This mathematically saves the most money, though it may take longer to see your first debt eliminated.</li>
          </ul>
          <p>
            Readers enter their actual debts (balance, interest rate, minimum payment) and see a personalized comparison:
            payoff date, total interest paid, and total amount paid for BOTH methods. The widget handles
            up to 8 debts and shows a month-by-month payoff timeline.
          </p>
        </div>
      </section>

      {/* Snowball vs Avalanche Explanation */}
      <section className="mb-12 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Snowball vs Avalanche at a Glance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">Feature</th>
                <th className="px-3 py-2 text-left font-semibold text-emerald-700 dark:text-emerald-300">Debt Snowball</th>
                <th className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-300">Debt Avalanche</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">Priority Order</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Smallest balance first</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Highest APR first</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">Best For</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Motivation & quick wins</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Saving maximum money</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">Interest Saved</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Less (but still significant)</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Most possible</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">Speed of First Win</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Fast — smallest debt eliminated quickly</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">Slower — highest-rate debt may be large</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Who Can Use It */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Who Can Use This Widget
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Personal Finance Bloggers", desc: "Add an interactive comparison tool to your debt payoff guides — readers can test both methods with their own numbers." },
            { title: "Debt-Free Communities", desc: "Perfect for blogs and forums helping people escape debt. The visual comparison is more persuasive than just explaining the math." },
            { title: "Credit Counselors", desc: "Use the widget on educational resource pages to help clients understand their debt repayment options." },
            { title: "Financial Literacy Educators", desc: "A hands-on classroom tool for teaching debt repayment strategies. Students can experiment with different scenarios." },
            { title: "FIRE Bloggers", desc: "Debt elimination is step 1 of FIRE. Show your readers exactly which method gets them to step 2 faster." },
            { title: "Credit Union Education Pages", desc: "Add this widget to your member education section — practical tools build trust and engagement." },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-primary-100 bg-primary-50/50 p-4 dark:border-primary-900/30 dark:bg-primary-900/10"
            >
              <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-primary-700 dark:text-primary-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Embed It */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Why Embed This Calculator?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Keep Visitors Engaged", desc: "Instead of linking away, give readers a working calculator right on your page. They stay longer and interact more." },
            { title: "100% Free, No Signup", desc: "No registration, no API keys, no paid tiers. Just copy and paste the embed code." },
            { title: "No User Data Collected", desc: "All calculations run in the visitor's browser. We never collect, store, or share any data." },
            { title: "Mobile Responsive", desc: "Works perfectly on phones, tablets, and desktops. Calculators stack vertically on mobile." },
            { title: "Always Accurate", desc: "Uses standard amortization math. Handles up to 8 debts with different rates and balances." },
            { title: "Clean, Neutral Design", desc: "Minimal styling that blends naturally with most website designs." },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark-elevated"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Is this widget really free?",
              a: "Yes, 100% free. No paid tiers, no usage limits, no hidden fees. The attribution link helps readers discover QFINHUB's other free financial calculators.",
            },
            {
              q: "How do I add this to my WordPress site?",
              a: "In the WordPress editor, add a 'Custom HTML' block and paste the iframe code. The widget appears exactly where you place it. Works with both Classic and Gutenberg editors.",
            },
            {
              q: "Which calculator should I embed — side-by-side or single?",
              a: "Side-by-side is great for wide layouts (desktop). The single calculator handles both methods in one widget and works better on narrow layouts. Many publishers choose the single widget for simplicity.",
            },
            {
              q: "Can I change the colors to match my site?",
              a: "The widget uses neutral colors designed to blend with most sites. It automatically supports light and dark mode based on the visitor's system preference.",
            },
            {
              q: "Does this slow down my website?",
              a: "No. The iframe loads asynchronously (loading='lazy') and doesn't block your page from rendering. The widget is lightweight.",
            },
            {
              q: "How many debts can the calculator handle?",
              a: "The widget handles up to 8 debts with different balances, interest rates, and minimum payments. It shows a complete payoff timeline for each method.",
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="group rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark-elevated"
            >
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {faq.q}
                <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Related Tools & Internal Links */}
      <section className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Related Calculators & Guides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/calculators/debt-payoff"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Full Debt Payoff Calculator →
          </Link>
          <Link
            href="/calculators/debt-snowball"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Debt Snowball Calculator →
          </Link>
          <Link
            href="/decision/snowball-vs-avalanche-which-wins"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Snowball vs Avalanche: Which Wins? Guide →
          </Link>
          <Link
            href="/calculators/credit-card-payoff"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Credit Card Payoff Calculator →
          </Link>
          <Link
            href="/decision/pay-off-debt-or-invest"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Pay Off Debt or Invest? Guide →
          </Link>
          <Link
            href="/calculators"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            All 125+ Free Calculators →
          </Link>
        </div>
      </section>

      {/* No Data Collection Notice */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
        <p className="text-sm text-green-800 dark:text-green-300">
          🔒 <strong>Privacy first:</strong> This widget does not collect, store, or transmit any
          personal data. All calculations happen entirely in your visitor's browser. No signup
          required. No cookies set by the widget. No tracking.
        </p>
      </div>

      {/* Contact CTA for Publishers */}
      <section className="mt-12 rounded-xl bg-primary-600 p-8 text-center text-white dark:bg-primary-700">
        <h2 className="text-2xl font-bold">Want This Widget on Your Site?</h2>
        <p className="mt-2 text-primary-100">
          Copy the embed code above or contact us for help with customization, sizing, or embedding across multiple pages.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:q.finhub@gmail.com?subject=Debt%20Snowball%20vs%20Avalanche%20Widget%20for%20My%20Site"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
          >
            Email Us About Embedding →
          </a>
          <Link
            href="/contact"
            className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Contact Form →
          </Link>
        </div>
      </section>
    </div>
  );
}
