/**
 * ADCO Field Operations System - supervisor.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const user = AuthManager.checkAuthGuard('supervisor');
    try {
      if (global.AppRouter && typeof global.AppRouter.init === 'function') {
        global.AppRouter.init();
      }
    } catch (err) {
      console.warn('Router init handled gracefully:', err);
    }

    let statusFilter = 'ALL';
    let customSearchActive = false;
    let selectedBranchKey = null;

    const spParentClientSelect = document.getElementById('sp-filter-parent-client');
    const spBranchSelect = document.getElementById('sp-filter-branch');
    const spTopClientTag = document.getElementById('sp-top-client-tag');
    const spTopBranchBadge = document.getElementById('sp-top-branch-badge');

    function populateSpBranchDropdown(clientVal) {
      if (!spBranchSelect) return;
      const allActs = ActivityManager.getAllActivities();
      const matching = (!clientVal || clientVal === 'ALL')
        ? allActs
        : allActs.filter((a) => (a.client || '') === clientVal || (a.client || '').includes(clientVal));

      let branches = [...new Set(matching.map((a) => a.branch).filter(Boolean))];
      if (branches.length === 0 && clientVal && clientVal !== 'ALL' && ActivityManager.getBranchesForClient) {
        branches = ActivityManager.getBranchesForClient(clientVal);
      }
      if (branches.length === 0 && window.ADCO_CATALOGS && Array.isArray(window.ADCO_CATALOGS.branches)) {
        branches = window.ADCO_CATALOGS.branches;
      }

      spBranchSelect.innerHTML =
        '<option value="ALL">كل فروع العميل</option>' +
        branches.map((b) => `<option value="${b}">${b}</option>`).join('');
    }

    if (spParentClientSelect) {
      const allActs = ActivityManager.getAllActivities();
      const actClients = [...new Set(allActs.map((a) => a.client).filter(Boolean))];
      const catClients = (window.ADCO_CATALOGS && Array.isArray(window.ADCO_CATALOGS.clients)) ? window.ADCO_CATALOGS.clients : [];
      const mergedClients = [...new Set([...actClients, ...catClients])];

      spParentClientSelect.innerHTML =
        '<option value="ALL">جميع السلاسل والعملاء (الكل)</option>' +
        mergedClients.map((c) => `<option value="${c}">${c}</option>`).join('');

      populateSpBranchDropdown('ALL');

      spParentClientSelect.addEventListener('change', () => {
        const cVal = spParentClientSelect.value || 'ALL';
        selectedBranchKey = null;
        if (spTopClientTag) spTopClientTag.textContent = cVal === 'ALL' ? 'جميع العملاء' : cVal;
        populateSpBranchDropdown(cVal);
        if (spTopBranchBadge) spTopBranchBadge.textContent = 'كل الفروع';
        renderList();
      });
    }

    if (spBranchSelect) {
      spBranchSelect.addEventListener('change', () => {
        const bVal = spBranchSelect.value || 'ALL';
        selectedBranchKey = bVal === 'ALL' ? null : bVal;
        if (spTopBranchBadge) spTopBranchBadge.textContent = bVal === 'ALL' ? 'كل الفروع' : bVal;
        renderList();
      });
    }

    const supResetBranchBtn = document.getElementById('sup-reset-branch-filter');
    if (supResetBranchBtn) {
      supResetBranchBtn.addEventListener('click', () => {
        selectedBranchKey = null;
        if (spBranchSelect) spBranchSelect.value = 'ALL';
        if (spTopBranchBadge) spTopBranchBadge.textContent = 'كل الفروع';
        renderList();
      });
    }

    function syncSupFilterChipsUI() {
      document.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.st === statusFilter);
      });
    }

    function renderSupervisorBranchCards(allActivities) {
      const mount = document.getElementById('supervisor-branches-overview');
      if (!mount) return;

      if (supResetBranchBtn) {
        supResetBranchBtn.classList.toggle('is-hidden', !selectedBranchKey);
      }

      const branchMap = {};
      allActivities.forEach((act) => {
        const bName = act.branch || 'فرع سموحة - الإسكندرية';
        if (!branchMap[bName]) {
          branchMap[bName] = {
            branch: bName,
            client: act.client || 'فتح الله جملة ماركت (Fathalla)',
            supplyingBranch: act.coordinatorBranch || 'الإسكندرية - قطاع وسط',
            coordinators: new Set(),
            supervisorName: act.reviewerName || (user && user.fullName) || 'م. حسام الدين غانم',
            locationLabel: (act.location && act.location.address) ? act.location.address : bName,
            total: 0,
            accepted: 0,
            review: 0,
            rejected: 0,
            closed: 0
          };
        }
        const entry = branchMap[bName];
        if (act.coordinatorName) entry.coordinators.add(act.coordinatorName);
        if (act.isClosed) {
          entry.closed += 1;
        } else {
          entry.total += 1;
          if (act.status === 'Accepted') entry.accepted += 1;
          else if (act.status === 'Rejected') entry.rejected += 1;
          else entry.review += 1;
        }
      });

      const groups = Object.values(branchMap);
      mount.innerHTML = groups
        .map((bg) => {
          const isSelected = selectedBranchKey === bg.branch;
          const rawCoords = Array.from(bg.coordinators).join(' ، ') || '-';
          const coordsText = typeof formatTwoWordName === 'function' ? formatTwoWordName(rawCoords) : rawCoords;
          const branchUrl = `./branch-details.html?branch=${encodeURIComponent(bg.branch)}&client=${encodeURIComponent(bg.client)}`;
          return `
            <div class="branch-master-card ${isSelected ? 'active-branch-filter' : ''}" data-branch="${bg.branch}" data-href="${branchUrl}" role="link" tabindex="0" title="اضغط لفتح صفحة تفاصيل الفرع والأنشطة التابعة له">
              <div>
                <div class="branch-card-top">
                  <div>
                    <h4 class="branch-card-title">${bg.client}</h4>
                    <div class="branch-card-sub">
                      <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>${bg.branch}</span>
                    </div>
                  </div>
                  <span class="badge badge-mint">${bg.total} نشط</span>
                </div>

                <div style="margin: 10px 0;">
                  <span class="branch-supply-pill">
                    <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
                    <span>فرع الشركة المورد للبضاعة: <strong>${bg.supplyingBranch}</strong></span>
                  </span>
                </div>

                <div class="branch-meta-grid">
                  <div class="branch-meta-item">
                    <span class="branch-meta-label">المنسق الميداني</span>
                    <span class="branch-meta-val" title="${coordsText}">${coordsText}</span>
                  </div>
                  <div class="branch-meta-item">
                    <span class="branch-meta-label">المشرف المعتمد</span>
                    <span class="branch-meta-val" title="${bg.supervisorName}">${bg.supervisorName}</span>
                  </div>
                  <div class="branch-meta-item full-span">
                    <span class="branch-meta-label">الموقع الجغرافي للفرع</span>
                    <span class="branch-meta-val">
                      <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>${bg.locationLabel}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div class="branch-status-counters">
                <button type="button" class="status-counter-btn ${isSelected && statusFilter === 'ALL' ? 'active' : ''}" data-branch="${bg.branch}" data-st="ALL">
                  <span class="sc-num">${bg.total}</span>
                  <span class="sc-lbl">الكل</span>
                </button>
                <button type="button" class="status-counter-btn ${isSelected && statusFilter === 'Accepted' ? 'active' : ''}" data-branch="${bg.branch}" data-st="Accepted">
                  <span class="sc-num sc-accepted">${bg.accepted}</span>
                  <span class="sc-lbl">المقبولة</span>
                </button>
                <button type="button" class="status-counter-btn ${isSelected && statusFilter === 'Under Review' ? 'active' : ''} ${bg.review > 0 ? 'glowing-under-review' : ''}" data-branch="${bg.branch}" data-st="Under Review">
                  <span class="sc-num sc-review">${bg.review}</span>
                  <span class="sc-lbl">بانتظار</span>
                </button>
                <button type="button" class="status-counter-btn ${isSelected && statusFilter === 'Rejected' ? 'active' : ''}" data-branch="${bg.branch}" data-st="Rejected">
                  <span class="sc-num sc-rejected">${bg.rejected}</span>
                  <span class="sc-lbl">المرفوضة</span>
                </button>
                <button type="button" class="status-counter-btn ${isSelected && statusFilter === 'CLOSED' ? 'active' : ''}" data-branch="${bg.branch}" data-st="CLOSED">
                  <span class="sc-num sc-closed">${bg.closed}</span>
                  <span class="sc-lbl">المنتهية</span>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      mount.querySelectorAll('.branch-master-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.status-counter-btn')) return;
          const targetHref = card.dataset.href;
          if (targetHref) {
            if (global.AppRouter && typeof global.AppRouter.navigateTo === 'function') {
              global.AppRouter.navigateTo(targetHref);
            } else {
              window.location.href = targetHref;
            }
          }
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.target.closest('.status-counter-btn')) {
            const targetHref = card.dataset.href;
            if (targetHref) {
              if (global.AppRouter && typeof global.AppRouter.navigateTo === 'function') {
                global.AppRouter.navigateTo(targetHref);
              } else {
                window.location.href = targetHref;
              }
            }
          }
        });
      });

      mount.querySelectorAll('.status-counter-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const bName = btn.dataset.branch;
          const st = btn.dataset.st;
          if (selectedBranchKey === bName && statusFilter === st) {
            selectedBranchKey = null;
            statusFilter = 'ALL';
          } else {
            selectedBranchKey = bName;
            statusFilter = st;
          }
          syncSupFilterChipsUI();
          renderList();
        });
      });
    }

    const modal = document.getElementById('review-modal');
    const auditModal = document.getElementById('activity-audit-modal');
    const lightboxModal = document.getElementById('photo-lightbox');
    const roundSelect = document.getElementById('rev-round-select');
    const inputNewAct = document.getElementById('eval-score-new-act');
    const inputQuality = document.getElementById('eval-score-quality');
    const inputContinuity = document.getElementById('eval-score-continuity');
    const inputDocs = document.getElementById('eval-score-docs');
    const evalTotalBadge = document.getElementById('eval-live-total-badge');

    // Custom Search Elements
    const customSearchPanel = document.getElementById('custom-search-panel');
    const toggleCsBtn = document.getElementById('toggle-custom-search-btn');
    const csClient = document.getElementById('cs-client');
    const csBrand = document.getElementById('cs-brand');
    const csActivity = document.getElementById('cs-activity');
    const csType = document.getElementById('cs-activity-type');
    const csCoord = document.getElementById('cs-coord');
    const csMinScore = document.getElementById('cs-min-score');
    const csApplyBtn = document.getElementById('cs-apply-btn');
    const csResetBtn = document.getElementById('cs-reset-btn');
    const csCountBadge = document.getElementById('custom-search-count-badge');

    // Populate Custom Search dropdowns from catalogs
    if (window.ADCO_CATALOGS) {
      ADCO_CATALOGS.clients.forEach((c) => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        csClient.appendChild(o);
      });
      ADCO_CATALOGS.brands.forEach((b) => {
        const o = document.createElement('option');
        o.value = b;
        o.textContent = b;
        csBrand.appendChild(o);
      });
      ADCO_CATALOGS.activities.forEach((a) => {
        const o = document.createElement('option');
        o.value = a;
        o.textContent = a;
        csActivity.appendChild(o);
      });
      ADCO_CATALOGS.activityTypes.forEach((t) => {
        const o = document.createElement('option');
        o.value = t;
        o.textContent = t;
        csType.appendChild(o);
      });
    }

    toggleCsBtn.addEventListener('click', () => {
      const isVisible = customSearchPanel.style.display === 'block';
      customSearchPanel.style.display = isVisible ? 'none' : 'block';
      toggleCsBtn.classList.toggle('active', !isVisible);
    });

    csApplyBtn.addEventListener('click', () => {
      customSearchActive = true;
      renderList();
      showToast('تم تطبيق الفلترة المخصصة', 'success');
    });

    csResetBtn.addEventListener('click', () => {
      csClient.value = 'ALL';
      csBrand.value = 'ALL';
      csActivity.value = 'ALL';
      csType.value = 'ALL';
      csCoord.value = '';
      csMinScore.value = '0';
      customSearchActive = false;
      renderList();
      showToast('تمت إعادة ضبط الفلاتر المخصصة', 'info');
    });

    function updateEvalTotal() {
      const s1 = Math.min(40, Math.max(0, Number(inputNewAct.value) || 0));
      const s2 = Math.min(20, Math.max(0, Number(inputQuality.value) || 0));
      const s3 = Math.min(25, Math.max(0, Number(inputContinuity.value) || 0));
      const s4 = Math.min(15, Math.max(0, Number(inputDocs.value) || 0));
      const total = Math.min(100, Math.round(s1 + s2 + s3 + s4));
      evalTotalBadge.textContent = `${total} / 100 نقطة`;
      if (total >= 80) {
        evalTotalBadge.className = 'badge badge-success';
      } else if (total >= 60) {
        evalTotalBadge.className = 'badge badge-warning';
      } else {
        evalTotalBadge.className = 'badge badge-danger';
      }
      const headerBadge = document.getElementById('eval-live-total-badge-header');
      if (headerBadge) {
        headerBadge.textContent = `${total} / 100 نقطة`;
        headerBadge.className = evalTotalBadge.className;
      }
    }

    [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((el) => {
      el.addEventListener('input', updateEvalTotal);
    });

    document.getElementById('close-review-modal').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    document.getElementById('close-audit-modal').addEventListener('click', () => {
      auditModal.classList.remove('active');
    });
    auditModal.addEventListener('click', (e) => {
      if (e.target === auditModal) auditModal.classList.remove('active');
    });

    document.getElementById('close-lightbox-btn').addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });

    function openSupervisorLightbox(photoUrl, title, timestamp, uploader) {
      document.getElementById('lb-image').src = photoUrl;
      document.getElementById('lb-round-title').textContent = title || 'معاينة الصورة الميدانية';
      document.getElementById('lb-timestamp').textContent = timestamp || '';
      document.getElementById('lb-uploader').textContent = uploader || 'المنسق الميداني';
      lightboxModal.classList.add('active');
    }

    function renderList() {
      let rawAll = ActivityManager.getAllActivities();

      // Apply top Parent Client & Branch filters
      const topClientVal = spParentClientSelect ? spParentClientSelect.value : 'ALL';
      const topBranchVal = spBranchSelect ? spBranchSelect.value : 'ALL';

      if (topClientVal && topClientVal !== 'ALL') {
        rawAll = rawAll.filter((a) => (a.client || '') === topClientVal || (a.client || '').includes(topClientVal));
      }
      if (topBranchVal && topBranchVal !== 'ALL') {
        rawAll = rawAll.filter((a) => (a.branch || '') === topBranchVal || (a.branch || '').includes(topBranchVal));
      }

      renderSupervisorBranchCards(rawAll);

      const all = selectedBranchKey
        ? rawAll.filter((a) => (a.branch || '') === selectedBranchKey)
        : rawAll;

      const activePool = all.filter((a) => !a.isClosed);
      const closedPool = all.filter((a) => a.isClosed);

      const cntAllEl = document.getElementById('sp-cnt-all');
      const cntClosureEl = document.getElementById('sp-cnt-closure');
      const cntReviewEl = document.getElementById('sp-cnt-review');
      const cntAcceptedEl = document.getElementById('sp-cnt-accepted');
      const cntRejectedEl = document.getElementById('sp-cnt-rejected');
      const cntClosedEl = document.getElementById('sp-cnt-closed');

      if (cntAllEl) cntAllEl.textContent = activePool.length;
      if (cntClosureEl) cntClosureEl.textContent = activePool.filter((a) => a.closureRequested).length;
      const reviewPendingCount = activePool.filter((a) => a.status === 'Under Review').length;
      if (cntReviewEl) {
        cntReviewEl.textContent = reviewPendingCount;
        const reviewChip = cntReviewEl.closest('.filter-chip');
        if (reviewChip) {
          if (reviewPendingCount > 0) {
            reviewChip.classList.add('glowing-under-review');
          } else {
            reviewChip.classList.remove('glowing-under-review');
          }
        }
      }
      if (cntAcceptedEl) cntAcceptedEl.textContent = activePool.filter((a) => a.status === 'Accepted').length;
      if (cntRejectedEl) cntRejectedEl.textContent = activePool.filter((a) => a.status === 'Rejected').length;
      if (cntClosedEl) cntClosedEl.textContent = closedPool.length;

      let filtered = [];

      // Requirement 9: Closed activities disappear from active list and only appear in "CLOSED" tab
      if (statusFilter === 'CLOSED') {
        filtered = closedPool;
      } else {
        const activeOnly = activePool;
        if (statusFilter === 'ALL') {
          filtered = activeOnly;
        } else if (statusFilter === 'CLOSURE_PENDING') {
          filtered = activeOnly.filter((a) => a.closureRequested);
        } else {
          filtered = activeOnly.filter((a) => a.status === statusFilter);
        }
      }

      // Requirement 10: Apply Custom Search filter parameters if set
      if (customSearchActive) {
        const clientVal = csClient.value;
        const brandVal = csBrand.value;
        const actVal = csActivity.value;
        const typeVal = csType.value;
        const coordQuery = (csCoord.value || '').trim().toLowerCase().replace(/[أإآا]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[ىي]/g, 'ي');
        const minScore = Number(csMinScore.value) || 0;

        filtered = filtered.filter((act) => {
          if (clientVal !== 'ALL' && act.client !== clientVal) return false;
          if (brandVal !== 'ALL' && !(act.brands || []).includes(brandVal)) return false;
          if (actVal !== 'ALL' && act.activity !== actVal) return false;
          if (typeVal !== 'ALL' && act.activityType !== typeVal) return false;
          if (coordQuery) {
            const coordNorm = (act.coordinatorName || '').toLowerCase().replace(/[أإآا]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[ىي]/g, 'ي');
            if (!coordNorm.includes(coordQuery)) return false;
          }

          if (minScore > 0) {
            const stats = ActivityManager.computeWeightedEvaluation(act);
            if (stats.totalWeightedScore < minScore) return false;
          }
          return true;
        });

        csCountBadge.textContent = `${filtered.length} بطاقة مطابقة`;
      } else {
        csCountBadge.textContent = 'بحث مخصص';
      }

      const container = document.getElementById('supervisor-cards-mount');

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="card" style="text-align:center; padding:40px; grid-column: 1 / -1; color: var(--adco-gray-600);">
            <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xl" style="opacity: 0.5; margin-bottom: 8px;" alt="" />
            <p style="margin: 0; font-size: 0.95rem;">لا توجد بطاقات في هذا التصنيف حالياً.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered
        .map((act) => {
          const ratingStats = ActivityManager.computeOverallRating(act);
          const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
          const shareVal = (1 / brandCount).toFixed(2);
          const sharePct = Math.round((1 / brandCount) * 100);

          return `
            <div class="card supervisor-activity-card ${act.isClosed ? 'sp-card-closed' : act.closureRequested ? 'sp-card-pending' : ''}">
              <div class="sp-card-body">
                ${
                  act.isClosed
                    ? `
                  <div style="background: #ffffff; border: 1px solid #86efac; border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #166534; font-weight: 700;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                      <img src="../assets/icons/archive.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>نشاط منتهي ومفكك (${act.closureReasonType || 'بقرار المشرف'})</span>
                    </span>
                    <span style="font-size: 0.72rem; font-weight: normal; color: #15803d;" dir="ltr">${formatDateTime(act.closedAt)}</span>
                  </div>
                `
                    : act.closureRequested
                    ? `
                  <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                      <div style="font-size: 0.84rem; color: #92400e; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <img src="../assets/icons/clock.svg" class="ui-icon ui-icon-xs" alt="" />
                        <span>طلب إنهاء النشاط من المنسق</span>
                      </div>
                      <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn btn-primary btn-sm btn-accept-closure" data-id="${act.id}" style="padding: 4px 10px; font-size: 0.76rem; min-height: 28px;">
                          موافقة وإغلاق
                        </button>
                        <button type="button" class="btn btn-danger-subtle btn-sm btn-reject-closure" data-id="${act.id}" style="padding: 4px 10px; font-size: 0.76rem; min-height: 28px;">
                          رفض
                        </button>
                      </div>
                    </div>
                    <div style="font-size: 0.78rem; color: #78350f;">
                      سبب الإنهاء: <strong style="color: #451a03;">${act.closureReasonType || 'انتهاء المدة'}</strong>
                      ${act.closureNotes && act.closureNotes !== act.closureReasonType ? `<span style="margin-right: 4px;">(${act.closureNotes})</span>` : ''}
                    </div>
                  </div>
                `
                    : ''
                }

                <!-- Coordinator info & status header at top -->
                <div class="sp-coord-header-row">
                  <div class="sp-coord-badge">
                    <img src="../assets/icons/user.svg" class="ui-icon ui-icon-xs" alt="" />
                    <span>المنسق: <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName}</strong></span>
                  </div>
                  <span class="badge badge-mint">${act.coordinatorBranch || 'قطاع وسط'}</span>
                </div>

                <!-- Media row: Photo & Branch/Activity details -->
                <div class="sp-card-media-row">
                  <img src="${act.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80'}" alt="${act.client}" class="supervisor-card-img" data-img="${act.photoUrl}" data-title="${act.client}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';" style="width:96px; height:96px; border-radius:12px; object-fit:cover; flex-shrink:0; border:1px solid var(--adco-gray-200); cursor: pointer;" title="اضغط للتكبير والفحص عالي الدقة" />
                  <div class="sp-card-details-col">
                    <div class="sp-card-client-line">
                      <strong class="sp-card-client-title">${act.client}</strong>
                      ${renderStatusBadge(act.status)}
                    </div>
                    <div class="branch-card-sub" style="margin-bottom:4px;">
                      <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>${act.branch}</span>
                    </div>
                    <p class="sp-card-activity-line">النشاط: <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong></p>
                    <div class="branch-supply-pill" style="margin: 4px 0;">
                      <span>فرع الشركة المورد للبضاعة: <strong>${act.coordinatorBranch || 'الإسكندرية - قطاع وسط'}</strong></span>
                    </div>
                    <p style="font-size:0.75rem; color:var(--adco-gray-600); margin:2px 0;">المشرف المعتمد: <strong>${act.reviewerName || 'أيمن الروبي'}</strong></p>
                    <p class="sp-card-brands-line">العلامات: ${(act.brands || []).join('، ')} • حصة البراند: <span dir="ltr">${shareVal}</span> (${sharePct}%)</p>
                  </div>
                </div>
              </div>

              <!-- Numerical Rating Box (Placed at absolute bottom on mobile screens) -->
              <div class="sp-rating-box">
                <div class="sp-rating-box-inner">
                  <div class="sp-rating-badge">
                    <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
                    <strong>${ratingStats.badgeText}</strong>
                  </div>
                  <span class="sp-rating-sessions">(${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'متابعة' : 'متابعات'})</span>
                </div>
                ${act.supervisorNotes ? `<div class="sp-rating-notes">${act.supervisorNotes}</div>` : ''}
              </div>

              <!-- Action buttons -->
              <div class="sp-card-actions">
                <a href="./evaluation.html?id=${act.id}" class="btn btn-primary btn-sm open-eval-btn" data-id="${act.id}">
                  <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>الفحص والتقييم</span>
                </a>
                <button type="button" class="btn btn-secondary btn-sm open-audit-btn" data-id="${act.id}" title="عرض سجل كافة المتابعات والإجراءات">
                  <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>المتابعات</span>
                </button>
                ${
                  !act.isClosed
                    ? `
                  <button type="button" class="btn btn-danger-subtle btn-sm btn-direct-close" data-id="${act.id}" title="إنهاء النشاط فورياً بقرار المشرف المباشر دون انتظار طلب">
                    <img src="../assets/icons/x-circle.svg" class="ui-icon ui-icon-xs" alt="" />
                    <span>إنهاء فورياً</span>
                  </button>
                `
                    : ''
                }
              </div>
            </div>
          `;
        })
        .join('');

      // Wire image lightbox zoom for supervisor
      document.querySelectorAll('.supervisor-card-img').forEach((img) => {
        img.addEventListener('click', () => {
          openSupervisorLightbox(img.dataset.img, img.dataset.title, '', 'مشرف العمليات');
        });
      });

      // Requirement 8: Guard against accepting closure if waiting review exists
      document.querySelectorAll('.btn-accept-closure').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const actId = btn.dataset.id;
          const act = ActivityManager.getActivityById(actId);
          if (!act) return;

          const hasPendingReview =
            act.status === 'Under Review' ||
            (Array.isArray(act.followUpHistory) && act.followUpHistory.some((s) => s.reviewStatus === 'Under Review' || s.sessionScore === null));

          if (hasPendingReview) {
            alert('لا يمكن اعتماد إنهاء النشاط:\n\nتوجد جولات متابعة أو تقييمات قيد المراجعة لم يتم فحصها واعتمادها بعد.\n\nيرجى الضغط على زر "فحص وتقييم" واعتماد النشاط أولاً قبل قبول إنهائه.');
            return;
          }

          if (!confirm('هل توافق على إنهاء وتفكيك هذا النشاط وإغلاق دورته رسمياً؟')) return;
          try {
            await ActivityManager.processClosureRequest(actId, 'COMPLETED', 'تمت الموافقة على إنهاء النشاط واعتماد التفكيك');
            showToast('تم اعتماد إنهاء النشاط وأرشفته في الأنشطة المنتهية', 'success');
            renderList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      // Reject closure request
      document.querySelectorAll('.btn-reject-closure').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const actId = btn.dataset.id;
          const reason = prompt('يرجى كتابة سبب رفض إنهاء النشاط للمنسق:', 'النشاط ما زال سارياً ومطلوب استمرار العرض بالفرع');
          if (reason === null) return;
          try {
            await ActivityManager.processClosureRequest(actId, 'REJECTED', reason);
            showToast('تم رفض طلب إنهاء النشاط وإشعار المنسق', 'info');
            renderList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      // Direct Supervisor Activity Termination
      document.querySelectorAll('.btn-direct-close').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const actId = btn.dataset.id;
          const act = ActivityManager.getActivityById(actId);
          const clientName = act ? act.client : actId;
          if (!confirm(`هل تريد إنهاء وتفكيك نشاط "${clientName}" فورياً بقرار إداري مباشر دون الحاجة لطلب من المنسق؟`)) return;
          const feedback = prompt('ملاحظات وتوجيهات المشرف عند الإغلاق المباشر (اختياري):', 'تم إنهاء النشاط وتفكيك المعروضات بقرار مباشر من المشرف');
          if (feedback === null) return;
          try {
            await ActivityManager.directCloseActivity(actId, feedback);
            showToast('تم إنهاء وتفكيك النشاط فورياً بنجاح', 'success');
            renderList();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      // Requirement 7: Open Audit Trail & Action History Modal
      document.querySelectorAll('.open-audit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = ActivityManager.getActivityById(btn.dataset.id);
          if (!act) return;
          renderActivityAuditModal(act);
          auditModal.classList.add('active');
        });
      });

    let currentEvaluatingActivity = null;
    let currentModalMedia = {
      photoUrl: '',
      title: '',
      timestamp: '',
      uploader: ''
    };

    function renderReviewActDetails(act) {
      const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
      const shareVal = (1 / brandCount).toFixed(2);
      const sharePct = Math.round((1 / brandCount) * 100);
      const ratingStats = ActivityManager.computeOverallRating(act);

      return `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <div>
            <h4 style="margin: 0 0 2px 0; color: var(--adco-green-deep); font-size: 1.05rem;">${act.client}</h4>
            <span style="font-size: 0.78rem; color: var(--adco-gray-600);">${act.branch}</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <span class="badge badge-warning" style="font-weight: 700; font-size: 0.78rem;">
              <img src="../assets/icons/star.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>${ratingStats.badgeText}</span>
            </span>
            ${renderStatusBadge(act.status)}
          </div>
        </div>

        <div class="responsive-form-grid" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; font-size: 0.78rem; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--adco-gray-200);">
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">المنسق الميداني:</span>
            <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName}</strong>
          </div>
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">قطاع المنسق:</span>
            <strong>${act.coordinatorBranch || act.branch}</strong>
          </div>
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">النشاط والنوع:</span>
            <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong>
          </div>
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">المنتج (SKU):</span>
            <strong>${act.skuVariant || 'الجميع'}</strong>
          </div>
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">تاريخ بدء النشاط:</span>
            <strong dir="ltr" style="color: var(--adco-green-deep);">${act.activityDateFormatted || (act.activityDate ? formatDateTime(act.activityDate) : formatDateTime(act.timestamp))}</strong>
          </div>
          <div>
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">تاريخ انتهاء النشاط:</span>
            <strong dir="ltr">${act.endDate || (act.closedAt ? formatDateTime(act.closedAt) : 'نشط ومستمر')}</strong>
          </div>
          <div style="grid-column: 1 / -1;">
            <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">العلامات التجارية وحصة العرض:</span>
            <strong style="color: var(--adco-green-dark);">${(act.brands || []).join('، ')} • حصة البراند: <span dir="ltr">${shareVal}</span> (${sharePct}%)</strong>
          </div>
          ${act.magazineDate ? `
            <div style="grid-column: 1 / -1;">
              <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">تاريخ إصدار المجلة:</span>
              <strong></strong>
            </div>
          ` : ''}
        </div>
      `;
    }

    function updateReviewModalMedia(roundNum) {
      if (!currentEvaluatingActivity) return;
      const act = currentEvaluatingActivity;
      const sessions = act.followUpHistory || [];
      const session = sessions.find((s) => Number(s.roundNumber) === Number(roundNum)) || sessions[sessions.length - 1];

      let photoUrl = act.photoUrl;
      let title = `توثيق نشاط ${act.client}`;
      let timestamp = act.createdAt || new Date().toISOString();
      let loc = act.location || { latitude: 31.2156, longitude: 29.9553, accuracy: 12, address: act.branch };

      if (session) {
        title = `${session.roundTitle} — ${act.client}`;
        if (session.timestamp) timestamp = session.timestamp;
        if (session.location) loc = session.location;
        if (session.photos && session.photos.length > 0) {
          photoUrl = session.photos[0].photoUrl;
          if (session.photos[0].capturedAt) timestamp = session.photos[0].capturedAt;
        }
      }

      currentModalMedia = {
        photoUrl,
        title,
        timestamp: formatDateTime(timestamp),
        uploader: act.coordinatorName
      };

      const revImg = document.getElementById('rev-photo-img');
      const fallbackUrl = act.photoUrl;
      revImg.onerror = () => {
        revImg.onerror = null;
        revImg.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
      };
      revImg.src = photoUrl || fallbackUrl;
      currentModalMedia.photoUrl = revImg.src;
      document.getElementById('rev-photo-title').textContent = title;
      document.getElementById('rev-timestamp').textContent = currentModalMedia.timestamp;

      const latNum = loc && loc.latitude !== undefined ? Number(loc.latitude) : 31.2156;
      const lngNum = loc && loc.longitude !== undefined ? Number(loc.longitude) : 29.9553;
      const lat = latNum.toFixed(5);
      const lng = lngNum.toFixed(5);
      const accuracyVal = loc && loc.accuracy ? Math.round(Number(loc.accuracy)) : 12;

      const locCoordsEl = document.getElementById('rev-loc-coords');
      const locAccEl = document.getElementById('rev-loc-accuracy');
      const locMapLinkEl = document.getElementById('rev-loc-map-link');
      if (locCoordsEl) locCoordsEl.innerHTML = `${lat}&deg; N, ${lng}&deg; E`;
      if (locAccEl) locAccEl.innerHTML = `دقة الرصد: &plusmn;${accuracyVal} متر &bull; ${loc.address || act.branch || 'الإسكندرية'}`;
      if (locMapLinkEl) locMapLinkEl.href = `https://www.google.com/maps?q=${lat},${lng}`;

      // Resolve Branch Registered Coordinates & Compute Haversine Proximity (Task 1)
      const branchCoords = typeof ActivityManager.getBranchCoordinatesSync === 'function'
        ? ActivityManager.getBranchCoordinatesSync(act.branch)
        : { latitude: 31.2156, longitude: 29.9553 };
      const bLatNum = Number(branchCoords.latitude);
      const bLngNum = Number(branchCoords.longitude);
      const bLat = bLatNum.toFixed(5);
      const bLng = bLngNum.toFixed(5);

      const branchCoordsEl = document.getElementById('rev-branch-coords');
      const branchNameLblEl = document.getElementById('rev-branch-name-lbl');
      const branchMapLinkEl = document.getElementById('rev-branch-map-link');
      if (branchCoordsEl) branchCoordsEl.innerHTML = `${bLat}&deg; N, ${bLng}&deg; E`;
      if (branchNameLblEl) branchNameLblEl.textContent = act.branch || 'الفرع الرسمي المسجل';
      if (branchMapLinkEl) branchMapLinkEl.href = `https://www.google.com/maps?q=${bLat},${bLng}`;

      const maxThresholdMeters = typeof ActivityManager.MAX_BRANCH_PROXIMITY_METERS === 'number'
        ? ActivityManager.MAX_BRANCH_PROXIMITY_METERS
        : 150;
      const distMeters = typeof ActivityManager.calculateHaversineDistanceMeters === 'function'
        ? Math.round(ActivityManager.calculateHaversineDistanceMeters(bLatNum, bLngNum, latNum, lngNum))
        : 0;
      const isWithinRange = distMeters <= maxThresholdMeters;

      const proxBadgeEl = document.getElementById('rev-gps-proximity-badge');
      const distBannerEl = document.getElementById('rev-gps-distance-banner');
      const distValEl = document.getElementById('rev-gps-distance-value');
      const compareLinkEl = document.getElementById('rev-gps-compare-link');

      if (proxBadgeEl) {
        proxBadgeEl.textContent = isWithinRange ? `مطابق للنطاق (≤ ${maxThresholdMeters}م)` : `خارج النطاق (> ${maxThresholdMeters}م)`;
        proxBadgeEl.className = `badge ${isWithinRange ? 'badge-success' : 'badge-danger'} sp-s44`;
      }
      if (distBannerEl) {
        distBannerEl.className = `gps-distance-banner ${isWithinRange ? 'gps-distance-ok' : 'gps-distance-warn'}`;
      }
      if (distValEl) {
        distValEl.textContent = distMeters <= 3
          ? `${distMeters} متر (تطابق تام بموقع الفرع)`
          : `${distMeters} متر ${isWithinRange ? '(داخل النطاق المسموح)' : '(بعيد عن موقع الفرع المسجل)'}`;
      }
      if (compareLinkEl) {
        compareLinkEl.href = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${bLat},${bLng}&travelmode=walking`;
      }

      // Populate EXIF & Photo Origin Metadata (Requirement 2 & 4)
      const currentPhotoObj = session && session.photos && session.photos.length > 0 ? session.photos[0] : (act.initialPhotos && act.initialPhotos.length > 0 ? act.initialPhotos[0] : null);
      const meta = currentPhotoObj && currentPhotoObj.metadata ? currentPhotoObj.metadata : null;

      const originBadgeEl = document.getElementById('rev-photo-origin-badge');
      const originLabelEl = document.getElementById('rev-photo-origin-label');
      const takenTimeEl = document.getElementById('rev-photo-taken-time');
      const deviceModelEl = document.getElementById('rev-photo-device-model');

      if (meta) {
        originBadgeEl.textContent = meta.originBadge || 'كاميرا مباشرة';
        originBadgeEl.className = `badge ${meta.originBadgeClass || 'badge-success'}`;
        originLabelEl.textContent = meta.originLabel || 'التقاط مباشر عبر كاميرا الهاتف';
        takenTimeEl.textContent = meta.takenAtEgypt || formatDateTime(timestamp);
        deviceModelEl.textContent = meta.deviceModel || 'كاميرا الهاتف الميداني';
      } else {
        originBadgeEl.textContent = 'كاميرا مباشرة';
        originBadgeEl.className = 'badge badge-success';
        originLabelEl.textContent = 'التقاط مباشر عبر كاميرا هاتف المنسق';
        takenTimeEl.textContent = formatDateTime(timestamp);
        deviceModelEl.textContent = 'هاتف منسق أدكو المعتمد';
      }
    }

    // Sync Quick Evaluation Status Buttons (next to Location Review) with #rev-status select (Task 1)
    const revStatusSelect = document.getElementById('rev-status');
    const quickStatusReadout = document.getElementById('rev-quick-status-current');
    const quickStatusBtns = document.querySelectorAll('.rev-quick-status-btn');

    function syncQuickStatusUI(statusVal) {
      const normalized = statusVal || 'Accepted';
      if (revStatusSelect && revStatusSelect.value !== normalized) {
        revStatusSelect.value = normalized;
      }
      const statusLabels = {
        'Accepted': 'مقبول',
        'Rejected': 'غير مقبول',
        'Under Review': 'تحت المراجعة'
      };
      if (quickStatusReadout) {
        quickStatusReadout.textContent = statusLabels[normalized] || 'مقبول';
        quickStatusReadout.setAttribute('data-state', normalized);
      }
      quickStatusBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.status === normalized);
      });
    }

    quickStatusBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        syncQuickStatusUI(btn.dataset.status);
      });
    });

    if (revStatusSelect) {
      revStatusSelect.addEventListener('change', () => {
        syncQuickStatusUI(revStatusSelect.value);
      });
    }

    // Wire round select change to update displayed media
    roundSelect.addEventListener('change', () => {
      updateReviewModalMedia(roundSelect.value);
    });

    // Wire zoom click on review photo
    document.getElementById('rev-photo-click-area').addEventListener('click', () => {
      if (!currentModalMedia.photoUrl) return;
      openSupervisorLightbox(
        currentModalMedia.photoUrl,
        currentModalMedia.title,
        currentModalMedia.timestamp,
        currentModalMedia.uploader
      );
    });

    // Wire view history button inside review modal
    document.getElementById('rev-view-history-btn').addEventListener('click', () => {
      if (!currentEvaluatingActivity) return;
      renderActivityAuditModal(currentEvaluatingActivity);
      auditModal.classList.add('active');
    });

      // Open standalone evaluation page (immune to swipe dismissal & refresh safe)
      document.querySelectorAll('.open-eval-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const actId = btn.dataset.id;
          if (!actId) return;
          const targetUrl = `./evaluation.html?id=${encodeURIComponent(actId)}`;
          if (window.AppRouter && typeof window.AppRouter.navigateTo === 'function') {
            window.AppRouter.navigateTo(targetUrl);
          } else {
            window.location.href = targetUrl;
          }
        });
      });
    }

    // Render comprehensive Audit Trail & Actions History (Requirement 7)
    function renderActivityAuditModal(act) {
      const content = document.getElementById('audit-modal-content');
      const sessions = act.followUpHistory || [];
      const loc = act.location || { latitude: 31.2156, longitude: 29.9553, address: act.branch || 'الإسكندرية' };
      const branchCoords = typeof ActivityManager.getBranchCoordinatesSync === 'function'
        ? ActivityManager.getBranchCoordinatesSync(act.branch)
        : { latitude: 31.2156, longitude: 29.9553 };
      const cLat = Number(loc.latitude || 31.2156).toFixed(5);
      const cLng = Number(loc.longitude || 29.9553).toFixed(5);
      const bLat = Number(branchCoords.latitude || 31.2156).toFixed(5);
      const bLng = Number(branchCoords.longitude || 29.9553).toFixed(5);
      const auditDistMeters = typeof ActivityManager.calculateHaversineDistanceMeters === 'function'
        ? Math.round(ActivityManager.calculateHaversineDistanceMeters(Number(bLat), Number(bLng), Number(cLat), Number(cLng)))
        : 0;
      const auditInRange = auditDistMeters <= (ActivityManager.MAX_BRANCH_PROXIMITY_METERS || 150);

      content.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; color: var(--adco-green-deep);">${act.client}</h3>
            ${renderStatusBadge(act.status)}
          </div>
          <div style="font-size: 0.84rem; color: #475569;">
            <span>كود النشاط: <strong>${act.id}</strong></span> |
            <span>المنسق: <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName}</strong></span> |
            <span>الفرع: <strong>${act.branch}</strong></span>
          </div>
          <div style="font-size: 0.8rem; color: var(--adco-green-dark); margin-top: 4px;">
            <span>النشاط: <strong>${act.activity || '-'} (${act.activityType || '-'} &times; ${act.activityCount || 1})</strong></span> |
            <span>العلامات: <strong>${(act.brands || []).join(' ، ')}</strong></span>
          </div>
          <div style="font-size: 0.8rem; color: #1e293b; margin-top: 6px; display: flex; gap: 14px; flex-wrap: wrap; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <span>تاريخ بدء النشاط: <strong dir="ltr">${act.activityDateFormatted || (act.activityDate ? formatDateTime(act.activityDate) : formatDateTime(act.timestamp))}</strong></span>
            <span>تاريخ انتهاء النشاط: <strong dir="ltr">${act.endDate || (act.closedAt ? formatDateTime(act.closedAt) : 'نشط ومستمر')}</strong></span>
          </div>
        </div>

        <h4 style="margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
          <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-sm" alt="" />
          <span>التسلسل الزمني لكافة الإجراءات والمتابعات:</span>
        </h4>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- 1. Founding Creation Event -->
          <div style="border-right: 3px solid var(--adco-green-primary); padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
              <strong style="color: var(--adco-green-deep); font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                <img src="../assets/icons/plus-circle.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>إجراء التأسيس والإنشاء الأولي</span>
              </strong>
              <span class="badge badge-mint" dir="ltr" style="font-family: monospace;">${formatDateTime(act.timestamp)}</span>
            </div>
            <p style="font-size: 0.82rem; margin: 4px 0; color: #334155;">
              تم إنشاء البطاقة بواسطة المنسق <strong>${act.coordinatorName}</strong> (${act.coordinatorId}) وتوثيق عرض <strong>${act.skuVariant}</strong>.
            </p>
            <div style="font-size: 0.78rem; color: #065f46; display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span>لوكيشن المنسق: <strong dir="ltr">${cLat}&deg;, ${cLng}&deg;</strong></span>
              <span>|</span>
              <span>لوكيشن الفرع: <strong dir="ltr">${bLat}&deg;, ${bLng}&deg;</strong></span>
              <span class="badge ${auditInRange ? 'badge-success' : 'badge-danger'}" style="font-size: 0.68rem;">المسافة: ${auditDistMeters} متر</span>
              <a href="https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${bLat},${bLng}&travelmode=walking" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; min-height: 22px;">مقارنة بالخريطة</a>
            </div>
          </div>

          <!-- 2. Follow-Up Photo Sessions -->
          ${sessions
            .map(
              (s) => `
            <div style="border-right: 3px solid #3b82f6; padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #1e40af; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>${s.roundTitle}</span>
                </strong>
                <span class="badge badge-secondary" dir="ltr" style="font-family: monospace;">${s.timestamp}</span>
              </div>
              <p style="font-size: 0.82rem; margin: 4px 0; color: #334155;">
                رفع الصور الميدانية بواسطة: <strong>${s.uploadedBy}</strong> | حالة التقييم: ${renderStatusBadge(s.reviewStatus || 'Under Review')}
              </p>
              ${
                s.location
                  ? `
                <div style="font-size: 0.78rem; color: #1e3a8a; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>موقع الهاتف GPS: ${s.location.latitude}&deg;, ${s.location.longitude}&deg;</span>
                </div>
              `
                  : ''
              }

              <!-- Thumbnails with Click to Zoom for Supervisor -->
              <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                ${(s.photos || [])
                  .map(
                    (p) => `
                  <div style="position: relative; cursor: pointer;" onclick="openSupervisorLightbox('${p.photoUrl}', '${s.roundTitle}', '${p.capturedAt || s.timestamp}', '${s.uploadedBy}')">
                    <img src="${p.photoUrl}" alt="${s.roundTitle}" style="width: 80px; height: 80px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1;" />
                    <span style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.68rem; padding: 1px 4px; border-radius: 3px;">${p.sizeKb || 170}KB</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}

          <!-- 3. Reviewer Action Event -->
          ${
            act.reviewedAt || act.supervisorNotes
              ? `
            <div style="border-right: 3px solid #10b981; padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #065f46; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>إجراء فحص وتقييم المشرف</span>
                </strong>
                <span class="badge badge-success" dir="ltr" style="font-family: monospace;">${formatDateTime(act.reviewedAt || act.timestamp)}</span>
              </div>
              <p style="font-size: 0.82rem; margin: 4px 0; color: #334155;">
                المشرف المراجع: <strong>${act.reviewerName || 'م. هاني شاكر عبد الله'}</strong> | النتيجة: <strong>${(act.totalWeightedScore || 85)} / 100 نقطة</strong>
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; font-size: 0.8rem; color: #166534; margin-top: 6px;">
                <strong>توجيهات المشرف:</strong> ${act.supervisorNotes || 'تم الاعتماد بنجاح ومطابقة العرض للمواصفات.'}
              </div>
            </div>
          `
              : ''
          }

          <!-- 4. Closure Request Event (if applicable) -->
          ${
            act.closureRequested || act.isClosed
              ? `
            <div style="border-right: 3px solid #f59e0b; padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #92400e; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/clock.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>طلب إنهاء النشاط وتفكيكه</span>
                </strong>
                <span class="badge badge-warning" dir="ltr" style="font-family: monospace;">${formatDateTime(act.closureRequestedAt || act.timestamp)}</span>
              </div>
              <p style="font-size: 0.82rem; margin: 4px 0; color: #334155;">
                سبب الإنهاء المحدد: <strong style="color: #92400e;">${act.closureReasonType || 'انتهاء المدة'}</strong>
                ${act.closureNotes && act.closureNotes !== act.closureReasonType ? `<br />تفاصيل: ${act.closureNotes}` : ''}
              </p>
            </div>
          `
              : ''
          }

          <!-- 5. Closure Completed Event (if closed) -->
          ${
            act.isClosed
              ? `
            <div style="border-right: 3px solid #15803d; padding-right: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #166534; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <img src="../assets/icons/check-circle-2.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>قرار إنهاء وتفكيك النشاط (إغلاق الدورة الميدانية)</span>
                </strong>
                <span class="badge badge-success" dir="ltr" style="font-family: monospace;">${formatDateTime(act.closedAt)}</span>
              </div>
              <p style="font-size: 0.82rem; margin: 4px 0; color: #166534;">
                تم اعتماد تفكيك المعروضات وإغلاق دورة النشاط بنجاح وأرشفته.
              </p>
              ${
                act.closureSupervisorFeedback
                  ? `
                <div style="font-size: 0.8rem; color: #14532d; margin-top: 4px;">
                  <strong>ملاحظة المشرف:</strong> ${act.closureSupervisorFeedback}
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }
        </div>
      `;
    }

    // Filter Chips Event
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        statusFilter = chip.dataset.st;
        renderList();
      });
    });

    // Review Form Submit Handler
    document.getElementById('review-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('rev-act-id').value;
      const roundNum = Number(roundSelect.value) || 1;
      const status = document.getElementById('rev-status').value;
      const notes = document.getElementById('rev-notes').value;

      const breakdown = {
        newActivity: Number(inputNewAct.value) || 0,
        executionQuality: Number(inputQuality.value) || 0,
        continuity: Number(inputContinuity.value) || 0,
        documentation: Number(inputDocs.value) || 0
      };
      const rawScore = Number(((breakdown.executionQuality / 20) * 10).toFixed(1));
      const newActivityDate = document.getElementById('rev-activity-date') ? document.getElementById('rev-activity-date').value : undefined;

      try {
        const res = await SupervisorEngine.reviewActivity(id, status, rawScore, notes, roundNum, breakdown, user, newActivityDate);
        modal.classList.remove('active');
        document.body.style.overflow = '';
        showToast(`تم التحديث بنجاح! ${res.ratingStats.badgeText}`, 'success');
        renderList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    renderList();
})(typeof window !== 'undefined' ? window : globalThis);
