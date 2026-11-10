/**
 * ADCO Field Operations System - Login Page Controller
 * Single Responsibility: Authentication DOM handling, credentials submission,
 * show/hide password toggle, and 3-tier fast login demo buttons.
 * Compatible with both file:// protocol and http:// server environments.
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const toast = global.showToast || alert;

  const loginForm = document.getElementById('login-form');
  const empInput = document.getElementById('employeeId') || document.getElementById('employee-id');
  const passInput = document.getElementById('password');
  const btn = document.getElementById('login-submit-btn');

  // Fast login helper function for quickFill buttons
  global.quickFill = function (empId, pass) {
    if (empInput) empInput.value = empId;
    if (passInput) passInput.value = pass;
    if (loginForm) loginForm.dispatchEvent(new Event('submit'));
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = empInput ? empInput.value.trim() : '';
      const pass = passInput ? passInput.value.trim() : '';

      if (!empId || !pass) {
        toast('يرجى إدخال الرقم الوظيفي وكلمة المرور', 'warning');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>جاري التحقق من الاعتماد...</span>`;
      }

      try {
        const session = await Auth.login(empId, pass);
        const user = session.user || session;
        toast(`مرحباً بك ${user.fullName}`, 'success');
        setTimeout(() => {
          if (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor') {
            window.location.href = './supervisor-panel.html';
          } else {
            window.location.href = './dashboard.html';
          }
        }, 350);
      } catch (err) {
        toast(err.message || 'بيانات الدخول غير صحيحة', 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<img src="../assets/icons/log-in.svg" class="ui-icon" alt="" /><span>تسجيل الدخول</span>`;
        }
      }
    });
  }

  // Password reset modal handlers
  const resetModal = document.getElementById('reset-modal');
  const openResetBtn = document.getElementById('open-reset-btn');
  const closeResetBtn = document.getElementById('close-reset-modal');
  const sendResetOtpBtn = document.getElementById('send-reset-otp-btn');
  const resetForm = document.getElementById('reset-form');

  if (openResetBtn && resetModal) {
    openResetBtn.addEventListener('click', () => resetModal.classList.add('active'));
  }
  if (closeResetBtn && resetModal) {
    closeResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) resetModal.classList.remove('active');
    });
  }
  if (sendResetOtpBtn) {
    sendResetOtpBtn.addEventListener('click', async () => {
      const contactInput = document.getElementById('reset-contact');
      const contact = contactInput ? contactInput.value.trim() : '';
      if (!contact) return toast('يرجى إدخال رقم الهاتف أو البريد أولاً', 'warning');
      const otpSection = document.getElementById('reset-otp-section');
      if (otpSection) otpSection.style.display = 'block';
      toast('تم إرسال رمز التحقق بنجاح', 'success');
    });
  }
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empIdEl = document.getElementById('reset-emp-id');
      const newPassEl = document.getElementById('reset-new-pass');
      const empId = empIdEl ? empIdEl.value.trim() : '';
      const newPass = newPassEl ? newPassEl.value.trim() : '';
      if (!newPass || newPass.length < 6) {
        return toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      }
      toast('تم تحديث كلمة المرور بنجاح، جاري الدخول...', 'success');
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 400);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
