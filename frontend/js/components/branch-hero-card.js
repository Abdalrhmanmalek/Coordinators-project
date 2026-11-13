/**
 * ADCO Field Operations System - Branch Hero Meta Card Component
 * Single Responsibility: Renders the branch metadata hero card and Google Maps links on branch-details.html
 */

(function (global) {
  function openGoogleMapsForBranch(queryStr) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function renderBranchHeroCard(heroCard, data) {
    if (!heroCard) return;
    const {
      parentClient,
      branchName,
      supplyingBranch,
      googleMapsUrl,
      mapsQuery,
      coordExtra,
      coordNames,
      supervisorName,
      locObj,
      latNum,
      lngNum,
      brandsList
    } = data;

    heroCard.innerHTML = `
      <div class="bd-hero-card-header">
        <div class="bd-hero-title-group">
          <h2 class="bd-hero-client-title">${parentClient}</h2>
          <div class="bd-hero-branch-title">
            <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
            <span>${branchName}</span>
          </div>
        </div>

        <div class="branch-supply-pill bd-hero-supply-box">
          <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
          <span>فرع الشركة المورد للبضاعة: <strong>${supplyingBranch}</strong></span>
        </div>

        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="branch-gps-map-link bd-hero-map-btn" id="bd-hero-subtitle-map-link" data-map-query="${mapsQuery}" title="اضغط لفتح موقع الفرع على خرائط جوجل (Google Maps)">
          <i data-lucide="map-pin" class="ui-icon ui-icon-sm"></i>
          <span>فتح موقع الفرع على خرائط Google Maps</span>
        </a>
      </div>

      <div class="branch-meta-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; padding: 14px 16px;">
        <div class="branch-meta-item">
          <span class="branch-meta-label">العميل الأم (Parent Client)</span>
          <span class="branch-meta-val">${parentClient}</span>
        </div>
        <div class="branch-meta-item">
          <span class="branch-meta-label">فرع العميل (Branch)</span>
          <span class="branch-meta-val">${branchName}</span>
        </div>
        <div class="branch-meta-item">
          <span class="branch-meta-label">فرع الشركة المورد للبضاعة</span>
          <span class="branch-meta-val">${supplyingBranch}</span>
        </div>
        <div class="branch-meta-item">
          <span class="branch-meta-label">المنسق الميداني</span>
          <span class="branch-meta-val" style="display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="user-check" class="ui-icon ui-icon-xs" style="color: var(--adco-green-primary); flex-shrink: 0;"></i>
            <span>${coordExtra || coordNames}</span>
          </span>
        </div>
        <div class="branch-meta-item">
          <span class="branch-meta-label">المشرف المسؤول</span>
          <span class="branch-meta-val" style="display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="shield-check" class="ui-icon ui-icon-xs" style="color: var(--adco-green-primary); flex-shrink: 0;"></i>
            <span>${supervisorName}</span>
          </span>
        </div>
        <div class="branch-meta-item">
          <span class="branch-meta-label">الموقع والإحداثيات (GPS - خرائط جوجل)</span>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="branch-gps-map-link" id="bd-meta-gps-map-link" data-map-query="${mapsQuery}" title="افتح الإحداثيات في Google Maps">
            <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
            <span>${locObj.address || branchName} (${latNum.toFixed(4)}°N, ${lngNum.toFixed(4)}°E)</span>
          </a>
        </div>
        <div class="branch-meta-item full-span">
          <span class="branch-meta-label">العلامات التجارية المعروضة بالفرع</span>
          <span class="branch-meta-val" style="color: var(--adco-green-primary);">${brandsList}</span>
        </div>
      </div>
    `;

    heroCard.querySelectorAll('.branch-gps-map-link').forEach((linkEl) => {
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        openGoogleMapsForBranch(linkEl.dataset.mapQuery || mapsQuery);
      });
    });

    if (typeof global.refreshIcons === 'function') {
      global.refreshIcons(heroCard);
    }
  }

  global.BranchHeroCard = { render: renderBranchHeroCard, openGoogleMapsForBranch };
})(typeof window !== 'undefined' ? window : globalThis);

