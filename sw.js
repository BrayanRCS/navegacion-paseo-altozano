/**
 * Paseo Altozano · Offline-First Service Worker (Network-First Strategy)
 * Guarantees instant live updates when online + 100% standalone offline operation.
 */

const CACHE_NAME = 'altozano-kiosk-v3.4.0';

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
        console.warn('[ServiceWorker] Pre-cache asset warning:', err);
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
            console.log('[ServiceWorker] Purging old cache:', name);
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

  // NETWORK-FIRST STRATEGY: Always fetch fresh code when online, fallback to cache when offline
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // When offline or network fails, serve from cache
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
