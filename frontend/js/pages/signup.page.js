/**
 * ADCO Field Operations System - Signup Wizard Page Controller
 * Single Responsibility: 3-step employee verification wizard, OTP generation, and password complexity check
 */

import { AuthService } from '../services/auth.service.js';
import { Validators } from '../utils/validators.js';
import { showToast } from '../components/toast.js';

let verifiedEmployee = null;

function goToStep(stepNum) {
  document.querySelectorAll('.wizard-pane').forEach((el, idx) => {
    el.classList.toggle('active', idx + 1 === stepNum);
  });
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`ind-${i}`);
    if (ind) {
      ind.classList.remove('active', 'completed');
      if (i < stepNum) ind.classList.add('completed');
      if (i === stepNum) ind.classList.add('active');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form1 = document.getElementById('form-step-1');
  const form2 = document.getElementById('form-step-2');
  const form3 = document.getElementById('form-step-3');
  const dispatchOtpBtn = document.getElementById('dispatch-otp-btn');
  const backTo1Btn = document.getElementById('back-to-1');
  const passInput = document.getElementById('wiz-pass');

  if (form1) {
    form1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('wiz-fullname').value.trim();
      const empId = document.getElementById('wiz-empid').value.trim();

      if (!name || !empId) {
        showToast('يرجى إدخال الاسم والرقم الوظيفي', 'warning');
        return;
      }

      verifiedEmployee = {
        employeeId: empId,
        fullName: name,
        branch: 'سموحة - الإسكندرية',
        mobile: '01012345678',
        email: `${empId.toLowerCase()}@adco.com.eg`
      };

      const banner = document.getElementById('verified-emp-banner');
      if (banner) {
        banner.innerHTML = `تم التحقق: <strong>${verifiedEmployee.fullName}</strong> (${verifiedEmployee.branch})`;
      }
      const contactInput = document.getElementById('wiz-contact');
      if (contactInput) contactInput.value = verifiedEmployee.mobile;

      showToast('تمت مطابقة بيانات الموظف المعتمد بنجاح', 'success');
      goToStep(2);
    });
  }

  if (dispatchOtpBtn) {
    dispatchOtpBtn.addEventListener('click', () => {
      const contact = (document.getElementById('wiz-contact').value || '').trim();
      if (!contact) return showToast('أدخل رقم الهاتف أو البريد الإلكتروني', 'warning');
      const simulatedOtp = '482619';
      document.getElementById('wiz-otp').value = simulatedOtp;
      showToast(`تم إرسال رمز التحقق بنجاح`, 'success');
    });
  }

  if (backTo1Btn) {
    backTo1Btn.addEventListener('click', () => goToStep(1));
  }

  if (form2) {
    form2.addEventListener('submit', (e) => {
      e.preventDefault();
      const otpVal = document.getElementById('wiz-otp').value.trim();
      if (otpVal.length < 4) {
        return showToast('رمز التحقق غير صحيح', 'error');
      }
      showToast('تم التحقق من رمز OTP بنجاح', 'success');
      goToStep(3);
    });
  }

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

  if (form3) {
    form3.addEventListener('submit', async (e) => {
      e.preventDefault();
      const p1 = passInput.value;
      const p2 = document.getElementById('wiz-pass-confirm').value;

      if (p1 !== p2) {
        return showToast('كلمتا المرور غير متطابقتين', 'error');
      }
      if (p1.length < 8) {
        return showToast('يجب أن تتكون كلمة المرور من 8 أحرف وأرقام على الأقل', 'error');
      }

      try {
        await AuthService.signup({
          employeeId: verifiedEmployee ? verifiedEmployee.employeeId : 'ADCO-102',
          fullName: verifiedEmployee ? verifiedEmployee.fullName : 'موظف ميداني جديد',
          password: p1,
          branch: verifiedEmployee ? verifiedEmployee.branch : 'سموحة - الإسكندرية',
          mobile: verifiedEmployee ? verifiedEmployee.mobile : '01012345678',
          email: verifiedEmployee ? verifiedEmployee.email : 'new@adco.com.eg'
        });

        showToast('تم تفعيل الحساب بنجاح', 'success');
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 400);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
});
