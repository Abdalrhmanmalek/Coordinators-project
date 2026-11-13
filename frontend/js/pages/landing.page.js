/**
 * ADCO Field Operations System - landing.page.js
 * Single Responsibility: Isolated DOM rendering, 3-Tier Fast Login handler, and active session resumption button
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
  if (global.AppRouter && typeof global.AppRouter.cleanupLegacyCaches === 'function') {
    global.AppRouter.cleanupLegacyCaches();
    global.AppRouter.registerServiceWorker();
  }

  const Auth = global.AuthManager || global.AuthService;
  const toast = global.showToast || alert;

  global.fastLandingLogin = async function (empId, pass) {
    if (!Auth || typeof Auth.login !== 'function') {
      window.location.href = './pages/login.html';
      return;
    }
    try {
      const session = await Auth.login(empId, pass);
      const user = session.user || session;
      toast(`مرحباً بك ${user.fullName}`, 'success');
      setTimeout(() => {
        if (user.role === 'marketing_manager') {
          window.location.href = './pages/supervisor-panel.html';
        } else {
          window.location.href = './pages/dashboard.html';
        }
      }, 280);
    } catch (err) {
      toast(err.message || 'تعذر تسجيل الدخول السريع', 'error');
    }
  };

  const currentUser = Auth ? Auth.getCurrentUser() : null;

  if (currentUser) {
    const card = document.querySelector('.landing-card');
    if (card) {
      const isManager = currentUser.role === 'marketing_manager' || currentUser.role === 'supervisor';
      const targetPage = isManager ? './pages/supervisor-panel.html' : './pages/dashboard.html';

      const resumeBtn = document.createElement('a');
      resumeBtn.href = targetPage;
      resumeBtn.className = 'btn btn-outline';
      resumeBtn.style.marginTop = '12px';
      resumeBtn.innerHTML = `
        <i data-lucide="layout-dashboard" class="ui-icon ui-icon-sm"></i>
        <span>متابعة الجلسة النشطة (${currentUser.fullName})</span>
      `;
      card.appendChild(resumeBtn);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
