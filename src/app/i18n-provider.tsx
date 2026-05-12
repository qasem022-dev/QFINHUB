"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Locale, defaultLocale } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";
import { detectClientLocale } from "@/lib/i18n/geo-detect";

const LOCALE_COOKIE = "qfinhub-locale";

type LocaleProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

type LocaleProviderState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const initialState: LocaleProviderState = {
  locale: defaultLocale,
  setLocale: () => null,
};

const LocaleProviderContext = createContext<LocaleProviderState>(initialState);

function getLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}\\s*=\\s*([^;]*)`),
  );
  if (!match) return null;
  const value = match[1] as string;
  if (value === "en" || value === "es" || value === "hi") return value;
  return null;
}

function setLocaleCookie(locale: Locale): void {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch {
    // private browsing
  }
}

export function LocaleProvider({
  children,
  initialLocale,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? defaultLocale,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Priority: 1) Cookie, 2) navigator.language, 3) default
    const cookieLocale = getLocaleCookie();
    if (cookieLocale) {
      setLocaleState(cookieLocale);
      return;
    }

    const detected = detectClientLocale();
    if (detected !== defaultLocale) {
      setLocaleState(detected);
      setLocaleCookie(detected);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);

    // Update the html lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  // Sync html lang attribute
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  // Prevent hydration mismatch by rendering children only on client
  // after mount, same pattern as ThemeProvider
  if (!mounted) {
    return (
      <LocaleProviderContext.Provider value={{ locale, setLocale }}>
        {children}
      </LocaleProviderContext.Provider>
    );
  }

  return (
    <LocaleProviderContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleProviderContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleProviderContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

/**
 * Convenience hook that combines useLocale + getTranslation.
 * Usage: const { t, locale, setLocale } = useTranslation();
 *        t("nav.calculators") → "Calculators"
 */
export function useTranslation() {
  const { locale, setLocale } = useLocale();
  const t = React.useCallback(
    (path: string) => getTranslation(locale, path),
    [locale],
  );
  return { t, locale: locale as Locale, setLocale } as const;
}
