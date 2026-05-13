"use client";

import * as React from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePWA } from "@/hooks/use-pwa";

/**
 * PWA install banner that:
 * - On Chrome desktop/Android: shows "Install App" button when beforeinstallprompt fires
 * - On iPhone/iPad: shows instructions to use Share → Add to Home Screen
 * - Never permanently dismisses on iOS (always shows on new session)
 */
export function PWAInstallPrompt() {
  const { canInstall, install, isStandalone, isIOS, isDesktop, isAndroid } =
    usePWA();
  const [show, setShow] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [showIOSHint, setShowIOSHint] = React.useState(false);

  // Check for permanent dismissal in session storage
  React.useEffect(() => {
    const stored = sessionStorage.getItem("pwa-dismissed");
    if (stored) setDismissed(true);
  }, []);

  // Show the banner after a delay
  React.useEffect(() => {
    if (isStandalone) return;

    // If beforeinstallprompt fires, we show immediately (handled by canInstall)
    // Otherwise show after 10s for iOS/other browsers
    const timer = setTimeout(() => {
      if (canInstall) {
        // Already showing because beforeinstallprompt fired
        return;
      }
      if (isIOS) {
        setShowIOSHint(true);
        setShow(true);
      } else if (!dismissed) {
        setShow(true);
      }
    }, 10000);

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
    // Don't set permanent dismissal — just hide for this session
  };

  if (isStandalone || !show) return null;

  const iOSMode = isIOS || showIOSHint;
  const installMode = canInstall && !iOSMode;

  return (
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
              {installMode ? "Install QFINHUB" : "Install QFINHUB"}
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
  );
}
