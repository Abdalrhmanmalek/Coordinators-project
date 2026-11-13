/**
 * ADCO Runtime Environment Config
 * Centralizes environment flags, storage keys, API base URL and operational thresholds.
 * Must be the FIRST script loaded on every page. Exposed as window.ADCO_ENV (frozen).
 */

(function (global) {
  const isHttp = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
  const isLocalHost = isHttp && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  // Runtime environment configuration injected via window or Vercel serverless / meta
  const runtimeApiBase = typeof window !== 'undefined'
    ? (window.__ADCO_API_BASE__ || window.ADCO_API_URL || (window.ADCO_CONFIG && window.ADCO_CONFIG.API_URL))
    : null;

  const resolvedApiBase = runtimeApiBase || (isHttp ? '/api/v1' : '');

  const ADCO_ENV = {
    APP_NAME: 'ADCO Field Operations',
    ENVIRONMENT: isLocalHost ? 'development' : (isHttp ? 'production' : 'file'),
    API_BASE_URL: resolvedApiBase,
    AWS_REGION: (typeof window !== 'undefined' && window.__AWS_REGION__) || 'eu-central-1',
    COGNITO_USER_POOL_ID: (typeof window !== 'undefined' && window.__COGNITO_USER_POOL_ID__) || '',
    COGNITO_CLIENT_ID: (typeof window !== 'undefined' && window.__COGNITO_CLIENT_ID__) || '',
    MOCK_MODE: true,
    STORAGE_NAMESPACE: 'ADCO',
    STORAGE_KEYS: {
      ACTIVITIES: 'ADCO_ACTIVITIES_DATA_V4',
      SESSION: 'ADCO_SESSION',
      REGISTRY: 'ADCO_EMPLOYEE_REGISTRY'
    },
    GPS_MAX_DISTANCE_METERS: 150,
    IMAGE_MAX_DIMENSION: 1280, // 720p canvas limit (1280x720 long edge)
    IMAGE_JPEG_QUALITY: 0.78,
    CACHE_VERSION: 'adco-field-cache-v11'
  };

  global.ADCO_ENV = Object.freeze(ADCO_ENV);
})(typeof window !== 'undefined' ? window : globalThis);
