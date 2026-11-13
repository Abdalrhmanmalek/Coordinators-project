/**
 * ADCO Field Operations System - Top Navbar Component
 * Single Responsibility: Enterprise website top navbar rendering, 3-tier role-switcher logic,
 * link active state detection, rank badge suppression for managers, and mobile navigation drawer.
 */

import { ProfileModal } from './profile-modal.js';
import { AuthService } from '../services/auth.service.js';

export class NavbarComponent {
  static render() {
    if (typeof document === 'undefined') return;

    // Delegate to unified persistent AppRouter.renderTopNavbar() if available
    if (typeof window !== 'undefined' && window.AppRouter && typeof window.AppRouter.renderTopNavbar === 'function') {
      return window.AppRouter.renderTopNavbar();
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
        document.body.insertBefore(mount, document.body.firstChild);
      }
    }

    const existingNavbar = document.getElementById('app-navbar') || document.querySelector('.web-top-navbar');
    if (existingNavbar) return existingNavbar;

    const user = AuthService.getCurrentUser();
    const role = user ? user.role : 'coordinator';
    const isManager = role === 'marketing_manager';
    const isCoordSup = role === 'coordinator_supervisor';
    const isHttp = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
    const isSubPage = window.location.pathname.includes('/pages/');
    const prefix = isHttp ? '/pages/' : (isSubPage ? './' : './pages/');
    const assetsPrefix = isHttp ? '/assets/' : (isSubPage ? '../assets/' : './assets/');
    const path = window.location.pathname;

    const coordinatorLinks = [
      { id: 'dashboard', label: 'الرئيسية', icon: 'house', href: `${prefix}dashboard.html` },
      { id: 'activity-card', label: 'نشاط جديد', icon: 'plus-circle', href: `${prefix}activity-card.html` },
      { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy', href: `${prefix}leaderboard.html` }
    ];

    const managerLinks = [
      { id: 'supervisor', label: 'الإشراف', icon: 'house', href: `${prefix}supervisor-panel.html` },
      { id: 'sheets', label: 'التقارير', icon: 'table-2', href: `${prefix}sheets-view.html` },
      { id: 'analytics', label: 'التحليلات', icon: 'bar-chart-3', href: `${prefix}analytics.html` },
      { id: 'dashboard', label: 'الأنشطة', icon: 'shield-check', href: `${prefix}dashboard.html` },
      { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy', href: `${prefix}leaderboard.html` }
    ];

    const navLinks = isManager ? managerLinks : coordinatorLinks;
    const userName = user ? (user.fullName || user.name || 'المستخدم') : 'المستخدم';
    const roleLabel = isManager ? 'مسؤول التسويق' : isCoordSup ? 'مشرف منسق' : 'منسق ميداني';

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

          <!-- Mobile Center Page Title Badge: Clean page name pill, NEVER brand text -->
          <div class="web-mobile-center-title" id="web-mobile-title-badge" title="${pageTitle}">
            <span class="wmct-name">${pageTitle}</span>
          </div>

          <!-- Center: Primary Desktop Links with Crisp Bold Typography -->
          <nav class="web-nav-links" role="navigation" aria-label="روابط المنظومة الرئيسية">
            ${navLinks
              .map((link) => {
                const isActive = path.includes(link.id) || (link.id === 'dashboard' && (path.endsWith('/') || path.endsWith('/index.html')));
                return `
                  <a href="${link.href}" class="web-nav-item nav-link ${isActive ? 'active' : ''}" data-nav-id="${link.id}" ${isActive ? 'aria-current="page"' : ''}>
                    <i data-lucide="${link.icon}" class="ui-icon ui-icon-md"></i>
                    <span>${link.label}</span>
                  </a>
                `;
              })
              .join('')}
          </nav>

          <!-- Left: User Profile Pill, Rank Badge & Logout -->
          <div class="web-user-group">
            ${
              !isManager
                ? `
              <a href="${leaderUrl}" class="web-rank-badge" id="web-hdr-rank-badge" title="عرض الترتيب ونقاط الأداء">
                <i data-lucide="trophy" class="ui-icon ui-icon-sm"></i>
                <span>${user && user.rank ? user.rank.replace('بين المنسقين', '').trim() : (isCoordSup ? '#2' : '#3')}</span>
              </a>
            `
                : ''
            }

            <button type="button" class="web-profile-btn" id="web-profile-trigger" title="${userName} - ${roleLabel}" aria-label="الملف الشخصي">
              <i data-lucide="user" class="ui-icon ui-icon-md"></i>
            </button>

            <!-- Mobile Hamburger Toggle -->
            <button type="button" class="web-mobile-toggle" id="web-mobile-menu-btn" aria-label="قائمة الخيارات" title="فتح القائمة الرئيسية">
              <i data-lucide="menu" class="ui-icon ui-icon-md"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Drawer -->
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

    // Wire up events
    const profileTrigger = mount.querySelector('#web-profile-trigger');
    if (profileTrigger) {
      profileTrigger.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.AppRouter && typeof window.AppRouter.openProfileModal === 'function') {
          window.AppRouter.openProfileModal();
        } else {
          ProfileModal.open(user);
        }
      });
    }

    const toggleBtn = mount.querySelector('#web-mobile-menu-btn');
    const drawer = mount.querySelector('#web-mobile-drawer');
    const drawerClose = mount.querySelector('#web-mobile-drawer-close');

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

    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(mount);
    }
  }

  static getPageTitle(path) {
    const p = String(path || (typeof window !== 'undefined' ? window.location.pathname : ''));
    const user = AuthService.getCurrentUser();
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
}

if (typeof window !== 'undefined') {
  window.NavbarComponent = NavbarComponent;
}
