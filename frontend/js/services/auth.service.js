/**
 * ADCO Field Operations System - Authentication Service
 * Single Responsibility: 3-Tier user authentication, session persistence,
 * employee registry validation, password verification, contact updates, and role switching.
 */

import { STORAGE_KEYS, ROLES } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';

export const DEFAULT_EMPLOYEE_REGISTRY = [
  {
    employeeId: 'ADCO-101',
    fullName: 'أحمد محمود العبد',
    mobile: '01012345678',
    email: 'ahmed.m@adco.com.eg',
    role: 'coordinator',
    rank: '#3',
    score: 88,
    assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
    assignedBranchName: 'فرع سموحة - الإسكندرية',
    branch: 'فرع سموحة - الإسكندرية',
    region: 'الإسكندرية',
    passwordHash: 'Pass@1234'
  },
  {
    employeeId: 'ADCO-102',
    fullName: 'سارة طارق إبراهيم',
    mobile: '01198765432',
    email: 'sara.t@adco.com.eg',
    role: 'coordinator',
    rank: '#1',
    score: 96,
    assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
    assignedBranchName: 'فرع لوران - الكورنيش',
    branch: 'فرع لوران - الكورنيش',
    region: 'الإسكندرية',
    passwordHash: 'Pass@1234'
  },
  {
    employeeId: 'ADCO-501',
    fullName: 'أيمن عبد الرحمن الروبي',
    mobile: '01055566677',
    email: 'ayman.r@adco.com.eg',
    role: 'coordinator_supervisor',
    rank: '#2',
    score: 92,
    assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
    assignedBranchName: null,
    region: 'الإسكندرية',
    branch: 'مسؤول فروع فتح الله جملة ماركت - الإسكندرية',
    passwordHash: 'Super@2026'
  },
  {
    employeeId: 'ADCO-901',
    fullName: 'م. حسام الدين غانم',
    mobile: '01234567890',
    email: 'hossam.g@adco.com.eg',
    role: 'marketing_manager',
    rank: 'مسؤول التسويق',
    score: 100,
    assignedClientName: null,
    assignedBranchName: null,
    region: 'الجمهورية (إشراف عام)',
    branch: 'المقر الرئيسي - برج العرب',
    passwordHash: 'Admin@2026'
  }
];

export class AuthService {
  static getRegistry() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REGISTRY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(DEFAULT_EMPLOYEE_REGISTRY));
        return DEFAULT_EMPLOYEE_REGISTRY;
      }
      let list = JSON.parse(raw);
      if (!Array.isArray(list)) list = DEFAULT_EMPLOYEE_REGISTRY;

      // Auto-merge newly added default accounts
      let updated = false;
      DEFAULT_EMPLOYEE_REGISTRY.forEach((defEmp) => {
        const idx = list.findIndex(
          (e) => e.employeeId && e.employeeId.toUpperCase() === defEmp.employeeId.toUpperCase()
        );
        if (idx === -1) {
          list.push(defEmp);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(list));
      }
      return list;
    } catch {
      return DEFAULT_EMPLOYEE_REGISTRY;
    }
  }

  static saveRegistry(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(list));
    } catch (_) {}
  }

  static getCurrentUser() {
    try {
      const sess = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!sess) return null;
      return JSON.parse(sess);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user, remember = true) {
    const data = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, data);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, data);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static async login(employeeId, password, remember = true) {
    const cleanId = (employeeId || '').trim().toUpperCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error('يرجى إدخال الرقم الوظيفي وكلمة المرور');
    }

    // Attempt remote backend login first
    try {
      const resp = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        employeeId: cleanId,
        password: cleanPass
      });
      if (resp && resp.user) {
        apiClient.setTokens(resp.accessToken, resp.refreshToken);
        this.setCurrentUser(resp.user, remember);
        return resp.user;
      }
    } catch (apiErr) {
      // If server is unreachable or offline, fall back to local registry validation
      console.warn('Backend login unavailable, falling back to local registry:', apiErr.message);
    }

    const registry = this.getRegistry();
    const user = registry.find((e) => e.employeeId.toUpperCase() === cleanId);

    if (!user) {
      throw new Error('الرقم الوظيفي غير مسجل في منظومة أدكو.');
    }

    if (user.passwordHash && user.passwordHash !== cleanPass) {
      throw new Error('كلمة المرور غير صحيحة.');
    }

    // Set in-memory mock token
    const mockToken = `mock-jwt-${user.employeeId}-${Date.now()}`;
    apiClient.setTokens(mockToken);
    this.setCurrentUser(user, remember);
    return user;
  }

  static async checkRegistrationCode(employeeId, registrationCode) {
    const cleanId = (employeeId || '').trim();
    const cleanCode = (registrationCode || '').trim();
    if (!cleanId || !cleanCode) {
      throw new Error('يرجى إدخال كود الموظف وكود التسجيل');
    }

    // Call backend check endpoint (note: talks to a not-yet-live endpoint; falls back to local registry)
    try {
      const resp = await apiClient.post(API_ENDPOINTS.AUTH.CHECK_REGISTRATION_CODE, {
        employeeId: cleanId,
        registrationCode: cleanCode
      });
      if (resp && resp.employee) return resp.employee;
    } catch (apiErr) {
      // Fallback for offline/mock development
    }

    const registry = this.getRegistry();
    const found = registry.find((e) => e.employeeId.toUpperCase() === cleanId.toUpperCase());
    if (found) {
      return found;
    }
    return {
      employeeId: cleanId,
      fullName: `موظف كود (${cleanId})`,
      branch: 'الإسكندرية - قطاع وسط',
      role: 'coordinator'
    };
  }

  static validatePasswordComplexity(pass) {
    if (!pass || pass.length < 8) return false;
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNum = /\d/.test(pass);
    const hasSym = /[@#$%^&*!_?]/.test(pass);
    return hasLower && hasUpper && hasNum && hasSym;
  }

  static async finalizeRegistration(employeeId, email, password) {
    const cleanId = (employeeId || '').trim();
    const cleanEmail = (email || '').trim();
    const cleanPass = (password || '').trim();

    try {
      const resp = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        employeeId: cleanId,
        email: cleanEmail,
        password: cleanPass
      });
      if (resp && resp.user) {
        apiClient.setTokens(resp.accessToken);
        this.setCurrentUser(resp.user, true);
        return resp.user;
      }
    } catch (_) {
      // Backend not yet live, save locally
    }

    const registry = this.getRegistry();
    let user = registry.find((e) => e.employeeId.toUpperCase() === cleanId.toUpperCase());
    if (user) {
      user.email = cleanEmail;
      user.passwordHash = cleanPass;
    } else {
      user = {
        employeeId: cleanId,
        fullName: `موظف كود (${cleanId})`,
        email: cleanEmail,
        mobile: '',
        role: 'coordinator',
        rank: '#5',
        score: 75,
        assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
        assignedBranchName: 'فرع سموحة - الإسكندرية',
        branch: 'فرع سموحة - الإسكندرية',
        region: 'الإسكندرية',
        passwordHash: cleanPass
      };
      registry.push(user);
    }
    this.saveRegistry(registry);
    const mockToken = `mock-jwt-${cleanId}-${Date.now()}`;
    apiClient.setTokens(mockToken);
    this.setCurrentUser(user, true);
    return user;
  }

  static async signup(wizardPayload) {
    try {
      const resp = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, wizardPayload);
      if (resp && resp.user) {
        apiClient.setTokens(resp.accessToken, resp.refreshToken);
        this.setCurrentUser(resp.user, true);
        return resp.user;
      }
    } catch (_) {}

    const registry = this.getRegistry();
    const empId = wizardPayload.employeeId || `ADCO-${Math.floor(100 + Math.random() * 899)}`;
    const newUser = {
      employeeId: empId,
      fullName: wizardPayload.fullName || 'منسق جديد',
      mobile: wizardPayload.mobile || '',
      email: wizardPayload.email || '',
      role: wizardPayload.role || 'coordinator',
      rank: '#5',
      score: 75,
      assignedClientName: wizardPayload.assignedClientName || 'فتح الله جملة ماركت (Fathalla)',
      assignedBranchName: wizardPayload.assignedBranchName || wizardPayload.branch || 'فرع سموحة - الإسكندرية',
      branch: wizardPayload.branch || 'فرع سموحة - الإسكندرية',
      region: wizardPayload.region || 'الإسكندرية',
      passwordHash: wizardPayload.password || 'Pass@1234'
    };

    registry.push(newUser);
    this.saveRegistry(registry);
    this.setCurrentUser(newUser, true);
    return newUser;
  }

  static verifyPassword(employeeId, password) {
    const registry = this.getRegistry();
    const user = registry.find((e) => e.employeeId.toUpperCase() === (employeeId || '').toUpperCase());
    if (!user) return false;
    return user.passwordHash === password;
  }

  static async updateContactInfo(employeeId, email, mobile) {
    try {
      await apiClient.put(API_ENDPOINTS.EMPLOYEES.UPDATE_CREDENTIALS, { email, mobile });
    } catch (_) {}

    const registry = this.getRegistry();
    const user = registry.find((e) => e.employeeId.toUpperCase() === (employeeId || '').toUpperCase());
    if (user) {
      if (email) user.email = email;
      if (mobile) user.mobile = mobile;
      this.saveRegistry(registry);
      const curr = this.getCurrentUser();
      if (curr && curr.employeeId.toUpperCase() === user.employeeId.toUpperCase()) {
        curr.email = user.email;
        curr.mobile = user.mobile;
        this.setCurrentUser(curr);
      }
      return true;
    }
    return false;
  }

  static async updatePassword(employeeId, oldPassword, newPassword) {
    if (!this.verifyPassword(employeeId, oldPassword)) {
      return false;
    }
    try {
      await apiClient.put(API_ENDPOINTS.EMPLOYEES.UPDATE_PASSWORD, { oldPassword, newPassword });
    } catch (_) {}

    const registry = this.getRegistry();
    const user = registry.find((e) => e.employeeId.toUpperCase() === (employeeId || '').toUpperCase());
    if (user) {
      user.passwordHash = newPassword;
      this.saveRegistry(registry);
      return true;
    }
    return false;
  }

  static switchRole(targetRoleOrId) {
    const registry = this.getRegistry();
    let targetUser = null;

    if (targetRoleOrId === 'coordinator' || targetRoleOrId === 'ADCO-101') {
      targetUser = registry.find((e) => e.employeeId === 'ADCO-101') || registry.find((e) => e.role === 'coordinator');
    } else if (targetRoleOrId === 'coordinator_supervisor' || targetRoleOrId === 'ADCO-501') {
      targetUser = registry.find((e) => e.employeeId === 'ADCO-501') || registry.find((e) => e.role === 'coordinator_supervisor');
    } else if (targetRoleOrId === 'marketing_manager' || targetRoleOrId === 'ADCO-901') {
      targetUser = registry.find((e) => e.employeeId === 'ADCO-901') || registry.find((e) => e.role === 'marketing_manager');
    }

    if (targetUser) {
      this.setCurrentUser(targetUser, true);
      const isSub = window.location.pathname.includes('/pages/');
      const prefix = isSub ? './' : './pages/';
      if (targetUser.role === 'marketing_manager') {
        window.location.href = `${prefix}supervisor-panel.html`;
      } else {
        window.location.href = `${prefix}dashboard.html`;
      }
    }
  }

  static checkAuthGuard() {
    const user = this.getCurrentUser();
    if (!user) {
      const isSub = window.location.pathname.includes('/pages/');
      window.location.href = isSub ? './login.html' : './pages/login.html';
      return null;
    }
    return user;
  }

  static logout() {
    apiClient.clearTokens();
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    const isSub = window.location.pathname.includes('/pages/');
    window.location.href = isSub ? './login.html' : './pages/login.html';
  }
}

if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
  window.AuthManager = AuthService;
}
