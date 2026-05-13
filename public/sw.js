// Service Worker for QFINHUB PWA
// Enables "Add to Home Screen" on iOS and offline support

var CACHE_NAME = "qfinhub-v1";
var ASSETS_TO_CACHE = [
  "/",
  "/calculators",
  "/qfinhub-logo.svg",
];

// Install: cache core assets
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(function(response) {
        if (
          response && response.status === 200 &&
          event.request.method === "GET" &&
          (event.request.url.indexOf("/_next/static") !== -1 ||
           event.request.url.indexOf("/calculators") !== -1 ||
           event.request.url.indexOf("/tools") !== -1 ||
           event.request.url.indexOf(".css") !== -1 ||
           event.request.url.indexOf(".js") !== -1)
        ) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
