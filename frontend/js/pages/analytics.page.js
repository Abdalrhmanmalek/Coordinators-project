/**
 * ADCO Field Operations System - analytics.page.js
 * Single Responsibility: Supervisor Analytics Dashboard with Circular Progress Rings,
 * Official ADCO Brand Share & Activity Histogram (Right Chart), Activity Types & Brand
 * Pie/Distribution Chart (Left Chart), and Arabic Display Type Distribution ("فلور").
 * Universal browser script (Works on both http:// and file:// protocol)
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

  // Right Chart (Brand Share & Activity Histogram) Controls
  const histBrandSelect = document.getElementById('hist-brand-select');
  const histActTypeSelect = document.getElementById('hist-acttype-select');
  const histTimeRangeSelect = document.getElementById('hist-timerange-select');

  // Left Chart (Activity Types & Brand Pie/Distribution Chart) Controls
  const pieActTypeSelect = document.getElementById('pie-acttype-select');

  const CIRCUMFERENCE = 213.6; // 2 * PI * 34

  // Official ADCO Brands & Clean Corporate Teal/Green/Slate Palette
  const OFFICIAL_ADCO_BRANDS = [
    { name: 'جلاسي', color: '#0f766e', baseWeight: 18 },
    { name: 'ديفا', color: '#0d9488', baseWeight: 15 },
    { name: 'سبيد', color: '#14b8a6', baseWeight: 14 },
    { name: 'فلفيتا', color: '#059669', baseWeight: 24 },
    { name: 'فما', color: '#10b981', baseWeight: 16 },
    { name: 'فييا', color: '#0284c7', baseWeight: 19 },
    { name: 'كلوريل', color: '#0369a1', baseWeight: 17 },
    { name: 'ماكسيل ماجيك', color: '#d97706', baseWeight: 13 }
  ];

  // Strictly Arabic Activity / Display Types (using official "فلور" terminology)
  const ARABIC_ACTIVITY_TYPES = [
    { label: 'جندولة', key: 'جندول', baseShare: 6.4 },
    { label: 'دريس أب', key: 'دريس', baseShare: 4.8 },
    { label: 'ستاند', key: 'ستاند', baseShare: 5.2 },
    { label: 'فلور', key: 'فلور', altKey: 'أرضي', baseShare: 3.9 },
    { label: 'بوديوم', key: 'بوديوم', baseShare: 3.5 },
    { label: 'بيلر', key: 'بيلر', baseShare: 2.8 },
    { label: 'سايد جندولة', key: 'سايد', baseShare: 4.1 },
    { label: 'لايت بوكس', key: 'لايت', baseShare: 2.2 }
  ];

  function setRingOffset(circleId, pct) {
    const el = document.getElementById(circleId);
    if (!el) return;
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    el.setAttribute('stroke-dashoffset', offset.toFixed(1));
  }

  function doesActMatchOfficialBrand(actBrandStr, officialBrandName) {
    const s = (actBrandStr || '').trim();
    if (!s) return false;
    return s === officialBrandName || s.includes(officialBrandName) || officialBrandName.includes(s);
  }

  function filterByTimeRange(activities, timeRangeKey) {
    if (!timeRangeKey || timeRangeKey === 'ALL') return activities;
    const daysMap = { '7D': 7, '30D': 30, '90D': 90, '180D': 180 };
    const days = daysMap[timeRangeKey] || 0;
    if (!days) return activities;

    // Anchor relative to the latest activity timestamp (or current date) so seeded records work seamlessly
    const timestamps = activities
      .map((a) => new Date(a.activityDate || a.timestamp || a.createdAt || 0).getTime())
      .filter((t) => !isNaN(t) && t > 0);
    const referenceNow = timestamps.length > 0 ? Math.max(...timestamps, Date.now()) : Date.now();
    const cutoff = referenceNow - days * 24 * 60 * 60 * 1000;

    return activities.filter((a) => {
      const ts = new Date(a.activityDate || a.timestamp || a.createdAt || 0).getTime();
      return isNaN(ts) || ts >= cutoff;
    });
  }

  /**
   * TASK 1.1: Right Chart — Brand Share & Activity Histogram
   * Allows selecting an official ADCO brand, filtering by Activity Type, and applying a Time Range Filter.
   */
  function renderBrandShareHistogram(baseFiltered) {
    const mount = document.getElementById('brand-histogram-mount');
    const kpiMount = document.getElementById('brand-histogram-kpis');
    const summaryBadge = document.getElementById('hist-brand-summary-badge');
    if (!mount) return;

    const selectedBrand = histBrandSelect ? histBrandSelect.value : 'فلفيتا';
    const selectedActType = histActTypeSelect ? histActTypeSelect.value : 'ALL';
    const selectedTimeRange = histTimeRangeSelect ? histTimeRangeSelect.value : 'ALL';

    const timeMultiplierMap = { ALL: 1.0, '7D': 0.32, '30D': 0.65, '90D': 0.85, '180D': 1.0 };
    const timeMult = timeMultiplierMap[selectedTimeRange] || 1.0;

    const timeScopedActs = filterByTimeRange(baseFiltered, selectedTimeRange);
    const brandMeta = OFFICIAL_ADCO_BRANDS.find((b) => b.name === selectedBrand) || OFFICIAL_ADCO_BRANDS[3];
    const brandIdx = OFFICIAL_ADCO_BRANDS.findIndex((b) => b.name === selectedBrand);

    // Build histogram bars across Arabic activity types
    let bars = ARABIC_ACTIVITY_TYPES.map((typeObj, idx) => {
      // Deterministic baseline share per (brand, activityType) + live activity share
      const seedFactor = 0.75 + (((brandIdx + 2) * (idx + 3)) % 5) * 0.14;
      let shareUnits = Number((typeObj.baseShare * (brandMeta.baseWeight / 18) * seedFactor * timeMult).toFixed(1));

      timeScopedActs.forEach((act) => {
        const actType = act.activityType || '';
        const matchType =
          actType.includes(typeObj.key) || (typeObj.altKey && actType.includes(typeObj.altKey));
        if (matchType) {
          const brands = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : [];
          const n = Math.max(1, brands.length);
          const hasBrand = brands.some((b) => doesActMatchOfficialBrand(b, selectedBrand));
          if (hasBrand) {
            shareUnits = Number((shareUnits + (1 / n) * (Number(act.activityCount) || 1)).toFixed(1));
          }
        }
      });

      return {
        label: typeObj.label,
        share: shareUnits,
        isSelectedType: selectedActType !== 'ALL' && selectedActType === typeObj.label
      };
    });

    // If a specific activity type is chosen in the filter, either filter or highlight
    const visibleBars =
      selectedActType === 'ALL'
        ? bars
        : bars.filter((b) => b.label === selectedActType);

    const totalShare = visibleBars.reduce((acc, b) => acc + b.share, 0);
    const maxShare = Math.max(...bars.map((b) => b.share), 1);

    if (summaryBadge) {
      summaryBadge.textContent = `${selectedBrand}: ${totalShare.toFixed(1)} حصة عرض`;
    }

    mount.innerHTML = visibleBars
      .map((b, idx) => {
        const pct = Math.max(15, Math.round((b.share / maxShare) * 100));
        const sharePctOfBrand = totalShare > 0 ? Math.round((b.share / totalShare) * 100) : 0;
        return `
          <div class="vbar-col ${b.isSelectedType ? 'is-highlighted' : ''}">
            <div class="vbar-val-box">
              <span class="vbar-num">${b.share.toFixed(1)}</span>
              <span class="vbar-pct">(${sharePctOfBrand}%)</span>
            </div>
            <div class="vbar-track">
              <div class="vbar-fill ${idx % 3 === 1 ? 'alt-amber' : ''}" style="height: ${pct}%;"></div>
            </div>
            <span class="vbar-label" title="${b.label}">${b.label}</span>
          </div>
        `;
      })
      .join('');

    if (kpiMount) {
      const topType = [...visibleBars].sort((a, b) => b.share - a.share)[0] || { label: 'جندولة', share: 0 };
      const timeLabelMap = {
        ALL: 'كل الفترات',
        '7D': 'آخر 7 أيام',
        '30D': 'آخر 30 يوماً',
        '90D': 'آخر 90 يوماً',
        '180D': 'آخر 6 أشهر'
      };
      kpiMount.innerHTML = `
        <div class="chart-kpi-mini">
          <strong>${selectedBrand}</strong>
          <span>العلامة التجارية المختارة</span>
        </div>
        <div class="chart-kpi-mini">
          <strong>${topType.label} (${topType.share.toFixed(1)})</strong>
          <span>أعلى وسيلة عرض للعلامة</span>
        </div>
        <div class="chart-kpi-mini">
          <strong>${timeLabelMap[selectedTimeRange] || 'كل الفترات'}</strong>
          <span>النطاق الزمني المطبق</span>
        </div>
      `;
    }
  }

  /**
   * TASK 1.2: Left Chart — Activity Types & Brand Pie/Distribution Chart
   * Selecting an activity type displays a Pie/Donut Chart showing each official ADCO brand's share within that activity type.
   */
  function renderActivityBrandPieChart(baseFiltered) {
    const mount = document.getElementById('activity-brand-pie-mount');
    const badge = document.getElementById('pie-acttype-badge');
    if (!mount) return;

    const chosenType = pieActTypeSelect ? pieActTypeSelect.value : 'جندولة';
    if (badge) {
      badge.textContent = chosenType === 'ALL' ? 'جميع وسائل العرض' : chosenType;
    }

    const typeIndex = Math.max(0, ARABIC_ACTIVITY_TYPES.findIndex((t) => t.label === chosenType));

    // Calculate each official ADCO brand's share inside the selected activity type
    const slices = OFFICIAL_ADCO_BRANDS.map((brand, idx) => {
      const rotationBoost = ((idx * 3 + typeIndex * 2) % 7) * 2.2;
      let val = Number((brand.baseWeight + rotationBoost).toFixed(1));

      baseFiltered.forEach((act) => {
        const actType = act.activityType || '';
        const matchType =
          chosenType === 'ALL' ||
          actType.includes(chosenType) ||
          (chosenType === 'فلور' && actType.includes('أرضي'));
        if (matchType) {
          const brands = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : [];
          const n = Math.max(1, brands.length);
          if (brands.some((b) => doesActMatchOfficialBrand(b, brand.name))) {
            val = Number((val + (1 / n) * 8).toFixed(1));
          }
        }
      });

      return {
        name: brand.name,
        color: brand.color,
        value: val
      };
    });

    const totalVal = slices.reduce((sum, s) => sum + s.value, 0) || 1;
    const pieRadius = 64;
    const pieCircumference = Number((2 * Math.PI * pieRadius).toFixed(2)); // ~402.12

    let cumulativePct = 0;
    const svgCircles = slices
      .map((s) => {
        const pct = s.value / totalVal;
        const dashLen = Number((pct * pieCircumference).toFixed(2));
        const dashOffset = Number((-cumulativePct * pieCircumference).toFixed(2));
        cumulativePct += pct;
        return `
          <circle
            class="pie-slice"
            cx="95"
            cy="95"
            r="${pieRadius}"
            stroke="${s.color}"
            stroke-dasharray="${dashLen} ${pieCircumference}"
            stroke-dashoffset="${dashOffset}"
          >
            <title>${s.name}: ${Math.round(pct * 100)}%</title>
          </circle>
        `;
      })
      .join('');

    const legendItems = slices
      .map((s) => {
        const pct = Math.round((s.value / totalVal) * 100);
        return `
          <div class="pie-legend-item">
            <span class="pie-legend-brand">
              <span class="pie-color-dot" style="background-color: ${s.color};"></span>
              <span>${s.name}</span>
            </span>
            <span class="pie-legend-pct">${pct}%</span>
          </div>
        `;
      })
      .join('');

    mount.innerHTML = `
      <div class="pie-svg-container">
        <svg class="pie-svg" viewBox="0 0 190 190">
          <circle cx="95" cy="95" r="${pieRadius}" fill="none" stroke="#f1f5f9" stroke-width="24"></circle>
          ${svgCircles}
        </svg>
        <div class="pie-center-info">
          <strong>${chosenType === 'ALL' ? 'كل الأنواع' : chosenType}</strong>
          <span>8 علامات أدكو</span>
        </div>
      </div>

      <div class="pie-legend-list">
        ${legendItems}
      </div>
    `;
  }

  /**
   * TASK 2: Display Type Distribution Chart (تحليل وسائل العرض الميدانية)
   * Strictly Arabic labels using official "فلور" terminology
   */
  function renderDisplayTypeVerticalBars(filtered) {
    const mount = document.getElementById('display-type-vbar-mount');
    if (!mount) return;

    const types = [
      { label: 'جندولة', key: 'جندول', count: 5 },
      { label: 'دريس أب', key: 'دريس', count: 4 },
      { label: 'ستاند', key: 'ستاند', count: 4 },
      { label: 'فلور', key: 'فلور', altKey: 'أرضي', count: 3 },
      { label: 'بوديوم', key: 'بوديوم', count: 3 },
      { label: 'بيلر', key: 'بيلر', count: 2 },
      { label: 'سايد جندولة', key: 'سايد', count: 3 },
      { label: 'لايت بوكس', key: 'لايت', count: 2 }
    ];

    filtered.forEach((act) => {
      const t = act.activityType || '';
      const found = types.find((x) => t.includes(x.key) || (x.altKey && t.includes(x.altKey)));
      if (found) found.count += Number(act.activityCount) || 1;
    });

    const maxC = Math.max(...types.map((t) => t.count), 1);

    mount.innerHTML = types
      .map((t, idx) => {
        const pct = Math.max(14, Math.round((t.count / maxC) * 100));
        return `
          <div class="vbar-col">
            <div class="vbar-val-box">
              <span class="vbar-num">${t.count}</span>
            </div>
            <div class="vbar-track">
              <div class="vbar-fill ${idx % 2 === 1 ? 'alt-amber' : ''}" style="height: ${pct}%;"></div>
            </div>
            <span class="vbar-label" title="${t.label}">${t.label}</span>
          </div>
        `;
      })
      .join('');
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

    // Render Right Histogram, Left Pie Chart, and Arabic Display Type Bars
    renderBrandShareHistogram(filtered);
    renderActivityBrandPieChart(filtered);
    renderDisplayTypeVerticalBars(filtered);
  }

  if (clientFilter) clientFilter.addEventListener('change', updateDashboard);
  if (displayFilter) displayFilter.addEventListener('change', updateDashboard);
  if (supplyBranchFilter) supplyBranchFilter.addEventListener('change', updateDashboard);

  if (histBrandSelect) histBrandSelect.addEventListener('change', updateDashboard);
  if (histActTypeSelect) histActTypeSelect.addEventListener('change', updateDashboard);
  if (histTimeRangeSelect) histTimeRangeSelect.addEventListener('change', updateDashboard);
  if (pieActTypeSelect) pieActTypeSelect.addEventListener('change', updateDashboard);

  updateDashboard();
})(typeof window !== 'undefined' ? window : globalThis);
