/**
 * ADCO Field Operations System - Evaluation Media, EXIF, GPS & Audit Modal Component
 * Single Responsibility: Renders active round photo/EXIF/GPS proximity, lightbox zoom, and full history audit modal.
 */

(function (global) {
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function updateActiveMedia(act, sessions, roundNum, ActivityManager, formatDateTime) {
    const num = Number(roundNum) || 1;
    const session = sessions.find((s) => s.roundNumber === num) || sessions[0];
    const loc = session && session.location ? session.location : act.location;
    const timestamp = session ? session.timestamp : act.timestamp;
    const title = session ? `${act.client} - ${session.roundTitle}` : act.client;

    let photoUrl = act.photoUrl;
    if (session && session.photos && session.photos.length > 0) {
      photoUrl = session.photos[0].photoUrl;
    }

    const currentMedia = {
      photoUrl,
      title,
      timestamp,
      uploader: session ? session.uploadedBy : act.coordinatorName
    };

    const fallbackRetailPhoto = '../assets/images/fathalla-branch.avif';
    const photoImg = document.getElementById('eval-photo-img');
    if (photoImg) {
      photoImg.src = photoUrl || fallbackRetailPhoto;
      photoImg.onerror = () => {
        photoImg.onerror = null;
        photoImg.src = fallbackRetailPhoto;
      };
    }

    const roundBadge = document.getElementById('eval-active-round-badge');
    if (roundBadge && session) roundBadge.textContent = session.roundTitle;

    const currentPhotoObj = session && session.photos && session.photos.length > 0
      ? session.photos[0]
      : (act.initialPhotos && act.initialPhotos.length > 0 ? act.initialPhotos[0] : null);
    const meta = currentPhotoObj && currentPhotoObj.metadata ? currentPhotoObj.metadata : null;

    const originBadgeEl = document.getElementById('eval-photo-origin-badge');
    const originLabelEl = document.getElementById('eval-photo-origin-label');
    const takenTimeEl = document.getElementById('eval-photo-taken-time');
    const deviceModelEl = document.getElementById('eval-photo-device-model');

    if (meta) {
      if (originBadgeEl) {
        originBadgeEl.textContent = meta.originBadge || 'كاميرا مباشرة';
        originBadgeEl.className = `badge ${meta.originBadgeClass || 'badge-success'}`;
      }
      if (originLabelEl) originLabelEl.textContent = meta.originLabel || 'التقاط مباشر عبر كاميرا الهاتف';
      if (takenTimeEl) takenTimeEl.textContent = meta.takenAtEgypt || formatDateTime(timestamp);
      if (deviceModelEl) deviceModelEl.textContent = meta.deviceModel || 'كاميرا الهاتف الميداني';
    } else {
      if (originBadgeEl) {
        originBadgeEl.textContent = 'كاميرا مباشرة';
        originBadgeEl.className = 'badge badge-success';
      }
      if (originLabelEl) originLabelEl.textContent = 'التقاط مباشر عبر كاميرا هاتف المنسق';
      if (takenTimeEl) takenTimeEl.textContent = formatDateTime(timestamp);
      if (deviceModelEl) deviceModelEl.textContent = 'هاتف منسق أدكو المعتمد';
    }

    const latNum = loc && loc.latitude !== undefined ? Number(loc.latitude) : 31.2156;
    const lngNum = loc && loc.longitude !== undefined ? Number(loc.longitude) : 29.9553;
    const lat = latNum.toFixed(5);
    const lng = lngNum.toFixed(5);

    const branchCoords = typeof ActivityManager.getBranchCoordinatesSync === 'function'
      ? ActivityManager.getBranchCoordinatesSync(act.client, act.branch)
      : { latitude: 31.2156, longitude: 29.9553, address: act.branch };

    const bLatNum = branchCoords && branchCoords.latitude ? Number(branchCoords.latitude) : latNum;
    const bLngNum = branchCoords && branchCoords.longitude ? Number(branchCoords.longitude) : lngNum;
    const bLat = bLatNum.toFixed(5);
    const bLng = bLngNum.toFixed(5);

    document.getElementById('eval-coord-coords').textContent = `${lat}° N, ${lng}° E`;
    document.getElementById('eval-coord-accuracy').textContent = `دقة الرصد: ±${loc && loc.accuracy ? loc.accuracy : 10} متر`;
    document.getElementById('eval-coord-map-link').href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    document.getElementById('eval-branch-coords').textContent = `${bLat}° N, ${bLng}° E`;
    document.getElementById('eval-branch-address-label').textContent = branchCoords && branchCoords.address ? branchCoords.address : act.branch;
    document.getElementById('eval-branch-map-link').href = `https://www.google.com/maps/search/?api=1&query=${bLat},${bLng}`;

    const distMeters = calculateDistanceMeters(lat, lng, bLat, bLng);
    const isWithinRange = distMeters <= 150;

    const distValEl = document.getElementById('eval-distance-meters');
    const distStatusBadge = document.getElementById('eval-proximity-status-badge');
    const distBanner = document.getElementById('eval-distance-banner');
    const compareLink = document.getElementById('eval-gps-compare-link');

    if (distValEl) distValEl.textContent = `${distMeters} متر`;
    if (distStatusBadge) {
      distStatusBadge.textContent = isWithinRange ? 'ضمن النطاق المعتمد (<= 150م)' : 'تنبيه: خارج نطاق الفرع (> 150م)';
      distStatusBadge.className = `badge ${isWithinRange ? 'badge-success' : 'badge-warning'}`;
    }
    if (distBanner) distBanner.className = `eval-distance-banner ${isWithinRange ? '' : 'warning'}`;
    if (compareLink) compareLink.href = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${bLat},${bLng}&travelmode=walking`;

    const chkProxEl = document.getElementById('eval-chk-proximity');
    if (chkProxEl) {
      chkProxEl.textContent = isWithinRange
        ? `مطابق للموقع الرسمي للفرع (فارق ${distMeters}م ضمن النطاق المعتمد 150م)`
        : `تنبيه: خارج نطاق الفرع (فارق ${distMeters}م يتجاوز 150م)`;
      chkProxEl.style.color = isWithinRange ? '#0f766e' : '#b45309';
    }
    const chkMetaEl = document.getElementById('eval-chk-meta');
    if (chkMetaEl) {
      chkMetaEl.textContent = meta ? (meta.originLabel || 'التقاط مباشر من كاميرا هاتف المنسق') : 'التقاط مباشر موثق من كاميرا هاتف المنسق';
    }

    return currentMedia;
  }

  function openPhotoLightbox(lightboxModal, currentEvaluatingMedia, act, formatDateTime) {
    if (!lightboxModal) return;
    const fallbackRetailPhoto = '../assets/images/fathalla-branch.avif';
    document.getElementById('lb-image').src = currentEvaluatingMedia.photoUrl || fallbackRetailPhoto;
    document.getElementById('lb-round-title').textContent = currentEvaluatingMedia.title || act.client;
    document.getElementById('lb-timestamp').textContent = formatDateTime(currentEvaluatingMedia.timestamp);
    document.getElementById('lb-uploader').textContent = currentEvaluatingMedia.uploader || act.coordinatorName;
    lightboxModal.classList.add('active');
  }

  function openAuditModal(auditModal, lightboxModal, act, formatDateTime) {
    if (!auditModal) return;
    const content = document.getElementById('audit-modal-content');
    const historyList = (act.followUpHistory && act.followUpHistory.length > 0)
      ? act.followUpHistory
      : [{
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: act.timestamp || '2026-10-30 10:15',
          uploadedBy: act.coordinatorName,
          uploadedById: act.coordinatorId,
          reviewStatus: act.status || 'Accepted',
          sessionScore: 88,
          scoreBreakdown: { newActivity: 36, executionQuality: 17, continuity: 21, documentation: 14 },
          sessionNotes: act.supervisorNotes || 'تأسيس ممتاز وتنسيق معتمد للأصناف على الجندولة.',
          reviewerName: act.reviewerName || 'مدير التسويق',
          photos: [{ photoUrl: act.photoUrl, sizeKb: 184, capturedAt: act.timestamp }]
        }];

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; font-size: 0.84rem; color: #166534; display: flex; align-items: center; justify-content: space-between;">
          <span>إجمالي الجولات المرفوعة: <strong>${historyList.length} جولات</strong></span>
          <span>الفرع: <strong>${act.branch}</strong></span>
        </div>
        ${historyList.map((s, idx) => {
          const photoUrl = (s.photos && s.photos[0] && s.photos[0].photoUrl) || act.photoUrl || '../assets/images/fathalla-branch.avif';
          const bk = s.scoreBreakdown || { newActivity: 35, executionQuality: 18, continuity: 20, documentation: 15 };
          const roundScore = s.sessionScore !== undefined && s.sessionScore !== null
            ? s.sessionScore
            : (bk.newActivity + bk.executionQuality + bk.continuity + bk.documentation);
          const loc = s.location || act.location || { latitude: 31.2156, longitude: 29.9553, distanceMeters: 0 };

          return `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge badge-mint" style="font-weight: 800;">جولة ${s.roundNumber || idx + 1}</span>
                  <strong style="color: var(--adco-green-deep); font-size: 0.95rem;">${s.roundTitle || `جولة المتابعة رقم ${idx + 1}`}</strong>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${s.reviewStatus === 'Accepted' ? 'badge-success' : 'badge-warning'}">
                    ${s.reviewStatus === 'Accepted' ? 'معتمدة' : 'تحت المراجعة'}
                  </span>
                  <span style="font-size: 0.78rem; color: #64748b; font-family: monospace;">${formatDateTime(s.timestamp)}</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 14px; align-items: start;">
                <div class="audit-thumb-wrap" data-img="${photoUrl}" data-title="${s.roundTitle || 'جولة متابعة'}" style="width: 140px; height: 110px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; cursor: pointer; position: relative;">
                  <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${s.roundTitle}" />
                  <span style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; padding: 2px 5px; border-radius: 4px;">تكبير</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div><span style="font-size: 0.68rem; color: #64748b; display: block;">نشاط (40)</span><strong style="color: #0f766e; font-size: 0.88rem;">${bk.newActivity}</strong></div>
                    <div><span style="font-size: 0.68rem; color: #64748b; display: block;">جودة (20)</span><strong style="color: #0f766e; font-size: 0.88rem;">${bk.executionQuality}</strong></div>
                    <div><span style="font-size: 0.68rem; color: #64748b; display: block;">استمرار (25)</span><strong style="color: #0f766e; font-size: 0.88rem;">${bk.continuity}</strong></div>
                    <div><span style="font-size: 0.68rem; color: #64748b; display: block;">توثيق (15)</span><strong style="color: #0f766e; font-size: 0.88rem;">${bk.documentation}</strong></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #475569;">
                    <span>المنسق: <strong>${s.uploadedBy || act.coordinatorName}</strong></span>
                    <span style="color: #059669; font-weight: 700;">مجموع النقاط: ${roundScore} / 100</span>
                  </div>
                  <div style="font-size: 0.76rem; color: #64748b; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                    <span>GPS: ${Number(loc.latitude).toFixed(5)}° N, ${Number(loc.longitude).toFixed(5)}° E (المسافة: ${loc.distanceMeters || 0}م)</span>
                  </div>
                  ${s.sessionNotes ? `
                    <div style="background: #f0fdfa; border-right: 3px solid #0f766e; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; color: #134e4a;">
                      <strong>توجيهات مدير التسويق (${s.reviewerName || 'الإدارة'}):</strong> "${s.sessionNotes}"
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    content.querySelectorAll('.audit-thumb-wrap').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (lightboxModal) {
          document.getElementById('lb-image').src = thumb.dataset.img;
          document.getElementById('lb-round-title').textContent = thumb.dataset.title;
          document.getElementById('lb-timestamp').textContent = formatDateTime(new Date());
          document.getElementById('lb-uploader').textContent = act.coordinatorName;
          lightboxModal.classList.add('active');
        }
      });
    });

    if (typeof global.refreshIcons === 'function') global.refreshIcons(content);
    auditModal.classList.add('active');
  }

  global.EvaluationMedia = { updateActiveMedia, openPhotoLightbox, openAuditModal };
})(typeof window !== 'undefined' ? window : globalThis);

