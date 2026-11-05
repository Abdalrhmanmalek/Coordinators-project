/**
 * ADCO Field Operations System - supervisor.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const user = AuthManager.checkAuthGuard('supervisor');
    AppRouter.init();

    let statusFilter = 'ALL';
    let customSearchActive = false;

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
    }

    [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((el) => {
      el.addEventListener('input', updateEvalTotal);
    });

    document.getElementById('close-review-modal').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    document.getElementById('close-audit-modal').addEventListener('click', () => {
      auditModal.classList.remove('active');
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
      const all = ActivityManager.getAllActivities();
      let filtered = [];

      // Requirement 9: Closed activities disappear from active list and only appear in "CLOSED" tab
      if (statusFilter === 'CLOSED') {
        filtered = all.filter((a) => a.isClosed);
      } else {
        const activeOnly = all.filter((a) => !a.isClosed);
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
        const coordQuery = csCoord.value.trim().toLowerCase();
        const minScore = Number(csMinScore.value) || 0;

        filtered = filtered.filter((act) => {
          if (clientVal !== 'ALL' && act.client !== clientVal) return false;
          if (brandVal !== 'ALL' && !(act.brands || []).includes(brandVal)) return false;
          if (actVal !== 'ALL' && act.activity !== actVal) return false;
          if (typeVal !== 'ALL' && act.activityType !== typeVal) return false;
          if (coordQuery && !(act.coordinatorName || '').toLowerCase().includes(coordQuery)) return false;

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
          const shareFormatted = `${(1 / brandCount).toFixed(2)} (${Math.round((1 / brandCount) * 100)}%)`;

          return `
            <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; ${act.isClosed ? 'border: 1.5px solid #86efac; background: #f0fdf4;' : act.closureRequested ? 'border: 2px solid #f59e0b; background: #fffdf7;' : ''}">
              <div>
                ${
                  act.isClosed
                    ? `
                  <div style="background: #ffffff; border: 1px solid #86efac; border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #166534; font-weight: 700;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                      <img src="../assets/icons/archive.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>نشاط منتهي ومفكك (${act.closureReasonType || 'بقرار المشرف'})</span>
                    </span>
                    <span style="font-size: 0.72rem; font-weight: normal; color: #15803d;" dir="ltr">${formatDateTime(act.closedAt)}</span>
                  </div>
                `
                    : act.closureRequested
                    ? `
                  <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 12px;">
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

                <div style="display:flex; gap:14px; margin-bottom:12px;">
                  <img src="${act.photoUrl}" alt="${act.client}" class="supervisor-card-img" data-img="${act.photoUrl}" data-title="${act.client}" style="width:96px; height:96px; border-radius:var(--radius-sm); object-fit:cover; flex-shrink:0; border:1px solid var(--adco-gray-200); cursor: pointer;" title="اضغط للتكبير والفحص عالي الدقة" />
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
                      <strong style="color:var(--adco-green-deep); font-size:0.98rem;">${act.client}</strong>
                      ${renderStatusBadge(act.status)}
                    </div>
                    <p style="font-size:0.8rem; margin:3px 0;">المنسق: <strong>${act.coordinatorName}</strong></p>
                    <p style="font-size:0.78rem;">${act.branch} | <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong></p>
                    <p style="font-size:0.76rem; color:var(--adco-green-dark); margin-top:2px;">العلامات: ${(act.brands || []).join('، ')} (حصة: ${shareFormatted})</p>
                  </div>
                </div>

                <div style="background:#fffbeb; border:1px solid #fde68a; padding:10px 12px; border-radius:var(--radius-sm); font-size:0.8rem; margin-bottom:14px; color:#92400e;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
                      <strong>${ratingStats.badgeText}</strong>
                    </div>
                    <span style="font-size:0.75rem; color:#b45309; white-space:nowrap;">(${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'متابعة' : 'متابعات'})</span>
                  </div>
                  ${act.supervisorNotes ? `<div style="margin-top:4px; color:#475569; font-size:0.78rem;">${act.supervisorNotes}</div>` : ''}
                </div>
              </div>

              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary btn-sm open-eval-btn" data-id="${act.id}" style="flex:1;">
                  <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>فحص وتقييم</span>
                </button>
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
            alert('⚠️ لا يمكن اعتماد إنهاء النشاط:\n\nتوجد جولات متابعة أو تقييمات قيد المراجعة لم يتم فحصها واعتمادها بعد.\n\nيرجى الضغط على زر "فحص وتقييم" واعتماد النشاط أولاً قبل قبول إنهائه.');
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
      const shareFormatted = `${(1 / brandCount).toFixed(2)} (${Math.round((1 / brandCount) * 100)}%)`;
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
            <strong>${act.coordinatorName}</strong>
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
            <strong style="color: var(--adco-green-dark);">${(act.brands || []).join('، ')} (حصة البراند: ${shareFormatted})</strong>
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
        if (fallbackUrl && revImg.src !== fallbackUrl) revImg.src = fallbackUrl;
      };
      revImg.src = photoUrl || fallbackUrl;
      currentModalMedia.photoUrl = revImg.src;
      document.getElementById('rev-photo-title').textContent = title;
      document.getElementById('rev-timestamp').textContent = currentModalMedia.timestamp;

      const lat = loc.latitude ? Number(loc.latitude).toFixed(5) : '31.21560';
      const lng = loc.longitude ? Number(loc.longitude).toFixed(5) : '29.95530';
      document.getElementById('rev-loc-coords').innerHTML = `${lat}&deg; N, ${lng}&deg; E &bull; ${loc.address || act.branch || 'الإسكندرية'}`;
      document.getElementById('rev-loc-map-link').href = `https://www.google.com/maps?q=${lat},${lng}`;

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

      // Open evaluation modal
      document.querySelectorAll('.open-eval-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = ActivityManager.getActivityById(btn.dataset.id);
          if (!act) return;
          currentEvaluatingActivity = act;

          document.getElementById('rev-act-id').value = act.id;
          document.getElementById('modal-act-title').innerHTML = `
            <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-md" alt="" />
            <span>فحص وتقييم: ${act.client} (${act.id})</span>
          `;

          // Populate All Activity Details in top right
          document.getElementById('rev-act-details').innerHTML = renderReviewActDetails(act);

          const sessions = Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0
            ? act.followUpHistory
            : [{ roundNumber: 1, roundTitle: 'التوثيق التأسيسي (جولة 1)', sessionScore: act.supervisorScore }];

          roundSelect.innerHTML = sessions
            .map(
              (s) => `
              <option value="${s.roundNumber}">
                ${s.roundTitle} — ${s.sessionScore !== null && s.sessionScore !== undefined ? `(مقيّمة: ${s.sessionScore}/10)` : '(غير مقيّمة)'}
              </option>
            `
            )
            .join('');

          const latest = sessions[sessions.length - 1];
          roundSelect.value = String(latest.roundNumber);

          // Update left column media (photo, location, timestamp)
          updateReviewModalMedia(latest.roundNumber);

          const evalStats = ActivityManager.computeWeightedEvaluation(act);
          inputNewAct.value = evalStats.breakdown.newActivity.score;
          inputQuality.value = evalStats.breakdown.executionQuality.score;
          inputContinuity.value = evalStats.breakdown.continuity.score;
          inputDocs.value = evalStats.breakdown.documentation.score;
          updateEvalTotal();

          const revDateInput = document.getElementById('rev-activity-date');
          if (revDateInput) {
            revDateInput.value = getEgyptDateTimeLocalString(act.activityDate || act.timestamp || new Date());
          }

          document.getElementById('rev-status').value = act.status === 'Under Review' ? 'Accepted' : act.status;
          document.getElementById('rev-notes').value = act.supervisorNotes || '';
          modal.classList.add('active');
        });
      });
    }

    // Render comprehensive Audit Trail & Actions History (Requirement 7)
    function renderActivityAuditModal(act) {
      const content = document.getElementById('audit-modal-content');
      const sessions = act.followUpHistory || [];
      const loc = act.location || { latitude: 31.2156, longitude: 29.9553, address: act.branch || 'الإسكندرية' };

      content.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; color: var(--adco-green-deep);">${act.client}</h3>
            ${renderStatusBadge(act.status)}
          </div>
          <div style="font-size: 0.84rem; color: #475569;">
            <span>كود النشاط: <strong>${act.id}</strong></span> |
            <span>المنسق: <strong>${act.coordinatorName}</strong></span> |
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
            <div style="font-size: 0.78rem; color: #065f46; display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
              <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>الموقع الجغرافي: <strong>${loc.latitude}&deg;, ${loc.longitude}&deg;</strong> (${loc.address || act.branch})</span>
              <a href="https://www.google.com/maps?q=${loc.latitude},${loc.longitude}" target="_blank" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; min-height: 22px;">الخريطة</a>
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
        showToast(`تم التحديث بنجاح! ${res.ratingStats.badgeText}`, 'success');
        renderList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    renderList();
})(typeof window !== 'undefined' ? window : globalThis);
