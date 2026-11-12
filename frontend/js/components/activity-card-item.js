/**
 * ADCO Activity Card Item Component
 * Pure HTML template for a branch-scoped activity card (thumbnail, status, supplying branch,
 * two-word coordinator, rating and follow-up rounds count).
 * Usage: ActivityCardItem.render(activity, { computeRating, renderStatusBadge })
 */

(function (global) {
  const formatTwoWordName = global.formatTwoWordName;

  function render(act, ctx = {}) {
    const ratingStats = typeof ctx.computeRating === 'function' ? ctx.computeRating(act) : { totalWeightedScore: 85, totalSessions: (act.followUpHistory || []).length || 1 };
    const supplyingBranch = act.coordinatorBranch || 'الإسكندرية - قطاع وسط';
    const supervisorLabel = act.reviewerName || 'أ. محمد الديب - مدير التسويق';
    const locAddress = (act.location && act.location.address) ? act.location.address : act.branch;
    const roundsCount = act.followUpHistory ? act.followUpHistory.length : 1;

    // Extract latest supervisor / marketing manager note
    let latestNotes = '';
    let latestReviewer = act.reviewerName || supervisorLabel;
    if (Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0) {
      for (let i = act.followUpHistory.length - 1; i >= 0; i--) {
        if (act.followUpHistory[i].sessionNotes && act.followUpHistory[i].sessionNotes.trim()) {
          latestNotes = act.followUpHistory[i].sessionNotes.trim();
          if (act.followUpHistory[i].reviewerName) {
            latestReviewer = act.followUpHistory[i].reviewerName;
          }
          break;
        }
      }
    }
    if (!latestNotes && act.supervisorNotes && act.supervisorNotes.trim()) {
      latestNotes = act.supervisorNotes.trim();
    }

    return `
      <div class="activity-card-item" data-act-id="${act.id}" role="button" tabindex="0" style="cursor: pointer;">
        <div class="activity-card-head">
          <img src="${act.photoUrl}" alt="${act.client}" class="activity-card-thumb" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.svg';" />
          <div class="db-s17">
            <div class="db-s18">
              <strong class="db-s19">${act.client}</strong>
              <div class="db-s20">
                ${act.isClosed ? `<span class="badge badge-success db-s21">منتهي</span>` : act.closureRequested ? `<span class="badge badge-warning db-s21">طلب إنهاء</span>` : ''}
                ${typeof ctx.renderStatusBadge === 'function' ? ctx.renderStatusBadge(act.status) : `<span class="badge badge-mint">${act.status || 'Active'}</span>`}
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

        <!-- Marketing Manager Guidance Preview -->
        ${latestNotes ? `
          <div class="branch-card-feedback-preview">
            <div class="feedback-preview-header">
              <span class="feedback-badge-label">
                <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>توجيهات مدير التسويق:</span>
              </span>
              <span class="feedback-reviewer-name">${latestReviewer}</span>
            </div>
            <p class="feedback-preview-text">"${latestNotes}"</p>
          </div>
        ` : `
          <div class="branch-card-feedback-preview feedback-pending">
            <span class="feedback-badge-label">
              <img src="../assets/icons/clock.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>بانتظار مراجعة وتوجيهات مدير التسويق للجولات المرفوعة</span>
            </span>
          </div>
        `}

        <div class="db-s23" style="margin-top: 10px;">
          <span class="badge badge-warning db-s24">
            <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>التقييم: ${ratingStats.totalWeightedScore}/100</span>
          </span>
          <span class="db-s25">
            ${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'جولة متابعة' : 'جولات متابعة'}
          </span>
        </div>

        <!-- Direct Action Bar: Inside the Branch Card -->
        <div class="activity-card-action-bar">
          <button type="button" class="btn btn-secondary btn-sm btn-open-card-details" data-act-id="${act.id}">
            <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-xs" alt="" />
            <span>سجل المراجعات (${roundsCount})</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm btn-quick-add-photo" data-act-id="${act.id}" title="رفع صورة متابعة جديدة لهذا النشاط">
            <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-xs" alt="" />
            <span>إضافة صورة 📷</span>
          </button>
        </div>
      </div>
    `;
  }

  global.ActivityCardItem = { render };
})(window);
