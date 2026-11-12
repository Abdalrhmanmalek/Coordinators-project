/**
 * ADCO Field Operations System - leaderboard.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller for the Top Coordinators Leaderboard
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const Activity = global.ActivityManager || global.ActivityService;
  const Router = global.AppRouter;
  const formatTwoWordName = global.formatTwoWordName || (typeof window !== 'undefined' ? window.formatTwoWordName : null);

  const isHttp = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
  const isSubPage = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
  const assetsPrefix = isHttp ? '/assets/' : (isSubPage ? '../assets/' : './assets/');

  function normalizeArabic(str) {
    if (!str) return '';
    return String(str)
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/[ؤ]/g, 'و')
      .replace(/[ئ]/g, 'ي');
  }

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

  const trendRegistry = {
    'ADCO-501': { dir: 'up', delta: 2 },
    'ADCO-104': { dir: 'down', delta: 1 },
    'ADCO-101': { dir: 'up', delta: 1 },
    'ADCO-102': { dir: 'up', delta: 2 },
    'ADCO-105': { dir: 'same', delta: 0 },
    'ADCO-106': { dir: 'down', delta: 2 }
  };

  function getTrend(cid, rank) {
    if (trendRegistry[cid]) return trendRegistry[cid];
    if (rank === 1) return { dir: 'up', delta: 2 };
    if (rank === 2) return { dir: 'up', delta: 1 };
    if (rank === 3) return { dir: 'same', delta: 0 };
    return rank % 2 === 0 ? { dir: 'down', delta: 1 } : { dir: 'up', delta: 1 };
  }

  function renderTrendBadge(trend) {
    if (!trend || trend.dir === 'same' || trend.delta === 0) {
      return `
        <span class="rank-trend trend-same" title="ثبات الترتيب دون تغيير">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      `;
    }
    if (trend.dir === 'up') {
      return `
        <span class="rank-trend trend-up" title="صعود +${trend.delta} مراكز عن الفترة السابقة">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
          <span>+${trend.delta}</span>
        </span>
      `;
    }
    return `
      <span class="rank-trend trend-down" title="هبوط -${trend.delta} مراكز عن الفترة السابقة">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
        <span>-${trend.delta}</span>
      </span>
    `;
  }

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
      const q = normalizeArabic(searchQuery);
      list = list.filter((item) => {
        const nameNorm = normalizeArabic(item.name);
        const branchNorm = normalizeArabic(item.branch);
        const cidNorm = normalizeArabic(item.coordinatorId);
        return nameNorm.includes(q) || branchNorm.includes(q) || cidNorm.includes(q);
      });
    }

    return list;
  }

  function renderView() {
    const list = getProcessedData();
    const isSearching = Boolean(searchQuery.trim());
    const topSection = document.querySelector('.top-cards-section');
    const topMount = document.getElementById('top-cards-mount');
    const listMount = document.getElementById('leaderboard-list');

    // When actively searching, hide the top-3 podium cards and show all matching records in the main list
    if (topSection) {
      topSection.style.display = isSearching ? 'none' : '';
    }

    // 1. Render Top 3 Cards Grid (when not searching)
    if (topMount && !isSearching) {
      const top3 = list.slice(0, 3);
      if (top3.length === 0) {
        topMount.innerHTML = '';
      } else {
        const medalImgs = ['medal-gold.svg', 'medal-silver.svg', 'medal-bronze.svg'];
        topMount.innerHTML = top3
          .map((item, idx) => {
            const medal = medalImgs[idx] || 'medal-gold.svg';
            const rankLabel = idx === 0 ? 'الأول' : (idx === 1 ? 'الثاني' : 'الثالث');
            const trend = getTrend(item.coordinatorId, item.rank);

            return `
              <div class="top-card rank-${item.rank}">
                <div class="top-card-head">
                  <div class="top-card-user">
                    <div class="top-card-rank-indicator">
                      <span class="top-card-rank-num">#${item.rank}</span>
                      ${renderTrendBadge(trend)}
                    </div>
                    <div class="top-card-meta">
                      <strong class="top-card-name" title="${item.name}">
                        ${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}
                      </strong>
                      <span class="top-card-sub" title="${item.branch}">
                        ${item.branch} • ${item.acceptedCount} أنشطة معتمدة
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
    if (listMount) {
      const displayRows = isSearching ? list : (list.length > 3 ? list.slice(3) : []);

      if (displayRows.length === 0) {
        listMount.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; color: #64748b;">
            <p style="margin: 0; font-weight: 700; font-size: 0.95rem;">لا توجد نتائج مطابقة لبحثك: "${searchQuery}"</p>
            <p style="margin: 6px 0 0; font-size: 0.8rem; color: #94a3b8;">جرب البحث باسم المنسق، المحافظة، أو الفرع</p>
          </div>
        `;
        return;
      }

      listMount.innerHTML = displayRows
        .map((item) => {
          const isUser = currentUser && currentUser.employeeId === item.coordinatorId;
          const trend = getTrend(item.coordinatorId, item.rank);

          return `
            <div class="ranking-row ${isUser ? 'is-current-user' : ''}">
              <div class="cell-rank">
                <span class="rank-circle">${item.rank}</span>
                ${renderTrendBadge(trend)}
              </div>

              <div class="cell-user">
                <div class="user-info-sm">
                  <div class="user-name-sm">
                    <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}</strong>
                    ${isUser ? '<span class="you-pill">أنت</span>' : ''}
                  </div>
                  <span class="user-sub-sm">${item.branch}</span>
                </div>
              </div>

              <div class="cell-stat points-col">
                <div class="cell-points-wrapper">
                  <div class="score-pill-row">
                    <strong class="score-main-val">${item.totalScore}</strong>
                    <span class="score-total-max">/100</span>
                  </div>
                  <div class="points-progress-track">
                    <div class="points-progress-fill" style="width: ${item.totalScore}%;"></div>
                  </div>
                </div>
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

  // Bind Live Search Input (supports typing, clearing, paste, and enter)
  const searchInput = document.getElementById('lb-search-input');
  if (searchInput) {
    const handleSearch = (e) => {
      searchQuery = (e.target.value || '').trim();
      renderView();
    };

    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('search', handleSearch);
    searchInput.addEventListener('keyup', handleSearch);
    searchInput.addEventListener('change', handleSearch);
  }

  // Initial Render
  renderView();

})(typeof window !== 'undefined' ? window : globalThis);
