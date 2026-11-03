/**
 * ADCO Field Operations System - Login Page Controller
 * Single Responsibility: Handling login credentials input, role routing, and remember me preferences
 */

import { AuthService } from '../services/auth.service.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const employeeInput = document.getElementById('employeeId');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');

  // Check if already authenticated
  const currentUser = AuthService.getCurrentUser();
  if (currentUser) {
    window.location.href = currentUser.role === 'supervisor' ? './supervisor-panel.html' : './dashboard.html';
    return;
  }

  // Pre-fill remembered ID if present
  const rememberedId = localStorage.getItem('ADCO_REMEMBERED_ID');
  if (rememberedId && employeeInput) {
    employeeInput.value = rememberedId;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = employeeInput.value.trim();
      const pass = passwordInput.value;

      if (!empId || !pass) {
        showToast('يرجى إدخال الرقم الوظيفي وكلمة المرور', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>جاري التحقق والدخول...</span>`;
      }

      try {
        const user = await AuthService.login(empId, pass);
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem('ADCO_REMEMBERED_ID', empId);
        }

        showToast(`مرحباً بك، ${user.fullName}`, 'success');
        setTimeout(() => {
          window.location.href = user.role === 'supervisor' ? './supervisor-panel.html' : './dashboard.html';
        }, 350);
      } catch (err) {
        showToast(err.message || 'بيانات الدخول غير صحيحة', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>تسجيل الدخول</span>`;
        }
      }
    });
  }
});
