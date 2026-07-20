// Service worker for DependsiT Markdown Studio
// Caching strategy:
//   - Navigation requests (HTML): network-first, fall back to cached shell when offline.
//   - Static assets (_next/static/*, fonts, images): stale-while-revalidate —
//     serves from cache instantly while refreshing in the background. This gives
//     fast loads even on flaky connections and works offline after first visit.
//   - Everything else: network-first with cache fallback.
const CACHE_NAME = 'md-studio-v6';
const STATIC_CACHE = 'md-studio-static-v6';
const APP_SHELL = [
  '/',
  '/favicon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/pwa-32x32.png',
  '/pwa-44x44.png',
  '/pwa-48x48.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/og-image.webp',
  '/safari-pinned-tab.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  // Don't skipWaiting — let the user activate the new SW via reload to avoid
  // mid-session breakage. The new SW will take over on the next navigation.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests + our CDN preconnects.
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  // Navigation requests: network-first, fall back to cached shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets (_next/static/*, media, fonts, images): stale-while-revalidate.
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(?:woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|css|js|ico)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          // Fetch in the background to update the cache for next time.
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          // Return cached immediately, or wait for network if not cached.
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listen for messages from the page — allows "skip waiting" when the user
// explicitly accepts an update (via a toast button, for example).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
