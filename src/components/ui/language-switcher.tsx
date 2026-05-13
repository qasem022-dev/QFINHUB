"use client";

import { useTranslation } from "@/app/i18n-provider";
import { locales } from "@/lib/i18n";
import { ALL_LANGUAGES, getLanguageInfo } from "@/lib/i18n/languages";
import type { LanguageInfo } from "@/lib/i18n/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** Show compact mode (icon only, no label) — for the navbar */
  compact?: boolean;
  /** Optional className override */
  className?: string;
}

// Group languages for the dropdown
const LANGUAGE_GROUPS = [
  {
    label: "Most Popular",
    codes: ["en", "es", "hi", "fr", "de", "pt", "zh", "ja", "ar"],
  },
  {
    label: "European",
    codes: ["it", "nl", "pl", "sv", "no", "da", "fi", "tr", "el", "ru", "uk", "ro", "cs", "hu"],
  },
  {
    label: "Asian & Middle East",
    codes: ["he", "ur", "zh-TW", "ko", "vi", "th", "id", "ms", "bn", "ta"],
  },
];

export function LanguageSwitcher({
  compact = false,
  className,
}: LanguageSwitcherProps) {
  const { t, locale, setLocale } = useTranslation();
  const currentLang = getLanguageInfo(locale);

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
          {!compact && currentLang && (
            <span className="hidden sm:inline">
              {currentLang.flag} {currentLang.nativeName}
            </span>
          )}
          {!compact && (
            <ChevronDown className="ml-1 h-3 w-3 text-gray-400" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        {LANGUAGE_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-medium text-gray-400 dark:text-gray-500 px-3 py-1.5">
              {group.label}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {group.codes.map((code) => {
                const lang = getLanguageInfo(code);
                if (!lang) return null;
                return (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLocale(code)}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {lang.flag} {lang.nativeName}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {lang.name}
                    </span>
                    {locale === code && (
                      <Check className="ml-auto h-4 w-4 text-primary-600" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </div>
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
  const currentLang = getLanguageInfo(locale);

  return (
    <div className={cn("space-y-1", className)}>
      <p className="px-3 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {t("common.language")}
      </p>
      {LANGUAGE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 py-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {group.label}
          </p>
          {group.codes.map((code) => {
            const lang = getLanguageInfo(code);
            if (!lang) return null;
            return (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  locale === code
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.nativeName}</span>
                {locale === code && (
                  <Check className="h-4 w-4 text-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
