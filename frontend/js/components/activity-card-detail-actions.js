/**
 * ADCO Field Operations - Activity Card Detail Actions & Right Panel
 */
(function (global) {
  function renderCompletionAndRightPanel(act, user, formatDateTime) {
    return `
            <!-- Action: Request Activity Completion or Direct Supervisor Closure -->
            <div class="card" style="margin-top: 18px; background: ${act.isClosed ? '#f0fdf4' : act.closureRequested ? '#fffdf7' : '#f8fafc'}; border: 1.5px solid ${act.isClosed ? '#86efac' : act.closureRequested ? '#f59e0b' : '#cbd5e1'}; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <h4 style="margin: 0; display: flex; align-items: center; gap: 6px; color: ${act.isClosed ? '#166534' : act.closureRequested ? '#92400e' : 'var(--adco-green-deep)'};">
                  <i data-lucide="${(act.endStatus === 'ENDED' || act.isClosed) ? 'check-circle-2' : (act.endStatus === 'ENDING_REQUESTED' || act.closureRequested) ? 'clock' : 'shield-check'}" class="ui-icon ui-icon-sm"></i>
                  <span>${act.isClosed ? 'تم إنهاء وتفكيك النشاط' : act.closureRequested ? 'طلب إنهاء النشاط قيد المراجعة' : 'حالة إتمام وتفكيك النشاط'}</span>
                </h4>
                ${
                  act.isClosed
                    ? `<span class="badge badge-success">مكتمل ومغلق</span>`
                    : act.closureRequested
                    ? `<span class="badge badge-warning">بانتظار قرار المشرف</span>`
                    : `<span class="badge badge-mint">النشاط نشط ومستمر</span>`
                }
              </div>

              <p style="font-size: 0.82rem; margin-bottom: 8px;">
                ${
                  act.isClosed
                    ? `تم اعتماد إنهاء النشاط وتفكيك المعروضات وإغلاق دورته الميدانية بنجاح.`
                    : act.closureRequested
                    ? `تم تقديم طلب إنهاء وتفكيك النشاط بتاريخ ${formatDateTime(act.closureRequestedAt || act.timestamp)} وبانتظار اعتماد المشرف.`
                    : (user && user.role === 'supervisor')
                    ? `يمكنك كمشرف إنهاء وتفكيك هذا النشاط فورياً في أي وقت دون الحاجة لطلب مسبق من المنسق.`
                    : `عند انتهاء مدة العرض أو المهرجان أو تفكيك الستاند، يرجى تقديم طلب إنهاء مع تحديد السبب.`
                }
              </p>

              ${
                act.isClosed
                  ? `
                <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; color: #166534; margin-top: 8px;">
                  <div><strong>سبب الإنهاء:</strong> ${act.closureReasonType || 'بقرار إداري مباشر'}</div>
                  ${act.closureSupervisorFeedback ? `<div style="margin-top: 4px; color: #15803d;"><strong>ملاحظة المشرف:</strong> ${act.closureSupervisorFeedback}</div>` : ''}
                  ${act.closedAt ? `<div style="margin-top: 4px; color: #64748b;" dir="ltr">تاريخ الإغلاق: ${formatDateTime(act.closedAt)}</div>` : ''}
                </div>
              `
                  : act.closureRequested
                  ? `
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #92400e; margin-bottom: 12px;">
                  <div><strong>السبب المحدد للإنهاء:</strong> <span class="badge badge-warning" style="font-weight: 700;">${act.closureReasonType || 'انتهاء المدة'}</span></div>
                  ${act.closureNotes && act.closureNotes !== act.closureReasonType ? `<div style="margin-top: 4px; color: #78350f;"><strong>ملاحظات المنسق:</strong> ${act.closureNotes}</div>` : ''}
                </div>
                ${
                  (user && user.role === 'supervisor')
                    ? `
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-primary btn-sm" id="btn-detail-accept-closure">
                      <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                      <span>موافقة وإغلاق النشاط</span>
                    </button>
                    <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-reject-closure">
                      <i data-lucide="x-circle" class="ui-icon ui-icon-sm"></i>
                      <span>رفض طلب الإنهاء</span>
                    </button>
                  </div>
                `
                    : ''
                }
              `
                  : `
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                  ${
                    (user && user.role === 'supervisor')
                      ? `
                    <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-direct-close" style="width: auto;">
                      <i data-lucide="x-circle" class="ui-icon ui-icon-sm"></i>
                      <span>إنهاء النشاط فورياً (قرار المشرف المباشر)</span>
                    </button>
                  `
                      : `
                    <button type="button" class="btn btn-outline btn-sm" id="btn-request-closure" style="width: auto;">
                      <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                      <span>طلب انهاء النشاط</span>
                    </button>
                  `
                  }
                </div>
              `
              }
            </div>
          </div>

          <!-- Left: Hero Photo (Restricted to Supervisor), GPS Location & Date/Time (Requirements 1, 2, 6) -->
          <div class="card sticky-panel" style="padding: 24px;">
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="camera" class="ui-icon ui-icon-sm"></i>
                <span>توثيق العرض الميداني</span>
              </h4>
              <span class="badge badge-mint" style="font-size: 0.72rem;">صورة العرض الميداني المعتمدة</span>
            </div>

            <img src="${act.photoUrl}" alt="${act.client}" class="camera-preview-thumb" id="main-card-hero-img" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" style="cursor: pointer;" title="اضغط للتكبير والفحص" />
            <div style="font-size: 0.75rem; color: var(--adco-green-dark); margin-top: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
              <span>صورة العرض الميداني — اضغط للتكبير والمعاينة</span>
            </div>

            <!-- GPS Location & DateTime Box (Requirement 2) -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 0.82rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--adco-green-deep);">
                  <i data-lucide="map-pin" class="ui-icon ui-icon-sm"></i>
                  <span>الموقع الجغرافي (GPS):</span>
                </span>
                <a href="https://www.google.com/maps?q=${(act.location || {}).latitude || 31.2156},${(act.location || {}).longitude || 29.9553}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; min-height: 24px;">
                  عرض على الخريطة
                </a>
              </div>
              <div style="color: #0f172a; font-family: monospace; font-size: 0.84rem; direction: ltr; text-align: right; font-weight: 700;">
                ${(act.location || {}).latitude || 31.2156}&deg; N, ${(act.location || {}).longitude || 29.9553}&deg; E ${(act.location || {}).accuracy ? `(&plusmn;${act.location.accuracy}م)` : ''}
              </div>
              <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">
                ${(act.location || {}).address || act.branch || 'الإسكندرية'}
              </div>

              <div style="border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; color: #334155;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="calendar-clock" class="ui-icon ui-icon-xs"></i>
                  <span><strong>تاريخ وتوقيت التوثيق:</strong></span>
                </span>
                <span dir="ltr" style="font-family: monospace; font-weight: 700; color: var(--adco-green-deep); font-size: 0.78rem;">${formatDateTime(act.timestamp)}</span>
              </div>
            </div>

            <div style="margin-top: 14px;">
              <h4 style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="clipboard-edit" class="ui-icon ui-icon-sm"></i>
                <span>ملاحظات المشرف</span>
              </h4>
              <p style="font-size: 0.88rem;">${act.supervisorNotes || 'لا توجد ملاحظات مسجلة حتى الآن.'}</p>
            </div>
          </div>
        </div>
      `;

  }
  function bindDetailEvents(ctx, act) {
    const { ActivityManager, user, renderTimelineModal, timelineModal, closureModal, openLightbox, renderActivityDetailView, showToast } = ctx;
      const followupInput = document.getElementById('followup-camera-input');
      document.querySelectorAll('.btn-trigger-followup, #btn-add-followup, #btn-add-followup-top, #btn-add-followup-bottom').forEach((btn) => {
        btn.addEventListener('click', () => {
          followupInput.value = '';
          followupInput.click();
        });
      });

      const openTimelineBtn = document.getElementById('btn-open-timeline');
      if (openTimelineBtn) {
        openTimelineBtn.addEventListener('click', () => {
          const revSec = document.getElementById('reviews-feed-section');
          if (revSec) {
            revSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            renderTimelineModal(act);
            timelineModal.classList.add('active');
          }
        });
      }

      // Inline review thumbnails click to open lightbox
      document.querySelectorAll('.inline-review-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const sIdx = Number(thumb.dataset.sidx);
          const pIdx = Number(thumb.dataset.pidx);
          if (sessions[sIdx] && sessions[sIdx].photos && sessions[sIdx].photos[pIdx]) {
            openLightbox(sessions[sIdx].photos[pIdx], sessions[sIdx]);
          }
        });
      });

      const mainHeroImg = document.getElementById('main-card-hero-img');
      if (mainHeroImg) {
        mainHeroImg.addEventListener('click', () => {
          const latestSession = act.followUpHistory ? act.followUpHistory[act.followUpHistory.length - 1] : { roundTitle: 'التوثيق التأسيسي', uploadedBy: act.coordinatorName, uploadedById: act.coordinatorId };
          const latestPhoto = latestSession.photos ? latestSession.photos[0] : { photoUrl: act.photoUrl, photoHash: act.photoHash };
          openLightbox(latestPhoto, latestSession);
        });
      }

      // Coordinator request closure handler
      const closureBtn = document.getElementById('btn-request-closure');
      if (closureBtn) {
        closureBtn.addEventListener('click', () => {
          closureModal.classList.add('active');
        });
      }

      // Supervisor direct closure handler (إنهاء فوري دون انتظار أحد)
      const directCloseBtn = document.getElementById('btn-detail-direct-close');
      if (directCloseBtn) {
        directCloseBtn.addEventListener('click', async () => {
          if (!confirm(`هل تؤكد إنهاء وتفكيك نشاط "${act.client}" فورياً كقرار إشرافي مباشر دون الحاجة لطلب من المنسق؟`)) return;
          const feedback = prompt('ملاحظة وتوجيه المشرف عند الإغلاق المباشر (اختياري):', 'تم إنهاء النشاط وتفكيكه بقرار مباشر من المشرف');
          if (feedback === null) return;
          try {
            await ActivityManager.directCloseActivity(act.id, feedback);
            showToast('تم إنهاء وتفكيك النشاط فورياً بنجاح', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor accept closure request (Requirement 8 guard)
      const acceptClosureBtn = document.getElementById('btn-detail-accept-closure');
      if (acceptClosureBtn) {
        acceptClosureBtn.addEventListener('click', async () => {
          const hasPendingReview =
            act.status === 'Under Review' ||
            (Array.isArray(act.followUpHistory) && act.followUpHistory.some((s) => s.reviewStatus === 'Under Review' || s.sessionScore === null));

          if (hasPendingReview) {
            alert('لا يمكن اعتماد إنهاء النشاط:\n\nتوجد جولات متابعة أو تقييمات قيد المراجعة لم يتم فحصها واعتمادها بعد.\nيرجى مراجعة وتقييم النشاط أولاً قبل قبول إنهائه.');
            return;
          }

          if (!confirm('هل توافق على إنهاء وتفكيك هذا النشاط وإغلاق دورته رسمياً؟')) return;
          try {
            await ActivityManager.processClosureRequest(act.id, 'COMPLETED', 'تمت الموافقة على إنهاء النشاط');
            showToast('تم اعتماد إنهاء النشاط بنجاح', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor reject closure request
      const rejectClosureBtn = document.getElementById('btn-detail-reject-closure');
      if (rejectClosureBtn) {
        rejectClosureBtn.addEventListener('click', async () => {
          const reason = prompt('يرجى كتابة سبب رفض إنهاء النشاط للمنسق:', 'النشاط ما زال سارياً ومطلوب استمرار العرض');
          if (reason === null) return;
          try {
            await ActivityManager.processClosureRequest(act.id, 'REJECTED', reason);
            showToast('تم رفض طلب إنهاء النشاط وإشعار المنسق', 'info');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      // Supervisor edit activity start date anytime (Requirement 1)
      const editDateBtn = document.getElementById('btn-edit-act-date');
      if (editDateBtn) {
        editDateBtn.addEventListener('click', async () => {
          const defaultVal = getEgyptDateTimeLocalString(act.activityDate || act.timestamp || new Date());
          const newDateStr = prompt('تعديل تاريخ وتوقيت بدء النشاط (بتوقيت مصر):\nيرجى إدخال التاريخ بالصيغة: YYYY-MM-DDTHH:mm', defaultVal);
          if (!newDateStr || !newDateStr.trim()) return;
          try {
            await ActivityManager.updateActivityDate(act.id, newDateStr.trim());
            showToast('تم تعديل تاريخ بدء النشاط بنجاح بتوقيت مصر', 'success');
            renderActivityDetailView(act.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }
  }
  global.ActivityCardDetailActions = { renderCompletionAndRightPanel, bindDetailEvents };
})(typeof window !== 'undefined' ? window : globalThis);
