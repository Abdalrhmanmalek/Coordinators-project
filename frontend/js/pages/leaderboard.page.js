/**
 * ADCO Field Operations System - leaderboard.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller for the Top Coordinators Leaderboard
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const Activity = global.ActivityManager || global.ActivityService;
  const Router = global.AppRouter;

  const isHttp = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
  const isSubPage = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
  const assetsPrefix = isHttp ? '/assets/' : (isSubPage ? '../assets/' : './assets/');

  let user = null;
  try {
    user = Auth && typeof Auth.checkAuthGuard === 'function' ? Auth.checkAuthGuard() : (Auth ? Auth.getCurrentUser() : null);
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

  // Fallback demo user if not logged in
  const currentUser = user || {
    employeeId: 'ADCO-101',
    name: 'أحمد محمود البدري',
    role: 'coordinator',
    branch: 'محرم بك - الإسكندرية'
  };

  // Base Data Set
  const computed = Activity && typeof Activity.getLeaderboardData === 'function' ? Activity.getLeaderboardData() : [];
  const extraCoordinators = [
    { coordinatorId: 'ADCO-501', name: 'أيمن عبد الرحمن الروبي (مشرف منسق)', branch: 'مسؤول فروع فتح الله - الإسكندرية', acceptedCount: 6, totalScore: 92, submissionsCount: 6 },
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

  // Dynamic filter state
  let currentPeriod = 'month';
  let searchQuery = '';

  function getProcessedData() {
    let list = merged.map((item) => {
      let score = item.totalScore || 80;
      let accepted = item.acceptedCount || 4;
      let total = item.submissionsCount || accepted;

      if (currentPeriod === 'week') {
        score = Math.max(65, Math.round(score * 0.94));
        accepted = Math.max(1, Math.round(accepted * 0.5));
        total = Math.max(accepted, Math.round(total * 0.5));
      } else if (currentPeriod === 'all') {
        score = Math.min(100, score + 4);
        accepted = accepted + 5;
        total = total + 6;
      }

      const qualityRate = Math.min(100, Math.round((score / 100) * 100));

      return {
        ...item,
        totalScore: score,
        acceptedCount: accepted,
        submissionsCount: total,
        qualityRate: `${qualityRate}%`
      };
    });

    list.sort((a, b) => b.totalScore - a.totalScore);
    list.forEach((m, idx) => (m.rank = idx + 1));

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.branch && item.branch.toLowerCase().includes(q)) ||
        (item.coordinatorId && item.coordinatorId.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function renderView() {
    const list = getProcessedData();
    const top3 = list.slice(0, 3);
    const restList = list.length > 3 ? list.slice(3) : (searchQuery.trim() ? list : []);

    // 1. Render Top 3 Cards Grid (Fish.audio Style)
    const topMount = document.getElementById('top-cards-mount');
    if (topMount) {
      if (top3.length === 0) {
        topMount.innerHTML = '';
      } else {
        const medalImgs = ['medal-gold.svg', 'medal-silver.svg', 'medal-bronze.svg'];
        topMount.innerHTML = top3
          .map((item, idx) => {
            const initial = item.name ? item.name.trim().charAt(0) : 'م';
            const medal = medalImgs[idx] || 'medal-gold.svg';
            const rankLabel = idx === 0 ? 'الأول' : (idx === 1 ? 'الثاني' : 'الثالث');

            return `
              <div class="top-card rank-${item.rank}">
                <div class="top-card-head">
                  <div class="top-card-user">
                    <div class="top-card-avatar" title="${item.name}">
                      <span>${initial}</span>
                    </div>
                    <div class="top-card-meta">
                      <strong class="top-card-name" title="${item.name}">
                        ${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}
                      </strong>
                      <span class="top-card-sub" title="${item.branch}">
                        ${item.branch} • ${item.acceptedCount} أنشطة
                      </span>
                    </div>
                  </div>
                  <div class="top-card-medal" title="المركز ${rankLabel}">
                    <img src="${assetsPrefix}images/${medal}" alt="المركز ${item.rank}" />
                  </div>
                </div>

                <div class="top-card-stats">
                  <div class="top-stat-item">
                    <span class="top-stat-label">إجمالي النقاط:</span>
                    <span class="top-stat-val highlight">${item.totalScore}/100</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">الأنشطة المقبولة:</span>
                    <span class="top-stat-val">${item.acceptedCount}</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">الجولات المكتملة:</span>
                    <span class="top-stat-val">${item.submissionsCount}</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">معدل الجودة:</span>
                    <span class="top-stat-val">${item.qualityRate}</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    // 2. Render General Ranking Rows Table (Fish.audio Style)
    const listMount = document.getElementById('leaderboard-list');
    if (listMount) {
      const displayRows = searchQuery.trim() ? list : restList;

      if (displayRows.length === 0) {
        listMount.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; color: #64748b;">
            <p style="margin: 0; font-weight: 700;">لا توجد نتائج مطابقة لـ "${searchQuery}"</p>
          </div>
        `;
        return;
      }

      listMount.innerHTML = displayRows
        .map((item) => {
          const isUser = currentUser && currentUser.employeeId === item.coordinatorId;
          const initial = item.name ? item.name.trim().charAt(0) : 'م';

          return `
            <div class="ranking-row ${isUser ? 'is-current-user' : ''}">
              <div class="cell-rank">
                <span class="rank-circle">${item.rank}</span>
              </div>

              <div class="cell-user">
                <div class="user-avatar-sm" title="${item.name}">
                  <span>${initial}</span>
                </div>
                <div class="user-info-sm">
                  <div class="user-name-sm">
                    <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}</strong>
                    ${isUser ? '<span class="you-pill">أنت</span>' : ''}
                  </div>
                  <span class="user-sub-sm">${item.branch}</span>
                </div>
              </div>

              <div class="cell-stat points-col">
                <span>${item.totalScore}/100</span>
              </div>

              <div class="cell-stat">
                <span>${item.acceptedCount}</span>
              </div>

              <div class="cell-stat">
                <span>${item.submissionsCount}</span>
              </div>

              <div class="cell-stat">
                <span>${item.qualityRate}</span>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Bind Period Switcher Tabs
  const periodBtns = document.querySelectorAll('.lb-period-btn');
  periodBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      periodBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentPeriod = btn.dataset.period || 'month';
      renderView();
    });
  });

  // Bind Live Search Input
  const searchInput = document.getElementById('lb-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      renderView();
    });
  }

  // Initial Render
  renderView();

})(typeof window !== 'undefined' ? window : globalThis);
