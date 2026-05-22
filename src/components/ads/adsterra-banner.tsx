"use client";

import { useEffect, useRef } from "react";

/**
 * Adsterra Native Banner — deferred loading to protect LCP.
 *
 * The ad script loads from a third-party CDN which can take 2-5s on slow
 * 4G connections. By deferring ad injection until after the browser is idle
 * (or after a minimum delay), the hero content renders first — fixing the
 * 6.6s LCP regression on mobile PageSpeed.
 */
export function AdsterraBanner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const insertedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (insertedRef.current || !wrapperRef.current) return;
    insertedRef.current = true;

    const placementKey = "93e6358fa4836a576dd463e0a148a834";

    // Schedule ad injection after the browser is idle — or after 2s minimum.
    // requestIdleCallback defers until main thread is free (post-LCP).
    // Fallback: setTimeout 2000ms ensures hero content always renders first.
    const injectAd = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const container = document.createElement("div");
      container.id = `container-${placementKey}`;
      container.style.cssText = "min-height:120px;position:relative";

      const skeleton = document.createElement("div");
      skeleton.id = `container-${placementKey}-skeleton`;
      skeleton.style.cssText =
        "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:0.75rem";
      const skeletonText = document.createElement("span");
      skeletonText.style.cssText = "font-size:0.75rem;color:#9ca3af";
      skeletonText.textContent = "Loading...";
      skeleton.appendChild(skeletonText);
      container.appendChild(skeleton);

      const injectScript = () => {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://pl29448163.profitablecpmratenetwork.com/${placementKey}/invoke.js`;
        script.dataset.psid = placementKey;
        document.head.appendChild(script);
        return script;
      };

      let adScript = injectScript();

      const hideScript = document.createElement("script");
      hideScript.textContent = `(function(){var c=setInterval(function(){var a=document.getElementById('container-${placementKey}');var b=document.getElementById('container-${placementKey}-skeleton');if(a&&a.children.length>1){if(b)b.style.display='none';clearInterval(c);}},500);setTimeout(function(){clearInterval(c);var s=document.getElementById('container-${placementKey}-skeleton');if(s){s.style.display='none';}})();})();`;
      document.body.appendChild(hideScript);

      setTimeout(() => {
        const c = document.getElementById(`container-${placementKey}`);
        if (c && c.children.length <= 1) {
          if (adScript.parentNode) adScript.parentNode.removeChild(adScript);
          adScript = injectScript();
        }
      }, 6000);

      wrapper.appendChild(container);
    };

    // requestIdleCallback with 2s minimum timeout fallback
    if (typeof requestIdleCallback !== "undefined") {
      timerRef.current = setTimeout(() => {
        requestIdleCallback(() => injectAd(), { timeout: 1000 });
      }, 2000);
    } else {
      timerRef.current = setTimeout(injectAd, 2500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-3xl mx-auto px-4 py-6 mt-8"
    />
  );
}
