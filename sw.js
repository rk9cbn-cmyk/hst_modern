const CACHE_NAME = 'hst-modern-v3';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || req.url.endsWith('index.html');

  if (isHTML) {
    // Network-first: всегда пробуем свежий index.html, кэш — только офлайн-фолбэк
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Cache-first для статики (иконки, манифест)
  event.respondWith(
    caches.match(req).then((response) => {
      return response || fetch(req);
    })
  );
});
