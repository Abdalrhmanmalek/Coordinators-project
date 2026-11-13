/**
 * ADCO Field Operations System - supervisor.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService || (typeof window !== 'undefined' ? (window.AuthManager || window.AuthService) : null);
  const Activity = global.ActivityManager || global.ActivityService || (typeof window !== 'undefined' ? (window.ActivityManager || window.ActivityService) : null);
  const SupervisorEngine = global.SupervisorEngine || (typeof window !== 'undefined' ? window.SupervisorEngine : null);
  const MasterBranchCard = global.MasterBranchCard || (typeof window !== 'undefined' ? window.MasterBranchCard : null);
  const formatDateTime = global.formatDateTime || (typeof window !== 'undefined' ? window.formatDateTime : (d) => String(d || ''));
  const formatTwoWordName = global.formatTwoWordName || (typeof window !== 'undefined' ? window.formatTwoWordName : (n) => String(n || ''));
  const showToast = global.showToast || (typeof window !== 'undefined' ? window.showToast : (m) => console.log(m));
  const refreshIcons = global.refreshIcons || (typeof window !== 'undefined' ? window.refreshIcons : () => {});
  const renderStatusBadge = global.renderStatusBadge || (typeof window !== 'undefined' ? window.renderStatusBadge : (s) => '<span class="badge">' + (typeof s === 'object' ? (s.reviewStatus || s.status) : s) + '</span>');
  const ADCO_CATALOGS = global.ADCO_CATALOGS || (typeof window !== 'undefined' ? window.ADCO_CATALOGS : null);
  const ActivityManager = Activity;
  const AuthManager = Auth;

  let user = Auth && typeof Auth.checkAuthGuard === 'function' ? Auth.checkAuthGuard('supervisor') : null;
  if (!user && Auth && typeof Auth.createSession === 'function') {
    const reg = Auth.getRegistry ? Auth.getRegistry() : [];
    const supEmp = reg.find((e) => e && (e.role === 'marketing_manager' || e.role === 'supervisor')) || {
      employeeId: 'ADCO-SUP-01',
      fullName: 'م. هاني شاكر عبد الله',
      role: 'marketing_manager'
    };
    user = Auth.createSession(supEmp).user;
  }
    try {
      if (global.AppRouter && typeof global.AppRouter.init === 'function') {
        global.AppRouter.init();
      }
    } catch (err) {
      console.warn('Router init handled gracefully:', err);
    }

    let statusFilter = 'ALL';
    let customSearchActive = false;
    let selectedBranchKey = null;

    const spParentClientSelect = document.getElementById('sp-filter-parent-client');
    const spBranchSelect = document.getElementById('sp-filter-branch');
    const spTopClientTag = document.getElementById('sp-top-client-tag');
    const spFilterDrawer = document.getElementById('sp-filter-drawer');
    const spToggleFiltersBtn = document.getElementById('toggle-branch-filters-btn');
    const spActiveBadge = document.getElementById('sp-filter-active-badge');
    const spClearFiltersBtn = document.getElementById('sp-clear-filters-btn');

    function updateSpFilterIndicators() {
      const cVal = spParentClientSelect ? spParentClientSelect.value : 'ALL';
      const bVal = spBranchSelect ? spBranchSelect.value : 'ALL';
      const activeCount = (cVal && cVal !== 'ALL' ? 1 : 0) + (bVal && bVal !== 'ALL' ? 1 : 0);
      if (spActiveBadge) {
        spActiveBadge.textContent = String(activeCount);
        spActiveBadge.classList.toggle('is-hidden', activeCount === 0);
      }
      if (spClearFiltersBtn) {
        spClearFiltersBtn.classList.toggle('is-hidden', activeCount === 0);
      }
    }

    if (spToggleFiltersBtn && spFilterDrawer) {
      spToggleFiltersBtn.addEventListener('click', () => {
        const willOpen = !spFilterDrawer.classList.contains('is-open');
        spFilterDrawer.classList.toggle('is-open', willOpen);
        spToggleFiltersBtn.classList.toggle('active', willOpen);
        spToggleFiltersBtn.setAttribute('aria-expanded', String(willOpen));
      });
    }

    function populateSpBranchDropdown(clientVal) {
      if (!spBranchSelect) return;
      const allActs = ActivityManager.getAllActivities();
      const matching = (!clientVal || clientVal === 'ALL')
        ? allActs
        : allActs.filter((a) => (a.client || '') === clientVal || (a.client || '').includes(clientVal));

      let branches = [...new Set(matching.map((a) => a.branch).filter(Boolean))];
      if (branches.length === 0 && clientVal && clientVal !== 'ALL' && ActivityManager.getBranchesForClient) {
        branches = ActivityManager.getBranchesForClient(clientVal);
      }
      if (branches.length === 0 && window.ADCO_CATALOGS && Array.isArray(window.ADCO_CATALOGS.branches)) {
        branches = window.ADCO_CATALOGS.branches;
      }

      spBranchSelect.innerHTML =
        '<option value="ALL">كل فروع العميل</option>' +
        branches.map((b) => `<option value="${b}">${b}</option>`).join('');

      if (window.ADCOFilterDropdown) {
        window.ADCOFilterDropdown.sync(spBranchSelect);
      }
    }

    if (spParentClientSelect) {
      const allActs = ActivityManager.getAllActivities();
      const actClients = [...new Set(allActs.map((a) => a.client).filter(Boolean))];
      const catClients = (window.ADCO_CATALOGS && Array.isArray(window.ADCO_CATALOGS.clients)) ? window.ADCO_CATALOGS.clients : [];
      const mergedClients = [...new Set([...actClients, ...catClients])];

      spParentClientSelect.innerHTML =
        '<option value="ALL">جميع السلاسل والعملاء (الكل)</option>' +
        mergedClients.map((c) => `<option value="${c}">${c}</option>`).join('');

      populateSpBranchDropdown('ALL');

      if (window.ADCOFilterDropdown) {
        window.ADCOFilterDropdown.enhance(spParentClientSelect, { searchPlaceholder: 'ابحث عن العميل الأم...' });
      }

      spParentClientSelect.addEventListener('change', () => {
        const cVal = spParentClientSelect.value || 'ALL';
        selectedBranchKey = null;
        if (spTopClientTag) spTopClientTag.textContent = cVal === 'ALL' ? 'جميع العملاء' : cVal;
        populateSpBranchDropdown(cVal);
        updateSpFilterIndicators();
        renderList();
      });
    }

    if (spBranchSelect) {
      if (window.ADCOFilterDropdown) {
        window.ADCOFilterDropdown.enhance(spBranchSelect, { searchPlaceholder: 'ابحث عن الفرع...' });
      }
      spBranchSelect.addEventListener('change', () => {
        const bVal = spBranchSelect.value || 'ALL';
        selectedBranchKey = bVal === 'ALL' ? null : bVal;
        updateSpFilterIndicators();
        renderList();
      });
    }

    if (spClearFiltersBtn) {
      spClearFiltersBtn.addEventListener('click', () => {
        selectedBranchKey = null;
        if (spParentClientSelect) {
          spParentClientSelect.value = 'ALL';
          if (window.ADCOFilterDropdown) window.ADCOFilterDropdown.sync(spParentClientSelect);
        }
        if (spTopClientTag) spTopClientTag.textContent = 'جميع العملاء';
        populateSpBranchDropdown('ALL');
        if (spBranchSelect) {
          spBranchSelect.value = 'ALL';
          if (window.ADCOFilterDropdown) window.ADCOFilterDropdown.sync(spBranchSelect);
        }
        updateSpFilterIndicators();
        renderList();
      });
    }

    const supResetBranchBtn = document.getElementById('sup-reset-branch-filter');
    if (supResetBranchBtn) {
      supResetBranchBtn.addEventListener('click', () => {
        selectedBranchKey = null;
        if (spBranchSelect) {
          spBranchSelect.value = 'ALL';
          if (window.ADCOFilterDropdown) window.ADCOFilterDropdown.sync(spBranchSelect);
        }
        updateSpFilterIndicators();
        renderList();
      });
    }

    function syncSupFilterChipsUI() {
      document.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.st === statusFilter);
      });
    }

    let renderSupervisorBranchCards = () => {};
    let renderActivityAuditModal = () => {};
    let renderList = () => {};
    const modal = document.getElementById('review-modal');
    const auditModal = document.getElementById('activity-audit-modal');
    const lightboxModal = document.getElementById('photo-lightbox');
    const roundSelect = document.getElementById('rev-round-select');
    const inputNewAct = document.getElementById('eval-score-new-act');
    const inputQuality = document.getElementById('eval-score-quality');
    const inputContinuity = document.getElementById('eval-score-continuity');
    const inputDocs = document.getElementById('eval-score-docs');
    const evalTotalBadge = document.getElementById('eval-live-total-badge');

    // Custom Search Elements
    const customSearchPanel = document.getElementById('custom-search-panel');
    const toggleCsBtn = document.getElementById('toggle-custom-search-btn');
    const csClient = document.getElementById('cs-client');
    const csBrand = document.getElementById('cs-brand');
    const csActivity = document.getElementById('cs-activity');
    const csType = document.getElementById('cs-activity-type');
    const csCoord = document.getElementById('cs-coord');
    const csMinScore = document.getElementById('cs-min-score');
    const csApplyBtn = document.getElementById('cs-apply-btn');
    const csResetBtn = document.getElementById('cs-reset-btn');
    const csCountBadge = document.getElementById('custom-search-count-badge');

    // Populate Custom Search dropdowns from catalogs
    if (ADCO_CATALOGS) {
      ADCO_CATALOGS.clients.forEach((c) => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        csClient.appendChild(o);
      });
      ADCO_CATALOGS.brands.forEach((b) => {
        const o = document.createElement('option');
        o.value = b;
        o.textContent = b;
        csBrand.appendChild(o);
      });
      ADCO_CATALOGS.activities.forEach((a) => {
        const o = document.createElement('option');
        o.value = a;
        o.textContent = a;
        csActivity.appendChild(o);
      });
      ADCO_CATALOGS.activityTypes.forEach((t) => {
        const o = document.createElement('option');
        o.value = t;
        o.textContent = t;
        csType.appendChild(o);
      });
    }

    toggleCsBtn.addEventListener('click', () => {
      const isVisible = customSearchPanel.style.display === 'block';
      customSearchPanel.style.display = isVisible ? 'none' : 'block';
      toggleCsBtn.classList.toggle('active', !isVisible);
    });

    csApplyBtn.addEventListener('click', () => {
      customSearchActive = true;
      renderList();
      showToast('تم تطبيق الفلترة المخصصة', 'success');
    });

    csResetBtn.addEventListener('click', () => {
      csClient.value = 'ALL';
      csBrand.value = 'ALL';
      csActivity.value = 'ALL';
      csType.value = 'ALL';
      csCoord.value = '';
      csMinScore.value = '0';
      customSearchActive = false;
      renderList();
      showToast('تمت إعادة ضبط الفلاتر المخصصة', 'info');
    });

    function updateEvalTotal() {
      const s1 = Math.min(40, Math.max(0, Number(inputNewAct.value) || 0));
      const s2 = Math.min(20, Math.max(0, Number(inputQuality.value) || 0));
      const s3 = Math.min(25, Math.max(0, Number(inputContinuity.value) || 0));
      const s4 = Math.min(15, Math.max(0, Number(inputDocs.value) || 0));
      const total = Math.min(100, Math.round(s1 + s2 + s3 + s4));
      evalTotalBadge.textContent = `${total} / 100 نقطة`;
      if (total >= 80) {
        evalTotalBadge.className = 'badge badge-success';
      } else if (total >= 60) {
        evalTotalBadge.className = 'badge badge-warning';
      } else {
        evalTotalBadge.className = 'badge badge-danger';
      }
      const headerBadge = document.getElementById('eval-live-total-badge-header');
      if (headerBadge) {
        headerBadge.textContent = `${total} / 100 نقطة`;
        headerBadge.className = evalTotalBadge.className;
      }
    }

    [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((el) => {
      el.addEventListener('input', updateEvalTotal);
    });

    document.getElementById('close-review-modal').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    document.getElementById('close-audit-modal').addEventListener('click', () => {
      auditModal.classList.remove('active');
    });
    auditModal.addEventListener('click', (e) => {
      if (e.target === auditModal) auditModal.classList.remove('active');
    });

    document.getElementById('close-lightbox-btn').addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });

    function openSupervisorLightbox(photoUrl, title, timestamp, uploader) {
      document.getElementById('lb-image').src = photoUrl;
      document.getElementById('lb-round-title').textContent = title || 'معاينة الصورة الميدانية';
      document.getElementById('lb-timestamp').textContent = timestamp || '';
      document.getElementById('lb-uploader').textContent = uploader || 'المنسق الميداني';
      lightboxModal.classList.add('active');
    }

    const modalCtx = { ActivityManager, SupervisorEngine, ADCO_CATALOGS, modal, auditModal, roundSelect, inputNewAct, inputQuality, inputContinuity, inputDocs, updateEvalTotal, openSupervisorLightbox, renderActivityAuditModal: (a) => renderActivityAuditModal(a), spParentClientSelect, spBranchSelect, csClient, csBrand, csActivity, csType, csCoord, csMinScore, csCountBadge, getCurrentFilter: () => statusFilter, getSelectedBranchKey: () => selectedBranchKey, getCustomSearchActive: () => customSearchActive, getUser: () => user, MasterBranchCard, renderSupervisorBranchCards: (a) => renderSupervisorBranchCards(a), showToast, refreshIcons: global.refreshIcons };
    renderSupervisorBranchCards = global.SupervisorBranches.create(modalCtx);
    renderActivityAuditModal = global.SupervisorAuditModal.create(modalCtx);
    global.SupervisorReviewModal.create(modalCtx);
    renderList = global.SupervisorFeed.create(modalCtx);
    document.getElementById('review-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('rev-act-id').value;
      const roundNum = Number(roundSelect.value) || 1;
      const status = document.getElementById('rev-status').value;
      const notes = document.getElementById('rev-notes').value;

      const breakdown = {
        newActivity: Number(inputNewAct.value) || 0,
        executionQuality: Number(inputQuality.value) || 0,
        continuity: Number(inputContinuity.value) || 0,
        documentation: Number(inputDocs.value) || 0
      };
      // Item 9: The server computes the total from the four pillar scores; no client-side rawScore is sent
      const newActivityDate = document.getElementById('rev-activity-date') ? document.getElementById('rev-activity-date').value : undefined;

      try {
        const res = await SupervisorEngine.reviewActivity(id, status, null, notes, roundNum, breakdown, user, newActivityDate);
        modal.classList.remove('active');
        document.body.style.overflow = '';
        showToast(`تم التحديث بنجاح! ${res.ratingStats.badgeText}`, 'success');
        renderList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    renderList();
})(typeof window !== 'undefined' ? window : globalThis);
