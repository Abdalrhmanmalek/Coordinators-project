/**
 * ADCO Field Operations - Activity Card GPS & Camera Capture
 */
(function (global) {
  function initGpsCamera(ctx) {
    const { ActivityManager, ADCO_CATALOGS, CameraCompressor, user, getCurrentActivityId, getStagedPhotos, setStagedPhotos, getBranchValue, renderActivityDetailView, showToast, refreshIcons } = ctx;
    const activityId = typeof getCurrentActivityId === 'function' ? getCurrentActivityId() : null;
    let currentDeviceLocation = null;
    let pendingFollowupBatch = null;
    let pendingFollowupLocation = null;

    const followupVerifyModal = document.getElementById('followup-verify-modal');
    document.getElementById('close-followup-verify-modal').addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      document.getElementById('followup-camera-input').value = '';
    });
    document.getElementById('btn-cancel-followup').addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      document.getElementById('followup-camera-input').value = '';
    });

    // Requirement 3: Strictly ask for location; if denied, reject the photo!
    // Also runs automated Haversine GPS proximity validation against the selected branch (<= 150m)
    async function requestDeviceLocation(targetBranchOverride = null) {
      const telGps = document.getElementById('tel-gps-text');
      const telBox = document.getElementById('compression-telemetry');
      if (telBox) telBox.classList.remove('is-hidden');
      if (telGps) telGps.textContent = 'جاري طلب إذن الموقع الجغرافي (GPS) والتحقق من نطاق الفرع...';

      if (!navigator.geolocation) {
        throw new Error('المتصفح أو الهاتف لا يدعم خدمة الـ GPS، ويلزم توفرها لاعتماد الصور.');
      }

      const activeBranchName =
        targetBranchOverride ||
        (branchCombo && typeof branchCombo.getValue === 'function' ? branchCombo.getValue() : defaultBranch);

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = {
              latitude: Number(pos.coords.latitude.toFixed(5)),
              longitude: Number(pos.coords.longitude.toFixed(5)),
              accuracy: Math.round(pos.coords.accuracy || 10),
              timestamp: formatDateTime(new Date()),
              verified: true
            };

            // Check Haversine proximity against registered branch coordinates
            let proximity = { isValid: true, distanceMeters: 0, maxAllowedMeters: 150 };
            if (ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
              proximity = ActivityManager.validateBranchProximity(activeBranchName, loc, 150);
              loc.distanceFromBranchMeters = proximity.distanceMeters;
              loc.proximityVerified = proximity.isValid;
            }

            currentDeviceLocation = loc;

            if (telGps) {
              if (proximity.isValid) {
                const distBadge =
                  proximity.distanceMeters !== null && proximity.distanceMeters !== undefined
                    ? ` — المسافة عن الفرع: <strong>${proximity.distanceMeters}م</strong> (ضمن النطاق المسموح ${proximity.maxAllowedMeters}م)`
                    : '';
                telGps.innerHTML = `تم التحقق من الموقع GPS بنجاح: <strong>${loc.latitude}&deg; N, ${loc.longitude}&deg; E</strong> (&plusmn;${loc.accuracy}م)${distBadge}`;
                telGps.parentElement.style.background = '#f0fdf4';
                telGps.parentElement.style.borderColor = '#86efac';
              } else {
                telGps.innerHTML = `<strong style="color: #b91c1c;">موقعك الحالي بعيد جداً عن نطاق الفرع المسجل (${proximity.distanceMeters}م &gt; ${proximity.maxAllowedMeters}م)</strong>`;
                telGps.parentElement.style.background = '#fef2f2';
                telGps.parentElement.style.borderColor = '#fca5a5';
              }
            }
            resolve(loc);
          },
          (err) => {
            console.warn('Geolocation denied/error:', err.code, err.message);
            currentDeviceLocation = null;
            if (telGps) {
              telGps.innerHTML = '<strong style="color: #b91c1c;">تم رفض إذن الموقع الجغرافي (Access Denied) — يرجى تفعيل الموقع للمتابعة</strong>';
              telGps.parentElement.style.background = '#fef2f2';
              telGps.parentElement.style.borderColor = '#fca5a5';
            }
            if (err.code === 1 || err.code === err.PERMISSION_DENIED) {
              reject(new Error('تم رفض إذن الوصول للموقع الجغرافي (Access Denied). لنظام أدكو الرقابي، يلزم منح صلاحية الـ GPS للتحقق من تواجدك داخل نطاق الفرع المسجل.'));
            } else {
              reject(new Error('تعذر تحديد إحداثيات الـ GPS بدقة. يرجى تفعيل خدمة الموقع في هاتفك أو متصفحك والمحاولة مجدداً.'));
            }
          },
          { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
        );
      });
    }

    // Automatically capture device GPS coordinates when opening the activity creation form
    if (!activityId && navigator.geolocation) {
      requestDeviceLocation().catch(() => {
        // Handled gracefully in UI telemetry banner; re-prompted upon photo upload or form submission
      });
    }

    // Requirement 1 & 2: Coordinator adds follow-up photo -> verify photo metadata & location -> explicit submit button
    document.getElementById('followup-camera-input').addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activityId) return;

      const currentAct = ActivityManager.getActivityById(activityId);
      const nextRound = (currentAct && currentAct.followUpHistory ? currentAct.followUpHistory.length : 1) + 1;

      try {
        showToast('جاري التحقق من إذن الموقع وفحص بصمة الصورة...', 'info');

        // Requirement 3: Ask for location access; if denied, reject the photo
        const loc = await requestDeviceLocation(currentAct ? currentAct.branch : null);

        // Automated Haversine GPS proximity check against the activity's registered branch
        if (currentAct && ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
          const prox = ActivityManager.validateBranchProximity(currentAct.branch, loc, 150);
          if (!prox.isValid) {
            throw new Error(prox.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
          }
        }

        // Process batch and extract rich EXIF metadata
        const processedBatch = await CameraCompressor.processFilesBatch(files, `Follow-up #${nextRound}`);
        if (!processedBatch || processedBatch.length === 0) {
          throw new Error('فشلت معالجة الصورة.');
        }

        pendingFollowupBatch = processedBatch;
        pendingFollowupLocation = loc;

        const first = processedBatch[0];
        const meta = first.metadata || {};

        // Populate Verification Modal
        document.getElementById('fv-modal-title').textContent = `تأكيد وفحص متابعة رقم ${nextRound} — ${currentAct.client}`;
        document.getElementById('fv-preview-img').src = first.photoUrl;

        const originBadge = document.getElementById('fv-origin-badge');
        originBadge.textContent = meta.originBadge || 'كاميرا مباشرة';
        originBadge.className = `badge ${meta.originBadgeClass || 'badge-success'}`;

        document.getElementById('fv-meta-origin').textContent = meta.originLabel || 'التقاط مباشر بكاميرا الهاتف';
        document.getElementById('fv-meta-taken').textContent = meta.takenAtEgypt || formatDateTime(new Date());
        document.getElementById('fv-meta-device').textContent = meta.deviceModel || 'هاتف محلي';
        document.getElementById('fv-meta-exif-gps').textContent = meta.exifGps ? `${meta.exifGps.latitude}°, ${meta.exifGps.longitude}°` : 'غير متوفر بالصورة (تم اعتماد Live GPS)';

        document.getElementById('fv-loc-coords').textContent = `${loc.latitude}° N, ${loc.longitude}° E`;
        document.getElementById('fv-loc-acc').textContent = `(دقة ±${loc.accuracy}م)`;
        document.getElementById('fv-submit-time').textContent = formatDateTime(new Date());
        document.getElementById('fv-map-link').href = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;

        // Populate optional participating brands checklist (Task 3)
        const brandsChecklist = document.getElementById('fv-brands-checklist');
        const calcShareEl = document.getElementById('fv-calculated-share');
        if (brandsChecklist) {
          const availableBrands = (ADCO_CATALOGS && ADCO_CATALOGS.brands) || ['فلفيتا', 'فييا', 'كلوريل', 'ماكسيل', 'جلاسي', 'ديفا', 'فما'];
          const currentActBrands = Array.isArray(currentAct.brands) ? currentAct.brands : [];
          brandsChecklist.innerHTML = availableBrands.map((b) => {
            const isChecked = currentActBrands.includes(b);
            return `
              <label style="display: flex; align-items: center; gap: 5px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 0.76rem; cursor: pointer;">
                <input type="checkbox" name="fv_brand_item" value="${b}" ${isChecked ? 'checked' : ''} style="accent-color: var(--adco-green-main);" />
                <span>${b}</span>
              </label>
            `;
          }).join('');

          const updateCalcShare = () => {
            const checked = Array.from(brandsChecklist.querySelectorAll('input[name="fv_brand_item"]:checked')).map((cb) => cb.value);
            const count = Math.max(1, checked.length);
            const shareVal = (1 / count).toFixed(2);
            const sharePct = Math.round((1 / count) * 100);
            if (calcShareEl) {
              calcShareEl.textContent = `${shareVal} (${sharePct}%) — إجمالي ${count} علامة مختارة`;
            }
          };
          brandsChecklist.querySelectorAll('input[name="fv_brand_item"]').forEach((cb) => {
            cb.addEventListener('change', updateCalcShare);
          });
          updateCalcShare();
        }

        // Requirement 1: Open verification modal with submit button
        followupVerifyModal.classList.add('active');
      } catch (err) {
        e.target.value = '';
        alert(err.message);
        showToast(err.message, 'error', 5000);
      }
    });

    // Requirement 1: Explicit Submit Button inside Verification Modal
    document.getElementById('btn-confirm-followup-submit').addEventListener('click', async () => {
      if (!pendingFollowupBatch || !pendingFollowupLocation || !activityId) return;
      const btn = document.getElementById('btn-confirm-followup-submit');
      btn.disabled = true;
      btn.innerHTML = `<span>جاري الاعتماد والرفع...</span>`;

      try {
        let updatedProducts = null;
        const brandsChecklist = document.getElementById('fv-brands-checklist');
        if (brandsChecklist) {
          const selectedBrands = Array.from(brandsChecklist.querySelectorAll('input[name="fv_brand_item"]:checked')).map((cb) => cb.value);
          if (selectedBrands.length > 0) {
            updatedProducts = selectedBrands.map((b) => ({ brand: b, skuItem: `منتجات ${b}` }));
          }
        }

        const result = await ActivityManager.addFollowUpPhotos(activityId, pendingFollowupBatch, user, pendingFollowupLocation, updatedProducts);
        followupVerifyModal.classList.remove('active');
        document.getElementById('followup-camera-input').value = '';
        pendingFollowupBatch = null;
        pendingFollowupLocation = null;
        showToast(`تم اعتماد وتأكيد ${result.newSession.roundTitle} بنجاح بتوقيت مصر`, 'success');
        renderActivityDetailView(activityId);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check-circle-2" class="ui-icon"></i><span>اعتماد وتأكيد رفع الصورة والموقع</span>`;
        if (typeof refreshIcons === 'function') refreshIcons(btn);
      }
    });

    let initialProcessedPhotos = [
      {
        photoUrl: '../assets/images/fathalla-branch.avif',
        photoHash: 'a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9',
        sizeKb: 176,
        width: 1280,
        height: 720,
        capturedAt: formatDateTime(new Date()),
        metadata: {
          takenAtEgypt: formatDateTime(new Date()),
          originBadge: 'كاميرا مباشرة',
          originLabel: 'التقاط مباشر بكاميرا الهاتف الميداني',
          originBadgeClass: 'badge-success',
          deviceModel: 'كاميرا الهاتف الميداني المعتمدة',
          exifGps: null
        }
      }
    ];

    const cameraInput = document.getElementById('camera-input');
    const submitActBtn = document.getElementById('submit-activity-btn');

    document.getElementById('trigger-camera-btn').addEventListener('click', async () => {
      try {
        await requestDeviceLocation();
        cameraInput.click();
      } catch (err) {
        alert(err.message);
        showToast(err.message, 'error', 5000);
        if (submitActBtn) {
          submitActBtn.disabled = true;
        }
      }
    });

    cameraInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        showToast('جاري التحقق من إذن الموقع وفحص بصمة الصورة...', 'info');
        const loc = await requestDeviceLocation(branchCombo ? branchCombo.getValue() : defaultBranch);
        if (ActivityManager && typeof ActivityManager.validateBranchProximity === 'function') {
          const prox = ActivityManager.validateBranchProximity(branchCombo ? branchCombo.getValue() : defaultBranch, loc, 150);
          if (!prox.isValid) {
            throw new Error(prox.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
          }
        }
        const batch = await CameraCompressor.processFilesBatch(files, 'Round 1');
        initialProcessedPhotos = batch;

        const first = batch[0];
        const meta = first.metadata || {};
        const previewBox = document.getElementById('camera-preview-box');
        previewBox.innerHTML = `
          <div style="position: relative; width: 100%; height: 100%;">
            <img src="${first.photoUrl}" alt="Preview" class="camera-preview-thumb" />
            <div style="position: absolute; top: 6px; right: 6px;">
              <span class="badge ${meta.originBadgeClass || 'badge-success'}">${meta.originBadge || 'كاميرا مباشرة'}</span>
            </div>
          </div>
        `;
        previewBox.onclick = () => cameraInput.click();

        document.getElementById('compression-telemetry').style.display = 'block';
        document.getElementById('tel-res').textContent = `الأبعاد: ${first.width}×${first.height} px`;
        document.getElementById('tel-size').textContent = `الحجم المضغوط: ${first.sizeKb} KB | مصدر: ${meta.originBadge || 'كاميرا'}`;

        if (submitActBtn) {
          submitActBtn.disabled = false;
        }
        showToast('تم اعتماد بصمة الصورة والتحقق من الموقع GPS بنجاح', 'success');
      } catch (err) {
        e.target.value = '';
        alert(err.message);
        showToast(err.message, 'error', 5000);
        if (submitActBtn) {
          submitActBtn.disabled = true;
        }
      }
    });

    return { requestDeviceLocation, getDeviceLocation: () => currentDeviceLocation };
  }
  global.ActivityCardGpsCamera = { init: initGpsCamera };
})(typeof window !== 'undefined' ? window : globalThis);
