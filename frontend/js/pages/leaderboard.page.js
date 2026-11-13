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
  
  // Item 10: The leaderboard must ONLY list field coordinators (exclude supervisors/managers)
  const extraCoordinators = [
    { coordinatorId: 'ADCO-104', name: 'محمد عادل الشناوي', branch: 'الإسكندرية - المنتزه', role: 'coordinator', acceptedCount: 7, totalScore: 89, submissionsCount: 8 },
    { coordinatorId: 'ADCO-105', name: 'نهى كمال عبد العزيز', branch: 'الإسكندرية - سيدي جابر', role: 'coordinator', acceptedCount: 5, totalScore: 84, submissionsCount: 6 },
    { coordinatorId: 'ADCO-106', name: 'كريم طارق الفقي', branch: 'برج العرب', role: 'coordinator', acceptedCount: 4, totalScore: 78, submissionsCount: 5 }
  ];

  let merged = [...computed];
  extraCoordinators.forEach((ec) => {
    if (!merged.some((m) => m.coordinatorId === ec.coordinatorId)) {
      merged.push(ec);
    }
  });

  // Strict coordinator filter (Item 10)
  merged = merged.filter((item) => {
    const r = (item.role || '').toLowerCase();
    const isCoord = !r || r === 'coordinator';
    const notSupervisor = !item.name.includes('مشرف') && !item.name.includes('مدير');
    return isCoord && notSupervisor;
  });

  // Dynamic filter state
  let currentPeriod = 'month';
  let selectedMonth = '2026-11';
  let searchQuery = '';

  function getProcessedData() {
    let list = merged.map((item) => {
      let score = item.totalScore || 80;
      let accepted = item.acceptedCount || 4;
      let total = item.submissionsCount || accepted;

      if (currentPeriod === 'week') {
        score = Math.max(70, Math.min(100, Math.round(score * 0.95)));
        accepted = Math.max(1, Math.round(accepted * 0.4));
        total = Math.max(accepted, Math.round(total * 0.45));
      } else if (currentPeriod === 'all') {
        score = Math.max(75, Math.min(100, Math.round(score * 1.02)));
        accepted = accepted * 3;
        total = total * 3;
      }

      // If viewing past locked month
      if (selectedMonth === '2026-10') {
        score = Math.max(72, Math.min(98, Math.round(score * 0.98)));
      } else if (selectedMonth === '2026-09') {
        score = Math.max(70, Math.min(95, Math.round(score * 0.94)));
      }

      const qualityRate = total > 0 ? `${Math.round((accepted / total) * 100)}%` : '100%';

      return {
        ...item,
        totalScore: score,
        acceptedCount: accepted,
        submissionsCount: total,
        qualityRate
      };
    });

    list.sort((a, b) => b.totalScore - a.totalScore);
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

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
    // Item 11: Trend +/- removed from coordinator view
    if (topMount && !isSearching) {
      const top3 = list.slice(0, 3);
      if (top3.length === 0) {
        topMount.innerHTML = '';
      } else {
        const medalImgs = ['medal-gold.avif', 'medal-silver.avif', 'medal-bronze.avif'];
        topMount.innerHTML = top3
          .map((item, idx) => {
            const medal = medalImgs[idx] || 'medal-gold.avif';
            const rankLabel = idx === 0 ? 'الأول' : (idx === 1 ? 'الثاني' : 'الثالث');

            return `
              <div class="top-card rank-${item.rank}">
                <div class="top-card-head">
                  <div class="top-card-user">
                    <div class="top-card-rank-indicator">
                      <span class="top-card-rank-num">#${item.rank}</span>
                    </div>
                    <div class="top-card-meta">
                      <strong class="top-card-name" title="${item.name}">
                        ${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}
                      </strong>
                      <span class="top-card-sub" title="${item.branch}">
                        <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                        <span>${item.branch}</span>
                        <span class="top-card-sub-dot">•</span>
                        <span>${item.acceptedCount} أنشطة</span>
                      </span>
                    </div>
                  </div>
                  <div class="top-card-medal" title="المركز ${rankLabel}">
                    <img src="${assetsPrefix}images/${medal}" alt="المركز ${item.rank}" />
                  </div>
                </div>

                <div class="top-card-stats">
                  <div class="top-stat-item">
                    <span class="top-stat-label">النقاط:</span>
                    <span class="top-stat-val highlight">${item.totalScore}/100</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">المقبولة:</span>
                    <span class="top-stat-val">${item.acceptedCount}</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">الجولات:</span>
                    <span class="top-stat-val">${item.submissionsCount}</span>
                  </div>
                  <div class="top-stat-item">
                    <span class="top-stat-label">الجودة:</span>
                    <span class="top-stat-val success">${item.qualityRate}</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    // 2. Render Full Leaderboard List Table
    if (listMount) {
      // In normal mode, rows start from rank #4 onwards. In search mode, show all matching rows (including top 3)
      const displayRows = isSearching ? list : list.slice(3);

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

          return `
            <div class="ranking-row ${isUser ? 'is-current-user' : ''}">
              <div class="cell-rank">
                <span class="rank-circle">${item.rank}</span>
              </div>

              <div class="cell-user">
                <div class="user-info-sm">
                  <div class="user-name-sm">
                    <strong>${typeof formatTwoWordName === 'function' ? formatTwoWordName(item.name) : item.name}</strong>
                    ${isUser ? '<span class="you-pill">أنت</span>' : ''}
                  </div>
                  <span class="user-sub-sm">
                    <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                    <span>${item.branch}</span>
                  </span>
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
                <span class="stat-badge-accepted">${item.acceptedCount}</span>
              </div>

              <div class="cell-stat">
                <span class="stat-badge-rounds">${item.submissionsCount}</span>
              </div>

              <div class="cell-stat">
                <span class="stat-badge-quality">${item.qualityRate}</span>
              </div>
            </div>
          `;
        })
        .join('');
    }
    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') window.refreshIcons();
  }

  // Bind Month Selector (Item 10)
  const monthSelect = document.getElementById('lb-month-select');
  const monthBadge = document.getElementById('lb-month-status-badge');
  if (monthSelect) {
    monthSelect.addEventListener('change', () => {
      selectedMonth = monthSelect.value;
      if (monthBadge) {
        if (selectedMonth === '2026-11') {
          monthBadge.textContent = 'مؤقت (قيد الاحتساب)';
          monthBadge.className = 'badge badge-warning';
        } else {
          monthBadge.textContent = 'معتمد ومغلق';
          monthBadge.className = 'badge badge-success';
        }
      }
      renderView();
    });
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
