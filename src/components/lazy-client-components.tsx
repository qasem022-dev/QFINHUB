"use client";

import dynamic from "next/dynamic";

const AdsterraBanner = dynamic(
  () => import("@/components/ads/adsterra-banner").then((m) => ({ default: m.AdsterraBanner })),
  { ssr: false }
);

const ConsentBanner = dynamic(
  () => import("@/components/ui/consent-banner").then((m) => ({ default: m.ConsentBanner })),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(
  () => import("@/components/ui/pwa-install-prompt").then((m) => ({ default: m.PWAInstallPrompt })),
  { ssr: false }
);

/**
 * Client wrapper that lazy-loads heavy third-party components after hydration.
 * Using dynamic() with ssr:false inside a "use client" component avoids the
 * Next.js 16 restriction on server-component dynamic imports.
 */
export function LazyClientComponents() {
  return (
    <>
      <AdsterraBanner />
      <PWAInstallPrompt />
      <ConsentBanner />
    </>
  );
}
