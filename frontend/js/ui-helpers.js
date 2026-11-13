/**
* UI Helpers, Searchable Combobox Engine & Offline IndexedDB Caching
* Universal Browser Script (Works on both http://localhost and file:// protocol)
*/

(function (global) {
const DB_NAME = 'ADCO_Field_DB';
const DB_VERSION = 1;
const STORE_OFFLINE_QUEUE = 'offline_queue';
const STORE_ACTIVITIES = 'activities_cache';
const FALLBACK_QUEUE_KEY = 'ADCO_OFFLINE_QUEUE_FALLBACK';

function initDB() {
return new Promise((resolve, reject) => {
if (!global.indexedDB) {
return reject(new Error('IndexedDB not supported'));
}
try {
const request = indexedDB.open(DB_NAME, DB_VERSION);
request.onupgradeneeded = (event) => {
const db = event.target.result;
if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
}
if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id' });
}
};
request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
} catch (err) {
reject(err);
}
});
}

async function queueOfflineItem(item) {
  if (global.OfflineQueue && typeof global.OfflineQueue.enqueue === 'function') {
    return global.OfflineQueue.enqueue(item);
  }
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
    const list = JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]');
    list.push({ ...item, queuedAt: new Date().toISOString() });
    localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(list));
    return item.id;
  }
}

async function getOfflineQueue() {
  if (global.OfflineQueue && typeof global.OfflineQueue.getQueue === 'function') {
    return global.OfflineQueue.getQueue();
  }
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
    return JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]');
  }
}

async function removeOfflineItem(id) {
  if (global.OfflineQueue && typeof global.OfflineQueue.remove === 'function') {
    return global.OfflineQueue.remove(id);
  }
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const list = JSON.parse(localStorage.getItem(FALLBACK_QUEUE_KEY) || '[]').filter((x) => (x.id !== id && x.uploadId !== id));
    localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(list));
  }
}

// Formatters live in utils/formatters.js (loaded first); local aliases keep internal calls working.
const formatTwoWordName = global.formatTwoWordName;
const formatDateTime = global.formatDateTime;
const getEgyptDateTimeLocalString = global.getEgyptDateTimeLocalString;

const ADCO_FALLBACK_ICONS = {"archive":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <rect width=\"20\" height=\"5\" x=\"2\" y=\"3\" rx=\"1\"/> <path d=\"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8\"/> <path d=\"M10 12h4\"/></svg>","arrow-left":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-move-left preview-icon\"><path d=\"M6 8L2 12L6 16\"/><path d=\"M2 12H22\"/></svg>","bar-chart-3":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chart-no-axes-combined preview-icon\"><path d=\"M12 16v5\"/><path d=\"M16 14.639V21\"/><path d=\"M20 10.656V21\"/><path d=\"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15\"/><path d=\"M4 18.463V21\"/><path d=\"M8 14.656V21\"/></svg>","calendar-clock":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-calendar-clock preview-icon\"><path d=\"M16 14v2.2l1.6 1\"/><path d=\"M16 2v3\"/><path d=\"M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338\"/><path d=\"M3 9h5.859\"/><path d=\"M8 2v3\"/><circle cx=\"16\" cy=\"16\" r=\"6\"/></svg>","camera":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-camera preview-icon\"><path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/></svg>","check-circle-2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-check-big preview-icon\"><path d=\"M21.801 10A10 10 0 1 1 17 3.335\"/><path d=\"m9 11 3 3L22 4\"/></svg>","circle-check-big":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-check-big preview-icon\"><path d=\"M21.801 10A10 10 0 1 1 17 3.335\"/><path d=\"m9 11 3 3L22 4\"/></svg>","circle-x":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-x preview-icon\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/></svg>","clipboard-edit":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-clipboard-pen preview-icon\"><path d=\"M16 4h2a2 2 0 0 1 2 2v2\"/><path d=\"M21.34 15.664a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\"/><path d=\"M8 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"/></svg>","clipboard-pen":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-clipboard-pen preview-icon\"><path d=\"M16 4h2a2 2 0 0 1 2 2v2\"/><path d=\"M21.34 15.664a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\"/><path d=\"M8 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"/></svg>","clock":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-clock preview-icon\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/></svg>","file-spreadsheet":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-file-spreadsheet preview-icon\"><path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"/><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"/><path d=\"M8 13h2\"/><path d=\"M14 13h2\"/><path d=\"M8 17h2\"/><path d=\"M14 17h2\"/></svg>","house":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-house preview-icon\"><path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/></svg>","layout-dashboard":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-house preview-icon\"><path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/></svg>","list":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-text-align-justify preview-icon\"><path d=\"M3 5h18\"/><path d=\"M3 12h18\"/><path d=\"M3 19h18\"/></svg>","log-in":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-log-in preview-icon\"><path d=\"m10 17 5-5-5-5\"/><path d=\"M15 12H3\"/><path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"/></svg>","log-out":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-log-out preview-icon\"><path d=\"m16 17 5-5-5-5\"/><path d=\"M21 12H9\"/><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/></svg>","map-pin":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/> <circle cx=\"12\" cy=\"10\" r=\"3\"/></svg>","plus-circle":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-plus preview-icon\"><path d=\"M5 12h14\"/><path d=\"M12 5v14\"/></svg>","plus":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-plus preview-icon\"><path d=\"M5 12h14\"/><path d=\"M12 5v14\"/></svg>","search":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/></svg>","sheet":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sheet preview-icon\"><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/><line x1=\"3\" x2=\"21\" y1=\"9\" y2=\"9\"/><line x1=\"3\" x2=\"21\" y1=\"15\" y2=\"15\"/><line x1=\"9\" x2=\"9\" y1=\"9\" y2=\"21\"/><line x1=\"15\" x2=\"15\" y1=\"9\" y2=\"21\"/></svg>","shield-check":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-shield-check preview-icon\"><path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/></svg>","sliders":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <line x1=\"4\" x2=\"4\" y1=\"21\" y2=\"14\"/> <line x1=\"4\" x2=\"4\" y1=\"10\" y2=\"3\"/> <line x1=\"12\" x2=\"12\" y1=\"21\" y2=\"12\"/> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"3\"/> <line x1=\"20\" x2=\"20\" y1=\"21\" y2=\"16\"/> <line x1=\"20\" x2=\"20\" y1=\"12\" y2=\"3\"/> <line x1=\"1\" x2=\"7\" y1=\"14\" y2=\"14\"/> <line x1=\"9\" x2=\"15\" y1=\"8\" y2=\"8\"/> <line x1=\"17\" x2=\"23\" y1=\"16\" y2=\"16\"/></svg>","star":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-star preview-icon\"><path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/></svg>","table-2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sheet preview-icon\"><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/><line x1=\"3\" x2=\"21\" y1=\"9\" y2=\"9\"/><line x1=\"3\" x2=\"21\" y1=\"15\" y2=\"15\"/><line x1=\"9\" x2=\"9\" y1=\"9\" y2=\"21\"/><line x1=\"15\" x2=\"15\" y1=\"9\" y2=\"21\"/></svg>","trophy":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-trophy preview-icon\"><path d=\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\"/><path d=\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\"/><path d=\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\"/><path d=\"M4 22h16\"/><path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\"/><path d=\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\"/></svg>","user-cog":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-user-round preview-icon\"><path d=\"M17.925 20.056a6 6 0 0 0-11.851.001\"/><circle cx=\"12\" cy=\"11\" r=\"4\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/></svg>","user-plus":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-user-round-plus preview-icon\"><path d=\"M2 21a8 8 0 0 1 13.292-6\"/><circle cx=\"10\" cy=\"8\" r=\"5\"/><path d=\"M19 16v6\"/><path d=\"M22 19h-6\"/></svg>","x-circle":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-x preview-icon\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/></svg>","sliders-horizontal":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <line x1=\"4\" x2=\"4\" y1=\"21\" y2=\"14\"/> <line x1=\"4\" x2=\"4\" y1=\"10\" y2=\"3\"/> <line x1=\"12\" x2=\"12\" y1=\"21\" y2=\"12\"/> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"3\"/> <line x1=\"20\" x2=\"20\" y1=\"21\" y2=\"16\"/> <line x1=\"20\" x2=\"20\" y1=\"12\" y2=\"3\"/> <line x1=\"1\" x2=\"7\" y1=\"14\" y2=\"14\"/> <line x1=\"9\" x2=\"15\" y1=\"8\" y2=\"8\"/> <line x1=\"17\" x2=\"23\" y1=\"16\" y2=\"16\"/></svg>","check":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6 9 17l-5-5\"/></svg>","eye":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>","eye-off":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.88 9.88a3 3 0 1 0 4.24 4.24\"/><path d=\"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68\"/><path d=\"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61\"/><line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"/></svg>","building-2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/><path d=\"M10 6h4\"/><path d=\"M10 10h4\"/><path d=\"M10 14h4\"/><path d=\"M10 18h4\"/></svg>"};

function refreshIcons(root = document) {
  if (typeof document === 'undefined') return;

  // 1. Primary: Lucide library
  if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      if (root && root !== document && root.nodeType === 1) {
        window.lucide.createIcons({ root });
      } else {
        window.lucide.createIcons();
      }
    } catch (err) {
      console.warn('[Lucide] Error creating icons:', err);
    }
  }

  // 2. Failsafe: Inline SVG fallback for any remaining untransformed <i data-lucide="...">
  try {
    const searchRoot = (root && root.nodeType === 1) ? root : document;
    const pendingIcons = [];
    if (searchRoot.hasAttribute && searchRoot.hasAttribute('data-lucide') && searchRoot.tagName === 'I') {
      pendingIcons.push(searchRoot);
    }
    if (typeof searchRoot.querySelectorAll === 'function') {
      searchRoot.querySelectorAll('i[data-lucide]').forEach((el) => pendingIcons.push(el));
    }

    for (const el of pendingIcons) {
      const name = el.getAttribute('data-lucide');
      if (!name) continue;
      const svgStr = ADCO_FALLBACK_ICONS[name] || ADCO_FALLBACK_ICONS[name.replace(/-/g, '_')];
      if (svgStr) {
        const temp = document.createElement('div');
        temp.innerHTML = svgStr.trim();
        const svg = temp.firstElementChild;
        if (svg) {
          const cls = el.getAttribute('class') || '';
          svg.setAttribute('class', ('lucide lucide-' + name + ' ' + cls).trim());
          svg.setAttribute('data-lucide', name);
          svg.setAttribute('aria-hidden', 'true');
          if (el.parentNode) {
            el.parentNode.replaceChild(svg, el);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Lucide] Fallback icon rendering error:', err);
  }
}

function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let iconName = 'shield-check';
  if (type === 'success') iconName = 'check-circle-2';
  else if (type === 'error') iconName = 'circle-x';
  else if (type === 'warning') iconName = 'clock';

  toast.innerHTML = `<i data-lucide="${iconName}" class="ui-icon ui-icon-sm"></i><span>${message}</span>`;
  container.appendChild(toast);
  refreshIcons(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function renderStatusBadge(statusOrAct) {
  let reviewSt = statusOrAct;
  let endSt = null;

  if (statusOrAct && typeof statusOrAct === 'object') {
    reviewSt = statusOrAct.reviewStatus || statusOrAct.status;
    endSt = statusOrAct.endStatus || (statusOrAct.isClosed ? 'ENDED' : (statusOrAct.closureRequested ? 'ENDING_REQUESTED' : 'OPEN'));
  }

  if (endSt === 'ENDED' || reviewSt === 'ENDED' || reviewSt === 'CLOSED') {
    return `<span class="badge badge-success"><i data-lucide="archive" class="ui-icon ui-icon-sm"></i> منتهي</span>`;
  }
  if (endSt === 'ENDING_REQUESTED' || reviewSt === 'ENDING_REQUESTED') {
    return `<span class="badge badge-warning"><i data-lucide="clock" class="ui-icon ui-icon-sm"></i> طلب إنهاء</span>`;
  }

  const normalized = String(reviewSt || '').toUpperCase();
  if (normalized === 'ACCEPTED' || reviewSt === 'مقبول') {
    return `<span class="badge badge-success"><i data-lucide="check-circle-2" class="ui-icon ui-icon-sm"></i> مقبول</span>`;
  }
  if (normalized === 'REJECTED' || reviewSt === 'مرفوض') {
    return `<span class="badge badge-danger"><i data-lucide="circle-x" class="ui-icon ui-icon-sm"></i> مرفوض</span>`;
  }
  return `<span class="badge badge-warning"><i data-lucide="clock" class="ui-icon ui-icon-sm"></i> قيد المراجعة</span>`;
}

function updateActiveTab() {
// No-op for backwards compatibility after switching to Web Top Navbar
}

function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .trim();
}

function highlightMatch(text, query) {
  if (!query || !query.trim()) return text;
  const rawQ = query.trim();
  const escaped = rawQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    if (regex.test(text)) {
      return text.replace(regex, `<span class="match-highlight">$1</span>`);
    }
  } catch (_) {}
  return text;
}

function createSearchableCombobox({
mountId,
options = [],
placeholder = 'ابحث أو اختر...',
defaultValue = '',
allowCustomText = false,
onSelect = null
}) {
const mount = document.getElementById(mountId);
if (!mount) return null;

let selectedValue = defaultValue;
let highlightedIndex = -1;
let filteredOptions = [...options];

mount.innerHTML = `
<div class="combobox-container" id="${mountId}-wrap">
<div class="combobox-control">
<input
type="text"
class="combobox-input"
placeholder="${placeholder}"
value="${defaultValue}"
autocomplete="off"
/>
<div class="combobox-actions">
<button type="button" class="combobox-clear-btn ${defaultValue ? '' : 'is-hidden'}" title="مسح الاختيار">&times;</button>
<button type="button" class="combobox-toggle-btn" title="عرض القائمة">&#9662;</button>
</div>
</div>
<div class="combobox-dropdown"></div>
</div>
`;

const wrap = mount.querySelector('.combobox-container');
const input = mount.querySelector('.combobox-input');
const clearBtn = mount.querySelector('.combobox-clear-btn');
const toggleBtn = mount.querySelector('.combobox-toggle-btn');
const dropdown = mount.querySelector('.combobox-dropdown');

function renderDropdown(query = '') {
  const trimmed = query.trim();
  if (!trimmed) {
    filteredOptions = [...options];
  } else {
    const normQ = normalizeSearchText(trimmed);
    filteredOptions = options
      .filter((opt) => normalizeSearchText(opt).includes(normQ))
      .sort((a, b) => {
        const normA = normalizeSearchText(a);
        const normB = normalizeSearchText(b);
        const aStarts = normA.startsWith(normQ);
        const bStarts = normB.startsWith(normQ);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return normA.indexOf(normQ) - normB.indexOf(normQ);
      });
  }

if (filteredOptions.length === 0) {
dropdown.innerHTML =
allowCustomText && query.trim()
? `<div class="combobox-option highlighted" data-val="${query.trim()}">إضافة: "${highlightMatch(query.trim(), query)}" ↵</div>`
: `<div class="combobox-empty">لا توجد نتائج مطابقة لـ "${query}"</div>`;
highlightedIndex = allowCustomText && query.trim() ? 0 : -1;
if (allowCustomText && query.trim()) {
dropdown.querySelector('.combobox-option').addEventListener('click', () => {
chooseValue(query.trim());
});
}
return;
}

if (highlightedIndex >= filteredOptions.length) {
highlightedIndex = 0;
}

const iconBase = getIconPrefix();
dropdown.innerHTML = filteredOptions
.map((opt, idx) => {
const isSelected = opt === selectedValue;
const isHigh = idx === highlightedIndex;
return `
<div class="combobox-option ${isSelected ? 'selected' : ''} ${isHigh ? 'highlighted' : ''}" data-index="${idx}">
<span>${highlightMatch(opt, query)}</span>
${isSelected ? `<img src="${iconBase}check-circle-2.svg" class="ui-icon ui-icon-sm" alt="" />` : ''}
</div>
`;
})
.join('');

dropdown.querySelectorAll('.combobox-option').forEach((el) => {
el.addEventListener('click', () => {
const idx = Number(el.dataset.index);
chooseValue(filteredOptions[idx]);
});
});
}

function openDropdown(filterText = '') {
document.querySelectorAll('.combobox-container.open').forEach((other) => {
if (other !== wrap) other.classList.remove('open');
});
wrap.classList.add('open');
renderDropdown(filterText);
}

function closeDropdown() {
wrap.classList.remove('open');
highlightedIndex = -1;
if (allowCustomText && input.value.trim()) {
selectedValue = input.value.trim();
} else if (!options.includes(input.value.trim()) && selectedValue) {
input.value = selectedValue;
}
clearBtn.style.display = input.value ? 'flex' : 'none';
}

function chooseValue(val) {
selectedValue = val;
input.value = val;
clearBtn.style.display = val ? 'flex' : 'none';
wrap.classList.remove('open');
if (typeof onSelect === 'function') {
onSelect(val);
}
}

input.addEventListener('focus', () => openDropdown(''));

input.addEventListener('input', () => {
const val = input.value;
clearBtn.style.display = val ? 'flex' : 'none';
if (allowCustomText) selectedValue = val.trim();
highlightedIndex = 0;
openDropdown(val);
});

input.addEventListener('keydown', (e) => {
if (!wrap.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'Enter')) {
e.preventDefault();
openDropdown(input.value);
return;
}

if (e.key === 'ArrowDown') {
e.preventDefault();
if (filteredOptions.length > 0) {
highlightedIndex = (highlightedIndex + 1) % filteredOptions.length;
renderDropdown(input.value);
}
} else if (e.key === 'ArrowUp') {
e.preventDefault();
if (filteredOptions.length > 0) {
highlightedIndex = (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length;
renderDropdown(input.value);
}
} else if (e.key === 'Enter') {
e.preventDefault();
if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
chooseValue(filteredOptions[highlightedIndex]);
} else if (allowCustomText && input.value.trim()) {
chooseValue(input.value.trim());
}
} else if (e.key === 'Escape') {
closeDropdown();
}
});

clearBtn.addEventListener('click', (e) => {
e.stopPropagation();
selectedValue = '';
input.value = '';
clearBtn.style.display = 'none';
openDropdown('');
input.focus();
if (typeof onSelect === 'function') onSelect('');
});

toggleBtn.addEventListener('click', (e) => {
e.stopPropagation();
if (wrap.classList.contains('open')) {
closeDropdown();
} else {
openDropdown('');
input.focus();
}
});

document.addEventListener('click', (e) => {
if (!wrap.contains(e.target)) closeDropdown();
});

return {
getValue: () => (allowCustomText ? input.value.trim() : selectedValue || input.value.trim()),
setValue: (val) => chooseValue(val)
};
}

function createMultiSelectCombobox({
mountId,
options = [],
defaultSelected = [],
placeholder = 'ابحث عن العلامات التجارية وأضفها...',
onChange = null
}) {
const mount = document.getElementById(mountId);
if (!mount) return null;

let selectedItems = [...defaultSelected];
let highlightedIndex = 0;
let filteredOptions = [...options];

mount.innerHTML = `
<div class="multi-selected-tags" id="${mountId}-tags"></div>
<div class="combobox-container" id="${mountId}-wrap">
<div class="combobox-control">
<input
type="text"
class="combobox-input"
placeholder="${placeholder}"
autocomplete="off"
/>
<div class="combobox-actions">
<button type="button" class="combobox-clear-btn is-hidden" title="مسح البحث">&times;</button>
<button type="button" class="combobox-toggle-btn" title="عرض العلامات التجارية">&#9662;</button>
</div>
</div>
<div class="combobox-dropdown"></div>
</div>
`;

const tagsContainer = mount.querySelector(`#${mountId}-tags`);
const wrap = mount.querySelector('.combobox-container');
const input = mount.querySelector('.combobox-input');
const clearBtn = mount.querySelector('.combobox-clear-btn');
const toggleBtn = mount.querySelector('.combobox-toggle-btn');
const dropdown = mount.querySelector('.combobox-dropdown');

function renderTags() {
if (selectedItems.length === 0) {
tagsContainer.innerHTML = `<span class="ui-s1">لم يتم اختيار علامات تجارية بعد</span>`;
return;
}
tagsContainer.innerHTML = selectedItems
.map(
(brand) => `
<span class="multi-tag-pill">
<span>${brand}</span>
<button type="button" class="multi-tag-remove" data-remove="${brand}" title="إزالة">&times;</button>
</span>
`
)
.join('');

tagsContainer.querySelectorAll('.multi-tag-remove').forEach((btn) => {
btn.addEventListener('click', (e) => {
e.stopPropagation();
const target = btn.dataset.remove;
selectedItems = selectedItems.filter((item) => item !== target);
renderTags();
if (wrap.classList.contains('open')) renderDropdown(input.value);
if (typeof onChange === 'function') onChange(selectedItems);
});
});
}

function renderDropdown(query = '') {
  const trimmed = query.trim();
  if (!trimmed) {
    filteredOptions = [...options];
  } else {
    const normQ = normalizeSearchText(trimmed);
    filteredOptions = options
      .filter((opt) => normalizeSearchText(opt).includes(normQ))
      .sort((a, b) => {
        const normA = normalizeSearchText(a);
        const normB = normalizeSearchText(b);
        const aStarts = normA.startsWith(normQ);
        const bStarts = normB.startsWith(normQ);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return normA.indexOf(normQ) - normB.indexOf(normQ);
      });
  }

if (filteredOptions.length === 0) {
dropdown.innerHTML = `<div class="combobox-empty">لا توجد علامة تجارية مطابقة لـ "${query}"</div>`;
return;
}

if (highlightedIndex >= filteredOptions.length) highlightedIndex = 0;

dropdown.innerHTML = filteredOptions
.map((opt, idx) => {
const isSelected = selectedItems.includes(opt);
const isHigh = idx === highlightedIndex;
return `
<div class="combobox-option ${isSelected ? 'selected' : ''} ${isHigh ? 'highlighted' : ''}" data-index="${idx}">
<span>${highlightMatch(opt, query)}</span>
<span>${isSelected ? 'مضاف' : '+ إضافة'}</span>
</div>
`;
})
.join('');

dropdown.querySelectorAll('.combobox-option').forEach((el) => {
el.addEventListener('click', (e) => {
e.stopPropagation();
const idx = Number(el.dataset.index);
toggleBrand(filteredOptions[idx]);
});
});
}

function toggleBrand(brand) {
if (!brand) return;
if (selectedItems.includes(brand)) {
selectedItems = selectedItems.filter((b) => b !== brand);
} else {
selectedItems.push(brand);
}
input.value = '';
clearBtn.style.display = 'none';
renderTags();
renderDropdown('');
if (typeof onChange === 'function') onChange(selectedItems);
}

input.addEventListener('focus', () => {
wrap.classList.add('open');
renderDropdown(input.value);
});

input.addEventListener('input', () => {
clearBtn.style.display = input.value ? 'flex' : 'none';
highlightedIndex = 0;
wrap.classList.add('open');
renderDropdown(input.value);
});

input.addEventListener('keydown', (e) => {
if (e.key === 'ArrowDown') {
e.preventDefault();
if (filteredOptions.length > 0) {
highlightedIndex = (highlightedIndex + 1) % filteredOptions.length;
renderDropdown(input.value);
}
} else if (e.key === 'ArrowUp') {
e.preventDefault();
if (filteredOptions.length > 0) {
highlightedIndex = (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length;
renderDropdown(input.value);
}
} else if (e.key === 'Enter') {
e.preventDefault();
if (filteredOptions[highlightedIndex]) {
toggleBrand(filteredOptions[highlightedIndex]);
}
} else if (e.key === 'Escape') {
wrap.classList.remove('open');
}
});

clearBtn.addEventListener('click', (e) => {
e.stopPropagation();
input.value = '';
clearBtn.style.display = 'none';
renderDropdown('');
input.focus();
});

toggleBtn.addEventListener('click', (e) => {
e.stopPropagation();
wrap.classList.toggle('open');
if (wrap.classList.contains('open')) {
renderDropdown(input.value);
input.focus();
}
});

document.addEventListener('click', (e) => {
if (!mount.contains(e.target)) wrap.classList.remove('open');
});

renderTags();

return {
getSelected: () => [...selectedItems],
setSelected: (arr) => {
selectedItems = [...arr];
renderTags();
}
};
}

function setupNetworkListener(onSyncCallback) {
const updateStatus = () => {
const isOnline = navigator.onLine;
const banner = document.getElementById('offline-banner');
if (banner) {
if (!isOnline) {
banner.classList.add('active');
banner.innerHTML = `وضع العمل دون اتصال - سيتم حفظ البيانات محلياً وإرسالها عند عودة الاتصال`;
} else {
banner.classList.remove('active');
if (typeof onSyncCallback === 'function') {
onSyncCallback();
}
}
}
};

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();
}

// Expose globally
global.initDB = initDB;
global.queueOfflineItem = queueOfflineItem;
global.getOfflineQueue = getOfflineQueue;
global.removeOfflineItem = removeOfflineItem;
global.formatTwoWordName = formatTwoWordName;
global.formatDateTime = formatDateTime;
global.getEgyptDateTimeLocalString = getEgyptDateTimeLocalString;
global.showToast = showToast;
global.renderStatusBadge = renderStatusBadge;
global.updateActiveTab = updateActiveTab;
global.createSearchableCombobox = createSearchableCombobox;
global.createMultiSelectCombobox = createMultiSelectCombobox;
global.setupNetworkListener = setupNetworkListener;
global.refreshIcons = refreshIcons;
if (typeof window !== 'undefined') window.refreshIcons = refreshIcons;
})(window);

/* Show / hide password toggle (auto-applied to every password input, including dynamic modals) */
(function () {
  var EYE = '<i data-lucide="eye" class="ui-icon ui-icon-sm"></i>';
  var EYE_OFF = '<i data-lucide="eye-off" class="ui-icon ui-icon-sm"></i>';

  function enhance(input) {
    if (input.dataset.pwToggle) return;
    input.dataset.pwToggle = '1';
    var wrap = document.createElement('span');
    wrap.style.cssText = 'position:relative;display:block;width:100%;';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.paddingLeft = '42px';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.setAttribute('aria-label', 'إظهار كلمة المرور');
    btn.innerHTML = EYE;
    btn.style.cssText = 'position:absolute;left:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#64748b;cursor:pointer;border-radius:8px;padding:0;';
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? EYE_OFF : EYE;
      btn.setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
      btn.style.color = show ? '#15803d' : '#64748b';
      if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
        window.refreshIcons(btn);
      }
    });
    wrap.appendChild(btn);
    if (typeof window !== 'undefined' && typeof window.refreshIcons === 'function') {
      window.refreshIcons(btn);
    }
  }

  function scan() {
    document.querySelectorAll('input[type="password"]').forEach(enhance);
  }

  function start() {
    scan();
    if (typeof MutationObserver !== 'undefined' && document && document.body) {
      new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// Auto-initialize icons across full DOM when document becomes interactive/ready
if (typeof document !== 'undefined') {
  const trigger = typeof window !== 'undefined' && typeof window.refreshIcons === 'function' ? window.refreshIcons : (typeof refreshIcons === 'function' ? refreshIcons : null);
  if (trigger) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { trigger(document); });
    } else {
      trigger(document);
    }
  }
}
