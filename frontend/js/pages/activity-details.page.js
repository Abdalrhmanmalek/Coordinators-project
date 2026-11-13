/**
 * ADCO Field Operations Platform - Activity Details & Follow-Up Controller
 * Single Responsibility: Thin orchestrator for activity-details.html
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

  const user = currentUser || {
    employeeId: 'ADCO-101',
    name: 'أحمد محمود العبد',
    role: 'coordinator',
    branch: 'محرم بك - الإسكندرية'
  };

  let activeSelectedProducts = [];
  let renderHeroCard = () => {};
  let renderTimeline = () => {};

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

  function openLightbox(url, title, time, uploader) {
    const modal = document.getElementById('ad-photo-lightbox');
    if (!modal) return;
    document.getElementById('ad-lb-img').src = url;
    document.getElementById('ad-lb-title').textContent = title || 'معاينة الصورة الميدانية';
    document.getElementById('ad-lb-time').textContent = time || '';
    document.getElementById('ad-lb-user').textContent = uploader ? `بواسطة: ${uploader}` : '';
    modal.classList.add('active');
  }

  function openClosureModal() {
    const modal = document.getElementById('ad-closure-modal');
    if (modal) modal.classList.add('active');
  }

  function closeClosureModal() {
    const modal = document.getElementById('ad-closure-modal');
    if (modal) modal.classList.remove('active');
  }

  function setupClosureModal() {
    const modal = document.getElementById('ad-closure-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('ad-close-closure-modal-btn');
    const cancelBtn = document.getElementById('ad-cancel-closure-btn');
    const form = document.getElementById('ad-closure-form');
    const reasonSelect = document.getElementById('ad-closure-reason-select');
    const notesInput = document.getElementById('ad-closure-notes-input');

    if (closeBtn) closeBtn.addEventListener('click', closeClosureModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeClosureModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeClosureModal();
    });

    if (actionParam === 'request-closure') setTimeout(openClosureModal, 350);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = (reasonSelect && reasonSelect.value) ? reasonSelect.value.trim() : 'انتهاء مدة الحملة المعتمدة';
        const notes = (notesInput && notesInput.value) ? notesInput.value.trim() : '';

        currentActivity.closureRequested = true;
        currentActivity.closureRequestedAt = new Date().toISOString();
        currentActivity.closureReasonType = reason;
        currentActivity.closureNotes = notes ? `${reason} (${notes})` : reason;
        currentActivity.closureStatus = 'pending_closure';

        if (!Array.isArray(currentActivity.followUpHistory)) currentActivity.followUpHistory = [];
        currentActivity.followUpHistory.push({
          roundNumber: currentActivity.followUpHistory.length + 1,
          roundTitle: 'طلب إنهاء وتفكيك النشاط (قيد المراجعة)',
          timestamp: new Date().toISOString(),
          uploadedBy: user.name,
          uploadedById: user.employeeId,
          reviewStatus: 'Under Review',
          sessionScore: null,
          sessionNotes: `طلب إنهاء مقدم من ${user.name}: ${reason}${notes ? ' - ' + notes : ''}`,
          closureRequest: true,
          reviewerName: null
        });
        currentActivity.roundsCount = currentActivity.followUpHistory.length;

        try {
          if (Activity && typeof Activity.saveAllActivities === 'function') {
            const all = Activity.getAllActivities ? Activity.getAllActivities() : [];
            const idx = all.findIndex((a) => a.id === currentActivity.id);
            if (idx !== -1) {
              all[idx] = currentActivity;
              Activity.saveAllActivities(all);
            }
          }
          if (Activity && typeof Activity.requestActivityCompletion === 'function') {
            try { await Activity.requestActivityCompletion(currentActivity.id, reason, notes); } catch (_) {}
          }
          if (Activity && typeof Activity.requestActivityClosure === 'function') {
            try { await Activity.requestActivityClosure(currentActivity.id, notes ? `${reason} - ${notes}` : reason); } catch (_) {}
          }
        } catch (err) {
          console.warn('[ActivityDetails] Error persisting closure request:', err);
        }

        closeClosureModal();
        showToast('تم تقديم طلب إنهاء النشاط بنجاح وهو قيد مراجعة مدير التسويق', 'success');
        renderHeroCard();
        renderTimeline();
      });
    }
  }

  function init() {
    if (!currentActivity) {
      showToast('لم يتم العثور على بطاقة النشاط المحددة', 'error');
      return;
    }

    document.getElementById('ad-client-title').textContent = currentActivity.client || 'نشاط ميداني';
    document.getElementById('ad-branch-text').textContent = currentActivity.branch || 'فرع الشركة';

    activeSelectedProducts = Array.isArray(currentActivity.products) && currentActivity.products.length > 0
      ? JSON.parse(JSON.stringify(currentActivity.products))
      : (currentActivity.brands || ['فلفيتا']).map((b) => ({ brand: b, skuItem: `${b} صنف معتمد` }));

    const ctx = {
      Activity, Compressor, Catalogs, GpsUtil, BrandShareUtil,
      showToast, formatDateTime, formatTwoWordName,
      openLightbox, openClosureModal,
      getCurrentActivity: () => currentActivity,
      getUser: () => user,
      getActiveProducts: () => activeSelectedProducts,
      setActiveProducts: (list) => { activeSelectedProducts = list; },
      renderHeroCard: () => renderHeroCard(),
      renderTimeline: () => renderTimeline()
    };

    renderHeroCard = global.ActivityDetailsHero.create(ctx);
    renderTimeline = global.ActivityDetailsTimeline.create(ctx);
    const productsCtrl = global.ActivityDetailsProducts.create(ctx);
    ctx.renderSelectedProductsList = productsCtrl.renderSelectedProductsList;
    const followUpCtrl = global.ActivityDetailsFollowUp.create(ctx);

    renderHeroCard();
    renderTimeline();
    followUpCtrl.setupFollowUpForm();
    productsCtrl.setupProductModal();
    setupLightbox();
    setupClosureModal();
    followUpCtrl.captureLiveGps();

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
