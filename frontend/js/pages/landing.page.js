/**
 * ADCO Field Operations System - landing.page.js
 * Single Responsibility: Isolated DOM rendering and active session resumption button
 * Universal browser script (Works on both http:// and file:// protocol)
 */

(function (global) {
  if (global.AppRouter && typeof global.AppRouter.cleanupLegacyCaches === 'function') {
    global.AppRouter.cleanupLegacyCaches();
    global.AppRouter.registerServiceWorker();
  }

  const Auth = global.AuthManager || global.AuthService;
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
        <img src="./assets/icons/layout-dashboard.svg" class="ui-icon ui-icon-sm" alt="" />
        <span>متابعة الجلسة النشطة (${currentUser.fullName})</span>
      `;
      card.appendChild(resumeBtn);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
