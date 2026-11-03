/**
 * ADCO Field Operations System - Dashboard Page Controller
 * Single Responsibility: Coordinator overview dashboard, KPI metric cards, filtering, and activity grid cards
 */

import { AuthService } from '../services/auth.service.js';
import { ActivityService } from '../services/activity.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { NavbarComponent } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.checkAuthGuard();
  if (!user) return;

  NavbarComponent.render();

  const welcomeTitle = document.getElementById('welcome-title');
  const welcomeRole = document.getElementById('welcome-role');
  if (welcomeTitle) welcomeTitle.textContent = `مرحباً، ${user.fullName}`;
  if (welcomeRole) welcomeRole.textContent = `قطاع العمليات: ${user.branch || 'الإسكندرية'} | الرقم الوظيفي: ${user.employeeId}`;

  let currentFilter = 'ALL';

  function renderDashboard() {
    const activities = ActivityService.getAllActivities();
    const userActivities = user.role === 'supervisor'
      ? activities
      : activities.filter((a) => a.coordinatorId === user.employeeId);

    // KPI Counters
    const kpiTotal = document.getElementById('kpi-total') || document.getElementById('kpi-total-activities');
    const kpiAccepted = document.getElementById('kpi-accepted') || document.getElementById('kpi-accepted-activities');
    const kpiScore = document.getElementById('kpi-avg-score');

    const totalCount = userActivities.length;
    const acceptedCount = userActivities.filter((a) => a.status === 'Accepted').length;

    let scoreSum = 0;
    userActivities.forEach((act) => {
      scoreSum += ScoreCalculator.computeWeightedEvaluation(act).totalWeightedScore;
    });
    const avgScore = totalCount > 0 ? Math.round(scoreSum / totalCount) : 0;

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiAccepted) kpiAccepted.textContent = acceptedCount;
    if (kpiScore) kpiScore.textContent = `${avgScore}/100`;

    // Filter list
    const filtered = userActivities.filter((act) => {
      if (currentFilter === 'ALL') return true;
      if (currentFilter === 'Accepted') return act.status === 'Accepted';
      if (currentFilter === 'Under Review') return act.status === 'Under Review';
      if (currentFilter === 'Rejected') return act.status === 'Rejected';
      if (currentFilter === 'ACTIVE') return !act.isClosed;
      if (currentFilter === 'CLOSED') return act.isClosed;
      return true;
    });

    const container = document.getElementById('activities-list') || document.getElementById('activities-grid-mount');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: #ffffff; border-radius: var(--radius-md); border: 1.5px dashed var(--adco-gray-300);">
          <img src="../assets/icons/sheet.svg" class="ui-icon ui-icon-xl" alt="" style="margin-bottom: 12px; opacity: 0.5;" />
          <h3 style="color: var(--adco-gray-700); margin-bottom: 6px;">لا توجد أنشطة مسجلة حالياً</h3>
          <p style="font-size: 0.85rem; color: var(--adco-gray-500); margin-bottom: 16px;">ابدأ بتوثيق أول نشاط ميداني معتمد واحتساب نقاط التقييم</p>
          <a href="./activity-card.html" class="btn btn-primary btn-sm">
            <img src="../assets/icons/camera.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>توثيق نشاط ميداني الآن</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((act) => {
        const ratingStats = ScoreCalculator.computeOverallRating(act);
        const statusBadgeClass = act.status === 'Accepted' ? 'badge-success' : act.status === 'Rejected' ? 'badge-danger' : 'badge-warning';

        return `
          <a href="./activity-card.html?id=${act.id}" class="activity-card-item">
            <img src="${act.photoUrl}" alt="${act.client}" class="activity-card-thumb" />
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 6px;">
                  <strong style="font-size: 0.95rem; color: var(--adco-green-deep); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${act.client}</strong>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    ${act.isClosed ? `<span class="badge badge-success" style="font-size:0.68rem; padding: 2px 6px;">منتهي</span>` : act.closureRequested ? `<span class="badge badge-warning" style="font-size:0.68rem; padding: 2px 6px;">طلب إنهاء</span>` : ''}
                    <span class="badge ${statusBadgeClass}">${act.status}</span>
                  </div>
                </div>
                <p style="font-size: 0.78rem; margin-bottom: 6px; color: var(--adco-gray-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${act.branch} | <strong>${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})</strong>
                </p>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; gap: 6px; margin-top: auto;">
                <span class="badge badge-warning" style="background:#fffbeb; color:#92400e; font-weight: 700; white-space: nowrap;">
                  <img src="../assets/icons/star.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>التقييم: ${ratingStats.totalWeightedScore}/100</span>
                </span>
                <span style="color: var(--adco-gray-600); font-size: 0.74rem; white-space: nowrap;">
                  ${ratingStats.totalSessions} ${ratingStats.totalSessions === 1 ? 'متابعة' : 'متابعات'}
                </span>
              </div>
            </div>
          </a>
        `;
      })
      .join('');
  }

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderDashboard();
    });
  });

  renderDashboard();
});
