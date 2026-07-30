"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns `true` after the component has mounted on the client,
 * `false` during SSR and the very first client render.
 *
 * Implemented with `useSyncExternalStore` instead of a
 * `useEffect(() => setMounted(true), [])` pattern. The latter triggers
 * a cascading render that the React Compiler flags with
 * `react-hooks/set-state-in-effect`.
 *
 * The store flips to `true` after the first browser microtask, which
 * happens before the next React commit. The server snapshot returns
 * `false`, and so does the first client snapshot — both are consistent
 * so React does not report a hydration mismatch. After the microtask
 * runs, subsequent reads return `true`, triggering a re-render exactly
 * once.
 */

let mounted = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getClientSnapshot() {
  return mounted;
}

function getServerSnapshot() {
  return false;
}

function flipMounted() {
  if (mounted) return;
  mounted = true;
  for (const l of listeners) l();
}

// Lazily schedule the flip the first time a consumer subscribes.
let scheduled = false;
function scheduleFlip() {
  if (scheduled || mounted) return;
  scheduled = true;
  // Queue the flip for after the current synchronous render commits.
  // This guarantees the SSR snapshot (false) and first client snapshot
  // (false) match, avoiding hydration warnings.
  if (typeof queueMicrotask === "function") {
    queueMicrotask(flipMounted);
  } else {
    Promise.resolve().then(flipMounted);
  }
}

export function useIsMounted(): boolean {
  if (typeof window !== "undefined" && !mounted && !scheduled) {
    scheduleFlip();
  }
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}