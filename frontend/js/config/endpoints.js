/**
 * ADCO Field Operations System - API Endpoints Registry
 * Single Responsibility: Central dictionary of all RESTful v1 backend endpoint URLs
 */

export const API_ENDPOINTS = Object.freeze({
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_EMPLOYEE: '/auth/verify-employee-id'
  },
  EMPLOYEES: {
    LIST: '/employees',
    PROFILE: '/employees/me',
    UPDATE_CREDENTIALS: '/profile/update-credentials'
  },
  ACTIVITIES: {
    BASE: '/activities',
    BY_ID: (id) => `/activities/${id}`,
    FOLLOW_UP: (id) => `/activities/${id}/follow-up`,
    REQUEST_END: (id) => `/activities/${id}/request-end`,
    DIRECT_CLOSE: (id) => `/activities/${id}/direct-close`,
    PROCESS_CLOSURE: (id) => `/activities/${id}/process-closure`,
    UPDATE_DATE: (id) => `/activities/${id}/update-date`
  },
  MEDIA: {
    UPLOAD: '/media/upload',
    VERIFY_METADATA: '/media/verify-metadata'
  },
  SUPERVISOR: {
    EVALUATIONS: '/supervisor/evaluations',
    REVIEW: (id) => `/supervisor/evaluations/${id}`,
    SHEETS_VIEW: '/supervisor/sheets-view',
    EXPORT_CSV: '/supervisor/export-csv'
  },
  REPORTS: {
    ANALYTICS: '/reports/analytics',
    LEADERBOARD: '/leaderboard'
  }
});
