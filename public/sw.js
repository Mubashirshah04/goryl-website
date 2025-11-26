// Service Worker for Goryl Platform
// Basic service worker to handle offline functionality and caching
// ✅ UPDATED: Do NOT cache JavaScript bundles to prevent environment variable issues

const CACHE_NAME = 'goryl-v2'; // Incremented version to force update
const urlsToCache = [
  '/offline.html',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

// ✅ Helper: Check if URL should be cached
function shouldCache(url) {
  // NEVER cache JavaScript bundles (they contain environment variables)
  if (url.includes('/_next/static/') || url.includes('/_next/chunks/')) {
    return false;
  }
  
  // NEVER cache API routes (they may contain sensitive data)
  if (url.includes('/api/')) {
    return false;
  }
  
  // NEVER cache HTML pages (they may reference old bundles)
  if (url.endsWith('.html') || url.endsWith('/')) {
    return false;
  }
  
  // Only cache static assets (images, icons, etc.)
  return url.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event (v2 - no JS caching)');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential static files only');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - serve cached content when offline (but NOT JavaScript bundles)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  const url = event.request.url;
  
  // ✅ CRITICAL: NEVER cache JavaScript bundles - always fetch fresh
  if (url.includes('/_next/static/') || url.includes('/_next/chunks/') || url.includes('/api/')) {
    // Always fetch from network for JS bundles and API routes.
    // Provide a safe fallback so `respondWith` always receives a Response.
    event.respondWith(
      fetch(event.request).catch(() => {
        // Network failed — return an explicit 503 Response so the SW doesn't
        // pass an undefined value to respondWith which causes the "Failed to convert value to 'Response'" error.
        return new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }
  
  // For other resources, check cache but prefer network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Only return cached version if it's a static asset AND network fails
        if (response && shouldCache(url)) {
          // Try network first, fallback to cache
          return fetch(event.request)
            .then((networkResponse) => {
              // Update cache with fresh response
              if (networkResponse.ok) {
                // Clone before caching (response can only be read once)
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
                return networkResponse;
              }
              // Network failed, use cache (clone to avoid "already used" error)
              return response.clone();
            })
            .catch(() => {
              // Network error, use cache (clone to avoid "already used" error)
              return response.clone();
            });
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // If we didn't get a real Response, just pass it through.
            if (!response) {
              return new Response('No response', { status: 502, statusText: 'Bad Gateway' });
            }

            // Check if we received a valid response
            if (response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache static assets
            if (shouldCache(url)) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Network failure: try to return cached resource, then offline page, then a generic 503 Response
            return caches.match(event.request)
              .then((cached) => cached
                || (event.request.mode === 'navigate' ? caches.match('/offline.html') : null)
                || new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' })
              );
          });
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  // Add background sync logic here if needed
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  // Add push notification handling here if needed
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  // Add notification click handling here if needed
});

