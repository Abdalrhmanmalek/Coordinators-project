/**
 * ADCO Field Operations System - Profile Modal Component
 * Universal Browser IIFE (Works on both http:// and file:// protocols).
 * Single Responsibility: Compact user identity header, tabbed switcher between
 * contact details (password-gated) and password update, and accessible logout footer.
 */

(function (global) {
  function getAuth() {
    return global.AuthManager || global.AuthService || global.Auth || null;
  }

  function toast(msg, type) {
    if (typeof global.showToast === 'function') {
      global.showToast(msg, type);
    } else if (typeof alert === 'function') {
      alert(msg);
    }
  }

  class ProfileModal {
    static ensureModalContainer() {
      if (typeof document === 'undefined') return null;
      let modal = document.getElementById('adco-profile-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adco-profile-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.removeAttribute('hidden');
      modal.style.zIndex = '9999';
      return modal;
    }

    static open(user) {
      const Auth = getAuth();
      if (!user && Auth && typeof Auth.getCurrentUser === 'function') {
        user = Auth.getCurrentUser();
      }
      if (!user && typeof global !== 'undefined') {
        user = global.currentUser || null;
      }
      if (!user) return;

      const modal = this.ensureModalContainer();
      if (!modal) return;

      const role = user.role;
      const isManager = role === 'marketing_manager';
      const isCoordSup = role === 'coordinator_supervisor';
      const isSubPage = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
      const assetsPrefix = isSubPage ? '../assets/' : './assets/';
      const avatarSrc = isManager
        ? `${assetsPrefix}images/avatar-supervisor.avif`
        : `${assetsPrefix}images/avatar-coordinator.avif`;

      const roleBadgeText = isManager
        ? 'مسؤول التسويق'
        : isCoordSup
        ? 'مشرف منسق'
        : 'منسق ميداني';

      const branchText = user.assignedBranchName || user.branch || user.region || 'الإسكندرية';
      let activeTab = 'contact';
      let isContactUnlocked = false;

      modal.innerHTML = `
        <div class="modal-sheet">
          <div class="modal-header">
            <h3 style="display: flex; align-items: center; gap: 8px; margin: 0;">
              <i data-lucide="user-cog" class="ui-icon ui-icon-md"></i>
              <span>الملف الشخصي</span>
            </h3>
            <button type="button" class="close-modal-btn" id="close-profile-modal" aria-label="إغلاق">&times;</button>
          </div>

          <!-- Compact User Identity Header -->
          <div class="profile-identity-card">
            <img src="${avatarSrc}" alt="Avatar" class="profile-avatar-img" />
            <div class="profile-identity-info">
              <div class="profile-identity-top">
                <h2 class="profile-identity-name">${user.fullName}</h2>
                <span class="badge ${isManager ? 'badge-success' : 'badge-mint'}">${roleBadgeText}</span>
              </div>
              <div class="profile-identity-meta">
                <span>الرقم الوظيفي: <strong>${user.employeeId}</strong></span>
                <span>•</span>
                <span>الفرع: <strong>${branchText}</strong></span>
                ${!isManager && user.rank ? `<span>•</span><span>الترتيب: <strong>${user.rank}</strong></span>` : ''}
              </div>
            </div>
          </div>

          <!-- 2-Button Segmented Switcher Bar -->
          <div class="profile-tabs-bar" role="tablist">
            <button type="button" class="profile-tab-btn active" id="tab-btn-contact" data-tab="contact" role="tab" aria-selected="true">
              <i data-lucide="id-card" class="ui-icon ui-icon-sm"></i>
              <span>البيانات الشخصية والاتصال</span>
            </button>
            <button type="button" class="profile-tab-btn" id="tab-btn-password" data-tab="password" role="tab" aria-selected="false">
              <i data-lucide="lock" class="ui-icon ui-icon-sm"></i>
              <span>تغيير كلمة المرور</span>
            </button>
          </div>

          <!-- Dynamic Single-View Viewport -->
          <div id="profile-tab-viewport" class="profile-tab-viewport"></div>

          <!-- Compact Footer Row -->
          <div class="profile-modal-footer">
            <button type="button" class="profile-logout-btn" id="modal-logout-btn">
              <i data-lucide="log-out" class="ui-icon ui-icon-sm"></i>
              <span>تسجيل الخروج</span>
            </button>
            <button type="button" class="profile-close-btn" id="modal-close-bottom">إغلاق</button>
          </div>
        </div>
      `;

      const viewport = modal.querySelector('#profile-tab-viewport');

      const renderContactTab = () => {
        viewport.innerHTML = `
          <div class="profile-tab-panel">
            <div style="display: flex; align-items: center; margin-bottom: 12px; gap: 8px;">
              <span style="font-size: 0.88rem; font-weight: 700; color: #1e293b; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="clipboard-edit" class="ui-icon ui-icon-sm"></i>
                <span>بيانات الاتصال</span>
              </span>
            </div>

            ${
              !isContactUnlocked
                ? `
              <div id="contact-locked-view" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="font-size: 0.84rem; color: #475569; margin: 0 0 12px 0; font-weight: 600;">
                  أدخل كلمة المرور الحالية لعرض وتعديل بيانات الاتصال
                </p>
                <div style="display: flex; gap: 8px; max-width: 380px; margin: 0 auto; flex-wrap: wrap;">
                  <input
                    type="password"
                    id="unlock-contact-pass"
                    class="form-input"
                    placeholder="كلمة المرور..."
                    style="flex: 1; min-width: 170px;"
                  />
                  <button type="button" class="btn btn-primary btn-sm" id="btn-unlock-contact" style="white-space: nowrap;">
                    <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                    <span>تأكيد وعرض</span>
                  </button>
                </div>
                <p id="unlock-contact-error" style="color: var(--adco-danger); font-size: 0.78rem; margin-top: 8px; display: none;"></p>
              </div>
            `
                : `
              <form id="profile-contact-form">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 14px;">
                  <div class="form-group">
                    <label class="form-label" for="prof-email">البريد الإلكتروني</label>
                    <input type="email" id="prof-email" class="form-input" value="${user.email || ''}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="prof-mobile">رقم الهاتف</label>
                    <input type="tel" id="prof-mobile" class="form-input" value="${user.mobile || ''}" required />
                  </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-relock-contact">إعادة القفل</button>
                  <button type="submit" class="btn btn-primary btn-sm">
                    <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                    <span>حفظ</span>
                  </button>
                </div>
              </form>
            `
            }
          </div>
        `;

        if (typeof global.refreshIcons === 'function') {
          global.refreshIcons(viewport);
        }

        if (!isContactUnlocked) {
          const unlockPassInput = viewport.querySelector('#unlock-contact-pass');
          const unlockBtn = viewport.querySelector('#btn-unlock-contact');
          const unlockError = viewport.querySelector('#unlock-contact-error');

          const attemptUnlock = () => {
            const pass = (unlockPassInput.value || '').trim();
            if (!pass) {
              unlockError.textContent = 'يرجى إدخال كلمة المرور أولاً.';
              unlockError.style.display = 'block';
              return;
            }
            const ok = Auth && typeof Auth.verifyPassword === 'function' && Auth.verifyPassword(user.employeeId, pass);
            if (ok) {
              isContactUnlocked = true;
              toast('تم تأكيد الهوية بنجاح', 'success');
              renderContactTab();
            } else {
              unlockError.textContent = 'كلمة المرور غير صحيحة. حاول مجدداً.';
              unlockError.style.display = 'block';
            }
          };

          unlockBtn.addEventListener('click', attemptUnlock);
          unlockPassInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') attemptUnlock();
          });
        } else {
          viewport.querySelector('#btn-relock-contact').addEventListener('click', () => {
            isContactUnlocked = false;
            renderContactTab();
          });

          viewport.querySelector('#profile-contact-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = viewport.querySelector('#prof-email').value.trim();
            const newMobile = viewport.querySelector('#prof-mobile').value.trim();
            if (Auth && typeof Auth.updateContactInfo === 'function') {
              await Auth.updateContactInfo(user.employeeId, newEmail, newMobile);
            }
            user.email = newEmail;
            user.mobile = newMobile;
            toast('تم حفظ بيانات الاتصال بنجاح', 'success');
          });
        }
      };

      const renderPasswordTab = () => {
        viewport.innerHTML = `
          <div class="profile-tab-panel">
            <form id="profile-password-form">
              <div class="profile-password-fields">
                <div class="form-group">
                  <label class="form-label" for="prof-pass-curr">كلمة المرور الحالية</label>
                  <input type="password" id="prof-pass-curr" class="form-input" placeholder="••••••••" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-pass-new">كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-new" class="form-input" placeholder="6 أحرف فأكثر" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-pass-conf">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" id="prof-pass-conf" class="form-input" placeholder="••••••••" required />
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
                <button type="submit" class="btn btn-primary btn-sm">
                  <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                  <span>تحديث كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        `;

        if (typeof global.refreshIcons === 'function') {
          global.refreshIcons(viewport);
        }

        viewport.querySelector('#profile-password-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const curr = viewport.querySelector('#prof-pass-curr').value;
          const next = viewport.querySelector('#prof-pass-new').value;
          const conf = viewport.querySelector('#prof-pass-conf').value;

          if (next !== conf) {
            return toast('كلمة المرور الجديدة غير متطابقة مع التأكيد', 'error');
          }
          if (next.length < 6) {
            return toast('يجب أن تتكون كلمة المرور من 6 أحرف/أرقام على الأقل', 'warning');
          }

          let ok = false;
          try {
            if (Auth && typeof Auth.updatePassword === 'function') {
              ok = await Auth.updatePassword(user.employeeId, curr, next);
            } else if (Auth && typeof Auth.changePassword === 'function') {
              await Auth.changePassword(user.employeeId, curr, next);
              ok = true;
            }
          } catch (err) {
            return toast(err.message || 'كلمة المرور الحالية غير صحيحة', 'error');
          }
          if (!ok) return toast('كلمة المرور الحالية غير صحيحة', 'error');

          toast('تم تحديث كلمة المرور بنجاح', 'success');
          e.target.reset();
        });
      };

      const switchTab = (tabName) => {
        activeTab = tabName;
        modal.querySelectorAll('.profile-tab-btn').forEach((btn) => {
          const isActive = btn.dataset.tab === tabName;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
        });
        if (tabName === 'contact') renderContactTab();
        else renderPasswordTab();
      };

      modal.querySelectorAll('.profile-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
      });

      // Initial render & show modal
      switchTab(activeTab);
      modal.classList.add('active', 'open');
      if (typeof global.refreshIcons === 'function') {
        global.refreshIcons(modal);
      }

      const closeModal = () => modal.classList.remove('active', 'open');
      modal.querySelector('#close-profile-modal').addEventListener('click', closeModal);
      modal.querySelector('#modal-close-bottom').addEventListener('click', closeModal);
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      modal.querySelector('#modal-logout-btn').addEventListener('click', () => {
        if (Auth && typeof Auth.logout === 'function') Auth.logout();
      });
    }
  }

  // Bulletproof delegated click listener across all SPA routes and Lucide SVG children
  if (typeof document !== 'undefined' && !global.__adcoProfileClickBound) {
    global.__adcoProfileClickBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#navbar-profile-btn, #web-profile-trigger, [data-action="open-profile"]');
      if (btn) {
        e.preventDefault();
        ProfileModal.open();
      }
    });
  }

  global.ProfileModal = ProfileModal;
  global.openProfileModal = (u) => ProfileModal.open(u);
})(typeof window !== 'undefined' ? window : globalThis);
