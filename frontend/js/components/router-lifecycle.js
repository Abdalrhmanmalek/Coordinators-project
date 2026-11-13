/**
 * ADCO Field Operations System - SPA Router Lifecycle & View Swapper
 * Single Responsibility: DOM view swapping, modal outside-click dismissal, slide-up animations,
 * smooth link interception, cache cleanup, and Service Worker registration.
 */

(function (global) {
  let _outsideDismissalInit = false;
  let _transitionsInitialized = false;

  function initDesktopOutsideModalDismissal() {
    if (_outsideDismissalInit) return;
    _outsideDismissalInit = true;

    document.addEventListener('click', (e) => {
      const overlay = e.target;
      if (!overlay) return;
      if (overlay.classList && (overlay.classList.contains('modal-overlay') || overlay.classList.contains('lightbox-overlay'))) {
        overlay.classList.remove('active');
        if (overlay.classList.contains('custom-modal-backdrop') || overlay.id === 'product-picker-modal') {
          overlay.classList.add('is-hidden');
        }
      }
    });
  }

  function triggerSlideUpBoxes(rootEl) {
    try {
      if (typeof window === 'undefined') return;
      const batchFn = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame : ((fn) => setTimeout(fn, 16));
      batchFn(() => {
        const scope = rootEl || document.querySelector('.web-main-workspace') || document.body;
        if (!scope) return;
        const boxes = scope.querySelectorAll('.card, .kpi-card, .branch-master-card, .circular-ring-card, .chart-card, .activity-card-item, .podium-card');
        boxes.forEach((box, idx) => {
          box.classList.add('slide-up-box-item');
          box.style.animationDelay = `${Math.min(idx * 0.025, 0.15).toFixed(2)}s`;
        });
      });
    } catch (_) {}
  }

  async function swapSpaPageContent(cleanUrl, options, router) {
    try {
      const currentMain = document.querySelector('main') || document.querySelector('.web-main-workspace') || document.querySelector('#app-view');
      if (currentMain) {
        currentMain.style.transition = 'opacity 0.12s ease';
        currentMain.style.opacity = '0.35';
      }

      const resp = await fetch(cleanUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      const newDoc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = newDoc.querySelector('main') || newDoc.querySelector('.web-main-workspace') || newDoc.querySelector('#app-view');
      if (!newMain) throw new Error('Target document lacks a main view container');

      if (newDoc.title) document.title = newDoc.title;

      if (currentMain && currentMain.parentNode) {
        newMain.style.opacity = '0';
        newMain.style.transition = 'opacity 0.18s ease';
        currentMain.parentNode.replaceChild(newMain, currentMain);
        requestAnimationFrame(() => { newMain.style.opacity = '1'; });
      } else {
        document.body.appendChild(newMain);
      }

      document.querySelectorAll('.modal-overlay:not(#adco-profile-modal), .fullscreen-eval-view, .lightbox-overlay').forEach((el) => el.remove());
      newDoc.querySelectorAll('.modal-overlay:not(#adco-profile-modal), .fullscreen-eval-view, .lightbox-overlay').forEach((modalEl) => {
        document.body.appendChild(modalEl.cloneNode(true));
      });

      if (!options.isPopState) {
        window.history.pushState({ url: cleanUrl }, newDoc.title || document.title, cleanUrl);
      }

      newDoc.querySelectorAll('script').forEach((s) => {
        const src = s.getAttribute('src');
        if (src) {
          if (
            src.includes('.page.js') ||
            src.includes('/components/') ||
            src.includes('master-branch-card.js') ||
            src.includes('activity-card-item.js') ||
            src.includes('filter-dropdown.js') ||
            src.includes('profile-modal.js')
          ) {
            const cleanSrc = src.replace(/\?v=\d+/, '') + '?v=9';
            const freshScript = document.createElement('script');
            freshScript.async = false;
            freshScript.src = cleanSrc;
            document.body.appendChild(freshScript);
          }
        } else if (s.textContent && !s.textContent.includes('scrollRestoration')) {
          const inlineScript = document.createElement('script');
          inlineScript.textContent = s.textContent;
          document.body.appendChild(inlineScript);
        }
      });

      if (typeof global.refreshIcons === 'function') global.refreshIcons(document.body);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      triggerSlideUpBoxes(newMain);
      router.updateActiveNavLink(cleanUrl);
      router.updatePendingReviewBadge();
    } catch (err) {
      console.warn('SPA view swap fallback to standard navigation:', err);
      window.location.href = cleanUrl;
    }
  }

  function initSmoothPageTransitions(router) {
    if (_transitionsInitialized) return;
    _transitionsInitialized = true;

    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }

    window.addEventListener('pageshow', () => {
      if (document.body) document.body.classList.remove('page-is-leaving');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target.closest('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.classList.contains('branch-gps-map-link')) return;

      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
      if (/^https?:\/\//i.test(rawHref) && !rawHref.startsWith(window.location.origin)) return;

      e.preventDefault();
      router.navigateTo(anchor.href || rawHref);
    });
  }

  function cleanupLegacyCaches() {
    if ('caches' in global) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'adco-field-cache-v25') caches.delete(key).catch(() => {});
        });
      }).catch(() => {});
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      window.addEventListener('load', () => {
        const swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : './sw.js';
        navigator.serviceWorker.register(swPath).then((reg) => { reg.update().catch(() => {}); }).catch(() => {});
      });
    }
  }

  function updateActiveNavLink(currentPath, router) {
    const raw = String(currentPath || (typeof window !== 'undefined' ? window.location.pathname : ''));
    const p = raw.split('?')[0].split('#')[0];

    let activeId = 'dashboard';
    if (p.includes('supervisor-panel') || p.includes('supervisor')) activeId = 'supervisor';
    else if (p.includes('sheets-view') || p.includes('sheets')) activeId = 'sheets';
    else if (p.includes('analytics')) activeId = 'analytics';
    else if (p.includes('leaderboard')) activeId = 'leaderboard';
    else if (p.includes('activity-card')) activeId = 'activity-card';
    else if (p.includes('branch-details')) {
      const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      activeId = (sp && sp.get('from') === 'supervisor') ? 'supervisor' : 'dashboard';
    }

    const navbar = document.getElementById('app-navbar') || document.querySelector('.web-top-navbar') || document.querySelector('.top-navbar');
    if (navbar) {
      navbar.querySelectorAll('.web-nav-item, .nav-link').forEach((link) => {
        const navId = link.dataset.navId || '';
        const href = link.getAttribute('href') || '';
        const isActive = navId === activeId || (navId === 'dashboard' && activeId === 'dashboard' && href.includes('dashboard'));
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }

    const drawer = document.getElementById('web-mobile-drawer');
    if (drawer) {
      drawer.querySelectorAll('.web-mobile-drawer-item').forEach((link) => {
        const navId = link.dataset.navId || '';
        const href = link.getAttribute('href') || '';
        const isActive = navId === activeId || (navId === 'dashboard' && activeId === 'dashboard' && href.includes('dashboard'));
        link.classList.toggle('active', isActive);
      });
    }

    const mobileTitleBadge = document.getElementById('web-mobile-title-badge');
    if (mobileTitleBadge && router) {
      const pageTitle = router.getPageTitle(p);
      mobileTitleBadge.setAttribute('title', pageTitle);
      const span = mobileTitleBadge.querySelector('.wmct-name');
      if (span) span.textContent = pageTitle;
    }
  }

  function updatePendingReviewBadge() {
    const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
    if (!user || user.role !== 'marketing_manager') return;
    const Activity = global.ActivityManager || global.ActivityService;
    if (!Activity || typeof Activity.getAllActivities !== 'function') return;

    try {
      const pendingCount = Activity.getAllActivities().filter((a) => !a.isClosed && a.status === 'Under Review').length;
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
    } catch (_) {}
  }

  function openProfileModal(appScriptSrc) {
    const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
    if (!user) return;
    if (global.ProfileModal && typeof global.ProfileModal.open === 'function') {
      return global.ProfileModal.open(user);
    }
    const scriptUrl = appScriptSrc
      ? new URL('./components/profile-modal.js?v=6', appScriptSrc).href
      : (window.location.pathname.includes('/pages/') ? '../js/components/profile-modal.js?v=6' : './js/components/profile-modal.js?v=6');
    const s = document.createElement('script');
    s.src = scriptUrl;
    s.onload = () => {
      if (global.ProfileModal && typeof global.ProfileModal.open === 'function') global.ProfileModal.open(user);
    };
    document.head.appendChild(s);
  }

  global.RouterLifecycle = {
    initDesktopOutsideModalDismissal,
    triggerSlideUpBoxes,
    swapSpaPageContent,
    initSmoothPageTransitions,
    cleanupLegacyCaches,
    registerServiceWorker,
    updateActiveNavLink,
    updatePendingReviewBadge,
    openProfileModal
  };
})(typeof window !== 'undefined' ? window : globalThis);
