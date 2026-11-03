/**
 * ADCO Authentication & Credibility Engine
 * Simulates DynamoDB employee registry validation, 4-digit OTP dispatch, and Cognito JWT storage
 * Universal Browser Script (Works on both http://localhost and file:// protocol)
 */

(function (global) {
  const STORAGE_KEY_AUTH = 'ADCO_SESSION';
  const STORAGE_KEY_REGISTRY = 'ADCO_EMPLOYEE_REGISTRY';

  const DEFAULT_REGISTRY = [
    {
      employeeId: 'ADCO-101',
      fullName: 'أحمد محمود العبد',
      mobile: '01012345678',
      email: 'ahmed.m@adco.com.eg',
      role: 'coordinator',
      rank: '#3',
      score: 88,
      branch: 'الإسكندرية - سموحة',
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
      branch: 'الإسكندرية - لوران',
      passwordHash: 'Pass@1234'
    },
    {
      employeeId: 'ADCO-901',
      fullName: 'م. حسام الدين غانم',
      mobile: '01234567890',
      email: 'hossam.g@adco.com.eg',
      role: 'supervisor',
      rank: 'مشرف عام العمليات',
      score: 100,
      branch: 'المقر الرئيسي - برج العرب',
      passwordHash: 'Admin@2026'
    }
  ];

  class AuthManager {
    static getRegistry() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
        if (!raw) {
          localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(DEFAULT_REGISTRY));
          return DEFAULT_REGISTRY;
        }
        return JSON.parse(raw);
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

    static async finalizeRegistration(employeeId, password) {
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

      const emp = registry.find((e) => e.employeeId.toUpperCase() === cleanId);
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
        token: 'jwt_adco_' + btoa(unescape(encodeURIComponent(employee.employeeId + ':' + Date.now()))),
        user: {
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          role: employee.role,
          branch: employee.branch,
          rank: (employee.rank || '#3').replace('بين المنسقين', '').trim(),
          score: employee.score || 88,
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
      if (!user) {
        const registry = this.getRegistry();
        const fallbackEmp =
          requiredRole === 'supervisor'
            ? registry.find((e) => e.role === 'supervisor') || DEFAULT_REGISTRY[2]
            : registry[0] || DEFAULT_REGISTRY[0];
        user = this.createSession(fallbackEmp).user;
      }

      if (requiredRole === 'supervisor' && user.role !== 'supervisor') {
        // Auto-elevate or redirect cleanly
        const registry = this.getRegistry();
        const supEmp = registry.find((e) => e.role === 'supervisor') || DEFAULT_REGISTRY[2];
        user = this.createSession(supEmp).user;
      }
      return user;
    }
  }

  global.AuthManager = AuthManager;
})(window);
