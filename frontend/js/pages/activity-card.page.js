/**
 * ADCO Field Operations System - Activity Card Page Controller
 * Single Responsibility: Activity creation form, searchable comboboxes, live camera GPS verification,
 * detail review workspace, follow-up photo sessions, and closure lifecycle actions.
 */

import { AuthService } from '../services/auth.service.js';
import { ActivityService } from '../services/activity.service.js';
import { MediaService } from '../services/media.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { ADCO_CATALOGS } from '../config/catalogs.js';
import { NavbarComponent } from '../components/navbar.js';
import { createSearchableCombobox, createMultiSelectCombobox } from '../components/combobox.js';
import { showToast } from '../components/toast.js';

function getEgyptDateTimeLocalString(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);
  const m = {};
  p.forEach((x) => (m[x.type] = x.value));
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.checkAuthGuard();
  if (!user) return;

  NavbarComponent.render();

  const params = new URLSearchParams(window.location.search);
  const activityId = params.get('id');

  // Comboboxes
  const clientCombo = createSearchableCombobox({
    mountId: 'combo-client',
    options: ADCO_CATALOGS.clients,
    placeholder: 'ابحث عن العميل (مثال: فتح الله، زهران)...',
    defaultValue: ADCO_CATALOGS.clients[0],
    allowCustomText: true
  });

  const branchCombo = createSearchableCombobox({
    mountId: 'combo-branch',
    options: ADCO_CATALOGS.branches,
    placeholder: 'ابحث عن الفرع (مثال: سموحة، رشدي)...',
    defaultValue: ADCO_CATALOGS.branches[0],
    allowCustomText: true
  });

  const coordBranchCombo = createSearchableCombobox({
    mountId: 'combo-coord-branch',
    options: ADCO_CATALOGS.coordinatorBranches,
    placeholder: 'اختر أو ابحث عن قطاع المنسق...',
    defaultValue: ADCO_CATALOGS.coordinatorBranches[0],
    allowCustomText: true
  });

  const magGroup = document.getElementById('magazine-date-group');
  const magInput = document.getElementById('f-magazine-date');

  function handleActivitySelection(val) {
    const isMagazine = (val || '').trim() === 'فرشة مجلة';
    if (magGroup && magInput) {
      if (isMagazine) {
        magGroup.style.display = 'block';
        magInput.required = true;
      } else {
        magGroup.style.display = 'none';
        magInput.required = false;
        magInput.value = '';
      }
    }
  }

  const activityCombo = createSearchableCombobox({
    mountId: 'combo-activity',
    options: ADCO_CATALOGS.activities,
    placeholder: 'اختر النشاط (عقد، فرشة مجلة، إضافي...)...',
    defaultValue: ADCO_CATALOGS.activities[0],
    allowCustomText: false,
    onSelect: handleActivitySelection
  });

  const activityTypeCombo = createSearchableCombobox({
    mountId: 'combo-activity-type',
    options: ADCO_CATALOGS.activityTypes,
    placeholder: 'اختر نوع النشاط (جندولة، دريس اب، ستاند...)...',
    defaultValue: ADCO_CATALOGS.activityTypes[0],
    allowCustomText: false
  });

  const countSelect = document.getElementById('f-activity-count');
  const countDecBtn = document.getElementById('count-dec-btn');
  const countIncBtn = document.getElementById('count-inc-btn');

  if (countDecBtn) {
    countDecBtn.addEventListener('click', () => {
      const current = Number(countSelect.value) || 1;
      if (current > 1) countSelect.value = String(current - 1);
    });
  }
  if (countIncBtn) {
    countIncBtn.addEventListener('click', () => {
      const current = Number(countSelect.value) || 1;
      if (current < 10) countSelect.value = String(current + 1);
    });
  }

  const shareBadgeEl = document.getElementById('live-brand-share-badge');
  function updateBrandShareBadge(selectedList) {
    if (!shareBadgeEl) return;
    const n = (selectedList || []).length;
    if (n === 0) {
      shareBadgeEl.textContent = 'اختر براند واحد على الأقل';
      return;
    }
    const share = (1 / n).toFixed(2);
    const pct = Math.round((1 / n) * 100);
    shareBadgeEl.textContent = `حصة كل براند: ${share} (${pct}%) | ${n} صفوف بالتقارير`;
  }

  const brandsMultiCombo = createMultiSelectCombobox({
    mountId: 'combo-brands',
    options: ADCO_CATALOGS.brands,
    defaultSelected: ['Velveta (فلفيتا)', 'Fairy (فيري)'],
    placeholder: 'اكتب اسم العلامة التجارية للبحث والإضافة...',
    onChange: updateBrandShareBadge
  });

  const skuCombo = createSearchableCombobox({
    mountId: 'combo-sku',
    options: ADCO_CATALOGS.skus,
    placeholder: 'ابحث عن المنتج (SKU) أو اكتب وصف العبوة...',
    defaultValue: ADCO_CATALOGS.skus[0],
    allowCustomText: true
  });

  // Set default start date input to current Egypt time
  const initialActDateInput = document.getElementById('f-activity-date');
  if (initialActDateInput && !initialActDateInput.value) {
    initialActDateInput.value = getEgyptDateTimeLocalString();
  }

  // Modals & Handlers
  const timelineModal = document.getElementById('timeline-modal');
  const lightboxModal = document.getElementById('photo-lightbox');
  const closureModal = document.getElementById('closure-request-modal');
  const closeClosureBtn = document.getElementById('close-closure-modal');
  const cancelClosureBtn = document.getElementById('cancel-closure-modal-btn');
  const closureForm = document.getElementById('form-closure-request');

  const closeTimelineBtn = document.getElementById('close-timeline-modal');
  if (closeTimelineBtn) closeTimelineBtn.addEventListener('click', () => timelineModal.classList.remove('active'));
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');
  if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', () => lightboxModal.classList.remove('active'));

  if (closeClosureBtn) closeClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));
  if (cancelClosureBtn) cancelClosureBtn.addEventListener('click', () => closureModal.classList.remove('active'));

  function openLightbox(photo, session = null) {
    const box = document.getElementById('photo-lightbox');
    if (!box) return;
    document.getElementById('lightbox-img').src = photo.photoUrl;
    document.getElementById('lightbox-title').textContent = session ? session.roundTitle : 'معاينة صورة العرض الميداني';
    document.getElementById('lightbox-timestamp').textContent = session ? session.timestamp : 'توقيت مصر';
    document.getElementById('lightbox-hash').textContent = photo.photoHash || 'SHA-256 Verified';
    box.classList.add('active');
  }

  function renderTimelineHistory(act) {
    const mount = document.getElementById('timeline-list-mount');
    if (!mount) return;
    const sessions = act.followUpHistory || [];

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
            </div>
            <div style="text-align: left;">
              <span class="badge badge-mint" dir="ltr" style="font-family: monospace;">
                ${session.timestamp}
              </span>
            </div>
          </div>
          <div class="timeline-thumbs-grid">
            ${(session.photos || [])
              .map(
                (p, pIdx) => `
              <div class="timeline-thumb-item" data-sidx="${sIdx}" data-pidx="${pIdx}">
                <img src="${p.photoUrl}" alt="${session.roundTitle}" />
                <span class="timeline-thumb-zoom">${p.sizeKb || 180}KB</span>
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

  function renderActivityDetailView(id) {
    const act = ActivityService.getActivityById(id);
    if (!act) return;

    document.getElementById('detail-view-section').style.display = 'block';
    document.getElementById('create-form-section').style.display = 'none';

    const roundsCount = act.followUpHistory ? act.followUpHistory.length : 1;
    const ratingStats = ScoreCalculator.computeOverallRating(act);
    const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
    const brandShareVal = (1 / brandCount).toFixed(2);
    const statusBadgeClass = act.status === 'Accepted' ? 'badge-success' : act.status === 'Rejected' ? 'badge-danger' : 'badge-warning';

    document.getElementById('detail-card-mount').innerHTML = `
      <div class="activity-workspace-grid">
        <!-- Right: Metadata & History -->
        <div class="card" style="padding: 24px;">
          <div class="overall-rating-banner">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="../assets/icons/star.svg" class="ui-icon ui-icon-md" alt="" />
              <div>
                <strong style="font-size: 1rem; display: block;">${ratingStats.badgeText}</strong>
                <span style="font-size: 0.78rem;">متوسط تقييمات المشرف عبر جولات المتابعة</span>
              </div>
            </div>
            <span class="badge ${statusBadgeClass}">${act.status}</span>
          </div>

          <h2 style="margin-bottom: 6px;">${act.client}</h2>
          <div style="font-size: 0.8rem; color: var(--adco-gray-600); margin-bottom: 16px;">كود البطاقة: ${act.id}</div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" id="btn-add-followup">
              <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>إضافة متابعة بالصور (متابعة #${roundsCount + 1})</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-open-timeline">
              <img src="../assets/icons/calendar-clock.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>سجل المتابعات (${roundsCount})</span>
            </button>
          </div>

          <div class="meta-row"><span>الفرع:</span><strong>${act.branch}</strong></div>
          <div class="meta-row"><span>قطاع المنسق:</span><strong>${act.coordinatorBranch || '-'}</strong></div>
          <div class="meta-row"><span>المنسق:</span><strong>${act.coordinatorName} (${act.coordinatorId})</strong></div>
          <div class="meta-row"><span>النشاط:</span><strong>${act.activity || '-'}</strong></div>
          <div class="meta-row"><span>نوع النشاط:</span><strong>${act.activityType || '-'}</strong></div>
          <div class="meta-row"><span>عدد النشاط:</span><strong>${act.activityCount || 1}</strong></div>
          <div class="meta-row"><span>العلامات التجارية (${brandCount}):</span><strong>${(act.brands || []).join(' ، ')} (حصة: ${brandShareVal})</strong></div>
          <div class="meta-row"><span>المنتج:</span><strong>${act.skuVariant}</strong></div>
          ${act.magazineDate ? `<div class="meta-row"><span>تاريخ إصدار المجلة:</span><strong>${act.magazineDate}</strong></div>` : ''}
          <div class="meta-row"><span>تاريخ إنشاء البطاقة:</span><strong dir="ltr">${act.createdAt ? act.createdAt.slice(0, 16).replace('T', ' ') : '-'}</strong></div>

          <div class="meta-row" style="background: #f0fdf4; padding: 6px 10px; border-radius: 6px; border: 1px solid #bbf7d0;">
            <span>تاريخ وتوقيت بدء النشاط:</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong dir="ltr" id="detail-start-date-val">${act.activityDateFormatted || act.activityDate || '-'}</strong>
              ${
                user.role === 'supervisor'
                  ? `
                <button type="button" class="btn btn-outline btn-xs" id="btn-edit-act-date" title="تعديل تاريخ بدء النشاط كمشرف" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">
                  تعديل التاريخ
                </button>
              `
                  : ''
              }
            </div>
          </div>

          <div class="meta-row" style="background: ${act.isClosed ? '#f8fafc' : '#f0fdf4'}; padding: 6px 10px; border-radius: 6px; border: 1px solid ${act.isClosed ? '#cbd5e1' : '#86efac'};">
            <span>تاريخ وتوقيت انتهاء النشاط:</span>
            <strong dir="ltr">${act.endDate || (act.closedAt ? act.closedAt.slice(0, 16).replace('T', ' ') : '<span class="badge badge-mint" style="font-size:0.75rem;">نشط ومستمر (لم ينتهِ بعد)</span>')}</strong>
          </div>

          <!-- Official Evaluation Criteria Breakdown (100 Points) -->
          <div class="card" style="margin-top: 16px; background: #f8fafc; border: 1.5px solid var(--adco-green-border); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--adco-gray-200); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <strong style="color: var(--adco-green-deep); font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                <img src="../assets/icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>معايير التقييم الرسمي (إجمالي 100 نقطة)</span>
              </strong>
              <span class="badge badge-success" style="font-size: 0.92rem; font-weight: 800;">
                ${ratingStats.totalWeightedScore} / 100 نقطة
              </span>
            </div>
            <div class="responsive-form-grid" style="gap: 10px;">
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:600;">الأنشطة الجديدة المعتمدة</span>
                <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.newActivity.score} / 40</span>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:600;">جودة التنفيذ</span>
                <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.executionQuality.score} / 20</span>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:600;">مدة الاستمرارية المثبتة</span>
                <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.continuity.score} / 25</span>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:600;">الالتزام بالتوثيق وصحة البيانات</span>
                <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.documentation.score} / 15</span>
              </div>
            </div>
          </div>

          <!-- Action: Request Completion or Direct Closure -->
          <div class="card" style="margin-top: 18px; background: ${act.isClosed ? '#f0fdf4' : act.closureRequested ? '#fffdf7' : '#f8fafc'}; border: 1.5px solid ${act.isClosed ? '#86efac' : act.closureRequested ? '#f59e0b' : '#cbd5e1'}; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <h4 style="margin: 0; display: flex; align-items: center; gap: 6px; color: ${act.isClosed ? '#166534' : act.closureRequested ? '#92400e' : 'var(--adco-green-deep)'};">
                <img src="../assets/icons/${act.isClosed ? 'check-circle-2' : act.closureRequested ? 'clock' : 'shield-check'}.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>${act.isClosed ? 'تم إنهاء وتفكيك النشاط' : act.closureRequested ? 'طلب إنهاء النشاط قيد المراجعة' : 'حالة إتمام وتفكيك النشاط'}</span>
              </h4>
              ${
                act.isClosed
                  ? `<span class="badge badge-success">مكتمل ومغلق</span>`
                  : act.closureRequested
                  ? `<span class="badge badge-warning">بانتظار قرار المشرف</span>`
                  : `<span class="badge badge-mint">النشاط نشط ومستمر</span>`
              }
            </div>

            <p style="font-size: 0.82rem; margin-bottom: 8px;">
              ${
                act.isClosed
                  ? `تم اعتماد إنهاء النشاط وتفكيك المعروضات وإغلاق دورته الميدانية بنجاح.`
                  : act.closureRequested
                  ? `تم تقديم طلب إنهاء وتفكيك النشاط وبانتظار اعتماد المشرف.`
                  : user.role === 'supervisor'
                  ? `يمكنك كمشرف إنهاء وتفكيك هذا النشاط فورياً في أي وقت دون الحاجة لطلب مسبق.`
                  : `عند انتهاء مدة العرض أو المهرجان أو تفكيك الستاند، يرجى تقديم طلب إنهاء مع تحديد السبب.`
              }
            </p>

            ${
              act.isClosed
                ? `
              <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; color: #166534; margin-top: 8px;">
                <div><strong>سبب الإنهاء:</strong> ${act.closureReasonType || 'بقرار إداري مباشر'}</div>
                ${act.closureSupervisorFeedback ? `<div style="margin-top: 4px; color: #15803d;"><strong>ملاحظة المشرف:</strong> ${act.closureSupervisorFeedback}</div>` : ''}
                ${act.closedAt ? `<div style="margin-top: 4px; color: #64748b;" dir="ltr">تاريخ الإغلاق: ${act.endDate || act.closedAt}</div>` : ''}
              </div>
            `
                : act.closureRequested
                ? `
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #92400e; margin-bottom: 12px;">
                <div><strong>السبب المحدد للإنهاء:</strong> <span class="badge badge-warning" style="font-weight: 700;">${act.closureReasonType || 'انتهاء المدة'}</span></div>
                ${act.closureNotes ? `<div style="margin-top: 4px; color: #78350f;"><strong>ملاحظات المنسق:</strong> ${act.closureNotes}</div>` : ''}
              </div>
              ${
                user.role === 'supervisor'
                  ? `
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-primary btn-sm" id="btn-detail-accept-closure">
                    <img src="../assets/icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>موافقة وإغلاق النشاط</span>
                  </button>
                  <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-reject-closure">
                    <img src="../assets/icons/x-circle.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>رفض طلب الإنهاء</span>
                  </button>
                </div>
              `
                  : ''
              }
            `
                : `
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                ${
                  user.role === 'supervisor'
                    ? `
                  <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-detail-direct-close">
                    <img src="../assets/icons/x-circle.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>إنهاء النشاط فورياً (قرار المشرف المباشر)</span>
                  </button>
                `
                    : `
                  <button type="button" class="btn btn-outline btn-sm" id="btn-request-closure">
                    <img src="../assets/icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>طلب انهاء النشاط</span>
                  </button>
                `
                }
              </div>
            `
            }
          </div>
        </div>

        <!-- Left: Hero Photo & Telemetry -->
        <div class="card sticky-panel" style="padding: 24px;">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; display: flex; align-items: center; gap: 6px;">
              <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>توثيق العرض الميداني</span>
            </h4>
            <span class="badge badge-mint" style="font-size: 0.72rem;">معتمدة (720p)</span>
          </div>

          <div style="position: relative; border-radius: 8px; overflow: hidden; background: #0f172a; margin-bottom: 16px; cursor: pointer;" id="detail-hero-photo-wrap" title="اضغط للتكبير">
            <img src="${act.photoUrl}" alt="${act.client}" style="width: 100%; height: 260px; object-fit: cover; display: block;" />
          </div>

          <div class="meta-row"><span>الموقع الجغرافي:</span><strong dir="ltr">${act.location ? `${act.location.latitude}°, ${act.location.longitude}°` : 'الإسكندرية'}</strong></div>
          <div class="meta-row"><span>الدقة التقنية:</span><strong>±${act.location ? act.location.accuracy || 8 : 8} متر</strong></div>
          <div class="meta-row"><span>بصمة التشفير SHA-256:</span><strong style="font-family:monospace; font-size:0.75rem; word-break:break-all;">${(act.photoHash || '').slice(0, 24)}...</strong></div>
        </div>
      </div>
    `;

    // Event listeners
    const addFollowupBtn = document.getElementById('btn-add-followup');
    if (addFollowupBtn) {
      addFollowupBtn.addEventListener('click', () => {
        const inp = document.getElementById('followup-camera-input');
        if (inp) inp.click();
      });
    }

    const openTimelineBtn = document.getElementById('btn-open-timeline');
    if (openTimelineBtn) {
      openTimelineBtn.addEventListener('click', () => {
        renderTimelineHistory(act);
        timelineModal.classList.add('active');
      });
    }

    const heroWrap = document.getElementById('detail-hero-photo-wrap');
    if (heroWrap) {
      heroWrap.addEventListener('click', () => {
        openLightbox({ photoUrl: act.photoUrl, photoHash: act.photoHash });
      });
    }

    const editDateBtn = document.getElementById('btn-edit-act-date');
    if (editDateBtn) {
      editDateBtn.addEventListener('click', async () => {
        const defaultVal = getEgyptDateTimeLocalString(act.activityDate || new Date());
        const newDateStr = prompt('تعديل تاريخ وتوقيت بدء النشاط (بتوقيت مصر):\nيرجى إدخال التاريخ بالصيغة: YYYY-MM-DDTHH:mm', defaultVal);
        if (!newDateStr || !newDateStr.trim()) return;
        try {
          await ActivityService.updateActivityDate(act.id, newDateStr.trim());
          showToast('تم تعديل تاريخ بدء النشاط بنجاح بتوقيت مصر', 'success');
          renderActivityDetailView(act.id);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const directCloseBtn = document.getElementById('btn-detail-direct-close');
    if (directCloseBtn) {
      directCloseBtn.addEventListener('click', async () => {
        if (!confirm(`هل تؤكد إنهاء وتفكيك نشاط "${act.client}" فورياً كقرار إشرافي مباشر؟`)) return;
        const feedback = prompt('ملاحظة وتوجيه المشرف عند الإغلاق المباشر:', 'تم إنهاء النشاط وتفكيكه بقرار مباشر من المشرف');
        if (feedback === null) return;
        try {
          await ActivityService.directCloseActivity(act.id, feedback);
          showToast('تم إنهاء وتفكيك النشاط فورياً بنجاح', 'success');
          renderActivityDetailView(act.id);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const acceptClosureBtn = document.getElementById('btn-detail-accept-closure');
    if (acceptClosureBtn) {
      acceptClosureBtn.addEventListener('click', async () => {
        if (!confirm('هل توافق على إنهاء وتفكيك هذا النشاط وإغلاق دورته رسمياً؟')) return;
        try {
          await ActivityService.processClosureRequest(act.id, 'COMPLETED', 'تمت الموافقة على إنهاء النشاط');
          showToast('تم اعتماد إنهاء النشاط بنجاح', 'success');
          renderActivityDetailView(act.id);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const rejectClosureBtn = document.getElementById('btn-detail-reject-closure');
    if (rejectClosureBtn) {
      rejectClosureBtn.addEventListener('click', async () => {
        const reason = prompt('يرجى كتابة سبب رفض إنهاء النشاط للمنسق:', 'النشاط ما زال سارياً ومطلوب استمرار العرض');
        if (reason === null) return;
        try {
          await ActivityService.processClosureRequest(act.id, 'REJECTED', reason);
          showToast('تم رفض طلب إنهاء النشاط وإشعار المنسق', 'info');
          renderActivityDetailView(act.id);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const requestClosureBtn = document.getElementById('btn-request-closure');
    if (requestClosureBtn) {
      requestClosureBtn.addEventListener('click', () => {
        closureModal.classList.add('active');
      });
    }
  }

  // Coordinator closure submission
  if (closureForm) {
    closureForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activityId) return;
      const selectedReason = closureForm.closureReason ? closureForm.closureReason.value : 'انتهاء المدة';
      const notes = (document.getElementById('closure-notes-input') || {}).value || '';
      try {
        await ActivityService.requestActivityCompletion(activityId, selectedReason, notes.trim());
        showToast(`تم إرسال طلب إنهاء النشاط (${selectedReason}) بنجاح للمشرف`, 'success');
        closureModal.classList.remove('active');
        renderActivityDetailView(activityId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Follow-up Photo Verification Workflow
  let pendingFollowupBatch = null;
  let pendingFollowupLocation = null;
  const followupVerifyModal = document.getElementById('followup-verify-modal');
  const followupCameraInput = document.getElementById('followup-camera-input');

  const closeFollowupVerifyBtn = document.getElementById('close-followup-verify-modal');
  if (closeFollowupVerifyBtn) {
    closeFollowupVerifyBtn.addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      if (followupCameraInput) followupCameraInput.value = '';
    });
  }
  const cancelFollowupBtn = document.getElementById('btn-cancel-followup');
  if (cancelFollowupBtn) {
    cancelFollowupBtn.addEventListener('click', () => {
      followupVerifyModal.classList.remove('active');
      if (followupCameraInput) followupCameraInput.value = '';
    });
  }

  if (followupCameraInput) {
    followupCameraInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        showToast('جاري التحقق من إذن الموقع وفحص الصورة...', 'info');
        const loc = await MediaService.requestDeviceLocation();
        const batch = await MediaService.processImageFiles(files, 'Follow-up');

        pendingFollowupBatch = batch;
        pendingFollowupLocation = loc;

        const first = batch[0];
        const meta = first.metadata || {};

        document.getElementById('fv-preview-img').src = first.photoUrl;
        document.getElementById('fv-origin-badge').className = `badge ${meta.originBadgeClass || 'badge-success'}`;
        document.getElementById('fv-origin-badge').textContent = meta.originBadge || 'كاميرا مباشرة';
        document.getElementById('fv-meta-origin').textContent = meta.originLabel || 'التقاط مباشر بكاميرا الهاتف الميداني';
        document.getElementById('fv-meta-taken').textContent = meta.takenAtEgypt || new Date().toLocaleString('ar-EG');
        document.getElementById('fv-meta-device').textContent = meta.deviceModel || 'هاتف محلي';
        document.getElementById('fv-meta-exif-gps').textContent = meta.exifGps ? `${meta.exifGps.latitude}°, ${meta.exifGps.longitude}°` : 'غير متوفر بالصورة (تم اعتماد Live GPS)';

        document.getElementById('fv-loc-coords').textContent = `${loc.latitude}° N, ${loc.longitude}° E`;
        document.getElementById('fv-loc-acc').textContent = `(دقة ±${loc.accuracy}م)`;
        document.getElementById('fv-submit-time').textContent = new Date().toLocaleString('ar-EG');
        document.getElementById('fv-map-link').href = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;

        followupVerifyModal.classList.add('active');
      } catch (err) {
        e.target.value = '';
        showToast(err.message, 'error', 5000);
      }
    });
  }

  const confirmFollowupSubmitBtn = document.getElementById('btn-confirm-followup-submit');
  if (confirmFollowupSubmitBtn) {
    confirmFollowupSubmitBtn.addEventListener('click', async () => {
      if (!pendingFollowupBatch || !pendingFollowupLocation || !activityId) return;
      confirmFollowupSubmitBtn.disabled = true;
      confirmFollowupSubmitBtn.innerHTML = `<span>جاري الاعتماد والرفع...</span>`;

      try {
        const result = await ActivityService.addFollowUpPhotos(activityId, pendingFollowupBatch, user, pendingFollowupLocation);
        followupVerifyModal.classList.remove('active');
        if (followupCameraInput) followupCameraInput.value = '';
        pendingFollowupBatch = null;
        pendingFollowupLocation = null;
        showToast(`تم اعتماد وتأكيد ${result.newSession.roundTitle} بنجاح بتوقيت مصر`, 'success');
        renderActivityDetailView(activityId);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        confirmFollowupSubmitBtn.disabled = false;
        confirmFollowupSubmitBtn.innerHTML = `<img src="../assets/icons/check-circle-2.svg" class="ui-icon" alt="" /><span>اعتماد وتأكيد رفع الصورة والموقع</span>`;
      }
    });
  }

  // Creation Form Initial Camera Handling
  let currentDeviceLocation = null;
  let initialProcessedPhotos = [
    {
      photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
      photoHash: 'a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9',
      sizeKb: 176,
      width: 1280,
      height: 720
    }
  ];

  const cameraInput = document.getElementById('camera-input');
  const triggerCamBtn = document.getElementById('trigger-camera-btn');
  const submitActBtn = document.getElementById('submit-activity-btn');

  if (triggerCamBtn && cameraInput) {
    triggerCamBtn.addEventListener('click', async () => {
      try {
        showToast('جاري فحص إذن الموقع الجغرافي GPS...', 'info');
        currentDeviceLocation = await MediaService.requestDeviceLocation();
        cameraInput.click();
      } catch (err) {
        showToast(err.message, 'error', 5000);
        if (submitActBtn) submitActBtn.disabled = true;
      }
    });

    cameraInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        showToast('جاري ضغط الصورة وفحص البصمة الرقمية...', 'info');
        const batch = await MediaService.processImageFiles(files, 'Round 1');
        initialProcessedPhotos = batch;

        const first = batch[0];
        const previewBox = document.getElementById('camera-preview-box');
        if (previewBox) {
          previewBox.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
              <img src="${first.photoUrl}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" />
            </div>
          `;
        }

        const compTel = document.getElementById('compression-telemetry');
        if (compTel) {
          compTel.style.display = 'block';
          document.getElementById('tel-res').textContent = `الأبعاد: ${first.width}×${first.height} px`;
          document.getElementById('tel-size').textContent = `الحجم المضغوط: ${first.sizeKb} KB`;
        }

        if (submitActBtn) submitActBtn.disabled = false;
        showToast('تم فحص بصمة الصورة والموقع GPS بنجاح', 'success');
      } catch (err) {
        e.target.value = '';
        showToast(err.message, 'error', 5000);
        if (submitActBtn) submitActBtn.disabled = true;
      }
    });
  }

  // Create Activity Form Submit Handler
  const activityForm = document.getElementById('activity-form');
  if (activityForm) {
    activityForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientVal = clientCombo ? clientCombo.getValue() : '';
      const branchVal = branchCombo ? branchCombo.getValue() : '';
      const coordBranchVal = coordBranchCombo ? coordBranchCombo.getValue() : '';
      const activityVal = activityCombo ? activityCombo.getValue() : '';
      const activityTypeVal = activityTypeCombo ? activityTypeCombo.getValue() : '';
      const activityCountVal = Number(countSelect ? countSelect.value : 1) || 1;
      const selectedBrands = brandsMultiCombo ? brandsMultiCombo.getSelected() : [];
      const skuVal = skuCombo ? skuCombo.getValue() : '';
      const magDateVal = magInput ? magInput.value : '';
      const actDateEl = document.getElementById('f-activity-date');
      const actDateVal = actDateEl ? actDateEl.value : '';

      if (!clientVal || !branchVal || !coordBranchVal || !activityVal || !activityTypeVal || !skuVal) {
        return showToast('يرجى استكمال جميع الحقول الإلزامية', 'warning');
      }

      if (activityVal === 'فرشة مجلة' && !magDateVal) {
        return showToast('يرجى تحديد تاريخ إصدار المجلة عند اختيار "فرشة مجلة"', 'warning');
      }

      if (selectedBrands.length === 0) {
        return showToast('يرجى اختيار علامة تجارية واحدة على الأقل', 'warning');
      }

      const payload = {
        coordinatorId: user.employeeId,
        coordinatorName: user.fullName,
        client: clientVal,
        branch: branchVal,
        coordinatorBranch: coordBranchVal,
        activity: activityVal,
        activityType: activityTypeVal,
        activityCount: activityCountVal,
        brands: selectedBrands,
        skuVariant: skuVal,
        activityDate: actDateVal || undefined,
        magazineDate: activityVal === 'فرشة مجلة' ? magDateVal : '',
        photoUrl: initialProcessedPhotos[0].photoUrl,
        photoHash: initialProcessedPhotos[0].photoHash,
        initialPhotos: initialProcessedPhotos,
        location: currentDeviceLocation
      };

      if (submitActBtn) {
        submitActBtn.disabled = true;
        submitActBtn.innerHTML = `<span>جاري اعتماد البيانات...</span>`;
      }

      try {
        const res = await ActivityService.submitActivity(payload);
        showToast('تم تسجيل بطاقة النشاط بنجاح', 'success');
        setTimeout(() => {
          window.location.href = `./activity-card.html?id=${res.record.id}`;
        }, 400);
      } catch (err) {
        showToast(err.message, 'error');
        if (submitActBtn) {
          submitActBtn.disabled = false;
          submitActBtn.innerHTML = `<img src="../assets/icons/check-circle-2.svg" class="ui-icon" alt="" /><span>اعتماد وإرسال بطاقة النشاط</span>`;
        }
      }
    });
  }

  // View existing activity if ?id= is present
  if (activityId) {
    renderActivityDetailView(activityId);
  }
});
