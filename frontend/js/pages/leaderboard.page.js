/**
 * ADCO Field Operations System - leaderboard.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller for the Gamified Leaderboard
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
    { coordinatorId: 'ADCO-501', name: 'أيمن عبد الرحمن الروبي (مشرف منسق)', branch: 'مسؤول فروع فتح الله جملة ماركت - الإسكندرية', acceptedCount: 6, totalScore: 92, submissionsCount: 6, trend: '+2' },
    { coordinatorId: 'ADCO-104', name: 'محمد عادل الشناوي', branch: 'الإسكندرية - المنتزه', acceptedCount: 7, totalScore: 89, submissionsCount: 8, trend: '+1' },
    { coordinatorId: 'ADCO-105', name: 'نهى كمال عبد العزيز', branch: 'الإسكندرية - سيدي جابر', acceptedCount: 5, totalScore: 84, submissionsCount: 6, trend: '-1' },
    { coordinatorId: 'ADCO-106', name: 'كريم طارق الفقي', branch: 'برج العرب', acceptedCount: 4, totalScore: 78, submissionsCount: 5, trend: '0' }
  ];

  const merged = [...computed];
  extraCoordinators.forEach((ec) => {
    if (!merged.some((m) => m.coordinatorId === ec.coordinatorId)) {
      merged.push(ec);
    }
  });

  // Assign realistic trends and stats if missing
  merged.forEach((m, idx) => {
    if (!m.trend) {
      m.trend = idx === 0 ? '+1' : (idx % 2 === 0 ? '+2' : (idx % 3 === 0 ? '-1' : '0'));
    }
  });

  // Dynamic filter state
  let currentPeriod = 'month';
  let searchQuery = '';

  function getFilteredData() {
    let list = [...merged];

    // Period multiplier / adjustment for gamified feel
    if (currentPeriod === 'week') {
      list = list.map((item) => ({
        ...item,
        totalScore: Math.max(60, Math.round(item.totalScore * 0.92)),
        acceptedCount: Math.max(1, Math.round((item.acceptedCount || 3) * 0.5))
      }));
    } else if (currentPeriod === 'all') {
      list = list.map((item) => ({
        ...item,
        totalScore: Math.min(100, item.totalScore + 4),
        acceptedCount: (item.acceptedCount || 3) + 5
      }));
    }

    list.sort((a, b) => b.totalScore - a.totalScore);
    list.forEach((m, idx) => (m.rank = `#${idx + 1}`));

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
    const list = getFilteredData();
    const allSorted = [...merged].sort((a, b) => b.totalScore - a.totalScore);
    allSorted.forEach((m, idx) => (m.rank = `#${idx + 1}`));

    // 1. Stats Chips
    const totalEl = document.getElementById('lb-chip-total');
    const avgEl = document.getElementById('lb-chip-avg');
    if (totalEl) totalEl.innerHTML = `إجمالي المنسقين: <strong>${allSorted.length} منسقاً</strong>`;
    if (avgEl && allSorted.length > 0) {
      const avgScore = (allSorted.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / allSorted.length).toFixed(1);
      avgEl.innerHTML = `متوسط الجودة: <strong>${avgScore}/100</strong>`;
    }

    // 2. Classore Current User Sticky Rank Banner ("Your Rank / أنت")
    const userRankBanner = document.getElementById('user-rank-banner');
    if (userRankBanner) {
      const userItem = allSorted.find((item) => item.coordinatorId === currentUser.employeeId) || allSorted[allSorted.length - 1] || {
        rank: '#4',
        name: currentUser.name || 'أحمد محمود البدري',
        branch: currentUser.branch || 'محرم بك - الإسكندرية',
        totalScore: 88,
        acceptedCount: 5
      };

      const userRankNum = parseInt(userItem.rank.replace('#', ''), 10) || 4;
      const pointsDiff = userRankNum > 1 ? Math.max(1, 95 - userItem.totalScore) : 0;
      const initial = userItem.name ? userItem.name.trim().charAt(0) : 'م';

      userRankBanner.innerHTML = `
        <div class="lb-user-left">
          <div class="lb-user-avatar" title="${userItem.name}">
            <span>${initial}</span>
          </div>
          <div class="lb-user-details">
            <div class="lb-user-badge-row">
              <span class="lb-user-tag">ترتيبك الميداني</span>
              <strong class="lb-user-name">${typeof formatTwoWordName === 'function' ? formatTwoWordName(userItem.name) : userItem.name}</strong>
            </div>
            <span class="lb-user-meta">${userItem.branch || 'المنسق المعتمد'} • ${userItem.acceptedCount || 0} نشاط معتمد</span>
          </div>
        </div>

        <div class="lb-user-right">
          <div class="lb-user-score-box">
            <span class="lb-user-score-val">${userItem.totalScore || 0}/100</span>
            <span class="lb-user-score-label">${userRankNum > 1 ? `تبقى ${pointsDiff} نقطة للمركز الأعلى` : 'متصدر الترتيب 🏆'}</span>
          </div>
          <div class="lb-user-rank-pill">
            <img src="${assetsPrefix}icons/trophy.svg" class="ui-icon ui-icon-xs" alt="" />
            <span>المركز ${userItem.rank}</span>
          </div>
        </div>
      `;
    }

    // 3. Top-3 Elevated 3D Podium
    const top3 = allSorted.slice(0, 3);
    const podiumMount = document.getElementById('podium-mount');
    if (podiumMount) {
      podiumMount.innerHTML = top3
        .map((p, idx) => {
          let rankClass = 'rank-1 first';
          let rankLabel = 'المركز الأول 🥇';
          let medalImg = 'medal-gold.svg';
          let stepNum = '1';
          let badgeClass = 'badge-gold';

          if (idx === 1) {
            rankClass = 'rank-2 second';
            rankLabel = 'المركز الثاني 🥈';
            medalImg = 'medal-silver.svg';
            stepNum = '2';
            badgeClass = 'badge-silver';
          } else if (idx === 2) {
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
                <img src="${assetsPrefix}images/${medalImg}" alt="${rankLabel}" class="podium-medal-img" />
              </div>
              <strong class="podium-name" title="${p.name}">${typeof formatTwoWordName === 'function' ? formatTwoWordName(p.name) : p.name}</strong>
              <span class="podium-branch" title="${p.branch}">${p.branch}</span>
              <span class="badge ${badgeClass} podium-score-badge">${p.totalScore}/100 نقطة</span>
              <div class="podium-pedestal" aria-label="${rankLabel}">
                <span class="podium-pedestal-num">${stepNum}</span>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // 4. General Ranking Card Rows
    const listMount = document.getElementById('leaderboard-list');
    if (listMount) {
      if (list.length === 0) {
        listMount.innerHTML = `
          <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b;">
            <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-lg" style="opacity: 0.4; margin-bottom: 8px;" alt="" />
            <p style="margin: 0; font-weight: 700;">لا توجد نتائج مطابقة لـ "${searchQuery}"</p>
          </div>
        `;
        return;
      }

      listMount.innerHTML = list
        .map((item) => {
          const isUser = currentUser && currentUser.employeeId === item.coordinatorId;
          const initial = item.name ? item.name.trim().charAt(0) : 'م';

          let trendIcon = '—';
          let trendClass = 'trend-same';
          if (item.trend && item.trend.startsWith('+')) {
            trendIcon = `▲ ${item.trend}`;
            trendClass = 'trend-up';
          } else if (item.trend && item.trend.startsWith('-')) {
            trendIcon = `▼ ${item.trend}`;
            trendClass = 'trend-down';
          }

          return `
            <div class="rank-card-row ${isUser ? 'is-current-user' : ''}">
              <div class="rank-row-left">
                <div class="rank-badge-wrap">
                  <span class="rank-num-badge">${item.rank}</span>
                  <span class="rank-trend ${trendClass}" title="حركة الترتيب">${trendIcon}</span>
                </div>

                <div class="rank-avatar" title="${item.name}">
                  <span>${initial}</span>
                </div>

                <div class="rank-info">
                  <div class="rank-name-row">
                    <strong class="rank-name">${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}</strong>
                    ${isUser ? '<span class="rank-you-tag">أنت</span>' : ''}
                  </div>
                  <p class="rank-meta">${item.branch} • ${item.acceptedCount || 0} نشاط معتمد</p>
                </div>
              </div>

              <div class="rank-row-right">
                <div class="rank-score-pill">
                  <img src="${assetsPrefix}icons/star.svg" class="ui-icon ui-icon-xs" alt="" />
                  <span>${item.totalScore}/100 نقطة</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Bind Period Filter Tabs
  const tabBtns = document.querySelectorAll('.lb-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => {
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
