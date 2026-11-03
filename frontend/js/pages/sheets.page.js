/**
 * ADCO Field Operations System - Sheets View Page Controller
 * Single Responsibility: Master brand share spreadsheet grid, multi-parameter filtering,
 * date range filtering, and CSV / Excel export generation.
 */

import { AuthService } from '../services/auth.service.js';
import { ActivityService } from '../services/activity.service.js';
import { ReportingService } from '../services/reporting.service.js';
import { ADCO_CATALOGS } from '../config/catalogs.js';
import { NavbarComponent } from '../components/navbar.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  AuthService.checkAuthGuard('supervisor');
  NavbarComponent.render();

  const searchInput = document.getElementById('sheet-search');
  const fltClient = document.getElementById('flt-client');
  const fltBrand = document.getElementById('flt-brand');
  const fltActivity = document.getElementById('flt-activity');
  const fltActivityType = document.getElementById('flt-activity-type');
  const fltStatus = document.getElementById('flt-status');
  const fltClosure = document.getElementById('flt-closure');
  const fltDateFrom = document.getElementById('flt-date-from');
  const fltDateTo = document.getElementById('flt-date-to');
  const resetBtn = document.getElementById('reset-sheet-filters');
  const exportBtn = document.getElementById('export-excel-btn');

  // Populate dropdowns from catalogs
  if (ADCO_CATALOGS) {
    if (fltClient) {
      ADCO_CATALOGS.clients.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        fltClient.appendChild(opt);
      });
    }

    if (fltBrand) {
      ADCO_CATALOGS.brands.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        fltBrand.appendChild(opt);
      });
    }

    if (fltActivity) {
      ADCO_CATALOGS.activities.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        fltActivity.appendChild(opt);
      });
    }

    if (fltActivityType) {
      ADCO_CATALOGS.activityTypes.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        fltActivityType.appendChild(opt);
      });
    }
  }

  let currentFilteredRows = [];

  function renderGrid() {
    const expanded = ActivityService.getExpandedBrandRows();
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const selClient = fltClient ? fltClient.value : 'ALL';
    const selBrand = fltBrand ? fltBrand.value : 'ALL';
    const selActivity = fltActivity ? fltActivity.value : 'ALL';
    const selType = fltActivityType ? fltActivityType.value : 'ALL';
    const selStatus = fltStatus ? fltStatus.value : 'ALL';
    const selClosure = fltClosure ? fltClosure.value : 'ALL';
    const fromDate = fltDateFrom ? (fltDateFrom.value || '').trim() : '';
    const toDate = fltDateTo ? (fltDateTo.value || '').trim() : '';

    currentFilteredRows = expanded.filter((r) => {
      // Search free text
      if (q) {
        const matchSearch =
          (r.id || '').toLowerCase().includes(q) ||
          (r.coordinatorName || '').toLowerCase().includes(q) ||
          (r.client || '').toLowerCase().includes(q) ||
          (r.singleBrand || '').toLowerCase().includes(q) ||
          (r.activity || '').toLowerCase().includes(q) ||
          (r.activityType || '').toLowerCase().includes(q) ||
          (r.reviewerName || '').toLowerCase().includes(q) ||
          (r.branch || '').toLowerCase().includes(q) ||
          (r.supervisorNotes || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // Filter parameters
      if (selClient !== 'ALL' && r.client !== selClient) return false;
      if (selBrand !== 'ALL' && r.singleBrand !== selBrand) return false;
      if (selActivity !== 'ALL' && r.activity !== selActivity) return false;
      if (selType !== 'ALL' && r.activityType !== selType) return false;
      if (selStatus !== 'ALL' && r.status !== selStatus) return false;

      // Date range filter
      if (fromDate || toDate) {
        const rawDateStr = r.activityDate || r.createdAt || r.timestamp || '';
        const matchDate = rawDateStr.match(/(\d{4}-\d{2}-\d{2})/);
        const rowDateOnly = matchDate ? matchDate[1] : '';
        if (rowDateOnly) {
          if (fromDate && rowDateOnly < fromDate) return false;
          if (toDate && rowDateOnly > toDate) return false;
        }
      }

      // Closure filter
      if (selClosure === 'ACTIVE' && (r.isClosed || r.closureRequested)) return false;
      if (selClosure === 'CLOSED' && !r.isClosed) return false;
      if (selClosure === 'PENDING' && !r.closureRequested) return false;

      return true;
    });

    const badge = document.getElementById('total-rows-badge');
    if (badge) {
      badge.textContent = `الصفوف المعروضة: ${currentFilteredRows.length} من أصل ${expanded.length} صف`;
    }

    const tbody = document.getElementById('sheet-rows-mount');
    if (!tbody) return;

    if (currentFilteredRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="19" style="text-align:center; padding:32px; color:#64748b;">لا توجد صفوف تطابق الفلاتر المحددة حالياً.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentFilteredRows
      .map(
        (r, idx) => `
        <tr>
          <td style="color:#64748b; font-weight:700;">${idx + 1}</td>
          <td style="font-family:monospace; font-weight:700;">
            <a href="./activity-card.html?id=${r.id}" style="color:var(--adco-green-deep); text-decoration:none;">
              ${r.id}
            </a>
          </td>
          <td>${r.coordinatorName}</td>
          <td>${r.client}</td>
          <td>${r.branch}</td>
          <td style="font-weight:700; color:var(--adco-green-deep);">${r.singleBrand}</td>
          <td style="text-align:center;">
            <span class="share-pill" dir="ltr">${r.brandShareFormatted}</span>
          </td>
          <td style="font-weight:700;">${r.activity || '-'}</td>
          <td>${r.activityType || '-'}</td>
          <td style="text-align:center; font-weight:800;">${r.activityCount || 1}</td>
          <td style="font-size:0.8rem; white-space:nowrap;" dir="ltr">${r.activityStartDate || '-'}</td>
          <td style="font-size:0.8rem; white-space:nowrap;" dir="ltr">
            ${r.activityEndDate ? r.activityEndDate : (r.isClosed ? 'منتهي ومفكك' : '<span class="badge badge-mint" style="font-size:0.7rem;">نشط ومستمر</span>')}
          </td>
          <td style="text-align:center;" dir="ltr">${r.magazineDate || '-'}</td>
          <td style="font-weight:800; color:#92400e; background:#fffbeb;">
            <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" style="vertical-align:middle;" />
            ${r.overallRatingBadge}
          </td>
          <td>
            <span class="badge ${r.status === 'Accepted' ? 'badge-success' : r.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">
              ${r.status}
            </span>
          </td>
          <td style="font-weight:600; color:#0f172a;">${r.reviewerName || '-'}</td>
          <td style="font-size:0.78rem; color:#475569;" dir="ltr">${r.reviewedAtFormatted || '-'}</td>
          <td>
            ${
              r.isClosed
                ? `<span class="badge badge-success" style="font-size:0.74rem;">منتهي ومفكك</span>`
                : r.closureRequested
                ? `<span class="badge badge-warning" style="font-size:0.74rem;">طلب إنهاء</span>`
                : `<span class="badge badge-mint" style="font-size:0.74rem;">نشط ومستمر</span>`
            }
          </td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;">${r.supervisorNotes || '-'}</td>
        </tr>
      `
      )
      .join('');
  }

  [searchInput, fltClient, fltBrand, fltActivity, fltActivityType, fltStatus, fltClosure, fltDateFrom, fltDateTo].forEach((el) => {
    if (el) {
      el.addEventListener('change', renderGrid);
      el.addEventListener('input', renderGrid);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (fltClient) fltClient.value = 'ALL';
      if (fltBrand) fltBrand.value = 'ALL';
      if (fltActivity) fltActivity.value = 'ALL';
      if (fltActivityType) fltActivityType.value = 'ALL';
      if (fltStatus) fltStatus.value = 'ALL';
      if (fltClosure) fltClosure.value = 'ALL';
      if (fltDateFrom) fltDateFrom.value = '';
      if (fltDateTo) fltDateTo.value = '';
      renderGrid();
      showToast('تمت إعادة ضبط فلاتر الشيت', 'info');
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      ReportingService.exportToCSV(currentFilteredRows);
      showToast(`تم تصدير ${currentFilteredRows.length} صف إلى ملف Excel (.CSV) بنجاح`, 'success');
    });
  }

  renderGrid();
});
