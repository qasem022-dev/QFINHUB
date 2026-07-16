import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "QFINHUB Terms of Service — Acceptable use, user responsibilities, disclaimers, and legal agreements for using our financial tools platform.",
  alternates: {
    canonical: "https://www.qfinhub.com/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Terms of Service | QFINHUB",
    description:
      "QFINHUB Terms of Service — Acceptable use, user responsibilities, disclaimers, and legal agreements.",
    url: "https://www.qfinhub.com/terms",
  },
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using QFINHUB (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do
          not agree to all of these Terms, you must not access or use the Platform.
        </p>
        <p>
          These Terms apply to all visitors, users, and others who access or use the Platform
          (&ldquo;Users&rdquo;). By using the Platform, you represent that you are at least 18 years of age
          or have the consent of a parent or guardian.
        </p>
        <p>
          We reserve the right to update or modify these Terms at any time. Changes will be effective
          immediately upon posting to this page. Your continued use of the Platform after any changes
          constitutes acceptance of the updated Terms.
        </p>
      </>
    ),
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: (
      <>
        <p>
          QFINHUB provides a comprehensive suite of financial tools, including but not limited to:
        </p>
        <ul>
          <li>Financial calculators covering loans, investments, retirement, taxes, and more</li>
          <li>An AI-powered financial specialist that generates custom calculators and analysis</li>
          <li>Embeddable calculator widgets for third-party websites</li>
          <li>Dashboard and save features for tracking calculations</li>
          <li>Multi-language support across English, Spanish, and Hindi</li>
        </ul>
        <p>
          The Platform is provided for informational and educational purposes only. It is not a
          substitute for professional financial advice, and no calculator, AI-generated output, or
          analysis should be construed as financial, legal, or tax advice.
        </p>
      </>
    ),
  },
  {
    id: "responsibilities",
    title: "3. User Responsibilities",
    content: (
      <>
        <p>As a condition of using the Platform, you agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information when required</li>
          <li>Use the Platform only for lawful purposes and in accordance with these Terms</li>
          <li>Not misuse the Platform by knowingly introducing viruses, overload the infrastructure, or attempt to gain unauthorized access</li>
          <li>Not use any automated means (bots, scrapers, crawlers) without our express written permission</li>
          <li>Not reproduce, duplicate, copy, sell, resell, or exploit any portion of the Platform without authorization</li>
          <li>Be responsible for all activity occurring under your account</li>
        </ul>
        <p>
          You are solely responsible for any decisions you make based on calculations or information
          obtained through the Platform. We encourage you to consult with a qualified financial
          professional before making any financial decisions.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "4. Account Registration and Security",
    content: (
      <>
        <p>
          Certain features of the Platform may require account registration. When you create an
          account, you agree to:
        </p>
        <ul>
          <li>Provide accurate, complete, and up-to-date registration information</li>
          <li>Maintain and promptly update your account information as needed</li>
          <li>Keep your password secure and confidential</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Accept responsibility for all activities that occur under your account</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms or that
          we determine, in our sole discretion, to be used inappropriately.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "5. Intellectual Property",
    content: (
      <>
        <p>
          The Platform and its entire contents, features, and functionality (including but not limited
          to all software, code, text, graphics, logos, icons, images, audio clips, and the design,
          selection, and arrangement thereof) are owned by QFINHUB, its licensors, or other
          providers and are protected by copyright, trademark, patent, and other intellectual
          property laws.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable, revocable license to access and
          use the Platform for personal or internal business purposes. This license does not permit
          you to:
        </p>
        <ul>
          <li>Modify, distribute, or create derivative works of any Platform content</li>
          <li>Use any trademarks, service marks, or logos without prior written consent</li>
          <li>Remove any copyright or proprietary notices from Platform materials</li>
          <li>Frame or mirror any part of the Platform on other websites</li>
        </ul>
        <p>
          All rights not expressly granted to you in these Terms are reserved by QFINHUB and its
          licensors.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "6. Limitation of Liability and Disclaimers",
    content: (
      <>
        <p className="font-semibold text-amber-600 dark:text-amber-400">
          IMPORTANT DISCLAIMER — NO FINANCIAL ADVICE
        </p>
        <p>
          QFINHUB is a tool platform designed for informational and educational purposes only. The
          content, calculators, AI-generated analyses, and any other materials available on the
          Platform do not constitute financial advice, investment advice, tax advice, legal advice,
          or any other professional advice.
        </p>
        <p>
          You should not make any financial decisions based solely on information from QFINHUB.
          Always seek the advice of a qualified financial advisor, tax professional, or legal
          professional with any questions you may have regarding your financial situation.
        </p>
        <p className="mt-4 font-semibold">Disclaimer of Warranties</p>
        <p>
          THE PLATFORM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT ANY
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Platform will be uninterrupted, timely, secure, or
          error-free, that defects will be corrected, or that the Platform or the servers that
          make it available are free of viruses or other harmful components.
        </p>
        <p className="mt-4 font-semibold">Limitation of Liability</p>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL QFINHUB, ITS
          AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
          PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING
          TO YOUR USE OF OR INABILITY TO USE THE PLATFORM.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties or the limitation
          of liability for incidental or consequential damages, so some of the above limitations
          may not apply to you. In such jurisdictions, our liability shall be limited to the
          maximum extent permitted by law.
        </p>
      </>
    ),
  },
  {
    id: "ai-content",
    title: "7. AI-Generated Content Disclaimers",
    content: (
      <>
        <p>
          QFINHUB features an AI-powered financial specialist that generates custom calculators,
          analyses, and responses based on user input. By using this feature, you acknowledge and
          agree to the following:
        </p>
        <ul>
          <li>
            <strong>No Guarantee of Accuracy:</strong> AI-generated content is produced by machine
            learning models and may contain errors, inaccuracies, or omissions. It should not be
            relied upon as factually accurate or complete.
          </li>
          <li>
            <strong>Not Financial Advice:</strong> AI-generated outputs do not constitute financial,
            investment, tax, or legal advice. You are solely responsible for verifying any AI-generated
            information before acting on it.
          </li>
          <li>
            <strong>No Professional Relationship:</strong> Use of the AI specialist does not create a
            professional-client relationship of any kind.
          </li>
          <li>
            <strong>Data Handling:</strong> Inputs you provide to the AI specialist may be processed
            by third-party AI service providers. Do not share sensitive personal or financial
            information. Please see our <Link href="/privacy" className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300">Privacy Policy</Link> for more details.
          </li>
          <li>
            <strong>Limitations:</strong> The AI specialist may not understand complex,
            context-specific, or nuanced financial scenarios. It has knowledge cutoffs and may not
            reflect the most current regulatory or market conditions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "termination",
    title: "8. Termination",
    content: (
      <>
        <p>
          We may terminate or suspend your access to the Platform immediately, without prior notice
          or liability, for any reason, including without limitation if you breach these Terms.
        </p>
        <p>
          Upon termination, your right to use the Platform will immediately cease. All provisions
          of these Terms which by their nature should survive termination shall survive, including
          but not limited to intellectual property provisions, warranty disclaimers, limitation of
          liability, and governing law.
        </p>
        <p>
          You may terminate your account at any time by discontinuing use of the Platform and, where
          applicable, deleting your account through the settings page or by contacting us.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "9. Governing Law",
    content: (
      <>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State
          of Delaware, United States, without regard to its conflict of law provisions.
        </p>
        <p>
          Any legal suit, action, or proceeding arising out of or relating to these Terms or the
          Platform shall be instituted exclusively in the federal or state courts located in
          Delaware, and you waive any objection to the exercise of jurisdiction over you by such
          courts and to venue in such courts.
        </p>
        <p>
          If any provision of these Terms is held to be invalid or unenforceable, the remaining
          provisions shall continue in full force and effect.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Information",
    content: (
      <>
        <p>
          If you have any questions, concerns, or requests regarding these Terms of Service, please
          contact us:
        </p>
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:support@qfinhub.com"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              support@qfinhub.com
            </a>
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <Link
              href="/"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              qfinhub.com
            </Link>
          </p>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            <span className="text-accent-600 dark:text-accent-400">Q</span>FINHUB
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:border-gray-800 dark:from-primary-950 dark:via-surface-dark dark:to-accent-950/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-600 dark:text-accent-400">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            Last Updated: May 18, 2026
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Please read these terms carefully before using the QFINHUB platform. By using our
            services, you agree to be bound by these terms.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <nav
        className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30"
        aria-label="Table of Contents"
      >
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            On This Page
          </h2>
          <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-gray-600 underline-offset-2 hover:text-accent-600 hover:underline dark:text-gray-400 dark:hover:text-accent-400"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Terms Content */}
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20"
            >
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                {section.title}
              </h2>
              <div className="prose prose-gray max-w-none dark:prose-invert prose-a:text-accent-600 dark:prose-a:text-accent-400 prose-li:marker:text-gray-400 dark:prose-li:marker:text-gray-500 space-y-4 text-gray-700 dark:text-gray-300">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Last Updated */}
        <div className="mt-16 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Last Updated:</strong> May 18, 2026. These Terms of Service may be updated
            periodically. We encourage you to review this page regularly to stay informed of any
            changes. Continued use of the Platform after updates constitutes acceptance of the
            revised Terms.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <Link
                href="/"
                className="text-lg font-bold tracking-tight text-gray-900 dark:text-white"
              >
                <span className="text-accent-600 dark:text-accent-400">Q</span>FINHUB
              </Link>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Financial tools for everyone.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/"
                className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-400 dark:text-gray-500">Terms of Service</span>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
