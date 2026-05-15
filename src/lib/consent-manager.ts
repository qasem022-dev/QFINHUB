/**
 * Google Consent Mode v2 Manager
 *
 * Handles consent state management, localStorage persistence,
 * and gtag consent signal updates. Must be loaded before gtag.js.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type ConsentCategory =
  | 'ad_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'analytics_storage'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage';

export type ConsentState = 'granted' | 'denied';

export type ConsentSettings = Record<ConsentCategory, ConsentState>;

const CONSENT_KEY = 'qfinhub-consent-v2';

/** Default consent state — everything denied except functional and security */
export const DEFAULT_CONSENT: ConsentSettings = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
};

/** Full grant — user clicked "Accept All" */
export const ACCEPT_ALL_CONSENT: ConsentSettings = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  personalization_storage: 'granted',
  security_storage: 'granted',
};

/** Labels for the consent banner UI */
export const CONSENT_LABELS: Record<
  ConsentCategory,
  { label: string; description: string }
> = {
  ad_storage: {
    label: 'Ad Storage',
    description: 'Stores information for personalized advertisements.',
  },
  ad_user_data: {
    label: 'Ad User Data',
    description: 'Sends user data for online advertising purposes.',
  },
  ad_personalization: {
    label: 'Ad Personalization',
    description: 'Allows personalized ad experiences.',
  },
  analytics_storage: {
    label: 'Analytics',
    description: 'Enables anonymous usage tracking to improve our site.',
  },
  functionality_storage: {
    label: 'Functional',
    description: 'Required for core site features and preferences.',
  },
  personalization_storage: {
    label: 'Personalization',
    description: 'Remembers your settings for a tailored experience.',
  },
  security_storage: {
    label: 'Security',
    description: 'Supports authentication and fraud prevention.',
  },
};

/** Categories shown in the customization modal (always-on categories excluded) */
export const TOGGLEABLE_CATEGORIES: ConsentCategory[] = [
  'analytics_storage',
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'personalization_storage',
];

/** Always-on categories greyed out in the modal */
export const ALWAYS_ON_CATEGORIES: ConsentCategory[] = [
  'functionality_storage',
  'security_storage',
];

/** Forward-looking: categories that should auto-grant over time if user accepted them */
export const CONSENT_SCOPES: Record<
  ConsentCategory,
  'analytics' | 'advertising' | 'functionality' | 'security'
> = {
  ad_storage: 'advertising',
  ad_user_data: 'advertising',
  ad_personalization: 'advertising',
  analytics_storage: 'analytics',
  functionality_storage: 'functionality',
  personalization_storage: 'functionality',
  security_storage: 'security',
};

/**
 * Type guard — returns true if the string is a valid ConsentCategory
 */
export function isConsentCategory(value: string): value is ConsentCategory {
  return value in DEFAULT_CONSENT;
}

/**
 * Read consent from localStorage.
 * Returns null if the user has never made a choice.
 */
export function getStoredConsent(): ConsentSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentSettings>;
    // Validate all keys exist
    for (const key of Object.keys(DEFAULT_CONSENT) as ConsentCategory[]) {
      if (parsed[key] !== 'granted' && parsed[key] !== 'denied') {
        return null; // Corrupted or old format
      }
    }
    return parsed as ConsentSettings;
  } catch {
    return null;
  }
}

/**
 * Persist consent to localStorage.
 */
export function storeConsent(settings: ConsentSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/**
 * Get the effective consent: stored consent or defaults.
 */
export function getEffectiveConsent(): ConsentSettings {
  return getStoredConsent() ?? DEFAULT_CONSENT;
}

/**
 * Send consent update to Google's gtag.
 * Safe to call even if gtag hasn't loaded yet — pushes to dataLayer.
 */
export function updateGtagConsent(settings: ConsentSettings): void {
  if (typeof window === 'undefined') return;
  try {
    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];
    // Google's gtag function
    (window as any).gtag =
      (window as any).gtag ||
      function () {
        (window.dataLayer as unknown[]).push(arguments);
      };
    (window as any).gtag('consent', 'update', settings);
  } catch {
    // Silently fail — consent update is non-critical for page function
  }
}

/**
 * Apply a full consent choice: persist + update gtag.
 */
export function applyConsent(settings: ConsentSettings): void {
  storeConsent(settings);
  updateGtagConsent(settings);
}

/**
 * Check if the user has made a consent choice.
 */
export function hasConsentChoice(): boolean {
  return getStoredConsent() !== null;
}

/**
 * Determine if the user likely needs a consent banner based on geo.
 * Returns true if we should show the banner (no stored choice).
 */
export function shouldShowBanner(): boolean {
  return !hasConsentChoice();
}
