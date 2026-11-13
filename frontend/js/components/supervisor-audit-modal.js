/**
 * ADCO Field Operations - Supervisor Audit Modal
 */
(function (global) {
  function create(ctx) {
    const { ActivityManager, openSupervisorLightbox, refreshIcons } = ctx;
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
          <i data-lucide="calendar-clock" class="ui-icon ui-icon-sm"></i>
          <span>التسلسل الزمني لكافة الإجراءات والمتابعات:</span>
        </h4>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- 1. Founding Creation Event -->
          <div style="border-right: 3px solid var(--adco-green-primary); padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
              <strong style="color: var(--adco-green-deep); font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="plus-circle" class="ui-icon ui-icon-xs"></i>
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
            .map((s, sIdx) => {
              const roundPhotos = typeof window.getFollowUpPhotos === 'function'
                ? window.getFollowUpPhotos(s)
                : (Array.isArray(s.photos) ? s.photos : []).map((p) => (typeof p === 'string' ? { url: p, photoUrl: p } : p));
              const photoCountLabel = roundPhotos.length === 1 ? 'صورة واحدة' : `${roundPhotos.length} صور`;
              return `
            <div style="border-right: 3px solid #3b82f6; padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #1e40af; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="camera" class="ui-icon ui-icon-xs"></i>
                  <span>${s.roundTitle}</span>
                </strong>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span class="followup-round-photos-badge">
                    <i data-lucide="images" class="ui-icon ui-icon-xs"></i>
                    <span>${photoCountLabel}</span>
                  </span>
                  <span class="badge badge-secondary" dir="ltr" style="font-family: monospace;">${s.timestamp}</span>
                </div>
              </div>
              <p style="font-size: 0.82rem; margin: 4px 0; color: #334155;">
                رفع الصور الميدانية بواسطة: <strong>${s.uploadedBy}</strong> | حالة التقييم: ${renderStatusBadge(s.reviewStatus || 'Under Review')}
              </p>
              ${
                s.location
                  ? `
                <div style="font-size: 0.78rem; color: #1e3a8a; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                  <span>موقع الهاتف GPS: ${s.location.latitude}&deg;, ${s.location.longitude}&deg;</span>
                </div>
              `
                  : ''
              }

              <!-- Multi-Photo Thumbnail Grid with Gallery Lightbox -->
              <div class="followup-round-thumbs-grid">
                ${roundPhotos
                  .map(
                    (p, pIdx) => `
                  <button type="button" class="followup-round-thumb sup-audit-thumb-btn" data-session-idx="${sIdx}" data-photo-idx="${pIdx}" title="عرض الصورة ${pIdx + 1} من ${roundPhotos.length}">
                    <img src="${p.url || p.photoUrl}" alt="${s.roundTitle} - ${pIdx + 1}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" />
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          `;
            })
            .join('')}

          <!-- 3. Reviewer Action Event -->
          ${
            act.reviewedAt || act.supervisorNotes
              ? `
            <div style="border-right: 3px solid #10b981; padding-right: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #065f46; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
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
                  <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
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
                  <i data-lucide="check-circle-2" class="ui-icon ui-icon-xs"></i>
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
      content.querySelectorAll('.sup-audit-thumb-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sIdx = Number(btn.dataset.sessionIdx || 0);
          const pIdx = Number(btn.dataset.photoIdx || 0);
          const session = sessions[sIdx] || {};
          const roundPhotos = typeof window.getFollowUpPhotos === 'function'
            ? window.getFollowUpPhotos(session)
            : (session.photos || []);
          if (typeof window.openPhotoGalleryLightbox === 'function') {
            window.openPhotoGalleryLightbox(roundPhotos, pIdx, {
              title: session.roundTitle || 'معاينة الصورة الميدانية',
              time: session.timestamp,
              user: session.uploadedBy
            });
          } else if (typeof window.openSupervisorLightbox === 'function' && roundPhotos[pIdx]) {
            window.openSupervisorLightbox(roundPhotos[pIdx].url || roundPhotos[pIdx].photoUrl, session.roundTitle, session.timestamp, session.uploadedBy);
          }
        });
      });

      if (typeof refreshIcons === 'function') refreshIcons(content);
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
    return renderActivityAuditModal;
  }
  global.SupervisorAuditModal = { create };
})(typeof window !== 'undefined' ? window : globalThis);
