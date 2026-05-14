"use client";

import Script from "next/script";
import * as React from "react";

/**
 * Adsterra Native Banner Ad
 * Loads lazily to avoid impacting page performance.
 * Renders a native banner container below the main content.
 */
export function AdsterraBanner() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR — ad only loads client-side
  if (!mounted) return null;

  return (
    <>
      {/* Load the Adsterra script lazily — lowest priority */}
      <Script
        src="https://pl29448163.profitablecpmratenetwork.com/93e6358fa4836a576dd463e0a148a834/invoke.js"
        strategy="lazyOnload"
        data-cfasync="false"
        async
      />
      {/* Native banner container — positioned non-intrusively */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6 mt-8">
        <div
          id="container-93e6358fa4836a576dd463e0a148a834"
          className="flex justify-center"
        />
      </div>
    </>
  );
}
