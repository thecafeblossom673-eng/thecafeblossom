// Service worker for PWA support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Direct pass-through to ensure fresh data always and bypass next.js offline conflicts
  event.respondWith(fetch(event.request));
});
