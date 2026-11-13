/**
 * ADCO Field Operations - Activity Details Hero Card
 */
(function (global) {
  'use strict';
  function createHeroRenderer(ctx) {
    const { Activity, formatDateTime, formatTwoWordName, openClosureModal, getCurrentActivity, getUser } = ctx;
    return function renderHeroCard() {
      const user = typeof getUser === 'function' ? getUser() : null;
      const currentActivity = getCurrentActivity();
    const mount = document.getElementById('ad-hero-mount');
    if (!mount) return;

    const act = currentActivity;
    const ratingStats = Activity && typeof Activity.computeOverallRating === 'function'
      ? Activity.computeOverallRating(act)
      : { totalWeightedScore: 85, badgeTier: 'ممتاز - فئة ماسية' };

    // Get supplying branch sector
    let supplyingBranch = act.supplyingBranch;
    if (!supplyingBranch && typeof Activity.getBranchSupplyingSectorSync === 'function') {
      supplyingBranch = Activity.getBranchSupplyingSectorSync(act.client, act.branch);
    }
    supplyingBranch = supplyingBranch || 'الإسكندرية - قطاع وسط';

    const brandsList = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['فلفيتا', 'فييا'];
    const brandShareText = (1 / brandsList.length).toFixed(2);
    const brandSharePct = Math.round((1 / brandsList.length) * 100);

    // Closure eligibility check: ONLY coordinator or coordinator_supervisor can request closure on active/accepted activities
    const userRole = (user && user.role) || 'coordinator';
    const isCoordOrSupervisor = (
      userRole === 'coordinator' ||
      userRole === 'coordinator_supervisor' ||
      userRole === 'supervisor'
    ) && userRole !== 'marketing_manager' && userRole !== 'admin';
    const isClosed = act.endStatus === 'ENDED' || Boolean(act.isClosed);
    const isClosureRequested = act.endStatus === 'ENDING_REQUESTED' || Boolean(act.closureRequested);
    const revSt = act.reviewStatus || (act.status === 'Accepted' ? 'ACCEPTED' : (act.status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW'));
    const isActivityActive = !isClosed && (revSt === 'ACCEPTED' || act.status === 'نشط' || !act.status);
    const canRequestClosure = isCoordOrSupervisor && isActivityActive && !isClosureRequested;

    const scoreVal = ratingStats.totalWeightedScore || (act.evaluation && act.evaluation.totalScore) || 88;
    const tierText = (ratingStats.badgeTier && ratingStats.badgeTier !== 'undefined')
      ? ratingStats.badgeTier
      : (scoreVal >= 90 ? 'ممتاز' : scoreVal >= 80 ? 'جيد جداً' : scoreVal >= 70 ? 'جيد' : 'مقبول');

    mount.innerHTML = `
      <div class="ad-hero-visual">
        <div class="ad-hero-img-wrap" id="ad-hero-thumb-click" title="اضغط للتكبير والفحص عالي الدقة">
          <img src="${act.photoUrl || '../assets/images/fathalla-branch.avif'}" alt="${act.client}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" />
        </div>
        <div class="ad-hero-badges">
          <span class="badge ${isClosed ? 'badge-success' : isClosureRequested ? 'badge-warning' : (revSt === 'ACCEPTED' ? 'badge-success' : revSt === 'UNDER_REVIEW' ? 'badge-warning' : 'badge-danger')}">
            ${isClosed ? 'منتهي' : isClosureRequested ? 'طلب إنهاء' : (revSt === 'ACCEPTED' ? 'معتمد' : revSt === 'UNDER_REVIEW' ? 'تحت المراجعة' : 'مرفوض')}
          </span>
          <span class="badge badge-mint">
            التقييم: ${scoreVal}/100 (${tierText})
          </span>
        </div>
      </div>

      <div class="ad-hero-details">
        <!-- Supplying Sector: Prominent inside internal view -->
        <div class="ad-supplying-sector-box">
          <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
          <span>فرع الشركة المورد للبضاعة: <strong>${supplyingBranch}</strong></span>
        </div>

        <div class="ad-meta-grid">
          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <i data-lucide="layout-dashboard" class="ui-icon ui-icon-xs"></i>
              <span>نوع النشاط ووسيلة العرض</span>
            </span>
            <span class="ad-meta-val">${act.activityType || act.activity || 'جندولة رئيسية'}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <i data-lucide="user-cog" class="ui-icon ui-icon-xs"></i>
              <span>المنسق الميداني المسؤول</span>
            </span>
            <span class="ad-meta-val">${formatTwoWordName(act.coordinatorName || user.name)}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
              <span>تاريخ التأسيس</span>
            </span>
            <span class="ad-meta-val">${formatDateTime(act.timestamp || act.activityDate)}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
              <span>المشرف المعتمد</span>
            </span>
            <span class="ad-meta-val">${act.reviewerName || 'م. حسام الدين غانم'}</span>
          </div>
        </div>

        <!-- Brands -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">
            العلامات التجارية المشاركة:
          </div>
          <div class="ad-brands-pills-row">
            ${brandsList.map((b) => `<span class="ad-brand-pill">${b}</span>`).join('')}
          </div>
        </div>

        <!-- Registered SKUs -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
            قائمة الأصناف المسجلة بالعرض:
          </div>
          <ul class="ad-sku-list">
            ${(act.products && act.products.length > 0 ? act.products : brandsList.map((b) => ({ skuItem: `${b} عبوة ترويجية` })))
              .map((p) => `<li class="ad-sku-item">${p.skuItem || p.sku || p.brand}</li>`)
              .join('')}
          </ul>
        </div>

        <!-- Request Activity Completion Prompt Box (طلب إنهاء النشاط) -->
        ${canRequestClosure ? `
          <div class="ad-closure-prompt-box" style="margin-top: 14px; padding: 12px 14px; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.45); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; color: #92400e; font-weight: 600;">
              <i data-lucide="archive" class="ui-icon ui-icon-sm"></i>
              <span>هل تم انتهاء مدة العرض أو ترغب في تفكيك النشاط؟ يمكنك تقديم طلب إنهاء لمدير التسويق.</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="ad-hero-closure-btn" style="border-color: #d97706; color: #b45309; font-weight: 700;">
              <i data-lucide="archive" class="ui-icon ui-icon-xs"></i>
              <span>طلب إنهاء النشاط</span>
            </button>
          </div>
        ` : act.closureRequested ? `
          <div class="ad-closure-prompt-box" style="margin-top: 14px; padding: 12px 14px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="clock" class="ui-icon ui-icon-sm"></i>
            <div style="font-size: 0.85rem; color: #92400e;">
              <strong>طلب إنهاء وتفكيك هذا النشاط قيد مراجعة واعتماد مدير التسويق.</strong>
              <span style="display: block; font-size: 0.78rem; color: #64748b; margin-top: 2px;">السبب المسجل: ${act.closureReasonType || act.closureNotes || 'انتهاء مدة الحملة المعتمدة'}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Wire hero card buttons
    const heroClosureBtn = document.getElementById('ad-hero-closure-btn');
    if (heroClosureBtn) {
      heroClosureBtn.addEventListener('click', openClosureModal);
    }

    // Update top header actions with Request Completion button or status badge
    const headerActions = document.getElementById('ad-header-actions');
    if (headerActions) {
      const oldBtn = document.getElementById('ad-header-closure-btn');
      if (oldBtn) oldBtn.remove();
      const oldBadge = document.getElementById('ad-header-closure-badge');
      if (oldBadge) oldBadge.remove();

      if (canRequestClosure) {
        const closureBtn = document.createElement('button');
        closureBtn.type = 'button';
        closureBtn.className = 'btn btn-secondary';
        closureBtn.id = 'ad-header-closure-btn';
        closureBtn.style.borderColor = '#d97706';
        closureBtn.style.color = '#b45309';
        closureBtn.style.fontWeight = '700';
        closureBtn.innerHTML = `
          <i data-lucide="archive" class="ui-icon ui-icon-sm"></i>
          <span>طلب إنهاء النشاط</span>
        `;
        closureBtn.addEventListener('click', openClosureModal);
        headerActions.appendChild(closureBtn);
      } else if (act.closureRequested) {
        const badge = document.createElement('span');
        badge.id = 'ad-header-closure-badge';
        badge.className = 'badge badge-warning';
        badge.style.padding = '6px 12px';
        badge.style.fontSize = '0.82rem';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '6px';
        badge.innerHTML = `
          <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
          <span>طلب إنهاء قيد المراجعة</span>
        `;
        headerActions.appendChild(badge);
      }
    }

    const thumbBtn = document.getElementById('ad-hero-thumb-click');
    if (thumbBtn) {
      thumbBtn.addEventListener('click', () => {
        openLightbox(
          act.photoUrl || '../assets/images/fathalla-branch.avif',
          `صورة النشاط التأسيسي — ${act.client}`,
          formatDateTime(act.timestamp),
          act.coordinatorName
        );
      });
    }

    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(mount);
    }
    };
  }
  global.ActivityDetailsHero = { create: createHeroRenderer };
})(typeof window !== 'undefined' ? window : globalThis);
