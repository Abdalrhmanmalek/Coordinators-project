/**
 * ADCO Field Operations System - Cascading Product Modal Component
 * Single Responsibility: 4-Level Cascading Product Picker Modal (Brand -> Main Group -> Sub Group -> Item / SKU)
 * with instant dependency cascade, resilient exit handlers, and product selection dispatch.
 */

(function (global) {
  'use strict';

  class ProductModalComponent {
    static getHierarchy() {
      const catalogs = global.ADCO_CATALOGS || (typeof ADCO_CATALOGS !== 'undefined' ? ADCO_CATALOGS : {});
      return (
        global.ADCO_PRODUCT_HIERARCHY ||
        catalogs.productHierarchy ||
        {
          'فلفيتا': {
            'منظفات ومطهرات ومعطرات الأقمشة': {
              'معطر ملابس مركز': [
                'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
                'فلفيتا معطر أقمشة مركز لافندر 1 لتر',
                'فلفيتا معطر أقمشة مركز عبير الشرق 1 لتر'
              ]
            }
          }
        }
      );
    }

    static ensureModalContainer() {
      if (typeof document === 'undefined') return null;
      let modal = document.getElementById('product-picker-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'product-picker-modal';
        modal.className = 'modal-overlay custom-modal-backdrop';
        document.body.appendChild(modal);
      }
      return modal;
    }

    static open(onConfirm) {
      const modal = this.ensureModalContainer();
      if (!modal) return;
      const hierarchy = this.getHierarchy();

      modal.classList.remove('is-hidden');
      modal.classList.add('active');
      modal.style.display = 'flex';
      if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
        window.refreshIcons(modal);
      }

      // Check if modal already has form selects defined
      let brandEl = document.getElementById('picker-brand');
      let mainEl = document.getElementById('picker-main-group');
      let subEl = document.getElementById('picker-sub-group');
      let skuEl = document.getElementById('picker-sku');
      let confirmBtn = document.getElementById('btn-confirm-add-product');
      let closeBtn = document.getElementById('close-product-modal-btn') || document.getElementById('btn-close-product-modal');
      let cancelBtn = document.getElementById('btn-cancel-product-modal');

      if (!brandEl || !mainEl || !subEl || !skuEl) {
        modal.innerHTML = `
          <div class="modal-sheet custom-modal-card ac-s70 modal-content modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="ac-s71" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="plus-circle" class="ui-icon ui-icon-md"></i>
                <span>إضافة منتج</span>
              </h3>
              <button type="button" class="close-modal-btn ac-s73" id="close-product-modal-btn">&times;</button>
            </div>

            <form id="product-picker-form" onsubmit="event.preventDefault();" style="margin-top: 14px;">
              <!-- 1. Brand -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label ac-s76" for="picker-brand" style="font-weight: 700;">العلامة التجارية *</label>
                <select id="picker-brand" class="form-select ac-s77"></select>
              </div>

              <!-- 2. Main Group -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label ac-s76" for="picker-main-group" style="font-weight: 700;">المجموعة الرئيسية *</label>
                <select id="picker-main-group" class="form-select ac-s77"></select>
              </div>

              <!-- 3. Sub Group -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label ac-s76" for="picker-sub-group" style="font-weight: 700;">المجموعة الفرعية *</label>
                <select id="picker-sub-group" class="form-select ac-s77"></select>
              </div>

              <!-- 4. Item / SKU -->
              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label ac-s76" for="picker-sku" style="font-weight: 700;">الصنف *</label>
                <select id="picker-sku" class="form-select ac-s77"></select>
              </div>

              <div class="ac-s78" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-product-modal">إلغاء</button>
                <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-add-product">
                  <i data-lucide="plus" class="ui-icon ui-icon-sm"></i>
                  <span>إضافة منتج</span>
                </button>
              </div>
            </form>
          </div>
        `;

        brandEl = document.getElementById('picker-brand');
        mainEl = document.getElementById('picker-main-group');
        subEl = document.getElementById('picker-sub-group');
        skuEl = document.getElementById('picker-sku');
        confirmBtn = document.getElementById('btn-confirm-add-product');
        closeBtn = document.getElementById('close-product-modal-btn');
        cancelBtn = document.getElementById('btn-cancel-product-modal');
      }

      const syncCascade = (chosenBrand, chosenMain, chosenSub, chosenSku) => {
        const brandsList = Object.keys(hierarchy);
        if (brandsList.length === 0) return;
        const b = chosenBrand && brandsList.includes(chosenBrand) ? chosenBrand : (brandEl.value && brandsList.includes(brandEl.value) ? brandEl.value : brandsList[0]);

        // 1. Brand
        brandEl.innerHTML = brandsList
          .map((item) => `<option value="${item}" ${item === b ? 'selected' : ''}>${item}</option>`)
          .join('');

        // 2. Main Group
        const brandData = hierarchy[b] || {};
        const mainGroups = Object.keys(brandData);
        const mg = chosenMain && mainGroups.includes(chosenMain) ? chosenMain : (mainGroups[0] || 'عام');
        mainEl.innerHTML = mainGroups
          .map((mgItem) => `<option value="${mgItem}" ${mgItem === mg ? 'selected' : ''}>${mgItem}</option>`)
          .join('');

        // 3. Sub Group
        const subGroupsData = brandData[mg] || {};
        const subGroups = Object.keys(subGroupsData);
        const sg = chosenSub && subGroups.includes(chosenSub) ? chosenSub : (subGroups[0] || 'افتراضي');
        subEl.innerHTML = subGroups
          .map((sgItem) => `<option value="${sgItem}" ${sgItem === sg ? 'selected' : ''}>${sgItem}</option>`)
          .join('');

        // 4. SKU / Item
        const skus = Array.isArray(subGroupsData[sg]) ? subGroupsData[sg] : [`${b} - عبوة ترويجية`];
        const chosen = chosenSku && skus.includes(chosenSku) ? chosenSku : (skus[0] || '');
        skuEl.innerHTML = skus
          .map((skuItem) => `<option value="${skuItem}" ${skuItem === chosen ? 'selected' : ''}>${skuItem}</option>`)
          .join('');

        if (confirmBtn) {
          confirmBtn.disabled = skus.length === 0;
        }
      };

      // Populate initial values
      const curBrand = (brandEl && brandEl.value) || 'فلفيتا';
      syncCascade(curBrand);

      // Events
      brandEl.onchange = () => syncCascade(brandEl.value);
      mainEl.onchange = () => syncCascade(brandEl.value, mainEl.value);
      subEl.onchange = () => syncCascade(brandEl.value, mainEl.value, subEl.value);

      const closeModal = () => {
        modal.classList.remove('active');
        modal.classList.add('is-hidden');
        modal.style.display = 'none';
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      const keyHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closeModal();
          document.removeEventListener('keydown', keyHandler);
        }
      };
      document.addEventListener('keydown', keyHandler);

      // Confirm
      if (confirmBtn) {
        confirmBtn.onclick = (e) => {
          e.preventDefault();
          const brandVal = brandEl.value;
          const mainVal = mainEl.value;
          const subVal = subEl.value;
          const skuVal = skuEl.value;

          if (!brandVal || !skuVal) return;

          const catalogs = global.ADCO_CATALOGS || {};
          const brandMap = catalogs.brandDetailsMap || {};
          const brandEntry = brandMap[brandVal] || {};
          const brandId = brandEntry.id || `BRD-${encodeURIComponent(brandVal).slice(0, 8)}`;
          const productGroupId = `GRP-${encodeURIComponent(mainVal + '-' + subVal).slice(0, 10)}`;
          const skuId = `SKU-${encodeURIComponent(skuVal).slice(0, 12)}`;

          const product = {
            brandId: brandId,
            productGroupId: productGroupId,
            skuId: skuId,
            brandName: brandVal,
            brand: brandVal,
            mainGroup: mainVal,
            subGroup: subVal,
            skuItem: skuVal,
            sku: skuVal
          };

          if (typeof onConfirm === 'function') {
            onConfirm(product);
          }
          closeModal();
        };
      }
    }

    static close() {
      const modal = document.getElementById('product-picker-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.classList.add('is-hidden');
        modal.style.display = 'none';
      }
    }
  }

  global.ProductModalComponent = ProductModalComponent;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductModalComponent };
  }
})(typeof window !== 'undefined' ? window : globalThis);
