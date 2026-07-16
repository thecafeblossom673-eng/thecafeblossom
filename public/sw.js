// Service worker for PWA support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Do nothing. Let the browser handle all network requests normally.
  // This completely eliminates any "Failed to fetch" errors from the Service Worker.
  return;
});
