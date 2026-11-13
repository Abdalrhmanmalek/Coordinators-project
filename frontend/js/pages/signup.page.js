/**
 * ADCO Field Operations System - signup.page.js
 * Single Responsibility: 2-Step Employee Account Activation Controller
 * Step 1: Employee code + one-time admin registration code verification
 * Step 2: Email and password assignment
 */

(function (global) {
  const AuthManager = global.AuthManager || global.AuthService;
  const showToast = global.showToast || alert;
  let verifiedEmployee = null;

  function goToStep(stepNum) {
    document.querySelectorAll('.wizard-pane').forEach((el, idx) => {
      el.classList.toggle('active', idx + 1 === stepNum);
    });
    for (let i = 1; i <= 2; i++) {
      const ind = document.getElementById(`ind-${i}`);
      if (ind) {
        ind.classList.remove('active', 'completed');
        if (i < stepNum) ind.classList.add('completed');
        if (i === stepNum) ind.classList.add('active');
      }
    }
  }

  // STEP 1: Check Employee Code & One-Time Admin Registration Code
  const formStep1 = document.getElementById('form-step-1');
  if (formStep1) {
    formStep1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = (document.getElementById('wiz-empid').value || '').trim();
      const regCode = (document.getElementById('wiz-regcode').value || '').trim();

      if (!empId || !regCode) {
        return showToast('يرجى إدخال كود الموظف وكود التسجيل', 'warning');
      }

      const btn = document.getElementById('btn-check-reg');
      if (btn) btn.disabled = true;

      try {
        // Calls backend check endpoint (/auth/check-registration-code or /auth/check)
        verifiedEmployee = await AuthManager.checkRegistrationCode(empId, regCode);
        const banner = document.getElementById('verified-emp-banner');
        if (banner) {
          banner.innerHTML = `تم التحقق بنجاح من الموظف: <strong>${verifiedEmployee.fullName}</strong> (${verifiedEmployee.branch || 'الفرع المسجل'})`;
        }
        const emailInput = document.getElementById('wiz-email');
        if (emailInput && verifiedEmployee.email) {
          emailInput.value = verifiedEmployee.email;
        }
        showToast('تم التحقق من الكود بنجاح، يرجى تعيين البريد وكلمة المرور', 'success');
        goToStep(2);
      } catch (err) {
        showToast(err.message || 'كود الموظف أو كود التسجيل غير صحيح', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  const backBtn = document.getElementById('back-to-1');
  if (backBtn) {
    backBtn.addEventListener('click', () => goToStep(1));
  }

  // Real-time password complexity checklist
  const passInput = document.getElementById('wiz-pass');
  if (passInput) {
    passInput.addEventListener('input', () => {
      const v = passInput.value;
      const updateRule = (id, ok) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('valid', ok);
      };
      updateRule('rule-len', v.length >= 8);
      updateRule('rule-case', /[a-z]/.test(v) && /[A-Z]/.test(v));
      updateRule('rule-num', /\d/.test(v));
      updateRule('rule-sym', /[@#$%^&*!_?]/.test(v));
    });
  }

  // STEP 2: Finalize email and password
  const formStep2 = document.getElementById('form-step-2');
  if (formStep2) {
    formStep2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('wiz-email').value || '').trim();
      const p1 = passInput ? passInput.value : '';
      const p2 = document.getElementById('wiz-pass-confirm') ? document.getElementById('wiz-pass-confirm').value : '';

      if (!email) {
        return showToast('يرجى إدخال البريد الإلكتروني الرسمي', 'warning');
      }
      if (p1 !== p2) {
        return showToast('كلمتا المرور غير متطابقتين', 'error');
      }
      if (typeof AuthManager.validatePasswordComplexity === 'function' && !AuthManager.validatePasswordComplexity(p1)) {
        return showToast('يرجى استيفاء جميع شروط قوة كلمة المرور (8 أحرف، كابيتال وسمول، رقم، رمز)', 'error');
      } else if (p1.length < 8) {
        return showToast('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل', 'error');
      }

      try {
        const empCode = verifiedEmployee ? verifiedEmployee.employeeId : (document.getElementById('wiz-empid').value || '').trim();
        await AuthManager.finalizeRegistration(empCode, email, p1);
        showToast('تم تفعيل الحساب بنجاح، جاري التوجيه...', 'success');
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 400);
      } catch (err) {
        showToast(err.message || 'حدث خطأ أثناء تفعيل الحساب', 'error');
      }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
