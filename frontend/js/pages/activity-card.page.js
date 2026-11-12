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
            <img src="../assets/icons/building-2.svg" class="ui-icon ui-icon-sm" alt="" />
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
          <img src="../assets/icons/clock.svg" class="ui-icon ui-icon-xs" alt="" />
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
            <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
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
            <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
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

    function recalculateBrandShare() {
      const distinctBrands = [...new Set(selectedProducts.map((p) => p.brand).filter(Boolean))];
      const n = distinctBrands.length;
      if (n === 0) {
        shareBadgeEl.textContent = 'أضف منتجاً واحداً على الأقل';
        shareBadgeEl.className = 'badge badge-warning';
        return;
      }
      const share = (1 / n).toFixed(2);
      const pct = Math.round((1 / n) * 100);
      shareBadgeEl.className = 'badge badge-mint';
      shareBadgeEl.textContent = `حصة البراند: ${share} (${pct}%) | ${n} براند (${selectedProducts.length} صنف)`;
    }

    function renderSelectedProducts() {
      if (!selectedProductsListEl) return;
      if (selectedProducts.length === 0) {
        selectedProductsListEl.innerHTML = '';
        if (noProductsPlaceholder) noProductsPlaceholder.style.display = 'block';
        recalculateBrandShare();
        return;
      }
      if (noProductsPlaceholder) noProductsPlaceholder.style.display = 'none';

      selectedProductsListEl.innerHTML = selectedProducts
        .map((p, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--adco-gray-200); border-radius: var(--radius-sm); padding: 10px 14px; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="badge badge-mint" style="font-weight: 700;">${p.brand}</span>
                <span style="font-size: 0.76rem; color: var(--adco-gray-600); background: var(--adco-gray-100); padding: 2px 8px; border-radius: var(--radius-full);">${p.mainGroup} &rsaquo; ${p.subGroup}</span>
              </div>
              <strong style="font-size: 0.88rem; color: var(--adco-green-deep);">${p.sku}</strong>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="removeProductItem(${index})" style="padding: 6px 10px; color: #dc2626; border-color: #fca5a5; background: #fef2f2; flex-shrink: 0; white-space: nowrap;" title="حذف هذا الصنف">
              <img src="../assets/icons/circle-x.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>حذف</span>
            </button>
          </div>
        `)
        .join('');

      recalculateBrandShare();
    }

    window.removeProductItem = function(index) {
      selectedProducts.splice(index, 1);
      renderSelectedProducts();
    };

    // --- 4-Level Cascading Product Picker with Full Dummy Data ---
    const prodModal = document.getElementById('product-picker-modal');
    const openProdModalBtn = document.getElementById('btn-open-product-modal');
    const closeProdModalBtn = document.getElementById('close-product-modal-btn');
    const cancelProdModalBtn = document.getElementById('btn-cancel-product-modal');
    const confirmAddProdBtn = document.getElementById('btn-confirm-add-product');

    const pickerBrand = document.getElementById('picker-brand');
    const pickerMain = document.getElementById('picker-main-group');
    const pickerSub = document.getElementById('picker-sub-group');
    const pickerSku = document.getElementById('picker-sku');

    const fullHierarchy = {
      'جلاسي': {
        'منظفات الزجاج والأسطح': {
          'ملمع زجاج ومرايا': [
            'جلاسي ملمع زجاج ومرايا بالبخاخ 600 مل',
            'جلاسي ملمع زجاج مضاد للضباب 750 مل',
            'جلاسي بخاخ تلميع كريستال وأسطح 500 مل'
          ],
          'منظف أسطح متعدد الاستخدام': [
            'جلاسي منظف أسطح ومكاتب برائحة الليمون 750 مل',
            'جلاسي ملمع ستانلس وأخشاب 600 مل'
          ]
        }
      },
      'ديفا': {
        'العناية الشخصية والجمال': {
          'شاور جل وصابون سائل': [
            'ديفا شاور جل برائحة التوت البري 500 مل',
            'ديفا صابون سائل لليدين باللافندر 450 مل',
            'ديفا شاور جل بالورد والمسك الأبيض 750 مل'
          ],
          'شامبو وبلسم العناية بالشعر': [
            'ديفا شامبو بزيت الأرجان والكيراتين 400 مل',
            'ديفا بلسم مرطب للشعر الجاف 400 مل'
          ]
        }
      },
      'سبيد': {
        'مبيدات ومنتجات حماية المنزل': {
          'سبيد إيروسول': [
            'سبيد مبيد حشرات طائرة وزاحفة 400 مل',
            'سبيد بدون رائحة حماية مضاعفة 600 مل',
            'سبيد مبيد حشرات برائحة اللافندر 500 مل'
          ],
          'سبيد حماية مركزة': [
            'سبيد مبيد للصراصير والنمل مفعول ممتد 400 مل',
            'سبيد سائل طارد للناموس والحشرات 300 مل'
          ]
        }
      },
      'فلفيتا': {
        'معطرات الأقمشة': {
          'معطر مركز': [
            'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
            'فلفيتا معطر أقمشة مركز لافندر 1 لتر',
            'فلفيتا معطر أقمشة مركز عبير الشرق 1 لتر',
            'فلفيتا معطر أقمشة مركز مسك أبيض 1 لتر'
          ],
          'معطر عادي': [
            'فلفيتا معطر أقمشة رقيق نسيم البحر 2 لتر',
            'فلفيتا معطر أقمشة رقيق ياسمين 2 لتر',
            'فلفيتا معطر أقمشة رقيق بينك روز 3 لتر'
          ]
        },
        'منظفات الملابس': {
          'جل غسيل أوتوماتيك': [
            'فلفيتا جل غسيل أوتوماتيك وايت باور 2.5 لتر',
            'فلفيتا جل غسيل أوتوماتيك حماية الألوان 2.5 لتر',
            'فلفيتا جل غسيل أوتوماتيك نسيم الشرق 3 لتر'
          ]
        }
      },
      'فما': {
        'مساحيق ومنظفات الغسيل': {
          'مسحوق غسيل فما أوتوماتيك': [
            'فما مسحوق غسيل أوتوماتيك 3 كجم',
            'فما مسحوق غسيل أوتوماتيك باللافندر 4 كجم',
            'فما مسحوق غسيل أوتوماتيك توفير عائلي 6 كجم'
          ],
          'مسحوق غسيل فما يدوي': [
            'فما مسحوق غسيل يدوي رغوة وفيرة 1.5 كجم',
            'فما مسحوق غسيل يدوي نسيم الربيع 800 جم'
          ]
        }
      },
      'فييا': {
        'سائل غسيل الأطباق': {
          'فييا مركز بالليمون': [
            'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
            'فييا سائل غسيل أطباق بالليمون المركز 2.5 لتر عرض التوفير',
            'فييا سائل غسيل أطباق بالليمون والنعناع 650 مل'
          ],
          'فييا بالتفاح والخل': [
            'فييا سائل غسيل أطباق بالتفاح الأخضر 750 مل',
            'فييا سائل غسيل أطباق بقوة الخل لإزالة الدهون 1 لتر'
          ]
        }
      },
      'كلوريل': {
        'مبيضات ومطهرات ملابس': {
          'كلوريل أبيض ناصع': [
            'كلوريل مبيض ومطهر ملابس 1 لتر',
            'كلوريل مبيض ملابس عبوة التوفير 2 لتر',
            'كلوريل مبيض ومطهر برائحة الصنوبر 1 لتر'
          ],
          'كلوريل جل للألوان': [
            'كلوريل جل حماية الألوان 950 مل',
            'كلوريل جل للألوان برائحة الزهور 1.8 لتر'
          ]
        }
      },
      'ماكسيل ماجيك': {
        'منظفات ومطهرات متعددة الأغراض': {
          'ماكسيل ماجيك باور للدهون': [
            'ماكسيل ماجيك منظف أفران ودهون صعبة 500 مل',
            'ماكسيل ماجيك مذيب شحوم ودهون المطبخ 750 مل'
          ],
          'ماكسيل ماجيك مطهر أرضيات وحمامات': [
            'ماكسيل ماجيك مطهر أرضيات وحمامات 1 لتر',
            'ماكسيل ماجيك جل منظف ومطهر تواليت 750 مل',
            'ماكسيل ماجيك مطهر برائحة اللافندر 2 لتر'
          ]
        }
      }
    };

    const activeHierarchy = (window.ADCO_CATALOGS && window.ADCO_CATALOGS.productHierarchy) || fullHierarchy;

    function syncCascade(chosenBrand, chosenMain, chosenSub, chosenSku) {
      const bEl = document.getElementById('picker-brand');
      const mEl = document.getElementById('picker-main-group');
      const sEl = document.getElementById('picker-sub-group');
      const kEl = document.getElementById('picker-sku');
      const btn = document.getElementById('btn-confirm-add-product');

      if (!bEl || !mEl || !sEl || !kEl) return;

      const brandsList = Object.keys(activeHierarchy);
      const b = (chosenBrand && brandsList.includes(chosenBrand)) ? chosenBrand : (bEl.value || brandsList[0]);

      // 1. Populate Brand
      bEl.innerHTML = brandsList.map(item => `<option value="${item}" ${item === b ? 'selected' : ''}>${item}</option>`).join('');

      // 2. Populate Main Group
      const brandData = activeHierarchy[b] || {};
      const mainGroups = Object.keys(brandData);
      const mg = (chosenMain && mainGroups.includes(chosenMain)) ? chosenMain : (mainGroups[0] || 'عام');
      mEl.disabled = false;
      mEl.innerHTML = mainGroups.map(item => `<option value="${item}" ${item === mg ? 'selected' : ''}>${item}</option>`).join('');

      // 3. Populate Sub Group
      const subData = brandData[mg] || {};
      const subGroups = Object.keys(subData);
      const sg = (chosenSub && subGroups.includes(chosenSub)) ? chosenSub : (subGroups[0] || 'افتراضي');
      sEl.disabled = false;
      sEl.innerHTML = subGroups.map(item => `<option value="${item}" ${item === sg ? 'selected' : ''}>${item}</option>`).join('');

      // 4. Populate SKU / Item
      const itemsList = subData[sg] || [`${b} - عبوة مميزة 1 لتر`];
      const sk = (chosenSku && itemsList.includes(chosenSku)) ? chosenSku : (itemsList[0] || '');
      kEl.disabled = false;
      kEl.innerHTML = itemsList.map(item => `<option value="${item}" ${item === sk ? 'selected' : ''}>${item}</option>`).join('');

      if (btn) btn.disabled = !sk;
    }

    window.syncCascade = syncCascade;

    window.openProductModal = function() {
      const modal = document.getElementById('product-picker-modal');
      if (!modal) return;
      modal.classList.remove('is-hidden');
      modal.classList.add('active');
      modal.style.display = 'flex';
      const bEl = document.getElementById('picker-brand');
      syncCascade(bEl && bEl.value ? bEl.value : 'فلفيتا');
    };

    window.closeProductModal = function() {
      const modal = document.getElementById('product-picker-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.classList.add('is-hidden');
        modal.style.display = 'none';
      }
    };

    // Explicitly wire buttons to guarantee click interaction
    if (openProdModalBtn) {
      openProdModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openProductModal();
      });
    }

    if (closeProdModalBtn) {
      closeProdModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeProductModal();
      });
    }

    if (cancelProdModalBtn) {
      cancelProdModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeProductModal();
      });
    }

    if (confirmAddProdBtn) {
      confirmAddProdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.confirmAddProduct();
      });
    }

    if (prodModal) {
      prodModal.addEventListener('click', (e) => {
        if (e.target === prodModal) window.closeProductModal();
      });
    }

    if (timelineModal) {
      timelineModal.addEventListener('click', (e) => {
        if (e.target === timelineModal) timelineModal.classList.remove('active');
      });
    }

    if (closureModal) {
      closureModal.addEventListener('click', (e) => {
        if (e.target === closureModal) closureModal.classList.remove('active');
      });
    }

    // Keyboard ESC listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.closeProductModal();
    });

    // Initial population so lists are NEVER empty
    setTimeout(() => {
      syncCascade('فلفيتا');
    }, 50);

    window.confirmAddProduct = function() {
      const bEl = document.getElementById('picker-brand');
      const mEl = document.getElementById('picker-main-group');
      const sEl = document.getElementById('picker-sub-group');
      const kEl = document.getElementById('picker-sku');

      const brand = bEl ? bEl.value : '';
      const mainGroup = mEl ? mEl.value : '';
      const subGroup = sEl ? sEl.value : '';
      const sku = kEl ? kEl.value : '';

      if (!brand || !mainGroup || !subGroup || !sku) {
        return showToast('يرجى اختيار جميع مستويات المنتج', 'warning');
      }

      selectedProducts.push({ brand, mainGroup, subGroup, sku });
      renderSelectedProducts();
      window.closeProductModal();
      showToast(`تمت إضافة صنف ${sku} بنجاح`, 'success');
    };

    // Modal listeners
    const modalEl = document.getElementById('product-picker-modal');
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) window.closeProductModal();
      });
    }

    const brandSelectEl = document.getElementById('picker-brand');
    const mainSelectEl = document.getElementById('picker-main-group');
    const subSelectEl = document.getElementById('picker-sub-group');
    const skuSelectEl = document.getElementById('picker-sku');

    if (brandSelectEl) brandSelectEl.addEventListener('change', () => syncCascade(brandSelectEl.value));
    if (mainSelectEl) mainSelectEl.addEventListener('change', () => syncCascade(brandSelectEl.value, mainSelectEl.value));
    if (subSelectEl) subSelectEl.addEventListener('change', () => syncCascade(brandSelectEl.value, mainSelectEl.value, subSelectEl.value));
    if (skuSelectEl) skuSelectEl.addEventListener('change', () => {
      const btn = document.getElementById('btn-confirm-add-product');
      if (btn) btn.disabled = !skuSelectEl.value;
    });

    renderSelectedProducts();

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

    document.getElementById('close-timeline-modal').addEventListener('click', () => timelineModal.classList.remove('active'));
    document.getElementById('close-lightbox-btn').addEventListener('click', () => lightboxModal.classList.remove('active'));
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });

    if (closeClosureBtn) closeClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));
    if (cancelClosureBtn) cancelClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));
    if (closureModal) {
      closureModal.addEventListener('click', (e) => {
        if (e.target === closureModal) closureModal.classList.remove('active');
      });
    }

    // Toggle radio styling for closure reasons
    const radioReasonTime = document.getElementById('card-reason-time');
    const radioReasonClient = document.getElementById('card-reason-client');
    document.querySelectorAll('input[name="closureReason"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.value === 'انتهاء المدة') {
          if (radioReasonTime) {
            radioReasonTime.style.borderColor = 'var(--adco-green-main)';
            radioReasonTime.style.background = '#f0fdf4';
          }
          if (radioReasonClient) {
            radioReasonClient.style.borderColor = '#cbd5e1';
            radioReasonClient.style.background = '#ffffff';
          }
        } else {
          if (radioReasonClient) {
            radioReasonClient.style.borderColor = 'var(--adco-green-main)';
            radioReasonClient.style.background = '#f0fdf4';
          }
          if (radioReasonTime) {
            radioReasonTime.style.borderColor = '#cbd5e1';
            radioReasonTime.style.background = '#ffffff';
          }
        }
      });
    });

    function openLightbox(photoObj, sessionObj) {
      const isSupervisor = user && user.role === 'supervisor';
      if (!isSupervisor) {
        showToast('معاينة وتكبير الصور الأصلية مقتصرة ومخصصة للمشرفين المعتمدين فقط', 'warning');
        return;
      }
      document.getElementById('lb-round-title').textContent = sessionObj.roundTitle;
      document.getElementById('lb-timestamp').textContent = photoObj.capturedAt || sessionObj.timestamp;
      document.getElementById('lb-image').src = photoObj.photoUrl;
      document.getElementById('lb-uploader').textContent = `المنسق: ${sessionObj.uploadedBy} (${sessionObj.uploadedById})`;
      document.getElementById('lb-specs').textContent = `${photoObj.width || 1280}×${photoObj.height || 720} | ${photoObj.sizeKb || 180} KB`;
      lightboxModal.classList.add('active');
    }

    function renderTimelineModal(act) {
      const isSupervisor = user && user.role === 'supervisor';
      const sessions = act.followUpHistory || [];
      const mount = document.getElementById('timeline-sessions-mount');
      mount.innerHTML = sessions
        .map(
          (session, sIdx) => `
          <div class="timeline-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
              <div>
                <strong style="color: var(--adco-green-deep); font-size: 0.95rem;">
                  ${session.roundTitle}
                </strong>
                <div style="font-size: 0.78rem; color: var(--adco-gray-600); margin-top: 2px;">
                  بواسطة: <strong>${session.uploadedBy}</strong> (${session.uploadedById})
                </div>
                ${
                  session.location
                    ? `
                  <div style="font-size: 0.74rem; color: #065f46; display: flex; align-items: center; gap: 4px; margin-top: 3px;">
                    <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                    <span>موقع الهاتف GPS: ${session.location.latitude}&deg;, ${session.location.longitude}&deg;</span>
                  </div>
                `
                    : ''
                }
              </div>
              <div style="text-align: left;">
                <span class="badge badge-mint" dir="ltr" style="font-family: monospace;">
                  ${session.timestamp}
                </span>
                <div style="margin-top: 4px;">
                  ${renderStatusBadge(session.reviewStatus || act.status)}
                </div>
              </div>
            </div>

            <div class="timeline-thumbs-grid">
              ${(session.photos || [])
                .map(
                  (p, pIdx) => `
                <div class="timeline-thumb-item" data-sidx="${sIdx}" data-pidx="${pIdx}">
                  <img src="${p.photoUrl}" alt="${session.roundTitle}" />
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('');

      mount.querySelectorAll('.timeline-thumb-item').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const sIdx = Number(thumb.dataset.sidx);
          const pIdx = Number(thumb.dataset.pidx);
          openLightbox(sessions[sIdx].photos[pIdx], sessions[sIdx]);
        });
      });
    }

    function renderActivityDetailView(id) {
      const act = ActivityManager.getActivityById(id);
      if (!act) {
        if (typeof showToast === 'function') {
          showToast('عذراً، لم يتم العثور على بطاقة النشاط المطلوبة', 'warning');
        }
        return;
      }

      const detailSec = document.getElementById('detail-view-section');
      const createSec = document.getElementById('create-form-section');
      if (detailSec) {
        detailSec.classList.remove('is-hidden');
        detailSec.style.display = 'block';
      }
      if (createSec) {
        createSec.classList.add('is-hidden');
        createSec.style.display = 'none';
      }

      const roundsCount = act.followUpHistory ? act.followUpHistory.length : 1;
      const ratingStats = ActivityManager.computeOverallRating(act);
      const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
      const brandShareVal = (1 / brandCount).toFixed(2);

      const sessions = Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0 
        ? act.followUpHistory 
        : [{
            roundNumber: 1,
            roundTitle: 'التوثيق التأسيسي (جولة 1)',
            timestamp: act.timestamp || new Date().toISOString(),
            uploadedBy: act.coordinatorName || 'المنسق',
            uploadedById: act.coordinatorId || 'ADCO',
            reviewStatus: act.status || 'Under Review',
            sessionScore: act.supervisorScore || null,
            sessionNotes: act.supervisorNotes || '',
            reviewerName: act.reviewerName || 'مدير التسويق',
            reviewedAt: act.reviewedAt || null,
            photos: act.initialPhotos || [{ photoUrl: act.photoUrl, sizeKb: 180, width: 1280, height: 720 }]
          }];

      const reviewsFeedHtml = `
        <div class="reviews-feed-container" id="reviews-feed-section">
          <div class="reviews-feed-header">
            <div>
              <h3 class="reviews-feed-title">
                <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-md" alt="" />
                <span>سجل المراجعات وتوجيهات مدير التسويق (${sessions.length} جولات)</span>
              </h3>
              <p class="reviews-feed-subtitle">
                توجيهات وملاحظات إدارة التسويق المباشرة للمنسق لتحسين ترتيب المعروضات ورفع جودة التنسيق الميداني
              </p>
            </div>
            <span class="badge badge-mint" style="font-weight: 700;">
              ${sessions.length} ${sessions.length === 1 ? 'جولة توثيق' : 'جولات توثيق'}
            </span>
          </div>

          <div class="reviews-feed-list">
            ${sessions.map((s, sIdx) => {
              const isPending = !s.sessionScore && (s.reviewStatus === 'Under Review' || !s.reviewStatus);
              const sReviewer = s.reviewerName || act.reviewerName || 'أ. محمد الديب - مدير التسويق';

              let roundScore100 = null;
              let breakdown = null;
              if (s.scoreBreakdown) {
                breakdown = s.scoreBreakdown;
                roundScore100 = (breakdown.newActivity || 0) + (breakdown.executionQuality || 0) + (breakdown.continuity || 0) + (breakdown.documentation || 0);
              } else if (s.sessionScore !== null && s.sessionScore !== undefined) {
                const rawNum = Number(s.sessionScore);
                roundScore100 = rawNum <= 10 ? Math.round(rawNum * 10) : Math.round(rawNum);
                const r = roundScore100 / 100;
                breakdown = {
                  newActivity: Math.min(40, Math.round(40 * r)),
                  executionQuality: Math.min(20, Math.round(20 * r)),
                  continuity: Math.min(25, Math.round(25 * r)),
                  documentation: Math.min(15, Math.round(15 * r))
                };
              }

              // Active products / SKUs for this round
              const roundProducts = Array.isArray(s.products) && s.products.length > 0 
                ? s.products 
                : (Array.isArray(act.products) && act.products.length > 0 ? act.products : null);
              const roundBrands = Array.isArray(s.brands) && s.brands.length > 0
                ? s.brands
                : (Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['فلفيتا', 'فييا']);
              const roundSkuText = roundProducts 
                ? roundProducts.map((p) => (typeof p === 'object' ? `${p.brand ? p.brand + ' - ' : ''}${p.skuItem || p.sku || ''}` : p)).filter(Boolean).join(' ، ')
                : (act.skuVariant || 'جميع أصناف العرض المعتمدة');

              return `
                <div class="review-round-card">
                  <div class="review-round-top">
                    <div>
                      <div class="review-round-heading">
                        <span style="color: var(--adco-green-main);">#${s.roundNumber || (sIdx + 1)}</span>
                        <span>${s.roundTitle || `متابعة رقم ${sIdx + 1}`}</span>
                      </div>
                      <div class="review-round-meta">
                        <span>تم الرفع بواسطة: <strong>${s.uploadedBy || act.coordinatorName}</strong></span>
                        <span>•</span>
                        <span dir="ltr">${formatDateTime(s.timestamp)}</span>
                      </div>
                      ${s.location ? `
                        <div class="review-round-gps">
                          <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                          <span>موقع الهاتف GPS: ${s.location.latitude}&deg; N, ${s.location.longitude}&deg; E (نطاق معتمد &le; 150م)</span>
                        </div>
                      ` : ''}

                      <!-- Participating Products / SKUs in this round -->
                      <div class="review-round-skus" style="margin-top: 8px; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge badge-mint" style="font-size: 0.72rem; font-weight: 700;">العلامات والأصناف بالجولة:</span>
                        <span style="color: var(--adco-gray-700); font-weight: 600;">${roundBrands.join(' ، ')} &bull; ${roundSkuText}</span>
                      </div>
                    </div>

                    <div style="text-align: left; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                      ${renderStatusBadge(s.reviewStatus || act.status)}
                      ${roundScore100 !== null ? `
                        <span class="badge badge-warning" style="font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">
                          <img src="../assets/icons/star.svg" class="ui-icon ui-icon-xs" alt="" />
                          <span>التقييم: ${roundScore100} / 100</span>
                        </span>
                      ` : `
                        <span class="badge badge-secondary" style="font-size: 0.74rem;">قيد التقييم</span>
                      `}
                    </div>
                  </div>

                  <!-- Photos Gallery for this round -->
                  <div style="margin-top: 10px;">
                    <div style="font-size: 0.75rem; color: var(--adco-gray-600); margin-bottom: 6px; font-weight: 600;">
                      الصور المرفوعة في هذه الجولة (${(s.photos || []).length} صورة — اضغط للتكبير):
                    </div>
                    <div class="timeline-thumbs-grid">
                      ${(s.photos || []).map((p, pIdx) => `
                        <div class="timeline-thumb-item inline-review-thumb" data-sidx="${sIdx}" data-pidx="${pIdx}" title="اضغط لتكبير الصورة">
                          <img src="${p.photoUrl || act.photoUrl}" alt="${s.roundTitle}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';" />
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- 4-Criteria Numerical Evaluation Breakdown (Task 2) -->
                  ${breakdown ? `
                    <div class="round-criteria-box" style="margin-top: 10px; background: #ffffff; border: 1px solid var(--adco-green-border); border-radius: 8px; padding: 10px 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--adco-green-deep); display: flex; align-items: center; gap: 5px;">
                          <img src="../assets/icons/trophy.svg" class="ui-icon ui-icon-xs" alt="" />
                          <span>تقييم مدير التسويق للجولة (المعايير الأربعة الرسمية):</span>
                        </span>
                        <span class="badge badge-success" style="font-size: 0.80rem; font-weight: 800;">${roundScore100} / 100 نقطة</span>
                      </div>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px;">
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>نشاط جديد:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.newActivity} / 40</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>جودة العرض:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.executionQuality} / 20</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>الاستمرارية:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.continuity} / 25</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>التوثيق والدقة:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.documentation} / 15</strong>
                        </div>
                      </div>
                    </div>
                  ` : ''}

                  <!-- Marketing Manager Written Guidance / Feedback Box -->
                  <div class="review-supervisor-bubble ${isPending ? 'is-pending' : ''}">
                    <div class="review-bubble-header">
                      <span class="review-bubble-title">
                        <img src="../assets/icons/${isPending ? 'clock' : 'clipboard-edit'}.svg" class="ui-icon ui-icon-xs" alt="" />
                        <span>${isPending ? 'حالة التقييم والتوجيه:' : 'توجيهات مدير التسويق للمنسق:'}</span>
                      </span>
                      <div class="review-bubble-meta">
                        <span class="feedback-reviewer-name">${sReviewer}</span>
                        ${s.reviewedAt ? `<span dir="ltr">(${formatDateTime(s.reviewedAt)})</span>` : ''}
                      </div>
                    </div>

                    ${isPending ? `
                      <p class="review-bubble-pending-text">
                        هذه الجولة بانتظار فحص واعتماد مدير التسويق. سيتم تحديث التقييم وتوجيهات التحسين فور مراجعتها.
                      </p>
                    ` : `
                      <p class="review-bubble-notes">
                        "${s.sessionNotes || act.supervisorNotes || 'تم فحص وترتيب العرض، والتأكد من مطابقة المعايير الميدانية المعتمدة.'}"
                      </p>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Callout: Add Follow-up Photo (Directly below reviews) -->
          <div class="add-followup-callout">
            <div class="add-followup-callout-inner">
              <div class="add-followup-callout-icon">
                <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-lg" alt="" />
              </div>
              <h4 class="add-followup-callout-title">إضافة متابعة ميدانية جديدة بالصور (متابعة #${roundsCount + 1})</h4>
              <p class="add-followup-callout-desc">
                المنسق المتميز يقوم بتوثيق النشاط بشكل دوري ومستمر لتأكيد استمرارية العرض، ونظافة الستاند، وتوافر جميع الأصناف. كل جولة متابعة جديدة ترفع نقاط تقييمك العام لدى مدير التسويق.
              </p>
              <button type="button" class="btn btn-primary btn-add-followup-cta btn-trigger-followup" id="btn-add-followup-bottom">
                <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-md" alt="" />
                <span>التقاط وإضافة متابعة جديدة (متابعة #${roundsCount + 1})</span>
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('detail-card-mount').innerHTML = `
        <div class="activity-workspace-grid">
          <!-- Right: Metadata & History -->
          <div class="card" style="padding: 24px;">
            <div class="overall-rating-banner">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="../assets/icons/star.svg" class="ui-icon ui-icon-md" alt="" />
                <div>
                  <strong style="font-size: 1rem; display: block;">${ratingStats.badgeText}</strong>
                  <span style="font-size: 0.78rem;">متوسط تقييمات المشرف عبر جولات المتابعة</span>
                </div>
              </div>
              ${renderStatusBadge(act.status)}
            </div>

            <h2 style="margin-bottom: 6px;">${act.client}</h2>
            <div style="font-size: 0.8rem; color: var(--adco-gray-600); margin-bottom: 16px;">كود البطاقة: ${act.id}</div>

            <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm btn-trigger-followup" id="btn-add-followup-top">
                <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>إضافة متابعة بالصور (متابعة #${roundsCount + 1})</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-open-timeline">
                <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>سجل المراجعات والتوجيهات (${roundsCount})</span>
              </button>
            </div>

            <div class="meta-row"><span>الفرع:</span><strong>${act.branch}</strong></div>
            <div class="meta-row"><span>قطاع المنسق:</span><strong>${act.coordinatorBranch || '-'}</strong></div>
            <div class="meta-row"><span>المنسق:</span><strong>${act.coordinatorName} (${act.coordinatorId})</strong></div>
            <div class="meta-row"><span>النشاط:</span><strong>${act.activity || '-'}</strong></div>
            <div class="meta-row"><span>نوع النشاط:</span><strong>${act.activityType || '-'}</strong></div>
            <div class="meta-row"><span>عدد النشاط:</span><strong>${act.activityCount || 1}</strong></div>
            <div class="meta-row"><span>العلامات التجارية (${brandCount}):</span><strong>${(act.brands || []).join(' ، ')}</strong></div>
            <div class="meta-row"><span>المنتج:</span><strong>${act.skuVariant}</strong></div>
            ${act.magazineDate ? `<div class="meta-row"><span>تاريخ إصدار المجلة:</span><strong></strong></div>` : ''}
            <div class="meta-row"><span>تاريخ إنشاء البطاقة:</span><strong dir="ltr">${formatDateTime(act.createdAt || act.timestamp)}</strong></div>
            <div class="meta-row" style="background: #f0fdf4; padding: 6px 10px; border-radius: 6px; border: 1px solid #bbf7d0;">
              <span>تاريخ وتوقيت بدء النشاط:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong dir="ltr" id="detail-start-date-val">${act.activityDateFormatted || (act.activityDate ? formatDateTime(act.activityDate) : formatDateTime(act.timestamp))}</strong>
                ${(user && user.role === 'supervisor') ? `
                  <button type="button" class="btn btn-outline btn-xs" id="btn-edit-act-date" title="تعديل تاريخ بدء النشاط كمشرف" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">
                    تعديل التاريخ
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="meta-row" style="background: ${act.isClosed ? '#f8fafc' : '#f0fdf4'}; padding: 6px 10px; border-radius: 6px; border: 1px solid ${act.isClosed ? '#cbd5e1' : '#86efac'};">
              <span>تاريخ وتوقيت انتهاء النشاط:</span>
              <strong dir="ltr">${act.endDate || (act.closedAt ? formatDateTime(act.closedAt) : '<span class="badge badge-mint" style="font-size:0.75rem;">نشط ومستمر (لم ينتهِ بعد)</span>')}</strong>
            </div>

            <!-- INLINE REVIEWS & MARKETING GUIDANCE SECTION -->
            ${reviewsFeedHtml}

            <!-- Official Evaluation Criteria Breakdown (100 Points) -->
            <div class="card" style="margin-top: 16px; background: #f8fafc; border: 1.5px solid var(--adco-green-border); padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--adco-gray-200); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <strong style="color: var(--adco-green-deep); font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>معايير التقييم الرسمي (إجمالي 100 نقطة)</span>
                </strong>
                <span class="badge badge-success" style="font-size: 0.92rem; font-weight: 800;">
                  ${ratingStats.totalWeightedScore} / 100 نقطة
                </span>
              </div>
              <div class="responsive-form-grid" style="gap: 10px;">
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">الأنشطة الجديدة المعتمدة</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.newActivity.score} / 40</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">جودة التنفيذ</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.executionQuality.score} / 20</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">مدة الاستمرارية المثبتة</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.continuity.score} / 25</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">الالتزام بالتوثيق وصحة البيانات</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.documentation.score} / 15</span>
                </div>
              </div>
            </div>

            <!-- Action: Request Activity Completion or Direct Supervisor Closure -->
            <div class="card" style="margin-top: 18px; background: ${act.isClosed ? '#f0fdf4' : act.closureRequested ? '#fffdf7' : '#f8fafc'}; border: 1.5px solid ${act.isClosed ? '#86efac' : act.closureRequested ? '#f59e0b' : '#cbd5e1'}; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <h4 style="margin: 0; display: flex; align-items: center; gap: 6px; color: ${act.isClosed ? '#166534' : act.closureRequested ? '#92400e' : 'var(--adco-green-deep)'};">
                  <img src="../assets/icons/${act.isClosed ? 'check-circle-2' : act.closureRequested ? 'clock' : 'shield-check'}.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>${act.isClosed ? 'تم إنهاء وتفكيك النشاط' : act.closureRequested ? 'طلب إنهاء النشاط قيد المراجعة' : 'حالة إتمام وتفكيك النشاط'}</span>
                </h4>
                ${
                  act.isClosed
                    ? `<span class="badge badge-success">مكتمل ومغلق</span>`
                    : act.closureRequested
                    ? `<span class="badge badge-warning">بانتظار قرار المشرف</span>`
                    : `<span class="badge badge-mint">النشاط نشط ومستمر</span>`
                }
              </div>

              <p style="font-size: 0.82rem; margin-bottom: 8px;">
                ${
                  act.isClosed
                    ? `تم اعتماد إنهاء النشاط وتفكيك المعروضات وإغلاق دورته الميدانية بنجاح.`
                    : act.closureRequested
                    ? `تم تقديم طلب إنهاء وتفكيك النشاط بتاريخ ${formatDateTime(act.closureRequestedAt || act.timestamp)} وبانتظار اعتماد المشرف.`
                    : (user && user.role === 'supervisor')
                    ? `يمكنك كمشرف إنهاء وتفكيك هذا النشاط فورياً في أي وقت دون الحاجة لطلب مسبق من المنسق.`
                    : `عند انتهاء مدة العرض أو المهرجان أو تفكيك الستاند، يرجى تقديم طلب إنهاء مع تحديد السبب.`
                }
              </p>

              ${
                act.isClosed
                  ? `
                <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; color: #166534; margin-top: 8px;">
                  <div><strong>سبب الإنهاء:</strong> ${act.closureReasonType || 'بقرار إداري مباشر'}</div>
                  ${act.closureSupervisorFeedback ? `<div style="margin-top: 4px; color: #15803d;"><strong>ملاحظة المشرف:</strong> ${act.closureSupervisorFeedback}</div>` : ''}
                  ${act.closedAt ? `<div style="margin-top: 4px; color: #64748b;" dir="ltr">تاريخ الإغلاق: ${formatDateTime(act.closedAt)}</div>` : ''}
                </div>
              `
                  : act.closureRequested
                  ? `
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #92400e; margin-bottom: 12px;">
                  <div><strong>السبب المحدد للإنهاء:</strong> <span class="badge badge-warning" style="font-weight: 700;">${act.closureReasonType || 'انتهاء المدة'}</span></div>
                  ${act.closureNotes && act.closureNotes !== act.closureReasonType ? `<div style="margin-top: 4px; color: #78350f;"><strong>ملاحظات المنسق:</strong> ${act.closureNotes}</div>` : ''}
                </div>
                ${
                  (user && user.role === 'supervisor')
                    ? `
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-primary btn-sm" id="btn-detail-accept-closure">
                      <img src="../assets/icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                      <span>موافقة وإغلاق النشاط</span>
                    </button>
                    <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-reject-closure">
                      <img src="../assets/icons/x-circle.svg" class="ui-icon ui-icon-sm" alt="" />
                      <span>رفض طلب الإنهاء</span>
                    </button>
                  </div>
                `
                    : ''
                }
              `
                  : `
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                  ${
                    (user && user.role === 'supervisor')
                      ? `
                    <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-direct-close" style="width: auto;">
                      <img src="../assets/icons/x-circle.svg" class="ui-icon ui-icon-sm" alt="" />
                      <span>إنهاء النشاط فورياً (قرار المشرف المباشر)</span>
                    </button>
                  `
                      : `
                    <button type="button" class="btn btn-outline btn-sm" id="btn-request-closure" style="width: auto;">
                      <img src="../assets/icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                      <span>طلب انهاء النشاط</span>
                    </button>
                  `
                  }
                </div>
              `
              }
            </div>
          </div>

          <!-- Left: Hero Photo (Restricted to Supervisor), GPS Location & Date/Time (Requirements 1, 2, 6) -->
          <div class="card sticky-panel" style="padding: 24px;">
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0; display: flex; align-items: center; gap: 6px;">
                <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>توثيق العرض الميداني</span>
              </h4>
              <span class="badge badge-mint" style="font-size: 0.72rem;">صورة العرض الميداني المعتمدة</span>
            </div>

            <img src="${act.photoUrl}" alt="${act.client}" class="camera-preview-thumb" id="main-card-hero-img" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.svg';" style="cursor: pointer;" title="اضغط للتكبير والفحص" />
            <div style="font-size: 0.75rem; color: var(--adco-green-dark); margin-top: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>صورة العرض الميداني — اضغط للتكبير والمعاينة</span>
            </div>

            <!-- GPS Location & DateTime Box (Requirement 2) -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 0.82rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--adco-green-deep);">
                  <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>الموقع الجغرافي (GPS):</span>
                </span>
                <a href="https://www.google.com/maps?q=${(act.location || {}).latitude || 31.2156},${(act.location || {}).longitude || 29.9553}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; min-height: 24px;">
                  عرض على الخريطة
                </a>
              </div>
              <div style="color: #0f172a; font-family: monospace; font-size: 0.84rem; direction: ltr; text-align: right; font-weight: 700;">
                ${(act.location || {}).latitude || 31.2156}&deg; N, ${(act.location || {}).longitude || 29.9553}&deg; E ${(act.location || {}).accuracy ? `(&plusmn;${act.location.accuracy}م)` : ''}
              </div>
              <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">
                ${(act.location || {}).address || act.branch || 'الإسكندرية'}
              </div>

              <div style="border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; color: #334155;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span><strong>تاريخ وتوقيت التوثيق:</strong></span>
                </span>
                <span dir="ltr" style="font-family: monospace; font-weight: 700; color: var(--adco-green-deep); font-size: 0.78rem;">${formatDateTime(act.timestamp)}</span>
              </div>
            </div>

            <div style="margin-top: 14px;">
              <h4 style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>ملاحظات المشرف</span>
              </h4>
              <p style="font-size: 0.88rem;">${act.supervisorNotes || 'لا توجد ملاحظات مسجلة حتى الآن.'}</p>
            </div>
          </div>
        </div>
      `;

      const followupInput = document.getElementById('followup-camera-input');
      document.querySelectorAll('.btn-trigger-followup, #btn-add-followup, #btn-add-followup-top, #btn-add-followup-bottom').forEach((btn) => {
        btn.addEventListener('click', () => {
          followupInput.value = '';
          followupInput.click();
        });
      });

      const openTimelineBtn = document.getElementById('btn-open-timeline');
      if (openTimelineBtn) {
        openTimelineBtn.addEventListener('click', () => {
          const revSec = document.getElementById('reviews-feed-section');
          if (revSec) {
            revSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            renderTimelineModal(act);
            timelineModal.classList.add('active');
          }
        });
      }

      // Inline review thumbnails click to open lightbox
      document.querySelectorAll('.inline-review-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const sIdx = Number(thumb.dataset.sidx);
          const pIdx = Number(thumb.dataset.pidx);
          if (sessions[sIdx] && sessions[sIdx].photos && sessions[sIdx].photos[pIdx]) {
            openLightbox(sessions[sIdx].photos[pIdx], sessions[sIdx]);
          }
        });
      });

      const mainHeroImg = document.getElementById('main-card-hero-img');
      if (mainHeroImg) {
        mainHeroImg.addEventListener('click', () => {
          const latestSession = act.followUpHistory ? act.followUpHistory[act.followUpHistory.length - 1] : { roundTitle: 'التوثيق التأسيسي', uploadedBy: act.coordinatorName, uploadedById: act.coordinatorId };
          const latestPhoto = latestSession.photos ? latestSession.photos[0] : { photoUrl: act.photoUrl, photoHash: act.photoHash };
          openLightbox(latestPhoto, latestSession);
        });
      }

      // Coordinator request closure handler
      const closureBtn = document.getElementById('btn-request-closure');
      if (closureBtn) {
        closureBtn.addEventListener('click', () => {
          closureModal.classList.add('active');
        });
      }

      // Supervisor direct closure handler (إنهاء فوري دون انتظار أحد)
      const directCloseBtn = document.getElementById('btn-detail-direct-close');
      if (directCloseBtn) {
        directCloseBtn.addEventListener('click', async () => {
          if (!confirm(`هل تؤكد إنهاء وتفكيك نشاط "${act.client}" فورياً كقرار إشرافي مباشر دون الحاجة لطلب من المنسق؟`)) return;
          const feedback = prompt('ملاحظة وتوجيه المشرف عند الإغلاق المباشر (اختياري):', 'تم إنهاء النشاط وتفكيكه بقرار مباشر من المشرف');
          if (feedback === null) return;
          try {
            await ActivityManager.directCloseActivity(act.id, feedback);
            showToast('تم إنهاء وتفكيك النشاط فورياً بنجاح', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor accept closure request (Requirement 8 guard)
      const acceptClosureBtn = document.getElementById('btn-detail-accept-closure');
      if (acceptClosureBtn) {
        acceptClosureBtn.addEventListener('click', async () => {
          const hasPendingReview =
            act.status === 'Under Review' ||
            (Array.isArray(act.followUpHistory) && act.followUpHistory.some((s) => s.reviewStatus === 'Under Review' || s.sessionScore === null));

          if (hasPendingReview) {
            alert('لا يمكن اعتماد إنهاء النشاط:\n\nتوجد جولات متابعة أو تقييمات قيد المراجعة لم يتم فحصها واعتمادها بعد.\nيرجى مراجعة وتقييم النشاط أولاً قبل قبول إنهائه.');
            return;
          }

          if (!confirm('هل توافق على إنهاء وتفكيك هذا النشاط وإغلاق دورته رسمياً؟')) return;
          try {
            await ActivityManager.processClosureRequest(act.id, 'COMPLETED', 'تمت الموافقة على إنهاء النشاط');
            showToast('تم اعتماد إنهاء النشاط بنجاح', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor reject closure request
      const rejectClosureBtn = document.getElementById('btn-detail-reject-closure');
      if (rejectClosureBtn) {
        rejectClosureBtn.addEventListener('click', async () => {
          const reason = prompt('يرجى كتابة سبب رفض إنهاء النشاط للمنسق:', 'النشاط ما زال سارياً ومطلوب استمرار العرض');
          if (reason === null) return;
          try {
            await ActivityManager.processClosureRequest(act.id, 'REJECTED', reason);
            showToast('تم رفض طلب إنهاء النشاط وإشعار المنسق', 'info');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor edit activity start date anytime (Requirement 1)
      const editDateBtn = document.getElementById('btn-edit-act-date');
      if (editDateBtn) {
        editDateBtn.addEventListener('click', async () => {
          const defaultVal = getEgyptDateTimeLocalString(act.activityDate || act.timestamp || new Date());
          const newDateStr = prompt('تعديل تاريخ وتوقيت بدء النشاط (بتوقيت مصر):\nيرجى إدخال التاريخ بالصيغة: YYYY-MM-DDTHH:mm', defaultVal);
          if (!newDateStr || !newDateStr.trim()) return;
          try {
            await ActivityManager.updateActivityDate(act.id, newDateStr.trim());
            showToast('تم تعديل تاريخ بدء النشاط بنجاح بتوقيت مصر', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }
    }

    // Submit handler for coordinator closure request form with reason
    if (closureForm) {
      closureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const actId = activityId;
        if (!actId) return;
        const selectedReason = closureForm.closureReason ? closureForm.closureReason.value : 'انتهاء المدة';
        const notes = document.getElementById('closure-notes-input').value.trim();
        try {
          await ActivityManager.requestActivityCompletion(actId, selectedReason, notes);
          showToast(`تم إرسال طلب إنهاء النشاط (${selectedReason}) بنجاح للمشرف`, 'success');
          closureModal.classList.remove('active');
          renderActivityDetailView(actId);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    if (activityId) {
      renderActivityDetailView(activityId);

      // Automatic trigger if navigated with ?action=followup (from outside branch card button)
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

    let currentDeviceLocation = null;
    let pendingFollowupBatch = null;
    let pendingFollowupLocation = null;

    const followupVerifyModal = document.getElementById('followup-verify-modal');
    document.getElementById('close-followup-verify-modal').addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      document.getElementById('followup-camera-input').value = '';
    });
    document.getElementById('btn-cancel-followup').addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      document.getElementById('followup-camera-input').value = '';
    });

    // Requirement 3: Strictly ask for location; if denied, reject the photo!
    // Also runs automated Haversine GPS proximity validation against the selected branch (<= 150m)
    async function requestDeviceLocation(targetBranchOverride = null) {
      const telGps = document.getElementById('tel-gps-text');
      const telBox = document.getElementById('compression-telemetry');
      if (telBox) telBox.classList.remove('is-hidden');
      if (telGps) telGps.textContent = 'جاري طلب إذن الموقع الجغرافي (GPS) والتحقق من نطاق الفرع...';

      if (!navigator.geolocation) {
        throw new Error('المتصفح أو الهاتف لا يدعم خدمة الـ GPS، ويلزم توفرها لاعتماد الصور.');
      }

      const activeBranchName =
        targetBranchOverride ||
        (branchCombo && typeof branchCombo.getValue === 'function' ? branchCombo.getValue() : defaultBranch);

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = {
              latitude: Number(pos.coords.latitude.toFixed(5)),
              longitude: Number(pos.coords.longitude.toFixed(5)),
              accuracy: Math.round(pos.coords.accuracy || 10),
              timestamp: formatDateTime(new Date()),
              verified: true
            };

            // Check Haversine proximity against registered branch coordinates
            let proximity = { isValid: true, distanceMeters: 0, maxAllowedMeters: 150 };
            if (ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
              proximity = ActivityManager.validateBranchProximity(activeBranchName, loc, 150);
              loc.distanceFromBranchMeters = proximity.distanceMeters;
              loc.proximityVerified = proximity.isValid;
            }

            currentDeviceLocation = loc;

            if (telGps) {
              if (proximity.isValid) {
                const distBadge =
                  proximity.distanceMeters !== null && proximity.distanceMeters !== undefined
                    ? ` — المسافة عن الفرع: <strong>${proximity.distanceMeters}م</strong> (ضمن النطاق المسموح ${proximity.maxAllowedMeters}م)`
                    : '';
                telGps.innerHTML = `تم التحقق من الموقع GPS بنجاح: <strong>${loc.latitude}&deg; N, ${loc.longitude}&deg; E</strong> (&plusmn;${loc.accuracy}م)${distBadge}`;
                telGps.parentElement.style.background = '#f0fdf4';
                telGps.parentElement.style.borderColor = '#86efac';
              } else {
                telGps.innerHTML = `<strong style="color: #b91c1c;">موقعك الحالي بعيد جداً عن نطاق الفرع المسجل (${proximity.distanceMeters}م &gt; ${proximity.maxAllowedMeters}م)</strong>`;
                telGps.parentElement.style.background = '#fef2f2';
                telGps.parentElement.style.borderColor = '#fca5a5';
              }
            }
            resolve(loc);
          },
          (err) => {
            console.warn('Geolocation denied/error:', err.code, err.message);
            currentDeviceLocation = null;
            if (telGps) {
              telGps.innerHTML = '<strong style="color: #b91c1c;">تم رفض إذن الموقع الجغرافي (Access Denied) — يرجى تفعيل الموقع للمتابعة</strong>';
              telGps.parentElement.style.background = '#fef2f2';
              telGps.parentElement.style.borderColor = '#fca5a5';
            }
            if (err.code === 1 || err.code === err.PERMISSION_DENIED) {
              reject(new Error('تم رفض إذن الوصول للموقع الجغرافي (Access Denied). لنظام أدكو الرقابي، يلزم منح صلاحية الـ GPS للتحقق من تواجدك داخل نطاق الفرع المسجل.'));
            } else {
              reject(new Error('تعذر تحديد إحداثيات الـ GPS بدقة. يرجى تفعيل خدمة الموقع في هاتفك أو متصفحك والمحاولة مجدداً.'));
            }
          },
          { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
        );
      });
    }

    // Automatically capture device GPS coordinates when opening the activity creation form
    if (!activityId && navigator.geolocation) {
      requestDeviceLocation().catch(() => {
        // Handled gracefully in UI telemetry banner; re-prompted upon photo upload or form submission
      });
    }

    // Requirement 1 & 2: Coordinator adds follow-up photo -> verify photo metadata & location -> explicit submit button
    document.getElementById('followup-camera-input').addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activityId) return;

      const currentAct = ActivityManager.getActivityById(activityId);
      const nextRound = (currentAct && currentAct.followUpHistory ? currentAct.followUpHistory.length : 1) + 1;

      try {
        showToast('جاري التحقق من إذن الموقع وفحص بصمة الصورة...', 'info');

        // Requirement 3: Ask for location access; if denied, reject the photo
        const loc = await requestDeviceLocation(currentAct ? currentAct.branch : null);

        // Automated Haversine GPS proximity check against the activity's registered branch
        if (currentAct && ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
          const prox = ActivityManager.validateBranchProximity(currentAct.branch, loc, 150);
          if (!prox.isValid) {
            throw new Error(prox.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
          }
        }

        // Process batch and extract rich EXIF metadata
        const processedBatch = await CameraCompressor.processFilesBatch(files, `Follow-up #${nextRound}`);
        if (!processedBatch || processedBatch.length === 0) {
          throw new Error('فشلت معالجة الصورة.');
        }

        pendingFollowupBatch = processedBatch;
        pendingFollowupLocation = loc;

        const first = processedBatch[0];
        const meta = first.metadata || {};

        // Populate Verification Modal
        document.getElementById('fv-modal-title').textContent = `تأكيد وفحص متابعة رقم ${nextRound} — ${currentAct.client}`;
        document.getElementById('fv-preview-img').src = first.photoUrl;

        const originBadge = document.getElementById('fv-origin-badge');
        originBadge.textContent = meta.originBadge || 'كاميرا مباشرة';
        originBadge.className = `badge ${meta.originBadgeClass || 'badge-success'}`;

        document.getElementById('fv-meta-origin').textContent = meta.originLabel || 'التقاط مباشر بكاميرا الهاتف';
        document.getElementById('fv-meta-taken').textContent = meta.takenAtEgypt || formatDateTime(new Date());
        document.getElementById('fv-meta-device').textContent = meta.deviceModel || 'هاتف محلي';
        document.getElementById('fv-meta-exif-gps').textContent = meta.exifGps ? `${meta.exifGps.latitude}°, ${meta.exifGps.longitude}°` : 'غير متوفر بالصورة (تم اعتماد Live GPS)';

        document.getElementById('fv-loc-coords').textContent = `${loc.latitude}° N, ${loc.longitude}° E`;
        document.getElementById('fv-loc-acc').textContent = `(دقة ±${loc.accuracy}م)`;
        document.getElementById('fv-submit-time').textContent = formatDateTime(new Date());
        document.getElementById('fv-map-link').href = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;

        // Populate optional participating brands checklist (Task 3)
        const brandsChecklist = document.getElementById('fv-brands-checklist');
        const calcShareEl = document.getElementById('fv-calculated-share');
        if (brandsChecklist) {
          const availableBrands = (ADCO_CATALOGS && ADCO_CATALOGS.brands) || ['فلفيتا', 'فييا', 'كلوريل', 'ماكسيل', 'جلاسي', 'ديفا', 'فما'];
          const currentActBrands = Array.isArray(currentAct.brands) ? currentAct.brands : [];
          brandsChecklist.innerHTML = availableBrands.map((b) => {
            const isChecked = currentActBrands.includes(b);
            return `
              <label style="display: flex; align-items: center; gap: 5px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 0.76rem; cursor: pointer;">
                <input type="checkbox" name="fv_brand_item" value="${b}" ${isChecked ? 'checked' : ''} style="accent-color: var(--adco-green-main);" />
                <span>${b}</span>
              </label>
            `;
          }).join('');

          const updateCalcShare = () => {
            const checked = Array.from(brandsChecklist.querySelectorAll('input[name="fv_brand_item"]:checked')).map((cb) => cb.value);
            const count = Math.max(1, checked.length);
            const shareVal = (1 / count).toFixed(2);
            const sharePct = Math.round((1 / count) * 100);
            if (calcShareEl) {
              calcShareEl.textContent = `${shareVal} (${sharePct}%) — إجمالي ${count} علامة مختارة`;
            }
          };
          brandsChecklist.querySelectorAll('input[name="fv_brand_item"]').forEach((cb) => {
            cb.addEventListener('change', updateCalcShare);
          });
          updateCalcShare();
        }

        // Requirement 1: Open verification modal with submit button
        followupVerifyModal.classList.add('active');
      } catch (err) {
        e.target.value = '';
        alert(err.message);
        showToast(err.message, 'error', 5000);
      }
    });

    // Requirement 1: Explicit Submit Button inside Verification Modal
    document.getElementById('btn-confirm-followup-submit').addEventListener('click', async () => {
      if (!pendingFollowupBatch || !pendingFollowupLocation || !activityId) return;
      const btn = document.getElementById('btn-confirm-followup-submit');
      btn.disabled = true;
      btn.innerHTML = `<span>جاري الاعتماد والرفع...</span>`;

      try {
        let updatedProducts = null;
        const brandsChecklist = document.getElementById('fv-brands-checklist');
        if (brandsChecklist) {
          const selectedBrands = Array.from(brandsChecklist.querySelectorAll('input[name="fv_brand_item"]:checked')).map((cb) => cb.value);
          if (selectedBrands.length > 0) {
            updatedProducts = selectedBrands.map((b) => ({ brand: b, skuItem: `منتجات ${b}` }));
          }
        }

        const result = await ActivityManager.addFollowUpPhotos(activityId, pendingFollowupBatch, user, pendingFollowupLocation, updatedProducts);
        followupVerifyModal.classList.remove('active');
        document.getElementById('followup-camera-input').value = '';
        pendingFollowupBatch = null;
        pendingFollowupLocation = null;
        showToast(`تم اعتماد وتأكيد ${result.newSession.roundTitle} بنجاح بتوقيت مصر`, 'success');
        renderActivityDetailView(activityId);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<img src="../assets/icons/check-circle-2.svg" class="ui-icon" alt="" /><span>اعتماد وتأكيد رفع الصورة والموقع</span>`;
      }
    });

    let initialProcessedPhotos = [
      {
        photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
        photoHash: 'a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9',
        sizeKb: 176,
        width: 1280,
        height: 720,
        capturedAt: formatDateTime(new Date()),
        metadata: {
          takenAtEgypt: formatDateTime(new Date()),
          originBadge: 'كاميرا مباشرة',
          originLabel: 'التقاط مباشر بكاميرا الهاتف الميداني',
          originBadgeClass: 'badge-success',
          deviceModel: 'كاميرا الهاتف الميداني المعتمدة',
          exifGps: null
        }
      }
    ];

    const cameraInput = document.getElementById('camera-input');
    const submitActBtn = document.getElementById('submit-activity-btn');

    document.getElementById('trigger-camera-btn').addEventListener('click', async () => {
      try {
        await requestDeviceLocation();
        cameraInput.click();
      } catch (err) {
        alert(err.message);
        showToast(err.message, 'error', 5000);
        if (submitActBtn) {
          submitActBtn.disabled = true;
        }
      }
    });

    cameraInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        showToast('جاري التحقق من إذن الموقع وفحص بصمة الصورة...', 'info');
        const loc = await requestDeviceLocation(branchCombo ? branchCombo.getValue() : defaultBranch);
        if (ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
          const prox = ActivityManager.validateBranchProximity(branchCombo ? branchCombo.getValue() : defaultBranch, loc, 150);
          if (!prox.isValid) {
            throw new Error(prox.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
          }
        }
        const batch = await CameraCompressor.processFilesBatch(files, 'Round 1');
        initialProcessedPhotos = batch;

        const first = batch[0];
        const meta = first.metadata || {};
        const previewBox = document.getElementById('camera-preview-box');
        previewBox.innerHTML = `
          <div style="position: relative; width: 100%; height: 100%;">
            <img src="${first.photoUrl}" alt="Preview" class="camera-preview-thumb" />
            <div style="position: absolute; top: 6px; right: 6px;">
              <span class="badge ${meta.originBadgeClass || 'badge-success'}">${meta.originBadge || 'كاميرا مباشرة'}</span>
            </div>
          </div>
        `;
        previewBox.onclick = () => cameraInput.click();

        document.getElementById('compression-telemetry').style.display = 'block';
        document.getElementById('tel-res').textContent = `الأبعاد: ${first.width}×${first.height} px`;
        document.getElementById('tel-size').textContent = `الحجم المضغوط: ${first.sizeKb} KB | مصدر: ${meta.originBadge || 'كاميرا'}`;

        if (submitActBtn) {
          submitActBtn.disabled = false;
        }
        showToast('تم اعتماد بصمة الصورة والتحقق من الموقع GPS بنجاح', 'success');
      } catch (err) {
        e.target.value = '';
        alert(err.message);
        showToast(err.message, 'error', 5000);
        if (submitActBtn) {
          submitActBtn.disabled = true;
        }
      }
    });

    document.getElementById('activity-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientVal = clientCombo.getValue();
      const branchVal = branchCombo.getValue();
      const coordBranchVal = coordBranchCombo.getValue();
      const activityVal = activityCombo.getValue();
      const activityTypeVal = activityTypeCombo.getValue();
      const activityCountVal = countSelect ? (Number(countSelect.value) || 1) : 1;
      const distinctBrands = [...new Set(selectedProducts.map((p) => p.brand).filter(Boolean))];
      const skuVal = selectedProducts.map((p) => p.sku).join(' | ');
      const magStartVal = magStartInput ? magStartInput.value : '';
      const magEndVal = magEndInput ? magEndInput.value : '';

      if (!clientVal || !branchVal || !coordBranchVal || !activityVal || !activityTypeVal || !skuVal) {
        return showToast('يرجى استكمال جميع الحقول الإلزامية', 'warning');
      }

      if (activityVal === 'فرشة مجلة') {
        if (!magStartVal || !magEndVal) {
          return showToast('يرجى تحديد تاريخي البداية والنهاية للمجلة عند اختيار "فرشة مجلة"', 'warning');
        }
        if (magEndVal < magStartVal) {
          return showToast('تاريخ نهاية المجلة يجب أن يكون لاحقاً أو مساوياً لتاريخ البداية', 'warning');
        }
      }

      if (selectedProducts.length === 0) {
        return showToast('يرجى إضافة منتج واحد على الأقل عبر زر (+ إضافة منتج)', 'warning');
      }

      const actDateEl = document.getElementById('f-activity-date');
      const actDateVal = actDateEl ? actDateEl.value : '';

      const btn = document.getElementById('submit-activity-btn');
      btn.disabled = true;
      btn.innerHTML = `<span>جاري التحقق من الموقع الجغرافي (GPS)...</span>`;

      try {
        // Ensure live device GPS coordinates are captured via navigator.geolocation.getCurrentPosition
        if (!currentDeviceLocation) {
          await requestDeviceLocation(branchVal);
        }

        // Validate Haversine proximity against branch coordinates (max 150m)
        if (ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
          const proxCheck = ActivityManager.validateBranchProximity(branchVal, currentDeviceLocation, 150);
          if (!proxCheck.isValid) {
            throw new Error(proxCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
          }
        }

        const payload = {
          coordinatorId: user.employeeId,
          coordinatorName: user.fullName,
          client: clientVal,
          branch: branchVal,
          coordinatorBranch: coordBranchVal,
          activity: activityVal,
          activityType: activityTypeVal,
          activityCount: activityCountVal,
          brands: distinctBrands,
          products: selectedProducts,
          skuVariant: skuVal,
          activityDate: actDateVal || undefined,
          magazineDate: activityVal === 'فرشة مجلة' ? (magStartVal + (magEndVal ? ' إلى ' + magEndVal : '')) : '',
          magazineStartDate: activityVal === 'فرشة مجلة' ? magStartVal : null,
          magazineEndDate: activityVal === 'فرشة مجلة' ? magEndVal : null,
          photoUrl: initialProcessedPhotos[0].photoUrl,
          photoHash: initialProcessedPhotos[0].photoHash,
          initialPhotos: initialProcessedPhotos,
          latitude: currentDeviceLocation ? currentDeviceLocation.latitude : undefined,
          longitude: currentDeviceLocation ? currentDeviceLocation.longitude : undefined,
          location: currentDeviceLocation
        };

        btn.innerHTML = `<span>جاري اعتماد البيانات...</span>`;
        const res = await ActivityManager.submitActivity(payload);
        showToast('تم التحقق من نطاق الفرع وتسجيل بطاقة النشاط بنجاح', 'success');
        setTimeout(() => {
          window.location.href = `./activity-card.html?id=${res.record.id}`;
        }, 400);
      } catch (err) {
        showToast(err.message, 'error', 5000);
        btn.disabled = false;
        btn.innerHTML = `<img src="../assets/icons/check-circle-2.svg" class="ui-icon" alt="" /><span>اعتماد وإرسال بطاقة النشاط</span>`;
      }
    });
})(typeof window !== 'undefined' ? window : globalThis);
