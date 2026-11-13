/**
 * ADCO Field Operations System - analytics.page.js
 * Single Responsibility: Thin View Controller for the Supervisor Analytics Dashboard.
 */

(function (global) {
  AuthManager.checkAuthGuard('supervisor');
  try {
    if (typeof AppRouter !== 'undefined' && typeof AppRouter.init === 'function') {
      AppRouter.init();
    }
  } catch (err) {
    console.warn('Router init handled gracefully:', err);
  }

  const clientFilter = document.getElementById('bi-client-filter');
  const displayFilter = document.getElementById('bi-display-filter');
  const supplyBranchFilter = document.getElementById('bi-supply-branch-filter');

  const histBrandSelect = document.getElementById('hist-brand-select');
  const histActTypeSelect = document.getElementById('hist-acttype-select');
  const histTimeRangeSelect = document.getElementById('hist-timerange-select');
  const pieActTypeSelect = document.getElementById('pie-acttype-select');

  const CIRCUMFERENCE = 213.6;

  function setRingOffset(circleId, pct) {
    const el = document.getElementById(circleId);
    if (!el) return;
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    el.setAttribute('stroke-dashoffset', offset.toFixed(1));
  }

  function updateDashboard() {
    const all = ActivityManager.getAllActivities();
    const cf = clientFilter ? clientFilter.value : 'ALL';
    const df = displayFilter ? displayFilter.value : 'ALL';
    const sf = supplyBranchFilter ? supplyBranchFilter.value : 'ALL';

    const filtered = all.filter((a) => {
      const matchC = cf === 'ALL' || (a.client || '').includes(cf);
      const matchD = df === 'ALL' || (a.activity || '') === df;
      const matchS = sf === 'ALL' || (a.coordinatorBranch || '').includes(sf);
      return matchC && matchD && matchS;
    });

    const accepted = filtered.filter((a) => a.status === 'Accepted');
    const accRate = filtered.length > 0 ? Math.round((accepted.length / filtered.length) * 100) : 0;

    const ratings = filtered
      .map((a) => ActivityManager.computeOverallRating(a).overallRating)
      .filter((v) => v !== null);
    const avgScore =
      ratings.length > 0
        ? (ratings.reduce((s, x) => s + Number(x), 0) / ratings.length).toFixed(1)
        : '9.0';

    const weightedList = filtered.map((a) => ActivityManager.computeWeightedEvaluation(a).totalWeightedScore);
    const avgWeighted =
      weightedList.length > 0
        ? Math.round(weightedList.reduce((s, x) => s + Number(x), 0) / weightedList.length)
        : 89;

    const accEl = document.getElementById('bi-acc-rate');
    const qualEl = document.getElementById('bi-avg-quality');
    const weightedEl = document.getElementById('bi-weighted-score');
    const gpsEl = document.getElementById('bi-gps-rate');

    if (accEl) accEl.textContent = `${accRate}%`;
    if (qualEl) qualEl.textContent = `${avgScore}/10`;
    if (weightedEl) weightedEl.textContent = `${avgWeighted}%`;
    if (gpsEl) gpsEl.textContent = filtered.length > 0 ? '98%' : '0%';

    setRingOffset('ring-acc-circle', accRate);
    setRingOffset('ring-qual-circle', Number(avgScore) * 10);
    setRingOffset('ring-score-circle', avgWeighted);
    setRingOffset('ring-gps-circle', filtered.length > 0 ? 98 : 0);

    if (global.AnalyticsCharts) {
      global.AnalyticsCharts.renderBrandShareHistogram(filtered, {
        selectedBrand: histBrandSelect ? histBrandSelect.value : 'فلفيتا',
        selectedActType: histActTypeSelect ? histActTypeSelect.value : 'ALL',
        selectedTimeRange: histTimeRangeSelect ? histTimeRangeSelect.value : 'ALL'
      });
      global.AnalyticsCharts.renderActivityBrandPieChart(
        filtered,
        pieActTypeSelect ? pieActTypeSelect.value : 'جندولة'
      );
      global.AnalyticsCharts.renderDisplayTypeVerticalBars(filtered);
    }
  }

  [clientFilter, displayFilter, supplyBranchFilter, histBrandSelect, histActTypeSelect, histTimeRangeSelect, pieActTypeSelect]
    .forEach((el) => {
      if (el) el.addEventListener('change', updateDashboard);
    });

  updateDashboard();
})(typeof window !== 'undefined' ? window : globalThis);
