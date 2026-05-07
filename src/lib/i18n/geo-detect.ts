import { type Locale, defaultLocale, isSupportedLocale } from "./index";

/**
 * Detect locale from a Request object (server-side).
 * Uses Accept-Language header to find the best match.
 */
export function detectLocaleFromRequest(request?: Request): Locale {
  if (!request) return defaultLocale;

  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return defaultLocale;

  return detectLocaleFromAcceptLanguage(acceptLanguage);
}

/**
 * Detect locale from an Accept-Language header value.
 */
export function detectLocaleFromAcceptLanguage(
  acceptLanguage: string,
): Locale {
  // Parse the Accept-Language header, sorted by quality
  const languages = acceptLanguage
    .split(",")
    .map((entry) => {
      const parts = entry.trim().split(";");
      const langSegment = parts[0] ?? "";
      const qPart = parts[1];
      const quality = qPart ? parseFloat(qPart.replace("q=", "")) : 1;
      const primaryLang = langSegment.split("-")[0] ?? "";
      return { lang: primaryLang.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported locale
  for (const { lang } of languages) {
    if (isSupportedLocale(lang)) {
      return lang as Locale;
    }
  }

  return defaultLocale;
}

/**
 * Detect locale on the client side using navigator.language.
 */
export function detectClientLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;

  const navLang = navigator.language;
  if (!navLang) return defaultLocale;

  const primaryLang = navLang.split("-")[0] ?? "";
  const lang = primaryLang.toLowerCase();
  if (isSupportedLocale(lang)) {
    return lang as Locale;
  }

  return defaultLocale;
}
