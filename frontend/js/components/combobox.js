/**
 * ADCO Field Operations System - Searchable & Multi-Select Combobox Component
 * Single Responsibility: Searchable Combobox & Multi-Select Brands Tag UI
 */

function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .trim();
}

function highlightMatch(text, query) {
  if (!query || !query.trim()) return text;
  const rawQ = query.trim();
  const escaped = rawQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    if (regex.test(text)) {
      return text.replace(regex, `<span class="match-highlight">$1</span>`);
    }
  } catch (_) {}
  return text;
}

export function createSearchableCombobox({
  mountId,
  options = [],
  placeholder = 'ابحث أو اختر...',
  defaultValue = '',
  allowCustomText = false,
  onSelect = null
}) {
  const mount = document.getElementById(mountId);
  if (!mount) return null;

  let selectedValue = defaultValue;
  let highlightedIndex = -1;
  let filteredOptions = [...options];

  mount.innerHTML = `
    <div class="combobox-container" id="${mountId}-wrap">
      <div class="combobox-control">
        <input
          type="text"
          class="combobox-input"
          placeholder="${placeholder}"
          value="${defaultValue}"
          autocomplete="off"
        />
        <div class="combobox-actions">
          <button type="button" class="combobox-clear-btn" title="مسح الاختيار" style="display: ${defaultValue ? 'flex' : 'none'};">&times;</button>
          <button type="button" class="combobox-toggle-btn" title="عرض القائمة">&#9662;</button>
        </div>
      </div>
      <div class="combobox-dropdown"></div>
    </div>
  `;

  const wrap = mount.querySelector('.combobox-container');
  const input = mount.querySelector('.combobox-input');
  const clearBtn = mount.querySelector('.combobox-clear-btn');
  const toggleBtn = mount.querySelector('.combobox-toggle-btn');
  const dropdown = mount.querySelector('.combobox-dropdown');

  function renderDropdown(query = '') {
    const trimmed = query.trim();
    if (!trimmed) {
      filteredOptions = [...options];
    } else {
      const normQ = normalizeSearchText(trimmed);
      filteredOptions = options
        .filter((opt) => normalizeSearchText(opt).includes(normQ))
        .sort((a, b) => {
          const normA = normalizeSearchText(a);
          const normB = normalizeSearchText(b);
          const aStarts = normA.startsWith(normQ);
          const bStarts = normB.startsWith(normQ);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return normA.indexOf(normQ) - normB.indexOf(normQ);
        });
    }

    if (filteredOptions.length === 0) {
      dropdown.innerHTML =
        allowCustomText && query.trim()
          ? `<div class="combobox-option highlighted" data-val="${query.trim()}">إضافة: "${highlightMatch(query.trim(), query)}" ↵</div>`
          : `<div class="combobox-empty">لا توجد نتائج مطابقة لـ "${query}"</div>`;
      highlightedIndex = allowCustomText && query.trim() ? 0 : -1;
      if (allowCustomText && query.trim()) {
        dropdown.querySelector('.combobox-option').addEventListener('click', () => {
          chooseValue(query.trim());
        });
      }
      return;
    }

    if (highlightedIndex >= filteredOptions.length) {
      highlightedIndex = 0;
    }

    const prefix = window.location.pathname.includes('/pages/') ? '../assets/icons/' : './assets/icons/';
    dropdown.innerHTML = filteredOptions
      .map((opt, idx) => {
        const isSelected = opt === selectedValue;
        const isHigh = idx === highlightedIndex;
        return `
          <div class="combobox-option ${isSelected ? 'selected' : ''} ${isHigh ? 'highlighted' : ''}" data-index="${idx}">
            <span>${highlightMatch(opt, query)}</span>
            ${isSelected ? `<img src="${prefix}check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />` : ''}
          </div>
        `;
      })
      .join('');

    dropdown.querySelectorAll('.combobox-option').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.index);
        chooseValue(filteredOptions[idx]);
      });
    });
  }

  function openDropdown(filterText = '') {
    document.querySelectorAll('.combobox-container.open').forEach((other) => {
      if (other !== wrap) other.classList.remove('open');
    });
    wrap.classList.add('open');
    renderDropdown(filterText);
  }

  function closeDropdown() {
    wrap.classList.remove('open');
    highlightedIndex = -1;
    if (allowCustomText && input.value.trim()) {
      selectedValue = input.value.trim();
    } else if (!options.includes(input.value.trim()) && selectedValue) {
      input.value = selectedValue;
    }
    clearBtn.style.display = input.value ? 'flex' : 'none';
  }

  function chooseValue(val) {
    selectedValue = val;
    input.value = val;
    clearBtn.style.display = val ? 'flex' : 'none';
    wrap.classList.remove('open');
    if (typeof onSelect === 'function') {
      onSelect(val);
    }
  }

  input.addEventListener('focus', () => openDropdown(''));

  input.addEventListener('input', () => {
    const val = input.value;
    clearBtn.style.display = val ? 'flex' : 'none';
    if (allowCustomText) selectedValue = val.trim();
    highlightedIndex = 0;
    openDropdown(val);
  });

  input.addEventListener('keydown', (e) => {
    if (!wrap.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      openDropdown(input.value);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % filteredOptions.length;
        renderDropdown(input.value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length;
        renderDropdown(input.value);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        chooseValue(filteredOptions[highlightedIndex]);
      } else if (allowCustomText && input.value.trim()) {
        chooseValue(input.value.trim());
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedValue = '';
    input.value = '';
    clearBtn.style.display = 'none';
    openDropdown('');
    input.focus();
    if (typeof onSelect === 'function') onSelect('');
  });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (wrap.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown('');
      input.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  return {
    getValue: () => (allowCustomText ? input.value.trim() : selectedValue || input.value.trim()),
    setValue: (val) => chooseValue(val)
  };
}

export function createMultiSelectCombobox({
  mountId,
  options = [],
  defaultSelected = [],
  placeholder = 'ابحث عن العلامات التجارية وأضفها...',
  onChange = null
}) {
  const mount = document.getElementById(mountId);
  if (!mount) return null;

  let selectedItems = [...defaultSelected];
  let highlightedIndex = 0;
  let filteredOptions = [...options];

  mount.innerHTML = `
    <div class="multi-selected-tags" id="${mountId}-tags"></div>
    <div class="combobox-container" id="${mountId}-wrap">
      <div class="combobox-control">
        <input
          type="text"
          class="combobox-input"
          placeholder="${placeholder}"
          autocomplete="off"
        />
        <div class="combobox-actions">
          <button type="button" class="combobox-clear-btn" title="مسح البحث" style="display: none;">&times;</button>
          <button type="button" class="combobox-toggle-btn" title="عرض العلامات التجارية">&#9662;</button>
        </div>
      </div>
      <div class="combobox-dropdown"></div>
    </div>
  `;

  const tagsContainer = mount.querySelector(`#${mountId}-tags`);
  const wrap = mount.querySelector('.combobox-container');
  const input = mount.querySelector('.combobox-input');
  const clearBtn = mount.querySelector('.combobox-clear-btn');
  const toggleBtn = mount.querySelector('.combobox-toggle-btn');
  const dropdown = mount.querySelector('.combobox-dropdown');

  function renderTags() {
    if (selectedItems.length === 0) {
      tagsContainer.innerHTML = `<span style="font-size:0.76rem; color:var(--adco-gray-400);">لم يتم اختيار علامات تجارية بعد</span>`;
      return;
    }
    tagsContainer.innerHTML = selectedItems
      .map(
        (brand) => `
          <span class="multi-tag-pill">
            <span>${brand}</span>
            <button type="button" class="multi-tag-remove" data-remove="${brand}" title="إزالة">&times;</button>
          </span>
        `
      )
      .join('');

    tagsContainer.querySelectorAll('.multi-tag-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.dataset.remove;
        selectedItems = selectedItems.filter((item) => item !== target);
        renderTags();
        if (wrap.classList.contains('open')) renderDropdown(input.value);
        if (typeof onChange === 'function') onChange(selectedItems);
      });
    });
  }

  function renderDropdown(query = '') {
    const trimmed = query.trim();
    if (!trimmed) {
      filteredOptions = [...options];
    } else {
      const normQ = normalizeSearchText(trimmed);
      filteredOptions = options
        .filter((opt) => normalizeSearchText(opt).includes(normQ))
        .sort((a, b) => {
          const normA = normalizeSearchText(a);
          const normB = normalizeSearchText(b);
          const aStarts = normA.startsWith(normQ);
          const bStarts = normB.startsWith(normQ);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return normA.indexOf(normQ) - normB.indexOf(normQ);
        });
    }

    if (filteredOptions.length === 0) {
      dropdown.innerHTML = `<div class="combobox-empty">لا توجد علامة تجارية مطابقة لـ "${query}"</div>`;
      return;
    }

    if (highlightedIndex >= filteredOptions.length) highlightedIndex = 0;

    dropdown.innerHTML = filteredOptions
      .map((opt, idx) => {
        const isSelected = selectedItems.includes(opt);
        const isHigh = idx === highlightedIndex;
        return `
          <div class="combobox-option ${isSelected ? 'selected' : ''} ${isHigh ? 'highlighted' : ''}" data-index="${idx}">
            <span>${highlightMatch(opt, query)}</span>
            <span>${isSelected ? 'مضاف' : '+ إضافة'}</span>
          </div>
        `;
      })
      .join('');

    dropdown.querySelectorAll('.combobox-option').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(el.dataset.index);
        toggleBrand(filteredOptions[idx]);
      });
    });
  }

  function toggleBrand(brand) {
    if (!brand) return;
    if (selectedItems.includes(brand)) {
      selectedItems = selectedItems.filter((b) => b !== brand);
    } else {
      selectedItems.push(brand);
    }
    input.value = '';
    clearBtn.style.display = 'none';
    renderTags();
    renderDropdown('');
    if (typeof onChange === 'function') onChange(selectedItems);
  }

  input.addEventListener('focus', () => {
    wrap.classList.add('open');
    renderDropdown(input.value);
  });

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'flex' : 'none';
    highlightedIndex = 0;
    wrap.classList.add('open');
    renderDropdown(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % filteredOptions.length;
        renderDropdown(input.value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length;
        renderDropdown(input.value);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        toggleBrand(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      wrap.classList.remove('open');
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    clearBtn.style.display = 'none';
    renderDropdown('');
    input.focus();
  });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (wrap.classList.contains('open')) {
      wrap.classList.remove('open');
    } else {
      wrap.classList.add('open');
      renderDropdown('');
      input.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove('open');
    }
  });

  renderTags();

  return {
    getSelected: () => [...selectedItems],
    setSelected: (arr) => {
      selectedItems = [...arr];
      renderTags();
    }
  };
}

if (typeof window !== 'undefined') {
  window.createSearchableCombobox = createSearchableCombobox;
  window.createMultiSelectCombobox = createMultiSelectCombobox;
}
