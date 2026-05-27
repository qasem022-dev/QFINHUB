"use client";

import Link from "next/link";
import { useTranslation } from "@/app/i18n-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const footerGroups = [
  {
    titleKey: "footer.product",
    links: [
      { href: "/calculators", labelKey: "nav.calculators" },
      { href: "/ai-specialist", labelKey: "nav.aiSpecialist" },
      { href: "/dashboard", labelKey: "nav.dashboard" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { href: "/about", labelKey: "footer.about" },
      { href: "/blog", labelKey: "footer.blog" },
      { href: "/contact", labelKey: "footer.contact" },
      { href: "/methodology", labelKey: "footer.methodology" },
      { href: "/editorial-policy", labelKey: "footer.editorialPolicy" },
      { href: "/all-pages", labelKey: "footer.sitemap" },
    ],
  },
  {
    titleKey: "footer.legal",
    links: [
      { href: "/privacy", labelKey: "footer.privacyPolicy" },
      { href: "/terms", labelKey: "footer.termsOfService" },
      { href: "/cookies", labelKey: "footer.cookiePolicy" },
    ],
  },
];

const socialLinks = [
  { labelKey: "footer.social.github", href: "https://github.com/qfinhub" },
  { labelKey: "footer.social.twitter", href: "https://x.com/qfinhub" },
  { labelKey: "footer.social.linkedin", href: "https://www.linkedin.com/company/qfinhub" },
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/qfinhub-logo.svg"
                alt="QFINHUB"
                className="h-7 w-auto"
                width={126}
                height={28}
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Link Groups */}
          {footerGroups.map((group) => (
            <div key={group.titleKey}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                {t(group.titleKey)}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {t(link.labelKey)}
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
            &copy; {new Date().getFullYear()} QFINHUB. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            {socialLinks.map((social) => (
              <a
                key={social.labelKey}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                {t(social.labelKey)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
