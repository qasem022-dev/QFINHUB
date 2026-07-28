"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";
import { getCalculatorComponent } from "./registry";

type CalculatorSlotProps = {
  slug: string;
};

/**
 * CalculatorSlot — Client-only wrapper that resolves and renders the
 * dynamically-loaded calculator implementation for a given slug.
 *
 * Why this exists (and why it takes a slug, not a Component):
 *   1. The page route /calculators/[slug] is a Server Component (for SEO).
 *   2. The calculator implementations are Client Components, loaded via
 *      `next/dynamic` in registry.tsx.
 *   3. Next.js 16 RSC rules forbid passing function values (the dynamic
 *      loader) from a Server Component to a Client Component.
 *   4. So we pass a plain string (the slug) and resolve the component
 *      inside this Client Component on render.
 *
 * Why useMemo:
 *   Without memoization, every parent re-render would create a new dynamic
 *   loader closure, defeating React's component-equality checks and forcing
 *   re-mount. useMemo with a stable dependency (slug) avoids that.
 *
 * Returns null during SSR (the dynamic chunk isn't loaded server-side) and
 * renders the calculator once the client-side chunk arrives.
 */
export function CalculatorSlot({ slug }: CalculatorSlotProps) {
  const CalculatorComponent = useMemo<ComponentType<any> | null>(
    () => getCalculatorComponent(slug),
    [slug],
  );

  if (!CalculatorComponent) return null;
  return <CalculatorComponent />;
}