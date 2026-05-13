"use client";

import * as React from "react";

interface PWAState {
  /** Whether the user can install (beforeinstallprompt captured) */
  canInstall: boolean;
  /** Trigger the install prompt */
  install: () => Promise<boolean>;
  /** Whether the app is already in standalone mode (installed) */
  isStandalone: boolean;
  /** Whether the device is iOS */
  isIOS: boolean;
  /** Whether the device is desktop */
  isDesktop: boolean;
  /** Whether the device is Android */
  isAndroid: boolean;
}

let deferredPrompt: any = null;

export function usePWA(): PWAState {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [isAndroid, setIsAndroid] = React.useState(false);

  React.useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    const desktop = !ios && !android;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsIOS(ios);
    setIsAndroid(android);
    setIsDesktop(desktop);
    setIsStandalone(standalone);

    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = React.useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    const accepted = result.outcome === "accepted";
    deferredPrompt = null;
    setCanInstall(false);
    return accepted;
  }, []);

  return { canInstall, install, isStandalone, isIOS, isDesktop, isAndroid };
}
