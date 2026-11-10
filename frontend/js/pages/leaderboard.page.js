/**
 * ADCO Field Operations System - leaderboard.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const Auth = global.AuthManager || global.AuthService;
    const Activity = global.ActivityManager || global.ActivityService;
    const Router = global.AppRouter;

  try {
    const user = Auth ? Auth.checkAuthGuard() : null;
    if (Router && typeof Router.init === 'function') {
      try {
        Router.init();
      } catch (routerErr) {
        console.warn('[Leaderboard] AppRouter.init failed gracefully:', routerErr);
      }
    }
  } catch (authErr) {
    console.warn('[Leaderboard] Auth check failed gracefully:', authErr);
  }

    const computed = Activity && typeof Activity.getLeaderboardData === 'function' ? Activity.getLeaderboardData() : [];
    const extraCoordinators = [
      { coordinatorId: 'ADCO-501', name: 'أيمن عبد الرحمن الروبي (مشرف منسق)', branch: 'مسؤول فروع فتح الله جملة ماركت - الإسكندرية', acceptedCount: 6, totalScore: 92, submissionsCount: 6 },
      { coordinatorId: 'ADCO-104', name: 'محمد عادل الشناوي', branch: 'الإسكندرية - المنتزه', acceptedCount: 7, totalScore: 89, submissionsCount: 8 },
      { coordinatorId: 'ADCO-105', name: 'نهى كمال عبد العزيز', branch: 'الإسكندرية - سيدي جابر', acceptedCount: 5, totalScore: 84, submissionsCount: 6 },
      { coordinatorId: 'ADCO-106', name: 'كريم طارق الفقي', branch: 'برج العرب', acceptedCount: 4, totalScore: 78, submissionsCount: 5 }
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
    const podiumOrder = [top3[0], top3[1], top3[2]].filter(Boolean);

    document.getElementById('podium-mount').innerHTML = podiumOrder
      .map((p) => {
        let rankClass = 'rank-1 first';
        let rankLabel = 'المركز الأول 🥇';
        let medalImg = 'medal-gold.svg';
        let stepNum = '1';
        let badgeClass = 'badge-gold';

        if (p.rank === '#2') {
          rankClass = 'rank-2 second';
          rankLabel = 'المركز الثاني 🥈';
          medalImg = 'medal-silver.svg';
          stepNum = '2';
          badgeClass = 'badge-silver';
        } else if (p.rank === '#3') {
          rankClass = 'rank-3 third';
          rankLabel = 'المركز الثالث 🥉';
          medalImg = 'medal-bronze.svg';
          stepNum = '3';
          badgeClass = 'badge-bronze';
        }

        return `
          <div class="podium-col podium-card ${rankClass}">
            <div class="podium-rank-tag">${rankLabel}</div>
            <div class="podium-avatar-wrap">
              <img src="../assets/images/${medalImg}" alt="${rankLabel}" class="podium-medal-img" />
            </div>
            <strong class="podium-name">${typeof formatTwoWordName === 'function' ? formatTwoWordName(p.name) : p.name}</strong>
            <span class="podium-branch">${p.branch}</span>
            <span class="badge ${badgeClass} podium-score-badge">${p.totalScore}/100 نقطة</span>
            <div class="podium-pedestal" aria-label="${rankLabel}">
              <span class="podium-pedestal-num">${stepNum}</span>
            </div>
          </div>
        `;
      })
      .join('');

    document.getElementById('leaderboard-list').innerHTML = merged
      .map(
        (item) => `
        <div class="rank-row" style="${user && user.employeeId === item.coordinatorId ? 'border: 2px solid var(--adco-green-primary); background: #f0fdf4;' : ''}">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="rank-num">${item.rank}</div>
            <div>
              <strong style="font-size: 0.95rem; color: var(--adco-green-deep);">
                ${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name} ${user && user.employeeId === item.coordinatorId ? '(أنت)' : ''}
              </strong>
              <p style="font-size: 0.78rem; margin: 0;">${item.branch} | الأنشطة المقبولة: ${item.acceptedCount}</p>
            </div>
          </div>
          <div>
            <span class="badge badge-success" style="font-size: 0.88rem; padding: 6px 12px;">${item.totalScore}/100 نقطة</span>
          </div>
        </div>
      `
      )
      .join('');
})(typeof window !== 'undefined' ? window : globalThis);
