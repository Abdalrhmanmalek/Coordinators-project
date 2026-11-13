/**
 * ADCO Field Operations - Activity Card Modals & Lightbox
 */
(function (global) {
  function initModals(ctx) {
    const { user, timelineModal, lightboxModal, closureModal, closeClosureBtn, cancelClosureBtn, closureForm, ActivityManager, getCurrentActivityId, renderActivityDetailView, formatDateTime, showToast } = ctx;
    document.getElementById('close-timeline-modal').addEventListener('click', () => timelineModal.classList.remove('active'));
    document.getElementById('close-lightbox-btn').addEventListener('click', () => lightboxModal.classList.remove('active'));
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });

    if (closeClosureBtn) closeClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));
    if (cancelClosureBtn) cancelClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));
    if (closureModal) {
      closureModal.addEventListener('click', (e) => {
        if (e.target === closureModal) closureModal.classList.remove('active');
      });
    }

    // Toggle radio styling for closure reasons
    const radioReasonTime = document.getElementById('card-reason-time');
    const radioReasonClient = document.getElementById('card-reason-client');
    document.querySelectorAll('input[name="closureReason"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.value === 'انتهاء المدة') {
          if (radioReasonTime) {
            radioReasonTime.style.borderColor = 'var(--adco-green-main)';
            radioReasonTime.style.background = '#f0fdf4';
          }
          if (radioReasonClient) {
            radioReasonClient.style.borderColor = '#cbd5e1';
            radioReasonClient.style.background = '#ffffff';
          }
        } else {
          if (radioReasonClient) {
            radioReasonClient.style.borderColor = 'var(--adco-green-main)';
            radioReasonClient.style.background = '#f0fdf4';
          }
          if (radioReasonTime) {
            radioReasonTime.style.borderColor = '#cbd5e1';
            radioReasonTime.style.background = '#ffffff';
          }
        }
      });
    });

    if (closureForm) {
      closureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const actId = typeof getCurrentActivityId === 'function' ? getCurrentActivityId() : null;
        if (!actId) return;
        const selectedReason = closureForm.closureReason ? closureForm.closureReason.value : 'انتهاء المدة';
        const notesEl = document.getElementById('closure-notes-input');
        const notes = notesEl ? notesEl.value.trim() : '';
        try {
          await ActivityManager.requestActivityCompletion(actId, selectedReason, notes);
          showToast(`تم إرسال طلب إنهاء النشاط (${selectedReason}) بنجاح للمشرف`, 'success');
          if (closureModal) closureModal.classList.remove('active');
          renderActivityDetailView(actId);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    function openLightbox(photoObj, sessionObj) {
      const isSupervisor = user && user.role === 'supervisor';
      if (!isSupervisor) {
        showToast('معاينة وتكبير الصور الأصلية مقتصرة ومخصصة للمشرفين المعتمدين فقط', 'warning');
        return;
      }
      document.getElementById('lb-round-title').textContent = sessionObj.roundTitle;
      document.getElementById('lb-timestamp').textContent = photoObj.capturedAt || sessionObj.timestamp;
      document.getElementById('lb-image').src = photoObj.photoUrl;
      document.getElementById('lb-uploader').textContent = `المنسق: ${sessionObj.uploadedBy} (${sessionObj.uploadedById})`;
      document.getElementById('lb-specs').textContent = `${photoObj.width || 1280}×${photoObj.height || 720} | ${photoObj.sizeKb || 180} KB`;
      lightboxModal.classList.add('active');
    }

    function renderTimelineModal(act) {
      const isSupervisor = user && user.role === 'supervisor';
      const sessions = act.followUpHistory || [];
      const mount = document.getElementById('timeline-sessions-mount');
      mount.innerHTML = sessions
        .map(
          (session, sIdx) => `
          <div class="timeline-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
              <div>
                <strong style="color: var(--adco-green-deep); font-size: 0.95rem;">
                  ${session.roundTitle}
                </strong>
                <div style="font-size: 0.78rem; color: var(--adco-gray-600); margin-top: 2px;">
                  بواسطة: <strong>${session.uploadedBy}</strong> (${session.uploadedById})
                </div>
                ${
                  session.location
                    ? `
                  <div style="font-size: 0.74rem; color: #065f46; display: flex; align-items: center; gap: 4px; margin-top: 3px;">
                    <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                    <span>موقع الهاتف GPS: ${session.location.latitude}&deg;, ${session.location.longitude}&deg;</span>
                  </div>
                `
                    : ''
                }
              </div>
              <div style="text-align: left;">
                <span class="badge badge-mint" dir="ltr" style="font-family: monospace;">
                  ${session.timestamp}
                </span>
                <div style="margin-top: 4px;">
                  ${renderStatusBadge(session.reviewStatus || act.status)}
                </div>
              </div>
            </div>

            <div class="timeline-thumbs-grid">
              ${(session.photos || [])
                .map(
                  (p, pIdx) => `
                <div class="timeline-thumb-item" data-sidx="${sIdx}" data-pidx="${pIdx}">
                  <img src="${p.photoUrl}" alt="${session.roundTitle}" />
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('');

      mount.querySelectorAll('.timeline-thumb-item').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const sIdx = Number(thumb.dataset.sidx);
          const pIdx = Number(thumb.dataset.pidx);
          openLightbox(sessions[sIdx].photos[pIdx], sessions[sIdx]);
        });
      });
    }

    return { openLightbox, renderTimelineModal };
  }
  global.ActivityCardModals = { init: initModals };
})(typeof window !== 'undefined' ? window : globalThis);
