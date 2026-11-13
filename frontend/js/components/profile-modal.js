/**
 * ADCO Field Operations System - Profile Modal Component
 * Single Responsibility: Interactive user profile modal, password verification gate,
 * contact details update (email/mobile), change password form, and 3-Tier demo role switcher.
 */

import { STORAGE_KEYS } from '../config/constants.js';
import { AuthService } from '../services/auth.service.js';
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

  static open(user) {
    if (!user) {
      user = AuthService.getCurrentUser() || (typeof window !== 'undefined' && (window.currentUser || (window.AuthManager && window.AuthManager.getCurrentUser())));
    }
    if (!user) return;
    const modal = this.ensureModalContainer();
    const role = user.role;
    const isManager = role === 'marketing_manager';
    const isCoordSup = role === 'coordinator_supervisor';
    const isSubPage = window.location.pathname.includes('/pages/');
    const assetsPrefix = isSubPage ? '../assets/' : './assets/';
    const avatarSrc = isManager
      ? `${assetsPrefix}images/avatar-supervisor.avif`
      : `${assetsPrefix}images/avatar-coordinator.avif`;

    const roleBadgeText = isManager
      ? 'مسؤول التسويق'
      : isCoordSup
      ? 'مشرف منسق'
      : 'منسق ميداني';

    modal.innerHTML = `
      <div class="modal-sheet" style="max-width: 650px;">
        <div class="modal-header">
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="user-cog" class="ui-icon ui-icon-md"></i>
            <span>الملف الشخصي</span>
          </h3>
          <button type="button" class="close-modal-btn" id="close-profile-modal">&times;</button>
        </div>

        <!-- User Identity Overview Card -->
        <div class="card" style="background: var(--adco-green-mint); text-align: center; padding: 20px; border: 1.5px solid var(--adco-green-border); margin-bottom: 16px;">
          <img src="${avatarSrc}" alt="Avatar" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 8px; display: block; border: 2px solid var(--adco-green-primary);" />
          <h2 style="margin-bottom: 4px; font-size: 1.15rem;">${user.fullName}</h2>
          <span class="badge ${isManager ? 'badge-success' : 'badge-mint'}" style="margin-bottom: 8px;">
            ${roleBadgeText}
          </span>
          <div style="display: flex; justify-content: center; gap: 16px; font-size: 0.84rem; color: var(--adco-gray-700); flex-wrap: wrap;">
            <span>الرقم الوظيفي: <strong>${user.employeeId}</strong></span>
            <span>الفرع / النطاق: <strong>${user.assignedBranchName || user.branch || user.region || 'الإسكندرية'}</strong></span>
            ${!isManager ? `<span>الترتيب: <strong>${user.rank || '#1'}</strong></span>` : ''}
          </div>
        </div>

        <!-- Section 1: Update Email & Mobile Contact Info (Password-Protected) -->
        <div class="card" style="padding: 18px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="clipboard-edit" class="ui-icon ui-icon-sm"></i>
              <span>بيانات الاتصال</span>
            </h4>
            <span class="badge badge-warning" id="contact-lock-status-badge" style="font-size: 0.74rem;">
              <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
              <span>محمية</span>
            </span>
          </div>

          <!-- Gate: Locked View requiring password to view and edit -->
          <div id="contact-locked-view" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: var(--radius-sm); padding: 18px; text-align: center;">
            <p style="font-size: 0.84rem; color: var(--adco-gray-700); margin-bottom: 12px; font-weight: 600;">
              أدخل كلمة المرور الحالية لعرض وتعديل البيانات:
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
                <span>تأكيد</span>
              </button>
            </div>
            <p id="unlock-contact-error" style="color: var(--adco-danger); font-size: 0.78rem; margin-top: 8px; display: none;"></p>
          </div>

          <!-- Gate: Unlocked View with editable fields -->
          <div id="contact-unlocked-view" style="display: none;">
            <form id="profile-contact-form">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label" for="prof-email">البريد الإلكتروني المعتمد</label>
                  <input type="email" id="prof-email" class="form-input" value="${user.email || ''}" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-mobile">رقم الهاتف المحمول</label>
                  <input type="tel" id="prof-mobile" class="form-input" value="${user.mobile || ''}" required />
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-relock-contact">إعادة القفل</button>
                <button type="submit" class="btn btn-primary btn-sm">
                  <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Section 2: Change Password -->
        <div class="card" style="padding: 18px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
            <span>تحديث كلمة المرور</span>
          </h4>
          <form id="profile-password-form">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 14px;">
              <div class="form-group">
                <label class="form-label" for="prof-pass-curr">كلمة المرور الحالية</label>
                <input type="password" id="prof-pass-curr" class="form-input" placeholder="••••••••" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-pass-new">كلمة المرور الجديدة</label>
                <input type="password" id="prof-pass-new" class="form-input" placeholder="8 أحرف كحد أدنى" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-pass-conf">تأكيد كلمة المرور</label>
                <input type="password" id="prof-pass-conf" class="form-input" placeholder="••••••••" required />
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary btn-sm">
                <i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i>
                <span>تحديث كلمة المرور</span>
              </button>
            </div>
          </form>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 4px; gap: 12px;">
          <button type="button" class="btn btn-danger" id="modal-logout-btn" style="padding: 0.6rem 1.25rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
            <i data-lucide="log-out" class="ui-icon ui-icon-sm"></i>
            <span>تسجيل الخروج</span>
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="modal-close-bottom">إغلاق</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(modal);
    }

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('close-profile-modal').addEventListener('click', closeModal);
    document.getElementById('modal-close-bottom').addEventListener('click', closeModal);
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
      const isValid = AuthService.verifyPassword(user.employeeId, pass);

      if (isValid) {
        unlockError.style.display = 'none';
        lockedView.style.display = 'none';
        unlockedView.style.display = 'block';
        lockBadge.className = 'badge badge-success';
        lockBadge.innerHTML = `<i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i><span>تم التحقق (مفتوح للتعديل)</span>`;
        if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') window.refreshIcons(lockBadge);
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
      lockBadge.innerHTML = `<i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i><span>محمية بكلمة المرور</span>`;
      if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') window.refreshIcons(lockBadge);
    });

    // Update Contact Details Form Submit
    document.getElementById('profile-contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('prof-email').value.trim();
      const newMobile = document.getElementById('prof-mobile').value.trim();
      await AuthService.updateContactInfo(user.employeeId, newEmail, newMobile);
      showToast('تم حفظ بيانات الاتصال بنجاح', 'success');
    });

    // Change Password Form Submit
    document.getElementById('profile-password-form').addEventListener('submit', async (e) => {
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

      const ok = await AuthService.updatePassword(user.employeeId, curr, next);
      if (!ok) return showToast('كلمة المرور الحالية غير صحيحة', 'error');

      showToast('تم تحديث كلمة المرور بنجاح', 'success');
      document.getElementById('profile-password-form').reset();
    });

    // Modal Logout
    document.getElementById('modal-logout-btn').addEventListener('click', () => {
      AuthService.logout();
    });
  }
}

if (typeof window !== 'undefined') {
  window.ProfileModal = ProfileModal;
}

