/**
 * ADCO Field Operations System - Global Constants
 * Single Responsibility: Immutable application constants, roles, statuses, and config keys
 */

export const APP_CONFIG = Object.freeze({
  APP_NAME: 'ADCO Field Operations Platform',
  COMPANY_NAME: '(ADCO) شركة الاسكندريه للكيماويات و المنظفات',
  VERSION: '2.5.0',
  DEFAULT_TIMEZONE: 'Africa/Cairo',
  MAX_IMAGE_SIZE_BYTES: 1024 * 1024, // 1MB
  TARGET_IMAGE_WIDTH: 1280,
  TARGET_IMAGE_HEIGHT: 720,
  MAX_BRANCH_PROXIMITY_METERS: 150
});

export const ROLES = Object.freeze({
  COORDINATOR: 'coordinator',
  COORDINATOR_SUPERVISOR: 'coordinator_supervisor',
  MARKETING_MANAGER: 'marketing_manager',
  COORDINATION_MANAGER: 'marketing_manager',
  SUPERVISOR: 'supervisor'
});

export const ROLE_LABELS = Object.freeze({
  coordinator: 'منسق ميداني',
  coordinator_supervisor: 'مشرف منسق',
  marketing_manager: 'مسؤول التسويق',
  supervisor: 'مسؤول التسويق'
});

export const ACTIVITY_STATUS = Object.freeze({
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
});

export const CLOSURE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  PENDING: 'pending_closure',
  CLOSED: 'closed'
});

export const EVALUATION_CRITERIA = Object.freeze({
  NEW_ACTIVITY: { max: 40, label: 'الأنشطة الجديدة المعتمدة' },
  EXECUTION_QUALITY: { max: 20, label: 'جودة التنفيذ الميداني' },
  CONTINUITY: { max: 25, label: 'مدة الاستمرارية المثبتة' },
  DOCUMENTATION: { max: 15, label: 'الالتزام بالتوثيق وصحة البيانات' },
  TOTAL: 100
});

export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: 'ADCO_AUTH_TOKEN',
  REFRESH_TOKEN: 'ADCO_REFRESH_TOKEN',
  CURRENT_USER: 'ADCO_SESSION',
  REGISTRY: 'ADCO_EMPLOYEE_REGISTRY',
  ACTIVITIES_CACHE: 'ADCO_ACTIVITIES_CACHE_V3',
  OFFLINE_QUEUE: 'ADCO_OFFLINE_QUEUE_FALLBACK',
  REMEMBERED_ID: 'ADCO_REMEMBERED_ID'
});

if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.ROLES = ROLES;
  window.ROLE_LABELS = ROLE_LABELS;
  window.ACTIVITY_STATUS = ACTIVITY_STATUS;
  window.CLOSURE_STATUS = CLOSURE_STATUS;
  window.EVALUATION_CRITERIA = EVALUATION_CRITERIA;
  window.STORAGE_KEYS = STORAGE_KEYS;
}

