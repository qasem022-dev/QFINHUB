/**
 * /widgets/mortgage-affordability-embed — Widget Landing Page
 *
 * SEO landing page for the embeddable mortgage affordability calculator.
 * Includes live preview, embed code generator, use cases, FAQ, and internal links.
 *
 * SEO: index,follow | self-canonical | in sitemap
 * Schema: WebApplication + FAQPage + BreadcrumbList
 */
import type { Metadata } from "next";
import Link from "next/link";
import { EmbedCodeBox } from "@/components/widgets/embed-code-box";

const embedCode = `<iframe
  src="https://www.qfinhub.com/embed/mortgage-affordability"
  width="100%"
  height="650"
  style="border:0;max-width:100%;"
  loading="lazy"
  title="Mortgage Affordability Calculator">
</iframe>`;

export const metadata: Metadata = {
  title: "Free Mortgage Affordability Calculator Widget — Embed on Your Site",
  description:
    "Embed a free, mobile-responsive mortgage affordability calculator on your website. Help your readers figure out how much house they can afford — no signup, no data collection, 100% free.",
  keywords: [
    "mortgage affordability calculator",
    "embed calculator",
    "free widget",
    "home affordability tool",
    "mortgage calculator widget",
    "real estate calculator embed",
  ],
  robots: "index, follow",
  alternates: {
    canonical: "https://www.qfinhub.com/widgets/mortgage-affordability-embed",
  },
  openGraph: {
    title: "Free Mortgage Affordability Calculator Widget — Embed on Your Site",
    description:
      "Embed a free, mobile-responsive mortgage affordability calculator on your website. Helps readers determine how much house they can afford.",
    url: "https://www.qfinhub.com/widgets/mortgage-affordability-embed",
    type: "website",
  },
};

export default function MortgageAffordabilityWidgetPage() {
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
              { "@type": "ListItem", position: 3, name: "Mortgage Affordability Widget", item: "https://www.qfinhub.com/widgets/mortgage-affordability-embed" },
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
            name: "Mortgage Affordability Calculator Widget",
            url: "https://www.qfinhub.com/widgets/mortgage-affordability-embed",
            description: "Free embeddable mortgage affordability calculator for websites. Determines how much house a user can afford based on income, debts, and down payment.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            author: {
              "@type": "Person",
              name: "Qasem Mohammed",
              url: "https://www.qfinhub.com/about",
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
                name: "Is the mortgage affordability widget free to use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, the widget is 100% free. No signup required, no personal data collected, and no usage limits.",
                },
              },
              {
                "@type": "Question",
                name: "How do I embed the mortgage affordability calculator on my website?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Copy the iframe code from this page and paste it into your website's HTML where you want the calculator to appear. It works with WordPress, Squarespace, Wix, and any other platform that supports custom HTML.",
                },
              },
              {
                "@type": "Question",
                name: "Is the widget mobile-friendly?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, the widget is fully responsive and works on all screen sizes — desktop, tablet, and mobile.",
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
                name: "Can I customize the widget's appearance?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The widget inherits your site's font and background. You can adjust the iframe height and width to fit your layout. The design is clean and neutral to blend with most website styles.",
                },
              },
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Free Mortgage Affordability Calculator Widget
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          Embed a fully functional mortgage affordability calculator on your website. Help your readers
          determine how much house they can afford — with live calculations, no signup required,
          and zero data collection.
        </p>
      </div>

      {/* Live Preview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Live Preview
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden">
          <iframe
            src="/embed/mortgage-affordability"
            width="100%"
            height="700"
            style={{ border: 0 }}
            loading="lazy"
            title="Mortgage Affordability Calculator — Live Preview"
            className="w-full"
          />
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          ↑ This is the actual embeddable calculator. Try it — adjust income, debts, and down payment
          to see real-time results.
        </p>
      </section>

      {/* Embed Code */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Embed Code
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Copy and paste this code into your website's HTML where you want the calculator to appear.
        </p>
        <EmbedCodeBox code={embedCode} label="iframe Embed Code" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Works with WordPress, Squarespace, Wix, Webflow, and any platform that supports custom HTML.
          Adjust the <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">height</code> attribute
          if needed — we recommend 650px minimum.
        </p>
      </section>

      {/* What the Widget Does */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          What This Widget Does
        </h2>
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p>
            The Mortgage Affordability Calculator Widget helps your website visitors instantly
            determine the maximum home price they can afford. It uses standard lending guidelines —
            the 28% front-end and 36% back-end debt-to-income (DTI) ratios — to calculate an
            affordable home price based on:
          </p>
          <ul className="mt-3 space-y-1">
            <li>Annual household income</li>
            <li>Existing monthly debt payments (credit cards, car loans, student loans)</li>
            <li>Down payment percentage</li>
            <li>Current mortgage interest rate</li>
            <li>Loan term (15-year, 30-year, or custom)</li>
          </ul>
          <p>
            Results include the affordable home price, maximum loan amount, estimated monthly
            payment, front-end and back-end DTI ratios, and a visual income allocation breakdown.
          </p>
        </div>
      </section>

      {/* Who Can Use It */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Who Can Use This Widget
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Personal Finance Bloggers", desc: "Add value to your homebuying guides with an interactive calculator your readers can use without leaving your site." },
            { title: "Real Estate Agents", desc: "Help potential buyers understand their budget before they start looking at homes." },
            { title: "Mortgage Brokers", desc: "Give prospective borrowers a quick affordability estimate before they apply." },
            { title: "Credit Unions & Banks", desc: "Add a helpful tool to your mortgage education or resource pages." },
            { title: "First-Time Homebuyer Blogs", desc: "Guide new buyers through the most important first step: knowing their budget." },
            { title: "Financial Literacy Sites", desc: "A practical, hands-on tool for teaching DTI ratios and home affordability concepts." },
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
            { title: "Keep Visitors on Your Site", desc: "Instead of linking away to a calculator, give readers the tool right on your page. They stay longer and engage more." },
            { title: "100% Free, No Signup", desc: "No registration, no API keys, no paid plans. Just copy and paste one line of HTML." },
            { title: "No User Data Collected", desc: "All calculations happen in the visitor's browser. We never collect, store, or share any data." },
            { title: "Mobile Responsive", desc: "Works perfectly on phones, tablets, and desktops. The layout adapts automatically to any screen size." },
            { title: "Always Up to Date", desc: "The widget uses current lending guidelines (28%/36% DTI ratios). No outdated formulas." },
            { title: "Clean, Neutral Design", desc: "Minimal styling that blends naturally with most website designs. No distracting branding." },
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
              q: "Is the mortgage affordability widget really free?",
              a: "Yes, 100% free. There are no paid tiers, no usage limits, and no hidden fees. We built this to be a genuinely useful free tool — the attribution link helps people discover QFINHUB's other free calculators.",
            },
            {
              q: "How do I add this to my WordPress site?",
              a: "In the WordPress editor, add a 'Custom HTML' block and paste the iframe code. The widget will appear exactly where you place the block. It works with both the Classic and Block (Gutenberg) editors.",
            },
            {
              q: "Can I change the colors or styling?",
              a: "The widget uses neutral colors designed to blend with most sites. If you need custom styling, the iframe approach means the widget is isolated from your CSS — but it does support light and dark mode automatically based on your visitor's system preference.",
            },
            {
              q: "What if my readers have questions about the results?",
              a: "The calculator uses standard mortgage lending formulas (28%/36% DTI ratios). Results are estimates and should not be considered financial advice. We recommend adding a note encouraging readers to consult with a mortgage professional.",
            },
            {
              q: "Does this slow down my website?",
              a: "No. The iframe loads asynchronously (notice the loading='lazy' attribute) and does not block your page from rendering. The widget itself is lightweight and loads quickly.",
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
            href="/calculators/mortgage-affordability"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Full Mortgage Affordability Calculator →
          </Link>
          <Link
            href="/calculators/mortgage-calculator"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Mortgage Payment Calculator →
          </Link>
          <Link
            href="/decision/how-much-house-can-i-afford"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            How Much House Can I Afford? Guide →
          </Link>
          <Link
            href="/decision/can-i-afford-a-400k-home"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Can I Afford a $400,000 Home? Guide →
          </Link>
          <Link
            href="/decision/should-i-refinance-my-mortgage"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
          >
            Should I Refinance My Mortgage? Guide →
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

      {/* Understanding DTI */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Understanding Debt-to-Income (DTI) Ratios
        </h2>
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p>
            This widget uses the standard 28/36 rule that most mortgage lenders follow:
          </p>
          <ul>
            <li><strong>Front-end DTI (28%):</strong> Your total monthly housing costs (mortgage, taxes, insurance) should not exceed 28% of your gross monthly income.</li>
            <li><strong>Back-end DTI (36%):</strong> Your total monthly debt payments (housing + credit cards + car loans + student loans) should not exceed 36% of your gross monthly income.</li>
          </ul>
          <p>
            For example, if you earn $5,000/month: 28% = $1,400 max housing payment. 36% = $1,800 max for all debt payments combined.
          </p>
        </div>
      </section>

      {/* Contact CTA for Publishers */}
      <section className="mt-12 rounded-xl bg-primary-600 p-8 text-center text-white dark:bg-primary-700">
        <h2 className="text-2xl font-bold">Want This Widget on Your Site?</h2>
        <p className="mt-2 text-primary-100">
          Copy the embed code above or contact us for help with customization, placement, or bulk embedding across multiple pages.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:q.finhub@gmail.com?subject=Mortgage%20Affordability%20Widget%20for%20My%20Site"
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
