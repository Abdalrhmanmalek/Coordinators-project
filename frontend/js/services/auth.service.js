/**
 * ADCO Field Operations System - Auth Service
 * Single Responsibility: Authentication, session management, role guards, and credentials
 */

import { STORAGE_KEYS, ROLES } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';

export class AuthService {
  static getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static checkAuthGuard(requiredRole = null) {
    const user = this.getCurrentUser();
    const isSubPage = window.location.pathname.includes('/pages/');
    const loginUrl = isSubPage ? './login.html' : './pages/login.html';

    if (!user) {
      window.location.href = loginUrl;
      return null;
    }

    if (requiredRole && user.role !== requiredRole) {
      const targetUrl = user.role === ROLES.SUPERVISOR
        ? (isSubPage ? './supervisor-panel.html' : './pages/supervisor-panel.html')
        : (isSubPage ? './dashboard.html' : './pages/dashboard.html');
      window.location.href = targetUrl;
      return null;
    }

    return user;
  }

  static async login(employeeId, password) {
    const cleanId = String(employeeId).trim().toUpperCase();
    const isSupervisor = cleanId.includes('901') || cleanId.includes('SUP');

    // Attempt backend API call if live
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { employeeId: cleanId, password });
      if (res && res.user) {
        if (res.accessToken) apiClient.setTokens(res.accessToken, res.refreshToken);
        this.setCurrentUser(res.user);
        return res.user;
      }
    } catch (_) {
      // Clean preview fallback adapter for offline / static hosting preview
    }

    const mockUser = {
      employeeId: cleanId,
      fullName: isSupervisor ? 'م. هاني شاكر عبد الله' : 'أحمد محمود إبراهيم',
      role: isSupervisor ? ROLES.SUPERVISOR : ROLES.COORDINATOR,
      branch: 'سموحة - الإسكندرية',
      mobile: isSupervisor ? '01099887766' : '01012345678',
      email: isSupervisor ? 'hani.shaker@adco.com.eg' : 'ahmed.mahmoud@adco.com.eg',
      rank: isSupervisor ? null : '#1'
    };

    this.setCurrentUser(mockUser);
    return mockUser;
  }

  static async signup(payload) {
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, payload);
      if (res && res.user) {
        if (res.accessToken) apiClient.setTokens(res.accessToken, res.refreshToken);
        this.setCurrentUser(res.user);
        return res.user;
      }
    } catch (_) {}

    const mockUser = {
      employeeId: payload.employeeId || 'ADCO-102',
      fullName: payload.fullName,
      role: ROLES.COORDINATOR,
      branch: payload.branch || 'سموحة - الإسكندرية',
      mobile: payload.mobile,
      email: payload.email,
      rank: '#5'
    };
    this.setCurrentUser(mockUser);
    return mockUser;
  }

  static logout() {
    apiClient.clearTokens();
    this.setCurrentUser(null);
    const isSubPage = window.location.pathname.includes('/pages/');
    window.location.href = isSubPage ? './login.html' : './pages/login.html';
  }

  static switchRole(newRole) {
    const curr = this.getCurrentUser();
    if (!curr) return;
    const isSupervisor = newRole === ROLES.SUPERVISOR;
    const switched = {
      ...curr,
      role: newRole,
      employeeId: isSupervisor ? 'ADCO-901' : 'ADCO-101',
      fullName: isSupervisor ? 'م. هاني شاكر عبد الله' : 'أحمد محمود إبراهيم',
      email: isSupervisor ? 'hani.shaker@adco.com.eg' : 'ahmed.mahmoud@adco.com.eg',
      mobile: isSupervisor ? '01099887766' : '01012345678',
      rank: isSupervisor ? null : '#1'
    };
    this.setCurrentUser(switched);
    const isSubPage = window.location.pathname.includes('/pages/');
    window.location.href = isSupervisor
      ? (isSubPage ? './supervisor-panel.html' : './pages/supervisor-panel.html')
      : (isSubPage ? './dashboard.html' : './pages/dashboard.html');
  }

  static verifyPassword(employeeId, password) {
    return password && password.length >= 6;
  }

  static updateContactInfo(employeeId, newEmail, newMobile) {
    const user = this.getCurrentUser();
    if (user && user.employeeId === employeeId) {
      user.email = newEmail;
      user.mobile = newMobile;
      this.setCurrentUser(user);
    }
  }

  static updatePassword(employeeId, currPassword, newPassword) {
    return newPassword && newPassword.length >= 6;
  }
}

// Global alias for compatibility
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
  window.AuthManager = AuthService;
}
