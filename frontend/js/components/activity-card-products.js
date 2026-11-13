/**
 * ADCO Field Operations - Activity Card Product Picker
 */
(function (global) {
  function initProducts(ctx) {
    const { ADCO_CATALOGS, timelineModal, closureModal, getSelectedProducts, setSelectedProducts, showToast, refreshIcons } = ctx;
    const shareBadgeEl = document.getElementById('live-brand-share-badge');
    const selectedProductsListEl = document.getElementById('selected-products-list');
    const noProductsPlaceholder = document.getElementById('no-products-placeholder');
    let selectedProducts = getSelectedProducts();
    function recalculateBrandShare() {
      const distinctBrands = [...new Set(selectedProducts.map((p) => p.brand).filter(Boolean))];
      const n = distinctBrands.length;
      if (n === 0) {
        if (shareBadgeEl) {
          shareBadgeEl.textContent = 'أضف منتجاً واحداً على الأقل';
          shareBadgeEl.className = 'badge badge-warning';
        }
        return;
      }
      const share = (1 / n).toFixed(2);
      const pct = Math.round((1 / n) * 100);
      if (shareBadgeEl) {
        shareBadgeEl.className = 'badge badge-mint';
        shareBadgeEl.textContent = `حصة البراند: ${share} (${pct}%) | ${n} براند (${selectedProducts.length} صنف)`;
      }
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
              <i data-lucide="circle-x" class="ui-icon ui-icon-sm"></i>
              <span>حذف</span>
            </button>
          </div>
        `)
        .join('');
      recalculateBrandShare();
    }
    window.removeProductItem = function(index) {
      selectedProducts.splice(index, 1); setSelectedProducts(selectedProducts);
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
      selectedProducts.push({ brand, mainGroup, subGroup, sku }); setSelectedProducts(selectedProducts);
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
    return { recalculateBrandShare, renderSelectedProducts, syncCascade };
  }
  global.ActivityCardProducts = { init: initProducts };
})(typeof window !== 'undefined' ? window : globalThis);
