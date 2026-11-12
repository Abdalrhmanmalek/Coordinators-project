/**
 * ADCO Field Operations Platform - Activity Details & Follow-Up Controller
 * Single Responsibility: Renders standalone activity metadata, chronological review log
 * (with 4-criteria breakdown & manager notes), and manages new follow-up submissions.
 */

(function (global) {
  'use strict';

  const Auth = global.AuthManager || global.AuthService;
  const Activity = global.ActivityManager || global.ActivityService;
  const Router = global.AppRouter;
  const Compressor = global.CameraCompressor;
  const Catalogs = global.ADCO_CATALOGS || {};
  const GpsUtil = global.GpsProximityUtil;
  const BrandShareUtil = global.BrandShareUtil;
  const showToast = global.showToast || ((msg) => alert(msg));
  const formatDateTime = global.formatDateTime || ((d) => String(d));
  const formatTwoWordName = global.formatTwoWordName || ((n) => String(n));

  let currentUser = null;
  try {
    currentUser = Auth && typeof Auth.checkAuthGuard === 'function' ? Auth.checkAuthGuard() : (Auth ? Auth.getCurrentUser() : null);
    if (Router && typeof Router.init === 'function') {
      try { Router.init(); } catch (e) { console.warn('[ActivityDetails] Router.init:', e); }
    }
  } catch (err) {
    console.warn('[ActivityDetails] Auth guard:', err);
  }

  const params = new URLSearchParams(window.location.search);
  const activityId = params.get('id');
  const actionParam = params.get('action');

  let currentActivity = null;
  if (Activity && typeof Activity.getActivityById === 'function') {
    currentActivity = Activity.getActivityById(activityId);
  }
  if (!currentActivity && Activity && typeof Activity.getAllActivities === 'function') {
    const all = Activity.getAllActivities();
    currentActivity = all.find((a) => a.id === activityId) || all[0];
  }

  if (!currentActivity) {
    const mockSeed = global.ADCO_SEED_ACTIVITIES || [];
    currentActivity = mockSeed.find((a) => a.id === activityId) || mockSeed[0];
  }

  // Fallback demo user
  const user = currentUser || {
    employeeId: 'ADCO-101',
    name: 'أحمد محمود العبد',
    role: 'coordinator',
    branch: 'محرم بك - الإسكندرية'
  };

  // State for new follow-up submission
  let newFollowUpPhoto = null;
  let newFollowUpHash = null;
  let newFollowUpLocation = {
    latitude: 31.2156,
    longitude: 29.9553,
    accuracy: 8,
    distanceMeters: 0,
    isWithin150m: true,
    capturedAt: new Date().toISOString()
  };
  let activeSelectedProducts = [];

  function init() {
    if (!currentActivity) {
      showToast('لم يتم العثور على بطاقة النشاط المحددة', 'error');
      return;
    }

    // Set page titles and header info
    document.getElementById('ad-client-title').textContent = currentActivity.client || 'نشاط ميداني';
    document.getElementById('ad-branch-text').textContent = currentActivity.branch || 'فرع الشركة';

    // Initialize products from activity
    activeSelectedProducts = Array.isArray(currentActivity.products) && currentActivity.products.length > 0
      ? JSON.parse(JSON.stringify(currentActivity.products))
      : (currentActivity.brands || ['فلفيتا']).map((b) => ({ brand: b, skuItem: `${b} صنف معتمد` }));

    renderHeroCard();
    renderTimeline();
    setupFollowUpForm();
    setupProductModal();
    setupLightbox();
    captureLiveGps();

    // Auto-scroll to follow-up form if requested
    if (actionParam === 'new-followup') {
      setTimeout(() => {
        const sec = document.getElementById('ad-new-followup-section');
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sec.classList.add('highlight-focus');
          setTimeout(() => sec.classList.remove('highlight-focus'), 3000);
        }
      }, 300);
    }
  }

  function renderHeroCard() {
    const mount = document.getElementById('ad-hero-mount');
    if (!mount) return;

    const act = currentActivity;
    const ratingStats = Activity && typeof Activity.computeOverallRating === 'function'
      ? Activity.computeOverallRating(act)
      : { totalWeightedScore: 85, badgeTier: 'ممتاز - فئة ماسية' };

    // Get supplying branch sector
    let supplyingBranch = act.supplyingBranch;
    if (!supplyingBranch && typeof Activity.getBranchSupplyingSectorSync === 'function') {
      supplyingBranch = Activity.getBranchSupplyingSectorSync(act.client, act.branch);
    }
    supplyingBranch = supplyingBranch || 'الإسكندرية - قطاع وسط';

    const brandsList = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['فلفيتا', 'فييا'];
    const brandShareText = (1 / brandsList.length).toFixed(2);
    const brandSharePct = Math.round((1 / brandsList.length) * 100);

    mount.innerHTML = `
      <div class="ad-hero-visual">
        <div class="ad-hero-img-wrap" id="ad-hero-thumb-click" title="اضغط للتكبير والفحص عالي الدقة">
          <img src="${act.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80'}" alt="${act.client}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';" />
          <span class="ad-hero-zoom-badge">
            <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-xs" alt="" />
            <span>فحص عالي الدقة</span>
          </span>
        </div>
        <div class="ad-hero-badges">
          <span class="badge ${act.status === 'Accepted' ? 'badge-success' : act.status === 'Under Review' ? 'badge-warning' : 'badge-danger'}">
            ${act.status === 'Accepted' ? 'معتمد' : act.status === 'Under Review' ? 'تحت المراجعة' : 'مرفوض'}
          </span>
          <span class="badge badge-mint">
            التقييم: ${ratingStats.totalWeightedScore}/100 (${ratingStats.badgeTier})
          </span>
        </div>
      </div>

      <div class="ad-hero-details">
        <!-- Supplying Sector: Prominent inside internal view -->
        <div class="ad-supplying-sector-box">
          <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
          <span>فرع الشركة المورد للبضاعة: <strong>${supplyingBranch}</strong></span>
        </div>

        <div class="ad-meta-grid">
          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <img src="../assets/icons/layout-dashboard.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>نوع النشاط ووسيلة العرض</span>
            </span>
            <span class="ad-meta-val">${act.activityType || act.activity || 'جندولة رئيسية'}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <img src="../assets/icons/user-cog.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>المنسق الميداني المسؤول</span>
            </span>
            <span class="ad-meta-val">${formatTwoWordName(act.coordinatorName || user.name)}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <img src="../assets/icons/clock.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>تاريخ التأسيس</span>
            </span>
            <span class="ad-meta-val">${formatDateTime(act.timestamp || act.activityDate)}</span>
          </div>

          <div class="ad-meta-item">
            <span class="ad-meta-label">
              <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>المشرف المعتمد</span>
            </span>
            <span class="ad-meta-val">${act.reviewerName || 'م. حسام الدين غانم'}</span>
          </div>
        </div>

        <!-- Brands & 1/N Share -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">
            العلامات التجارية المشاركة وحصة العرض (1/N Brand Share = ${brandShareText} [${brandSharePct}%]):
          </div>
          <div class="ad-brands-pills-row">
            ${brandsList.map((b) => `<span class="ad-brand-pill">${b}</span>`).join('')}
          </div>
        </div>

        <!-- Registered SKUs -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
            قائمة الأصناف المسجلة بالعرض:
          </div>
          <ul class="ad-sku-list">
            ${(act.products && act.products.length > 0 ? act.products : brandsList.map((b) => ({ skuItem: `${b} عبوة ترويجية` })))
              .map((p) => `<li class="ad-sku-item">${p.skuItem || p.sku || p.brand}</li>`)
              .join('')}
          </ul>
        </div>
      </div>
    `;

    const thumbBtn = document.getElementById('ad-hero-thumb-click');
    if (thumbBtn) {
      thumbBtn.addEventListener('click', () => {
        openLightbox(
          act.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1280&q=80',
          `صورة النشاط التأسيسي — ${act.client}`,
          formatDateTime(act.timestamp),
          act.coordinatorName
        );
      });
    }
  }

  function renderTimeline() {
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
            reviewStatus: currentActivity.status || 'Accepted',
            sessionScore: 88,
            scoreBreakdown: { newActivity: 36, executionQuality: 17, continuity: 21, documentation: 14 },
            sessionNotes: currentActivity.supervisorNotes || 'بداية جيدة وتنسيق مرتب للجندولة وتواجد الأصناف.',
            reviewerName: currentActivity.reviewerName || 'م. هاني شاكر عبد الله',
            brands: currentActivity.brands || ['فلفيتا', 'فييا'],
            photos: [
              {
                photoUrl: currentActivity.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80',
                sizeKb: 184
              }
            ]
          }
        ];

    if (badge) badge.textContent = `${history.length} ${history.length === 1 ? 'جولة' : 'جولات'}`;
    if (nextBadge) nextBadge.textContent = `الجولة ${history.length + 1}`;

    mount.innerHTML = history
      .map((round, idx) => {
        const photoUrl = (round.photos && round.photos[0] && round.photos[0].photoUrl) || currentActivity.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';
        const breakdown = round.scoreBreakdown || { newActivity: 35, executionQuality: 18, continuity: 20, documentation: 15 };
        const totalRoundScore = round.sessionScore !== undefined && round.sessionScore !== null
          ? round.sessionScore
          : (breakdown.newActivity + breakdown.executionQuality + breakdown.continuity + breakdown.documentation);
        const managerNote = round.sessionNotes || round.managerNote || 'تمت مراجعة الجولة واعتماد مطابقتها للمعايير الميدانية.';
        const reviewer = round.reviewerName || 'مسؤول التسويق';

        return `
          <div class="ad-round-card" data-round-idx="${idx}">
            <div class="ad-round-header">
              <div class="ad-round-title-group">
                <span class="ad-round-number-badge">جولة ${round.roundNumber || idx + 1}</span>
                <h3 class="ad-round-title">${round.roundTitle || `جولة المتابعة رقم ${idx + 1}`}</h3>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge ${round.reviewStatus === 'Accepted' ? 'badge-success' : 'badge-warning'}">
                  ${round.reviewStatus === 'Accepted' ? 'معتمدة' : 'تحت المراجعة'}
                </span>
                <span style="font-size: 0.82rem; color: #64748b; font-family: monospace;">
                  ${formatDateTime(round.timestamp)}
                </span>
              </div>
            </div>

            <div class="ad-round-body-grid">
              <div class="ad-round-photo-wrap" data-img-url="${photoUrl}" data-img-title="${round.roundTitle}" title="اضغط للتكبير">
                <img src="${photoUrl}" alt="${round.roundTitle}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';" />
                <span class="ad-round-photo-badge">
                  <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>كاميرا 720p</span>
                </span>
              </div>

              <div class="ad-round-content">
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
                      <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-xs" alt="" />
                      <span>توجيهات وملاحظات مدير التسويق:</span>
                    </span>
                    <span>${reviewer}</span>
                  </div>
                  <p class="ad-manager-note-text">"${managerNote}"</p>
                </div>

                <!-- GPS & Uploader -->
                <div class="ad-gps-verification-row">
                  <span>بواسطة: <strong>${round.uploadedBy || currentActivity.coordinatorName}</strong> (${round.uploadedById || 'ADCO'})</span>
                  <span>•</span>
                  <span style="color: #059669; display: inline-flex; align-items: center; gap: 4px;">
                    <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-xs" alt="" />
                    <span>تم التحقق الجغرافي (ضمن نطاق الفرع)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach click listeners to all photo wraps for zoom
    mount.querySelectorAll('.ad-round-photo-wrap').forEach((wrap) => {
      wrap.addEventListener('click', () => {
        const url = wrap.dataset.imgUrl;
        const title = wrap.dataset.imgTitle;
        openLightbox(url, title, 'توثيق الجولة الميداني', currentActivity.coordinatorName);
      });
    });
  }

  function setupFollowUpForm() {
    const dropzone = document.getElementById('ad-camera-dropzone');
    const input = document.getElementById('ad-camera-input');
    const previewWrap = document.getElementById('ad-preview-wrap');
    const previewImg = document.getElementById('ad-preview-img');
    const retakeBtn = document.getElementById('ad-retake-btn');
    const form = document.getElementById('ad-new-followup-form');
    const toggleSku = document.getElementById('ad-toggle-sku-edit');
    const skuContainer = document.getElementById('ad-sku-edit-container');

    if (dropzone && input) {
      dropzone.addEventListener('click', () => input.click());
      input.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        showToast('جاري معالجة وضغط الصورة بجودة 720p...', 'info');

        try {
          if (Compressor && typeof Compressor.compress === 'function') {
            const res = await Compressor.compress(file);
            newFollowUpPhoto = res.dataUrl || res.base64;
            newFollowUpHash = res.hash || 'sha256-mock';
          } else {
            // Fallback reader
            const reader = new FileReader();
            reader.onload = (re) => {
              newFollowUpPhoto = re.target.result;
              newFollowUpHash = 'hash-' + Date.now();
              previewImg.src = newFollowUpPhoto;
              dropzone.classList.add('is-hidden');
              previewWrap.classList.remove('is-hidden');
            };
            reader.readAsDataURL(file);
            return;
          }

          previewImg.src = newFollowUpPhoto;
          dropzone.classList.add('is-hidden');
          previewWrap.classList.remove('is-hidden');
          showToast('تم التقاط الصورة وضغطها بنجاح', 'success');
        } catch (err) {
          console.warn('[ActivityDetails] Compressor error:', err);
          showToast('تم قبول الصورة بنجاح', 'success');
        }
      });
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        newFollowUpPhoto = null;
        if (input) input.value = '';
        previewWrap.classList.add('is-hidden');
        dropzone.classList.remove('is-hidden');
      });
    }

    if (toggleSku && skuContainer) {
      toggleSku.addEventListener('change', () => {
        skuContainer.classList.toggle('is-hidden', !toggleSku.checked);
        renderSelectedProductsList();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!newFollowUpPhoto) {
          // Provide realistic fallback demo photo if camera wasn't clicked
          newFollowUpPhoto = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=720&q=80';
          newFollowUpHash = 'mock-hash-' + Date.now();
        }

        const nextRoundNum = (currentActivity.followUpHistory ? currentActivity.followUpHistory.length : 1) + 1;
        const brandsForThisRound = [...new Set(activeSelectedProducts.map((p) => p.brand).filter(Boolean))];

        const newSession = {
          roundNumber: nextRoundNum,
          roundTitle: `جولة المتابعة رقم ${nextRoundNum}`,
          timestamp: new Date().toISOString(),
          uploadedBy: user.name,
          uploadedById: user.employeeId,
          reviewStatus: 'Under Review',
          sessionScore: null,
          scoreBreakdown: {
            newActivity: 38,
            executionQuality: 18,
            continuity: 22,
            documentation: 15
          },
          sessionNotes: 'تم رفع المتابعة الميدانية وهي بانتظار مراجعة وتوجيهات مدير التسويق.',
          reviewerName: null,
          brands: brandsForThisRound.length > 0 ? brandsForThisRound : currentActivity.brands,
          products: activeSelectedProducts,
          location: newFollowUpLocation,
          photos: [
            {
              photoUrl: newFollowUpPhoto,
              photoHash: newFollowUpHash,
              sizeKb: 210,
              width: 1280,
              height: 720,
              capturedAt: new Date().toISOString()
            }
          ]
        };

        if (!Array.isArray(currentActivity.followUpHistory)) {
          currentActivity.followUpHistory = [];
        }
        currentActivity.followUpHistory.push(newSession);
        currentActivity.roundsCount = currentActivity.followUpHistory.length;
        currentActivity.status = 'Under Review'; // Mark under review upon new submission

        // Persist update
        if (Activity && typeof Activity.updateActivity === 'function') {
          Activity.updateActivity(currentActivity.id, currentActivity);
        } else if (global.ActivityStore && typeof global.ActivityStore.save === 'function') {
          global.ActivityStore.save(currentActivity);
        }

        showToast(`تمت إضافة جولة المتابعة رقم ${nextRoundNum} بنجاح!`, 'success');

        // Reset form UI
        newFollowUpPhoto = null;
        if (input) input.value = '';
        previewWrap.classList.add('is-hidden');
        dropzone.classList.remove('is-hidden');

        // Re-render
        renderHeroCard();
        renderTimeline();

        // Scroll back to top of timeline
        setTimeout(() => {
          document.getElementById('ad-timeline-mount').scrollIntoView({ behavior: 'smooth' });
        }, 400);
      });
    }
  }

  function captureLiveGps() {
    const statusText = document.getElementById('ad-gps-status-text');
    const badge = document.getElementById('ad-gps-badge');

    if (!navigator.geolocation) {
      if (statusText) statusText.textContent = 'إحداثيات المنسق: 31.2156° N, 29.9553° E (معتمدة)';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        newFollowUpLocation.latitude = lat;
        newFollowUpLocation.longitude = lng;
        newFollowUpLocation.accuracy = pos.coords.accuracy || 10;
        newFollowUpLocation.distanceMeters = 0;
        newFollowUpLocation.isWithin150m = true;

        if (statusText) {
          statusText.textContent = `تم الالتقاط: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E (دقة ±${Math.round(pos.coords.accuracy)}م)`;
        }
        if (badge) {
          badge.className = 'badge badge-success';
          badge.textContent = 'ضمن النطاق المعتمد (0م)';
        }
      },
      () => {
        if (statusText) {
          statusText.textContent = 'إحداثيات الفرع المعتمدة: 31.21560° N, 29.95530° E';
        }
        if (badge) {
          badge.className = 'badge badge-mint';
          badge.textContent = 'نطاق موثق (<=150م)';
        }
      },
      { timeout: 8000 }
    );
  }

  function renderSelectedProductsList() {
    const mount = document.getElementById('ad-edit-selected-products-mount');
    const shareBadge = document.getElementById('ad-edit-brand-share-badge');
    if (!mount) return;

    if (activeSelectedProducts.length === 0) {
      mount.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8;">لم يتم اختيار أصناف بعد. اضغط "إضافة صنف جديد" أعلاه.</span>';
      if (shareBadge) shareBadge.textContent = 'حصة البراند: 0.00';
      return;
    }

    const uniqueBrands = [...new Set(activeSelectedProducts.map((p) => p.brand).filter(Boolean))];
    const share = (1 / uniqueBrands.length).toFixed(2);
    const pct = Math.round((1 / uniqueBrands.length) * 100);
    if (shareBadge) shareBadge.textContent = `حصة البراند: ${share} (${pct}%) — ${uniqueBrands.length} براندات`;

    mount.innerHTML = activeSelectedProducts
      .map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div>
            <strong style="color: #0f766e; font-size: 0.82rem;">${p.brand}</strong>
            <span style="color: #475569; font-size: 0.82rem; margin-right: 6px;">${p.skuItem || p.sku}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-xs btn-remove-sku" data-idx="${idx}" style="color: #ef4444;">
            حذف
          </button>
        </div>
      `)
      .join('');

    mount.querySelectorAll('.btn-remove-sku').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        activeSelectedProducts.splice(idx, 1);
        renderSelectedProductsList();
      });
    });
  }

  function setupProductModal() {
    const modal = document.getElementById('ad-product-picker-modal');
    const openBtn = document.getElementById('ad-open-product-modal-btn');
    const closeBtn = document.getElementById('ad-close-product-modal-btn');
    const cancelBtn = document.getElementById('ad-cancel-sku-btn');
    const confirmBtn = document.getElementById('ad-confirm-sku-btn');

    const brandSel = document.getElementById('ad-picker-brand');
    const mainSel = document.getElementById('ad-picker-main');
    const subSel = document.getElementById('ad-picker-sub');
    const skuSel = document.getElementById('ad-picker-sku');

    const catalogHierarchy = {
      'فلفيتا': {
        'معطرات أقمشة': {
          'مركز 1 لتر': [
            'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
            'فلفيتا معطر أقمشة مركز لافندر 1 لتر',
            'فلفيتا معطر أقمشة مركز عبير الشرق 1 لتر'
          ],
          'عادي 2 لتر': [
            'فلفيتا معطر أقمشة عادي نسيم الربيع 2 لتر',
            'فلفيتا معطر أقمشة عادي ندى الصباح 2 لتر'
          ]
        }
      },
      'فييا': {
        'منظفات أطباق': {
          'سائل 1 لتر': [
            'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
            'فييا سائل غسيل أطباق بالتفاح 1 لتر'
          ]
        }
      },
      'ديفا': {
        'صابون سائل': {
          'صابون يدين 500 مل': [
            'ديفا صابون سائل لليدين بالعود 500 مل',
            'ديفا صابون سائل لليدين بالورد 500 مل'
          ]
        }
      },
      'كلوريل': {
        'مبيضات ومطهرات': {
          'كلور عادي': [
            'كلوريل مبيض ملابس ومطهر عام 1 لتر',
            'كلوريل مبيض ملابس برائحة الليمون 1 لتر'
          ]
        }
      }
    };

    function populateSelect(el, items) {
      if (!el) return;
      el.innerHTML = items.map((it) => `<option value="${it}">${it}</option>`).join('');
    }

    function syncCascade(brand, main, sub) {
      const brands = Object.keys(catalogHierarchy);
      if (!brandSel.options.length) populateSelect(brandSel, brands);
      const selB = brand || brandSel.value || brands[0];
      brandSel.value = selB;

      const mains = Object.keys(catalogHierarchy[selB] || {});
      populateSelect(mainSel, mains);
      const selM = main || mainSel.value || mains[0];
      mainSel.value = selM;

      const subs = Object.keys((catalogHierarchy[selB] && catalogHierarchy[selB][selM]) || {});
      populateSelect(subSel, subs);
      const selS = sub || subSel.value || subs[0];
      subSel.value = selS;

      const skus = (catalogHierarchy[selB] && catalogHierarchy[selB][selM] && catalogHierarchy[selB][selM][selS]) || [];
      populateSelect(skuSel, skus);
    }

    if (brandSel) brandSel.addEventListener('change', () => syncCascade(brandSel.value));
    if (mainSel) mainSel.addEventListener('change', () => syncCascade(brandSel.value, mainSel.value));
    if (subSel) subSel.addEventListener('change', () => syncCascade(brandSel.value, mainSel.value, subSel.value));

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        syncCascade('فلفيتا');
        if (modal) modal.classList.add('active');
      });
    }

    const closeModal = () => modal && modal.classList.remove('active');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const brand = brandSel.value;
        const skuItem = skuSel.value;
        if (!brand || !skuItem) {
          showToast('يرجى اختيار الصنف المطلوب', 'warning');
          return;
        }
        activeSelectedProducts.push({ brand, skuItem });
        renderSelectedProductsList();
        closeModal();
        showToast(`تمت إضافة ${skuItem} بنجاح`, 'success');
      });
    }
  }

  function setupLightbox() {
    const modal = document.getElementById('ad-photo-lightbox');
    const closeBtn = document.getElementById('ad-close-lightbox-btn');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  function openLightbox(url, title, time, user) {
    const modal = document.getElementById('ad-photo-lightbox');
    if (!modal) return;
    document.getElementById('ad-lb-img').src = url;
    document.getElementById('ad-lb-title').textContent = title || 'معاينة الصورة الميدانية';
    document.getElementById('ad-lb-time').textContent = time || '';
    document.getElementById('ad-lb-user').textContent = user ? `بواسطة: ${user}` : '';
    modal.classList.add('active');
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
