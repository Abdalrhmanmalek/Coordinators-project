/**
 * ADCO Field Operations - Supervisor Activities Feed
 */
(function (global) {
  function create(ctx) {
    const { ActivityManager, SupervisorEngine, ADCO_CATALOGS, modal, auditModal, roundSelect, spParentClientSelect, spBranchSelect, csClient, csBrand, csActivity, csType, csCoord, csMinScore, csCountBadge, getCurrentFilter, getSelectedBranchKey, getCustomSearchActive, getUser, renderSupervisorBranchCards, renderActivityAuditModal, showToast, refreshIcons } = ctx;
    return function renderList() {
      const statusFilter = getCurrentFilter();
      const selectedBranchKey = getSelectedBranchKey();
      const customSearchActive = getCustomSearchActive();
      const user = getUser();
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

      const isClosedAct = (a) => a.endStatus === 'ENDED' || Boolean(a.isClosed);
      const isClosureReq = (a) => a.endStatus === 'ENDING_REQUESTED' || Boolean(a.closureRequested);
      const getRevSt = (a) => a.reviewStatus || (a.status === 'Accepted' ? 'ACCEPTED' : (a.status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW'));

      const activePool = all.filter((a) => !isClosedAct(a));
      const closedPool = all.filter((a) => isClosedAct(a));

      const cntAllEl = document.getElementById('sp-cnt-all');
      const cntClosureEl = document.getElementById('sp-cnt-closure');
      const cntReviewEl = document.getElementById('sp-cnt-review');
      const cntAcceptedEl = document.getElementById('sp-cnt-accepted');
      const cntRejectedEl = document.getElementById('sp-cnt-rejected');
      const cntClosedEl = document.getElementById('sp-cnt-closed');

      if (cntAllEl) cntAllEl.textContent = activePool.length;
      if (cntClosureEl) cntClosureEl.textContent = activePool.filter((a) => isClosureReq(a)).length;
      const reviewPendingCount = activePool.filter((a) => getRevSt(a) === 'UNDER_REVIEW').length;
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
      if (cntAcceptedEl) cntAcceptedEl.textContent = activePool.filter((a) => getRevSt(a) === 'ACCEPTED').length;
      if (cntRejectedEl) cntRejectedEl.textContent = activePool.filter((a) => getRevSt(a) === 'REJECTED').length;
      if (cntClosedEl) cntClosedEl.textContent = closedPool.length;

      let filtered = [];

      // Requirement 9: Closed activities disappear from active list and only appear in "CLOSED" tab
      if (statusFilter === 'CLOSED') {
        filtered = closedPool;
      } else {
        const activeOnly = activePool;
        if (statusFilter === 'ALL') {
          filtered = activeOnly;
        } else if (statusFilter === 'CLOSURE_REQUESTS' || statusFilter === 'CLOSURE_PENDING') {
          filtered = activeOnly.filter((a) => isClosureReq(a));
        } else if (statusFilter === 'Under Review' || statusFilter === 'UNDER_REVIEW') {
          filtered = activeOnly.filter((a) => getRevSt(a) === 'UNDER_REVIEW');
        } else if (statusFilter === 'Accepted' || statusFilter === 'ACCEPTED') {
          filtered = activeOnly.filter((a) => getRevSt(a) === 'ACCEPTED');
        } else if (statusFilter === 'Rejected' || statusFilter === 'REJECTED') {
          filtered = activeOnly.filter((a) => getRevSt(a) === 'REJECTED');
        } else {
          filtered = activeOnly;
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
            <i data-lucide="shield-check" class="ui-icon ui-icon-xl" style="opacity: 0.5; margin-bottom: 8px;"></i>
            <p style="margin: 0; font-size: 0.95rem;">لا توجد بطاقات في هذا التصنيف حالياً.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered
        .map((act) => {
          const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
          const shareVal = (1 / brandCount).toFixed(2);
          const sharePct = Math.round((1 / brandCount) * 100);

          const isClosed = act.endStatus === 'ENDED' || Boolean(act.isClosed);
          const isPendingClosure = act.endStatus === 'ENDING_REQUESTED' || Boolean(act.closureRequested);

          return `
            <div class="card supervisor-activity-card ${isClosed ? 'sp-card-closed' : isPendingClosure ? 'sp-card-pending' : ''}">
              <div class="sp-card-body">
                ${
                  isClosed
                    ? `
                  <div style="background: #ffffff; border: 1px solid #86efac; border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #166534; font-weight: 700;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                      <i data-lucide="archive" class="ui-icon ui-icon-xs"></i>
                      <span>نشاط منتهي ومفكك (${act.closureReasonType || 'بقرار المشرف'})</span>
                    </span>
                    <span style="font-size: 0.72rem; font-weight: normal; color: #15803d;" dir="ltr">${formatDateTime(act.closedAt)}</span>
                  </div>
                `
                    : isPendingClosure
                    ? `
                  <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                      <div style="font-size: 0.84rem; color: #92400e; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
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

                <!-- Media row: Photo & Branch/Activity details -->
                <div class="sp-card-media-row">
                  <img src="${act.photoUrl || '../assets/images/fathalla-branch.avif'}" alt="${act.client}" class="supervisor-card-img" data-img="${act.photoUrl || '../assets/images/fathalla-branch.avif'}" data-title="${act.client}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" style="width:96px; height:96px; border-radius:12px; object-fit:cover; flex-shrink:0; border:1px solid var(--adco-gray-200); cursor: pointer;" title="اضغط للتكبير والفحص عالي الدقة" />
                  <div class="sp-card-details-col">
                    <div class="sp-card-client-line">
                      <strong class="sp-card-client-title">${act.client}</strong>
                      ${renderStatusBadge(act)}
                    </div>
                    <div class="branch-card-sub" style="margin-bottom:4px;">
                      <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                      <span>${act.branch}</span>
                    </div>
                    <p class="sp-card-activity-line">النشاط: <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong></p>

                    <p style="font-size:0.75rem; color:var(--adco-gray-600); margin:2px 0;">المنسق الميداني: <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName}</strong></p>
                    <p style="font-size:0.75rem; color:var(--adco-gray-600); margin:2px 0;">المشرف المعتمد: <strong>${act.reviewerName || 'أيمن الروبي'}</strong></p>
                    <p class="sp-card-brands-line">العلامات: ${(act.brands || []).join('، ')} • حصة البراند: <span dir="ltr">${shareVal}</span> (${sharePct}%)</p>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="sp-card-actions">
                <a href="./evaluation.html?id=${act.id}" class="btn btn-primary btn-sm open-eval-btn" data-id="${act.id}">
                  <i data-lucide="clipboard-edit" class="ui-icon ui-icon-sm"></i>
                  <span>الفحص والتقييم</span>
                </a>
                <button type="button" class="btn btn-secondary btn-sm open-audit-btn" data-id="${act.id}" title="عرض سجل كافة المتابعات والإجراءات">
                  <i data-lucide="calendar-clock" class="ui-icon ui-icon-xs"></i>
                  <span>المتابعات</span>
                </button>
                ${
                  !isClosed
                    ? `
                  <button type="button" class="btn btn-danger-subtle btn-sm btn-direct-close" data-id="${act.id}" title="إنهاء النشاط فورياً بقرار المشرف المباشر دون انتظار طلب">
                    <i data-lucide="x-circle" class="ui-icon ui-icon-xs"></i>
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

      if (typeof refreshIcons === 'function') refreshIcons(container);

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
    };
  }
  global.SupervisorFeed = { create };
})(typeof window !== 'undefined' ? window : globalThis);
