// Service Worker for QFINHUB PWA v2
// Enables "Add to Home Screen" on Chrome/Android and offline support

const CACHE_NAME = "qfinhub-v2";
const STATIC_CACHE = "qfinhub-static-v2";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/qfinhub-logo.svg",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/manifest.json",
  "/site.webmanifest",
];

// Install: cache core assets and activate immediately
self.addEventListener("install", function (event) {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

// Activate: clean old caches and claim all clients
self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Determine if a request is for a navigation (HTML page)
function isNavigationRequest(event) {
  return event.request.mode === "navigate";
}

// Determine if a request is for a static asset
function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".json") ||
      url.pathname.endsWith(".webmanifest"))
  );
}

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener("fetch", function (event) {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
  } else if (isNavigationRequest(event)) {
    // Network-first for HTML pages
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: serve cached version or fallback to homepage
          return caches.match(event.request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
  } else {
    // Network-first for API calls and other requests
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
