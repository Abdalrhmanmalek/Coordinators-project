/**
 * ADCO Field Operations System - Global Constants
 * Single Responsibility: Immutable application constants, roles, statuses, and config keys
 */

export const APP_CONFIG = {
  APP_NAME: 'ADCO Field Operations',
  VERSION: '2.5.0',
  DEFAULT_TIMEZONE: 'Africa/Cairo',
  MAX_IMAGE_SIZE_BYTES: 1024 * 1024, // 1MB
  TARGET_IMAGE_WIDTH: 1280,
  TARGET_IMAGE_HEIGHT: 720
};

export const ROLES = Object.freeze({
  COORDINATOR: 'coordinator',
  SUPERVISOR: 'supervisor'
});

export const ACTIVITY_STATUS = Object.freeze({
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
});

export const CLOSURE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  CLOSED: 'CLOSED'
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
  CURRENT_USER: 'ADCO_CURRENT_USER',
  ACTIVITIES_CACHE: 'ADCO_ACTIVITIES_CACHE_V2',
  OFFLINE_QUEUE: 'ADCO_OFFLINE_QUEUE_FALLBACK',
  REMEMBERED_ID: 'ADCO_REMEMBERED_ID'
});
