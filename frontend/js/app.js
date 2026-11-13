/**
 * ADCO PWA Router, Sticky Enterprise Website Top Navigation Bar & Service Worker Registration
 * Universal Browser Script (Works on both http://localhost and file:// protocol)
 */

(function (global) {
  // Strictly prevent browser from restoring scroll down on refresh & ensure page starts at top (0,0)
  try {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (typeof document !== 'undefined') {
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
      window.addEventListener('load', () => {
        try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (_) {}
      });
      window.addEventListener('pageshow', () => {
        try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (_) {}
      });
    }
  } catch (_) {}
  class AppRouter {
    static init() {
      this.cleanupLegacyCaches();
      this.initPopstateListener();

      if (typeof global.setupNetworkListener === 'function') {
        global.setupNetworkListener(async () => {
          if (global.ActivityManager) {
            const count = await global.ActivityManager.syncOfflineSubmissions();
            if (count > 0 && typeof global.showToast === 'function') {
              global.showToast(`تمت مزامنة ${count} نشاط بنجاح مع خوادم أدكو`, 'success');
            }
          }
        });
      }

      this.renderTopNavbar();
      this.ensureProfileModal();
      this.initSmoothPageTransitions();
      this.triggerSlideUpBoxes();
      this.initDesktopOutsideModalDismissal();
      this.registerServiceWorker();
    }

    static initPopstateListener() {
      if (this._popstateInit) return;
      this._popstateInit = true;
      window.addEventListener('popstate', () => {
        this.navigateTo(window.location.href, { isPopState: true });
      });
    }

    /**
     * Desktop Outside-Click Dismissal:
     * When any floating window or modal is open, clicking anywhere outside the window bounds
     * automatically closes/dismisses it without needing to click the 'X' button.
     */
    static initDesktopOutsideModalDismissal() {
      if (this._outsideDismissalInit) return;
      this._outsideDismissalInit = true;

      document.addEventListener('click', (e) => {
        const overlay = e.target;
        if (!overlay) return;

        if (
          overlay.classList &&
          (overlay.classList.contains('modal-overlay') || overlay.classList.contains('lightbox-overlay'))
        ) {
          overlay.classList.remove('active');
          if (overlay.classList.contains('custom-modal-backdrop') || overlay.id === 'product-picker-modal') {
            overlay.classList.add('is-hidden');
          }
        }
      });
    }

    /**
     * Triggers lightweight staggered slide-up box entrance animations on cards & sections
     * Batched via requestAnimationFrame to eliminate layout thrashing
     */
    static triggerSlideUpBoxes(rootEl) {
      try {
        if (typeof window === 'undefined') return;
        const batchFn = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame : ((fn) => setTimeout(fn, 16));
        batchFn(() => {
          const scope = rootEl || document.querySelector('.web-main-workspace') || document.body;
          if (!scope) return;
          const boxes = scope.querySelectorAll(
            '.card, .kpi-card, .branch-master-card, .circular-ring-card, .chart-card, .activity-card-item, .podium-card'
          );
          boxes.forEach((box, idx) => {
            box.classList.add('slide-up-box-item');
            const delaySec = Math.min(idx * 0.025, 0.15).toFixed(2);
            box.style.animationDelay = `${delaySec}s`;
          });
        });
      } catch (_) {}
    }

    /**
     * Client-Side SPA Router Navigation:
     * Swaps ONLY the <main> content area without triggering a browser page reload or flashing the persistent navbar.
     */
    static async navigateTo(targetUrl, options = {}) {
      if (!targetUrl) return;

      const cleanUrl = targetUrl.trim();
      if (!cleanUrl || cleanUrl.startsWith('#') || cleanUrl.startsWith('javascript:') || cleanUrl.startsWith('mailto:') || cleanUrl.startsWith('tel:')) {
        return;
      }

      // Close mobile drawer if open
      const drawer = document.getElementById('web-mobile-drawer');
      if (drawer) drawer.classList.remove('open');

      // 1. Immediately toggle active class on the persistent navbar in place
      this.updateActiveNavLink(cleanUrl);

      // 2. Avoid duplicate fetch if already on same exact URL
      try {
        const resolved = new URL(cleanUrl, window.location.href);
        if (resolved.href === window.location.href && !options.isPopState) {
          return;
        }
      } catch (_) {}

      // 3. SPA View Swap: Fetch new page and swap ONLY the <main> container
      try {
        const currentMain = document.querySelector('main') || document.querySelector('.web-main-workspace') || document.querySelector('#app-view');
        if (currentMain) {
          currentMain.style.transition = 'opacity 0.12s ease';
          currentMain.style.opacity = '0.35';
        }

        const resp = await fetch(cleanUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();

        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        const newMain = newDoc.querySelector('main') || newDoc.querySelector('.web-main-workspace') || newDoc.querySelector('#app-view');
        if (!newMain) throw new Error('Target document lacks a main view container');

        if (newDoc.title) {
          document.title = newDoc.title;
        }

        // Swap main content without destroying or re-rendering the persistent navbar
        if (currentMain && currentMain.parentNode) {
          newMain.style.opacity = '0';
          newMain.style.transition = 'opacity 0.18s ease';
          currentMain.parentNode.replaceChild(newMain, currentMain);
          requestAnimationFrame(() => {
            newMain.style.opacity = '1';
          });
        } else {
          document.body.appendChild(newMain);
        }

        // Swap page-level modals/overlays (preserving persistent modals like profile modal)
        document.querySelectorAll('.modal-overlay:not(#adco-profile-modal), .fullscreen-eval-view, .lightbox-overlay').forEach((el) => el.remove());
        newDoc.querySelectorAll('.modal-overlay:not(#adco-profile-modal), .fullscreen-eval-view, .lightbox-overlay').forEach((modalEl) => {
          document.body.appendChild(modalEl.cloneNode(true));
        });

        // Update browser URL & history without full reload
        if (!options.isPopState) {
          window.history.pushState({ url: cleanUrl }, newDoc.title || document.title, cleanUrl);
        }

        // Execute page controller scripts
        const scripts = newDoc.querySelectorAll('script');
        scripts.forEach((s) => {
          const src = s.getAttribute('src');
          if (src) {
            if (src.includes('.page.js') || src.includes('master-branch-card.js') || src.includes('activity-card-item.js')) {
              const freshScript = document.createElement('script');
              freshScript.src = src;
              document.body.appendChild(freshScript);
            }
          } else if (s.textContent && !s.textContent.includes('scrollRestoration')) {
            const inlineScript = document.createElement('script');
            inlineScript.textContent = s.textContent;
            document.body.appendChild(inlineScript);
          }
        });

        // Trigger icon rendering, animations, top scroll
        if (typeof global.refreshIcons === 'function') {
          global.refreshIcons(document.body);
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        this.triggerSlideUpBoxes(newMain);
        this.updateActiveNavLink(cleanUrl);
        this.updatePendingReviewBadge();
      } catch (err) {
        console.warn('SPA view swap fallback to standard navigation:', err);
        window.location.href = cleanUrl;
      }
    }

    static getPageTitle(path) {
      const p = String(path || (typeof window !== 'undefined' ? window.location.pathname : ''));
      const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
      const isManager = user && user.role === 'marketing_manager';
      if (p.includes('supervisor-panel') || p.includes('supervisor')) return 'الإشراف';
      if (p.includes('branch-details')) return 'تفاصيل الفرع';
      if (p.includes('dashboard')) return isManager ? 'الأنشطة' : 'الرئيسية';
      if (p.includes('activity-details')) return 'تفاصيل النشاط';
      if (p.includes('activity-card')) return 'نشاط جديد';
      if (p.includes('evaluation')) return 'تقييم النشاط';
      if (p.includes('sheets')) return 'التقارير';
      if (p.includes('analytics')) return 'التحليلات';
      if (p.includes('leaderboard')) return 'المتصدرين';
      return 'الرئيسية';
    }

    static updateActiveNavLink(currentPath) {
      const raw = String(currentPath || (typeof window !== 'undefined' ? window.location.pathname : ''));
      const p = raw.split('?')[0].split('#')[0];

      let activeId = 'dashboard';
      if (p.includes('supervisor-panel') || p.includes('supervisor')) {
        activeId = 'supervisor';
      } else if (p.includes('sheets-view') || p.includes('sheets')) {
        activeId = 'sheets';
      } else if (p.includes('analytics')) {
        activeId = 'analytics';
      } else if (p.includes('leaderboard')) {
        activeId = 'leaderboard';
      } else if (p.includes('activity-card')) {
        activeId = 'activity-card';
      } else if (p.includes('dashboard') || p.endsWith('/') || p.endsWith('/index.html')) {
        activeId = 'dashboard';
      }

      const navbar = document.getElementById('app-navbar') || document.querySelector('.web-top-navbar') || document.querySelector('.top-navbar');
      if (navbar) {
        navbar.querySelectorAll('.web-nav-item, .nav-link').forEach((link) => {
          const navId = link.dataset.navId || '';
          const href = link.getAttribute('href') || '';
          const isActive = navId === activeId || (navId === 'dashboard' && activeId === 'dashboard' && href.includes('dashboard'));
          link.classList.toggle('active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }

      // Also update drawer links if present
      const drawer = document.getElementById('web-mobile-drawer');
      if (drawer) {
        drawer.querySelectorAll('.web-mobile-drawer-item').forEach((link) => {
          const navId = link.dataset.navId || '';
          const href = link.getAttribute('href') || '';
          const isActive = navId === activeId || (navId === 'dashboard' && activeId === 'dashboard' && href.includes('dashboard'));
          link.classList.toggle('active', isActive);
        });
      }

      // Update mobile center title badge cleanly (NEVER brand company text)
      const mobileTitleBadge = document.getElementById('web-mobile-title-badge');
      if (mobileTitleBadge) {
        const pageTitle = this.getPageTitle(p);
        mobileTitleBadge.setAttribute('title', pageTitle);
        const span = mobileTitleBadge.querySelector('.wmct-name');
        if (span) span.textContent = pageTitle;
      }
    }

    static updatePendingReviewBadge() {
      const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
      const isSupervisor = user && user.role === 'marketing_manager';
      if (!isSupervisor) return;

      const Activity = global.ActivityManager || global.ActivityService;
      if (!Activity || typeof Activity.getAllActivities !== 'function') return;

      try {
        const allActs = Activity.getAllActivities();
        const pendingCount = allActs.filter((a) => !a.isClosed && a.status === 'Under Review').length;
        const supLink = document.querySelector('.web-nav-item[data-nav-id="supervisor"], .nav-link[data-nav-id="supervisor"]');
        if (supLink) {
          let badge = supLink.querySelector('.nav-pending-badge');
          if (pendingCount > 0) {
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'nav-pending-badge glowing-under-review';
              supLink.appendChild(badge);
            }
            badge.textContent = pendingCount;
            badge.title = `${pendingCount} أنشطة بانتظار التقييم`;
          } else if (badge) {
            badge.remove();
          }
        }
      } catch (err) {
        console.warn('Pending badge update handled gracefully:', err);
      }
    }

    static initSmoothPageTransitions() {
      if (this._transitionsInitialized) return;
      this._transitionsInitialized = true;

      try {
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'manual';
        }
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }

      window.addEventListener('pageshow', () => {
        if (document.body) {
          document.body.classList.remove('page-is-leaving');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });

      // Intercept internal same-origin navigation links for SPA routing
      document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;
        if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
        if (anchor.classList.contains('branch-gps-map-link')) return;

        const rawHref = anchor.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
          return;
        }
        if (/^https?:\/\//i.test(rawHref) && !rawHref.startsWith(window.location.origin)) {
          return;
        }

        e.preventDefault();
        this.navigateTo(anchor.href || rawHref);
      });
    }

    static cleanupLegacyCaches() {
      if ('caches' in global) {
        caches
          .keys()
          .then((keys) => {
            keys.forEach((key) => {
              if (key !== 'adco-field-cache-v11') {
                caches.delete(key).catch(() => {});
              }
            });
          })
          .catch(() => {});
      }
    }

    /**
     * Renders sticky, full-width Website Top Navigation Bar (height 64px)
     * Mounted to #app-header-mount (or replaces legacy .app-header if present)
     */
    static renderTopNavbar() {
      // 1. Mount Navbar ONCE outside dynamic viewport: if already mounted, never destroy or re-create it
      const existingNavbar = document.getElementById('app-navbar') || document.querySelector('.web-top-navbar') || document.querySelector('.top-navbar');
      if (existingNavbar) {
        this.updateActiveNavLink(window.location.pathname);
        this.updatePendingReviewBadge();
        return existingNavbar;
      }

      let mount = document.getElementById('app-header-mount');
      if (!mount) {
        const legacyHeader = document.querySelector('.app-header');
        if (legacyHeader) {
          mount = document.createElement('div');
          mount.id = 'app-header-mount';
          legacyHeader.parentNode.replaceChild(mount, legacyHeader);
        } else {
          mount = document.createElement('div');
          mount.id = 'app-header-mount';
          const mainEl = document.querySelector('main') || document.querySelector('.web-main-workspace') || document.querySelector('#app-view');
          if (mainEl && mainEl.parentNode) {
            mainEl.parentNode.insertBefore(mount, mainEl);
          } else {
            document.body.insertBefore(mount, document.body.firstChild);
          }
        }
      }

      const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
      const Activity = global.ActivityManager || global.ActivityService || (typeof window !== 'undefined' ? window.ActivityManager : null);
      const isManager = user && user.role === 'marketing_manager';
      const isCoordSupervisor = user && user.role === 'coordinator_supervisor';
      const isSupervisor = isManager;
      const isHttp = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
      const isSubPage = window.location.pathname.includes('/pages/');
      const prefix = isHttp ? '/pages/' : (isSubPage ? './' : './pages/');
      const assetsPrefix = isHttp ? '/assets/' : (isSubPage ? '../assets/' : './assets/');
      const path = window.location.pathname;

      // Clean, zero-emoji navigation links
      const coordinatorLinks = [
        { id: 'dashboard', label: 'الرئيسية', icon: 'house', href: `${prefix}dashboard.html` },
        { id: 'activity-card', label: 'نشاط جديد', icon: 'plus-circle', href: `${prefix}activity-card.html` },
        { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy', href: `${prefix}leaderboard.html` }
      ];

      const supervisorLinks = [
        { id: 'supervisor', label: 'الإشراف', icon: 'house', href: `${prefix}supervisor-panel.html` },
        { id: 'sheets', label: 'التقارير', icon: 'table-2', href: `${prefix}sheets-view.html` },
        { id: 'analytics', label: 'التحليلات', icon: 'bar-chart-3', href: `${prefix}analytics.html` },
        { id: 'dashboard', label: 'الأنشطة', icon: 'shield-check', href: `${prefix}dashboard.html` },
        { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy', href: `${prefix}leaderboard.html` }
      ];

      const navLinks = isSupervisor ? supervisorLinks : coordinatorLinks;
      let pendingReviewCount = 0;
      try {
        if (Activity && typeof Activity.getAllActivities === 'function') {
          const allActs = Activity.getAllActivities();
          pendingReviewCount = allActs.filter((a) => !a.isClosed && a.status === 'Under Review').length;
        }
      } catch (err) {
        console.warn('Navbar pending review count error:', err);
      }

      const avatarSrc = isSupervisor
        ? `${assetsPrefix}images/avatar-supervisor.avif`
        : `${assetsPrefix}images/avatar-coordinator.avif`;

      const userName = user ? (user.fullName || user.name || 'المستخدم') : 'المستخدم';
      const roleLabel = isManager ? 'مسؤول التسويق' : isCoordSupervisor ? 'مشرف منسق' : 'منسق ميداني';

      const dashUrl = `${prefix}dashboard.html`;
      const leaderUrl = `${prefix}leaderboard.html`;
      const pageTitle = this.getPageTitle(path);

      mount.innerHTML = `
        <header id="app-navbar" class="web-top-navbar top-navbar" role="banner">
          <div class="web-navbar-inner">
            <!-- Right: Logo & Platform Title -->
            <a href="${dashUrl}" class="web-brand-group">
              <img src="${assetsPrefix}images/ADCO-logo.avif" alt="ADCO Logo" class="web-brand-logo" />
              <div class="web-brand-text">
                <span class="web-brand-title">شركة الاسكندريه للكيماويات و المنظفات (ADCO)</span>
              </div>
            </a>

            <!-- Center: Navigation Links with Crisp Bold Typography & Instant SPA Switching -->
            <nav class="web-nav-links" role="navigation" aria-label="روابط المنظومة الرئيسية">
              ${navLinks
                .map((link) => {
                  const isActive = path.includes(link.id) || (link.id === 'dashboard' && (path.endsWith('/') || path.endsWith('/index.html')));
                  const showPendingBadge = isSupervisor && link.id === 'supervisor' && pendingReviewCount > 0;
                  return `
                    <a href="${link.href}" class="web-nav-item nav-link ${isActive ? 'active' : ''}" data-nav-id="${link.id}" ${isActive ? 'aria-current="page"' : ''}>
                      <i data-lucide="${link.icon}" class="ui-icon ui-icon-md"></i>
                      <span>${link.label}</span>
                      ${showPendingBadge ? `<span class="nav-pending-badge glowing-under-review" title="${pendingReviewCount} أنشطة بانتظار التقييم">${pendingReviewCount}</span>` : ''}
                    </a>
                  `;
                })
                .join('')}
            </nav>

            <!-- Center Mobile Page Title Badge: Clean page name pill, NEVER brand text -->
            <div class="web-mobile-center-title" id="web-mobile-title-badge" title="${pageTitle}">
              <span class="wmct-name">${pageTitle}</span>
            </div>

            <!-- Left: Rank, Profile & Logout -->
            <div class="web-user-group">
              ${
                user
                  ? `
                ${
                  !isManager
                    ? `
                  <a href="${leaderUrl}" class="web-rank-badge" id="web-hdr-rank-badge" title="عرض الترتيب ونقاط الأداء">
                    <i data-lucide="trophy" class="ui-icon ui-icon-sm"></i>
                    <span>${(user.rank || (isCoordSupervisor ? '#2' : '#3')).replace('بين المنسقين', '').trim()}</span>
                  </a>
                `
                    : ''
                }

                <button type="button" class="web-profile-btn" id="web-profile-trigger" title="${userName} - ${roleLabel}" aria-label="الملف الشخصي">
                  <i data-lucide="user" class="ui-icon ui-icon-md"></i>
                </button>
              `
                  : `
                <a href="${prefix}login.html" class="btn btn-primary btn-sm">
                  <i data-lucide="log-in" class="ui-icon ui-icon-sm"></i>
                  <span>تسجيل دخول</span>
                </a>
              `
              }

              <!-- Mobile Menu Toggle Button (Menu Icon) -->
              <button type="button" class="web-mobile-toggle" id="web-mobile-menu-btn" aria-label="قائمة الخيارات" title="فتح القائمة الرئيسية">
                <i data-lucide="menu" class="ui-icon ui-icon-md"></i>
              </button>
            </div>
          </div>

          <!-- Mobile Dropdown Menu Drawer -->
          <div class="web-mobile-drawer" id="web-mobile-drawer">
            <div class="web-mobile-drawer-header">
              <span>القائمة الرئيسية</span>
              <button type="button" class="web-mobile-drawer-close" id="web-mobile-drawer-close" aria-label="إغلاق">&times;</button>
            </div>
            <div class="web-mobile-drawer-nav">
              ${navLinks
                .map((link) => {
                  const isActive = path.includes(link.id);
                  return `
                    <a href="${link.href}" class="web-mobile-drawer-item ${isActive ? 'active' : ''}" data-nav-id="${link.id}">
                      <i data-lucide="${link.icon}" class="ui-icon ui-icon-md"></i>
                      <span>${link.label}</span>
                    </a>
                  `;
                })
                .join('')}
            </div>
          </div>
        </header>
      `;

      // Wire up mobile toggle
      const toggleBtn = document.getElementById('web-mobile-menu-btn');
      const drawer = document.getElementById('web-mobile-drawer');
      const drawerClose = document.getElementById('web-mobile-drawer-close');

      if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          drawer.classList.toggle('open');
        });
        if (drawerClose) {
          drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
        }
        document.addEventListener('click', (e) => {
          if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
            drawer.classList.remove('open');
          }
        });
      }

      // Profile modal trigger
      const profTrig = document.getElementById('web-profile-trigger');
      if (profTrig) {
        profTrig.addEventListener('click', () => {
          this.openProfileModal();
        });
      }

      if (typeof global.refreshIcons === 'function') {
        global.refreshIcons(mount);
      }

      return mount.querySelector('header');
    }

/**
     * Profile Modal & Role Switcher
     */
    static ensureProfileModal() {
      if (document.getElementById('adco-profile-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'adco-profile-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    static openProfileModal() {
      this.ensureProfileModal();
      const modal = document.getElementById('adco-profile-modal');
      const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
      if (!user) return;

      const isSup = user && user.role === 'marketing_manager';
      const isCoordSupervisor = user && user.role === 'coordinator_supervisor';
      const isSubPage = window.location.pathname.includes('/pages/');
      const assetsPrefix = isSubPage ? '../assets/' : './assets/';
      const avatarSrc = isSup
        ? `${assetsPrefix}images/avatar-supervisor.avif`
        : `${assetsPrefix}images/avatar-coordinator.avif`;

      modal.innerHTML = `
        <div class="modal-sheet cm-s3">
          <div class="modal-header">
            <h3 class="cm-s4">
              <i data-lucide="user-cog" class="ui-icon ui-icon-md"></i>
              <span>الملف الوظيفي وإعدادات الحساب</span>
            </h3>
            <button type="button" class="close-modal-btn" id="close-profile-modal">&times;</button>
          </div>

          <!-- User Identity Overview Card -->
          <div class="card cm-s5">
            <img class="cm-s6" src="${avatarSrc}" alt="Avatar" />
            <h2 class="cm-s7">${user.fullName}</h2>
            <span class="badge ${isSup ? 'badge-success' : (user.role === 'coordinator_supervisor' ? 'badge-warning' : 'badge-mint')} cm-s8">
              ${isSup ? 'مسؤول التسويق (Marketing Manager)' : (user.role === 'coordinator_supervisor' ? 'مشرف منسق فروع (Coordinator Supervisor)' : 'منسق ميداني (Coordinator)')}
            </span>
            <div class="cm-s9">
              <span>الرقم الوظيفي: <strong>${user.employeeId}</strong></span>
              <span>الفرع: <strong>${user.branch}</strong></span>
              ${!isSup ? `<span>الترتيب: <strong>${user.rank || (isCoordSupervisor ? '#2' : '#3')}</strong></span>` : ''}
            </div>
          </div>

          <!-- Section 1: Update Email & Mobile Contact Info (Password-Protected) -->
          <div class="card cm-s10">
            <div class="cm-s11">
              <h4 class="cm-s12">
                <i data-lucide="clipboard-edit" class="ui-icon ui-icon-sm"></i>
                <span>البيانات الشخصية والاتصال (البريد والهاتف)</span>
              </h4>
              <span class="badge badge-warning cm-s13" id="contact-lock-status-badge">
                <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
                <span>محمية بكلمة المرور</span>
              </span>
            </div>

            <!-- Gate: Locked View requiring password to view and edit -->
            <div class="cm-s14" id="contact-locked-view">
              <p class="cm-s15">
                لحماية خصوصية الحساب، يرجى إدخال كلمة المرور الحالية لعرض وتعديل بياناتك الشخصية:
              </p>
              <div class="cm-s16">
                <input
                  type="password"
                  id="unlock-contact-pass"
                  class="form-input cm-s17"
                  placeholder="أدخل كلمة المرور الحالية..."
                 
                />
                <button type="button" class="btn btn-primary btn-sm cm-s18" id="btn-unlock-contact">
                  <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                  <span>تأكيد وعرض</span>
                </button>
              </div>
              <div class="cm-s19 is-hidden" id="unlock-contact-error"></div>
            </div>

            <!-- Gate: Unlocked View with actual inputs (hidden until password verified) -->
            <div class="is-hidden" id="contact-unlocked-view">
              <div class="cm-s20">
                <span class="badge badge-success cm-s21">
                  <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                  <span>تم تأكيد الهوية بنجاح — البيانات مفتوحة للتعديل</span>
                </span>
                <button type="button" id="btn-relock-contact" class="btn btn-secondary btn-sm cm-s22">
                  قفل مجدداً
                </button>
              </div>
              <form id="profile-contact-form">
                <div class="responsive-form-grid cm-s23">
                  <div class="form-group cm-s24">
                    <label class="form-label cm-s25">البريد الإلكتروني الرسمي</label>
                    <input type="email" id="prof-email" class="form-input" value="${user.email || ''}" placeholder="name@adco.com.eg" required />
                  </div>
                  <div class="form-group cm-s24">
                    <label class="form-label cm-s25">رقم الهاتف المحمول</label>
                    <input type="text" id="prof-mobile" class="form-input" value="${user.mobile || ''}" placeholder="01012345678" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-sm cm-s26">
                  <span>حفظ بيانات الاتصال</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Section 2: Change Password -->
          <div class="card cm-s10">
            <h4 class="cm-s27">
              <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
              <span>تغيير كلمة المرور</span>
            </h4>
            <form id="profile-password-form">
              <div class="form-group cm-s28">
                <label class="form-label cm-s25">كلمة المرور الحالية</label>
                <input type="password" id="prof-pass-curr" class="form-input" placeholder="••••••••" required />
              </div>
              <div class="responsive-form-grid cm-s23">
                <div class="form-group cm-s24">
                  <label class="form-label cm-s25">كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-new" class="form-input" placeholder="••••••••" required />
                </div>
                <div class="form-group cm-s24">
                  <label class="form-label cm-s25">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-conf" class="form-input" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm cm-s26">
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>

          <button type="button" class="btn btn-danger btn-sm cm-s32" id="modal-logout-btn">
            <i data-lucide="log-out" class="ui-icon ui-icon-sm"></i>
            <span>تسجيل الخروج من المنظومة</span>
          </button>
        </div>
      `;

      modal.classList.add('active');

      const closeModal = () => modal.classList.remove('active');

      document.getElementById('close-profile-modal').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Password verification gate to view and edit personal data
      const unlockPassInput = document.getElementById('unlock-contact-pass');
      const unlockBtn = document.getElementById('btn-unlock-contact');
      const unlockError = document.getElementById('unlock-contact-error');
      const lockedView = document.getElementById('contact-locked-view');
      const unlockedView = document.getElementById('contact-unlocked-view');
      const lockBadge = document.getElementById('contact-lock-status-badge');

      const attemptUnlock = () => {
        const pass = (unlockPassInput.value || '').trim();
        if (!pass) {
          unlockError.textContent = 'يرجى إدخال كلمة المرور الحالية أولاً.';
          unlockError.style.display = 'block';
          return;
        }

        const isValid = global.AuthManager.verifyPassword(user.employeeId, pass);
        if (isValid) {
          unlockError.style.display = 'none';
          lockedView.style.display = 'none';
          unlockedView.style.display = 'block';
          lockBadge.className = 'badge badge-success';
          lockBadge.innerHTML = `<i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i><span>تم التحقق (مفتوح للتعديل)</span>`;
          if (typeof global.showToast === 'function') {
            global.showToast('تم تأكيد الهوية بنجاح، يمكنك الآن مراجعة وتعديل بياناتك الشخصية', 'success');
          }
        } else {
          unlockError.textContent = 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.';
          unlockError.style.display = 'block';
        }
      };

      if (unlockBtn) {
        unlockBtn.addEventListener('click', attemptUnlock);
      }
      if (unlockPassInput) {
        unlockPassInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            attemptUnlock();
          }
        });
      }

      const relockBtn = document.getElementById('btn-relock-contact');
      if (relockBtn) {
        relockBtn.addEventListener('click', () => {
          unlockedView.style.display = 'none';
          lockedView.style.display = 'block';
          unlockPassInput.value = '';
          unlockError.style.display = 'none';
          lockBadge.className = 'badge badge-warning';
          lockBadge.innerHTML = `<i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i><span>محمية بكلمة المرور</span>`;
        });
      }

      // Contact form submission
      document.getElementById('profile-contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newEmail = document.getElementById('prof-email').value;
        const newMobile = document.getElementById('prof-mobile').value;
        try {
          await global.AuthManager.updateContactInfo(user.employeeId, newEmail, newMobile);
          global.showToast('تم تحديث بيانات الاتصال بنجاح', 'success');
        } catch (err) {
          global.showToast(err.message, 'error');
        }
      });

      // Password form submission
      document.getElementById('profile-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const curr = document.getElementById('prof-pass-curr').value;
        const next = document.getElementById('prof-pass-new').value;
        const conf = document.getElementById('prof-pass-conf').value;
        if (next !== conf) {
          return global.showToast('كلمتا المرور الجديدتان غير متطابقتين', 'error');
        }
        try {
          await global.AuthManager.changePassword(user.employeeId, curr, next);
          global.showToast('تم تغيير كلمة المرور بنجاح', 'success');
          document.getElementById('prof-pass-curr').value = '';
          document.getElementById('prof-pass-new').value = '';
          document.getElementById('prof-pass-conf').value = '';
        } catch (err) {
          global.showToast(err.message, 'error');
        }
      });

      document.getElementById('modal-logout-btn').addEventListener('click', () => {
        global.AuthManager.logout();
      });
    }

    static registerServiceWorker() {
      if (
        'serviceWorker' in navigator &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:')
      ) {
        window.addEventListener('load', () => {
          const swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : './sw.js';
          navigator.serviceWorker
            .register(swPath)
            .then((reg) => {
              reg.update().catch(() => {});
            })
            .catch(() => {});
        });
      }
    }
  }

  global.AppRouter = AppRouter;
})(window);
