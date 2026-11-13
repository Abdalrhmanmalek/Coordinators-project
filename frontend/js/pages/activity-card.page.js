/**
 * ADCO Field Operations System - activity-card.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const user = AuthManager.checkAuthGuard();
    try {
      if (typeof AppRouter !== 'undefined' && typeof AppRouter.init === 'function') {
        AppRouter.init();
      }
    } catch (err) {
      console.warn('Router init handled gracefully:', err);
    }

    // 3-Tier Scoped Comboboxes (Coordinator vs Coordinator Supervisor vs Coordination Manager)
    const isCoordSup = user && user.role === 'coordinator_supervisor';
    const isCoord = user && user.role === 'coordinator';

    let defaultClient = ADCO_CATALOGS.clients[0];
    let defaultBranch = ADCO_CATALOGS.branches[0];
    let clientOptions = ADCO_CATALOGS.clients;
    let branchOptions = ADCO_CATALOGS.branches;

    if (isCoordSup) {
      defaultClient = user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)';
      // Pre-locked client; any branch belonging to that client
      clientOptions = [defaultClient];
      branchOptions = ActivityManager.getBranchesForClient ? ActivityManager.getBranchesForClient(defaultClient) : [
        'فرع سموحة - الإسكندرية',
        'فرع لوران - الكورنيش',
        'فرع المنتزه - شيراتون',
        'فرع ميامي - جمال عبد الناصر',
        'فرع محرم بك - قناة السويس'
      ];
      defaultBranch = branchOptions[0] || ADCO_CATALOGS.branches[0];
    } else if (isCoord) {
      if (user.assignedClientName) defaultClient = user.assignedClientName;
      if (user.assignedBranchName) defaultBranch = user.assignedBranchName;
      clientOptions = [defaultClient];
      branchOptions = [defaultBranch];
    }

    // Read-Only Database-Bound Supplying Branch (فرع الشركة المورد للبضاعة)
    const coordBranchMount = document.getElementById('combo-coord-branch');
    const supplyingBranchDbBadge = document.getElementById('supplying-branch-db-status');
    const initialSupplyingBranch = (ActivityManager.getSupplyingBranchSync
      ? ActivityManager.getSupplyingBranchSync(defaultClient, defaultBranch)
      : ADCO_CATALOGS.coordinatorBranches[0]) || 'الإسكندرية - قطاع وسط';

    if (coordBranchMount) {
      coordBranchMount.innerHTML = `
        <div class="supplying-branch-readonly-wrap is-bound" id="supplying-branch-readonly-wrap" title="حقل مرتبط تلقائياً بقاعدة البيانات بناءً على العميل وفرع العميل (غير قابل للتعديل اليدوي)">
          <span class="supplying-branch-readonly-icon">
            <i data-lucide="building-2" class="ui-icon ui-icon-sm"></i>
          </span>
          <input
            type="text"
            id="f-supplying-branch-readonly"
            class="supplying-branch-readonly-input"
            value="${initialSupplyingBranch}"
            readonly
            aria-readonly="true"
            tabindex="-1"
          />
          <span class="supplying-branch-lock-pill" title="مقفل للقراءة فقط - مرتبط بقاعدة البيانات">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>مقفل</span>
          </span>
        </div>
      `;
    }

    const coordBranchCombo = {
      getValue: () => {
        const el = document.getElementById('f-supplying-branch-readonly');
        return el ? el.value.trim() : initialSupplyingBranch;
      },
      setValue: (val) => {
        const el = document.getElementById('f-supplying-branch-readonly');
        if (el) el.value = val || '';
      }
    };

    async function syncSupplyingBranchFromDatabase(selectedClient, selectedBranch) {
      const wrapEl = document.getElementById('supplying-branch-readonly-wrap');
      const inputEl = document.getElementById('f-supplying-branch-readonly');
      if (!inputEl) return;

      const cVal = (selectedClient !== undefined ? selectedClient : (clientCombo ? clientCombo.getValue() : defaultClient)) || '';
      const bVal = (selectedBranch !== undefined ? selectedBranch : (branchCombo ? branchCombo.getValue() : defaultBranch)) || '';

      if (supplyingBranchDbBadge) {
        supplyingBranchDbBadge.classList.add('is-fetching');
        supplyingBranchDbBadge.innerHTML = `
          <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
          <span>جاري الجلب...</span>
        `;
      }

      try {
        const resolvedSupplyBranch = ActivityManager.fetchSupplyingBranch
          ? await ActivityManager.fetchSupplyingBranch(cVal, bVal)
          : (ActivityManager.getSupplyingBranchSync ? ActivityManager.getSupplyingBranchSync(cVal, bVal) : initialSupplyingBranch);

        coordBranchCombo.setValue(resolvedSupplyBranch);
        if (wrapEl) wrapEl.classList.add('is-bound');
        if (supplyingBranchDbBadge) {
          supplyingBranchDbBadge.classList.remove('is-fetching');
          supplyingBranchDbBadge.innerHTML = `
            <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
            <span>تلقائي</span>
          `;
        }
      } catch (_) {
        const fallback = ActivityManager.getSupplyingBranchSync
          ? ActivityManager.getSupplyingBranchSync(cVal, bVal)
          : initialSupplyingBranch;
        coordBranchCombo.setValue(fallback);
        if (supplyingBranchDbBadge) {
          supplyingBranchDbBadge.classList.remove('is-fetching');
          supplyingBranchDbBadge.innerHTML = `
            <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
            <span>تلقائي</span>
          `;
        }
      }
    }

    const clientCombo = createSearchableCombobox({
      mountId: 'combo-client',
      options: clientOptions,
      placeholder: 'ابحث عن العميل (مثال: فتح الله، زهران)...',
      defaultValue: defaultClient,
      allowCustomText: !isCoordSup && !isCoord,
      onSelect: (newClientVal) => {
        syncSupplyingBranchFromDatabase(newClientVal, branchCombo ? branchCombo.getValue() : defaultBranch);
      }
    });

    const branchCombo = createSearchableCombobox({
      mountId: 'combo-branch',
      options: branchOptions,
      placeholder: 'ابحث عن الفرع (مثال: سموحة، لوران)...',
      defaultValue: defaultBranch,
      allowCustomText: !isCoord,
      onSelect: (newBranchVal) => {
        syncSupplyingBranchFromDatabase(clientCombo ? clientCombo.getValue() : defaultClient, newBranchVal);
        if (currentDeviceLocation && typeof requestDeviceLocation === 'function') {
          requestDeviceLocation(newBranchVal).catch(() => {});
        }
      }
    });

    // Also bind input/change events on client & branch inputs for custom text entry
    const clientInputEl = document.querySelector('#combo-client .combobox-input');
    const branchInputEl = document.querySelector('#combo-branch .combobox-input');
    if (clientInputEl) {
      clientInputEl.addEventListener('change', () => {
        syncSupplyingBranchFromDatabase(clientCombo.getValue(), branchCombo.getValue());
      });
    }
    if (branchInputEl) {
      branchInputEl.addEventListener('change', () => {
        syncSupplyingBranchFromDatabase(clientCombo.getValue(), branchCombo.getValue());
      });
    }

    // Trigger initial database sync on form load
    syncSupplyingBranchFromDatabase(defaultClient, defaultBranch);

        const magGroup = document.getElementById('magazine-date-group');
    const magStartInput = document.getElementById('f-magazine-start-date');
    const magEndInput = document.getElementById('f-magazine-end-date');

    function handleActivitySelection(val) {
      const isMagazine = (val || '').trim() === 'فرشة مجلة';
      if (magGroup) magGroup.style.display = isMagazine ? 'block' : 'none';
      if (magStartInput) {
        magStartInput.required = isMagazine;
        if (!isMagazine) magStartInput.value = '';
      }
      if (magEndInput) {
        magEndInput.required = isMagazine;
        if (!isMagazine) magEndInput.value = '';
      }
    }

    const activityCombo = createSearchableCombobox({
      mountId: 'combo-activity',
      options: ADCO_CATALOGS.activities,
      placeholder: 'اختر النشاط (عقد، فرشة مجلة، إضافي...)...',
      defaultValue: ADCO_CATALOGS.activities[0],
      allowCustomText: false,
      onSelect: handleActivitySelection
    });

    const activityTypeCombo = createSearchableCombobox({
      mountId: 'combo-activity-type',
      options: ADCO_CATALOGS.activityTypes,
      placeholder: 'اختر نوع النشاط (جندولة، دريس اب، ستاند...)...',
      defaultValue: ADCO_CATALOGS.activityTypes[0],
      allowCustomText: false
    });

    const countSelect = document.getElementById('f-activity-count');
    const countDecBtn = document.getElementById('count-dec-btn');
    const countIncBtn = document.getElementById('count-inc-btn');
    if (countDecBtn && countSelect) {
      countDecBtn.addEventListener('click', () => {
        const current = Number(countSelect.value) || 1;
        if (current > 1) countSelect.value = String(current - 1);
      });
    }
    if (countIncBtn && countSelect) {
      countIncBtn.addEventListener('click', () => {
        const current = Number(countSelect.value) || 1;
        if (current < 10) countSelect.value = String(current + 1);
      });
    }

        // --- 4-Level Product Picker & Brand Share Manager ---
    const shareBadgeEl = document.getElementById('live-brand-share-badge');
    const selectedProductsListEl = document.getElementById('selected-products-list');
    const noProductsPlaceholder = document.getElementById('no-products-placeholder');

    // State of selected products: [{ brand, mainGroup, subGroup, sku }]
    let selectedProducts = [
      {
        brand: 'فلفيتا',
        mainGroup: 'معطرات الأقمشة',
        subGroup: 'معطر مركز',
        sku: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر'
      },
      {
        brand: 'فييا',
        mainGroup: 'سائل غسيل الأطباق',
        subGroup: 'فييا مركز بالليمون',
        sku: 'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر'
      }
    ];

    let renderActivityDetailView = () => {};
    let getDeviceLocation = () => null;
    let requestDeviceLocation = async () => null;

    // Requirement 1: Initialize activity date with current Egypt time
    const initialActDateInput = document.getElementById('f-activity-date');
    if (initialActDateInput && !initialActDateInput.value) {
      initialActDateInput.value = getEgyptDateTimeLocalString();
    }

    const params = new URLSearchParams(window.location.search);
    const activityId = params.get('id');

    const timelineModal = document.getElementById('timeline-modal');
    const lightboxModal = document.getElementById('photo-lightbox');
    const closureModal = document.getElementById('closure-request-modal');
    const closeClosureBtn = document.getElementById('close-closure-modal');
    const cancelClosureBtn = document.getElementById('cancel-closure-modal-btn');
    const closureForm = document.getElementById('form-closure-request');

    const ctx = {
      ADCO_CATALOGS, ActivityManager, AuthManager, CameraCompressor, user,
      timelineModal, lightboxModal, closureModal, closeClosureBtn, cancelClosureBtn, closureForm,
      getSelectedProducts: () => selectedProducts,
      setSelectedProducts: (arr) => { selectedProducts = arr; },
      getStagedPhotos: () => stagedPhotos,
      setStagedPhotos: (arr) => { stagedPhotos = arr; },
      getCurrentActivityId: () => activityId,
      getBranchValue: () => (branchInput ? branchInput.value : ''),
      getDeviceLocation: () => getDeviceLocation(),
      requestDeviceLocation: (b) => requestDeviceLocation(b),
      renderActivityDetailView: (id) => renderActivityDetailView(id),
      formatDateTime, formatTwoWordName, renderStatusBadge, showToast, refreshIcons: global.refreshIcons
    };
    const prodApi = global.ActivityCardProducts.init(ctx);
    prodApi.renderSelectedProducts();
    const modalsApi = global.ActivityCardModals.init(ctx);
    ctx.openLightbox = modalsApi.openLightbox;
    ctx.renderTimelineModal = modalsApi.renderTimelineModal;
    renderActivityDetailView = global.ActivityCardDetailView.create(ctx);
    const gpsApi = global.ActivityCardGpsCamera.init(ctx);
    getDeviceLocation = gpsApi.getDeviceLocation;
    requestDeviceLocation = gpsApi.requestDeviceLocation;
    if (activityId) {
      renderActivityDetailView(activityId);
      if (params.get('action') === 'followup') {
        setTimeout(() => {
          const followupInput = document.getElementById('followup-camera-input');
          if (followupInput) {
            followupInput.value = '';
            followupInput.click();
            if (typeof showToast === 'function') {
              showToast('يرجى التقاط أو اختيار صورة المتابعة الجديدة للنشاط', 'info');
            }
          }
        }, 450);
      }
    } else {
      const detailSec = document.getElementById('detail-view-section');
      const createSec = document.getElementById('create-form-section');
      if (detailSec) detailSec.style.display = 'none';
      if (createSec) createSec.style.display = 'block';
    }

    global.ActivityCardSubmit.init(ctx);
})(typeof window !== 'undefined' ? window : globalThis);