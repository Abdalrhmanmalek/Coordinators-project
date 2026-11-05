/**
 * ADCO Field Operations System - Profile Service
 * Single Responsibility: User profile updates, credentials modification, and password management
 */

import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';
import { AuthService } from './auth.service.js';

export class ProfileService {
  static async updateContactInfo(email, mobile) {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('المستخدم غير مسجل الدخول');

    try {
      await apiClient.put(API_ENDPOINTS.EMPLOYEES.UPDATE_CREDENTIALS, { email, mobile });
    } catch (_) {}

    AuthService.updateContactInfo(user.employeeId, email, mobile);
    return true;
  }

  static async changePassword(currentPassword, newPassword) {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('المستخدم غير مسجل الدخول');

    try {
      await apiClient.put(API_ENDPOINTS.EMPLOYEES.UPDATE_PASSWORD, {
        oldPassword: currentPassword,
        newPassword
      });
    } catch (_) {}

    return AuthService.updatePassword(user.employeeId, currentPassword, newPassword);
  }
}

if (typeof window !== 'undefined') {
  window.ProfileService = ProfileService;
}
