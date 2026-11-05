/**
 * ADCO Field Operations System - Input Validators
 * Single Responsibility: Pure validation rules, regex patterns, and DTO schema verification
 */

export class Validators {
  /**
   * Validates Egyptian national mobile number (010, 011, 012, 015)
   */
  static isValidEgyptianPhone(phone) {
    if (!phone) return false;
    const clean = String(phone).replace(/\s+/g, '').replace(/^(\+20|0020)/, '0');
    return /^01[0125]\d{8}$/.test(clean);
  }

  /**
   * Validates ADCO corporate Employee ID (e.g., ADCO-101, ADCO-501, ADCO-901)
   */
  static isValidEmployeeId(id) {
    if (!id) return false;
    return /^ADCO-\d{3,5}$/i.test(String(id).trim());
  }

  /**
   * Validates Email format
   */
  static isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  /**
   * Validates Password complexity: minimum 6 characters
   */
  static isStrongPassword(password) {
    if (!password) return false;
    return password.length >= 6;
  }

  /**
   * Validates Activity Creation Payload DTO
   */
  static validateActivityPayload(payload) {
    const errors = [];
    if (!payload.coordinatorId) errors.push('الرقم الوظيفي للمنسق مطلوب');
    if (!payload.client || !payload.client.trim()) errors.push('اسم العميل مطلوب');
    if (!payload.branch || !payload.branch.trim()) errors.push('فرع العميل مطلوب');
    if (!payload.coordinatorBranch || !payload.coordinatorBranch.trim()) errors.push('فرع الشركة (Branch) مطلوب');
    if (!payload.activity || !payload.activity.trim()) errors.push('نوع النشاط مطلوب');
    if (!payload.activityType || !payload.activityType.trim()) errors.push('تصنيف النشاط مطلوب');

    // 4-Level Products or Brands validation
    const hasProducts = Array.isArray(payload.products) && payload.products.length > 0;
    const hasBrands = Array.isArray(payload.brands) && payload.brands.length > 0;
    if (!hasProducts && !hasBrands) {
      errors.push('يجب إضافة صنف واحد على الأقل عبر الهيكل الرباعي');
    }

    // Magazine date conditional validation
    if (payload.activity === 'فرشة مجلة') {
      if (!payload.magazineStartDate) {
        errors.push('تاريخ بداية المجلة إلزامي');
      }
      if (!payload.magazineEndDate) {
        errors.push('تاريخ نهاية المجلة إلزامي');
      }
      if (payload.magazineStartDate && payload.magazineEndDate && payload.magazineEndDate < payload.magazineStartDate) {
        errors.push('تاريخ نهاية المجلة يجب أن يكون لاحقاً أو مساوياً لتاريخ البداية');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

if (typeof window !== 'undefined') {
  window.Validators = Validators;
}

