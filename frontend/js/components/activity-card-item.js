/**
 * ADCO Activity Card Item Component
 * Pure HTML template for a branch-scoped activity card (thumbnail, status, activity type & brands,
 * two-word coordinator, rating and follow-up rounds count).
 * Supplying branch is hidden on outer cards (kept strictly for internal detail views).
 * Usage: ActivityCardItem.render(activity, { computeRating, renderStatusBadge })
 */

(function (global) {
  const formatTwoWordName = global.formatTwoWordName;

  function render(act, ctx = {}) {
    const supervisorLabel = act.reviewerName || 'أ. محمد الديب - مدير التسويق';
    const locAddress = (act.location && act.location.address) ? act.location.address : act.branch;
    const roundsCount = act.followUpHistory ? act.followUpHistory.length : 1;
    const actType = act.activityType || act.activity || 'عرض منتجات';
    const brandsList = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['فلفيتا', 'فييا'];

    const isSub = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    const detailsUrl = isSub ? `./activity-details.html?id=${act.id}` : `./pages/activity-details.html?id=${act.id}`;
    const newFollowUpUrl = isSub ? `./activity-details.html?id=${act.id}&action=new-followup` : `./pages/activity-details.html?id=${act.id}&action=new-followup`;
    const closureReqUrl = isSub ? `./activity-details.html?id=${act.id}&action=request-closure` : `./pages/activity-details.html?id=${act.id}&action=request-closure`;

    // Role check: ONLY coordinator or coordinator_supervisor can request closure on active/accepted activities
    const Auth = global.Auth || global.AuthManager || global.AuthService;
    const user = (Auth && typeof Auth.getCurrentUser === 'function')
      ? Auth.getCurrentUser()
      : (typeof global !== 'undefined' && global.currentUser ? global.currentUser : null);
    const userRole = (user && user.role) || 'coordinator';
    const isCoordOrSupervisor = (
      userRole === 'coordinator' ||
      userRole === 'coordinator_supervisor' ||
      userRole === 'supervisor'
    ) && userRole !== 'marketing_manager' && userRole !== 'admin';
    const isClosed = act.endStatus === 'ENDED' || Boolean(act.isClosed);
    const isClosureRequested = act.endStatus === 'ENDING_REQUESTED' || Boolean(act.closureRequested);
    const isActivityActive = !isClosed && (act.reviewStatus === 'ACCEPTED' || act.status === 'Accepted' || act.status === 'نشط' || !act.status);
    const canRequestClosure = isCoordOrSupervisor && isActivityActive && !isClosureRequested;
    const fallbackThumb = isSub ? '../assets/images/fathalla-branch.avif' : './assets/images/fathalla-branch.avif';

    return `
      <div class="activity-card-item" data-act-id="${act.id}" role="button" tabindex="0" style="cursor: pointer;" title="اضغط لفتح سجل المراجعات وتفاصيل النشاط بالكامل" onclick="if(!event.target.closest('button')) { window.location.href='${detailsUrl}'; }">
        <div class="activity-card-head">
          <img src="${act.photoUrl || fallbackThumb}" alt="${act.client}" class="activity-card-thumb" onerror="this.onerror=null; this.src='${fallbackThumb}';" />
          <div class="db-s17">
            <div class="db-s18">
              <strong class="db-s19">${act.client}</strong>
              <div class="db-s20">
                ${isClosed ? `<span class="badge badge-success db-s21">منتهي</span>` : isClosureRequested ? `<span class="badge badge-warning db-s21">طلب إنهاء</span>` : ''}
                ${typeof ctx.renderStatusBadge === 'function' ? ctx.renderStatusBadge(act) : `<span class="badge badge-mint">${act.reviewStatus || act.status || 'Active'}</span>`}
              </div>
            </div>
            <div class="branch-card-sub" style="margin-bottom: 4px;">
              <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
              <span>${act.branch}</span>
            </div>
            <p class="db-s22" style="margin-bottom: 4px;">
              <strong>${act.activity || '-'}</strong>
            </p>

            <!-- Highlight: Activity Type & Participating Brands (Supplying branch hidden externally) -->
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="badge badge-mint" style="font-weight: 700; font-size: 0.74rem;">
                  <i data-lucide="sliders-horizontal" class="ui-icon ui-icon-xs"></i>
                  <span>${actType}${act.activityCount ? ` × ${act.activityCount}` : ''}</span>
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                <span style="font-size: 0.72rem; color: var(--adco-gray-600); font-weight: 600;">العلامات:</span>
                ${brandsList.map((b) => `<span class="badge badge-outline-brand" style="font-size: 0.70rem; padding: 1px 6px; background: rgba(15, 118, 110, 0.06); border: 1px solid rgba(15, 118, 110, 0.2); color: var(--adco-green-deep);">${b}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="branch-meta-grid">
          <div class="branch-meta-item">
            <span class="branch-meta-label">المنسق</span>
            <span class="branch-meta-val">${(typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName) || '-'}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">المشرف</span>
            <span class="branch-meta-val">${supervisorLabel}</span>
          </div>
          <div class="branch-meta-item full-span">
            <span class="branch-meta-label">الموقع</span>
            <span class="branch-meta-val">${locAddress}</span>
          </div>
        </div>

        <!-- Direct Action Bar: Inside the Branch Card -->
        <div class="activity-card-action-bar" style="margin-top: 12px;">
          <button type="button" class="btn btn-secondary btn-sm btn-open-card-details" data-act-id="${act.id}" title="فتح سجل المراجعات والجولات وتوجيهات مدير التسويق" onclick="event.stopPropagation(); window.location.href='${detailsUrl}';">
            <i data-lucide="calendar-clock" class="ui-icon ui-icon-xs"></i>
            <span>المراجعات (${roundsCount})</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm btn-quick-add-photo" data-act-id="${act.id}" title="إضافة متابعة جديدة والتقاط الصور لهذا النشاط" onclick="event.stopPropagation(); window.location.href='${newFollowUpUrl}';">
            <i data-lucide="camera" class="ui-icon ui-icon-xs"></i>
            <span>متابعة</span>
          </button>
          ${canRequestClosure ? `
            <button type="button" class="btn btn-secondary btn-sm btn-card-closure-req" data-act-id="${act.id}" title="تقديم طلب إنهاء وتفكيك النشاط لمدير التسويق" onclick="event.stopPropagation(); window.location.href='${closureReqUrl}';">
              <i data-lucide="archive" class="ui-icon ui-icon-xs"></i>
              <span>طلب إنهاء</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  global.ActivityCardItem = { render };
})(window);
