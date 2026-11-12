/**
 * ADCO Field Operations System - sheets.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const Auth = global.AuthManager || global.AuthService;
    const Activity = global.ActivityManager || global.ActivityService;
    const Router = global.AppRouter;
    const Supervisor = global.SupervisorEngine;

    if (Auth && typeof Auth.checkAuthGuard === 'function') {
      Auth.checkAuthGuard('supervisor');
    }
    if (Router && typeof Router.init === 'function') {
      try {
        Router.init();
      } catch (err) {
        console.warn('Router init handled gracefully:', err);
      }
    }

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

    // Populate filter dropdowns from catalogs
    const catalogs = global.ADCO_CATALOGS || (typeof window !== 'undefined' ? window.ADCO_CATALOGS : null);
    if (catalogs) {
      if (fltClient && Array.isArray(catalogs.clients)) {
        catalogs.clients.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          fltClient.appendChild(opt);
        });
      }

      if (fltBrand && Array.isArray(catalogs.brands)) {
        catalogs.brands.forEach((b) => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          fltBrand.appendChild(opt);
        });
      }

      if (fltActivity && Array.isArray(catalogs.activities)) {
        catalogs.activities.forEach((a) => {
          const opt = document.createElement('option');
          opt.value = a;
          opt.textContent = a;
          fltActivity.appendChild(opt);
        });
      }

      if (fltActivityType && Array.isArray(catalogs.activityTypes)) {
        catalogs.activityTypes.forEach((t) => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          fltActivityType.appendChild(opt);
        });
      }
    }

    function normalizeArabic(str) {
      if (!str) return '';
      return String(str)
        .trim()
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئ]/g, 'ي');
    }

    let currentFilteredRows = [];

    function renderGrid() {
      const expanded = (Activity && typeof Activity.getExpandedBrandRows === 'function')
        ? Activity.getExpandedBrandRows()
        : [];
      const rawQ = (searchInput.value || '').trim();
      const q = normalizeArabic(rawQ);
      const selClient = fltClient.value;
      const selBrand = fltBrand.value;
      const selActivity = fltActivity.value;
      const selType = fltActivityType.value;
      const selStatus = fltStatus.value;
      const selClosure = fltClosure.value;
      const fromDate = (fltDateFrom.value || '').trim();
      const toDate = (fltDateTo.value || '').trim();

      currentFilteredRows = expanded.filter((r) => {
        // Search free text with Arabic normalization
        if (q) {
          const combined = normalizeArabic([
            r.id,
            r.coordinatorName,
            r.client,
            r.singleBrand,
            r.activity,
            r.activityType,
            r.reviewerName,
            r.branch,
            r.supervisorNotes,
            r.status
          ].filter(Boolean).join(' '));
          if (!combined.includes(q)) return false;
        }

        // Filter parameters
        if (selClient !== 'ALL' && r.client !== selClient) return false;
        if (selBrand !== 'ALL' && r.singleBrand !== selBrand) return false;
        if (selActivity !== 'ALL' && r.activity !== selActivity) return false;
        if (selType !== 'ALL' && r.activityType !== selType) return false;
        if (selStatus !== 'ALL' && r.status !== selStatus) return false;

        // Date range filter on activity date (Requirement 2)
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

      document.getElementById('total-rows-badge').textContent = `الصفوف المعروضة: ${currentFilteredRows.length} من أصل ${expanded.length} صف`;

      const tbody = document.getElementById('sheet-rows-mount');
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
            <td style="text-align:center;" dir="ltr">${r.magazineStartDate && r.magazineEndDate ? `${r.magazineStartDate} إلى ${r.magazineEndDate}` : (r.magazineDate || '-')}</td>
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
      el.addEventListener('change', renderGrid);
      el.addEventListener('input', renderGrid);
    });

    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      fltClient.value = 'ALL';
      fltBrand.value = 'ALL';
      fltActivity.value = 'ALL';
      fltActivityType.value = 'ALL';
      fltStatus.value = 'ALL';
      fltClosure.value = 'ALL';
      fltDateFrom.value = '';
      fltDateTo.value = '';
      renderGrid();
      showToast('تمت إعادة ضبط فلاتر الشيت', 'info');
    });

    const exportBtn = document.getElementById('export-excel-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (Supervisor && typeof Supervisor.exportToCSV === 'function') {
          Supervisor.exportToCSV(currentFilteredRows);
        } else if (Activity && typeof Activity.exportToCSV === 'function') {
          Activity.exportToCSV(currentFilteredRows);
        }
        if (typeof global.showToast === 'function') {
          global.showToast(`تم تصدير ${currentFilteredRows.length} صف إلى ملف Excel (.CSV) بنجاح`, 'success');
        }
      });
    }

    renderGrid();
})(typeof window !== 'undefined' ? window : globalThis);
