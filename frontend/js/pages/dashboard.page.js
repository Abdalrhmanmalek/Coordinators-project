/**
 * ADCO Field Operations System - Dashboard Page Controller
 * Single Responsibility: Thin view controller for dashboard.html
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
      welcomeRole.textContent = `مشرف منسق — ${user.assignedClientName || 'فتح الله'}`;
    } else if (isManager) {
      welcomeRole.textContent = 'مسؤول التسويق';
    } else {
      welcomeRole.textContent = `منسق ميداني — ${user.assignedBranchName || user.branch || 'فرع سموحة'}`;
    }
  }

  const supToolbar = document.getElementById('sup-filter-toolbar');
  const dbToggleFiltersBtn = document.getElementById('toggle-branch-filters-btn');
  const dbActiveBadge = document.getElementById('db-filter-active-badge');
  const dbClearFiltersBtn = document.getElementById('db-clear-filters-btn');
  const parentClientSelect = document.getElementById('filter-parent-client');
  const supBranchSelect = document.getElementById('filter-sup-branch');
  const supCoordSelect = document.getElementById('filter-sup-coord');
  const supClientTag = document.getElementById('sup-client-tag');
  const resetBranchBtn = document.getElementById('reset-branch-card-filter');

  let currentFilter = 'ALL';
  let selectedBranchKey = null;
  let showAllBranchesMode = false;

  function updateDbFilterIndicators() {
    const cVal = !isCoordSup && parentClientSelect ? parentClientSelect.value : 'ALL';
    const bVal = supBranchSelect ? supBranchSelect.value : 'ALL';
    const coordVal = supCoordSelect ? supCoordSelect.value : 'ALL';
    const activeCount = (cVal && cVal !== 'ALL' ? 1 : 0) + (bVal && bVal !== 'ALL' ? 1 : 0) + (coordVal && coordVal !== 'ALL' ? 1 : 0);

    if (dbActiveBadge) {
      dbActiveBadge.textContent = String(activeCount);
      dbActiveBadge.classList.toggle('is-hidden', activeCount === 0);
    }
    if (dbClearFiltersBtn) dbClearFiltersBtn.classList.toggle('is-hidden', activeCount === 0);
  }

  function syncFilterChipsUI() {
    document.querySelectorAll('.filter-chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === currentFilter);
    });
  }

  if ((isCoordSup || isManager) && supToolbar) {
    supToolbar.classList.remove('is-hidden');
    if (dbToggleFiltersBtn) {
      dbToggleFiltersBtn.classList.remove('is-hidden');
      dbToggleFiltersBtn.addEventListener('click', () => {
        const willOpen = !supToolbar.classList.contains('is-open');
        supToolbar.classList.toggle('is-open', willOpen);
        dbToggleFiltersBtn.classList.toggle('active', willOpen);
        dbToggleFiltersBtn.setAttribute('aria-expanded', String(willOpen));
      });
    }

    const userActs = Activity ? Activity.getActivitiesForUser(user) : [];
    const distinctClientsFromActs = [...new Set(userActs.map((a) => a.client).filter(Boolean))];
    const catalogClients = (global.ADCO_CATALOGS && Array.isArray(global.ADCO_CATALOGS.clients)) ? global.ADCO_CATALOGS.clients : [];
    const allClientsList = [...new Set([...distinctClientsFromActs, ...catalogClients])];

    if (isCoordSup) {
      const assignedClient = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
      if (supClientTag) supClientTag.textContent = assignedClient;
      if (parentClientSelect) parentClientSelect.innerHTML = `<option value="${assignedClient}" selected>${assignedClient}</option>`;
      global.DashboardBranches.populateDynamicBranchDropdown(supBranchSelect, Activity, user, assignedClient);
      global.DashboardBranches.populateDynamicCoordinatorDropdown(supCoordSelect, Activity, user, assignedClient);
    } else {
      if (supClientTag) supClientTag.textContent = 'جميع العملاء والسلاسل التجارية';
      if (parentClientSelect) {
        parentClientSelect.innerHTML =
          '<option value="ALL">جميع السلاسل والعملاء (الكل)</option>' +
          allClientsList.map((c) => `<option value="${c}">${c}</option>`).join('');
      }
      global.DashboardBranches.populateDynamicBranchDropdown(supBranchSelect, Activity, user, 'ALL');
      global.DashboardBranches.populateDynamicCoordinatorDropdown(supCoordSelect, Activity, user, 'ALL');
    }

    if (parentClientSelect) {
      if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.enhance(parentClientSelect, { searchPlaceholder: 'ابحث عن العميل الأم...' });
      parentClientSelect.addEventListener('change', () => {
        const chosenClient = parentClientSelect.value || 'ALL';
        selectedBranchKey = null;
        if (supClientTag) supClientTag.textContent = chosenClient === 'ALL' ? 'جميع العملاء والسلاسل التجارية' : chosenClient;
        global.DashboardBranches.populateDynamicBranchDropdown(supBranchSelect, Activity, user, chosenClient);
        global.DashboardBranches.populateDynamicCoordinatorDropdown(supCoordSelect, Activity, user, chosenClient);
        updateDbFilterIndicators();
        renderDashboard();
      });
    }

    if (supBranchSelect) {
      if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.enhance(supBranchSelect, { searchPlaceholder: 'ابحث عن الفرع...' });
      supBranchSelect.addEventListener('change', () => {
        selectedBranchKey = supBranchSelect.value === 'ALL' ? null : supBranchSelect.value;
        updateDbFilterIndicators();
        renderDashboard();
      });
    }

    if (supCoordSelect) {
      if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.enhance(supCoordSelect, { searchPlaceholder: 'ابحث عن المنسق...' });
      supCoordSelect.addEventListener('change', () => {
        updateDbFilterIndicators();
        renderDashboard();
      });
    }

    if (dbClearFiltersBtn) {
      dbClearFiltersBtn.addEventListener('click', () => {
        selectedBranchKey = null;
        const baseClient = isCoordSup ? (user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)') : 'ALL';
        if (!isCoordSup && parentClientSelect) {
          parentClientSelect.value = 'ALL';
          if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.sync(parentClientSelect);
          if (supClientTag) supClientTag.textContent = 'جميع العملاء والسلاسل التجارية';
        }
        global.DashboardBranches.populateDynamicBranchDropdown(supBranchSelect, Activity, user, baseClient);
        global.DashboardBranches.populateDynamicCoordinatorDropdown(supCoordSelect, Activity, user, baseClient);
        if (supBranchSelect) {
          supBranchSelect.value = 'ALL';
          if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.sync(supBranchSelect);
        }
        if (supCoordSelect) {
          supCoordSelect.value = 'ALL';
          if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.sync(supCoordSelect);
        }
        updateDbFilterIndicators();
        renderDashboard();
      });
    }
  }

  if (resetBranchBtn) {
    resetBranchBtn.addEventListener('click', () => {
      if (selectedBranchKey) selectedBranchKey = null;
      else showAllBranchesMode = !showAllBranchesMode;
      if (supBranchSelect) {
        supBranchSelect.value = 'ALL';
        if (global.ADCOFilterDropdown) global.ADCOFilterDropdown.sync(supBranchSelect);
      }
      updateDbFilterIndicators();
      renderDashboard();
    });
  }

  function renderDashboard() {
    if (!Activity) return;
    let baseActivities = (showAllBranchesMode && typeof Activity.getAllActivities === 'function')
      ? Activity.getAllActivities()
      : Activity.getActivitiesForUser(user);

    if (isCoordSup || isManager) {
      const parentVal = parentClientSelect ? parentClientSelect.value : 'ALL';
      const bVal = supBranchSelect ? supBranchSelect.value : 'ALL';
      const cVal = supCoordSelect ? supCoordSelect.value : 'ALL';
      if (parentVal && parentVal !== 'ALL') baseActivities = baseActivities.filter((a) => (a.client || '') === parentVal || (a.client || '').includes(parentVal));
      if (bVal && bVal !== 'ALL') baseActivities = baseActivities.filter((a) => (a.branch || '') === bVal || (a.branch || '').includes(bVal));
      if (cVal && cVal !== 'ALL') baseActivities = baseActivities.filter((a) => a.coordinatorId === cVal);
    }

    global.DashboardBranches.renderMasterBranchCards(baseActivities, {
      user, isCoordSup, selectedBranchKey, showAllBranchesMode, resetBranchBtn, Router
    });

    const allActivities = selectedBranchKey ? baseActivities.filter((a) => (a.branch || '') === selectedBranchKey) : baseActivities;
    const closedList = allActivities.filter((a) => a.endStatus === 'ENDED' || Boolean(a.isClosed));
    const openActivities = allActivities.filter((a) => a.endStatus !== 'ENDED' && !a.isClosed);
    const accepted = openActivities.filter((a) => a.reviewStatus === 'ACCEPTED' || a.status === 'Accepted');
    const reviewList = openActivities.filter((a) => a.reviewStatus === 'UNDER_REVIEW' || a.status === 'Under Review' || (!a.reviewStatus && !a.status));
    const rejectedList = openActivities.filter((a) => a.reviewStatus === 'REJECTED' || a.status === 'Rejected');

    const countsMap = { 'cnt-all': allActivities.length, 'cnt-review': reviewList.length, 'cnt-accepted': accepted.length, 'cnt-rejected': rejectedList.length, 'cnt-closed': closedList.length, 'kpi-total': allActivities.length, 'kpi-accepted': accepted.length };
    Object.entries(countsMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    const kpiUnderReview = document.getElementById('kpi-under-review');
    if (kpiUnderReview) {
      kpiUnderReview.textContent = reviewList.length;
      const kpiCard = kpiUnderReview.closest('.kpi-card');
      if (kpiCard) kpiCard.classList.toggle('glowing-under-review', reviewList.length > 0);
    }

    const filtered = currentFilter === 'ALL'
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
      if (typeof global.refreshIcons === 'function') global.refreshIcons(container);
      return;
    }

    container.innerHTML = filtered
      .map((act) => global.ActivityCardItem.render(act, { computeRating: (a) => Activity.computeOverallRating(a), renderStatusBadge: global.DashboardBranches.renderStatusBadge }))
      .join('');

    container.querySelectorAll('.activity-card-item').forEach((card) => {
      const actId = card.dataset.actId;
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.activity-card-action-bar')) window.location.href = `./activity-details.html?id=${actId}`;
      });
      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.activity-card-action-bar')) {
          e.preventDefault();
          window.location.href = `./activity-details.html?id=${actId}`;
        }
      });
    });

    container.querySelectorAll('.btn-quick-add-photo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `./activity-details.html?id=${btn.dataset.actId}&action=new-followup`;
      });
    });

    container.querySelectorAll('.btn-open-card-details').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `./activity-details.html?id=${btn.dataset.actId}`;
      });
    });

    if (typeof global.refreshIcons === 'function') global.refreshIcons(container);
  }

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      syncFilterChipsUI();
      renderDashboard();
    });
  });

  renderDashboard();
  if (typeof global.refreshIcons === 'function') global.refreshIcons(document);
})(typeof window !== 'undefined' ? window : globalThis);
