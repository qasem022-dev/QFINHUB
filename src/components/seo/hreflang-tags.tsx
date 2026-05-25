"use client";

import { usePathname } from "next/navigation";

const BASE_URL = "https://www.qfinhub.com";
const LOCALES = ["en", "es", "fr", "de", "it", "pt", "hi", "zh"];

/**
 * HreflangTags — Dynamically generates correct hreflang alternates
 * for the CURRENT page (not the homepage).
 *
 * Fixes GSC error: "Duplicate, Google chose different canonical than user"
 * Root cause: Hardcoded hreflang tags always pointed to /?lang=xx
 * instead of /current-page?lang=xx, creating a canonical conflict.
 */
export function HreflangTags() {
  const pathname = usePathname();

  // Build the full path with lang parameter, preserving the current route
  const buildHref = (locale: string) => {
    const separator = pathname.includes("?") ? "&" : "?";
    return `${BASE_URL}${pathname}${separator}lang=${locale}`;
  };

  return (
    <>
      {LOCALES.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={buildHref(locale)}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}${pathname}`}
      />
    </>
  );
}
