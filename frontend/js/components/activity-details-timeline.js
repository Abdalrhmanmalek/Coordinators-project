/**
 * ADCO Field Operations - Activity Details Timeline
 */
(function (global) {
  'use strict';
  function createTimelineRenderer(ctx) {
    const { formatDateTime, openLightbox, getCurrentActivity } = ctx;
    return function renderTimeline() {
      const currentActivity = getCurrentActivity();
    const mount = document.getElementById('ad-timeline-mount');
    const badge = document.getElementById('ad-rounds-count-badge');
    const nextBadge = document.getElementById('ad-next-round-badge');
    if (!mount) return;

    const history = Array.isArray(currentActivity.followUpHistory) && currentActivity.followUpHistory.length > 0
      ? currentActivity.followUpHistory
      : [
          {
            roundNumber: 1,
            roundTitle: 'التوثيق التأسيسي (جولة 1)',
            timestamp: currentActivity.timestamp || '2026-10-30 10:15',
            uploadedBy: currentActivity.coordinatorName || 'أحمد محمود العبد',
            uploadedById: currentActivity.coordinatorId || 'ADCO-101',
            reviewStatus: currentActivity.reviewStatus || currentActivity.status || 'ACCEPTED',
            sessionScore: 88,
            scoreBreakdown: { newActivity: 36, executionQuality: 17, continuity: 21, documentation: 14 },
            sessionNotes: currentActivity.supervisorNotes || 'بداية جيدة وتنسيق مرتب للجندولة وتواجد الأصناف.',
            reviewerName: currentActivity.reviewerName || 'م. هاني شاكر عبد الله',
            brands: currentActivity.brands || ['فلفيتا', 'فييا'],
            photos: [
              {
                photoUrl: currentActivity.photoUrl || '../assets/images/fathalla-branch.avif',
                sizeKb: 184
              }
            ]
          }
        ];

    if (badge) badge.textContent = `${history.length} ${history.length === 1 ? 'جولة' : 'جولات'}`;
    if (nextBadge) nextBadge.textContent = `الجولة ${history.length + 1}`;

    mount.innerHTML = history
      .map((round, idx) => {
        const fallbackPhoto = currentActivity.photoUrl || '../assets/images/fathalla-branch.avif';
        const resolvedPhotos = typeof global.getFollowUpPhotos === 'function' ? global.getFollowUpPhotos(round) : [];
        const roundPhotos = resolvedPhotos.length > 0 ? resolvedPhotos : [{ url: fallbackPhoto, photoUrl: fallbackPhoto }];
        const leadPhotoUrl = roundPhotos[0].url;
        const photoCountLabel = roundPhotos.length === 1 ? 'صورة واحدة' : `${roundPhotos.length} صور`;
        const breakdown = round.scoreBreakdown || { newActivity: 35, executionQuality: 18, continuity: 20, documentation: 15 };
        const totalRoundScore = round.sessionScore !== undefined && round.sessionScore !== null
          ? round.sessionScore
          : (breakdown.newActivity + breakdown.executionQuality + breakdown.continuity + breakdown.documentation);
        const managerNote = round.sessionNotes || round.managerNote || 'تمت مراجعة الجولة واعتماد مطابقتها للمعايير الميدانية.';
        const reviewer = round.reviewerName || 'مسؤول التسويق';

        const isClosureEvent = round.closureRequest === true;
        const isRoundAccepted = round.reviewStatus === 'Accepted' || round.reviewStatus === 'ACCEPTED';

        return `
          <div class="ad-round-card" data-round-idx="${idx}">
            <div class="ad-round-header">
              <div class="ad-round-title-group">
                <span class="ad-round-number-badge">${isClosureEvent ? 'طلب إنهاء' : `جولة ${round.roundNumber || idx + 1}`}</span>
                <h3 class="ad-round-title">${round.roundTitle || `جولة المتابعة رقم ${idx + 1}`}</h3>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="followup-round-photos-badge">
                  <i data-lucide="images" class="ui-icon ui-icon-xs"></i>
                  <span>${photoCountLabel}</span>
                </span>
                <span class="badge ${isRoundAccepted ? 'badge-success' : 'badge-warning'}">
                  ${isRoundAccepted ? 'معتمدة' : 'تحت المراجعة'}
                </span>
                <span style="font-size: 0.82rem; color: #64748b; font-family: monospace;">
                  ${formatDateTime(round.timestamp)}
                </span>
              </div>
            </div>

            <div class="ad-round-body-grid">
              <div>
                <div class="ad-round-photo-wrap" data-round-idx="${idx}" data-photo-idx="0" data-img-url="${leadPhotoUrl}" data-img-title="${round.roundTitle || ''}" title="اضغط للتكبير">
                  <img src="${leadPhotoUrl}" alt="${round.roundTitle || ''}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" />
                </div>
                ${roundPhotos.length > 1 ? `
                  <div class="followup-round-thumbs-grid">
                    ${roundPhotos.map((p, pIdx) => `
                      <button type="button" class="followup-round-thumb" data-round-idx="${idx}" data-photo-idx="${pIdx}" title="عرض الصورة ${pIdx + 1} من ${roundPhotos.length}">
                        <img src="${p.url}" alt="${round.roundTitle || ''} - ${pIdx + 1}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" />
                      </button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <div class="ad-round-content">
                ${isClosureEvent ? `
                  <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 14px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #b45309; font-weight: 700; margin-bottom: 6px; font-size: 0.9rem;">
                      <i data-lucide="archive" class="ui-icon ui-icon-xs"></i>
                      <span>طلب إنهاء وتفكيك النشاط قيد مراجعة واعتماد مدير التسويق</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #475569; margin: 0; line-height: 1.5;">${round.sessionNotes}</p>
                  </div>
                ` : `
                  <!-- 4-Criteria Score Scorecard -->
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">تقييم الجولة عبر المعايير الأربعة الرسمية:</span>
                      <strong style="color: var(--adco-green-deep); font-size: 0.95rem;">الإجمالي: ${totalRoundScore} / 100</strong>
                    </div>
                    <div class="ad-scorecard-grid">
                      <div class="ad-scorecard-item">
                        <div class="ad-scorecard-label">نشاط جديد (40)</div>
                        <div class="ad-scorecard-val">${breakdown.newActivity}<small>/40</small></div>
                      </div>
                      <div class="ad-scorecard-item">
                        <div class="ad-scorecard-label">جودة العرض (20)</div>
                        <div class="ad-scorecard-val">${breakdown.executionQuality}<small>/20</small></div>
                      </div>
                      <div class="ad-scorecard-item">
                        <div class="ad-scorecard-label">الاستمرارية (25)</div>
                        <div class="ad-scorecard-val">${breakdown.continuity}<small>/25</small></div>
                      </div>
                      <div class="ad-scorecard-item">
                        <div class="ad-scorecard-label">التوثيق وصحة البيانات (15)</div>
                        <div class="ad-scorecard-val">${breakdown.documentation}<small>/15</small></div>
                      </div>
                    </div>
                  </div>

                  <!-- Manager Note Box -->
                  <div class="ad-manager-note-box">
                    <div class="ad-manager-note-header">
                      <span>
                        <i data-lucide="clipboard-edit" class="ui-icon ui-icon-xs"></i>
                        <span>توجيهات وملاحظات مدير التسويق:</span>
                      </span>
                      <span>${reviewer}</span>
                    </div>
                    <p class="ad-manager-note-text">"${managerNote}"</p>
                  </div>
                `}

                <!-- GPS & Uploader -->
                <div class="ad-gps-verification-row">
                  <span>بواسطة: <strong>${round.uploadedBy || currentActivity.coordinatorName}</strong> (${round.uploadedById || 'ADCO'})</span>
                  ${isClosureEvent ? `
                    <span>•</span>
                    <span style="color: #d97706; display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="clock" class="ui-icon ui-icon-xs"></i>
                      <span>قيد مراجعة الاعتماد</span>
                    </span>
                  ` : `
                    <span>•</span>
                    <span style="color: #059669; display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="shield-check" class="ui-icon ui-icon-xs"></i>
                      <span>تم التحقق الجغرافي (ضمن نطاق الفرع)</span>
                    </span>
                  `}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach click listeners to all round photos & thumbnail grids for gallery lightbox
    mount.querySelectorAll('.ad-round-photo-wrap, .followup-round-thumb').forEach((el) => {
      el.addEventListener('click', () => {
        const roundIdx = Number(el.dataset.roundIdx || 0);
        const photoIdx = Number(el.dataset.photoIdx || 0);
        const round = history[roundIdx] || {};
        const fallbackPhoto = currentActivity.photoUrl || '../assets/images/fathalla-branch.avif';
        const resolved = typeof global.getFollowUpPhotos === 'function' ? global.getFollowUpPhotos(round) : [];
        const photos = resolved.length > 0 ? resolved : [{ url: el.dataset.imgUrl || fallbackPhoto }];

        if (typeof global.openPhotoGalleryLightbox === 'function') {
          global.openPhotoGalleryLightbox(photos, photoIdx, {
            title: round.roundTitle || el.dataset.imgTitle || 'معاينة الصورة الميدانية',
            time: formatDateTime(round.timestamp),
            user: round.uploadedBy || currentActivity.coordinatorName
          });
        } else {
          openLightbox(photos[photoIdx] ? photos[photoIdx].url : fallbackPhoto, round.roundTitle, 'توثيق الجولة الميداني', currentActivity.coordinatorName);
        }
      });
    });

    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(mount);
    }
    };
  }
  global.ActivityDetailsTimeline = { create: createTimelineRenderer };
})(typeof window !== 'undefined' ? window : globalThis);
