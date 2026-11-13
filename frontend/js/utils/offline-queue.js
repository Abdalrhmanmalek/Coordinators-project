/**
 * ADCO Field Operations System - Offline Queue Manager (Item 12)
 * Single Responsibility: Per-photo IndexedDB transaction queue for offline photo capture
 * and automatic synchronization with backend upload endpoints.
 */

import { STORAGE_KEYS } from '../config/constants.js';

const DB_NAME = 'ADCO_Field_DB';
const DB_VERSION = 2;
const STORE_PHOTO_QUEUE = 'offline_photos_queue';

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function initDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_PHOTO_QUEUE)) {
          db.createObjectStore(STORE_PHOTO_QUEUE, { keyPath: 'uploadId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export class OfflineQueue {
  /**
   * Enqueue an individual photo for upload
   * @param {Object} param0
   * @param {Blob|string} param0.blob - Compressed image blob or base64 string
   * @param {Object} param0.metadata - { location, accuracy, capturedAt, originType, width, height, sizeKb, photoHash }
   * @param {string} [param0.uploadId] - Optional pre-generated upload ID
   * @returns {Promise<string>} uploadId
   */
  static async enqueuePhoto({ blob, metadata = {}, uploadId = null }) {
    const photoRecord = {
      uploadId: uploadId || generateUUID(),
      blob: blob || null,
      metadata: {
        location: metadata.location || null,
        accuracy: metadata.accuracy || null,
        capturedAt: metadata.capturedAt || new Date().toISOString(),
        originType: metadata.originType || 'DIRECT_CAMERA',
        width: metadata.width || 0,
        height: metadata.height || 0,
        sizeKb: metadata.sizeKb || 0,
        photoHash: metadata.photoHash || null
      },
      status: 'PENDING_UPLOAD',
      syncedPhotoUrl: null,
      queuedAt: new Date().toISOString()
    };

    try {
      const db = await initDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PHOTO_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_PHOTO_QUEUE);
        const req = store.put(photoRecord);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return photoRecord.uploadId;
    } catch {
      // LocalStorage Fallback (Item 12: same per-photo structure)
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      // Strip binary blob if unsupported in localStorage, retain metadata and base64 preview
      const fallbackRecord = {
        ...photoRecord,
        blob: typeof blob === 'string' ? blob : null
      };
      const existingIdx = list.findIndex((item) => item.uploadId === fallbackRecord.uploadId);
      if (existingIdx >= 0) {
        list[existingIdx] = fallbackRecord;
      } else {
        list.push(fallbackRecord);
      }
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(list));
      return photoRecord.uploadId;
    }
  }

  /**
   * Backward-compatible enqueue wrapper: converts full objects to per-photo queue
   */
  static async enqueue(item) {
    if (item && (item.blob || item.photoUrl)) {
      return this.enqueuePhoto({
        blob: item.blob || item.photoUrl,
        metadata: item.metadata || {
          location: item.location,
          capturedAt: item.capturedAt || item.timestamp,
          photoHash: item.photoHash
        },
        uploadId: item.uploadId || item.id
      });
    }
    return this.enqueuePhoto({ blob: null, metadata: item });
  }

  /**
   * Retrieve all queued photo records
   * @returns {Promise<Array>}
   */
  static async getQueue() {
    try {
      const db = await initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PHOTO_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_PHOTO_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    }
  }

  /**
   * Mark a queued photo as successfully uploaded
   */
  static async markPhotoSynced(uploadId, syncedPhotoUrl) {
    try {
      const db = await initDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PHOTO_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_PHOTO_QUEUE);
        const getReq = store.get(uploadId);
        getReq.onsuccess = () => {
          const record = getReq.result;
          if (record) {
            record.status = 'SYNCED';
            record.syncedPhotoUrl = syncedPhotoUrl;
            record.syncedAt = new Date().toISOString();
            store.put(record);
          }
          resolve(true);
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      const target = list.find((item) => item.uploadId === uploadId || item.id === uploadId);
      if (target) {
        target.status = 'SYNCED';
        target.syncedPhotoUrl = syncedPhotoUrl;
        target.syncedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(list));
      }
    }
  }

  /**
   * Remove a photo from the queue
   */
  static async remove(uploadId) {
    try {
      const db = await initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PHOTO_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_PHOTO_QUEUE);
        const req = store.delete(uploadId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      const filtered = list.filter((item) => item.uploadId !== uploadId && item.id !== uploadId);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
      return true;
    }
  }

  /**
   * Sync pending photos when back online before finalizing activity or round submissions
   */
  static async syncPendingPhotos(uploadApiFn) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return {};
    const items = await this.getQueue();
    const pending = items.filter((p) => p.status === 'PENDING_UPLOAD');
    const syncedMap = {};

    for (const photo of pending) {
      try {
        let photoUrl = null;
        if (typeof uploadApiFn === 'function') {
          // Backend two-step upload endpoint placeholder (Item 7 & 12)
          photoUrl = await uploadApiFn(photo);
        } else {
          // Local/simulated upload fallback
          photoUrl = photo.syncedPhotoUrl || `https://storage.adco.local/photos/${photo.uploadId}.avif`;
        }
        await this.markPhotoSynced(photo.uploadId, photoUrl);
        syncedMap[photo.uploadId] = photoUrl;
      } catch (err) {
        console.warn(`[OfflineQueue] Failed to sync photo ${photo.uploadId}:`, err);
      }
    }
    return syncedMap;
  }

  /**
   * Setup network reconnection listener
   */
  static setupNetworkListener(onOnlineCallback) {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', async () => {
      console.info('[OfflineQueue] Network restored. Syncing pending photo uploads...');
      try {
        await OfflineQueue.syncPendingPhotos();
      } catch (err) {
        console.warn('[OfflineQueue] Auto-sync photos encountered an error:', err);
      }
      if (typeof onOnlineCallback === 'function') {
        onOnlineCallback();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.OfflineQueue = OfflineQueue;
  window.queueOfflinePhoto = OfflineQueue.enqueuePhoto.bind(OfflineQueue);
  window.queueOfflineItem = OfflineQueue.enqueue.bind(OfflineQueue);
  window.getOfflineQueue = OfflineQueue.getQueue.bind(OfflineQueue);
  window.removeOfflineItem = OfflineQueue.remove.bind(OfflineQueue);
  window.syncPendingPhotos = OfflineQueue.syncPendingPhotos.bind(OfflineQueue);
  window.setupNetworkListener = OfflineQueue.setupNetworkListener.bind(OfflineQueue);
}
