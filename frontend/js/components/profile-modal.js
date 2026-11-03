/**
 * ADCO Field Operations System - Profile Modal Component
 * Single Responsibility: Interactive user profile modal, password verification gate,
 * contact details update (email/mobile), and change password form.
 */

import { STORAGE_KEYS } from '../config/constants.js';
import { showToast } from './toast.js';

export class ProfileModal {
  static ensureModalContainer() {
    if (typeof document === 'undefined') return null;
    let modal = document.getElementById('adco-profile-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adco-profile-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    return modal;
  }

  static open(user, options = {}) {
    if (!user) return;
    const modal = this.ensureModalContainer();
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
            <span>لوحة الحساب والبيانات الشخصية</span>
          </h3>
          <button type="button" class="close-modal-btn" id="close-profile-modal">&times;</button>
        </div>

        <!-- User Identity Overview Card -->
        <div class="card" style="background: var(--adco-green-mint); text-align: center; padding: 20px; border: 1.5px solid var(--adco-green-border); margin-bottom: 16px;">
          <img src="${avatarSrc}" alt="Avatar" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 8px; display: block; border: 2px solid var(--adco-green-primary);" />
          <h2 style="margin-bottom: 4px; font-size: 1.15rem;">${user.fullName}</h2>
          <span class="badge ${isSup ? 'badge-success' : 'badge-mint'}" style="margin-bottom: 8px;">
            ${isSup ? 'مشرف عام العمليات (Supervisor)' : 'منسق ميداني معتمد (Coordinator)'}
          </span>
          <div style="display: flex; justify-content: center; gap: 16px; font-size: 0.84rem; color: var(--adco-gray-700); flex-wrap: wrap;">
            <span>الرقم الوظيفي: <strong>${user.employeeId}</strong></span>
            <span>الفرع: <strong>${user.branch || 'الإسكندرية'}</strong></span>
            ${!isSup ? `<span>الترتيب: <strong>${user.rank || '#1'}</strong></span>` : ''}
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

    // Password unlock gate
    const unlockPassInput = document.getElementById('unlock-contact-pass');
    const unlockBtn = document.getElementById('btn-unlock-contact');
    const unlockError = document.getElementById('unlock-contact-error');
    const lockedView = document.getElementById('contact-locked-view');
    const unlockedView = document.getElementById('contact-unlocked-view');
    const lockBadge = document.getElementById('contact-lock-status-badge');

    const attemptUnlock = () => {
      const pass = (unlockPassInput.value || '').trim();
      if (!pass) {
        unlockError.textContent = 'يرجى إدخال كلمة المرور أولاً.';
        unlockError.style.display = 'block';
        return;
      }
      const isValid = (window.AuthManager && typeof window.AuthManager.verifyPassword === 'function')
        ? window.AuthManager.verifyPassword(user.employeeId, pass)
        : pass.length >= 6;

      if (isValid) {
        unlockError.style.display = 'none';
        lockedView.style.display = 'none';
        unlockedView.style.display = 'block';
        lockBadge.className = 'badge badge-success';
        lockBadge.innerHTML = `<img src="${assetsPrefix}icons/check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" /><span>تم التحقق (مفتوح للتعديل)</span>`;
        showToast('تم تأكيد الهوية بنجاح', 'success');
      } else {
        unlockError.textContent = 'كلمة المرور غير صحيحة. حاول مجدداً.';
        unlockError.style.display = 'block';
      }
    };

    unlockBtn.addEventListener('click', attemptUnlock);
    unlockPassInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptUnlock();
    });

    document.getElementById('btn-relock-contact').addEventListener('click', () => {
      unlockedView.style.display = 'none';
      lockedView.style.display = 'block';
      unlockPassInput.value = '';
      lockBadge.className = 'badge badge-warning';
      lockBadge.innerHTML = `<img src="${assetsPrefix}icons/shield-check.svg" class="ui-icon ui-icon-sm" alt="" /><span>محمية بكلمة المرور</span>`;
    });

    // Update Contact Details Form Submit
    document.getElementById('profile-contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('prof-email').value.trim();
      const newMobile = document.getElementById('prof-mobile').value.trim();
      if (window.AuthManager && typeof window.AuthManager.updateContactInfo === 'function') {
        window.AuthManager.updateContactInfo(user.employeeId, newEmail, newMobile);
      }
      showToast('تم حفظ بيانات الاتصال بنجاح', 'success');
    });

    // Change Password Form Submit
    document.getElementById('profile-password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const curr = document.getElementById('prof-pass-curr').value;
      const next = document.getElementById('prof-pass-new').value;
      const conf = document.getElementById('prof-pass-conf').value;

      if (next !== conf) {
        return showToast('كلمة المرور الجديدة غير متطابقة مع التأكيد', 'error');
      }
      if (next.length < 6) {
        return showToast('يجب أن تتكون كلمة المرور من 6 أحرف/أرقام على الأقل', 'warning');
      }

      if (window.AuthManager && typeof window.AuthManager.updatePassword === 'function') {
        const ok = window.AuthManager.updatePassword(user.employeeId, curr, next);
        if (!ok) return showToast('كلمة المرور الحالية غير صحيحة', 'error');
      }
      showToast('تم تحديث كلمة المرور بنجاح', 'success');
      document.getElementById('profile-password-form').reset();
    });

    // Switch Role sandbox
    document.getElementById('switch-to-coord').addEventListener('click', () => {
      if (window.AuthManager && typeof window.AuthManager.switchRole === 'function') {
        window.AuthManager.switchRole('coordinator');
      }
    });

    document.getElementById('switch-to-sup').addEventListener('click', () => {
      if (window.AuthManager && typeof window.AuthManager.switchRole === 'function') {
        window.AuthManager.switchRole('supervisor');
      }
    });

    // Modal Logout
    document.getElementById('modal-logout-btn').addEventListener('click', () => {
      if (window.AuthManager && typeof window.AuthManager.logout === 'function') {
        window.AuthManager.logout();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.ProfileModal = ProfileModal;
}
