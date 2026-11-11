"use client";

import { usePathname } from "next/navigation";

const BASE_URL = "https://www.qfinhub.com";
const LOCALES = ["en", "es", "fr", "de", "it", "pt", "hi", "zh"];

/**
 * Whether real per-locale translations are shipped.
 *
 * Aug 18, 2026 — this was assumed true, and 8 hreflang alternates were emitted on
 * every page. It is not true: every `?lang=xx` URL serves byte-identical English
 * content (verified Nov 11, 2026 — text similarity 1.000 vs the base page) and the
 * proxy returns `X-Robots-Tag: noindex, nofollow` for those URLs.
 *
 * hreflang must point at indexable pages. Emitting it against noindex URLs is an
 * invalid cluster: Google discards the annotations and still spends crawl budget
 * verifying ~8 phantom URLs per page (~4,800 sitewide). For a domain whose /about
 * page is not even indexed, that is the largest single source of wasted crawl
 * budget.
 *
 * Flip to true ONLY once real translations exist at /es/, /fr/, ... and those
 * routes are indexable and listed in the sitemap.
 */
const TRANSLATIONS_AVAILABLE = false;

/**
 * HreflangTags — generates hreflang alternates for the CURRENT page.
 *
 * Kept as a component so switching TRANSLATIONS_AVAILABLE back on is a one-line
 * change once translated routes actually exist.
 */
export function HreflangTags() {
  const pathname = usePathname();

  // No translations shipped → emit nothing. The self-referencing canonical in
  // generateMetadata already identifies the authoritative URL.
  if (!TRANSLATIONS_AVAILABLE) {
    return null;
  }

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
