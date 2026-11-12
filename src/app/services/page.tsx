import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Custom Financial Calculators for Your Website — Installed in 72 Hours",
  description:
    "Lead-capturing financial calculators built on the same engine as 129 production calculators. Fixed price, fixed scope, live on your site in 72 hours.",
  alternates: {
    canonical: "https://www.qfinhub.com/services",
  },
  // Not part of the organic acquisition surface — this page exists to close
  // prospects sourced through direct outreach. Kept out of the sitemap.
  robots: { index: false, follow: true },
};

/**
 * Payment links.
 *
 * Replace these with Stripe Payment Links once they exist (Dashboard → Payment
 * links → New). Until then the page routes buyers to email, which still works.
 */
const PAYMENT_LINKS: Record<string, string> = {
  starter: "",
  professional: "",
  custom: "",
};

const PACKAGES = [
  {
    key: "starter",
    name: "Starter",
    price: "$500",
    turnaround: "5 days",
    tagline: "One calculator, live on your site.",
    features: [
      "1 custom calculator (any of our 129 formulas)",
      "Your branding: colours, logo, fonts",
      "Embed snippet — works on any site or CMS",
      "Mobile responsive, sub-second load",
      "1 revision round",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    price: "$1,250",
    turnaround: "10 days",
    tagline: "A three-calculator suite that captures leads.",
    features: [
      "3 linked calculators, consistent styling",
      "Lead-capture form wired to your CRM or inbox",
      "Confirmation + result sharing",
      "Hosted embed or source handoff",
      "2 revision rounds",
      "30-day bug fix warranty",
    ],
    featured: true,
  },
  {
    key: "custom",
    name: "Custom",
    price: "$2,500+",
    turnaround: "3 weeks",
    tagline: "White-label suite with your own rate data.",
    features: [
      "Full white-label deployment",
      "Custom formulas, your rate tables and product terms",
      "API endpoint for rates or eligibility",
      "Unlimited revisions during build",
      "60-day support window",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Send the product you sell",
    body: "A rate sheet, a link to your site, or a sentence about what you offer. That is enough — no brief required.",
  },
  {
    n: "02",
    title: "You get a live link in 72 hours",
    body: "A working calculator with your branding, on a staging URL you can click and share internally before paying anything.",
  },
  {
    n: "03",
    title: "Approve and pay",
    body: "Card payment, one invoice. You only pay once you have seen it working.",
  },
  {
    n: "04",
    title: "Install",
    body: "One line of embed code, or we hand over the component. Live the same day.",
  },
];

const FAQ = [
  {
    q: "Why is this cheaper than an agency?",
    a: "Because the formulas already exist. Agencies quote $13,000–25,000 for a custom calculator because they build the engine from scratch. We re-theme calculators that already run in production, so you pay for the branding and the integration, not the mathematics.",
  },
  {
    q: "Will it match my website?",
    a: "Yes. You send colours, logo and fonts, or a link to your site and we sample them. The calculator renders in your brand, not ours.",
  },
  {
    q: "What about compliance and disclaimers?",
    a: "Every calculator ships with configurable disclaimer text and does not present output as financial advice. You supply any regulatory wording your jurisdiction requires and it goes in the build.",
  },
  {
    q: "Do I own the code?",
    a: "Professional and Custom include a full source handoff. Starter includes the hosted embed; source is available on request for a one-off fee.",
  },
  {
    q: "What if I need something not in your 129 calculators?",
    a: "That is the Custom package. New formulas are built and tested against known reference cases before delivery.",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            For mortgage brokers, credit unions &amp; fintech sites
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            A lead-capturing calculator on your site in 72 hours.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Built on the same engine that powers 129 production financial
            calculators. Fixed price, fixed scope, working link in your hands in
            72 hours — before you pay anything.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:Q.finhub@qfinhub.com?subject=Calculator%20for%20my%20site"
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              Request a free sample
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              See pricing
            </a>
          </div>
        </div>

        {/* ROI strip */}
        <div className="mt-14 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            The arithmetic your finance team already runs
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$74</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Average cost of a finance/insurance lead bought from a network
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$1,250</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                One Professional suite, paid once, generates leads forever
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">17 leads</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Break-even. Everything after that is margin you keep
              </p>
            </div>
          </div>
        </div>

        {/* Proof */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Not a mockup — these are live right now
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Every calculator below is running on qfinhub.com in production. Yours
            will behave identically, wearing your brand.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { href: "/calculators/mortgage-calculator", label: "Mortgage payment", note: "Amortisation, taxes, PMI" },
              { href: "/calculators/mortgage-affordability", label: "Affordability", note: "Income → max purchase price" },
              { href: "/calculators/debt-payoff", label: "Debt payoff", note: "Snowball vs avalanche" },
              { href: "/calculators/refinance-calculator", label: "Refinance break-even", note: "Closing costs vs savings" },
              { href: "/calculators/annuity-calculator", label: "Annuity", note: "Retirement income streams" },
              { href: "/calculators/401k-calculator", label: "401(k)", note: "Employer match modelling" },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-primary-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white">
                  {c.label}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{c.note}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fixed price. Fixed scope. No discovery phase.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((p) => (
              <div
                key={p.key}
                className={`flex flex-col rounded-2xl border bg-white p-6 dark:bg-gray-800 ${
                  p.featured
                    ? "border-primary-500 shadow-lg ring-1 ring-primary-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {p.featured && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                    Most requested
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.tagline}</p>
                <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                  {p.price}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  delivered in {p.turnaround}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary-600 dark:text-primary-400">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={
                    PAYMENT_LINKS[p.key] ||
                    `mailto:Q.finhub@qfinhub.com?subject=${encodeURIComponent(`${p.name} package — calculator enquiry`)}`
                  }
                  className={`mt-6 inline-flex justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    p.featured
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Start with {p.name}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How it runs</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{s.n}</p>
                <p className="mt-2 font-semibold text-gray-900 dark:text-white">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Questions people actually ask
          </h2>
          <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-700">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold text-gray-900 dark:text-white">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-gray-900 p-10 text-center dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-white">
            Send one sentence about what you sell.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-300">
            You will have a working, branded calculator link within 72 hours. No
            brief, no discovery call, no invoice until you have clicked it.
          </p>
          <a
            href="mailto:Q.finhub@qfinhub.com?subject=Calculator%20for%20my%20site"
            className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Q.finhub@qfinhub.com
          </a>
        </div>
      </div>
    </div>
  );
}
