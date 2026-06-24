const CACHE_NAME = 'house-of-joshi-v2';
const RUNTIME_CACHE = 'house-of-joshi-runtime';

// Core assets to cache for offline functionality
const urlsToCache = [
  '/',
  '/collections',
  '/launchpad',
  '/dashboard',
  '/manifest.json',
  '/joshi-logo.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

// Wallet connection related assets
const walletAssets = [
  // RainbowKit will be cached dynamically
  // WalletConnect CDN resources
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy for API calls (wallet connections)
// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle WalletConnect and wallet connection requests
  if (url.hostname.includes('walletconnect') || 
      url.hostname.includes('cloud.walletconnect.com') ||
      url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline fallback for HTML pages
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle background sync for wallet transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'wallet-transaction') {
    event.waitUntil(
      // Retry failed wallet transactions when back online
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              if (key.url.includes('/api/')) {
                return fetch(key.url).then((response) => {
                  if (response.ok) {
                    return cache.delete(key);
                  }
                });
              }
            })
          );
        });
      })
    );
  }
});

// Handle push notifications for wallet events
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Wallet notification',
    icon: '/joshi-logo.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification('House of Joshi', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
