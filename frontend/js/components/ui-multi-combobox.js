/**
 * ADCO Multi-Select Combobox (Global Browser Script)
 */
function createMultiSelectCombobox({
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
<button type="button" class="combobox-clear-btn is-hidden" title="مسح البحث">&times;</button>
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
tagsContainer.innerHTML = `<span class="ui-s1">لم يتم اختيار علامات تجارية بعد</span>`;
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
wrap.classList.toggle('open');
if (wrap.classList.contains('open')) {
renderDropdown(input.value);
input.focus();
}
});

document.addEventListener('click', (e) => {
if (!mount.contains(e.target)) wrap.classList.remove('open');
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

if (typeof window !== "undefined") { window.createMultiSelectCombobox = createMultiSelectCombobox; }
