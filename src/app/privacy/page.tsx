import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "QFINHUB Privacy Policy — Learn how we collect, use, store, and protect your personal data when you use our financial tools and services.",
  alternates: {
    canonical: "https://www.qfinhub.com/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy | QFINHUB",
    description:
      "Learn how QFINHUB collects, uses, stores, and protects your personal data.",
    url: "https://www.qfinhub.com/privacy",
  },
};

const sections = [
  {
    title: "Information We Collect",
    content: (
      <>
        <p className="mb-4">
          When you use QFINHUB, we collect information to provide and improve
          our financial tools and services. The types of data we gather include:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Account Information.</strong> If you create an account, we
            collect your email address, display name, and authentication
            credentials. This data is necessary for saving your calculations,
            preferences, and dashboard settings.
          </li>
          <li>
            <strong>Calculator Inputs.</strong> Any financial figures,
            assumptions, or parameters you enter into our calculators (e.g.,
            income amounts, loan terms, retirement ages, portfolio values) are
            processed in your browser and may be stored if you choose to save
            results to your account.
          </li>
          <li>
            <strong>AI Analysis Data.</strong> When you interact with our AI
            Specialist feature, the financial questions and context you provide
            are sent to our AI provider (DeepSeek) to generate personalized
            responses. We do not use this data to train or fine-tune AI models.
          </li>
          <li>
            <strong>Usage Data.</strong> We automatically collect anonymized
            information about how you interact with QFINHUB, including pages
            visited, calculators used, feature interactions, and general
            performance metrics. This data helps us improve the platform.
          </li>
          <li>
            <strong>Device &amp; Browser Information.</strong> We may collect
            your IP address, browser type, operating system, and device type
            for security purposes and to ensure compatibility.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    content: (
      <>
        <p className="mb-4">
          Your data is used exclusively to operate, maintain, and improve
          QFINHUB. Specifically, we use information for:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Providing the Service.</strong> Running calculations,
            generating AI-powered financial plans, saving your results, and
            maintaining your account dashboard.
          </li>
          <li>
            <strong>Improving Calculators &amp; Tools.</strong> Analyzing
            aggregate usage patterns to refine our financial models, add new
            features, and fix bugs.
          </li>
          <li>
            <strong>AI-Powered Analysis.</strong> Sending your financial
            questions and context to DeepSeek AI to generate customized advice
            and plans. Responses are returned to you in real time and are not
            retained by third parties beyond the request lifecycle.
          </li>
          <li>
            <strong>Customer Support.</strong> Responding to your inquiries,
            troubleshooting issues, and providing technical assistance.
          </li>
          <li>
            <strong>Security &amp; Abuse Prevention.</strong> Detecting and
            preventing fraudulent activity, unauthorized access, and violations
            of our Terms of Service.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal information to third
          parties. We do <strong>not</strong> use your financial data for
          advertising or marketing purposes.
        </p>
      </>
    ),
  },
  {
    title: "Data Storage &amp; Security",
    content: (
      <>
        <p className="mb-4">
          We take the security of your data seriously and employ industry-standard
          safeguards to protect it.
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Infrastructure.</strong> QFINHUB is hosted on secure cloud
            infrastructure. User data is stored in Supabase, a managed database
            platform that provides encryption at rest and in transit.
          </li>
          <li>
            <strong>Encryption.</strong> All data transmitted between your
            browser and our servers is encrypted using TLS 1.3 (HTTPS). Data
            at rest is encrypted using AES-256.
          </li>
          <li>
            <strong>Authentication.</strong> Account access is protected by
            secure authentication flows. We use industry-standard password
            hashing and support OAuth providers for additional security.
          </li>
          <li>
            <strong>Retention.</strong> We retain your account data for as long
            as your account remains active. Calculator inputs saved to your
            dashboard are retained until you delete them or close your account.
            Anonymized usage data may be retained longer for analytical purposes.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Third-Party Services",
    content: (
      <>
        <p className="mb-4">
          QFINHUB relies on a limited set of trusted third-party services to
          operate. Each service provider is bound by data processing agreements
          and contractually prohibited from using your data for their own purposes.
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Supabase.</strong> Our primary database and authentication
            provider. Supabase stores your account information, saved
            calculations, and user preferences. Their privacy practices are
            available at{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              supabase.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>DeepSeek AI.</strong> Our AI Specialist feature uses
            DeepSeek&apos;s API to generate financial analysis and personalized
            plans. Financial context you provide is sent to DeepSeek solely for
            the purpose of generating a response and is not stored or used for
            training. See{" "}
            <a
              href="https://platform.deepseek.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              DeepSeek Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Vercel.</strong> Our hosting and deployment platform. Vercel
            processes minimal request metadata (IP address, request headers) for
            routing, caching, and CDN purposes. See{" "}
            <a
              href="https://vercel.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              Vercel Privacy Policy
            </a>
            .
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Cookies &amp; Tracking",
    content: (
      <>
        <p className="mb-4">
          QFINHUB uses minimal cookies and similar tracking technologies
          necessary for the operation of the platform:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Essential Cookies.</strong> Required for authentication,
            session management, and maintaining your preferences (e.g., theme
            selection, language choice). These cannot be disabled.
          </li>
          <li>
            <strong>Analytics Cookies.</strong> We use Google Analytics to
            understand aggregate usage patterns and improve our platform. No
            personally identifiable information is collected through analytics.
            These are disabled by default until you grant consent.
          </li>
          <li>
            <strong>Advertising Cookies.</strong> We participate in Google
            AdSense to support our free service. Advertising and personalization
            cookies (including, but not limited to, _gcl_*, IDE, and NID cookies
            from Google) are disabled by default and only activated with your
            explicit consent via our consent banner in accordance with Google
            Consent Mode v2. We also use Adsterra, a third-party ad network, to
            display non-personalized advertisements.
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-4 dark:border-accent-900/30 dark:bg-accent-900/20">
          <p className="text-sm font-medium text-accent-800 dark:text-accent-300">
            🛡️ Consent Management
          </p>
          <p className="mt-1 text-sm text-accent-700 dark:text-accent-400">
            We use Google Consent Mode v2 to manage your privacy preferences.
            When you first visit QFINHUB, you&apos;ll see a consent banner
            where you can Accept All, Reject All, or Customize which types of
            cookies you allow. Your choice is stored locally and respected by
            Google&apos;s tags. You can also manage cookie preferences through
            your browser settings at any time.
          </p>
        </div>
        <p className="mt-4">
          Most web browsers allow you to control cookies through your browser
          settings. However, disabling essential cookies may affect the
          functionality of QFINHUB.
        </p>
      </>
    ),
  },
  {
    title: "Your Rights &amp; Choices",
    content: (
      <>
        <p className="mb-4">
          Depending on your jurisdiction (including under GDPR, CCPA, and other
          applicable privacy laws), you have the following rights regarding your
          personal data:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Access.</strong> You may request a copy of the personal data
            we hold about you.
          </li>
          <li>
            <strong>Correction.</strong> You may update or correct inaccurate
            information through your account settings or by contacting us.
          </li>
          <li>
            <strong>Deletion.</strong> You may request deletion of your account
            and associated data. You can do this from your account settings or
            by emailing us.
          </li>
          <li>
            <strong>Portability.</strong> You may request a machine-readable
            export of your data (e.g., saved calculations, account info).
          </li>
          <li>
            <strong>Opt-Out.</strong> You may opt out of non-essential data
            collection by using the platform without creating an account. Many
            calculators work entirely in your browser without any data being
            sent to our servers.
          </li>
          <li>
            <strong>Withdraw Consent.</strong> Where processing is based on your
            consent, you may withdraw that consent at any time by contacting us.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at the email
          address below. We will respond to your request within the timeframe
          required by applicable law (typically 30 days).
        </p>
      </>
    ),
  },
  {
    title: "Data Transfers",
    content: (
      <p>
        QFINHUB is operated from the United States. If you are located outside
        the United States, your data may be transferred to, stored in, and
        processed in the United States. We ensure appropriate safeguards are in
        place for international data transfers, including Standard Contractual
        Clauses where required by applicable law.
      </p>
    ),
  },
  {
    title: "Children&apos;s Privacy",
    content: (
      <p>
        QFINHUB is not directed at individuals under the age of 16. We do not
        knowingly collect personal information from children. If we become aware
        that a child under 16 has provided us with personal data, we will take
        steps to delete such information promptly. If you believe a child has
        provided us with their data, please contact us immediately.
      </p>
    ),
  },
  {
    title: "Advertising and Google AdSense",
    content: (
      <>
        <p className="mb-4">
          QFINHUB uses Google AdSense, a third-party advertising service
          provided by Google LLC. AdSense uses cookies and similar technologies
          to serve ads based on a user&apos;s prior visits to our website or other
          sites on the internet. Google&apos;s use of advertising cookies enables
          it and its partners to serve ads based on your visit to our site and/or
          other sites on the internet.
        </p>
        <p className="mb-4">
          You may opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
          >
            Google Ads Settings
          </a>
          . You may also opt out of certain third-party vendors&apos; use of
          cookies for personalized advertising by visiting{" "}
          <a
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
          >
            www.aboutads.info
          </a>
          .
        </p>
        <p>
          Third-party vendors, including Google, use cookies to serve ads based
          on a user&apos;s prior visits to our website. Users may opt out of the
          use of the DART cookie by visiting the Google Ad and Content Network
          privacy policy. We do not control third-party advertisers&apos; data
          practices, and any questions about their use of your information
          should be directed to them.
        </p>
      </>
    ),
  },
  {
    title: "Calculator Inputs: Local Processing Statement",
    content: (
      <p>
        When you use any of our financial calculators, the numerical values you
        enter are processed locally in your browser using JavaScript. We do not
        transmit the inputs you type into our calculators to our servers, and
        we do not store them in any database. This means your financial
        scenario data — loan amounts, salaries, asset values, etc. — never
        leaves your device. This is by design: it preserves your privacy, makes
        the tools feel instant, and eliminates an entire class of data breach
        risks. Aggregated, anonymized usage analytics may be collected about
        which calculators are most popular, but never the specific values you
        entered into them.
      </p>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes
        in our practices, legal requirements, or operational needs. Material
        changes will be communicated by updating the &ldquo;Last Updated&rdquo;
        date at the top of this page and, where appropriate, via email or an
        in-app notification. We encourage you to review this policy periodically.
      </p>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <>
        <p className="mb-4">
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or our data practices, please reach out to us:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@qfinhub.com"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              privacy@qfinhub.com
            </a>
          </li>
          <li>
            <strong>Website:</strong>{" "}
            <a
              href="https://www.qfinhub.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              qfinhub.com/contact
            </a>
          </li>
          <li>
            <strong>Mailing Address:</strong>
            <br />
            QFINHUB Privacy Team
            <br />
            548 Market Street, PMB 72296
            <br />
            San Francisco, CA 94104-5401
            <br />
            United States
          </li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            Legal
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            How QFINHUB collects, uses, and protects your data
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Last Updated: May 15, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl">
          {/* Introduction */}
          <div className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <p className="leading-relaxed text-gray-600 dark:text-gray-300">
              At QFINHUB, your privacy matters. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you
              use our financial tools, calculators, AI Specialist, and related
              services. By using QFINHUB, you agree to the practices described
              in this policy.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="scroll-mt-24">
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {index + 1}. {section.title}
                </h2>
                <div className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {section.content}
                </div>
                {index < sections.length - 1 && (
                  <hr className="mt-8 border-gray-200 dark:border-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 dark:border-gray-700 dark:bg-surface-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary-600 to-accent-600" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              QFINHUB
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
