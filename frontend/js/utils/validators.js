/**
 * ADCO Field Operations System - Input Validators
 * Single Responsibility: Pure validation rules, regex patterns, and DTO schema verification
 */

export class Validators {
  static MAX_BRANCH_PROXIMITY_METERS = 150;

  /**
   * Haversine Formula: Calculates great-circle distance in meters between two GPS coordinates
   */
  static calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth mean radius in meters
    const toRad = (deg) => (Number(deg) * Math.PI) / 180;
    const dLat = toRad(Number(lat2) - Number(lat1));
    const dLon = toRad(Number(lon2) - Number(lon1));
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Validates Coordinator Device GPS Proximity against Registered Branch Coordinates
   * Throws/returns clear Arabic error if distance > threshold (default 150 meters)
   */
  static validateBranchProximity(branchCoords, deviceCoords, maxMeters = Validators.MAX_BRANCH_PROXIMITY_METERS) {
    if (!deviceCoords || deviceCoords.latitude === undefined || deviceCoords.longitude === undefined) {
      return {
        isValid: false,
        distanceMeters: null,
        maxAllowedMeters: maxMeters,
        errorMessage: 'تعذر التحقق من الموقع الجغرافي (GPS): يرجى تفعيل خدمة الموقع لمنح الإحداثيات الحالية'
      };
    }

    if (!branchCoords || branchCoords.latitude === undefined || branchCoords.longitude === undefined) {
      return {
        isValid: true,
        distanceMeters: 0,
        maxAllowedMeters: maxMeters,
        errorMessage: null
      };
    }

    const distanceMeters = this.calculateHaversineDistanceMeters(
      branchCoords.latitude,
      branchCoords.longitude,
      deviceCoords.latitude,
      deviceCoords.longitude
    );

    const threshold = Number(maxMeters) || Validators.MAX_BRANCH_PROXIMITY_METERS;
    if (distanceMeters > threshold) {
      return {
        isValid: false,
        distanceMeters,
        maxAllowedMeters: threshold,
        errorMessage: 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل'
      };
    }

    return {
      isValid: true,
      distanceMeters,
      maxAllowedMeters: threshold,
      errorMessage: null
    };
  }

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

