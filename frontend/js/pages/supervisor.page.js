/**
 * ADCO Field Operations System - Supervisor Panel Page Controller
 * Single Responsibility: Supervisor review panel, 100-Point scoring modal,
 * activity start date modifications, audit history modal, and CSV export triggers.
 */

import { AuthService } from '../services/auth.service.js';
import { ActivityService } from '../services/activity.service.js';
import { EvaluationService } from './../services/evaluation.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { NavbarComponent } from '../components/navbar.js';
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
  const user = AuthService.checkAuthGuard('supervisor');
  if (!user) return;

  NavbarComponent.render();

  const modal = document.getElementById('review-modal');
  const auditModal = document.getElementById('activity-audit-modal');
  const roundSelect = document.getElementById('rev-round-select');
  const inputNewAct = document.getElementById('eval-score-new-act');
  const inputQuality = document.getElementById('eval-score-quality');
  const inputContinuity = document.getElementById('eval-score-continuity');
  const inputDocs = document.getElementById('eval-score-docs');
  const liveTotalBadge = document.getElementById('eval-live-total-badge');

  let currentEvaluatingActivity = null;
  let statusFilter = 'ALL';

  function updateEvalTotal() {
    if (!inputNewAct) return;
    const s1 = Number(inputNewAct.value) || 0;
    const s2 = Number(inputQuality.value) || 0;
    const s3 = Number(inputContinuity.value) || 0;
    const s4 = Number(inputDocs.value) || 0;
    const sum = Math.min(100, Math.max(0, s1 + s2 + s3 + s4));
    const tier = ScoreCalculator.resolveTierBadge(sum);
    if (liveTotalBadge) {
      liveTotalBadge.className = `badge ${tier.className}`;
      liveTotalBadge.textContent = `${sum} / 100 نقطة (${tier.label})`;
    }
  }

  [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((input) => {
    if (input) input.addEventListener('input', updateEvalTotal);
  });

  const closeReviewBtn = document.getElementById('close-review-modal');
  if (closeReviewBtn) closeReviewBtn.addEventListener('click', () => modal.classList.remove('active'));
  const closeAuditBtn = document.getElementById('close-audit-modal');
  if (closeAuditBtn) closeAuditBtn.addEventListener('click', () => auditModal.classList.remove('active'));

  function renderReviewActDetails(act) {
    const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
    const shareFormatted = `${(1 / brandCount).toFixed(2)} (${Math.round((1 / brandCount) * 100)}%)`;
    const ratingStats = ScoreCalculator.computeOverallRating(act);
    const statusBadgeClass = act.status === 'Accepted' ? 'badge-success' : act.status === 'Rejected' ? 'badge-danger' : 'badge-warning';

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
        <div>
          <h4 style="margin: 0 0 2px 0; color: var(--adco-green-deep); font-size: 1.05rem;">${act.client}</h4>
          <span style="font-size: 0.78rem; color: var(--adco-gray-600);">${act.branch}</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <span class="badge badge-warning" style="font-weight: 700; font-size: 0.78rem;">
            <img src="../assets/icons/star.svg" class="ui-icon ui-icon-xs" alt="" />
            <span>${ratingStats.badgeText}</span>
          </span>
          <span class="badge ${statusBadgeClass}">${act.status}</span>
        </div>
      </div>

      <div class="responsive-form-grid" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; font-size: 0.78rem; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--adco-gray-200);">
        <div>
          <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">المنسق الميداني:</span>
          <strong>${act.coordinatorName}</strong>
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
          <strong dir="ltr" style="color: var(--adco-green-deep);">${act.activityDateFormatted || act.activityDate || '-'}</strong>
        </div>
        <div>
          <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">تاريخ انتهاء النشاط:</span>
          <strong dir="ltr">${act.endDate || (act.closedAt ? act.closedAt.slice(0, 16).replace('T', ' ') : 'نشط ومستمر')}</strong>
        </div>
        <div style="grid-column: 1 / -1;">
          <span style="color: var(--adco-gray-500); display: block; font-size: 0.7rem;">العلامات التجارية وحصة العرض:</span>
          <strong style="color: var(--adco-green-dark);">${(act.brands || []).join('، ')} (حصة البراند: ${shareFormatted})</strong>
        </div>
      </div>
    `;
  }

  function renderList() {
    const list = ActivityService.getAllActivities();
    const searchVal = ((document.getElementById('search-activities-input') || {}).value || '').trim().toLowerCase();

    const filtered = list.filter((act) => {
      if (statusFilter !== 'ALL' && act.status !== statusFilter) return false;
      if (searchVal) {
        return (
          (act.client || '').toLowerCase().includes(searchVal) ||
          (act.coordinatorName || '').toLowerCase().includes(searchVal) ||
          (act.id || '').toLowerCase().includes(searchVal) ||
          (act.branch || '').toLowerCase().includes(searchVal)
        );
      }
      return true;
    });

    const mount = document.getElementById('supervisor-activities-mount');
    if (!mount) return;

    if (filtered.length === 0) {
      mount.innerHTML = `<div style="text-align:center; padding:32px; color:var(--adco-gray-500);">لا توجد أنشطة تطابق البحث أو الفلتر المحدد</div>`;
      return;
    }

    mount.innerHTML = filtered
      .map((act) => {
        const ratingStats = ScoreCalculator.computeOverallRating(act);
        const statusBadgeClass = act.status === 'Accepted' ? 'badge-success' : act.status === 'Rejected' ? 'badge-danger' : 'badge-warning';

        return `
          <div class="card" style="margin-bottom: 12px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong style="font-size: 1.05rem; color: var(--adco-green-deep);">${act.client}</strong>
                <span style="font-size: 0.8rem; color: var(--adco-gray-600); margin-right: 8px;">(${act.branch})</span>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="badge ${statusBadgeClass}">${act.status}</span>
                <span class="badge badge-mint">${ratingStats.totalWeightedScore}/100</span>
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--adco-gray-700); margin-bottom: 12px;">
              <span>المنسق: <strong>${act.coordinatorName}</strong></span> |
              <span>العلامات: <strong>${(act.brands || []).join('، ')}</strong></span> |
              <span>بدء النشاط: <strong dir="ltr">${act.activityDateFormatted || act.activityDate || '-'}</strong></span> |
              <span>انتهاء النشاط: <strong dir="ltr">${act.endDate || 'نشط ومستمر'}</strong></span>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm open-eval-btn" data-id="${act.id}">
                <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>فحص وتقييم النشاط</span>
              </button>
              <a href="./activity-card.html?id=${act.id}" class="btn btn-secondary btn-sm">
                <span>عرض البطاقة الكاملة</span>
              </a>
            </div>
          </div>
        `;
      })
      .join('');

    mount.querySelectorAll('.open-eval-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = ActivityService.getActivityById(btn.dataset.id);
        if (!act) return;
        currentEvaluatingActivity = act;

        document.getElementById('rev-act-id').value = act.id;
        document.getElementById('modal-act-title').innerHTML = `
          <img src="../assets/icons/clipboard-edit.svg" class="ui-icon ui-icon-md" alt="" />
          <span>فحص وتقييم: ${act.client} (${act.id})</span>
        `;

        document.getElementById('rev-act-details').innerHTML = renderReviewActDetails(act);

        const revDateInput = document.getElementById('rev-activity-date');
        if (revDateInput) {
          revDateInput.value = getEgyptDateTimeLocalString(act.activityDate || new Date());
        }

        const evalStats = ScoreCalculator.computeWeightedEvaluation(act);
        inputNewAct.value = evalStats.breakdown.newActivity.score;
        inputQuality.value = evalStats.breakdown.executionQuality.score;
        inputContinuity.value = evalStats.breakdown.continuity.score;
        inputDocs.value = evalStats.breakdown.documentation.score;
        updateEvalTotal();

        document.getElementById('rev-status').value = act.status === 'Under Review' ? 'Accepted' : act.status;
        document.getElementById('rev-notes').value = act.supervisorNotes || '';
        modal.classList.add('active');
      });
    });
  }

  // Review Form Submit Handler
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('rev-act-id').value;
      const status = document.getElementById('rev-status').value;
      const notes = document.getElementById('rev-notes').value;

      const breakdown = {
        newActivity: Number(inputNewAct.value) || 0,
        executionQuality: Number(inputQuality.value) || 0,
        continuity: Number(inputContinuity.value) || 0,
        documentation: Number(inputDocs.value) || 0
      };
      const rawScore = Number(((breakdown.executionQuality / 20) * 10).toFixed(1));
      const newActivityDate = document.getElementById('rev-activity-date') ? document.getElementById('rev-activity-date').value : undefined;

      try {
        const res = await EvaluationService.reviewActivity(id, status, rawScore, notes, 1, breakdown, user, newActivityDate);
        modal.classList.remove('active');
        showToast(`تم التحديث بنجاح! ${res.ratingStats.badgeText}`, 'success');
        renderList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      statusFilter = chip.dataset.st;
      renderList();
    });
  });

  const searchInput = document.getElementById('search-activities-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderList);
  }

  renderList();
});
