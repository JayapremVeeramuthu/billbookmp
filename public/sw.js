const CACHE_NAME = 'mp-prints-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Check if the request is for an API (Supabase or our own upload API)
  // We MUST NOT cache API responses, so we bypass the cache entirely (Network-Only).
  if (
    requestUrl.pathname.startsWith('/api/') || 
    requestUrl.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return; // Falling back to default browser behavior (Network-Only)
  }

  // 2. Offline client-side navigation fallback
  // If navigating to a route like /invoices or /dashboard, and offline, serve /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Static assets caching (Cache-First for hashed Vite build assets, Stale-While-Revalidate for other local assets)
  if (
    requestUrl.origin === self.location.origin && 
    (requestUrl.pathname.startsWith('/assets/') || STATIC_ASSETS.includes(requestUrl.pathname))
  ) {
    if (requestUrl.pathname.startsWith('/assets/')) {
      // Hashed assets (Vite production bundle)
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
      );
    } else {
      // Unhashed static files (index.html, manifest, icons)
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            });
            return cachedResponse || fetchPromise;
          });
        })
      );
    }
    return;
  }

  // 4. Default strategy: Cache falling back to network for other GET resources (like Google fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          event.request.method === 'GET' &&
          (requestUrl.origin === self.location.origin || 
           requestUrl.hostname.includes('fonts.googleapis.com') || 
           requestUrl.hostname.includes('fonts.gstatic.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
