"use client";

import * as React from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "other" | null;

export function PWAInstallPrompt() {
  const [show, setShow] = React.useState(false);
  const [platform, setPlatform] = React.useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    // Check if already installed (display-mode: standalone)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) return; // Already installed, don't show prompt

    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("other");
    }

    // Listen for the PWA install prompt (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isAndroid) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt after a delay (don't show immediately on first visit)
    const timer = setTimeout(() => {
      if (!dismissed && !isStandalone) {
        setShow(true);
      }
    }, 8000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [dismissed]);

  // Check if user has dismissed before (sessionStorage)
  React.useEffect(() => {
    const stored = sessionStorage.getItem("pwa-dismissed");
    if (stored) setDismissed(true);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
    // On iOS, the button just shows instructions — handled in the UI
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "true");
  };

  if (!show || dismissed) return null;

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
              Install QFINHUB
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {platform === "ios"
                ? <>Tap the Share button <span className="inline-block align-middle text-base leading-none">⎋</span> then &ldquo;Add to Home Screen&rdquo;</>
                : "Add to your home screen for the best experience"}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Not now
          </Button>
          {platform === "android" && deferredPrompt ? (
            <Button
              size="sm"
              onClick={handleInstall}
              className="gap-1.5 bg-gradient-to-r from-primary-600 to-accent-500 text-xs text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          ) : platform === "ios" ? (
            <Button
              size="sm"
              onClick={handleDismiss}
              className="gap-1.5 bg-gradient-to-r from-primary-600 to-accent-500 text-xs text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
            >
              <Download className="h-3.5 w-3.5" />
              Got it
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleDismiss}
              variant="outline"
              className="text-xs"
            >
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
