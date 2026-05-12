"use client";

import * as React from "react";

/**
 * Injects the Plausible Analytics script exactly as provided.
 * Uses DOM API to ensure Plausible's verification tool detects it.
 */
export function PlausibleAnalytics() {
  const added = React.useRef(false);

  React.useEffect(() => {
    if (added.current) return;
    // Avoid duplicate if already present
    if (document.querySelector('script[src*="pa-d1k36"]')) return;

    const script = document.createElement("script");
    script.src = "https://plausible.io/js/pa-d1k36NifZ_XtlgAoh2nEW.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    added.current = true;
  }, []);

  return null;
}
