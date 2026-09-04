/**
 * Paseo Altozano · Offline-First Service Worker
 * Guarantees 100% standalone totem kiosk operation even without internet.
 */

const CACHE_NAME = 'altozano-kiosk-v3.3.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './js/config.js',
  './js/state.js',
  './js/animator.js',
  './js/camera.js',
  './js/router.js',
  './js/renderer.js',
  './js/simulation.js',
  './js/editor.js',
  './js/ui.js',
  './js/app.js',
  './mall_graph.json',
  './gemini-code-1787086839436.json',
  './planta-baja-dark.png',
  './planta-uno-dark.png',
  './planta-dos-dark.png',
  './planta-baja.png',
  './planta-uno.png',
  './planta-dos.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some pre-cache assets failed to load:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Cache-First strategy with Network Fallback & Runtime Dynamic Caching
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background if online (Stale-While-Revalidate for app assets)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type === 'opaque' && !req.url.includes('cdn') && !req.url.includes('cdnjs') && !req.url.includes('fonts'))) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for HTML documents when offline
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
