/**
 * ADCO Field Operations System - Branch Details Page Controller
 * Single Responsibility: Dedicated Branch View (branch-details.html) showing
 * Parent Client (العميل الأم) first, specific Branch Name (فرع العميل) underneath,
 * full supplying branch metadata (فرع الشركة المورد للبضاعة), coordinator/supervisor info,
 * GPS location, interactive status counters, and all activities belonging strictly to that branch.
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

  const params = new URLSearchParams(window.location.search);
  const requestedBranch = params.get('branch') || user.assignedBranchName || user.branch || 'فرع سموحة - الإسكندرية';
  const requestedClient = params.get('client') || user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';

  let currentFilter = params.get('status') || 'ALL';

  const typeSelect = document.getElementById('bd-filter-activity-type');
  const statusSelect = document.getElementById('bd-filter-status-select');
  const dateFromInput = document.getElementById('bd-filter-date-from');
  const dateToInput = document.getElementById('bd-filter-date-to');
  const resetFiltersBtn = document.getElementById('bd-reset-filters-btn');

  // Populate Activity Type dropdown from ADCO_CATALOGS + existing branch activities
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

  function renderStatusBadge(status) {
    if (status === 'Accepted') return '<span class="badge badge-success">المقبولة</span>';
    if (status === 'Rejected') return '<span class="badge badge-danger">المرفوضة</span>';
    return '<span class="badge badge-warning">تحت المراجعة</span>';
  }

  function syncFilterChipsUI() {
    document.querySelectorAll('.filter-chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === currentFilter);
    });
    if (statusSelect && statusSelect.value !== currentFilter) {
      statusSelect.value = currentFilter;
    }
  }

  function openGoogleMapsForBranch(queryStr) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
    const mapsQuery = (locObj.latitude && locObj.longitude)
      ? `${latNum},${lngNum}`
      : `${parentClient} ${locObj.address || branchName}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

    const coordsSet = new Set();
    const brandsSet = new Set();
    branchActivities.forEach((act) => {
      if (act.coordinatorName) coordsSet.add(act.coordinatorName);
      if (Array.isArray(act.brands)) {
        act.brands.forEach((b) => brandsSet.add(b));
      }
    });

    const rawCoords = Array.from(coordsSet).join(' ، ') || user.fullName || 'أحمد محمود العبد';
    const coordNames = typeof formatTwoWordName === 'function' ? formatTwoWordName(rawCoords) : rawCoords;
    const brandsList = Array.from(brandsSet).join(' ، ') || 'فلفيتا ، فييا ، فما ، جلاسي';

    const titleEl = document.getElementById('bd-client-title');
    const subEl = document.getElementById('bd-branch-subtitle');
    if (titleEl) titleEl.textContent = parentClient;
    if (subEl) subEl.textContent = `${branchName} — سجل الأنشطة الميدانية وبيانات الفرع الكاملة`;

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
      if (kpiCard) {
        if (reviewList.length > 0) {
          kpiCard.classList.add('glowing-under-review');
        } else {
          kpiCard.classList.remove('glowing-under-review');
        }
      }
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
      if (chip) {
        if (reviewList.length > 0) {
          chip.classList.add('glowing-under-review');
        } else {
          chip.classList.remove('glowing-under-review');
        }
      }
    }
    if (cntAccepted) cntAccepted.textContent = accepted.length;
    if (cntRejected) cntRejected.textContent = rejectedList.length;
    if (cntClosed) cntClosed.textContent = closedList.length;

    const heroCard = document.getElementById('bd-hero-meta-card');
    if (heroCard) {
      heroCard.innerHTML = `
        <div class="bd-hero-card-header">
          <div class="bd-hero-title-group">
            <h2 class="bd-hero-client-title">${parentClient}</h2>
            <div class="bd-hero-branch-title">
              <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>${branchName}</span>
            </div>
          </div>

          <div class="branch-supply-pill bd-hero-supply-box">
            <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>فرع الشركة المورد للبضاعة: <strong>${supplyingBranch}</strong></span>
          </div>

          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="branch-gps-map-link bd-hero-map-btn" id="bd-hero-subtitle-map-link" data-map-query="${mapsQuery}" title="اضغط لفتح موقع الفرع على خرائط جوجل (Google Maps)">
            <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>فتح موقع الفرع على خرائط Google Maps</span>
          </a>
        </div>

        <div class="branch-meta-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; padding: 14px 16px;">
          <div class="branch-meta-item">
            <span class="branch-meta-label">العميل الأم (Parent Client)</span>
            <span class="branch-meta-val">${parentClient}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">فرع العميل (Branch)</span>
            <span class="branch-meta-val">${branchName}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">فرع الشركة المورد للبضاعة</span>
            <span class="branch-meta-val">${supplyingBranch}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">المنسق الميداني المسؤول</span>
            <span class="branch-meta-val">${coordNames}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">المشرف المسؤول</span>
            <span class="branch-meta-val">${supervisorName}</span>
          </div>
          <div class="branch-meta-item">
            <span class="branch-meta-label">الموقع والإحداثيات (GPS - خرائط جوجل)</span>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="branch-gps-map-link" id="bd-meta-gps-map-link" data-map-query="${mapsQuery}" title="افتح الإحداثيات في Google Maps">
              <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>${locObj.address || branchName} (${latNum.toFixed(4)}°N, ${lngNum.toFixed(4)}°E)</span>
            </a>
          </div>
          <div class="branch-meta-item full-span">
            <span class="branch-meta-label">العلامات التجارية المعروضة بالفرع</span>
            <span class="branch-meta-val" style="color: var(--adco-green-primary);">${brandsList}</span>
          </div>
        </div>
      `;

      heroCard.querySelectorAll('.branch-gps-map-link').forEach((linkEl) => {
        linkEl.addEventListener('click', (e) => {
          e.preventDefault();
          const q = linkEl.dataset.mapQuery || mapsQuery;
          openGoogleMapsForBranch(q);
        });
      });
    }

    // Apply Advanced Activity Filters (Status, Activity Type, Date/Time Range)
    let filtered = [...branchActivities];

    // 1. Status filter
    if (currentFilter === 'CLOSED') {
      filtered = filtered.filter((a) => Boolean(a.isClosed));
    } else if (currentFilter !== 'ALL') {
      filtered = filtered.filter((a) => !a.isClosed && a.status === currentFilter);
    }

    // 2. Activity Type filter
    const selectedType = typeSelect ? typeSelect.value : 'ALL';
    if (selectedType && selectedType !== 'ALL') {
      filtered = filtered.filter(
        (a) =>
          (a.activityType || '') === selectedType ||
          (a.activity || '') === selectedType ||
          (a.displayType || '').includes(selectedType)
      );
    }

    // 3. Date / Time range filter
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
            <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>توثيق نشاط ميداني جديد بالفرع</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((act) => {
        const ratingStats = Activity.computeOverallRating(act);
        const actSupplying = act.coordinatorBranch || supplyingBranch;
        const actSupervisor = act.reviewerName || supervisorName;
        const locAddress = (act.location && act.location.address) ? act.location.address : act.branch;

        return `
          <a href="./activity-card.html?id=${act.id}" class="activity-card-item">
            <div class="activity-card-head">
              <img src="${act.photoUrl}" alt="${act.client}" class="activity-card-thumb" />
              <div class="db-s17">
                <div class="db-s18">
                  <strong class="db-s19">${act.client}</strong>
                  <div class="db-s20">
                    ${act.isClosed ? `<span class="badge badge-success db-s21">منتهي</span>` : act.closureRequested ? `<span class="badge badge-warning db-s21">طلب إنهاء</span>` : ''}
                    ${renderStatusBadge(act.status)}
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
                  <span>فرع الشركة المورد للبضاعة: <strong>${actSupplying}</strong></span>
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
                <span class="branch-meta-val">${actSupervisor}</span>
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
      })
      .join('');
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

  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      renderBranchDetailsPage();
    });
  }

  if (dateFromInput) {
    dateFromInput.addEventListener('change', () => {
      renderBranchDetailsPage();
    });
  }

  if (dateToInput) {
    dateToInput.addEventListener('change', () => {
      renderBranchDetailsPage();
    });
  }

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

  renderBranchDetailsPage();
})(typeof window !== 'undefined' ? window : globalThis);
