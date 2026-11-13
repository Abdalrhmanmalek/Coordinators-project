/**
 * ADCO Field Operations System - Dashboard Branches & Filter Helpers
 * Single Responsibility: Builds & renders Master Branch Cards, status badges, and dynamic dropdowns for dashboard.html
 */

(function (global) {
  function renderStatusBadge(statusOrAct) {
    let reviewSt = statusOrAct;
    let endSt = null;
    if (statusOrAct && typeof statusOrAct === 'object') {
      reviewSt = statusOrAct.reviewStatus || statusOrAct.status;
      endSt = statusOrAct.endStatus || (statusOrAct.isClosed ? 'ENDED' : 'OPEN');
    }
    if (endSt === 'ENDED' || reviewSt === 'ENDED' || reviewSt === 'CLOSED') {
      return '<span class="badge badge-success">منتهي</span>';
    }
    const normalized = String(reviewSt || '').toUpperCase();
    if (normalized === 'ACCEPTED' || reviewSt === 'Accepted' || reviewSt === 'مقبول') {
      return '<span class="badge badge-success">مقبول</span>';
    }
    if (normalized === 'REJECTED' || reviewSt === 'Rejected' || reviewSt === 'مرفوض') {
      return '<span class="badge badge-danger">مرفوض</span>';
    }
    return '<span class="badge badge-warning">قيد المراجعة</span>';
  }

  function populateDynamicBranchDropdown(supBranchSelect, Activity, user, clientFilterVal) {
    if (!supBranchSelect || !Activity) return;
    const userActivities = Activity.getActivitiesForUser(user);
    const matchingActs = (!clientFilterVal || clientFilterVal === 'ALL')
      ? userActivities
      : userActivities.filter((a) => (a.client || '') === clientFilterVal || (a.client || '').includes(clientFilterVal));

    let branches = [...new Set(matchingActs.map((a) => a.branch).filter(Boolean))];
    if (branches.length === 0 && clientFilterVal && clientFilterVal !== 'ALL' && typeof Activity.getBranchesForClient === 'function') {
      branches = Activity.getBranchesForClient(clientFilterVal);
    }
    if (branches.length === 0 && global.ADCO_CATALOGS && Array.isArray(global.ADCO_CATALOGS.branches)) {
      branches = global.ADCO_CATALOGS.branches;
    }

    supBranchSelect.innerHTML =
      '<option value="ALL">كل فروع العميل</option>' +
      branches.map((b) => `<option value="${b}">${b}</option>`).join('');

    if (global.ADCOFilterDropdown) {
      global.ADCOFilterDropdown.sync(supBranchSelect);
    }
  }

  function populateDynamicCoordinatorDropdown(supCoordSelect, Activity, user, clientFilterVal) {
    if (!supCoordSelect || !Activity) return;
    const userActivities = Activity.getActivitiesForUser(user);
    const matchingActs = (!clientFilterVal || clientFilterVal === 'ALL')
      ? userActivities
      : userActivities.filter((a) => (a.client || '') === clientFilterVal || (a.client || '').includes(clientFilterVal));

    const coords = [];
    const seen = new Set();
    matchingActs.forEach((a) => {
      if (a.coordinatorId && !seen.has(a.coordinatorId)) {
        seen.add(a.coordinatorId);
        coords.push({ id: a.coordinatorId, name: a.coordinatorName || a.coordinatorId });
      }
    });
    if (coords.length === 0) {
      coords.push({ id: 'ADCO-101', name: 'أحمد محمود العبد' }, { id: 'ADCO-102', name: 'سارة طارق إبراهيم' });
    }

    supCoordSelect.innerHTML =
      '<option value="ALL">كل المنسقين</option>' +
      coords.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

    if (global.ADCOFilterDropdown) {
      global.ADCOFilterDropdown.sync(supCoordSelect);
    }
  }

  function buildMasterBranchesMap(activities, { user, isCoordSup } = {}) {
    const map = {};
    activities.forEach((act) => {
      const branchName = act.branch || 'فرع سموحة - الإسكندرية';
      if (!map[branchName]) {
        map[branchName] = {
          branch: branchName,
          client: act.client || 'فتح الله جملة ماركت (Fathalla)',
          supplyingBranch: act.coordinatorBranch || 'الإسكندرية - قطاع وسط',
          activityTypes: new Set(),
          brands: new Set(),
          coordinators: new Set(),
          supervisorName: act.reviewerName || (isCoordSup && user ? user.fullName : 'أيمن عبد الرحمن الروبي'),
          locationLabel: (act.location && act.location.address) ? act.location.address : branchName,
          total: 0,
          accepted: 0,
          review: 0,
          rejected: 0,
          closed: 0
        };
      }
      const entry = map[branchName];
      if (act.coordinatorName) entry.coordinators.add(act.coordinatorName);
      if (act.activityType) entry.activityTypes.add(act.activityType);
      else if (act.activity) entry.activityTypes.add(act.activity);
      if (Array.isArray(act.brands)) {
        act.brands.forEach((b) => b && entry.brands.add(b));
      }
      entry.total += 1;
      const isActClosed = act.endStatus === 'ENDED' || Boolean(act.isClosed);
      const revSt = act.reviewStatus || act.status;
      if (isActClosed) entry.closed += 1;
      else if (revSt === 'ACCEPTED' || revSt === 'Accepted') entry.accepted += 1;
      else if (revSt === 'REJECTED' || revSt === 'Rejected') entry.rejected += 1;
      else entry.review += 1;
    });

    if (Object.keys(map).length === 0 && user) {
      const defBranch = user.assignedBranchName || user.branch || 'فرع سموحة - الإسكندرية';
      const defClient = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
      map[defBranch] = {
        branch: defBranch,
        client: defClient,
        supplyingBranch: 'الإسكندرية - قطاع وسط',
        activityTypes: new Set(['فرشة مجلة', 'جندولة']),
        brands: new Set(['فلفيتا', 'فييا', 'كلوريل']),
        coordinators: new Set([user.fullName || 'أحمد محمود العبد']),
        supervisorName: 'أيمن عبد الرحمن الروبي',
        locationLabel: defBranch,
        total: 0,
        accepted: 0,
        review: 0,
        rejected: 0,
        closed: 0
      };
    }

    return Object.values(map);
  }

  function renderMasterBranchCards(baseActivities, { user, isCoordSup, selectedBranchKey, showAllBranchesMode, resetBranchBtn, Router } = {}) {
    const mount = document.getElementById('master-branches-mount');
    if (!mount) return;

    if (resetBranchBtn) {
      const showBtn = Boolean(selectedBranchKey) || showAllBranchesMode;
      resetBranchBtn.classList.toggle('is-hidden', !showBtn);
      const span = resetBranchBtn.querySelector('span');
      if (span) span.textContent = showAllBranchesMode ? 'عرض فرعي فقط' : 'إظهار كافة الفروع';
    }

    const branchGroups = buildMasterBranchesMap(baseActivities, { user, isCoordSup });
    const dbBranchesCountPill = document.getElementById('db-branches-count-pill');
    if (dbBranchesCountPill) dbBranchesCountPill.textContent = String(branchGroups.length);

    if (branchGroups.length === 0) {
      mount.innerHTML = `
        <div class="card db-s15" style="grid-column: 1 / -1; padding: 24px; text-align: center;">
          <p class="db-s16" style="margin-bottom: 12px; font-weight: 600;">لا توجد بطاقات فروع مسجلة حالياً.</p>
          <a href="./activity-card.html" class="btn btn-primary btn-sm">
            <i data-lucide="plus-circle" class="ui-icon ui-icon-sm"></i>
            <span>تسجيل أول نشاط ميداني</span>
          </a>
        </div>
      `;
      return;
    }

    mount.innerHTML = branchGroups
      .map((bg) => global.MasterBranchCard.render(bg, { selectedBranchKey, fallbackCoordinatorName: user.fullName }))
      .join('');

    function openBranchDetailsFromCard(branchName, clientName, initialStatus) {
      if (!branchName) return;
      const statusParam = initialStatus ? `&status=${encodeURIComponent(initialStatus)}` : '';
      const targetUrl = `./branch-details.html?branch=${encodeURIComponent(branchName)}&client=${encodeURIComponent(clientName || '')}${statusParam}&from=dashboard`;
      if (Router && typeof Router.navigateTo === 'function') {
        Router.navigateTo(targetUrl);
      } else {
        window.location.href = targetUrl;
      }
    }

    if (!mount.dataset.bdDelegated) {
      mount.dataset.bdDelegated = '1';
      mount.addEventListener('click', (e) => {
        const statusBtn = e.target.closest('.status-counter-btn');
        if (statusBtn) {
          e.stopPropagation();
          openBranchDetailsFromCard(statusBtn.dataset.branch, statusBtn.dataset.client, statusBtn.dataset.st || 'ALL');
          return;
        }
        const card = e.target.closest('.branch-master-card');
        if (card) openBranchDetailsFromCard(card.dataset.branch, card.dataset.client, null);
      });

      mount.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.branch-master-card');
        if (!card || e.target.closest('.status-counter-btn')) return;
        e.preventDefault();
        openBranchDetailsFromCard(card.dataset.branch, card.dataset.client, null);
      });
    }

    if (typeof global.refreshIcons === 'function') global.refreshIcons(mount);
  }

  global.DashboardBranches = {
    renderStatusBadge,
    populateDynamicBranchDropdown,
    populateDynamicCoordinatorDropdown,
    buildMasterBranchesMap,
    renderMasterBranchCards
  };
})(typeof window !== 'undefined' ? window : globalThis);

