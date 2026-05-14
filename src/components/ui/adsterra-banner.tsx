"use client";

import Script from "next/script";
import * as React from "react";

/**
 * Adsterra Native Banner Ad
 * Renders after client hydration to avoid SSR issues.
 */
export function AdsterraBanner() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Script
        id="adsterra-invoke"
        src="https://pl29448163.profitablecpmratenetwork.com/93e6358fa4836a576dd463e0a148a834/invoke.js"
        strategy="lazyOnload"
      />
      <div className="w-full max-w-3xl mx-auto px-4 py-6 mt-8">
        <div
          id="container-93e6358fa4836a576dd463e0a148a834"
          className="flex justify-center min-h-[90px]"
        />
      </div>
    </>
  );
}
