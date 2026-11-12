import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "White-label financial calculators for your website | QFINHUB",
  description:
    "Add 129 financial calculators to your bank, credit union or advisory website in one line. Your brand, your colours, and the enquiry comes to you instead of a lead broker.",
  // This is a B2B conversion page, not an organic target — see
  // .optimizer-data/search-demand-gate/new-page-white-label.json
  robots: { index: false, follow: true },
};

/**
 * Checkout links live here as one map so wiring Lemon Squeezy is a single edit.
 * Until they exist, every CTA falls back to mailto so the page still converts.
 */
const PAYMENT_LINKS: Record<"starter" | "institution", string | null> = {
  starter: null,
  institution: null,
};

const CONTACT = "mailto:Q.finhub@qfinhub.com?subject=White-label%20calculators";

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    cadence: "forever",
    pitch: "Try it on a real page before you talk to anyone.",
    features: [
      "1 calculator",
      "\u201cPowered by QFINHUB\u201d badge",
      "Your brand name and colour",
      "No account, no card",
    ],
    cta: "Copy the code below",
    href: null,
  },
  {
    id: "starter" as const,
    name: "Starter",
    price: "$149",
    cadence: "per month",
    pitch: "For a single branch, broker or advisory firm.",
    features: [
      "Any 15 calculators",
      "Badge removed \u2014 it is your tool",
      "Lead capture form with consent",
      "Leads delivered to your CRM or inbox",
      "Your logo and brand colour",
      "Cancel any time",
    ],
    cta: "Start now",
    href: PAYMENT_LINKS.starter,
    featured: true,
  },
  {
    id: "institution" as const,
    name: "Institution",
    price: "$499",
    cadence: "per month",
    pitch: "For banks, credit unions and multi-site groups.",
    features: [
      "All 129 calculators",
      "Badge removed",
      "Lead capture on every calculator",
      "Unlimited pages and subdomains",
      "Priority support and new calculators first",
      "Invoicing available",
    ],
    cta: "Talk to us",
    href: PAYMENT_LINKS.institution,
  },
];

const EMBED_SNIPPET = `<!-- paste once, anywhere in the page -->
<div data-qfinhub-calc="mortgage-calculator"
     data-brand="Your Credit Union"
     data-color="0b5ea8"></div>
<script src="https://www.qfinhub.com/embed.js" async></script>`;

export default function WhiteLabelPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark">
      <Script id="wl-snippet-copy" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `document.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(!b)return;navigator.clipboard.writeText(document.getElementById('embed-code').textContent||'').then(function(){var t=b.textContent;b.textContent='Copied';setTimeout(function(){b.textContent=t},1500)})});`,
      }} />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 sm:px-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">
          White-label calculators
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl dark:text-white">
          Put 129 financial calculators on your website in one line
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
          Your brand, your colours, your domain. And when a visitor works out
          they can afford a loan, <strong>the enquiry comes to you</strong> —
          not to a rate table that resells it to three other lenders.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/embed/mortgage-calculator?brand=Your%20Credit%20Union&color=0b5ea8"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            See it branded
          </Link>
          <a
            href={CONTACT}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 dark:border-gray-600 dark:text-gray-200"
          >
            Ask a question
          </a>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          That link is live. Swap the name and colour in the URL — what you see is
          exactly what your visitors would see.
        </p>
      </section>

      {/* The problem */}
      <section className="border-y border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your calculator is probably working for someone else
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Most bank and credit-union sites run a third-party calculator
                widget. The visitor types in their details, gets a number — and
                the vendor behind the widget keeps that enquiry and resells it.
                An exclusive mortgage lead sells for{" "}
                <strong className="text-gray-900 dark:text-white">$30–60</strong>.
              </p>
            </div>
            <div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                A free WordPress calculator plugin is worse: it captures nothing
                at all. The visitor does the maths and leaves. You paid for the
                traffic and kept none of the intent.
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <strong>The maths that sells itself:</strong> if your embedded
            calculator captures 15 enquiries a month, and you would have paid
            $40 each for them elsewhere, that is $600 of value for $149.
          </p>
        </div>
      </section>

      {/* Install */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Installation is two lines
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          No plugin, no iframe sizing, no build step. Works on WordPress,
          Squarespace, Wix, Webflow, HubSpot, or hand-written HTML.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
            <span className="text-xs text-gray-400">HTML</span>
            <button
              type="button"
              data-copy
              className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
            >
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-100">
            <code id="embed-code">{EMBED_SNIPPET}</code>
          </pre>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          The free tier render includes our badge. A paid licence removes it —
          nothing else in the code changes.
        </p>
      </section>

      {/* Pricing */}
      <section className="border-t border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pricing
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Comparable white-label calculator services charge $200–$1,000 a
            month. Nobody else offers the full library.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={
                  "flex flex-col rounded-xl border bg-white p-5 dark:bg-gray-900 " +
                  (tier.featured
                    ? "border-blue-500 shadow-sm ring-1 ring-blue-500"
                    : "border-gray-200 dark:border-gray-700")
                }
              >
                {tier.featured ? (
                  <span className="mb-2 self-start rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {tier.name}
                </h3>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    {tier.cadence}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  {tier.pitch}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300"
                    >
                      <span className="mt-0.5 text-blue-600">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.href ? (
                  <a
                    href={tier.href}
                    className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {tier.cta}
                  </a>
                ) : tier.id === "free" ? (
                  <a
                    href="#embed-code"
                    className="mt-5 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <a
                    href={CONTACT}
                    className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Checkout opens shortly. Until then, email us and we will invoice you
            directly — bank transfer is fine and often cheaper than card fees.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Questions
        </h2>
        <div className="mt-5 space-y-5">
          {[
            {
              q: "Where do the leads actually go?",
              a: "To an endpoint you give us — Zapier, HubSpot, GoHighLevel, Slack, or your own CRM. Each lead arrives as JSON with the calculator used, the name, email and phone, and the page it came from. They never pass through a third party.",
            },
            {
              q: "Do you keep the leads?",
              a: "No. We forward and discard. They belong to you and the visitor consented to being contacted by you specifically.",
            },
            {
              q: "Will it slow my site down?",
              a: "It loads in an iframe with lazy loading, so it costs nothing until it scrolls into view. There is no jQuery and no tracking pixel.",
            },
            {
              q: "Can I match my brand exactly?",
              a: "You set the name and the hex colour. The badge disappears on paid plans. Full logo support and typography matching are included on the Institution plan.",
            },
            {
              q: "What if a calculator is wrong?",
              a: "Every formula is checked against independent reference values before release. If you find a discrepancy we fix it the same week and tell you what changed.",
            },
            {
              q: "Is there a contract?",
              a: "No. Monthly, cancel any time. Institution plans can be invoiced annually if your procurement prefers that.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.q}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gray-200 p-6 text-center dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Want to see it with your own name on it first?
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Reply to any email from us and we will send you a live link branded
            for your firm, before you pay anything.
          </p>
          <a
            href={CONTACT}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Request your branded demo
          </a>
        </div>
      </section>
    </div>
  );
}
