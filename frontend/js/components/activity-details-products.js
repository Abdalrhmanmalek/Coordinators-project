/**
 * ADCO Field Operations - Activity Details Products Modal
 */
(function (global) {
  'use strict';
  function createProductsController(ctx) {
    const { Catalogs, BrandShareUtil, showToast, getActiveProducts, setActiveProducts } = ctx;
  function renderSelectedProductsList() {
    const mount = document.getElementById('ad-edit-selected-products-mount');
    const shareBadge = document.getElementById('ad-edit-brand-share-badge');
    if (!mount) return;

    if (getActiveProducts().length === 0) {
      mount.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8;">لم يتم اختيار أصناف بعد. اضغط "إضافة صنف جديد" أعلاه.</span>';
      return;
    }

    const uniqueBrands = [...new Set(getActiveProducts().map((p) => p.brand).filter(Boolean))];

    mount.innerHTML = activeSelectedProducts
      .map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div>
            <strong style="color: #0f766e; font-size: 0.82rem;">${p.brand}</strong>
            <span style="color: #475569; font-size: 0.82rem; margin-right: 6px;">${p.skuItem || p.sku}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-xs btn-remove-sku" data-idx="${idx}" style="color: #ef4444;">
            حذف
          </button>
        </div>
      `)
      .join('');

    mount.querySelectorAll('.btn-remove-sku').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        activeSelectedProducts.splice(idx, 1);
        renderSelectedProductsList();
      });
    });
  }

  function setupProductModal() {
    const modal = document.getElementById('ad-product-picker-modal');
    const openBtn = document.getElementById('ad-open-product-modal-btn');
    const closeBtn = document.getElementById('ad-close-product-modal-btn');
    const cancelBtn = document.getElementById('ad-cancel-sku-btn');
    const confirmBtn = document.getElementById('ad-confirm-sku-btn');

    const brandSel = document.getElementById('ad-picker-brand');
    const mainSel = document.getElementById('ad-picker-main');
    const subSel = document.getElementById('ad-picker-sub');
    const skuSel = document.getElementById('ad-picker-sku');

    const catalogHierarchy = {
      'فلفيتا': {
        'معطرات أقمشة': {
          'مركز 1 لتر': [
            'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
            'فلفيتا معطر أقمشة مركز لافندر 1 لتر',
            'فلفيتا معطر أقمشة مركز عبير الشرق 1 لتر'
          ],
          'عادي 2 لتر': [
            'فلفيتا معطر أقمشة عادي نسيم الربيع 2 لتر',
            'فلفيتا معطر أقمشة عادي ندى الصباح 2 لتر'
          ]
        }
      },
      'فييا': {
        'منظفات أطباق': {
          'سائل 1 لتر': [
            'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
            'فييا سائل غسيل أطباق بالتفاح 1 لتر'
          ]
        }
      },
      'ديفا': {
        'صابون سائل': {
          'صابون يدين 500 مل': [
            'ديفا صابون سائل لليدين بالعود 500 مل',
            'ديفا صابون سائل لليدين بالورد 500 مل'
          ]
        }
      },
      'كلوريل': {
        'مبيضات ومطهرات': {
          'كلور عادي': [
            'كلوريل مبيض ملابس ومطهر عام 1 لتر',
            'كلوريل مبيض ملابس برائحة الليمون 1 لتر'
          ]
        }
      }
    };

    function populateSelect(el, items) {
      if (!el) return;
      el.innerHTML = items.map((it) => `<option value="${it}">${it}</option>`).join('');
    }

    function syncCascade(brand, main, sub) {
      const brands = Object.keys(catalogHierarchy);
      if (!brandSel.options.length) populateSelect(brandSel, brands);
      const selB = brand || brandSel.value || brands[0];
      brandSel.value = selB;

      const mains = Object.keys(catalogHierarchy[selB] || {});
      populateSelect(mainSel, mains);
      const selM = main || mainSel.value || mains[0];
      mainSel.value = selM;

      const subs = Object.keys((catalogHierarchy[selB] && catalogHierarchy[selB][selM]) || {});
      populateSelect(subSel, subs);
      const selS = sub || subSel.value || subs[0];
      subSel.value = selS;

      const skus = (catalogHierarchy[selB] && catalogHierarchy[selB][selM] && catalogHierarchy[selB][selM][selS]) || [];
      populateSelect(skuSel, skus);
    }

    if (brandSel) brandSel.addEventListener('change', () => syncCascade(brandSel.value));
    if (mainSel) mainSel.addEventListener('change', () => syncCascade(brandSel.value, mainSel.value));
    if (subSel) subSel.addEventListener('change', () => syncCascade(brandSel.value, mainSel.value, subSel.value));

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        syncCascade('فلفيتا');
        if (modal) modal.classList.add('active');
      });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const brand = brandSel.value;
        const skuItem = skuSel.value;
        if (!brand || !skuItem) {
          showToast('يرجى اختيار الصنف المطلوب', 'warning');
          return;
        }
        getActiveProducts().push({ brand, skuItem });
        renderSelectedProductsList();
        closeModal();
        showToast(`تمت إضافة ${skuItem} بنجاح`, 'success');
      });
    }
  }

    return { renderSelectedProductsList, setupProductModal };
  }
  global.ActivityDetailsProducts = { create: createProductsController };
})(typeof window !== 'undefined' ? window : globalThis);
