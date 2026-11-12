/**
 * ADCO Activity Manager — Backward-Compatible Facade
 *
 * The former 1,400+ line monolith has been decomposed into focused modules:
 *   config/env.config.js                    → runtime env, storage keys, thresholds
 *   config/adco-catalogs.config.js          → static catalogs (window.ADCO_CATALOGS)
 *   store/seed-data.js                      → demo dataset (window.ADCO_SEED_ACTIVITIES)
 *   store/activity.store.js                 → localStorage cache + RBAC query filtering
 *   services/branch.service.js              → supplying branch + coordinators lookup
 *   utils/gps-proximity.util.js             → Haversine + 150m proximity validation
 *   utils/score.util.js                     → 100-point weighted evaluation + leaderboard
 *   utils/brand-share.util.js               → 1/N multi-brand row multiplication
 *   services/activity-submission.service.js → create / follow-up rounds / offline sync
 *   services/activity-lifecycle.service.js  → closure + status transitions
 *
 * Each module registers itself in window.ADCO_ACTIVITY_MODULES. This facade composes their
 * static methods onto a single `ActivityManager` class so every existing call site
 * (`ActivityManager.x()` / `window.ActivityManager.x()`) keeps working with `this` binding intact.
 * Load order: all modules above MUST be included before this file.
 */

(function (global) {
  const REQUIRED = [
    'ActivityStore',
    'BranchService',
    'GpsProximityUtil',
    'ScoreUtil',
    'BrandShareUtil',
    'ActivitySubmissionService',
    'ActivityLifecycleService'
  ];
  const SKIP = new Set(['length', 'name', 'prototype']);

  class ActivityManager {}

  const modules = global.ADCO_ACTIVITY_MODULES || [];
  modules.forEach((mod) => {
    Object.getOwnPropertyNames(mod).forEach((key) => {
      if (SKIP.has(key)) return;
      Object.defineProperty(ActivityManager, key, Object.getOwnPropertyDescriptor(mod, key));
    });
  });

  const missing = REQUIRED.filter((n) => !global[n]);
  if (missing.length && typeof console !== 'undefined') {
    console.error('[ActivityManager] Missing modules (check <script> order):', missing.join(', '));
  }

  ActivityManager.CATALOGS = global.ADCO_CATALOGS;
  global.ActivityManager = ActivityManager;
})(window);
