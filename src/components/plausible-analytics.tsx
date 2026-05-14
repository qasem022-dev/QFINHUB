"use client";

import Script from "next/script";
import * as React from "react";

/**
 * Plausible Analytics — Privacy-friendly analytics
 * Exact snippet format from Plausible dashboard.
 * Loads after page becomes interactive to avoid blocking rendering.
 */
export function PlausibleAnalytics() {
  return (
    <>
      {/* Privacy-friendly analytics by Plausible */}
      <Script
        async
        src="https://plausible.io/js/pa-d1k36NifZ_XtlgAoh2nEW.js"
        strategy="afterInteractive"
      />
      <Script
        id="plausible-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i{}};plausible.init()`,
        }}
      />
    </>
  );
}
