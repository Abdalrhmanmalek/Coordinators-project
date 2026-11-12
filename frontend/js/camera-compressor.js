/**
 * ADCO Camera Compressor — Backward-Compatibility Alias
 * The authoritative consolidated implementation lives in frontend/js/utils/camera-compressor.js.
 * This file delegates to window.CameraCompressor.
 */

(function (global) {
  if (global.CameraCompressor) return;
  // If loaded before utils/camera-compressor.js, this placeholder ensures access once loaded
  Object.defineProperty(global, 'CameraCompressor', {
    configurable: true,
    enumerable: true,
    get() {
      return global.__ADCO_CameraCompressor;
    },
    set(v) {
      global.__ADCO_CameraCompressor = v;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
