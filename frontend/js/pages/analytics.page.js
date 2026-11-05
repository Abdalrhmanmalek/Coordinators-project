/**
 * ADCO Field Operations System - analytics.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
AuthManager.checkAuthGuard('supervisor');
    AppRouter.init();

    const clientFilter = document.getElementById('bi-client-filter');
    const displayFilter = document.getElementById('bi-display-filter');

    function updateDashboard() {
      const all = ActivityManager.getAllActivities();
      const cf = clientFilter.value;
      const df = displayFilter.value;

      const filtered = all.filter((a) => {
        const matchC = cf === 'ALL' || (a.client || '').includes(cf);
        const matchD = df === 'ALL' || (a.activity || '') === df;
        return matchC && matchD;
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

      document.getElementById('bi-acc-rate').textContent = `${accRate}%`;
      document.getElementById('bi-avg-quality').textContent = `${avgScore}/10`;

      const expandedRows = ActivityManager.getExpandedBrandRows(filtered);
      const brandShares = {};

      expandedRows.forEach((row) => {
        const b = row.singleBrand;
        brandShares[b] = Number(((brandShares[b] || 0) + row.brandShareDecimal).toFixed(2));
      });

      const entries = Object.entries(brandShares);
      const maxVal = entries.length > 0 ? Math.max(...entries.map((e) => e[1]), 1) : 1;

      document.getElementById('brand-bars-mount').innerHTML =
        entries.length === 0
          ? `<p style="text-align:center;">لا توجد بيانات مطابقة للفلتر المحدد.</p>`
          : entries
              .map(([brand, totalShare]) => {
                const pct = Math.min(100, Math.round((totalShare / maxVal) * 100));
                return `
                  <div class="bar-row">
                    <div class="bar-meta">
                      <span>${brand}</span>
                      <span>مجموع الحصص: ${totalShare.toFixed(2)} (${pct}%)</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              })
              .join('');
    }

    clientFilter.addEventListener('change', updateDashboard);
    displayFilter.addEventListener('change', updateDashboard);

    updateDashboard();
})(typeof window !== 'undefined' ? window : globalThis);
