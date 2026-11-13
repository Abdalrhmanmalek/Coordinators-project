/**
 * ADCO Field Operations System - Activity Service
 * Single Responsibility: Activity CRUD, 3-tier data scoping, branch proximity, and delegation to closure service.
 */

import { STORAGE_KEYS, ACTIVITY_STATUS } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { ADCO_CATALOGS } from '../config/catalogs.js';
import { apiClient } from '../api/http-client.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { formatToEgyptTime } from '../utils/camera-compressor.esm.js';
import { Validators } from '../utils/validators.js';
import { INITIAL_SEED_ACTIVITIES } from '../store/seed-data.esm.js';
import {
  requestActivityClosureOp,
  directCloseActivityOp,
  processClosureRequestOp,
  addFollowUpPhotosOp,
  getExpandedBrandRowsOp
} from './activity-closure.service.js';

export { INITIAL_SEED_ACTIVITIES };

export class ActivityService {
  static getAllActivities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES_CACHE);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE, JSON.stringify(INITIAL_SEED_ACTIVITIES));
        return INITIAL_SEED_ACTIVITIES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SEED_ACTIVITIES;
    }
  }

  static saveAllActivities(activities) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE, JSON.stringify(activities));
    } catch (_) {}
  }

  static getActivityById(id) {
    return this.getAllActivities().find((a) => a.id === id) || null;
  }

  static getActivitiesForUser(userOrId) {
    const all = this.getAllActivities();
    if (!userOrId) return all;

    if (typeof userOrId === 'object') {
      const user = userOrId;
      const role = user.role;

      if (role === 'marketing_manager') return all;

      if (role === 'coordinator_supervisor') {
        const clientName = (user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)').trim();
        const filtered = all.filter((a) => {
          const actClient = (a.client || '').trim();
          return actClient.includes(clientName) || clientName.includes(actClient);
        });
        return filtered.length > 0 ? filtered : all;
      }

      let filtered = [];
      if (user.assignedClientName && user.assignedBranchName) {
        const cName = user.assignedClientName.trim();
        const bName = user.assignedBranchName.trim();
        filtered = all.filter((a) => {
          const actClient = (a.client || '').trim();
          const actBranch = (a.branch || '').trim();
          return (actClient.includes(cName) || cName.includes(actClient)) &&
                 (actBranch.includes(bName) || bName.includes(actBranch));
        });
      }

      if (filtered.length === 0 && user.employeeId) {
        filtered = all.filter((a) => a.coordinatorId === user.employeeId);
      }
      if (filtered.length === 0 && user.fullName) {
        filtered = all.filter((a) => a.coordinatorName === user.fullName);
      }
      if (filtered.length === 0 && (user.assignedBranchName || user.branch)) {
        const b = (user.assignedBranchName || user.branch).trim();
        filtered = all.filter((a) => (a.branch || '').includes(b) || b.includes(a.branch || ''));
      }
      if (filtered.length === 0 && user.assignedClientName) {
        filtered = all.filter((a) => (a.client || '').includes(user.assignedClientName));
      }

      return filtered.length > 0 ? filtered : all;
    }

    const byId = all.filter((a) => a.coordinatorId === userOrId);
    return byId.length > 0 ? byId : all;
  }

  static getBranchesForClient(clientName) {
    const all = this.getAllActivities();
    const filtered = all.filter((a) => (a.client || '').includes(clientName) || clientName.includes(a.client || ''));
    const branches = [...new Set(filtered.map((a) => a.branch).filter(Boolean))];
    return branches.length > 0 ? branches : [
      'فرع سموحة - الإسكندرية',
      'فرع لوران - الكورنيش',
      'فرع المنتزه - شيراتون',
      'فرع ميامي - جمال عبد الناصر',
      'فرع محرم بك - قناة السويس'
    ];
  }

  static getSupplyingBranchSync(clientName, branchName) {
    const cName = (clientName || '').trim();
    const bName = (branchName || '').trim();
    if (!bName && !cName) return ADCO_CATALOGS.coordinatorBranches[0] || 'الإسكندرية - قطاع وسط';

    const all = this.getAllActivities();
    if (bName) {
      const exactMatch = all.find((a) => {
        const sameBranch = (a.branch || '').trim() === bName || (a.branch || '').includes(bName) || bName.includes(a.branch || '');
        const sameClient = !cName || (a.client || '').includes(cName) || cName.includes(a.client || '');
        return sameBranch && sameClient && a.coordinatorBranch;
      });
      if (exactMatch && exactMatch.coordinatorBranch) return exactMatch.coordinatorBranch;
    }

    const map = ADCO_CATALOGS.supplyingBranchMap || {};
    if (bName && map[bName]) return map[bName];
    for (const [key, val] of Object.entries(map)) {
      if (bName && (bName.includes(key) || key.includes(bName))) return val;
    }

    if (/سموحة|المنشية|وسط/.test(bName)) return 'الإسكندرية - قطاع وسط';
    if (/رشدي|كفر عبده|لوران|المنتزه|ميامي|سيدي جابر|جليم|ستانلي|سيدي بشر|شرق/.test(bName)) return 'الإسكندرية - قطاع شرق';
    if (/محرم بك|العجمي|الهانوفيل|غرب/.test(bName)) return 'الإسكندرية - قطاع غرب';
    if (/برج العرب|الساحل|العلمين/.test(bName)) return 'برج العرب والساحل الشمالي';
    if (/المعادي|مدينة نصر|مصر الجديدة|التجمع|القاهرة/.test(bName)) return 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)';
    if (/زايد|الدقي|المهندسين|الجيزة|أكتوبر/.test(bName)) return 'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)';
    if (/طنطا|المنصورة|دمنهور|الدلتا|البحيرة|الغربية/.test(bName)) return 'قطاع الدلتا والبحيرة';

    return ADCO_CATALOGS.coordinatorBranches[0] || 'الإسكندرية - قطاع وسط';
  }

  static async fetchSupplyingBranch(clientName, branchName) {
    const cName = (clientName || '').trim();
    const bName = (branchName || '').trim();
    try {
      const endpoint = (API_ENDPOINTS.BRANCHES && API_ENDPOINTS.BRANCHES.SUPPLYING_BRANCH) || '/branches/supplying-branch';
      const query = `?client=${encodeURIComponent(cName)}&branch=${encodeURIComponent(bName)}`;
      const res = await apiClient.get(`${endpoint}${query}`);
      if (res && (res.supplyingBranch || (res.data && res.data.supplyingBranch))) {
        return res.supplyingBranch || res.data.supplyingBranch;
      }
    } catch (_) {}
    return this.getSupplyingBranchSync(cName, bName);
  }

  static getBranchCoordinatesSync(branchName) {
    const bName = (branchName || '').trim();
    if (!bName) return null;

    const all = this.getAllActivities();
    const matchedAct = all.find((a) => {
      const ab = (a.branch || '').trim();
      return (ab === bName || ab.includes(bName) || bName.includes(ab)) && a.location && a.location.latitude && a.location.longitude;
    });
    if (matchedAct && matchedAct.location) {
      return { latitude: Number(matchedAct.location.latitude), longitude: Number(matchedAct.location.longitude) };
    }

    const coordsMap = ADCO_CATALOGS.branchCoordinatesMap || {};
    if (coordsMap[bName]) return coordsMap[bName];
    for (const [key, coords] of Object.entries(coordsMap)) {
      if (bName.includes(key) || key.includes(bName)) return coords;
    }
    return null;
  }

  static validateBranchProximity(branchName, deviceLocation, maxAllowedMeters = ADCO_CATALOGS.maxBranchProximityMeters || 150) {
    const branchCoords = this.getBranchCoordinatesSync(branchName);
    return { ...Validators.validateBranchProximity(branchCoords, deviceLocation, maxAllowedMeters), branchCoords };
  }

  static getCoordinatorsForClient(clientName) {
    const all = this.getAllActivities();
    const filtered = all.filter((a) => (a.client || '').includes(clientName) || clientName.includes(a.client || ''));
    const coords = [];
    const seen = new Set();
    filtered.forEach((a) => {
      if (a.coordinatorId && !seen.has(a.coordinatorId)) {
        seen.add(a.coordinatorId);
        coords.push({ id: a.coordinatorId, name: a.coordinatorName || a.coordinatorId });
      }
    });
    return coords.length > 0 ? coords : [
      { id: 'ADCO-101', name: 'أحمد محمود العبد' },
      { id: 'ADCO-102', name: 'سارة طارق إبراهيم' }
    ];
  }

  static async createActivity(payload) {
    const all = this.getAllActivities();
    const nowIso = new Date().toISOString();
    const formattedNow = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');
    const newId = `ACT-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const deviceCoords = payload.location || { latitude: payload.latitude, longitude: payload.longitude, accuracy: payload.accuracy || 10, verified: true };

    const proximityCheck = this.validateBranchProximity(
      payload.branch,
      deviceCoords,
      payload.maxBranchProximityMeters || ADCO_CATALOGS.maxBranchProximityMeters || 150
    );
    if (!proximityCheck.isValid) {
      throw new Error(proximityCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
    }

    const newActivity = {
      id: newId,
      coordinatorId: payload.coordinatorId || 'ADCO-101',
      coordinatorName: payload.coordinatorName || 'منسق أدكو',
      client: payload.client,
      branch: payload.branch,
      coordinatorBranch: payload.coordinatorBranch,
      activity: payload.activity,
      activityType: payload.activityType,
      activityCount: Number(payload.activityCount) || 1,
      brands: Array.isArray(payload.brands) && payload.brands.length > 0 ? payload.brands : ['عام (أدكو)'],
      products: Array.isArray(payload.products) ? payload.products : [],
      skuVariant: payload.skuVariant || (Array.isArray(payload.products) && payload.products.length > 0 ? payload.products.map(p => p.skuItem).join(' / ') : 'صنف عام'),
      magazineStartDate: payload.magazineStartDate || null,
      magazineEndDate: payload.magazineEndDate || null,
      magazineDate: payload.magazineStartDate && payload.magazineEndDate ? `${payload.magazineStartDate} إلى ${payload.magazineEndDate}` : '',
      status: ACTIVITY_STATUS.UNDER_REVIEW,
      supervisorScore: null,
      supervisorNotes: 'قيد مراجعة وتوثيق أول متابعة',
      reviewerName: null,
      reviewedAt: null,
      photoUrl: payload.photoUrl || './assets/images/fathalla-branch.avif',
      photoHash: payload.photoHash || '',
      timestamp: nowIso,
      createdAt: nowIso,
      activityDate: payload.activityDate || nowIso,
      activityDateFormatted: payload.activityDate ? (formatToEgyptTime ? formatToEgyptTime(payload.activityDate) : payload.activityDate) : formattedNow,
      isClosed: false,
      closureRequested: false,
      endDate: null,
      location: payload.location || { latitude: payload.latitude || 31.2001, longitude: payload.longitude || 29.9187, accuracy: 10, verified: true },
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: formattedNow,
          uploadedBy: payload.coordinatorName || 'منسق أدكو',
          uploadedById: payload.coordinatorId || 'ADCO-101',
          sessionScore: null,
          reviewStatus: 'Under Review',
          photos: [{ photoUrl: payload.photoUrl || './assets/images/fathalla-branch.avif', sizeKb: 180 }]
        }
      ]
    };

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.BASE, newActivity);
    } catch (err) {
      console.warn('API post failed, stored locally:', err.message);
    }

    all.unshift(newActivity);
    this.saveAllActivities(all);
    return newActivity;
  }

  static async updateActivityDate(activityId, newIsoDate) {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');
    all[idx].activityDate = newIsoDate;
    all[idx].activityDateFormatted = formatToEgyptTime ? formatToEgyptTime(newIsoDate) : newIsoDate;
    try {
      await apiClient.patch(API_ENDPOINTS.ACTIVITIES.UPDATE_DATE(activityId), { activityDate: newIsoDate });
    } catch (_) {}
    this.saveAllActivities(all);
    return all[idx];
  }

  static requestActivityClosure(activityId, notes = '') {
    return requestActivityClosureOp(this, activityId, notes);
  }

  static directCloseActivity(activityId, supervisorFeedback = 'تم الإغلاق المباشر من قبل مسؤول التسويق') {
    return directCloseActivityOp(this, activityId, supervisorFeedback);
  }

  static processClosureRequest(activityId, decision, supervisorFeedback = '') {
    return processClosureRequestOp(this, activityId, decision, supervisorFeedback);
  }

  static addFollowUpPhotos(activityId, photosBatch, user, location = null, updatedProducts = null) {
    return addFollowUpPhotosOp(this, activityId, photosBatch, user, location, updatedProducts);
  }

  static getExpandedBrandRows(activitiesInput = null) {
    return getExpandedBrandRowsOp(activitiesInput || this.getAllActivities());
  }

  static computeWeightedEvaluation(act) {
    return ScoreCalculator.computeWeightedEvaluation(act);
  }

  static computeOverallRating(act) {
    return ScoreCalculator.computeOverallRating(act);
  }
}

if (typeof window !== 'undefined') {
  window.ActivityService = ActivityService;
  window.ActivityManager = ActivityService;
  window.formatDateTime = formatToEgyptTime;
}
