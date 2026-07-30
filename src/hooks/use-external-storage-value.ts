"use client";

import { useSyncExternalStore } from "react";

/**
 * Read a value from an external source (localStorage / sessionStorage)
 * as an external store via `useSyncExternalStore`.
 *
 * This is the React-Compiler-recommended pattern for "initialize state
 * from an external value after mount". The store subscription lives
 * entirely outside of `useEffect`, so the React Compiler's
 * `react-hooks/set-state-in-effect` rule does not fire.
 *
 * On the server (and during the first client render before mount) the
 * snapshot returns `serverFallback`, which should match the initial
 * value you would otherwise use for `useState`. After mount, the
 * underlying storage value is returned.
 *
 * Writes go through `setValue`, which persists to storage AND notifies
 * subscribers so all consumers re-read.
 */

type StoreKind = "local" | "session";

type Listener = () => void;

// Per-key subscription buckets so different keys don't trigger each
// other.
const listeners: Record<StoreKind, Map<string, Set<Listener>>> = {
  local: new Map(),
  session: new Map(),
};

// Cached last-read values so `getSnapshot` returns a stable reference
// when the underlying value hasn't changed. This is what
// useSyncExternalStore requires.
const cachedValues: Record<StoreKind, Map<string, string | null>> = {
  local: new Map(),
  session: new Map(),
};

function notify(kind: StoreKind, key: string) {
  const bucket = listeners[kind].get(key);
  if (bucket) for (const l of bucket) l();
}

function readStorage(kind: StoreKind, key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window[
      kind === "local" ? "localStorage" : "sessionStorage"
    ].getItem(key);
    return raw;
  } catch {
    return null;
  }
}

function subscribe(kind: StoreKind, key: string, listener: Listener) {
  let bucket = listeners[kind].get(key);
  if (!bucket) {
    bucket = new Set();
    listeners[kind].set(key, bucket);
  }
  bucket.add(listener);
  return () => {
    bucket!.delete(listener);
  };
}

function getSnapshot(kind: StoreKind, key: string): string | null {
  // Re-read every time — React's useSyncExternalStore only invokes
  // getSnapshot after a notification, so this stays cheap.
  const next = readStorage(kind, key);
  cachedValues[kind].set(key, next);
  return next;
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Write to storage and notify subscribers. Call this from user event
 * handlers (e.g. `setTheme`), NOT from useEffect bodies.
 */
export function setExternalStorageValue(
  kind: StoreKind,
  key: string,
  value: string | null,
): void {
  try {
    if (typeof window === "undefined") return;
    const storage = window[kind === "local" ? "localStorage" : "sessionStorage"];
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // private browsing or quota errors — ignore
  }
  cachedValues[kind].set(key, value);
  notify(kind, key);
}

export function useExternalStorageValue(
  kind: StoreKind,
  key: string,
): string | null {
  return useSyncExternalStore(
    (listener) => subscribe(kind, key, listener),
    () => getSnapshot(kind, key),
    getServerSnapshot,
  );
}