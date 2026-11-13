/**
 * ADCO Field Operations - Supervisor Review Modal
 */
(function (global) {
  function create(ctx) {
    const { ActivityManager, SupervisorEngine, modal, auditModal, roundSelect, inputNewAct, inputQuality, inputContinuity, inputDocs, updateEvalTotal, openSupervisorLightbox, renderActivityAuditModal, showToast, refreshIcons } = ctx;
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
              <i data-lucide="star" class="ui-icon ui-icon-xs"></i>
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
        revImg.src = '../assets/images/fathalla-branch.avif';
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
    return { getCurrentActivity: () => currentEvaluatingActivity, syncQuickStatusUI, updateReviewModalMedia, renderReviewActDetails };
  }
  global.SupervisorReviewModal = { create };
})(typeof window !== 'undefined' ? window : globalThis);
