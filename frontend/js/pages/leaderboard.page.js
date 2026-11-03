/**
 * ADCO Field Operations System - Leaderboard Page Controller
 * Single Responsibility: Coordinator leaderboard ranking calculations, podium top-3 render, and honor roll
 */

import { AuthService } from '../services/auth.service.js';
import { ReportingService } from '../services/reporting.service.js';
import { NavbarComponent } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.checkAuthGuard();
  NavbarComponent.render();

  const computed = ReportingService.getLeaderboard();
  const extraCoordinators = [
    { coordinatorId: 'ADCO-104', coordinatorName: 'محمد عادل الشناوي', branch: 'الإسكندرية - المنتزه', acceptedCount: 7, totalScore: 89, submissionsCount: 8 },
    { coordinatorId: 'ADCO-105', coordinatorName: 'نهى كمال عبد العزيز', branch: 'الإسكندرية - سيدي جابر', acceptedCount: 5, totalScore: 84, submissionsCount: 6 },
    { coordinatorId: 'ADCO-106', coordinatorName: 'كريم طارق الفقي', branch: 'برج العرب', acceptedCount: 4, totalScore: 78, submissionsCount: 5 }
  ];

  const merged = [...computed];
  extraCoordinators.forEach((ec) => {
    if (!merged.some((m) => m.coordinatorId === ec.coordinatorId)) {
      merged.push(ec);
    }
  });

  merged.sort((a, b) => b.totalScore - a.totalScore);
  merged.forEach((m, idx) => (m.rank = `#${idx + 1}`));

  const top3 = merged.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const podiumMount = document.getElementById('podium-mount');
  if (podiumMount) {
    podiumMount.innerHTML = podiumOrder
      .map((p) => {
        let medalImg = 'medal-bronze.svg';
        if (p.rank === '#1') medalImg = 'medal-gold.svg';
        else if (p.rank === '#2') medalImg = 'medal-silver.svg';

        return `
          <div class="podium-col ${p.rank === '#1' ? 'first' : ''}">
            <img src="../assets/images/${medalImg}" alt="${p.rank}" class="podium-medal-img" />
            <strong style="font-size: 0.95rem; margin: 4px 0; color: var(--adco-green-deep);">${p.coordinatorName}</strong>
            <span style="font-size: 0.78rem; color: var(--adco-gray-600); margin-bottom: 8px;">${p.branch}</span>
            <span class="badge badge-mint">${p.totalScore}/100 نقطة</span>
          </div>
        `;
      })
      .join('');
  }

  const listMount = document.getElementById('leaderboard-list');
  if (listMount) {
    listMount.innerHTML = merged
      .map(
        (item) => `
        <div class="rank-row" style="${user && user.employeeId === item.coordinatorId ? 'border: 2px solid var(--adco-green-primary); background: #f0fdf4;' : ''}">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="rank-num">${item.rank}</div>
            <div>
              <strong style="color: var(--adco-green-deep); font-size: 0.95rem; display: block;">${item.coordinatorName}</strong>
              <span style="font-size: 0.78rem; color: var(--adco-gray-600);">${item.branch} (${item.coordinatorId})</span>
            </div>
          </div>
          <div style="text-align: left; display: flex; align-items: center; gap: 12px;">
            <div style="text-align: left; display: none; sm:block;">
              <span style="font-size: 0.75rem; color: var(--adco-gray-600); display: block;">الأنشطة المعتمدة</span>
              <strong style="color: var(--adco-green-primary); font-size: 0.85rem;">${item.acceptedCount} نشاط</strong>
            </div>
            <span class="badge badge-warning" style="font-size: 0.88rem; font-weight: 800; background: #fffbeb;">
              <img src="../assets/icons/star.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>${item.totalScore}/100</span>
            </span>
          </div>
        </div>
      `
      )
      .join('');
  }
});
