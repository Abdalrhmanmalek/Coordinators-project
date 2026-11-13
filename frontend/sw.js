const CACHE_NAME = 'adco-field-cache-v28';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/app.min.css',
  './assets/images/ADCO-logo.avif',
  './assets/images/auth-hero-bg.avif',
  './assets/images/fathalla-branch.avif',
  './assets/images/avatar-coordinator.avif',
  './assets/images/avatar-supervisor.avif',
  './assets/images/medal-gold.avif',
  './assets/images/medal-silver.avif',
  './assets/images/medal-bronze.avif',
  './js/vendor/lucide.min.js',
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
  './js/components/filter-dropdown.js',
  './js/components/profile-modal.js',
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
  './pages/analytics.html',
  './pages/branch-details.html'
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

// Network-First for code/markup (.js, .css, .html) so updates appear immediately; Stale-While-Revalidate for static assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);
  const isCodeOrDoc =
    e.request.mode === 'navigate' ||
    /\.(js|css|html)$/i.test(url.pathname);

  if (isCodeOrDoc) {
    e.respondWith(
      fetch(e.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cachedRes) => {
      const fetchPromise = fetch(e.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});
