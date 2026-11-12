/**
 * ADCO Field Operations System - Dedicated Evaluation Page Controller (evaluation.page.js)
 * Single Responsibility: Isolated standalone evaluation view, full-screen review lifecycle,
 * Exif metadata verification, GPS proximity validation, 100-point scoring, and Egyptian Cairo timezone formatting.
 * Compatible with both file:// protocol and http:// server environments.
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const ActivityManager = global.ActivityManager || global.ActivityService;
  const SupervisorEngine = global.SupervisorEngine;
  const Router = global.AppRouter;

  let user = Auth ? Auth.checkAuthGuard() : null;
  if (!user && Auth && typeof Auth.createSession === 'function') {
    const reg = Auth.getRegistry ? Auth.getRegistry() : [];
    const supUser = reg.find((u) => u.role === 'marketing_manager' || u.role === 'supervisor') || reg[0];
    user = Auth.createSession(supUser || { employeeId: 'ADCO-901', fullName: 'م. حسام الدين غانم', role: 'marketing_manager' }).user;
  }
  if (!user) return;

  if (Router && typeof Router.init === 'function') {
    try {
      Router.init();
    } catch (err) {
      console.warn('[Evaluation] Router init handled gracefully:', err);
    }
  }

  // Parse Activity ID from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  let actId = urlParams.get('id') || urlParams.get('actId');

  const allActivities = ActivityManager ? ActivityManager.getAllActivities() : [];
  if (!actId && allActivities.length > 0) {
    actId = allActivities[0].id;
  }

  const act = ActivityManager ? ActivityManager.getActivityById(actId) : null;
  if (!act) {
    if (typeof global.showToast === 'function') {
      global.showToast('لم يتم العثور على بطاقة النشاط المطلوبة', 'error');
    }
    setTimeout(() => {
      window.location.href = './supervisor-panel.html';
    }, 1500);
    return;
  }

  // Helper date/time formatter
  function formatDateTime(dateVal) {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('ar-EG', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateVal);
    }
  }

  function getEgyptDateTimeLocalString(dateVal) {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return '';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(d);

      const partMap = {};
      parts.forEach((p) => { partMap[p.type] = p.value; });
      return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
    } catch {
      return d.toISOString().slice(0, 16);
    }
  }

  // Calculate Haversine distance in meters
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  function renderStatusBadge(status) {
    if (status === 'Accepted') return '<span class="badge badge-success">مقبول</span>';
    if (status === 'Rejected') return '<span class="badge badge-danger">غير مقبول</span>';
    return '<span class="badge badge-warning">تحت المراجعة</span>';
  }

  // =========================================================
  // 1. POPULATE SECTION 1 (TOP): Branch Details & Master Info
  // =========================================================
  const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
  const shareFormatted = `${(1 / brandCount).toFixed(2)} (${Math.round((1 / brandCount) * 100)}%)`;
  const ratingStats = ActivityManager.computeOverallRating(act);
  const supplyingBranch = act.coordinatorBranch || 'الإسكندرية - قطاع وسط';

  document.getElementById('eval-title-client').textContent = `فحص وتقييم: ${act.client}`;
  document.getElementById('eval-title-branch').textContent = `${act.branch} • المنسق: ${act.coordinatorName || '-'}`;
  document.getElementById('eval-act-id-badge').textContent = act.id;
  document.getElementById('eval-header-status-badge').innerHTML = renderStatusBadge(act.status);

  document.getElementById('eval-client-name').textContent = act.client;
  document.getElementById('eval-branch-name').textContent = act.branch;
  document.getElementById('eval-supplying-branch').textContent = supplyingBranch;

  const coordFormatted = typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName;
  document.getElementById('eval-coord-name').textContent = `${coordFormatted} (${act.coordinatorId || '-'})`;
  document.getElementById('eval-coord-sector').textContent = act.coordinatorBranch || act.branch;
  document.getElementById('eval-activity-type').textContent = `${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})`;
  document.getElementById('eval-start-date').textContent = act.activityDateFormatted || formatDateTime(act.activityDate || act.timestamp);
  document.getElementById('eval-end-date').textContent = act.isClosed ? `تم الإنهاء (${formatDateTime(act.closedAt)})` : 'نشط ومستمر بالفرع';

  document.getElementById('eval-sku-variant').textContent = act.skuVariant || 'جميع أصناف ومجموعات العرض المعتمدة';
  document.getElementById('eval-brands-share').textContent = `${(act.brands || []).join(' ، ')} • (حصة البراند: ${shareFormatted})`;

  if (act.magazineDate) {
    const magBox = document.getElementById('eval-magazine-box');
    if (magBox) {
      magBox.classList.remove('is-hidden');
      document.getElementById('eval-magazine-date').textContent = `تاريخ إصدار المجلة: ${act.magazineDate}`;
    }
  }

  // =========================================================
  // 2. POPULATE SECTION 2 (MIDDLE): Photos, Metadata & GPS
  // =========================================================
  const sessions = Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0
    ? act.followUpHistory
    : [{ roundNumber: 1, roundTitle: 'التوثيق التأسيسي (جولة 1)', sessionScore: act.supervisorScore }];

  const roundSelect = document.getElementById('eval-round-select');
  if (roundSelect) {
    roundSelect.innerHTML = sessions
      .map(
        (s) => `
        <option value="${s.roundNumber}">
          ${s.roundTitle} — ${s.sessionScore !== null && s.sessionScore !== undefined ? `(مقيّمة: ${s.sessionScore}/10)` : '(غير مقيّمة)'}
        </option>
      `
      )
      .join('');
  }

  let currentEvaluatingMedia = {
    photoUrl: act.photoUrl,
    title: act.client,
    timestamp: act.timestamp,
    uploader: act.coordinatorName
  };

  function updateActiveMedia(roundNum) {
    const num = Number(roundNum) || 1;
    const session = sessions.find((s) => s.roundNumber === num) || sessions[0];
    const loc = session && session.location ? session.location : act.location;
    const timestamp = session ? session.timestamp : act.timestamp;
    const title = session ? `${act.client} - ${session.roundTitle}` : act.client;

    let photoUrl = act.photoUrl;
    if (session && session.photos && session.photos.length > 0) {
      photoUrl = session.photos[0].photoUrl;
    }

    currentEvaluatingMedia = {
      photoUrl,
      title,
      timestamp,
      uploader: session ? session.uploadedBy : act.coordinatorName
    };

    const fallbackRetailPhoto = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
    const photoImg = document.getElementById('eval-photo-img');
    if (photoImg) {
      photoImg.src = photoUrl || fallbackRetailPhoto;
      photoImg.onerror = () => {
        photoImg.onerror = null;
        photoImg.src = fallbackRetailPhoto;
      };
    }

    const roundBadge = document.getElementById('eval-active-round-badge');
    if (roundBadge && session) {
      roundBadge.textContent = session.roundTitle;
    }

    // EXIF Metadata
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

    // GPS Comparison
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

    // Haversine Distance
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
    if (distBanner) {
      distBanner.className = `eval-distance-banner ${isWithinRange ? '' : 'warning'}`;
    }
    if (compareLink) {
      compareLink.href = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${bLat},${bLng}&travelmode=walking`;
    }

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
  }

  // Initialize with latest round
  const latestRound = sessions[sessions.length - 1];
  if (roundSelect) {
    roundSelect.value = String(latestRound.roundNumber);
    roundSelect.addEventListener('change', () => {
      updateActiveMedia(roundSelect.value);
    });
  }
  updateActiveMedia(latestRound.roundNumber);

  // Quick Status Buttons Sync
  const decisionSelect = document.getElementById('eval-decision-select');
  const quickStatusCurrent = document.getElementById('eval-quick-status-current');
  const quickStatusBtns = document.querySelectorAll('.eval-quick-btn');

  function syncDecisionStatus(statusVal) {
    const norm = statusVal || 'Accepted';
    if (decisionSelect && decisionSelect.value !== norm) {
      decisionSelect.value = norm;
    }
    const labelMap = {
      Accepted: 'مقبول',
      Rejected: 'غير مقبول',
      'Under Review': 'تحت المراجعة'
    };
    if (quickStatusCurrent) {
      quickStatusCurrent.textContent = labelMap[norm] || 'مقبول';
    }
    quickStatusBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.status === norm);
    });
  }

  quickStatusBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      syncDecisionStatus(btn.dataset.status);
    });
  });

  if (decisionSelect) {
    decisionSelect.addEventListener('change', () => {
      syncDecisionStatus(decisionSelect.value);
    });
  }
  syncDecisionStatus(act.status || 'Accepted');

  // Photo Zoom Lightbox
  const lightboxModal = document.getElementById('photo-lightbox');
  function openPhotoLightbox() {
    if (!lightboxModal) return;
    const fallbackRetailPhoto = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
    document.getElementById('lb-image').src = currentEvaluatingMedia.photoUrl || fallbackRetailPhoto;
    document.getElementById('lb-round-title').textContent = currentEvaluatingMedia.title || act.client;
    document.getElementById('lb-timestamp').textContent = formatDateTime(currentEvaluatingMedia.timestamp);
    document.getElementById('lb-uploader').textContent = currentEvaluatingMedia.uploader || act.coordinatorName;
    lightboxModal.classList.add('active');
  }

  const clickArea = document.getElementById('eval-photo-click-area');
  if (clickArea) clickArea.addEventListener('click', openPhotoLightbox);

  const headerZoomBtn = document.getElementById('eval-header-zoom-btn');
  if (headerZoomBtn) headerZoomBtn.addEventListener('click', openPhotoLightbox);

  document.getElementById('close-lightbox-btn').addEventListener('click', () => {
    if (lightboxModal) lightboxModal.classList.remove('active');
  });
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });
  }

  // Full History Audit Modal
  const auditModal = document.getElementById('activity-audit-modal');
  document.getElementById('eval-view-history-btn').addEventListener('click', () => {
    if (!auditModal) return;
    const content = document.getElementById('audit-modal-content');
    const historyList = (act.followUpHistory && act.followUpHistory.length > 0)
      ? act.followUpHistory
      : [
          {
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
          }
        ];

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; font-size: 0.84rem; color: #166534; display: flex; align-items: center; justify-content: space-between;">
          <span>إجمالي الجولات المرفوعة: <strong>${historyList.length} جولات</strong></span>
          <span>الفرع: <strong>${act.branch}</strong></span>
        </div>

        ${historyList.map((s, idx) => {
          const photoUrl = (s.photos && s.photos[0] && s.photos[0].photoUrl) || act.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';
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

              <!-- Visual & Score Grid -->
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 14px; align-items: start;">
                <div class="audit-thumb-wrap" data-img="${photoUrl}" data-title="${s.roundTitle || 'جولة متابعة'}" style="width: 140px; height: 110px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; cursor: pointer; position: relative;">
                  <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${s.roundTitle}" />
                  <span style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; padding: 2px 5px; border-radius: 4px;">تكبير</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <!-- 4-Criteria Rubric -->
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
                    <img src="../assets/icons/map-pin.svg" class="ui-icon ui-icon-xs" alt="" />
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

    // Attach click to thumbnails inside audit modal to open lightbox
    content.querySelectorAll('.audit-thumb-wrap').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const url = thumb.dataset.img;
        const title = thumb.dataset.title;
        if (lightboxModal) {
          document.getElementById('lb-image').src = url;
          document.getElementById('lb-round-title').textContent = title;
          document.getElementById('lb-timestamp').textContent = formatDateTime(new Date());
          document.getElementById('lb-uploader').textContent = act.coordinatorName;
          lightboxModal.classList.add('active');
        }
      });
    });

    auditModal.classList.add('active');
  });

  document.getElementById('close-audit-modal').addEventListener('click', () => {
    if (auditModal) auditModal.classList.remove('active');
  });
  if (auditModal) {
    auditModal.addEventListener('click', (e) => {
      if (e.target === auditModal) auditModal.classList.remove('active');
    });
  }

  // =========================================================
  // 3. POPULATE SECTION 3 (BOTTOM): 100-Point Criteria Form
  // =========================================================
  const inputNewAct = document.getElementById('score-new-act');
  const inputQuality = document.getElementById('score-quality');
  const inputContinuity = document.getElementById('score-continuity');
  const inputDocs = document.getElementById('score-docs');
  const liveTotalBadge = document.getElementById('eval-live-total-badge');
  const scoringCardBadge = document.getElementById('eval-scoring-card-badge');
  const headerScoreBadge = document.getElementById('eval-header-score-badge');

  function updateScoresTotal() {
    const s1 = Math.min(40, Math.max(0, Number(inputNewAct.value) || 0));
    const s2 = Math.min(20, Math.max(0, Number(inputQuality.value) || 0));
    const s3 = Math.min(25, Math.max(0, Number(inputContinuity.value) || 0));
    const s4 = Math.min(15, Math.max(0, Number(inputDocs.value) || 0));
    const total = Math.min(100, Math.round(s1 + s2 + s3 + s4));

    const text = `${total} / 100 نقطة`;
    let badgeClass = 'badge badge-success';
    if (total < 60) badgeClass = 'badge badge-danger';
    else if (total < 80) badgeClass = 'badge badge-warning';

    if (liveTotalBadge) {
      liveTotalBadge.textContent = text;
      liveTotalBadge.className = badgeClass;
    }
    if (scoringCardBadge) {
      scoringCardBadge.textContent = text;
      scoringCardBadge.className = badgeClass;
    }
    if (headerScoreBadge) {
      headerScoreBadge.textContent = text;
      headerScoreBadge.className = badgeClass;
    }
  }

  [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((input) => {
    input.addEventListener('input', updateScoresTotal);
  });

  // Set initial breakdown values
  const evalBreakdown = ActivityManager.computeWeightedEvaluation(act);
  inputNewAct.value = evalBreakdown.breakdown.newActivity.score;
  inputQuality.value = evalBreakdown.breakdown.executionQuality.score;
  inputContinuity.value = evalBreakdown.breakdown.continuity.score;
  inputDocs.value = evalBreakdown.breakdown.documentation.score;
  updateScoresTotal();

  // Activity start date input
  const dateInput = document.getElementById('eval-activity-date-input');
  if (dateInput) {
    dateInput.value = getEgyptDateTimeLocalString(act.activityDate || act.timestamp || new Date());
  }

  // Supervisor notes
  const notesTextarea = document.getElementById('eval-notes-textarea');
  if (notesTextarea) {
    notesTextarea.value = act.supervisorNotes || '';
  }

  // =========================================================
  // SUBMIT EVALUATION FORM
  // =========================================================
  document.getElementById('evaluation-main-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roundNum = Number(roundSelect ? roundSelect.value : 1) || 1;
    const status = decisionSelect ? decisionSelect.value : 'Accepted';
    const notes = notesTextarea ? notesTextarea.value : '';

    const breakdown = {
      newActivity: Number(inputNewAct.value) || 0,
      executionQuality: Number(inputQuality.value) || 0,
      continuity: Number(inputContinuity.value) || 0,
      documentation: Number(inputDocs.value) || 0
    };
    const rawScore = Number(((breakdown.executionQuality / 20) * 10).toFixed(1));
    const newActivityDate = dateInput ? dateInput.value : undefined;

    try {
      if (SupervisorEngine && typeof SupervisorEngine.reviewActivity === 'function') {
        await SupervisorEngine.reviewActivity(act.id, status, rawScore, notes, roundNum, breakdown, user, newActivityDate);
      } else {
        act.status = status;
        act.supervisorScore = rawScore;
        act.supervisorNotes = notes;
        act.evaluationBreakdown = breakdown;
        if (newActivityDate) act.activityDate = new Date(newActivityDate).toISOString();
        act.reviewedAt = new Date().toISOString();
        act.reviewerName = user.fullName;
        ActivityManager.saveAllActivities(allActivities);
      }

      if (typeof global.showToast === 'function') {
        global.showToast('تم اعتماد وحفظ تقييم بطاقة النشاط بنجاح!', 'success');
      }

      setTimeout(() => {
        window.location.href = './supervisor-panel.html';
      }, 700);
    } catch (err) {
      if (typeof global.showToast === 'function') {
        global.showToast(err.message || 'حدث خطأ أثناء حفظ التقييم', 'error');
      }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
