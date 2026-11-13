/**
 * ADCO Field Operations System - Dashboard Page Controller
 * Single Responsibility: Coordinator & Supervisor operational dashboard, 3-tier RBAC scoping,
 * Master Branch Cards (with فرع الشركة المورد للبضاعة, coordinator/supervisor metadata, location,
 * and interactive activity status counters), KPI cards, and activities feed.
 * Compatible with both file:// protocol and http:// server environments.
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const Activity = global.ActivityManager || global.ActivityService;
  const Router = global.AppRouter;

  let user = Auth ? Auth.checkAuthGuard() : null;
  if (!user && Auth && typeof Auth.createSession === 'function') {
    const reg = Auth.getRegistry ? Auth.getRegistry() : [];
    user = Auth.createSession(reg[0] || { employeeId: 'ADCO-101', fullName: 'أحمد محمود العبد', role: 'coordinator' }).user;
  }
  if (!user) return;

  if (Router && typeof Router.init === 'function') {
    try {
      Router.init();
    } catch (err) {
      console.warn('Router init handled gracefully:', err);
    }
  }

  const isCoordSup = user && user.role === 'coordinator_supervisor';
  const isManager = user && user.role === 'marketing_manager';

  const welcomeTitle = document.getElementById('welcome-title');
  const welcomeRole = document.getElementById('welcome-role');

  if (welcomeTitle) welcomeTitle.textContent = `أهلاً، ${user.fullName}`;
  if (welcomeRole) {
    if (isCoordSup) {
      const clientName = user.assignedClientName || 'فتح الله';
      welcomeRole.textContent = `مشرف منسق — ${clientName}`;
    } else if (isManager) {
      welcomeRole.textContent = 'مسؤول التسويق';
    } else {
      const branchLabel = user.assignedBranchName || user.branch || 'فرع سموحة';
      welcomeRole.textContent = `منسق ميداني — ${branchLabel}`;
    }
  }

  // Setup Manager & Coordinator Supervisor Filter Toolbar (Parent Client & Branch)
  const supToolbar = document.getElementById('sup-filter-toolbar');
  const parentClientSelect = document.getElementById('filter-parent-client');
  const supBranchSelect = document.getElementById('filter-sup-branch');
  const supCoordSelect = document.getElementById('filter-sup-coord');
  const supBranchCountBadge = document.getElementById('sup-branch-count-badge');
  const supClientTag = document.getElementById('sup-client-tag');

  let currentFilter = 'ALL';
  let selectedBranchKey = null;
  let showAllBranchesMode = false;

  function populateDynamicBranchDropdown(clientFilterVal) {
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
  }

  function populateDynamicCoordinatorDropdown(clientFilterVal) {
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
  }

  if ((isCoordSup || isManager) && supToolbar) {
    supToolbar.style.display = 'block';
    supToolbar.classList.remove('is-hidden');

    const userActs = Activity ? Activity.getActivitiesForUser(user) : [];
    const distinctClientsFromActs = [...new Set(userActs.map((a) => a.client).filter(Boolean))];
    const catalogClients = (global.ADCO_CATALOGS && Array.isArray(global.ADCO_CATALOGS.clients)) ? global.ADCO_CATALOGS.clients : [];
    const allClientsList = [...new Set([...distinctClientsFromActs, ...catalogClients])];

    if (isCoordSup) {
      const assignedClient = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
      if (supClientTag) supClientTag.textContent = assignedClient;
      if (parentClientSelect) {
        parentClientSelect.innerHTML = `<option value="${assignedClient}" selected>${assignedClient}</option>`;
      }
      populateDynamicBranchDropdown(assignedClient);
      populateDynamicCoordinatorDropdown(assignedClient);
    } else {
      // Marketing Manager / Supervisor: All Parent Clients selectable
      if (supClientTag) supClientTag.textContent = 'جميع العملاء والسلاسل التجارية';
      if (parentClientSelect) {
        parentClientSelect.innerHTML =
          '<option value="ALL">جميع السلاسل والعملاء (الكل)</option>' +
          allClientsList.map((c) => `<option value="${c}">${c}</option>`).join('');
      }
      populateDynamicBranchDropdown('ALL');
      populateDynamicCoordinatorDropdown('ALL');
    }

    if (parentClientSelect) {
      parentClientSelect.addEventListener('change', () => {
        const chosenClient = parentClientSelect.value || 'ALL';
        selectedBranchKey = null;
        if (supClientTag) {
          supClientTag.textContent = chosenClient === 'ALL' ? 'جميع العملاء والسلاسل التجارية' : chosenClient;
        }
        populateDynamicBranchDropdown(chosenClient);
        populateDynamicCoordinatorDropdown(chosenClient);
        if (supBranchCountBadge) supBranchCountBadge.textContent = 'كل فروع العميل';
        renderDashboard();
      });
    }

    if (supBranchSelect) {
      supBranchSelect.addEventListener('change', () => {
        selectedBranchKey = supBranchSelect.value === 'ALL' ? null : supBranchSelect.value;
        if (supBranchCountBadge) {
          supBranchCountBadge.textContent = supBranchSelect.value === 'ALL' ? 'كل فروع العميل' : supBranchSelect.value;
        }
        renderDashboard();
      });
    }

    if (supCoordSelect) {
      supCoordSelect.addEventListener('change', () => {
        renderDashboard();
      });
    }
  }

  const resetBranchBtn = document.getElementById('reset-branch-card-filter');
  if (resetBranchBtn) {
    resetBranchBtn.addEventListener('click', () => {
      if (selectedBranchKey) {
        selectedBranchKey = null;
      } else {
        showAllBranchesMode = !showAllBranchesMode;
      }
      if (supBranchSelect) supBranchSelect.value = 'ALL';
      if (supBranchCountBadge) supBranchCountBadge.textContent = 'كل فروع العميل';
      renderDashboard();
    });
  }

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

  function syncFilterChipsUI() {
    document.querySelectorAll('.filter-chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === currentFilter);
    });
  }

  function buildMasterBranchesMap(activities) {
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
          supervisorName: act.reviewerName || (isCoordSup ? user.fullName : 'أيمن عبد الرحمن الروبي'),
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

    // If no activities were mapped for a coordinator, ensure their assigned branch card is still present
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

  function renderMasterBranchCards(baseActivities) {
    const mount = document.getElementById('master-branches-mount');
    if (!mount) return;

    if (resetBranchBtn) {
      const showBtn = Boolean(selectedBranchKey) || showAllBranchesMode;
      resetBranchBtn.classList.toggle('is-hidden', !showBtn);
      const span = resetBranchBtn.querySelector('span');
      if (span) {
        span.textContent = showAllBranchesMode ? 'عرض فرعي فقط' : 'إظهار كافة الفروع';
      }
    }

    const branchGroups = buildMasterBranchesMap(baseActivities);
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

    mount.querySelectorAll('.branch-master-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.status-counter-btn')) return;
        const bName = card.dataset.branch;
        selectedBranchKey = (selectedBranchKey === bName) ? null : bName;
        if (supBranchSelect) supBranchSelect.value = selectedBranchKey || 'ALL';
        if (supBranchCountBadge) supBranchCountBadge.textContent = selectedBranchKey || 'كل فروع العميل';
        renderDashboard();
      });
      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.status-counter-btn')) {
          e.preventDefault();
          const bName = card.dataset.branch;
          selectedBranchKey = (selectedBranchKey === bName) ? null : bName;
          if (supBranchSelect) supBranchSelect.value = selectedBranchKey || 'ALL';
          if (supBranchCountBadge) supBranchCountBadge.textContent = selectedBranchKey || 'كل فروع العميل';
          renderDashboard();
        }
      });
    });

    mount.querySelectorAll('.status-counter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bName = btn.dataset.branch;
        const st = btn.dataset.st || 'ALL';
        if (selectedBranchKey === bName && currentFilter === st) {
          selectedBranchKey = null;
          currentFilter = 'ALL';
        } else {
          selectedBranchKey = bName;
          currentFilter = st;
        }
        if (supBranchSelect) supBranchSelect.value = selectedBranchKey || 'ALL';
        if (supBranchCountBadge) supBranchCountBadge.textContent = selectedBranchKey || 'كل فروع العميل';
        syncFilterChipsUI();
        renderDashboard();
      });
    });

    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(mount);
    }
  }

  function renderDashboard() {
    if (!Activity) return;
    let baseActivities = (showAllBranchesMode && typeof Activity.getAllActivities === 'function')
      ? Activity.getAllActivities()
      : Activity.getActivitiesForUser(user);

    // Manager & Coordinator Supervisor dynamic dropdown filters (Parent Client, Branch, Coordinator)
    if (isCoordSup || isManager) {
      const parentVal = parentClientSelect ? parentClientSelect.value : 'ALL';
      const bVal = supBranchSelect ? supBranchSelect.value : 'ALL';
      const cVal = supCoordSelect ? supCoordSelect.value : 'ALL';

      if (parentVal && parentVal !== 'ALL') {
        baseActivities = baseActivities.filter((a) => (a.client || '') === parentVal || (a.client || '').includes(parentVal));
      }
      if (bVal && bVal !== 'ALL') {
        baseActivities = baseActivities.filter((a) => (a.branch || '') === bVal || (a.branch || '').includes(bVal));
      }
      if (cVal && cVal !== 'ALL') {
        baseActivities = baseActivities.filter((a) => a.coordinatorId === cVal);
      }
    }

    // Render Master Branch Cards before applying branch/status quick-chip filter
    renderMasterBranchCards(baseActivities);

    let allActivities = selectedBranchKey
      ? baseActivities.filter((a) => (a.branch || '') === selectedBranchKey)
      : baseActivities;

    const closedList = allActivities.filter((a) => a.endStatus === 'ENDED' || Boolean(a.isClosed));
    const openActivities = allActivities.filter((a) => a.endStatus !== 'ENDED' && !a.isClosed);
    const accepted = openActivities.filter((a) => a.reviewStatus === 'ACCEPTED' || a.status === 'Accepted');
    const reviewList = openActivities.filter((a) => a.reviewStatus === 'UNDER_REVIEW' || a.status === 'Under Review' || (!a.reviewStatus && !a.status));
    const rejectedList = openActivities.filter((a) => a.reviewStatus === 'REJECTED' || a.status === 'Rejected');

    const cntAll = document.getElementById('cnt-all');
    const cntReview = document.getElementById('cnt-review');
    const cntAccepted = document.getElementById('cnt-accepted');
    const cntRejected = document.getElementById('cnt-rejected');
    const cntClosed = document.getElementById('cnt-closed');
    if (cntAll) cntAll.textContent = allActivities.length;
    if (cntReview) cntReview.textContent = reviewList.length;
    if (cntAccepted) cntAccepted.textContent = accepted.length;
    if (cntRejected) cntRejected.textContent = rejectedList.length;
    if (cntClosed) cntClosed.textContent = closedList.length;

    const kpiTotal = document.getElementById('kpi-total');
    const kpiAccepted = document.getElementById('kpi-accepted');
    const kpiUnderReview = document.getElementById('kpi-under-review');

    if (kpiTotal) kpiTotal.textContent = allActivities.length;
    if (kpiAccepted) kpiAccepted.textContent = accepted.length;
    if (kpiUnderReview) {
      kpiUnderReview.textContent = reviewList.length;
      const kpiCard = kpiUnderReview.closest('.kpi-card');
      if (kpiCard) {
        if (reviewList.length > 0) {
          kpiCard.classList.add('glowing-under-review');
        } else {
          kpiCard.classList.remove('glowing-under-review');
        }
      }
    }

    const filtered =
      currentFilter === 'ALL'
        ? allActivities
        : (currentFilter === 'CLOSED' || currentFilter === 'ENDED')
          ? closedList
          : openActivities.filter((a) => {
              const rSt = a.reviewStatus || a.status;
              if (currentFilter === 'Accepted' || currentFilter === 'ACCEPTED') return rSt === 'ACCEPTED' || rSt === 'Accepted';
              if (currentFilter === 'Rejected' || currentFilter === 'REJECTED') return rSt === 'REJECTED' || rSt === 'Rejected';
              if (currentFilter === 'Under Review' || currentFilter === 'UNDER_REVIEW') return rSt === 'UNDER_REVIEW' || rSt === 'Under Review' || (!a.reviewStatus && !a.status);
              return rSt === currentFilter;
            });

    const container = document.getElementById('activities-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card db-s15">
          <p class="db-s16">لا توجد بطاقات نشاط مطابقة لهذا التصنيف حالياً.</p>
          <a href="./activity-card.html" class="btn btn-primary btn-sm">
            <i data-lucide="camera" class="ui-icon ui-icon-sm"></i>
            <span>توثيق نشاط ميداني الآن</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((act) => global.ActivityCardItem.render(act, { computeRating: (a) => Activity.computeOverallRating(a), renderStatusBadge }))
      .join('');

    // Attach card click handlers with delegation to dedicated activity details page
    container.querySelectorAll('.activity-card-item').forEach((card) => {
      const actId = card.dataset.actId;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-card-action-bar')) return;
        window.location.href = `./activity-details.html?id=${actId}`;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.activity-card-action-bar')) return;
          e.preventDefault();
          window.location.href = `./activity-details.html?id=${actId}`;
        }
      });
    });

    container.querySelectorAll('.btn-quick-add-photo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actId = btn.dataset.actId;
        window.location.href = `./activity-details.html?id=${actId}&action=new-followup`;
      });
    });

    container.querySelectorAll('.btn-open-card-details').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actId = btn.dataset.actId;
        window.location.href = `./activity-details.html?id=${actId}`;
      });
    });

    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(container);
    }
  }

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      syncFilterChipsUI();
      renderDashboard();
    });
  });

  renderDashboard();
  if (typeof window !== "undefined" && typeof window.refreshIcons === "function") {
    window.refreshIcons(document);
  }
})(typeof window !== 'undefined' ? window : globalThis);
