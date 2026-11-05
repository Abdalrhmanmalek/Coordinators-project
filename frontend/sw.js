const CACHE_NAME = 'adco-field-cache-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './css/mobile-pwa.css',
  './assets/ADCO-logo.png',
  './js/ui-helpers.js',
  './js/camera-compressor.js',
  './js/auth.js',
  './js/activity-manager.js',
  './js/supervisor.js',
  './js/app.js',
  './pages/login.html',
  './pages/signup-wizard.html',
  './pages/dashboard.html',
  './pages/activity-card.html',
  './pages/leaderboard.html',
  './pages/supervisor-panel.html',
  './pages/sheets-view.html',
  './pages/analytics.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(e.request, { ignoreSearch: true }).then((cachedRes) => {
          return cachedRes || caches.match('./index.html');
        });
      })
  );
});
