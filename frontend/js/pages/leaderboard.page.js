/**
 * ADCO Field Operations System - leaderboard.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
const Auth = global.AuthManager || global.AuthService;
    const Activity = global.ActivityManager || global.ActivityService;
    const Router = global.AppRouter;

    const user = Auth ? Auth.checkAuthGuard() : null;
    if (Router && typeof Router.init === 'function') {
      Router.init();
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
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

    document.getElementById('podium-mount').innerHTML = podiumOrder
      .map((p) => {
        let medalImg = 'medal-bronze.svg';
        if (p.rank === '#1') medalImg = 'medal-gold.svg';
        else if (p.rank === '#2') medalImg = 'medal-silver.svg';

        return `
          <div class="podium-col ${p.rank === '#1' ? 'rank-1 first' : p.rank === '#2' ? 'rank-2 second' : 'rank-3 third'}">
            <img src="../assets/images/${medalImg}" alt="${p.rank}" class="podium-medal-img" />
            <strong style="font-size: 0.95rem; margin: 4px 0; color: var(--adco-green-deep);">${p.name}</strong>
            <span style="font-size: 0.78rem; color: var(--adco-gray-600); margin-bottom: 8px;">${p.branch}</span>
            <span class="badge badge-mint">${p.totalScore}/100 نقطة</span>
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
                ${item.name} ${user && user.employeeId === item.coordinatorId ? '(أنت)' : ''}
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
