/**
 * ADCO Runtime Environment Config
 * Centralizes environment flags, storage keys, API base URL and operational thresholds.
 * Must be the FIRST script loaded on every page. Exposed as window.ADCO_ENV (frozen).
 */

(function (global) {
  const isHttp = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
  const isLocalHost = isHttp && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  const ADCO_ENV = {
    APP_NAME: 'ADCO Field Operations',
    ENVIRONMENT: isLocalHost ? 'development' : isHttp ? 'production' : 'file',
    API_BASE_URL: isLocalHost ? 'http://localhost:3000/api' : '/api',
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
    CACHE_VERSION: 'adco-field-cache-v6'
  };

  global.ADCO_ENV = Object.freeze(ADCO_ENV);
})(typeof window !== 'undefined' ? window : globalThis);
