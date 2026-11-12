/**
 * ESM bridge for utils/camera-compressor.js (the single authoritative classic implementation).
 * Import this from ES-module services; HTML pages load utils/camera-compressor.js directly.
 */
export const CameraCompressor = typeof window !== 'undefined' ? window.CameraCompressor : null;
export const formatToEgyptTime = typeof window !== 'undefined' ? window.formatToEgyptTime : null;
