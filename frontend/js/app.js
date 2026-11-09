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
      this.initSmoothPageTransitions();
      this.triggerSlideUpBoxes();
      this.registerServiceWorker();
    }

    /**
     * Triggers lightweight staggered slide-up box entrance animations on cards & sections
     */
    static triggerSlideUpBoxes(rootEl) {
      try {
        const scope = rootEl || document.querySelector('.web-main-workspace') || document.body;
        if (!scope) return;
        const boxes = scope.querySelectorAll(
          '.card, .kpi-card, .branch-master-card, .circular-ring-card, .chart-card, .activity-card-item, .podium-card'
        );
        boxes.forEach((box, idx) => {
          box.classList.add('slide-up-box-item');
          const delaySec = Math.min(idx * 0.03, 0.18).toFixed(2);
          box.style.animationDelay = `${delaySec}s`;
        });
      } catch (_) {}
    }

    /**
     * Smooth Page Transitions, Scroll Restoration & History Routing
     */
    static navigateTo(targetUrl) {
      if (!targetUrl) return;
      try {
        sessionStorage.setItem(
          `ADCO_SCROLL_${window.location.pathname}`,
          String(window.scrollY || document.documentElement.scrollTop || 0)
        );
      } catch (_) {}

      if (document.body) {
        document.body.classList.add('page-is-leaving');
      }

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 150);
    }

    static initSmoothPageTransitions() {
      if (this._transitionsInitialized) return;
      this._transitionsInitialized = true;

      // Enable browser scroll restoration + restore saved scroll on back/forward navigation
      try {
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'auto';
        }
      } catch (_) {}

      window.addEventListener('pageshow', (e) => {
        if (document.body) {
          document.body.classList.remove('page-is-leaving');
        }
        if (e.persisted) {
          try {
            const savedY = Number(sessionStorage.getItem(`ADCO_SCROLL_${window.location.pathname}`) || 0);
            if (savedY > 0) window.scrollTo({ top: savedY, behavior: 'instant' });
          } catch (_) {}
        }
      });

      // Intercept internal same-origin navigation links for smooth fade/slide exit
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
      const isManager = user && (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor');
      const isCoordSupervisor = user && user.role === 'coordinator_supervisor';
      const isSupervisor = isManager;
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
                <span class="web-brand-title">(ADCO) شركة الاسكندريه للكيماويات و المنظفات</span>
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
              <span class="wmct-name">(ADCO) شركة الاسكندريه للكيماويات و المنظفات</span>
              <span class="wmct-sub"><i class="wmct-dot"></i>ADCO</span>
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
                    <img src="${assetsPrefix}icons/trophy.svg" class="ui-icon ui-icon-sm" alt="" />
                    <span>${(user.rank || (isCoordSupervisor ? '#2' : '#3')).replace('بين المنسقين', '').trim()}</span>
                  </a>
                `
                    : ''
                }

                <div class="web-profile-pill" id="web-profile-trigger" title="عرض الملف الوظيفي وإعدادات الحساب">
                  <img src="${avatarSrc}" alt="Avatar" class="web-profile-avatar" />
                  <div class="web-profile-meta">
                    <span class="web-profile-name">${user.fullName}</span>
                    <span class="web-profile-role">${isManager ? 'مسؤول التسويق' : isCoordSupervisor ? 'مشرف منسق' : 'منسق ميداني'}</span>
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
                  <a href="${link.href}" class="web-nav-item ${isActive ? 'active' : ''} cm-s1">
                    <img src="${assetsPrefix}icons/${link.icon}" class="ui-icon ui-icon-md" alt="" />
                    <span>${link.label}</span>
                  </a>
                `;
              })
              .join('')}
            ${
              user
                ? `
              <button type="button" class="web-nav-item cm-s2" id="drawer-logout-btn">
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

      const isSup = user && (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor');
      const isCoordSupervisor = user && user.role === 'coordinator_supervisor';
      const isSubPage = window.location.pathname.includes('/pages/');
      const assetsPrefix = isSubPage ? '../assets/' : './assets/';
      const avatarSrc = isSup
        ? `${assetsPrefix}images/avatar-supervisor.svg`
        : `${assetsPrefix}images/avatar-coordinator.svg`;

      modal.innerHTML = `
        <div class="modal-sheet cm-s3">
          <div class="modal-header">
            <h3 class="cm-s4">
              <img src="${assetsPrefix}icons/user-cog.svg" class="ui-icon ui-icon-md" alt="" />
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
                <img src="${assetsPrefix}icons/clipboard-edit.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>البيانات الشخصية والاتصال (البريد والهاتف)</span>
              </h4>
              <span class="badge badge-warning cm-s13" id="contact-lock-status-badge">
                <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
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
                  <img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
                  <span>تأكيد وعرض</span>
                </button>
              </div>
              <div class="cm-s19 is-hidden" id="unlock-contact-error"></div>
            </div>

            <!-- Gate: Unlocked View with actual inputs (hidden until password verified) -->
            <div class="is-hidden" id="contact-unlocked-view">
              <div class="cm-s20">
                <span class="badge badge-success cm-s21">
                  <img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />
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
              <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
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

          <!-- Section 3: Switch Role Sandbox -->
          <div class="card cm-s29">
            <h4 class="cm-s30">
              <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
              <span>تبديل الصلاحية (للمعاينة الفورية)</span>
            </h4>
            <div class="responsive-form-grid cm-s31">
              <button type="button" class="btn ${user.role === 'coordinator' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="switch-to-coord">
                <img src="${assetsPrefix}images/avatar-coordinator.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>1. منسق ميداني (ADCO-101)</span>
              </button>
              <button type="button" class="btn ${user.role === 'coordinator_supervisor' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="switch-to-coord-sup">
                <img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>2. مشرف منسق (ADCO-501)</span>
              </button>
              <button type="button" class="btn ${isSup ? 'btn-primary' : 'btn-secondary'} btn-sm" id="switch-to-sup">
                <img src="${assetsPrefix}images/avatar-supervisor.svg" class="ui-icon ui-icon-sm" alt="" />
                <span>3. مسؤول التسويق (ADCO-901)</span>
              </button>
            </div>
          </div>

          <button type="button" class="btn btn-danger btn-sm cm-s32" id="modal-logout-btn">
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

      const coordBtn = document.getElementById('switch-to-coord');
      if (coordBtn) {
        coordBtn.addEventListener('click', async () => {
          await global.AuthManager.login('ADCO-101', 'Pass@1234');
          modal.classList.remove('active');
          if (typeof global.showToast === 'function') {
            global.showToast('تم التبديل إلى حساب المنسق الميداني (أحمد محمود - سموحة)', 'success');
          }
          window.location.href = isSubPage ? './dashboard.html' : './pages/dashboard.html';
        });
      }

      const coordSupBtn = document.getElementById('switch-to-coord-sup');
      if (coordSupBtn) {
        coordSupBtn.addEventListener('click', async () => {
          await global.AuthManager.login('ADCO-501', 'Super@2026');
          modal.classList.remove('active');
          if (typeof global.showToast === 'function') {
            global.showToast('تم التبديل إلى حساب مشرف المنسق (أيمن الروبي - فتح الله الإسكندرية)', 'success');
          }
          window.location.href = isSubPage ? './dashboard.html' : './pages/dashboard.html';
        });
      }

      const supBtn = document.getElementById('switch-to-sup');
      if (supBtn) {
        supBtn.addEventListener('click', async () => {
          await global.AuthManager.login('ADCO-901', 'Admin@2026');
          modal.classList.remove('active');
          if (typeof global.showToast === 'function') {
            global.showToast('تم التبديل إلى حساب مسؤول التسويق (م. حسام الدين غانم)', 'success');
          }
          window.location.href = isSubPage ? './supervisor-panel.html' : './pages/supervisor-panel.html';
        });
      }

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
