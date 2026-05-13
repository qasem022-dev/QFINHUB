"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface VariantCalculatorClientProps {
  calculatorId: string;
  params: Record<string, any>;
}

/**
 * Client component that wraps a calculator and sets initial values
 * from URL search params or variant params by dispatching input events.
 */
export function VariantCalculatorClient({
  calculatorId,
  params,
}: VariantCalculatorClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const hasSetValues = useRef(false);

  useEffect(() => {
    if (hasSetValues.current) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      // Merge variant params with URL search params (URL params take precedence)
      const mergedParams = { ...params };

      // URL search params override variant defaults
      searchParams.forEach((value, key) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          mergedParams[key] = numValue;
        } else {
          mergedParams[key] = value;
        }
      });

      // Dispatch change events for each input field
      Object.entries(mergedParams).forEach(([key, value]) => {
        if (typeof value !== "number" && typeof value !== "string") return;
        if (key === "calculatorId") return;

        const input = container.querySelector(`#${CSS.escape(key)}`) as HTMLElement | null;
        if (!input) return;

        // Handle different input types
        if (input.tagName === "INPUT") {
          const inputEl = input as HTMLInputElement;
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputEl, String(typeof value === "number" ? Math.round(value) : value));
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } else if (input.getAttribute("role") === "slider") {
          // Trigger slider change
          input.dispatchEvent(new Event("mousedown", { bubbles: true }));
        }
      });

      hasSetValues.current = true;
    }, 500); // Wait for dynamic import to complete

    return () => clearTimeout(timer);
  }, [searchParams, params]);

  return <div ref={containerRef} id={`calc-container-${calculatorId}`} />;
}
