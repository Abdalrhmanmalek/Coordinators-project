/**
 * ADCO Field Operations System - Analytics Page Controller
 * Single Responsibility: Business Intelligence metrics, Brand Share calculations, and campaign slicers
 */

import { AuthService } from '../services/auth.service.js';
import { ActivityService } from '../services/activity.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { NavbarComponent } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  AuthService.checkAuthGuard('supervisor');
  NavbarComponent.render();

  const clientFilter = document.getElementById('bi-client-filter');
  const displayFilter = document.getElementById('bi-display-filter');

  function updateDashboard() {
    const all = ActivityService.getAllActivities();
    const cf = clientFilter ? clientFilter.value : 'ALL';
    const df = displayFilter ? displayFilter.value : 'ALL';

    const filtered = all.filter((a) => {
      const matchC = cf === 'ALL' || (a.client || '').includes(cf);
      const matchD = df === 'ALL' || (a.activity || '') === df;
      return matchC && matchD;
    });

    const accepted = filtered.filter((a) => a.status === 'Accepted');
    const accRate = filtered.length > 0 ? Math.round((accepted.length / filtered.length) * 100) : 0;

    const ratings = filtered
      .map((a) => ScoreCalculator.computeOverallRating(a).overallRating)
      .filter((v) => v !== null);
    const avgScore =
      ratings.length > 0
        ? (ratings.reduce((s, x) => s + Number(x), 0) / ratings.length).toFixed(1)
        : '9.0';

    const rateEl = document.getElementById('bi-acc-rate');
    const qualEl = document.getElementById('bi-avg-quality');
    if (rateEl) rateEl.textContent = `${accRate}%`;
    if (qualEl) qualEl.textContent = `${avgScore}/10`;

    const expandedRows = ActivityService.getExpandedBrandRows(filtered);
    const brandShares = {};

    expandedRows.forEach((row) => {
      const b = row.singleBrand;
      brandShares[b] = Number(((brandShares[b] || 0) + row.brandShareDecimal).toFixed(2));
    });

    const entries = Object.entries(brandShares);
    const maxVal = entries.length > 0 ? Math.max(...entries.map((e) => e[1]), 1) : 1;

    const mount = document.getElementById('brand-bars-mount');
    if (!mount) return;

    mount.innerHTML =
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

  if (clientFilter) clientFilter.addEventListener('change', updateDashboard);
  if (displayFilter) displayFilter.addEventListener('change', updateDashboard);

  updateDashboard();
});
