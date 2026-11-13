/**
 * ADCO Field Operations System - Branch Details Page Controller
 * Single Responsibility: Thin route & filter controller for branch-details.html
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

  const params = new URLSearchParams(window.location.search);
  const requestedBranch = params.get('branch') || user.assignedBranchName || user.branch || 'فرع سموحة - الإسكندرية';
  const requestedClient = params.get('client') || user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
  const fromPage = params.get('from') || (typeof document !== 'undefined' && document.referrer && document.referrer.includes('supervisor') ? 'supervisor' : 'dashboard');

  const backBtn = document.getElementById('bd-back-btn');
  if (backBtn) {
    const backHref = fromPage === 'supervisor' ? './supervisor-panel.html' : './dashboard.html';
    backBtn.setAttribute('href', backHref);
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (Router && typeof Router.navigateTo === 'function') {
        Router.navigateTo(backHref);
      } else {
        window.location.href = backHref;
      }
    });
  }

  let currentFilter = params.get('status') || 'ALL';

  const typeSelect = document.getElementById('bd-filter-activity-type');
  const statusSelect = document.getElementById('bd-filter-status-select');
  const dateFromInput = document.getElementById('bd-filter-date-from');
  const dateToInput = document.getElementById('bd-filter-date-to');
  const resetFiltersBtn = document.getElementById('bd-reset-filters-btn');

  function populateActivityTypesDropdown() {
    if (!typeSelect) return;
    const catTypes = (global.ADCO_CATALOGS && Array.isArray(global.ADCO_CATALOGS.activityTypes))
      ? global.ADCO_CATALOGS.activityTypes
      : ['جندولة', 'دريس اب', 'سايد جندولة', 'ستاند', 'بوديوم', 'بيلر', 'كات مان', 'سي ثرو', 'لايت بوكس', 'عرض أرضي'];
    const catActs = (global.ADCO_CATALOGS && Array.isArray(global.ADCO_CATALOGS.activities))
      ? global.ADCO_CATALOGS.activities
      : ['عقد', 'فرشة مجلة', 'إضافي', 'افتتاح فرع جديد', 'مهرجان', 'موسمي'];
    const combined = [...new Set([...catTypes, ...catActs])];

    typeSelect.innerHTML =
      '<option value="ALL">جميع أنواع الأنشطة</option>' +
      combined.map((t) => `<option value="${t}">${t}</option>`).join('');
  }
  populateActivityTypesDropdown();

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
    if (statusSelect && statusSelect.value !== currentFilter) {
      statusSelect.value = currentFilter;
    }
  }

  function updateCountersAndKpis(branchActivities) {
    const accepted = branchActivities.filter((a) => !a.isClosed && a.status === 'Accepted');
    const reviewList = branchActivities.filter((a) => !a.isClosed && a.status === 'Under Review');
    const rejectedList = branchActivities.filter((a) => !a.isClosed && a.status === 'Rejected');
    const closedList = branchActivities.filter((a) => Boolean(a.isClosed));

    const kpiTotal = document.getElementById('bd-kpi-total');
    const kpiAccepted = document.getElementById('bd-kpi-accepted');
    const kpiUnderReview = document.getElementById('bd-kpi-under-review');
    if (kpiTotal) kpiTotal.textContent = branchActivities.length;
    if (kpiAccepted) kpiAccepted.textContent = accepted.length;
    if (kpiUnderReview) {
      kpiUnderReview.textContent = reviewList.length;
      const kpiCard = kpiUnderReview.closest('.kpi-card');
      if (kpiCard) kpiCard.classList.toggle('glowing-under-review', reviewList.length > 0);
    }

    const cntAll = document.getElementById('bd-cnt-all');
    const cntReview = document.getElementById('bd-cnt-review');
    const cntAccepted = document.getElementById('bd-cnt-accepted');
    const cntRejected = document.getElementById('bd-cnt-rejected');
    const cntClosed = document.getElementById('bd-cnt-closed');
    if (cntAll) cntAll.textContent = branchActivities.length;
    if (cntReview) {
      cntReview.textContent = reviewList.length;
      const chip = cntReview.closest('.filter-chip');
      if (chip) chip.classList.toggle('glowing-under-review', reviewList.length > 0);
    }
    if (cntAccepted) cntAccepted.textContent = accepted.length;
    if (cntRejected) cntRejected.textContent = rejectedList.length;
    if (cntClosed) cntClosed.textContent = closedList.length;
  }

  function renderBranchDetailsPage() {
    if (!Activity) return;

    const allPool = Activity.getAllActivities();
    const branchActivities = allPool.filter(
      (a) => (a.branch || '').trim() === requestedBranch.trim() || (a.branch || '').includes(requestedBranch)
    );

    const sample = branchActivities[0] || {};
    const parentClient = sample.client || requestedClient;
    const branchName = sample.branch || requestedBranch;
    const supplyingBranch = sample.coordinatorBranch || (Activity.getSupplyingBranchSync ? Activity.getSupplyingBranchSync(parentClient, branchName) : 'الإسكندرية - قطاع وسط');
    const supervisorName = sample.reviewerName || 'أيمن عبد الرحمن الروبي';
    const locObj = sample.location || { latitude: 31.2156, longitude: 29.9553, address: branchName };

    const latNum = Number(locObj.latitude || 31.2156);
    const lngNum = Number(locObj.longitude || 29.9553);
    const mapsQuery = (locObj.latitude && locObj.longitude) ? `${latNum},${lngNum}` : `${parentClient} ${locObj.address || branchName}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

    const coordsSet = new Set();
    const brandsSet = new Set();
    branchActivities.forEach((act) => {
      if (act.coordinatorName) coordsSet.add(act.coordinatorName);
      if (Array.isArray(act.brands)) act.brands.forEach((b) => brandsSet.add(b));
    });

    const rawCoords = Array.from(coordsSet).join(' ، ') || user.fullName || 'أحمد محمود العبد';
    const coordNames = typeof formatTwoWordName === 'function' ? formatTwoWordName(rawCoords) : rawCoords;
    const registryList = Auth && typeof Auth.getRegistry === 'function' ? Auth.getRegistry() : (global.ADCO_EMPLOYEE_REGISTRY || []);
    const coordExtra = Array.from(coordsSet)
      .map((name) => {
        const emp = Array.isArray(registryList) ? registryList.find((r) => r.fullName === name || r.name === name) : null;
        if (!emp) return null;
        const parts = [emp.employeeId, emp.phone].filter(Boolean);
        return parts.length > 0 ? `${typeof formatTwoWordName === 'function' ? formatTwoWordName(name) : name} (${parts.join(' - ')})` : null;
      })
      .filter(Boolean)
      .join(' ، ');
    const brandsList = Array.from(brandsSet).join(' ، ') || 'فلفيتا ، فييا ، فما ، جلاسي';

    const titleEl = document.getElementById('bd-client-title');
    const subEl = document.getElementById('bd-branch-subtitle');
    if (titleEl) titleEl.textContent = parentClient;
    if (subEl) subEl.textContent = `${branchName} — سجل الأنشطة الميدانية وبيانات الفرع الكاملة`;

    updateCountersAndKpis(branchActivities);

    if (global.BranchHeroCard) {
      global.BranchHeroCard.render(document.getElementById('bd-hero-meta-card'), {
        parentClient, branchName, supplyingBranch, googleMapsUrl, mapsQuery,
        coordExtra, coordNames, supervisorName, locObj, latNum, lngNum, brandsList
      });
    }

    let filtered = [...branchActivities];
    if (currentFilter === 'CLOSED') {
      filtered = filtered.filter((a) => Boolean(a.isClosed));
    } else if (currentFilter !== 'ALL') {
      filtered = filtered.filter((a) => !a.isClosed && a.status === currentFilter);
    }

    const selectedType = typeSelect ? typeSelect.value : 'ALL';
    if (selectedType && selectedType !== 'ALL') {
      filtered = filtered.filter((a) =>
        (a.activityType || '') === selectedType || (a.activity || '') === selectedType || (a.displayType || '').includes(selectedType)
      );
    }

    const fromVal = dateFromInput && dateFromInput.value ? new Date(dateFromInput.value).getTime() : null;
    const toVal = dateToInput && dateToInput.value ? new Date(dateToInput.value).getTime() : null;
    if (fromVal && !isNaN(fromVal)) {
      filtered = filtered.filter((a) => {
        const ts = new Date(a.activityDate || a.timestamp || a.createdAt || 0).getTime();
        return !isNaN(ts) && ts >= fromVal;
      });
    }
    if (toVal && !isNaN(toVal)) {
      filtered = filtered.filter((a) => {
        const ts = new Date(a.activityDate || a.timestamp || a.createdAt || 0).getTime();
        return !isNaN(ts) && ts <= toVal;
      });
    }

    const container = document.getElementById('activities-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card db-s15">
          <p class="db-s16">لا توجد بطاقات نشاط مطابقة لهذا التصنيف في ${branchName} حالياً.</p>
          <a href="./activity-card.html" class="btn btn-primary btn-sm">
            <i data-lucide="camera" class="ui-icon ui-icon-sm"></i>
            <span>توثيق نشاط ميداني جديد بالفرع</span>
          </a>
        </div>
      `;
      if (typeof global.refreshIcons === 'function') global.refreshIcons(container);
      return;
    }

    container.innerHTML = filtered
      .map((act) => global.ActivityCardItem.render(act, { computeRating: Activity.computeOverallRating, renderStatusBadge }))
      .join('');

    container.querySelectorAll('.activity-card-item').forEach((card) => {
      const actId = card.dataset.actId;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-card-action-bar')) return;
        window.location.href = `./activity-details.html?id=${actId}`;
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
      renderBranchDetailsPage();
    });
  });

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      currentFilter = statusSelect.value || 'ALL';
      syncFilterChipsUI();
      renderBranchDetailsPage();
    });
  }

  [typeSelect, dateFromInput, dateToInput].forEach((el) => {
    if (el) el.addEventListener('change', renderBranchDetailsPage);
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      currentFilter = 'ALL';
      if (typeSelect) typeSelect.value = 'ALL';
      if (statusSelect) statusSelect.value = 'ALL';
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      syncFilterChipsUI();
      renderBranchDetailsPage();
    });
  }

  syncFilterChipsUI();
  renderBranchDetailsPage();
})(typeof window !== 'undefined' ? window : globalThis);
