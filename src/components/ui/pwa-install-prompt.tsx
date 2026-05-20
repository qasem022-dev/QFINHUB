"use client";

import * as React from "react";
import { X, Download, Smartphone, Share2, Plus, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePWA } from "@/hooks/use-pwa";

/**
 * PWA install banner that:
 * - On Chrome desktop/Android: shows "Install App" button when beforeinstallprompt fires
 * - On iPhone/iPad: shows interactive step-by-step instructions modal
 */
export function PWAInstallPrompt() {
  const { canInstall, install, isStandalone, isIOS, isDesktop, isAndroid } =
    usePWA();
  const [show, setShow] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [showIOSHint, setShowIOSHint] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  // Check for permanent dismissal in session storage
  React.useEffect(() => {
    const stored = sessionStorage.getItem("pwa-dismissed");
    if (stored) setDismissed(true);
  }, []);

  // Show the banner after a delay
  React.useEffect(() => {
    if (isStandalone) return;

    const timer = setTimeout(() => {
      if (canInstall) return;
      if (isIOS) {
        setShowIOSHint(true);
        setShow(true);
      } else if (!dismissed) {
        setShow(true);
      }
    }, 3000);  // Show quickly for better visibility

    return () => clearTimeout(timer);
  }, [isStandalone, isIOS, canInstall, dismissed]);

  // Show immediately when Chrome fires beforeinstallprompt
  React.useEffect(() => {
    if (canInstall && !dismissed) {
      setShow(true);
    }
  }, [canInstall, dismissed]);

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "true");
  };

  const handleDismissSession = () => {
    setShow(false);
  };

  if (isStandalone) return null;

  const iOSMode = isIOS || showIOSHint;
  const installMode = canInstall && !iOSMode;

  return (
    <>
      {/* Banner */}
      {!show ? null : (
        <div
          className={cn(
            "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300",
          )}
        >
          <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-surface-dark-elevated">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Dismiss install prompt"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm">
                <span className="text-sm font-bold text-white">Q</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Install QFINHUB
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {iOSMode ? (
                    <>
                      Tap Share{" "}
                      <span className="inline-block align-middle text-base leading-none">
                        ⎋
                      </span>{" "}
                      → &ldquo;Add to Home Screen&rdquo;
                    </>
                  ) : installMode ? (
                    "Install as an app for quick access and offline use"
                  ) : isDesktop ? (
                    "Use Chrome browser and look for the install icon in the address bar"
                  ) : (
                    "Add to your home screen for the best experience"
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex justify-end gap-2">
              {installMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs"
                  >
                    Not now
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="gap-1.5 bg-gradient-to-r from-primary-600 to-accent-500 text-xs text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Install App
                  </Button>
                </>
              ) : iOSMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismissSession}
                    className="text-xs"
                  >
                    Later
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowIOSModal(true)}
                    className="gap-1.5 bg-gradient-to-r from-primary-600 to-accent-500 text-xs text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    How to Install
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDismiss}
                    variant="outline"
                    className="text-xs"
                  >
                    OK
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* iOS Step-by-Step Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-dark-elevated animate-in slide-in-from-bottom-8 duration-300 sm:slide-in-from-bottom-4">
            {/* Handle bar (mobile) */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm">
                  <span className="text-xs font-bold text-white">Q</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Install on iPhone
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Close instructions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step 1 */}
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                1
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tap the Share button
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  It&rsquo;s at the bottom of Safari — the square with an arrow pointing up
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-700">
                <Share2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                2
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Scroll down
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  In the share sheet, scroll past the app icons
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tap &ldquo;Add to Home Screen&rdquo;
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Then tap &ldquo;Add&rdquo; in the top-right corner
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-700">
                <Plus className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            {/* Done indicator */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                That&rsquo;s it! QFINHUB will appear on your home screen
              </span>
            </div>

            {/* Close button */}
            <div className="mt-5">
              <Button
                className="w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
                onClick={() => setShowIOSModal(false)}
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
