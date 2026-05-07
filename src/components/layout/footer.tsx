import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { href: "/calculators", label: "Calculators" },
      { href: "/ai-specialist", label: "AI Specialist" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-600 to-accent-500">
                <span className="text-xs font-bold text-white">Q</span>
              </div>
              <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                QFINHUB
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Professional financial calculators, AI-powered analysis, and
              interactive planning tools for investors and analysts.
            </p>
          </div>

          {/* Link Groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
