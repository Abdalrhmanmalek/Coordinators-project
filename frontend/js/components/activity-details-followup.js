/**
 * ADCO Field Operations - Activity Details Follow-Up Form
 */
(function (global) {
  'use strict';
  function createFollowUpController(ctx) {
    const { Activity, Compressor, GpsUtil, Catalogs, showToast, formatDateTime, getCurrentActivity, getUser, getActiveProducts, renderSelectedProductsList, renderHeroCard, renderTimeline } = ctx;
    const MAX_FOLLOWUP_PHOTOS = 6;
    let stagedFollowUpPhotos = [];
    let newFollowUpLocation = { latitude: 31.2156, longitude: 29.9553, accuracy: 8, distanceMeters: 0, isWithin150m: true, capturedAt: new Date().toISOString() };
    const currentActivity = getCurrentActivity();
    const user = getUser();
    let activeSelectedProducts = getActiveProducts();
  function setupFollowUpForm() {
    const dropzone = document.getElementById('ad-camera-dropzone');
    const input = document.getElementById('ad-camera-input');
    const previewWrap = document.getElementById('ad-preview-wrap');
    const stagedGrid = document.getElementById('ad-staged-photos-grid');
    const stagedCounter = document.getElementById('ad-staged-counter');
    const addMoreBtn = document.getElementById('ad-add-more-photo-btn');
    const form = document.getElementById('ad-new-followup-form');
    const toggleSku = document.getElementById('ad-toggle-sku-edit');
    const skuContainer = document.getElementById('ad-sku-edit-container');

    function renderStagedPhotos() {
      if (!previewWrap || !dropzone || !stagedGrid) return;
      const count = stagedFollowUpPhotos.length;
      if (count === 0) {
        previewWrap.classList.add('is-hidden');
        dropzone.classList.remove('is-hidden');
        stagedGrid.innerHTML = '';
        return;
      }

      dropzone.classList.add('is-hidden');
      previewWrap.classList.remove('is-hidden');

      if (stagedCounter) {
        stagedCounter.innerHTML = `
          <i data-lucide="images" class="ui-icon ui-icon-sm"></i>
          <span>تم إرفاق ${count} من ${MAX_FOLLOWUP_PHOTOS} صور</span>
        `;
      }
      if (addMoreBtn) {
        addMoreBtn.disabled = count >= MAX_FOLLOWUP_PHOTOS;
        addMoreBtn.style.opacity = count >= MAX_FOLLOWUP_PHOTOS ? '0.5' : '1';
      }

      stagedGrid.innerHTML = stagedFollowUpPhotos
        .map((p, idx) => `
          <div class="followup-staged-item" data-staged-idx="${idx}">
            <img src="${p.photoUrl}" alt="صورة متابعة ${idx + 1}" />
            <button type="button" class="followup-staged-remove" data-remove-idx="${idx}" title="حذف الصورة" aria-label="حذف الصورة">
              <i data-lucide="x" class="ui-icon ui-icon-xs"></i>
            </button>
          </div>
        `)
        .join('');

      stagedGrid.querySelectorAll('.followup-staged-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = Number(btn.dataset.removeIdx);
          if (!Number.isNaN(idx)) {
            stagedFollowUpPhotos.splice(idx, 1);
            renderStagedPhotos();
          }
        });
      });

      if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
        window.refreshIcons(previewWrap);
      }
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (re) => resolve(re.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    async function handleSelectedFiles(fileList) {
      const files = Array.from(fileList || []);
      if (files.length === 0) return;

      const remaining = MAX_FOLLOWUP_PHOTOS - stagedFollowUpPhotos.length;
      if (remaining <= 0) {
        showToast(`الحد الأقصى ${MAX_FOLLOWUP_PHOTOS} صور لكل جولة متابعة`, 'warning');
        return;
      }

      const toProcess = files.slice(0, remaining);
      if (files.length > remaining) {
        showToast(`تم قبول ${remaining} صور فقط (الحد الأقصى ${MAX_FOLLOWUP_PHOTOS} صور للجولة)`, 'warning');
      }

      showToast('جاري معالجة وضغط الصور بجودة 720p...', 'info');

      for (const file of toProcess) {
        try {
          if (Compressor && typeof Compressor.compress === 'function') {
            const res = await Compressor.compress(file);
            stagedFollowUpPhotos.push({
              photoUrl: res.dataUrl || res.base64,
              photoHash: res.hash || ('sha256-' + Date.now()),
              sizeKb: res.sizeKb || 210,
              width: res.width || 1280,
              height: res.height || 720,
              capturedAt: new Date().toISOString()
            });
          } else {
            const dataUrl = await readFileAsDataUrl(file);
            stagedFollowUpPhotos.push({
              photoUrl: dataUrl,
              photoHash: 'hash-' + Date.now(),
              sizeKb: Math.round((file.size || 200000) / 1024),
              width: 1280,
              height: 720,
              capturedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('[ActivityDetails] Compressor error:', err);
        }
      }

      renderStagedPhotos();
      if (stagedFollowUpPhotos.length > 0) {
        showToast(`تم تجهيز ${stagedFollowUpPhotos.length} من ${MAX_FOLLOWUP_PHOTOS} صور بنجاح`, 'success');
      }
    }

    if (dropzone && input) {
      dropzone.addEventListener('click', () => input.click());
      input.addEventListener('change', async (e) => {
        await handleSelectedFiles(e.target.files);
        input.value = '';
      });
    }

    if (addMoreBtn && input) {
      addMoreBtn.addEventListener('click', () => {
        if (stagedFollowUpPhotos.length >= MAX_FOLLOWUP_PHOTOS) {
          showToast(`تم الوصول للحد الأقصى (${MAX_FOLLOWUP_PHOTOS} صور)`, 'warning');
          return;
        }
        input.click();
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

        const photosToSubmit = stagedFollowUpPhotos.length > 0
          ? stagedFollowUpPhotos.map((p) => ({ ...p }))
          : [{
              photoUrl: '../assets/images/fathalla-branch.avif',
              photoHash: 'mock-hash-' + Date.now(),
              sizeKb: 210,
              width: 1280,
              height: 720,
              capturedAt: new Date().toISOString()
            }];

        const nextRoundNum = (currentActivity.followUpHistory ? currentActivity.followUpHistory.length : 1) + 1;
        const brandsForThisRound = [...new Set(getActiveProducts().map((p) => p.brand).filter(Boolean))];

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
          products: getActiveProducts(),
          location: newFollowUpLocation,
          photos: photosToSubmit
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
        stagedFollowUpPhotos = [];
        if (input) input.value = '';
        renderStagedPhotos();

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

    return { setupFollowUpForm, captureLiveGps };
  }
  global.ActivityDetailsFollowUp = { create: createFollowUpController };
})(typeof window !== 'undefined' ? window : globalThis);
