/**
 * ADCO Field Operations System - Cascading Product Modal Component
 * Single Responsibility: 4-Level Cascading Product Picker Modal (Brand -> Main Group -> Sub Group -> Item / SKU)
 * with instant dependency cascade, resilient exit handlers, and product selection dispatch.
 */

import { ADCO_PRODUCT_HIERARCHY, ADCO_CATALOGS } from '../config/catalogs.js';

export class ProductModalComponent {
  static ensureModalContainer() {
    if (typeof document === 'undefined') return null;
    let modal = document.getElementById('product-picker-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'product-picker-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    return modal;
  }

  static open(onConfirm) {
    const modal = this.ensureModalContainer();
    const hierarchy = ADCO_PRODUCT_HIERARCHY || (window.ADCO_CATALOGS && window.ADCO_CATALOGS.productHierarchy);

    modal.innerHTML = `
      <div class="modal-sheet ac-s70">
        <div class="modal-header">
          <h3 class="ac-s71">
            <span class="ac-s72">+</span>
            <span>إضافة منتج عبر الهيكل الرباعي</span>
          </h3>
          <button type="button" class="close-modal-btn" id="btn-close-product-modal">&times;</button>
        </div>

        <p class="ac-s73">
          حدد البراند والمجموعات للوصول للصنف بدقة، وسيتم إدراجه تلقائياً وتحديث حصة البراند (1/N$):
        </p>

        <form id="product-picker-form">
          <!-- 1. Brand -->
          <div class="form-group">
            <label class="form-label ac-s74" for="picker-brand">1. اسم البراند (Brand Name) *</label>
            <select id="picker-brand" class="form-select ac-s75"></select>
          </div>

          <!-- 2. Main Group -->
          <div class="form-group">
            <label class="form-label ac-s74" for="picker-main-group">2. مجموعة رئيسية (Main Group) *</label>
            <select id="picker-main-group" class="form-select ac-s75"></select>
          </div>

          <!-- 3. Sub Group -->
          <div class="form-group">
            <label class="form-label ac-s74" for="picker-sub-group">3. مجموعة فرعية (Sub Group) *</label>
            <select id="picker-sub-group" class="form-select ac-s75"></select>
          </div>

          <!-- 4. Item / SKU -->
          <div class="form-group">
            <label class="form-label ac-s74" for="picker-sku">4. الصنف (Item / SKU) *</label>
            <select id="picker-sku" class="form-select ac-s75"></select>
          </div>

          <div class="ac-s76">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-product-modal">إلغاء</button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-add-product">
              <span class="ac-s77">+</span>
              <span>إضافة الصنف</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    const brandEl = document.getElementById('picker-brand');
    const mainEl = document.getElementById('picker-main-group');
    const subEl = document.getElementById('picker-sub-group');
    const skuEl = document.getElementById('picker-sku');
    const confirmBtn = document.getElementById('btn-confirm-add-product');
    const closeBtn = document.getElementById('btn-close-product-modal');
    const cancelBtn = document.getElementById('btn-cancel-product-modal');

    const syncCascade = (chosenBrand, chosenMain, chosenSub, chosenSku) => {
      const brandsList = Object.keys(hierarchy);
      const b = chosenBrand && brandsList.includes(chosenBrand) ? chosenBrand : (brandEl.value || brandsList[0]);

      // 1. Populate Brand
      brandEl.innerHTML = brandsList
        .map((item) => `<option value="${item}" ${item === b ? 'selected' : ''}>${item}</option>`)
        .join('');

      // 2. Populate Main Group
      const brandData = hierarchy[b] || {};
      const mainGroups = Object.keys(brandData);
      const mg = chosenMain && mainGroups.includes(chosenMain) ? chosenMain : (mainGroups[0] || 'عام');
      mainEl.innerHTML = mainGroups
        .map((mgItem) => `<option value="${mgItem}" ${mgItem === mg ? 'selected' : ''}>${mgItem}</option>`)
        .join('');

      // 3. Populate Sub Group
      const subGroupsData = brandData[mg] || {};
      const subGroups = Object.keys(subGroupsData);
      const sg = chosenSub && subGroups.includes(chosenSub) ? chosenSub : (subGroups[0] || 'افتراضي');
      subEl.innerHTML = subGroups
        .map((sgItem) => `<option value="${sgItem}" ${sgItem === sg ? 'selected' : ''}>${sgItem}</option>`)
        .join('');

      // 4. Populate SKU / Item
      const skus = Array.isArray(subGroupsData[sg]) ? subGroupsData[sg] : [];
      const chosen = chosenSku && skus.includes(chosenSku) ? chosenSku : (skus[0] || '');
      skuEl.innerHTML = skus
        .map((skuItem) => `<option value="${skuItem}" ${skuItem === chosen ? 'selected' : ''}>${skuItem}</option>`)
        .join('');

      if (confirmBtn) {
        confirmBtn.disabled = skus.length === 0;
      }
    };

    // Initial cascade population
    syncCascade('Persil (برسيل)');

    // Wire onchange events
    brandEl.addEventListener('change', () => syncCascade(brandEl.value));
    mainEl.addEventListener('change', () => syncCascade(brandEl.value, mainEl.value));
    subEl.addEventListener('change', () => syncCascade(brandEl.value, mainEl.value, subEl.value));

    const closeModal = () => modal.classList.remove('active');

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);

    // Confirm handler
    confirmBtn.addEventListener('click', () => {
      const brandVal = brandEl.value;
      const mainVal = mainEl.value;
      const subVal = subEl.value;
      const skuVal = skuEl.value;

      if (!brandVal || !skuVal) return;

      const product = {
        brandName: brandVal,
        mainGroup: mainVal,
        subGroup: subVal,
        skuItem: skuVal
      };

      if (typeof onConfirm === 'function') {
        onConfirm(product);
      }
      closeModal();
    });
  }

  static close() {
    const modal = document.getElementById('product-picker-modal');
    if (modal) modal.classList.remove('active');
  }
}

if (typeof window !== 'undefined') {
  window.ProductModalComponent = ProductModalComponent;
}

