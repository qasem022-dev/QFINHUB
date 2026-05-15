"use client";

import * as React from "react";
import {
  ACCEPT_ALL_CONSENT,
  DEFAULT_CONSENT,
  CONSENT_LABELS,
  TOGGLEABLE_CATEGORIES,
  ALWAYS_ON_CATEGORIES,
  applyConsent,
  shouldShowBanner,
  getEffectiveConsent,
  type ConsentCategory,
  type ConsentSettings,
  type ConsentState,
} from "@/lib/consent-manager";
import { X, Shield } from "lucide-react";

// ── Constants ──

const STORAGE_CHECK_KEY = "qfinhub-consent-v2";

// ── Helpers ──

function cookieConsentAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_CHECK_KEY) !== null;
  } catch {
    return false;
  }
}

// ── Toggle Row ──

function ToggleRow({
  category,
  enabled,
  disabled,
  onChange,
}: {
  category: ConsentCategory;
  enabled: boolean;
  disabled: boolean;
  onChange: (category: ConsentCategory, granted: boolean) => void;
}) {
  const info = CONSENT_LABELS[category];
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`consent-${category}`}
          className={`text-sm font-medium ${
            disabled
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {info.label}
        </label>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {info.description}
        </p>
      </div>
      <button
        id={`consent-${category}`}
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(category, !enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-dark ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : ""
        } ${
          enabled
            ? "bg-primary-600"
            : "bg-gray-200 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Customization Modal ──

function CustomizeModal({
  settings,
  onUpdate,
  onAcceptAll,
  onSave,
  onClose,
}: {
  settings: ConsentSettings;
  onUpdate: (settings: ConsentSettings) => void;
  onAcceptAll: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const handleToggle = React.useCallback(
    (category: ConsentCategory, granted: boolean) => {
      onUpdate({ ...settings, [category]: granted ? "granted" : "denied" });
    },
    [settings, onUpdate]
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-surface-dark-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Privacy Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Choose which cookies and tracking technologies you allow. Your
            choices are stored locally and can be updated anytime from your
            browser settings.
          </p>
        </div>

        {/* Toggles */}
        <div className="divide-y divide-gray-100 px-6 dark:divide-gray-700">
          {/* Toggleable categories */}
          {TOGGLEABLE_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              category={cat}
              enabled={settings[cat] === "granted"}
              disabled={false}
              onChange={handleToggle}
            />
          ))}
          {/* Always-on categories */}
          {ALWAYS_ON_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              category={cat}
              enabled={true}
              disabled={true}
              onChange={handleToggle}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-700 sm:flex-row sm:justify-between">
          <button
            onClick={onAcceptAll}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
          >
            Accept All
          </button>
          <button
            onClick={onSave}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-surface-dark dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Save Choices
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Consent Banner Component ──

export function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [customSettings, setCustomSettings] = React.useState<ConsentSettings>(
    () => DEFAULT_CONSENT
  );

  React.useEffect(() => {
    // Delay the appearance slightly to avoid layout shift
    const timer = setTimeout(() => {
      if (shouldShowBanner()) {
        setVisible(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = React.useCallback(() => {
    applyConsent(ACCEPT_ALL_CONSENT);
    setVisible(false);
    setShowModal(false);
  }, []);

  const handleRejectAll = React.useCallback(() => {
    applyConsent(DEFAULT_CONSENT);
    setVisible(false);
    setShowModal(false);
  }, []);

  const handleOpenCustomize = React.useCallback(() => {
    setCustomSettings(getEffectiveConsent());
    setShowModal(true);
  }, []);

  const handleSaveCustom = React.useCallback(() => {
    applyConsent(customSettings);
    setVisible(false);
    setShowModal(false);
  }, [customSettings]);

  if (!visible && !showModal) return null;

  return (
    <>
      {/* Bottom Bar */}
      {visible && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-surface-dark-elevated dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            {/* Text */}
            <div className="flex items-start gap-3 sm:max-w-xl">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Your Privacy Matters
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  We use cookies and similar technologies to improve your
                  experience, analyze traffic, and support our free service. You
                  can choose which categories to allow.{" "}
                  <a
                    href="/privacy"
                    className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
              <button
                onClick={handleOpenCustomize}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-surface-dark dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-surface-dark dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg bg-primary-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {showModal && (
        <CustomizeModal
          settings={customSettings}
          onUpdate={setCustomSettings}
          onAcceptAll={handleAcceptAll}
          onSave={handleSaveCustom}
          onClose={() => {
            setShowModal(false);
            if (!cookieConsentAccepted()) {
              // Don't dismiss the banner if user never accepted
            } else {
              setVisible(false);
            }
          }}
        />
      )}
    </>
  );
}
