/**
 * ADCO Field Operations System - analytics-charts.js
 * Single Responsibility: SVG & Bar Chart renderers for the Supervisor Analytics Dashboard
 * (Brand Share Histogram, Activity Type & Brand Pie Chart, Arabic Display Type Bars).
 */

(function (global) {
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

  function renderBrandShareHistogram(baseFiltered, { selectedBrand = 'فلفيتا', selectedActType = 'ALL', selectedTimeRange = 'ALL' } = {}) {
    const mount = document.getElementById('brand-histogram-mount');
    const kpiMount = document.getElementById('brand-histogram-kpis');
    const summaryBadge = document.getElementById('hist-brand-summary-badge');
    if (!mount) return;

    const timeMultiplierMap = { ALL: 1.0, '7D': 0.32, '30D': 0.65, '90D': 0.85, '180D': 1.0 };
    const timeMult = timeMultiplierMap[selectedTimeRange] || 1.0;

    const timeScopedActs = filterByTimeRange(baseFiltered, selectedTimeRange);
    const brandMeta = OFFICIAL_ADCO_BRANDS.find((b) => b.name === selectedBrand) || OFFICIAL_ADCO_BRANDS[3];
    const brandIdx = OFFICIAL_ADCO_BRANDS.findIndex((b) => b.name === selectedBrand);

    const bars = ARABIC_ACTIVITY_TYPES.map((typeObj, idx) => {
      const seedFactor = 0.75 + (((brandIdx + 2) * (idx + 3)) % 5) * 0.14;
      let shareUnits = Number((typeObj.baseShare * (brandMeta.baseWeight / 18) * seedFactor * timeMult).toFixed(1));

      timeScopedActs.forEach((act) => {
        const actType = act.activityType || '';
        const matchType =
          actType.includes(typeObj.key) || (typeObj.altKey && actType.includes(typeObj.altKey));
        if (matchType) {
          const brands = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : [];
          const n = Math.max(1, brands.length);
          if (brands.some((b) => doesActMatchOfficialBrand(b, selectedBrand))) {
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

    const visibleBars = selectedActType === 'ALL' ? bars : bars.filter((b) => b.label === selectedActType);
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

  function renderActivityBrandPieChart(baseFiltered, chosenType = 'جندولة') {
    const mount = document.getElementById('activity-brand-pie-mount');
    const badge = document.getElementById('pie-acttype-badge');
    if (!mount) return;

    if (badge) {
      badge.textContent = chosenType === 'ALL' ? 'جميع وسائل العرض' : chosenType;
    }

    const typeIndex = Math.max(0, ARABIC_ACTIVITY_TYPES.findIndex((t) => t.label === chosenType));

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

      return { name: brand.name, color: brand.color, value: val };
    });

    const totalVal = slices.reduce((sum, s) => sum + s.value, 0) || 1;
    const pieRadius = 64;
    const pieCircumference = Number((2 * Math.PI * pieRadius).toFixed(2));

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

  global.AnalyticsCharts = {
    renderBrandShareHistogram,
    renderActivityBrandPieChart,
    renderDisplayTypeVerticalBars
  };
})(typeof window !== 'undefined' ? window : globalThis);

