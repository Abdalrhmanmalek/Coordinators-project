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
  const isManager = user && (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor');

  const welcomeTitle = document.getElementById('welcome-title');
  const welcomeRole = document.getElementById('welcome-role');

  if (welcomeTitle) welcomeTitle.textContent = `أهلاً، ${user.fullName}`;
  if (welcomeRole) {
    if (isCoordSup) {
      const clientName = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
      const region = user.region || 'الإسكندرية';
      welcomeRole.textContent = `مشرف منسق — مسؤول فروع ${clientName} - ${region}`;
    } else if (isManager) {
      welcomeRole.textContent = 'مسؤول التسويق — استعراض كافة السجلات الميدانية للجمهورية';
    } else {
      const branchLabel = user.assignedBranchName || user.branch || 'فرع سموحة - الإسكندرية';
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

  function renderStatusBadge(status) {
    if (status === 'Accepted') return '<span class="badge badge-success">مقبول</span>';
    if (status === 'Rejected') return '<span class="badge badge-danger">مرفوض</span>';
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
      if (act.isClosed) {
        entry.closed += 1;
      } else if (act.status === 'Accepted') {
        entry.accepted += 1;
      } else if (act.status === 'Rejected') {
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
            <img src="../assets/icons/plus-circle.svg" class="ui-icon ui-icon-sm" alt="" />
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
        const targetHref = card.dataset.href;
        if (targetHref) {
          if (Router && typeof Router.navigateTo === 'function') {
            Router.navigateTo(targetHref);
          } else {
            window.location.href = targetHref;
          }
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.status-counter-btn')) {
          const targetHref = card.dataset.href;
          if (targetHref) {
            if (Router && typeof Router.navigateTo === 'function') {
              Router.navigateTo(targetHref);
            } else {
              window.location.href = targetHref;
            }
          }
        }
      });
    });

    mount.querySelectorAll('.status-counter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bName = btn.dataset.branch;
        const cName = btn.dataset.client;
        const st = btn.dataset.st || 'ALL';
        const targetUrl = `./branch-details.html?branch=${encodeURIComponent(bName)}&client=${encodeURIComponent(cName)}&status=${encodeURIComponent(st)}`;
        if (Router && typeof Router.navigateTo === 'function') {
          Router.navigateTo(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      });
    });
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

    const accepted = allActivities.filter((a) => !a.isClosed && a.status === 'Accepted');
    const reviewList = allActivities.filter((a) => !a.isClosed && a.status === 'Under Review');
    const rejectedList = allActivities.filter((a) => !a.isClosed && a.status === 'Rejected');
    const closedList = allActivities.filter((a) => Boolean(a.isClosed));

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
        : currentFilter === 'CLOSED'
          ? closedList
          : allActivities.filter((a) => !a.isClosed && a.status === currentFilter);

    const container = document.getElementById('activities-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card db-s15">
          <p class="db-s16">لا توجد بطاقات نشاط مطابقة لهذا التصنيف حالياً.</p>
          <a href="./activity-card.html" class="btn btn-primary btn-sm">
            <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>توثيق نشاط ميداني الآن</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((act) => global.ActivityCardItem.render(act, { computeRating: (a) => Activity.computeOverallRating(a), renderStatusBadge }))
      .join('');
  }

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      syncFilterChipsUI();
      renderDashboard();
    });
  });

  renderDashboard();
})(typeof window !== 'undefined' ? window : globalThis);
