/**
 * ADCO Activity Card Item Component
 * Pure HTML template for a branch-scoped activity card (thumbnail, status, supplying branch,
 * two-word coordinator, rating and follow-up rounds count).
 * Usage: ActivityCardItem.render(activity, { computeRating, renderStatusBadge })
 */

(function (global) {
  const formatTwoWordName = global.formatTwoWordName;

  function render(act, ctx = {}) {
    const ratingStats = ctx.computeRating(act);
    const supplyingBranch = act.coordinatorBranch || 'الإسكندرية - قطاع وسط';
    const supervisorLabel = act.reviewerName || 'أيمن عبد الرحمن الروبي';
    const locAddress = (act.location && act.location.address) ? act.location.address : act.branch;

    return `
      <a href="./activity-card.html?id=${act.id}" class="activity-card-item">
        <div class="activity-card-head">
          <img src="${act.photoUrl}" alt="${act.client}" class="activity-card-thumb" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.svg';" />
          <div class="db-s17">
            <div class="db-s18">
              <strong class="db-s19">${act.client}</strong>
              <div class="db-s20">
                ${act.isClosed ? `<span class="badge badge-success db-s21">منتهي</span>` : act.closureRequested ? `<span class="badge badge-warning db-s21">طلب إنهاء</span>` : ''}
                ${ctx.renderStatusBadge(act.status)}
              </div>
            </div>
            <div class="branch-card-sub" style="margin-bottom: 4px;">
              <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>${act.branch}</span>
            </div>
            <p class="db-s22">
              <strong>${act.activity || '-'}</strong> (${act.activityType || '-'} × ${act.activityCount || 1})
            </p>
            <div class="branch-supply-pill" style="margin-top: 2px;">
              <span>فرع الشركة المورد للبضاعة: <strong>${supplyingBranch}</strong></span>
            </div>
          </div>
        </div>

        <div class="branch-meta-grid">
          <div class="branch-meta-item">
            <span class="branch-meta-label">المنسق الميداني</span>
            <span class="branch-meta-val">${(typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName) || '-'}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">المشرف المعتمد</span>
            <span class="branch-meta-val">${supervisorLabel}</span>
          </div>
          <div class="branch-meta-item full-span">
            <span class="branch-meta-label">الموقع والعلامات التجارية</span>
            <span class="branch-meta-val">${locAddress} • ${(act.brands || []).join('، ')}</span>
          </div>
        </div>

        <div class="db-s23">
          <span class="badge badge-warning db-s24">
            <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>التقييم: ${ratingStats.totalWeightedScore}/100</span>
          </span>
          <span class="db-s25">
            ${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'جولة متابعة' : 'جولات متابعة'}
          </span>
        </div>
      </a>
    `;
  }

  global.ActivityCardItem = { render };
})(window);
