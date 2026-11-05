/**
 * ADCO Field Operations System - Dashboard Page Controller
 * Single Responsibility: Coordinator & Supervisor operational dashboard, 3-tier RBAC scoping,
 * dedicated Coordinator Supervisor branch & coordinator toolbar, KPI cards, and activities feed.
 * Compatible with both file:// protocol and http:// server environments.
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const Activity = global.ActivityManager || global.ActivityService;
  const Router = global.AppRouter;

  const user = Auth ? Auth.checkAuthGuard() : null;
  if (!user) return;

  if (Router && typeof Router.init === 'function') {
    Router.init();
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

  // Setup Coordinator Supervisor Filter Toolbar if active
  const supToolbar = document.getElementById('sup-filter-toolbar');
  const supBranchSelect = document.getElementById('filter-sup-branch');
  const supCoordSelect = document.getElementById('filter-sup-coord');
  const supBranchCountBadge = document.getElementById('sup-branch-count-badge');
  const supClientTag = document.getElementById('sup-client-tag');

  if (isCoordSup && supToolbar) {
    supToolbar.style.display = 'block';
    const assignedClient = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
    if (supClientTag) supClientTag.textContent = assignedClient;

    // Populate client branches
    const branches = Activity && typeof Activity.getBranchesForClient === 'function'
      ? Activity.getBranchesForClient(assignedClient)
      : ['فرع سموحة - الإسكندرية', 'فرع لوران - الكورنيش', 'فرع المنتزه - شيراتون', 'فرع ميامي - جمال عبد الناصر', 'فرع محرم بك - قناة السويس'];

    if (supBranchSelect) {
      supBranchSelect.innerHTML =
        '<option value="ALL">كل فروع العميل</option>' +
        branches.map((b) => `<option value="${b}">${b}</option>`).join('');

      supBranchSelect.addEventListener('change', () => {
        if (supBranchCountBadge) {
          supBranchCountBadge.textContent = supBranchSelect.value === 'ALL' ? 'كل فروع العميل' : supBranchSelect.value;
        }
        renderDashboard();
      });
    }

    // Populate coordinators
    const coords = Activity && typeof Activity.getCoordinatorsForClient === 'function'
      ? Activity.getCoordinatorsForClient(assignedClient)
      : [{ id: 'ADCO-101', name: 'أحمد محمود العبد' }, { id: 'ADCO-102', name: 'سارة طارق إبراهيم' }];

    if (supCoordSelect) {
      supCoordSelect.innerHTML =
        '<option value="ALL">كل المنسقين</option>' +
        coords.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

      supCoordSelect.addEventListener('change', () => {
        renderDashboard();
      });
    }
  }

  let currentFilter = 'ALL';

  function renderStatusBadge(status) {
    if (status === 'Accepted') return '<span class="badge badge-success">مقبول</span>';
    if (status === 'Rejected') return '<span class="badge badge-danger">مرفوض</span>';
    return '<span class="badge badge-warning">قيد المراجعة</span>';
  }

  function renderDashboard() {
    if (!Activity) return;
    // 3-Tier Scoped Activities Base
    let allActivities = Activity.getActivitiesForUser(user);

    // Coordinator Supervisor dynamic dropdown filters
    if (isCoordSup) {
      const bVal = supBranchSelect ? supBranchSelect.value : 'ALL';
      const cVal = supCoordSelect ? supCoordSelect.value : 'ALL';
      if (bVal && bVal !== 'ALL') {
        allActivities = allActivities.filter((a) => (a.branch || '').includes(bVal));
      }
      if (cVal && cVal !== 'ALL') {
        allActivities = allActivities.filter((a) => a.coordinatorId === cVal);
      }
    }

    const accepted = allActivities.filter((a) => a.status === 'Accepted');
    const ratings = allActivities.map((a) => Activity.computeWeightedEvaluation(a));
    const avgScore =
      ratings.length > 0
        ? Math.round(ratings.reduce((acc, c) => acc + c.totalWeightedScore, 0) / ratings.length)
        : 0;

    const kpiTotal = document.getElementById('kpi-total');
    const kpiAccepted = document.getElementById('kpi-accepted');
    const kpiAvgScore = document.getElementById('kpi-avg-score');

    if (kpiTotal) kpiTotal.textContent = allActivities.length;
    if (kpiAccepted) kpiAccepted.textContent = accepted.length;
    if (kpiAvgScore) kpiAvgScore.textContent = `${avgScore}/100`;

    const filtered =
      currentFilter === 'ALL'
        ? allActivities
        : allActivities.filter((a) => a.status === currentFilter);

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
      .map((act) => {
        const ratingStats = Activity.computeOverallRating(act);
        return `
          <a href="./activity-card.html?id=${act.id}" class="activity-card-item">
            <img src="${act.photoUrl}" alt="${act.client}" class="activity-card-thumb" />
            <div class="db-s17">
              <div>
                <div class="db-s18">
                  <strong class="db-s19">${act.client}</strong>
                  <div class="db-s20">
                    ${act.isClosed ? `<span class="badge badge-success db-s21">منتهي</span>` : act.closureRequested ? `<span class="badge badge-warning db-s21">طلب إنهاء</span>` : ''}
                    ${renderStatusBadge(act.status)}
                  </div>
                </div>
                <p class="db-s22">
                  ${act.branch} | <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong>
                </p>
              </div>
              <div class="db-s23">
                <span class="badge badge-warning db-s24">
                  <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>التقييم: ${ratingStats.totalWeightedScore}/100</span>
                </span>
                <span class="db-s25">
                  ${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'متابعة' : 'متابعات'}
                </span>
              </div>
            </div>
          </a>
        `;
      })
      .join('');
  }

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderDashboard();
    });
  });

  renderDashboard();
})(typeof window !== 'undefined' ? window : globalThis);
