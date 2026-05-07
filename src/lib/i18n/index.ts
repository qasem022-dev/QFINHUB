export type Locale = "en" | "es" | "hi";

export const locales: Locale[] = ["en", "es", "hi"];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
};

import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import hi from "@/i18n/locales/hi.json";

const translations: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  es: es as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
};

/**
 * Get a nested translation value by dot-separated path.
 * e.g. getTranslation("en", "nav.calculators") => "Calculators"
 */
export function getTranslation(locale: Locale, path: string): string {
  const result = getNestedTranslation(locale, path);
  if (typeof result === "string") return result;
  return path;
}

/**
 * Get a nested value from the translations object by dot-separated path.
 * Returns the raw value (could be string, array, object).
 */
export function getNestedTranslation(
  locale: Locale,
  path: string,
): unknown {
  const keys = path.split(".");
  let value: unknown = translations[locale];

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

/**
 * Check if a locale is supported.
 */
export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
