import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MapPin, Clock, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us — Get Support & Send Feedback",
  description:
    "Have a question or feedback for QFINHUB? Contact our team via email at q.finhub@gmail.com. We respond to all inquiries within 24 hours. We're here to help.",
  openGraph: {
    title: "Contact QFINHUB | Free Financial Calculators Support",
    description:
      "Need help or have feedback? Contact the QFINHUB team. We respond to all inquiries within 24 hours.",
  },
};

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    value: "q.finhub@gmail.com",
    href: "mailto:q.finhub@gmail.com",
    description: "We typically respond within 24 hours.",
  },
  {
    icon: MessageSquare,
    title: "Feedback & Suggestions",
    value: "q.finhub@gmail.com",
    href: "mailto:q.finhub@gmail.com?subject=Feedback",
    description: "Help us improve — we read every suggestion.",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "Within 24 hours",
    description: "Monday through Friday, excluding holidays.",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "San Francisco, CA",
    description: "Fully remote team serving users worldwide.",
  },
];

const faqs = [
  {
    q: "Is QFINHUB really free?",
    a: "Yes, completely. All 124 calculators, the AI Specialist, and every feature on QFINHUB are 100% free — no hidden fees, no premium tiers, no credit card required.",
  },
  {
    q: "Do I need an account to use the calculators?",
    a: "Not at all. All calculators work instantly without sign-up. Creating a free account lets you save results and access them from your dashboard later.",
  },
  {
    q: "How long does it take to get a response?",
    a: "We respond to all inquiries within 24 hours during business days. For urgent matters, please include 'URGENT' in your email subject line.",
  },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-surface-dark/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/qfinhub-logo.svg"
              alt="QFINHUB"
              className="h-8 w-auto"
              width={144}
              height={32}
            />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/calculators"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              Calculators
            </Link>
            <Link
              href="/about"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              About
            </Link>
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            Get in Touch
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Contact Us
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300">
            Have a question, suggestion, or feedback? We&apos;d love to hear
            from you. Reach out and we&apos;ll get back to you promptly.
          </p>
        </div>
      </section>

      {/* ── Contact Info Cards ── */}
      <section className="relative z-10 -mt-10 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const content = (
                <div className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] dark:border-zinc-700 dark:bg-surface-dark-elevated dark:hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {method.title}
                  </h3>
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {method.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {method.description}
                  </p>
                </div>
              );

              return method.href ? (
                <a key={method.title} href={method.href}>
                  {content}
                </a>
              ) : (
                <div key={method.title}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Two Column: Contact Form + Info ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Left: Contact Form */}
            <div className="lg:col-span-3">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Send Us a Message
              </h2>
              <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible. You can also email us directly at{" "}
                <a
                  href="mailto:q.finhub@gmail.com"
                  className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  q.finhub@gmail.com
                </a>
                .
              </p>
              <ContactForm />
            </div>

            {/* Right: FAQ + Contact Info */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.q}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {faq.q}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                <div className="rounded-lg bg-accent-50 p-4 dark:bg-accent-900/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Want to reach us directly?
                      </p>
                      <a
                        href="mailto:q.finhub@gmail.com"
                        className="mt-1 block text-sm font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                      >
                        q.finhub@gmail.com
                      </a>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        We respond within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/qfinhub-logo.svg"
                alt="QFINHUB"
                className="h-7 w-auto"
                width={126}
                height={28}
              />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/about"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                About Us
              </Link>
              <Link
                href="/privacy"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
