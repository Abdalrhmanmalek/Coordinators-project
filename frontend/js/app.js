/**
 * ADCO PWA Router, Sticky Enterprise Website Top Navigation Bar & Service Worker Registration
 * Universal Browser Script (Works on both http://localhost and file:// protocol)
 */

(function (global) {
  const APP_SCRIPT_SRC = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
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

    static initDesktopOutsideModalDismissal() {
      if (global.RouterLifecycle) global.RouterLifecycle.initDesktopOutsideModalDismissal();
    }

    static triggerSlideUpBoxes(rootEl) {
      if (global.RouterLifecycle) global.RouterLifecycle.triggerSlideUpBoxes(rootEl);
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
      const drawer = document.getElementById('web-mobile-drawer');
      if (drawer) drawer.classList.remove('open');

      this.updateActiveNavLink(cleanUrl);
      try {
        const resolved = new URL(cleanUrl, window.location.href);
        if (resolved.href === window.location.href && !options.isPopState) return;
      } catch (_) {}

      if (global.RouterLifecycle) {
        return global.RouterLifecycle.swapSpaPageContent(cleanUrl, options, this);
      }
      window.location.href = cleanUrl;
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
      if (global.RouterLifecycle) global.RouterLifecycle.updateActiveNavLink(currentPath, this);
    }

    static updatePendingReviewBadge() {
      if (global.RouterLifecycle) global.RouterLifecycle.updatePendingReviewBadge();
    }

    static initSmoothPageTransitions() {
      if (global.RouterLifecycle) global.RouterLifecycle.initSmoothPageTransitions(this);
    }

    static cleanupLegacyCaches() {
      if (global.RouterLifecycle) global.RouterLifecycle.cleanupLegacyCaches();
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

                <button type="button" class="web-profile-btn" id="navbar-profile-btn" data-action="open-profile" style="cursor: pointer;" title="${userName} - ${roleLabel}" aria-label="الملف الشخصي">
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

      // Profile modal trigger (delegated on document + direct binding for reliability across SPA routes)
      if (!this._profileTriggerBound) {
        this._profileTriggerBound = true;
        document.addEventListener('click', (e) => {
          const btn = e.target.closest('#navbar-profile-btn, #web-profile-trigger, [data-action="open-profile"]');
          if (btn) {
            e.preventDefault();
            this.openProfileModal();
          }
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
    /**
     * Profile Modal — Delegates strictly to frontend/js/components/profile-modal.js
     */
    static openProfileModal() {
      if (global.RouterLifecycle) global.RouterLifecycle.openProfileModal(APP_SCRIPT_SRC);
    }

    static registerServiceWorker() {
      if (global.RouterLifecycle) global.RouterLifecycle.registerServiceWorker();
    }
  }

  global.AppRouter = AppRouter;
})(window);
