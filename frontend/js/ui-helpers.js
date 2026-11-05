/**
* UI Helpers, Searchable Combobox Engine & Offline IndexedDB Caching
* Universal Browser Script (Works on both http://localhost and file:// protocol)
*/

(function (global) {
const DB_NAME = 'ADCO_Field_DB';
const DB_VERSION = 1;
const STORE_OFFLINE_QUEUE = 'offline_queue';
const STORE_ACTIVITIES = 'activities_cache';
const FALLBACK_QUEUE_KEY = 'ADCO_OFFLINE_QUEUE_FALLBACK';

function initDB() {
return new Promise((resolve, reject) => {
if (!global.indexedDB) {
return reject(new Error('IndexedDB not supported'));
}
try {
const request = indexedDB.open(DB_NAME, DB_VERSION);
request.onupgradeneeded = (event) => {
const db = event.target.result;
if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
}
if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id' });
}
};
request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
} catch (err) {
reject(err);
}
});
}

async function queueOfflineItem(item) {
try {
const db = await initDB();
return await new Promise((resolve, reject) => {
const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
const store = tx.objectStore(STORE_OFFLINE_QUEUE);
const req = store.add({ ...item, queuedAt: new Date().toISOString() });
req.onsuccess = () => resolve(req.result);
req.onerror = () => reject(req.error);
});
} catch {
const list = JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]');
list.push({ ...item, queuedAt: new Date().toISOString() });
localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(list));
return item.id;
}
}

async function getOfflineQueue() {
try {
const db = await initDB();
return await new Promise((resolve, reject) => {
const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readonly');
const store = tx.objectStore(STORE_OFFLINE_QUEUE);
const req = store.getAll();
req.onsuccess = () => resolve(req.result || []);
req.onerror = () => reject(req.error);
});
} catch {
return JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]');
}
}

async function removeOfflineItem(id) {
try {
const db = await initDB();
return await new Promise((resolve, reject) => {
const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
const store = tx.objectStore(STORE_OFFLINE_QUEUE);
const req = store.delete(id);
req.onsuccess = () => resolve();
req.onerror = () => reject(req.error);
});
} catch {
const list = JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]').filter((x) => x.id !== id);
localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(list));
}
}

function formatDateTime(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) return String(isoOrDate || '');
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d).replace(',', '').trim();
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }
}

function getEgyptDateTimeLocalString(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) return '';
  try {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(d);
    const m = {};
    p.forEach((x) => (m[x.type] = x.value));
    return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}

function getIconPrefix() {
return window.location.pathname.includes('/pages/') ? '../assets/icons/' : './assets/icons/';
}

function showToast(message, type = 'info', duration = 3000) {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
document.body.appendChild(container);
}

const toast = document.createElement('div');
toast.className = `toast toast-${type}`;
const iconBase = getIconPrefix();
let iconFile = 'shield-check.svg';
if (type === 'success') iconFile = 'check-circle-2.svg';
else if (type === 'error') iconFile = 'x-circle.svg';
else if (type === 'warning') iconFile = 'clock.svg';

toast.innerHTML = `<img src="${iconBase}${iconFile}" class="ui-icon ui-icon-sm" alt="" /><span>${message}</span>`;
container.appendChild(toast);

setTimeout(() => {
toast.style.opacity = '0';
toast.style.transform = 'translateY(10px)';
setTimeout(() => toast.remove(), 250);
}, duration);
}

function renderStatusBadge(status) {
const iconBase = getIconPrefix();
switch (status) {
case 'Accepted':
return `<span class="badge badge-success"><img src="${iconBase}check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" /> مقبول</span>`;
case 'Rejected':
return `<span class="badge badge-danger"><img src="${iconBase}x-circle.svg" class="ui-icon ui-icon-sm" alt="" /> مرفوض</span>`;
case 'Under Review':
default:
return `<span class="badge badge-warning"><img src="${iconBase}clock.svg" class="ui-icon ui-icon-sm" alt="" /> قيد المراجعة</span>`;
}
}

function updateActiveTab() {
// No-op for backwards compatibility after switching to Web Top Navbar
}

function highlightMatch(text, query) {
if (!query || !query.trim()) return text;
const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`(${escaped})`, 'gi');
return text.replace(regex, `<span class="match-highlight">$1</span>`);
}

function createSearchableCombobox({
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
<button type="button" class="combobox-clear-btn ${defaultValue ? '' : 'is-hidden'}" title="مسح الاختيار">&times;</button>
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
const q = query.trim().toLowerCase();
filteredOptions = q ? options.filter((opt) => opt.toLowerCase().includes(q)) : [...options];

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

const iconBase = getIconPrefix();
dropdown.innerHTML = filteredOptions
.map((opt, idx) => {
const isSelected = opt === selectedValue;
const isHigh = idx === highlightedIndex;
return `
<div class="combobox-option ${isSelected ? 'selected' : ''} ${isHigh ? 'highlighted' : ''}" data-index="${idx}">
<span>${highlightMatch(opt, query)}</span>
${isSelected ? `<img src="${iconBase}check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />` : ''}
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
const q = query.trim().toLowerCase();
filteredOptions = q ? options.filter((opt) => opt.toLowerCase().includes(q)) : [...options];

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

function setupNetworkListener(onSyncCallback) {
const updateStatus = () => {
const isOnline = navigator.onLine;
const banner = document.getElementById('offline-banner');
if (banner) {
if (!isOnline) {
banner.classList.add('active');
banner.innerHTML = `وضع العمل دون اتصال - سيتم حفظ البيانات محلياً وإرسالها عند عودة الاتصال`;
} else {
banner.classList.remove('active');
if (typeof onSyncCallback === 'function') {
onSyncCallback();
}
}
}
};

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();
}

// Expose globally
global.initDB = initDB;
global.queueOfflineItem = queueOfflineItem;
global.getOfflineQueue = getOfflineQueue;
global.removeOfflineItem = removeOfflineItem;
global.formatDateTime = formatDateTime;
global.getEgyptDateTimeLocalString = getEgyptDateTimeLocalString;
global.showToast = showToast;
global.renderStatusBadge = renderStatusBadge;
global.updateActiveTab = updateActiveTab;
global.createSearchableCombobox = createSearchableCombobox;
global.createMultiSelectCombobox = createMultiSelectCombobox;
global.setupNetworkListener = setupNetworkListener;
})(window);

/* Show / hide password toggle (auto-applied to every password input, including dynamic modals) */
(function () {
  var EYE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>';

  function enhance(input) {
    if (input.dataset.pwToggle) return;
    input.dataset.pwToggle = '1';
    var wrap = document.createElement('span');
    wrap.style.cssText = 'position:relative;display:block;width:100%;';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.paddingLeft = '42px';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.setAttribute('aria-label', 'إظهار كلمة المرور');
    btn.innerHTML = EYE;
    btn.style.cssText = 'position:absolute;left:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#64748b;cursor:pointer;border-radius:8px;padding:0;';
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? EYE_OFF : EYE;
      btn.setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
      btn.style.color = show ? '#15803d' : '#64748b';
    });
    wrap.appendChild(btn);
  }

  function scan() {
    document.querySelectorAll('input[type="password"]').forEach(enhance);
  }

  function start() {
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
