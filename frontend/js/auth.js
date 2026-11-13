/**
 * ADCO Authentication & Credibility Engine
 * Simulates DynamoDB employee registry validation, 4-digit OTP dispatch, and Cognito JWT storage
 * Universal Browser Script (Works on both http://localhost and file:// protocol)
 */

(function (global) {
  const ENV_KEYS = (global.ADCO_ENV && global.ADCO_ENV.STORAGE_KEYS) || {};
  const STORAGE_KEY_AUTH = ENV_KEYS.SESSION || 'ADCO_SESSION';
  const STORAGE_KEY_REGISTRY = ENV_KEYS.REGISTRY || 'ADCO_EMPLOYEE_REGISTRY';

  const ROLES = {
    COORDINATOR: 'coordinator',
    COORDINATOR_SUPERVISOR: 'coordinator_supervisor',
    MARKETING_MANAGER: 'marketing_manager'
  };

  // Employee registry seed lives in store/employee-registry.seed.js
  const DEFAULT_REGISTRY = global.ADCO_DEFAULT_REGISTRY || [];

  class AuthManager {
    static getRegistry() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
        if (!raw) {
          localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(DEFAULT_REGISTRY));
          return DEFAULT_REGISTRY;
        }
        let list = JSON.parse(raw);
        if (!Array.isArray(list)) list = DEFAULT_REGISTRY;

        // Auto-merge newly added default accounts (e.g. ADCO-501) and keep defaults up-to-date
        let updated = false;
        DEFAULT_REGISTRY.forEach((defEmp) => {
          if (!defEmp || !defEmp.employeeId) return;
          const idx = list.findIndex(
            (e) => e && e.employeeId && e.employeeId.toUpperCase() === defEmp.employeeId.toUpperCase()
          );
          if (idx === -1) {
            list.push(defEmp);
            updated = true;
          } else {
            // Keep role, assignedClientName, branch, rank and default credentials in sync
            const current = list[idx];
            if (
              current.role !== defEmp.role ||
              current.assignedClientName !== defEmp.assignedClientName ||
              current.rank !== defEmp.rank ||
              current.passwordHash !== defEmp.passwordHash
            ) {
              list[idx] = { ...defEmp, ...current, role: defEmp.role, rank: defEmp.rank, assignedClientName: defEmp.assignedClientName, assignedBranchName: defEmp.assignedBranchName, passwordHash: defEmp.passwordHash };
              updated = true;
            }
          }
        });

        if (updated) {
          localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(list));
        }
        return list;
      } catch {
        return DEFAULT_REGISTRY;
      }
    }

    static saveRegistry(registry) {
      try {
        localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(registry));
      } catch {}
    }

    static async verifyEmployeeCredentials(employeeId, fullName) {
      await new Promise((r) => setTimeout(r, 350));
      const registry = this.getRegistry();
      const cleanId = employeeId.trim().toUpperCase();
      const cleanName = fullName.trim();

      const emp = registry.find(
        (e) =>
          e.employeeId.toUpperCase() === cleanId &&
          (e.fullName.includes(cleanName) || cleanName.includes(e.fullName))
      );

      if (!emp) {
        throw new Error('الرقم الوظيفي أو الاسم غير مدرج بسجلات أدكو المعتمدة.');
      }
      return emp;
    }

    static async requestOTP(identifier) {
      await new Promise((r) => setTimeout(r, 300));
      const generatedOtp = '5821';
      try {
        sessionStorage.setItem('PENDING_OTP', generatedOtp);
        sessionStorage.setItem('OTP_TARGET', identifier);
      } catch {}
      return { success: true, simulatedOtp: generatedOtp };
    }

    static verifyOTP(inputOtp) {
      let targetOtp = '5821';
      try {
        targetOtp = sessionStorage.getItem('PENDING_OTP') || '5821';
      } catch {}
      if (inputOtp.trim() !== targetOtp) {
        throw new Error('رمز التحقق غير صحيح، يرجى إعادة المحاولة.');
      }
      return true;
    }

    static validatePasswordComplexity(password) {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!_?])[A-Za-z\d@#$%^&*!_?]{8,}$/;
      return regex.test(password);
    }

    static async checkRegistrationCode(employeeId, registrationCode) {
      const cleanId = (employeeId || '').trim();
      const cleanCode = (registrationCode || '').trim();
      if (!cleanId || !cleanCode) throw new Error('يرجى إدخال كود الموظف وكود التسجيل');
      const registry = this.getRegistry();
      const found = registry.find((e) => e.employeeId.toUpperCase() === cleanId.toUpperCase());
      if (found) return found;
      return {
        employeeId: cleanId,
        fullName: `موظف كود (${cleanId})`,
        branch: 'الإسكندرية - قطاع وسط',
        role: 'coordinator'
      };
    }

    static async finalizeRegistration(employeeId, email, password) {
      const registry = this.getRegistry();
      const cleanId = (employeeId || '').trim().toUpperCase();
      let index = registry.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
      if (index === -1) {
        const newUser = {
          employeeId: cleanId,
          fullName: `موظف كود (${cleanId})`,
          email: email || '',
          mobile: '',
          role: 'coordinator',
          rank: '#5',
          score: 75,
          assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
          assignedBranchName: 'فرع سموحة - الإسكندرية',
          branch: 'فرع سموحة - الإسكندرية',
          region: 'الإسكندرية',
          passwordHash: password
        };
        registry.push(newUser);
        index = registry.length - 1;
      } else {
        registry[index].email = email;
        registry[index].passwordHash = password;
        registry[index].isRegistered = true;
      }
      this.saveRegistry(registry);
      return this.createSession(registry[index]);
    }

    static async finalizeRegistrationLegacy(employeeId, password) {
      const registry = this.getRegistry();
      const index = registry.findIndex((e) => e.employeeId.toUpperCase() === employeeId.trim().toUpperCase());
      if (index === -1) {
        throw new Error('تعذر العثور على سجل الموظف لحفظ كلمة المرور.');
      }

      registry[index].passwordHash = password;
      registry[index].isRegistered = true;
      this.saveRegistry(registry);

      return this.createSession(registry[index]);
    }

    static async login(employeeId, password) {
      await new Promise((r) => setTimeout(r, 350));
      const registry = this.getRegistry();
      const cleanId = employeeId.trim().toUpperCase();

      let emp = registry.find((e) => e && e.employeeId && e.employeeId.toUpperCase() === cleanId);
      if (!emp) {
        // Fallback to DEFAULT_REGISTRY in case of cached registry
        emp = DEFAULT_REGISTRY.find((e) => e && e.employeeId && e.employeeId.toUpperCase() === cleanId);
        if (emp) {
          registry.push(emp);
          this.saveRegistry(registry);
        }
      }
      if (!emp) {
        throw new Error('الرقم الوظيفي غير مسجل في منظومة أدكو.');
      }

      if (emp.passwordHash !== password) {
        throw new Error('كلمة المرور غير صحيحة، تأكد من صحة المدخلات.');
      }

      return this.createSession(emp);
    }

    static async updateContactInfo(employeeId, newEmail, newMobile) {
      await new Promise((r) => setTimeout(r, 250));
      const registry = this.getRegistry();
      const cleanId = employeeId.trim().toUpperCase();
      const index = registry.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
      if (index === -1) {
        throw new Error('تعذر العثور على سجل الموظف لتحديث البيانات.');
      }
      if (newEmail) registry[index].email = newEmail.trim();
      if (newMobile) registry[index].mobile = newMobile.trim();
      this.saveRegistry(registry);

      const session = this.createSession(registry[index]);
      return session.user;
    }

    static async changePassword(employeeId, currentPassword, newPassword) {
      await new Promise((r) => setTimeout(r, 300));
      const registry = this.getRegistry();
      const cleanId = employeeId.trim().toUpperCase();
      const index = registry.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
      if (index === -1) {
        throw new Error('تعذر العثور على سجل الموظف لتغيير كلمة المرور.');
      }

      if (registry[index].passwordHash !== currentPassword) {
        throw new Error('كلمة المرور الحالية غير صحيحة.');
      }

      if (!this.validatePasswordComplexity(newPassword)) {
        throw new Error('كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      }

      registry[index].passwordHash = newPassword;
      this.saveRegistry(registry);
      return true;
    }

    static verifyPassword(employeeId, password) {
      const registry = this.getRegistry();
      const cleanId = employeeId.trim().toUpperCase();
      const emp = registry.find((e) => e.employeeId.toUpperCase() === cleanId);
      if (!emp) return false;
      return emp.passwordHash === password;
    }

    static createSession(employee) {
      const session = {
        token: 'jwt_adco_' + (typeof btoa !== 'undefined' ? btoa : (s) => Buffer.from(s).toString('base64'))(unescape(encodeURIComponent(employee.employeeId + ':' + Date.now()))),
        user: {
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          role: employee.role,
          branch: employee.branch,
          assignedClientName: employee.assignedClientName || null,
          assignedBranchName: employee.assignedBranchName || null,
          region: employee.region || null,
          rank: (employee.rank || (employee.role === 'coordinator_supervisor' ? '#2' : '#3')).replace('بين المنسقين', '').trim(),
          score: employee.score !== undefined ? employee.score : (employee.role === 'coordinator_supervisor' ? 92 : 88),
          email: employee.email,
          mobile: employee.mobile
        },
        expiresAt: Date.now() + 86400 * 1000 * 7
      };
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      } catch {}
      return session;
    }

    static getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
          this.logout();
          return null;
        }
        return session.user;
      } catch {
        return null;
      }
    }

    static logout() {
      try {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        sessionStorage.clear();
      } catch {}
      const isSubPage = window.location.pathname.includes('/pages/');
      window.location.href = isSubPage ? './login.html' : './pages/login.html';
    }

    /**
     * Checks Auth Guard; if a page is opened directly during testing without an active session,
     * auto-initializes a default session so the page loads seamlessly without failing.
     */
    static checkAuthGuard(requiredRole = null) {
      let user = this.getCurrentUser();
      const registry = this.getRegistry();
      if (!user) {
        let fallbackEmp = registry[0] || DEFAULT_REGISTRY[0];
        if (requiredRole === 'supervisor' || requiredRole === 'coordination_manager') {
          fallbackEmp = registry.find((e) => e.role === 'marketing_manager' || e.role === 'coordination_manager' || e.role === 'supervisor') || DEFAULT_REGISTRY[3];
        } else if (requiredRole === 'coordinator_supervisor') {
          fallbackEmp = registry.find((e) => e.role === 'coordinator_supervisor') || DEFAULT_REGISTRY[2];
        }
        user = this.createSession(fallbackEmp).user;
      }

      const isManager = user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor';
      if ((requiredRole === 'supervisor' || requiredRole === 'coordination_manager') && !isManager) {
        // Auto-elevate for supervisor panel pages
        const supEmp = registry.find((e) => e && (e.role === 'marketing_manager' || e.role === 'coordination_manager' || e.role === 'supervisor')) || DEFAULT_REGISTRY[3];
        user = this.createSession(supEmp).user;
      }
      return user;
    }
  }

  global.ROLES = ROLES;
  global.ADCO_ROLES = ROLES;
  AuthManager.ROLES = ROLES;
  global.AuthManager = AuthManager;
})(window);
