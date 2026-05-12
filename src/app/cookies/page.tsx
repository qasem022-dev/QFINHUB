import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "QFINHUB Cookie Policy — Learn about the cookies and similar tracking technologies used on our platform and how you can control them.",
  openGraph: {
    title: "Cookie Policy | QFINHUB",
    description:
      "Learn how QFINHUB uses cookies and similar tracking technologies to operate and improve our platform.",
  },
};

const sections = [
  {
    title: "What Are Cookies",
    content: (
      <>
        <p className="mb-4">
          Cookies are small text files that websites store on your device (computer,
          tablet, or mobile) when you visit them. They are widely used to make websites
          work efficiently, remember your preferences, and provide a better browsing
          experience. Cookies can be &ldquo;persistent&rdquo; (remaining on your device
          until they expire or are deleted) or &ldquo;session&rdquo; (deleted when you
          close your browser).
        </p>
        <p className="mb-4">
          Similar technologies such as local storage, session storage, and web beacons
          may also be used for analogous purposes. In this policy, references to
          &ldquo;cookies&rdquo; include these similar technologies unless otherwise
          stated.
        </p>
      </>
    ),
  },
  {
    title: "Cookies We Use",
    content: (
      <>
        <p className="mb-4">
          QFINHUB uses a minimal set of cookies and local storage entries, all of which
          are strictly necessary for the operation and security of our platform. We do
          <strong> not</strong> use cookies for advertising, tracking across websites,
          or selling your data.
        </p>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600">
                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Cookie / Storage Key
                </th>
                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Purpose
                </th>
                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                  sb-*-auth-token
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Essential
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Supabase authentication session. Required to keep you logged in
                  across page visits.
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Session / Configurable
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                  qfinhub-locale
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Essential
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Stores your selected language preference (English, Spanish, or Hindi)
                  so it persists across visits.
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  1 year
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                  qfinhub-theme
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Essential
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Stores your theme preference (light, dark, or system) so it persists
                  across visits.
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  1 year
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                  next-auth.* / __session
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Essential
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Next.js framework cookies used for session handling and route
                  protection.
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  Session
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <strong>Note:</strong> The asterisk (*) in cookie names represents a
          dynamic value unique to each Supabase project.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Cookies",
    content: (
      <>
        <p className="mb-4">
          QFINHUB does <strong>not</strong> use third-party tracking cookies,
          advertising cookies, or social media cookies. We believe in respecting
          your privacy and keeping data collection to the absolute minimum
          required for the platform to function.
        </p>
        <p>
          The only third-party service that may set cookies is Supabase, our
          authentication and database provider. Supabase&rsquo;s authentication
          cookies are strictly necessary for session management and are not used
          for any tracking or analytics purposes. You can review Supabase&rsquo;s
          cookie practices at{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
          >
            supabase.com/privacy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "How to Control Cookies",
    content: (
      <>
        <p className="mb-4">
          Most web browsers allow you to control cookies through your browser
          settings. You can typically:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            View and delete cookies that have been stored on your device.
          </li>
          <li>
            Block cookies from specific websites or all websites.
          </li>
          <li>
            Set your browser to notify you when a website attempts to set a cookie.
          </li>
          <li>
            Use private or incognito browsing modes that delete session cookies
            when you close the browser.
          </li>
        </ul>
        <p className="mb-4">
          The methods for managing cookies vary by browser. Below are links to
          instructions for common browsers:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              Safari (macOS)
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p className="text-amber-700 dark:text-amber-400">
          <strong>Please note:</strong> Blocking essential cookies may affect the
          functionality of QFINHUB. For example, you may not be able to log in,
          save calculators, or maintain your language and theme preferences.
        </p>
      </>
    ),
  },
  {
    title: "Local Storage",
    content: (
      <>
        <p className="mb-4">
          In addition to cookies, QFINHUB uses browser local storage to cache
          certain data for improved performance. This includes:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>Theme preference</strong> — cached locally for instant
            theme switching without a server round-trip.
          </li>
          <li>
            <strong>Calculator state</strong> — temporary storage of input
            values to prevent data loss on accidental page navigation.
          </li>
        </ul>
        <p>
          Local storage data remains on your device and is not automatically
          transmitted to our servers. You can clear local storage through your
          browser settings at any time.
        </p>
      </>
    ),
  },
  {
    title: "Updates to This Policy",
    content: (
      <p>
        We may update this Cookie Policy from time to time to reflect changes in
        our practices, legal requirements, or the technologies we use. When we
        make material changes, we will update the &ldquo;Last Updated&rdquo; date
        at the top of this page. We encourage you to review this policy periodically.
      </p>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <>
        <p className="mb-4">
          If you have any questions, concerns, or requests regarding this Cookie
          Policy or our data practices, please contact us:
        </p>
        <ul className="list-inside list-disc space-y-2 pl-4">
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
              href="https://qfinhub.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
            >
              qfinhub.com/contact
            </a>
          </li>
        </ul>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            How QFINHUB uses cookies and similar technologies
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Last Updated: May 9, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white px-4 py-16 dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl">
          {/* Introduction */}
          <div className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
            <p className="leading-relaxed text-gray-600 dark:text-gray-300">
              This Cookie Policy explains how QFINHUB (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;us&rdquo;) uses cookies, local storage, and similar technologies when you
              visit our website or use our financial tools. It explains what these technologies
              are, why we use them, and how you can control them. By using QFINHUB, you consent
              to the use of cookies and similar technologies as described in this policy.
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
