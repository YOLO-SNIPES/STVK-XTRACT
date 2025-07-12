const CACHE_NAME = 'stak-xtract-v2.0.1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('STAK-XTRACT: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('STAK-XTRACT: Cache installation failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('STAK-XTRACT: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and data URLs
  if (event.request.url.startsWith('chrome-extension:') || 
      event.request.url.startsWith('data:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page or basic response for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline - STAK-XTRACT', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle background sync for exports
self.addEventListener('sync', (event) => {
  if (event.tag === 'export-samples') {
    event.waitUntil(doBackgroundExport());
  }
});

async function doBackgroundExport() {
  console.log('STAK-XTRACT: Background export triggered');
  // Background export logic would go here
  // For now, just log the event
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'STAK-XTRACT notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'stak-xtract',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'STAK-XTRACT', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log('STAK-XTRACT Service Worker v2.0.1 loaded');
