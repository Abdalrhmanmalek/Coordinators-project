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

    const user = AuthService.getCurrentUser();
    const role = user ? user.role : 'coordinator';
    const isManager = role === 'marketing_manager' || role === 'coordination_manager' || role === 'supervisor';
    const isCoordSup = role === 'coordinator_supervisor';
    const isSubPage = window.location.pathname.includes('/pages/');
    const prefix = isSubPage ? './' : './pages/';
    const assetsPrefix = isSubPage ? '../assets/' : './assets/';
    const path = window.location.pathname;

    const coordinatorLinks = [
      { id: 'dashboard', label: 'الرئيسية', icon: 'house.svg', href: `${prefix}dashboard.html` },
      { id: 'activity-card', label: 'نشاط جديد', icon: 'plus-circle.svg', href: `${prefix}activity-card.html` },
      { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy.svg', href: `${prefix}leaderboard.html` }
    ];

    const managerLinks = [
      { id: 'supervisor', label: 'الإشراف', icon: 'house.svg', href: `${prefix}supervisor-panel.html` },
      { id: 'sheets', label: 'الشيتات', icon: 'table-2.svg', href: `${prefix}sheets-view.html` },
      { id: 'analytics', label: 'التحليلات', icon: 'bar-chart-3.svg', href: `${prefix}analytics.html` },
      { id: 'dashboard', label: 'الأنشطة', icon: 'shield-check.svg', href: `${prefix}dashboard.html` },
      { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy.svg', href: `${prefix}leaderboard.html` }
    ];

    const navLinks = isManager ? managerLinks : coordinatorLinks;
    const avatarSrc = isManager
      ? `${assetsPrefix}images/avatar-supervisor.svg`
      : `${assetsPrefix}images/avatar-coordinator.svg`;

    const dashUrl = `${prefix}dashboard.html`;
    const leaderUrl = `${prefix}leaderboard.html`;

    const roleDisplayName = isManager
      ? 'مسؤول التسويق'
      : isCoordSup
      ? 'مشرف منسق'
      : 'منسق ميداني معتمد';

    mount.innerHTML = `
      <header class="web-top-navbar" role="banner">
        <div class="web-navbar-inner">
          <!-- Right: Logo & Platform Title -->
          <a href="${dashUrl}" class="web-brand-group">
            <img src="${assetsPrefix}images/ADCO-logo.png" alt="ADCO Logo" class="web-brand-logo" />
            <div class="web-brand-text">
              <span class="web-brand-title">شركة الإسكندرية للكيماويات (ADCO)</span>
              <span class="web-brand-sub">بوابة العمليات الميدانية المعتمدة</span>
            </div>
          </a>

          <!-- Mobile Center Page Title Badge -->
          <div class="web-mobile-center-title" id="web-mobile-title-badge">
            <span class="wmct-name">${this.getPageTitle(path)}</span>
          </div>

          <!-- Center: Primary Desktop Links -->
          <nav class="web-nav-links" role="navigation">
            ${navLinks
              .map((link) => {
                const isActive = path.endsWith(link.href.replace('./', '')) ||
                  (link.id === 'dashboard' && (path.endsWith('/') || path.endsWith('/index.html')));
                return `
                  <a href="${link.href}" class="web-nav-item ${isActive ? 'active' : ''}">
                    <img src="${assetsPrefix}icons/${link.icon}" class="ui-icon ui-icon-sm" alt="" />
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
              <a href="${leaderUrl}" class="web-rank-badge" title="ترتيبك في المتصدرين">
                <img src="${assetsPrefix}icons/trophy.svg" class="ui-icon ui-icon-xs" alt="" />
                <span>${user ? user.rank || '#1' : '#1'}</span>
              </a>
            `
                : ''
            }

            <div class="web-profile-pill" id="web-profile-btn" title="الملف الشخصي وإعدادات الحساب">
              <img src="${avatarSrc}" alt="Avatar" class="web-profile-avatar" />
              <div class="web-profile-meta">
                <span class="web-profile-name">${user ? user.fullName : 'منسق أدكو'}</span>
                <span class="web-profile-role">${roleDisplayName}</span>
              </div>
            </div>

            <button type="button" class="web-logout-btn" id="web-nav-logout" title="تسجيل الخروج">
              <img src="${assetsPrefix}icons/log-out.svg" class="ui-icon ui-icon-xs" alt="" />
              <span>خروج</span>
            </button>

            <!-- Mobile Hamburger Toggle Button -->
            <button type="button" class="web-mobile-toggle" id="web-nav-toggle" aria-label="القائمة">
              <img src="${assetsPrefix}icons/list.svg" class="ui-icon ui-icon-md" alt="" />
            </button>
          </div>
        </div>

        <!-- Mobile Drawer Menu -->
        <div class="web-mobile-drawer" id="web-nav-drawer">
          ${navLinks
            .map((link) => {
              const isActive = path.endsWith(link.href.replace('./', ''));
              return `
                <a href="${link.href}" class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm" style="justify-content: flex-start;">
                  <img src="${assetsPrefix}icons/${link.icon}" class="ui-icon ui-icon-sm" alt="" />
                  <span>${link.label}</span>
                </a>
              `;
            })
            .join('')}
          <hr style="border: none; border-top: 1px solid var(--adco-gray-200); margin: 4px 0;" />
          <button type="button" class="btn btn-secondary btn-sm" id="mobile-drawer-profile" style="justify-content: flex-start;">
            <img src="${assetsPrefix}icons/user-cog.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>لوحة الحساب الشخصي</span>
          </button>
          <button type="button" class="btn btn-danger btn-sm" id="mobile-drawer-logout" style="justify-content: flex-start;">
            <img src="${assetsPrefix}icons/log-out.svg" class="ui-icon ui-icon-sm" alt="" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>
    `;

    // Attach event listeners
    const profileBtn = document.getElementById('web-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        ProfileModal.open(user);
      });
    }

    const drawerProfile = document.getElementById('mobile-drawer-profile');
    if (drawerProfile) {
      drawerProfile.addEventListener('click', () => {
        document.getElementById('web-nav-drawer').classList.remove('open');
        ProfileModal.open(user);
      });
    }

    const logoutBtn = document.getElementById('web-nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        AuthService.logout();
      });
    }

    const drawerLogout = document.getElementById('mobile-drawer-logout');
    if (drawerLogout) {
      drawerLogout.addEventListener('click', () => {
        AuthService.logout();
      });
    }

    const toggleBtn = document.getElementById('web-nav-toggle');
    const drawer = document.getElementById('web-nav-drawer');
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
          drawer.classList.remove('open');
        }
      });
    }
  }

  static getPageTitle(path) {
    if (path.includes('dashboard')) return 'لوحة المنسق';
    if (path.includes('activity-card')) return 'بطاقة النشاط';
    if (path.includes('supervisor-panel')) return 'لوحة الإشراف';
    if (path.includes('sheets-view')) return 'شيت الحصص';
    if (path.includes('analytics')) return 'التحليلات المتقدمة';
    if (path.includes('leaderboard')) return 'المتصدرين';
    return 'العمليات الميدانية';
  }
}

if (typeof window !== 'undefined') {
  window.NavbarComponent = NavbarComponent;
}

