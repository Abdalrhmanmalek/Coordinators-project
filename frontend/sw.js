const CACHE_NAME = 'adco-field-cache-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './css/mobile-pwa.css',
  './css/activity-details.css',
  './assets/ADCO-logo.png',
  './js/config/env.config.js',
  './js/config/adco-catalogs.config.js',
  './js/utils/formatters.js',
  './js/ui-helpers.js',
  './js/utils/camera-compressor.js',
  './js/store/employee-registry.seed.js',
  './js/auth.js',
  './js/store/seed-data.js',
  './js/store/activity.store.js',
  './js/services/branch.service.js',
  './js/utils/gps-proximity.util.js',
  './js/utils/score.util.js',
  './js/utils/brand-share.util.js',
  './js/services/activity-submission.service.js',
  './js/services/activity-lifecycle.service.js',
  './js/activity-manager.js',
  './js/services/report-export.service.js',
  './js/supervisor.js',
  './js/components/master-branch-card.js',
  './js/components/activity-card-item.js',
  './js/app.js',
  './pages/login.html',
  './pages/signup-wizard.html',
  './pages/dashboard.html',
  './pages/activity-card.html',
  './pages/activity-details.html',
  './js/pages/activity-details.page.js',
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
