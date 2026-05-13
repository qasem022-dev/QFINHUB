import type { LanguageInfo } from "./languages";
import { ALL_LANGUAGES } from "./languages";

// Re-export the language info
export type { LanguageInfo };
export { ALL_LANGUAGES, getLanguageInfo, getNativeName } from "./languages";

export type Locale = string; // Now supports any locale code

export const locales: Locale[] = ALL_LANGUAGES.map((l) => l.code);
export const defaultLocale: Locale = "en";

export const localeLabels: Record<string, string> = {};
for (const lang of ALL_LANGUAGES) {
  localeLabels[lang.code] = lang.nativeName;
}

// Dynamic import of all locale files
const translationCache: Record<string, Record<string, unknown> | null> = {};

function loadTranslation(locale: string): Record<string, unknown> | null {
  if (translationCache[locale] !== undefined) {
    return translationCache[locale];
  }

  try {
    // Dynamic require — all locale files are pre-generated
    const data = require(`@/i18n/locales/${locale}.json`);
    translationCache[locale] = data as Record<string, unknown>;
    return translationCache[locale];
  } catch {
    // Fallback to English if locale file doesn't exist
    if (locale !== "en") {
      try {
        const data = require(`@/i18n/locales/en.json`);
        translationCache[locale] = data as Record<string, unknown>;
        return translationCache[locale];
      } catch {
        translationCache[locale] = null;
        return null;
      }
    }
    translationCache[locale] = null;
    return null;
  }
}

/**
 * Get a nested translation value by dot-separated path.
 * e.g. getTranslation("en", "nav.calculators") => "Calculators"
 */
export function getTranslation(locale: string, path: string): string {
  const translations = loadTranslation(locale);
  if (!translations) return path;

  const keys = path.split(".");
  let value: unknown = translations;

  for (const key of keys) {
    if (value === null || value === undefined) return path;
    if (typeof value !== "object") return path;
    value = (value as Record<string, unknown>)[key];
  }

  if (typeof value === "string") return value;
  return path;
}

/**
 * Check if a locale is supported.
 */
export function isSupportedLocale(locale: string): boolean {
  return locales.includes(locale);
}

/**
 * Get the number of supported languages.
 */
export function getLanguageCount(): number {
  return ALL_LANGUAGES.length;
}
