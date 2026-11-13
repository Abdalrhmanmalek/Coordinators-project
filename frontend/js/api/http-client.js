/**
 * ADCO Field Operations System - HTTP Client
 * Single Responsibility: Unified HTTP fetch client with interceptors, JWT Bearer headers,
 * Idempotency-Key UUID generation, silent token refresh, timeout handling, and local storage fallback adapter.
 */

import { STORAGE_KEYS } from '../config/constants.js';

let _inMemoryAccessToken = null;

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class HttpClient {
  constructor() {
    const envApi = typeof window !== 'undefined' && window.ADCO_ENV && window.ADCO_ENV.API_BASE_URL
      ? window.ADCO_ENV.API_BASE_URL
      : null;
    const globalBase = typeof window !== 'undefined'
      ? (window.__ADCO_API_BASE__ || window.ADCO_API_URL)
      : null;

    // Base URL comes from environment variable with clean '/api/v1' relative default (no hardcoded localhost)
    this.baseURL = (globalBase || envApi || '/api/v1').replace(/\/+$/, '');
    this.timeoutMs = 2500;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  setBaseURL(url) {
    this.baseURL = url.replace(/\/+$/, '');
  }

  getAuthToken() {
    // In-memory access token only, never stored in localStorage or accessible via cookies
    return _inMemoryAccessToken;
  }

  setTokens(accessToken) {
    // Access token kept strictly in memory
    _inMemoryAccessToken = accessToken || null;
  }

  clearTokens() {
    _inMemoryAccessToken = null;
  }

  /**
   * Request with timeout, interceptors, and error normalization
   */
  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});

    // 1. Content-Type Header
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // 2. Authorization Header (from in-memory token)
    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // 3. Idempotency-Key Header for State-Mutating Requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', generateUUID());
    }

    // MOCK_MODE_FAST_FALLBACK: bypass remote network attempt if in mock mode without remote base URL
    if (typeof window !== 'undefined' && window.ADCO_ENV && window.ADCO_ENV.MOCK_MODE && !window.__ADCO_API_BASE__) {
      return Promise.reject(new Error('MOCK_MODE_LOCAL'));
    }
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: options.credentials || 'include',
        signal: controller.signal
      });
      clearTimeout(timer);

      // Handle 401 Unauthorized with silent token refresh via HttpOnly cookie
      if (response.status === 401 && !options._retry) {
        const refreshed = await this.silentRefreshToken();
        if (refreshed) {
          options._retry = true;
          return this.request(endpoint, options);
        }
      }

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {}
        const error = new Error(errData.message || `Request failed with HTTP status ${response.status}`);
        error.status = response.status;
        error.errors = errData.errors || null;
        throw error;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال بالخادم (Request Timeout). يرجى التحقق من اتصال الشبكة.');
      }
      throw err;
    }
  }

  /**
   * Silent Token Refresh
   * Does NOT read or send refreshToken in request body; uses HttpOnly cookie sent automatically by browser.
   */
  async silentRefreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve) => this.refreshSubscribers.push(resolve));
    }
    this.isRefreshing = true;
    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.accessToken);
        this.refreshSubscribers.forEach((cb) => cb(true));
        this.refreshSubscribers = [];
        return true;
      }
      this.clearTokens();
      this.refreshSubscribers.forEach((cb) => cb(false));
      this.refreshSubscribers = [];
      return false;
    } catch (_) {
      this.clearTokens();
      this.refreshSubscribers.forEach((cb) => cb(false));
      this.refreshSubscribers = [];
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new HttpClient();

if (typeof window !== 'undefined') {
  window.HttpClient = HttpClient;
  window.apiClient = apiClient;
}

