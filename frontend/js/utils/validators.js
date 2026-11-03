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
   * Validates ADCO corporate Employee ID (e.g., ADCO-101, ADCO-901)
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
   * Validates Password complexity: minimum 8 characters with at least one letter and one number
   */
  static isStrongPassword(password) {
    if (!password) return false;
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  }

  /**
   * Validates Activity Creation Payload DTO
   */
  static validateActivityPayload(payload) {
    const errors = [];
    if (!payload.coordinatorId) errors.push('الرقم الوظيفي للمنسق مطلوب');
    if (!payload.client || !payload.client.trim()) errors.push('اسم العميل / السلسلة مطلوب');
    if (!payload.branch || !payload.branch.trim()) errors.push('الفرع مطلوب');
    if (!payload.activity || !payload.activity.trim()) errors.push('نوع النشاط مطلوب');
    if (!payload.activityType || !payload.activityType.trim()) errors.push('تصنيف النشاط مطلوب');
    if (!payload.skuVariant || !payload.skuVariant.trim()) errors.push('المنتج (SKU) مطلوب');
    if (!Array.isArray(payload.brands) || payload.brands.length === 0) {
      errors.push('يجب اختيار علامة تجارية واحدة على الأقل');
    }
    if (payload.activity === 'فرشة مجلة' && (!payload.magazineDate || !payload.magazineDate.trim())) {
      errors.push('تاريخ إصدار المجلة إلزامي عند اختيار "فرشة مجلة"');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
