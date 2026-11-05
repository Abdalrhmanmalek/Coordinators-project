/**
 * ADCO Field Operations System - Offline Queue Manager
 * Single Responsibility: IndexedDB transaction queue for offline data capture and automatic synchronization
 */

import { STORAGE_KEYS } from '../config/constants.js';

const DB_NAME = 'ADCO_Field_DB';
const DB_VERSION = 1;
const STORE_OFFLINE_QUEUE = 'offline_queue';

function initDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
          db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
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
  static async enqueue(item) {
    try {
      const db = await initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_OFFLINE_QUEUE);
        const req = store.add({ ...item, queuedAt: new Date().toISOString() });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      list.push({ ...item, queuedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(list));
      return item.id || Date.now();
    }
  }

  static async getQueue() {
    try {
      const db = await initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_OFFLINE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    }
  }

  static async remove(id) {
    try {
      const db = await initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_OFFLINE_QUEUE);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
      return true;
    }
  }

  static setupNetworkListener(onOnlineCallback) {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      if (typeof onOnlineCallback === 'function') {
        onOnlineCallback();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.OfflineQueue = OfflineQueue;
  window.queueOfflineItem = OfflineQueue.enqueue;
  window.getOfflineQueue = OfflineQueue.getQueue;
  window.removeOfflineItem = OfflineQueue.remove;
  window.setupNetworkListener = OfflineQueue.setupNetworkListener;
}
