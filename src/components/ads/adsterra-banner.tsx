"use client";

import { useEffect, useRef } from "react";

/**
 * Adsterra Native Banner — client-side insertion to avoid React DOM conflicts.
 *
 * React strips data-* attributes from <script> tags and manages DOM children.
 * This component uses vanilla JS to create the container + script elements
 * outside React's reconciliation, allowing Adsterra's script to freely
 * manipulate the DOM and read data-psid from the script tag.
 *
 * iOS Safari note: Scripts appended to document.head are prioritized over
 * document.body on Safari. A retry mechanism re-injects the script if ads
 * don't appear within 6 seconds (Safari sometimes defers async script execution).
 */
export function AdsterraBanner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const insertedRef = useRef(false);

  useEffect(() => {
    if (insertedRef.current || !wrapperRef.current) return;
    insertedRef.current = true;

    const wrapper = wrapperRef.current;
    const placementKey = "93e6358fa4836a576dd463e0a148a834";

    // Create container
    const container = document.createElement("div");
    container.id = `container-${placementKey}`;
    container.style.cssText = "min-height:120px;position:relative";

    // Create skeleton
    const skeleton = document.createElement("div");
    skeleton.id = `container-${placementKey}-skeleton`;
    skeleton.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:0.75rem";
    const skeletonText = document.createElement("span");
    skeletonText.style.cssText = "font-size:0.75rem;color:#9ca3af";
    skeletonText.textContent = "Loading...";
    skeleton.appendChild(skeletonText);
    container.appendChild(skeleton);

    // Function to create and inject the Adsterra invoke script
    const injectScript = () => {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pl29448163.profitablecpmratenetwork.com/${placementKey}/invoke.js`;
      script.dataset.psid = placementKey;
      // Safari prioritizes head scripts — more reliable than body
      document.head.appendChild(script);
      return script;
    };

    // Inject the main Adsterra script
    let adScript = injectScript();

    // Skeleton-hider script with retry logic for Safari
    const hideScript = document.createElement("script");
    hideScript.textContent = `(function(){var c=setInterval(function(){var a=document.getElementById('container-${placementKey}');var b=document.getElementById('container-${placementKey}-skeleton');if(a&&a.children.length>1){if(b)b.style.display='none';clearInterval(c);}},500);setTimeout(function(){clearInterval(c);var s=document.getElementById('container-${placementKey}-skeleton');if(s){s.style.display='none';}})();})();`;
    document.body.appendChild(hideScript);

    // Retry: if ads haven't loaded after 6s on Safari, re-inject the script
    setTimeout(() => {
      const c = document.getElementById(`container-${placementKey}`);
      if (c && c.children.length <= 1) {
        // Remove old script, inject fresh one
        if (adScript.parentNode) adScript.parentNode.removeChild(adScript);
        adScript = injectScript();
      }
    }, 6000);

    wrapper.appendChild(container);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-3xl mx-auto px-4 py-6 mt-8"
    />
  );
}
