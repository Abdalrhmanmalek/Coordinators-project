/**
 * ADCO Field Operations System - HTTP Client
 * Single Responsibility: Unified HTTP fetch client with interceptors, JWT Bearer headers,
 * Idempotency-Key UUID generation, silent token refresh, timeout handling, and local storage fallback adapter.
 */

import { STORAGE_KEYS } from '../config/constants.js';

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
    this.baseURL = (typeof window !== 'undefined' && window.__ADCO_API_BASE__)
      ? window.__ADCO_API_BASE__
      : 'http://localhost:3000/api/v1';
    this.timeoutMs = 12000;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  setBaseURL(url) {
    this.baseURL = url.replace(/\/+$/, '');
  }

  getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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

    // 2. Authorization Header
    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // 3. Idempotency-Key Header for State-Mutating Requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', generateUUID());
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal
      });
      clearTimeout(timer);

      // Handle 401 Unauthorized with silent token refresh
      if (response.status === 401 && !options._retry && this.getRefreshToken()) {
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

  async silentRefreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve) => this.refreshSubscribers.push(resolve));
    }
    this.isRefreshing = true;
    try {
      const refreshToken = this.getRefreshToken();
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.accessToken, data.refreshToken || refreshToken);
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

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new HttpClient();
