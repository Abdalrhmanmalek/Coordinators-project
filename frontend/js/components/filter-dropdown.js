/**
 * ADCO Field Operations System - Custom Searchable Filter Dropdown Component
 * Single Responsibility: Progressively enhances native <select> filter controls with
 * a sleek trigger pill, floating searchable menu, Arabic text normalization, and
 * full two-way sync with existing cascading <select> change handlers.
 */

(function (global) {
  function normalizeArabic(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      .replace(/[ًٌٍَُِّْ]/g, '')
      .trim();
  }

  function closeAllMenus(exceptWrap) {
    document.querySelectorAll('.custom-filter-dropdown.open').forEach((el) => {
      if (el !== exceptWrap) {
        el.classList.remove('open');
        const trig = el.querySelector('.custom-filter-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'false');
      }
    });
  }

  let globalOutsideBound = false;
  function ensureGlobalOutsideClick() {
    if (globalOutsideBound || typeof document === 'undefined') return;
    globalOutsideBound = true;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-filter-dropdown')) {
        closeAllMenus(null);
      }
    });
  }

  function readOptionsFromSelect(selectEl) {
    return Array.from(selectEl.options || []).map((opt) => ({
      value: opt.value,
      label: opt.textContent.trim(),
      selected: opt.selected
    }));
  }

  function enhance(selectEl, config = {}) {
    if (!selectEl || selectEl.dataset.adcoEnhanced === '1') {
      if (selectEl) sync(selectEl);
      return;
    }

    ensureGlobalOutsideClick();
    selectEl.dataset.adcoEnhanced = '1';
    selectEl.classList.add('adco-native-select-hidden');
    selectEl.setAttribute('aria-hidden', 'true');
    selectEl.tabIndex = -1;

    const searchPlaceholder = config.searchPlaceholder || 'ابحث عن عميل أو فرع...';

    const wrap = document.createElement('div');
    wrap.className = 'custom-filter-dropdown';
    wrap.innerHTML = `
      <button type="button" class="custom-filter-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="custom-filter-trigger-label"></span>
        <i data-lucide="chevron-down" class="ui-icon ui-icon-sm custom-filter-chevron"></i>
      </button>
      <div class="custom-filter-menu" role="listbox">
        <div class="custom-filter-search-wrap">
          <i data-lucide="search" class="ui-icon ui-icon-xs custom-filter-search-icon"></i>
          <input type="text" class="custom-filter-search-input" placeholder="${searchPlaceholder}" autocomplete="off" />
        </div>
        <div class="custom-filter-options"></div>
      </div>
    `;

    selectEl.parentNode.insertBefore(wrap, selectEl.nextSibling);
    selectEl._customDropdownWrap = wrap;

    const trigger = wrap.querySelector('.custom-filter-trigger');
    const triggerLabel = wrap.querySelector('.custom-filter-trigger-label');
    const searchInput = wrap.querySelector('.custom-filter-search-input');
    const optionsContainer = wrap.querySelector('.custom-filter-options');

    function renderOptions(query = '') {
      const opts = readOptionsFromSelect(selectEl);
      const normQ = normalizeArabic(query);
      const filtered = normQ
        ? opts.filter((o) => normalizeArabic(o.label).includes(normQ))
        : opts;

      const currentVal = selectEl.value;
      const selectedOpt = opts.find((o) => o.value === currentVal) || opts[0];
      if (selectedOpt) {
        triggerLabel.textContent = selectedOpt.label;
      }

      if (filtered.length === 0) {
        optionsContainer.innerHTML = `<div class="custom-filter-empty">لا توجد نتائج مطابقة</div>`;
        return;
      }

      optionsContainer.innerHTML = filtered
        .map((opt) => {
          const isSelected = opt.value === currentVal;
          return `
            <button type="button" class="custom-filter-option ${isSelected ? 'selected' : ''}" data-value="${opt.value.replace(/"/g, '&quot;')}" role="option" aria-selected="${isSelected}">
              <span>${opt.label}</span>
              ${isSelected ? '<i data-lucide="check" class="ui-icon ui-icon-xs"></i>' : ''}
            </button>
          `;
        })
        .join('');

      if (typeof global.refreshIcons === 'function') {
        global.refreshIcons(optionsContainer);
      }

      optionsContainer.querySelectorAll('.custom-filter-option').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const newVal = btn.dataset.value;
          if (selectEl.value !== newVal) {
            selectEl.value = newVal;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
          sync(selectEl);
          closeAllMenus(null);
        });
      });
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !wrap.classList.contains('open');
      closeAllMenus(willOpen ? wrap : null);
      wrap.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) {
        searchInput.value = '';
        renderOptions('');
        setTimeout(() => searchInput.focus(), 20);
      }
    });

    searchInput.addEventListener('input', () => {
      renderOptions(searchInput.value);
    });

    searchInput.addEventListener('click', (e) => e.stopPropagation());

    selectEl.addEventListener('change', () => sync(selectEl));

    if (typeof global.refreshIcons === 'function') {
      global.refreshIcons(wrap);
    }

    renderOptions('');
  }

  function sync(selectEl) {
    if (!selectEl || !selectEl._customDropdownWrap) return;
    const wrap = selectEl._customDropdownWrap;
    const triggerLabel = wrap.querySelector('.custom-filter-trigger-label');
    const searchInput = wrap.querySelector('.custom-filter-search-input');
    const optionsContainer = wrap.querySelector('.custom-filter-options');

    const opts = readOptionsFromSelect(selectEl);
    const selectedOpt = opts.find((o) => o.value === selectEl.value) || opts[0];
    if (triggerLabel && selectedOpt) {
      triggerLabel.textContent = selectedOpt.label;
    }

    if (wrap.classList.contains('open') && optionsContainer) {
      const normQ = normalizeArabic(searchInput ? searchInput.value : '');
      const filtered = normQ
        ? opts.filter((o) => normalizeArabic(o.label).includes(normQ))
        : opts;
      const currentVal = selectEl.value;
      optionsContainer.innerHTML = filtered
        .map((opt) => {
          const isSelected = opt.value === currentVal;
          return `
            <button type="button" class="custom-filter-option ${isSelected ? 'selected' : ''}" data-value="${opt.value.replace(/"/g, '&quot;')}" role="option" aria-selected="${isSelected}">
              <span>${opt.label}</span>
              ${isSelected ? '<i data-lucide="check" class="ui-icon ui-icon-xs"></i>' : ''}
            </button>
          `;
        })
        .join('');
      if (typeof global.refreshIcons === 'function') {
        global.refreshIcons(optionsContainer);
      }
      optionsContainer.querySelectorAll('.custom-filter-option').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const newVal = btn.dataset.value;
          if (selectEl.value !== newVal) {
            selectEl.value = newVal;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
          sync(selectEl);
          closeAllMenus(null);
        });
      });
    }
  }

  global.ADCOFilterDropdown = { enhance, sync };
})(typeof window !== 'undefined' ? window : globalThis);

