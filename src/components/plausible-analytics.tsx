"use client";

import * as React from "react";

export function PlausibleAnalytics() {
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current) return;

    const initPlausible = async () => {
      try {
        const { init } = await import("@plausible-analytics/tracker");
        init({ domain: "www.qfinhub.com" });
        initialized.current = true;
      } catch (err) {
        console.warn("Plausible analytics init skipped:", err);
      }
    };

    initPlausible();
  }, []);

  return null;
}
