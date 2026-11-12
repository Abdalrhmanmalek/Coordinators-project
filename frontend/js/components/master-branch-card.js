/**
 * ADCO Master Branch Card Component
 * Pure HTML template for a master branch card: client/branch header, activity types & brands,
 * two-word coordinator name, and status counters (incl. glowing "Under Review" indicator).
 * Supplying branch is hidden on outer cards (kept strictly for internal detail views).
 * Usage: MasterBranchCard.render(branchGroup, { selectedBranchKey, fallbackCoordinatorName })
 */

(function (global) {
  const formatTwoWordName = global.formatTwoWordName;

  function render(bg, ctx = {}) {
    const isSelected = (ctx.selectedBranchKey || null) === bg.branch;
    const rawCoords = Array.from(bg.coordinators || []).join(' ، ') || ctx.fallbackCoordinatorName || 'أحمد محمود العبد';
    const coordNames = typeof formatTwoWordName === 'function' ? formatTwoWordName(rawCoords) : rawCoords;
    const branchUrl = `./branch-details.html?branch=${encodeURIComponent(bg.branch)}&client=${encodeURIComponent(bg.client)}`;

    const typesArr = bg.activityTypes ? Array.from(bg.activityTypes).filter(Boolean) : [];
    const brandsArr = bg.brands ? Array.from(bg.brands).filter(Boolean) : [];

    const typesText = typesArr.length > 0 ? typesArr.slice(0, 3).join(' ، ') : 'جندولة ، ستاند';
    const displayedBrands = brandsArr.length > 0 ? brandsArr.slice(0, 4) : ['فلفيتا', 'فييا', 'كلوريل'];

    return `
      <div class="branch-master-card ${isSelected ? 'active-branch-filter' : ''}" data-branch="${bg.branch}" data-href="${branchUrl}" role="link" tabindex="0" title="اضغط لفتح صفحة تفاصيل الفرع والأنشطة التابعة له">
        <div>
          <div class="branch-card-top">
            <div>
              <h4 class="branch-card-title">${bg.client}</h4>
              <div class="branch-card-sub">
                <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>${bg.branch}</span>
              </div>
            </div>
            <span class="badge badge-mint">${bg.total} أنشطة</span>
          </div>

          <!-- Highlight: Activity Types & Participating Brands (Supplying branch hidden externally) -->
          <div class="branch-card-showcase-row" style="margin: 10px 0; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span class="badge badge-mint" style="font-weight: 700; font-size: 0.74rem;">
                <img src="../assets/icons/sliders.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>نوع العرض: ${typesText}</span>
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
              <span style="font-size: 0.74rem; color: var(--adco-gray-600); font-weight: 600;">العلامات:</span>
              ${displayedBrands.map((b) => `<span class="badge badge-outline-brand" style="font-size: 0.72rem; padding: 2px 7px; background: rgba(15, 118, 110, 0.06); border: 1px solid rgba(15, 118, 110, 0.2); color: var(--adco-green-deep);">${b}</span>`).join('')}
              ${brandsArr.length > 4 ? `<span class="badge" style="font-size: 0.70rem; color: var(--adco-gray-500);">+${brandsArr.length - 4}</span>` : ''}
            </div>
          </div>

          <div class="branch-meta-grid">
            <div class="branch-meta-item">
              <span class="branch-meta-label">المنسق الميداني</span>
              <span class="branch-meta-val" title="${coordNames}">${coordNames}</span>
            </div>
            <div class="branch-meta-item">
              <span class="branch-meta-label">المشرف المسؤول</span>
              <span class="branch-meta-val" title="${bg.supervisorName}">${bg.supervisorName}</span>
            </div>
            <div class="branch-meta-item full-span">
              <span class="branch-meta-label">الموقع الجغرافي للفرع</span>
              <span class="branch-meta-val">
                <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>${bg.locationLabel}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="branch-status-counters">
          <button type="button" class="status-counter-btn" data-branch="${bg.branch}" data-client="${bg.client}" data-st="ALL" title="فتح كافة أنشطة هذا الفرع">
            <span class="sc-num">${bg.total}</span>
            <span class="sc-lbl">الكل</span>
          </button>
          <button type="button" class="status-counter-btn" data-branch="${bg.branch}" data-client="${bg.client}" data-st="Accepted" title="فتح الأنشطة المقبولة بالفرع">
            <span class="sc-num sc-accepted">${bg.accepted}</span>
            <span class="sc-lbl">المقبولة</span>
          </button>
          <button type="button" class="status-counter-btn ${bg.review > 0 ? 'glowing-under-review' : ''}" data-branch="${bg.branch}" data-client="${bg.client}" data-st="Under Review" title="أنشطة تحت المراجعة تتطلب فحص المشرف">
            <span class="sc-num sc-review">${bg.review}</span>
            <span class="sc-lbl">بانتظار</span>
          </button>
          <button type="button" class="status-counter-btn" data-branch="${bg.branch}" data-client="${bg.client}" data-st="Rejected" title="فتح الأنشطة المرفوضة بالفرع">
            <span class="sc-num sc-rejected">${bg.rejected}</span>
            <span class="sc-lbl">المرفوضة</span>
          </button>
          <button type="button" class="status-counter-btn" data-branch="${bg.branch}" data-client="${bg.client}" data-st="CLOSED" title="فتح الأنشطة المنتهية والمفككة">
            <span class="sc-num sc-closed">${bg.closed}</span>
            <span class="sc-lbl">المنتهية</span>
          </button>
        </div>
      </div>
    `;
  }

  global.MasterBranchCard = { render };
})(window);
