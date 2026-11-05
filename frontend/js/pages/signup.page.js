/**
 * ADCO Field Operations System - signup.page.js
 * Single Responsibility: Isolated DOM rendering and page event controller
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
let verifiedEmployee = null;

    function goToStep(stepNum) {
      document.querySelectorAll('.wizard-pane').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === stepNum);
      });
      for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`ind-${i}`);
        ind.classList.remove('active', 'completed');
        if (i < stepNum) ind.classList.add('completed');
        if (i === stepNum) ind.classList.add('active');
      }
    }

    document.getElementById('form-step-1').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('wiz-fullname').value;
      const empId = document.getElementById('wiz-empid').value;

      try {
        verifiedEmployee = await AuthManager.verifyEmployeeCredentials(empId, name);
        document.getElementById('verified-emp-banner').innerHTML =
          `تم التحقق: <strong>${verifiedEmployee.fullName}</strong> (${verifiedEmployee.branch})`;
        document.getElementById('wiz-contact').value = verifiedEmployee.mobile;
        showToast('تمت مطابقة بيانات الموظف المعتمد بنجاح', 'success');
        goToStep(2);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('dispatch-otp-btn').addEventListener('click', async () => {
      const contact = document.getElementById('wiz-contact').value.trim();
      if (!contact) return showToast('أدخل رقم الهاتف أو البريد الإلكتروني', 'warning');
      const res = await AuthManager.requestOTP(contact);
      document.getElementById('wiz-otp').value = res.simulatedOtp;
      showToast(`تم إرسال رمز التحقق بنجاح`, 'success');
    });

    document.getElementById('back-to-1').addEventListener('click', () => goToStep(1));

    document.getElementById('form-step-2').addEventListener('submit', (e) => {
      e.preventDefault();
      const otpInput = document.getElementById('wiz-otp').value;
      try {
        AuthManager.verifyOTP(otpInput);
        showToast('تم التحقق من رمز OTP بنجاح', 'success');
        goToStep(3);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    const passInput = document.getElementById('wiz-pass');
    passInput.addEventListener('input', () => {
      const v = passInput.value;
      const updateRule = (id, ok) => {
        const el = document.getElementById(id);
        el.classList.toggle('valid', ok);
      };
      updateRule('rule-len', v.length >= 8);
      updateRule('rule-case', /[a-z]/.test(v) && /[A-Z]/.test(v));
      updateRule('rule-num', /\d/.test(v));
      updateRule('rule-sym', /[@#$%^&*!_?]/.test(v));
    });

    document.getElementById('form-step-3').addEventListener('submit', async (e) => {
      e.preventDefault();
      const p1 = passInput.value;
      const p2 = document.getElementById('wiz-pass-confirm').value;

      if (p1 !== p2) {
        return showToast('كلمتا المرور غير متطابقتين', 'error');
      }
      if (!AuthManager.validatePasswordComplexity(p1)) {
        return showToast('يرجى استيفاء جميع شروط قوة كلمة المرور.', 'error');
      }

      try {
        await AuthManager.finalizeRegistration(verifiedEmployee.employeeId, p1);
        showToast('تم تفعيل الحساب وتوثيق الجلسة بنجاح', 'success');
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 400);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
})(typeof window !== 'undefined' ? window : globalThis);
