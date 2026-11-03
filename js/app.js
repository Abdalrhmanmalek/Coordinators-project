/**
 * ADCO PWA Router, Sticky Enterprise Website Top Navigation Bar & Service Worker Registration
 * Universal Browser Script (Works on both http://localhost and file:// protocol)
 */

(function (global) {
  class AppRouter {
    static init() {
      this.cleanupLegacyCaches();

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
      this.registerServiceWorker();
    }

    static cleanupLegacyCaches() {
      if ('caches' in global) {
        caches
          .keys()
          .then((keys) => {
            keys.forEach((key) => {
              if (key !== 'adco-field-cache-v6') {
                caches.delete(key).catch(() => {});
              }
            });
          })
          .catch(() => {});
      }
    }

    /**
     * Renders sticky, full-width Website Top Navigation Bar (height 68px)
     * Mounted to #app-header-mount (or replaces legacy .app-header if present)
     */
    static renderTopNavbar() {
      let mount = document.getElementById('app-header-mount');
      if (!mount) {
        // Fallback: check if legacy header exists and replace its container or inject at body top
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

      const user = global.AuthManager ? global.AuthManager.getCurrentUser() : null;
      const isSupervisor = user && user.role === 'supervisor';
      const isSubPage = window.location.pathname.includes('/pages/');
      const prefix = isSubPage ? './' : './pages/';
      const assetsPrefix = isSubPage ? '../assets/' : './assets/';
      const path = window.location.pathname;

      // Clean, zero-emoji navigation links
      const coordinatorLinks = [
        { id: 'dashboard', label: 'الرئيسية', icon: 'house.svg', href: `${prefix}dashboard.html` },
        { id: 'activity-card', label: 'نشاط جديد', icon: 'plus-circle.svg', href: `${prefix}activity-card.html` },
        { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy.svg', href: `${prefix}leaderboard.html` }
      ];

      const supervisorLinks = [
        { id: 'supervisor', label: 'الإشراف', icon: 'house.svg', href: `${prefix}supervisor-panel.html` },
        { id: 'sheets', label: 'الشيتات', icon: 'table-2.svg', href: `${prefix}sheets-view.html` },
        { id: 'analytics', label: 'التحليلات', icon: 'bar-chart-3.svg', href: `${prefix}analytics.html` },
        { id: 'dashboard', label: 'الأنشطة', icon: 'shield-check.svg', href: `${prefix}dashboard.html` },
        { id: 'leaderboard', label: 'المتصدرين', icon: 'trophy.svg', href: `${prefix}leaderboard.html` }
      ];

      const navLinks = isSupervisor ? supervisorLinks : coordinatorLinks;

      const avatarSrc = isSupervisor
        ? `${assetsPrefix}images/avatar-supervisor.svg`
        : `${assetsPrefix}images/avatar-coordinator.svg`;

      const dashUrl = `${prefix}dashboard.html`;
      const leaderUrl = `${prefix}leaderboard.html`;

      mount.innerHTML = `
        <header class="web-top-navbar" role="banner">
          <div class="web-navbar-inner">
            <!-- Right: Logo & Platform Title -->
            <a href="${dashUrl}" class="web-brand-group">
              <img src="${assetsPrefix}images/ADCO-logo.png" alt="ADCO Logo" class="web-brand-logo" />
              <div class="web-brand-text">
                <span class="web-brand-title">شركة الإسكندرية للكيماويات (ADCO)</span>
                <span class="web-brand-sub">منظومة إدارة العمليات الميدانية والتقارير</span>
              </div>
            </a>

            <!-- Center: Navigation Links -->
            <nav class="web-nav-links" role="navigation" aria-label="روابط المنظومة الرئيسية">
              ${navLinks
                .map((link) => {
                  const isActive = path.includes(link.id);
                  return `
                    <a href="${link.href}" class="web-nav-item ${isActive ? 'active' : ''}">
                      <img src="${assetsPrefix}icons/${link.icon}" class="ui-icon ui-icon-md" alt="" />
                      <span>${link.label}</span>
                    </a>
                  `;
                })
                .join('')}
            </nav>

            <!-- Center Mobile Brand: Company Name in the middle space -->
            <div class="web-mobile-center-title">
              <span class="wmct-name">شركة الإسكندرية للكيماويات</span>
              <span class="wmct-sub"><i class="wmct-dot"></i>ADCO</span>
            </div>

            <!-- Left: Rank, Profile & Logout -->
            <div class="web-user-group">
              ${
                user
                  ? `
                ${
                  !isSupervisor
                    ? `
                  <a href="${leaderUrl}" class="web-rank-badge" id="web-hdr-rank-badge" title="عرض الترتيب ونقاط الأداء">
                    <img src="${assetsPrefix}icons/trophy.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>${(user.rank || '#3').replace('بين المنسقين', '').trim()}</span>
                  </a>
                `
                    : ''
                }

                <div class="web-profile-pill" id="web-profile-trigger" title="عرض الملف الوظيفي وإعدادات الحساب">
                  <img src="${avatarSrc}" alt="Avatar" class="web-profile-avatar" />
                  <div class="web-profile-meta">
                    <span class="web-profile-name">${user.fullName}</span>
                    <span class="web-profile-role">${isSupervisor ? 'مشرف عمليات' : 'منسق ميداني'}</span>
                  </div>
                </div>

                <button type="button" class="web-logout-btn" id="web-navbar-logout" title="تسجيل الخروج">
                  <img src="${assetsPrefix}icons/log-out.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>خروج</span>
                </button>
              `
                  : `
                <a href="${prefix}login.html" class="btn btn-primary btn-sm">
                  <img src="${assetsPrefix}icons/log-in.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>تسجيل دخول</span>
                </a>
              `
              }

              <!-- Mobile Menu Toggle Button (List Icon) -->
              <button type="button" class="web-mobile-toggle" id="web-mobile-menu-btn" aria-label="قائمة الخيارات">
                <img src="${assetsPrefix}icons/list.svg" class="ui-icon ui-icon-md" alt="قائمة" />
              </button>
            </div>
          </div>

          <!-- Mobile Dropdown Menu Drawer -->
          <div class="web-mobile-drawer" id="web-mobile-menu-drawer">
            ${navLinks
              .map((link) => {
                const isActive = path.includes(link.id);
                return `
                  <a href="${link.href}" class="web-nav-item ${isActive ? 'active' : ''}" style="height: 44px; padding: 0 10px;">
                    <img src="${assetsPrefix}icons/${link.icon}" class="ui-icon ui-icon-md" alt="" />
                    <span>${link.label}</span>
                  </a>
                `;
              })
              .join('')}
            ${
              user
                ? `
              <button type="button" class="web-nav-item" id="drawer-logout-btn" style="height: 44px; padding: 0 10px; color: var(--adco-danger); border: none; background: none; width: 100%; text-align: right; cursor: pointer; display: flex; align-items: center; gap: 7px; margin-top: 4px; border-top: 1px solid var(--adco-gray-200);">
                <img src="${assetsPrefix}icons/log-out.svg" class="ui-icon ui-icon-md" alt="" />
                <span>تسجيل الخروج</span>
              </button>
            `
                : ''
            }
          </div>
        </header>
        <div id="offline-banner" class="offline-banner"></div>
      `;

      // Profile click listener
      const profileTrigger = document.getElementById('web-profile-trigger');
      if (profileTrigger) {
        profileTrigger.addEventListener('click', () => {
          this.openProfileModal();
        });
      }

      // Logout button listener
      const logoutBtn = document.getElementById('web-navbar-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (global.AuthManager) global.AuthManager.logout();
        });
      }

      const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
      if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', () => {
          if (global.AuthManager) global.AuthManager.logout();
        });
      }

      // Mobile drawer toggle listener
      const mobileBtn = document.getElementById('web-mobile-menu-btn');
      const mobileDrawer = document.getElementById('web-mobile-menu-drawer');
      if (mobileBtn && mobileDrawer) {
        mobileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          mobileDrawer.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
          if (!mobileDrawer.contains(e.target) && e.target !== mobileBtn) {
            mobileDrawer.classList.remove('open');
          }
        });
      }

      // Hide legacy bottom navigation if present
      const bottomNavMount = document.getElementById('bottom-nav-mount');
      if (bottomNavMount) {
        bottomNavMount.style.display = 'none';
        bottomNavMount.innerHTML = '';
      }
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

      const isSup = user.role === 'supervisor';
      const isSubPage = window.location.pathname.includes('/pages/');
      const assetsPrefix = isSubPage ? '../assets/' : './assets/';
      const avatarSrc = isSup
        ? `${assetsPrefix}images/avatar-supervisor.svg`
        : `${assetsPrefix}images/avatar-coordinator.svg`;

      modal.innerHTML = `
        <div class="modal-sheet" style="max-width: 650px;">
          <div class="modal-header">
            <h3 style="display: flex; align-items: center; gap: 8px;">
              <img src="${assetsPrefix}icons/user-cog.svg" class="ui-icon ui-icon-md" alt="" />
              <span>الملف الوظيفي وإعدادات الحساب</span>
            </h3>
            <button type="button" class="close-modal-btn" id="close-profile-modal">&times;</button>
          </div>

          <!-- User Identity Overview Card -->
          <div class="card" style="background: var(--adco-green-mint); text-align: center; padding: 20px; border: 1.5px solid var(--adco-green-border); margin-bottom: 16px;">
            <img src="${avatarSrc}" alt="Avatar" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 8px; display: block; border: 2px solid var(--adco-green-primary);" />
            <h2 style="margin-bottom: 4px; font-size: 1.15rem;">${user.fullName}</h2>
            <span class="badge ${isSup ? 'badge-success' : 'badge-mint'}" style="margin-bottom: 8px;">
              ${isSup ? 'مشرف عام العمليات (Supervisor)' : 'منسق عروض ميداني (Coordinator)'}
            </span>
            <div style="display: flex; justify-content: center; gap: 16px; font-size: 0.84rem; color: var(--adco-gray-700); flex-wrap: wrap;">
              <span>الرقم الوظيفي: <strong>${user.employeeId}</strong></span>
              <span>الفرع: <strong>${user.branch}</strong></span>
              ${!isSup ? `<span>الترتيب: <strong>${user.rank || '#3'}</strong></span>` : ''}
            </div>
          </div>

          <!-- Section 1: Update Email & Mobile Contact Info (Password-Protected) -->
          <div class="card" style="padding: 18px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                <img src="${assetsPrefix}icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>البيانات الشخصية والاتصال (البريد والهاتف)</span>
              </h4>
              <span class="badge badge-warning" id="contact-lock-status-badge" style="font-size: 0.74rem;">
                <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>محمية بكلمة المرور</span>
              </span>
            </div>

            <!-- Gate: Locked View requiring password to view and edit -->
            <div id="contact-locked-view" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: var(--radius-sm); padding: 18px; text-align: center;">
              <p style="font-size: 0.84rem; color: var(--adco-gray-700); margin-bottom: 12px; font-weight: 600;">
                لحماية خصوصية الحساب، يرجى إدخال كلمة المرور الحالية لعرض وتعديل بياناتك الشخصية:
              </p>
              <div style="display: flex; gap: 8px; max-width: 380px; margin: 0 auto; flex-wrap: wrap;">
                <input
                  type="password"
                  id="unlock-contact-pass"
                  class="form-input"
                  placeholder="أدخل كلمة المرور الحالية..."
                  style="flex: 1; min-width: 170px;"
                />
                <button type="button" class="btn btn-primary btn-sm" id="btn-unlock-contact" style="white-space: nowrap;">
                  <img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>تأكيد وعرض</span>
                </button>
              </div>
              <div id="unlock-contact-error" style="display: none; color: var(--adco-danger); font-size: 0.78rem; margin-top: 8px; font-weight: 700;"></div>
            </div>

            <!-- Gate: Unlocked View with actual inputs (hidden until password verified) -->
            <div id="contact-unlocked-view" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
                <span class="badge badge-success" style="font-size: 0.76rem;">
                  <img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>تم تأكيد الهوية بنجاح — البيانات مفتوحة للتعديل</span>
                </span>
                <button type="button" id="btn-relock-contact" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.74rem;">
                  قفل مجدداً
                </button>
              </div>
              <form id="profile-contact-form">
                <div class="responsive-form-grid" style="gap: 12px; margin-bottom: 12px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.82rem;">البريد الإلكتروني الرسمي</label>
                    <input type="email" id="prof-email" class="form-input" value="${user.email || ''}" placeholder="name@adco.com.eg" required />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.82rem;">رقم الهاتف المحمول</label>
                    <input type="text" id="prof-mobile" class="form-input" value="${user.mobile || ''}" placeholder="01012345678" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="width: auto;">
                  <span>حفظ بيانات الاتصال</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Section 2: Change Password -->
          <div class="card" style="padding: 18px; margin-bottom: 16px;">
            <h4 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>تغيير كلمة المرور</span>
            </h4>
            <form id="profile-password-form">
              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 0.82rem;">كلمة المرور الحالية</label>
                <input type="password" id="prof-pass-curr" class="form-input" placeholder="••••••••" required />
              </div>
              <div class="responsive-form-grid" style="gap: 12px; margin-bottom: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 0.82rem;">كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-new" class="form-input" placeholder="••••••••" required />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 0.82rem;">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-conf" class="form-input" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" style="width: auto;">
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>

          <!-- Section 3: Switch Role Sandbox -->
          <div class="card" style="border-style: dashed; padding: 16px; margin-bottom: 16px;">
            <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>تبديل الصلاحية (للمعاينة الفورية)</span>
            </h4>
            <div class="responsive-form-grid" style="gap: 10px;">
              <button type="button" class="btn ${!isSup ? 'btn-primary' : 'btn-secondary'} btn-sm" id="switch-to-coord">
                <img src="${assetsPrefix}images/avatar-coordinator.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>وضع المنسق (ADCO-101)</span>
              </button>
              <button type="button" class="btn ${isSup ? 'btn-primary' : 'btn-secondary'} btn-sm" id="switch-to-sup">
                <img src="${assetsPrefix}images/avatar-supervisor.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>وضع المشرف (ADCO-901)</span>
              </button>
            </div>
          </div>

          <button type="button" class="btn btn-danger btn-sm" id="modal-logout-btn" style="width: 100%;">
            <img src="${assetsPrefix}icons/log-out.svg" class="ui-icon ui-icon-sm" alt="" />
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
          lockBadge.innerHTML = `<img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" /><span>تم التحقق (مفتوح للتعديل)</span>`;
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
          lockBadge.innerHTML = `<img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" /><span>محمية بكلمة المرور</span>`;
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

      document.getElementById('switch-to-coord').addEventListener('click', async () => {
        await global.AuthManager.login('ADCO-101', 'Pass@1234');
        modal.classList.remove('active');
        if (typeof global.showToast === 'function') {
          global.showToast('تم التبديل إلى حساب المنسق وتحديث الشريط العلوي', 'success');
        }
        window.location.href = isSubPage ? './dashboard.html' : './pages/dashboard.html';
      });

      document.getElementById('switch-to-sup').addEventListener('click', async () => {
        await global.AuthManager.login('ADCO-901', 'Admin@2026');
        modal.classList.remove('active');
        if (typeof global.showToast === 'function') {
          global.showToast('تم التبديل إلى حساب المشرف وتفعيل أدوات الإشراف', 'success');
        }
        window.location.href = isSubPage ? './supervisor-panel.html' : './pages/supervisor-panel.html';
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
