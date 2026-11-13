/**
 * ADCO Field Operations - Supervisor Branches Overview
 */
(function (global) {
  function create(ctx) {
    const { MasterBranchCard, getSelectedBranchKey, getUser, refreshIcons } = ctx;
    return function renderSupervisorBranchCards(allActivities) {
      const selectedBranchKey = getSelectedBranchKey();
      const user = getUser();
      const mount = document.getElementById('supervisor-branches-overview');
      if (!mount) return;
      const supResetBranchBtn = document.getElementById('sup-reset-branch-filter');

      if (supResetBranchBtn) {
        supResetBranchBtn.classList.toggle('is-hidden', !selectedBranchKey);
      }

      const branchMap = {};
      allActivities.forEach((act) => {
        const bName = act.branch || 'فرع سموحة - الإسكندرية';
        if (!branchMap[bName]) {
          branchMap[bName] = {
            branch: bName,
            client: act.client || 'فتح الله جملة ماركت (Fathalla)',
            supplyingBranch: act.coordinatorBranch || 'الإسكندرية - قطاع وسط',
            activityTypes: new Set(),
            brands: new Set(),
            coordinators: new Set(),
            supervisorName: act.reviewerName || (user && user.fullName) || 'م. حسام الدين غانم',
            locationLabel: (act.location && act.location.address) ? act.location.address : bName,
            total: 0,
            accepted: 0,
            review: 0,
            rejected: 0,
            closed: 0
          };
        }
        const entry = branchMap[bName];
        if (act.coordinatorName) entry.coordinators.add(act.coordinatorName);
        if (act.activityType) entry.activityTypes.add(act.activityType);
        else if (act.activity) entry.activityTypes.add(act.activity);
        if (Array.isArray(act.brands)) {
          act.brands.forEach((b) => b && entry.brands.add(b));
        }
        entry.total += 1;
        const isActClosed = act.endStatus === 'ENDED' || Boolean(act.isClosed);
        const revSt = act.reviewStatus || act.status;
        if (isActClosed) {
          entry.closed += 1;
        } else if (revSt === 'ACCEPTED' || revSt === 'Accepted') {
          entry.accepted += 1;
        } else if (revSt === 'REJECTED' || revSt === 'Rejected') {
          entry.rejected += 1;
        } else {
          entry.review += 1;
        }
      });

      const groups = Object.values(branchMap);
      const spBranchesCountPill = document.getElementById('sp-branches-count-pill');
      if (spBranchesCountPill) spBranchesCountPill.textContent = String(groups.length);
      if (groups.length === 0) {
        mount.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--adco-gray-600);">
            <p style="margin: 0; font-weight: 600;">لا توجد بطاقات فروع مسجلة حالياً.</p>
          </div>
        `;
        return;
      }

      mount.innerHTML = groups
        .map((bg) => global.MasterBranchCard ? global.MasterBranchCard.render(bg, { selectedBranchKey, fallbackCoordinatorName: user ? user.fullName : 'أحمد محمود العبد' }) : '')
        .join('');

      function openBranchDetailsFromSupervisor(branchName, clientName, initialStatus) {
        if (!branchName) return;
        const statusParam = initialStatus ? `&status=${encodeURIComponent(initialStatus)}` : '';
        const targetUrl = `./branch-details.html?branch=${encodeURIComponent(branchName)}&client=${encodeURIComponent(clientName || '')}${statusParam}&from=supervisor`;
        if (window.AppRouter && typeof window.AppRouter.navigateTo === 'function') {
          window.AppRouter.navigateTo(targetUrl);
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
            openBranchDetailsFromSupervisor(statusBtn.dataset.branch, statusBtn.dataset.client, statusBtn.dataset.st || 'ALL');
            return;
          }
          const card = e.target.closest('.branch-master-card');
          if (card) {
            openBranchDetailsFromSupervisor(card.dataset.branch, card.dataset.client, null);
          }
        });

        mount.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          const card = e.target.closest('.branch-master-card');
          if (!card || e.target.closest('.status-counter-btn')) return;
          e.preventDefault();
          openBranchDetailsFromSupervisor(card.dataset.branch, card.dataset.client, null);
        });
      }

      if (typeof refreshIcons === 'function') refreshIcons(mount);
    };
  }
  global.SupervisorBranches = { create };
})(typeof window !== 'undefined' ? window : globalThis);
