/**
 * ADCO Field Operations System - Toast Component
 * Single Responsibility: Floating toast notifications with auto-dismiss and accessibility
 */

export function showToast(message, type = 'info', duration = 3000) {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'circle-x' : type === 'warning' ? 'clock' : 'shield-check';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="ui-icon ui-icon-sm"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
    window.refreshIcons(toast);
  }

  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

