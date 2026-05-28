import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
      {/* YMYL Disclaimer Banner */}
      <div className="border-b border-gray-100 bg-amber-50 px-4 py-4 dark:border-gray-800 dark:bg-amber-900/10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <strong>⚠ Disclaimer:</strong> The information provided on QFINHUB is for general
            informational and educational purposes only. It does not constitute financial advice,
            investment advice, tax advice, or any other professional advice. You should consult
            with a qualified professional for advice tailored to your specific situation. All
            calculators and tools are for reference purposes and their accuracy is not guaranteed.
            By using this site, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/qfinhub-logo.svg"
                alt="QFINHUB"
                className="h-8 w-auto"
                width={144}
                height={32}
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              125+ free financial calculators for loans, mortgages, investments, retirement, taxes,
              and personal finance. Fast, accurate, and 100% free.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Calculators
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/calculators"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  All Calculators
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-specialist"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  AI Financial Specialist
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Blog & Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/for-ai-developers"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  For AI Developers
                </Link>
              </li>
              <li>
                <Link
                  href="/widgets"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Embeddable Widgets
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Editorial Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <p className="mb-1">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved. |
            Built with accuracy and privacy in mind.
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            548 Market Street, PMB 72296, San Francisco, CA 94104-5401, United States
          </p>
        </div>
      </div>
    </footer>
  );
}
