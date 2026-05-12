"use client";

import { useTranslation } from "@/app/i18n-provider";
import { locales, localeLabels } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** Show compact mode (icon only, no label) — for the navbar */
  compact?: boolean;
  /** Optional className override */
  className?: string;
}

const flagEmojis: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  hi: "🇮🇳",
};

export function LanguageSwitcher({
  compact = false,
  className,
}: LanguageSwitcherProps) {
  const { t, locale, setLocale } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
            className,
          )}
          aria-label={t("common.language")}
        >
          <Globe className="h-4 w-4" />
          {!compact && (
            <span className="hidden sm:inline">
              {flagEmojis[locale]} {localeLabels[locale]}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className="flex items-center justify-between"
          >
            <span>
              {flagEmojis[l]} {localeLabels[l]}
            </span>
            {locale === l && <Check className="h-4 w-4 text-primary-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Mobile-friendly language switcher (list of buttons, no dropdown).
 */
export function LanguageSwitcherMobile({
  className,
}: {
  className?: string;
}) {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className={cn("space-y-1", className)}>
      <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {t("common.language")}
      </p>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors",
            locale === l
              ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
          )}
        >
          <span>
            {flagEmojis[l]} {localeLabels[l]}
          </span>
          {locale === l && (
            <Check className="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400" />
          )}
        </button>
      ))}
    </div>
  );
}
