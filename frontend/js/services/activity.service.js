/**
 * ADCO Field Operations System - Activity Service
 * Single Responsibility: Activity lifecycle management, multi-brand row multiplication ($1/N$ share),
 * date management, follow-up photos, and supervisor closure operations.
 */

import { STORAGE_KEYS, ACTIVITY_STATUS, CLOSURE_STATUS } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { formatToEgyptTime } from '../utils/camera-compressor.js';

const INITIAL_SEED_ACTIVITIES = [
  {
    id: 'ACT-2026-0841',
    coordinatorId: 'ADCO-101',
    coordinatorName: 'أحمد محمود إبراهيم',
    client: 'فتح الله (Fathalla Markets)',
    branch: 'سموحة - الإسكندرية',
    coordinatorBranch: 'قطاع شرق الإسكندرية (سموحة / رشدي / سيدي جابر)',
    activity: 'فرشة مجلة',
    activityType: 'جندولة',
    activityCount: 2,
    brands: ['Velveta (فلفيتا)', 'Fairy (فيري)'],
    skuVariant: 'مسحوق فلفيتا أوتوماتيك لافندر 5 كجم',
    magazineDate: '2026-11-01',
    status: ACTIVITY_STATUS.ACCEPTED,
    supervisorScore: 9.5,
    evaluationBreakdown: {
      newActivity: 40,
      executionQuality: 19,
      continuity: 25,
      documentation: 15
    },
    supervisorNotes: 'تنفيذ ممتاز وتوزيع نموذجي لحصص العرض بين العلامتين',
    reviewerName: 'م. هاني شاكر عبد الله',
    reviewedAt: '2026-11-01T14:30:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
    photoHash: 'a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9',
    timestamp: '2026-11-01T10:15:00Z',
    createdAt: '2026-11-01T10:15:00Z',
    activityDate: '2026-11-01T10:15:00Z',
    activityDateFormatted: '2026-11-01 12:15',
    isClosed: false,
    closureRequested: false,
    endDate: null,
    location: {
      latitude: 31.2156,
      longitude: 29.9553,
      accuracy: 8,
      verified: true
    },
    followUpHistory: [
      {
        roundNumber: 1,
        roundTitle: 'التوثيق التأسيسي (جولة 1)',
        timestamp: '2026-11-01 12:15',
        uploadedBy: 'أحمد محمود إبراهيم',
        uploadedById: 'ADCO-101',
        sessionScore: 9.5,
        reviewStatus: 'Accepted',
        photos: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
            sizeKb: 184
          }
        ]
      }
    ]
  },
  {
    id: 'ACT-2026-0912',
    coordinatorId: 'ADCO-101',
    coordinatorName: 'أحمد محمود إبراهيم',
    client: 'سعودي ماركت (Seoudi Market)',
    branch: 'سيدي بشر - الإسكندرية',
    coordinatorBranch: 'قطاع المنتزه وميامي (سيدي بشر / ميامي / العصافرة)',
    activity: 'عقد',
    activityType: 'استاند',
    activityCount: 1,
    brands: ['Oxi (أوكسي)'],
    skuVariant: 'أوكسي مسحوق غسيل أوتوماتيك نسيم الشرق 4 كجم',
    magazineDate: '',
    status: ACTIVITY_STATUS.UNDER_REVIEW,
    supervisorScore: null,
    supervisorNotes: 'قيد مراجعة دقة أبعاد الاستاند المعتمدة',
    reviewerName: null,
    reviewedAt: null,
    photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
    photoHash: 'b4c7d912f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c2e3',
    timestamp: '2026-11-02T11:45:00Z',
    createdAt: '2026-11-02T11:45:00Z',
    activityDate: '2026-11-02T11:45:00Z',
    activityDateFormatted: '2026-11-02 13:45',
    isClosed: false,
    closureRequested: false,
    endDate: null,
    location: {
      latitude: 31.2489,
      longitude: 29.9821,
      accuracy: 12,
      verified: true
    },
    followUpHistory: [
      {
        roundNumber: 1,
        roundTitle: 'التوثيق التأسيسي (جولة 1)',
        timestamp: '2026-11-02 13:45',
        uploadedBy: 'أحمد محمود إبراهيم',
        uploadedById: 'ADCO-101',
        sessionScore: null,
        reviewStatus: 'Under Review',
        photos: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
            sizeKb: 210
          }
        ]
      }
    ]
  }
];

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

  static saveAllActivities(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE, JSON.stringify(list));
    } catch (e) {
      console.warn('Local storage write warning:', e);
    }
  }

  static getActivityById(id) {
    const all = this.getAllActivities();
    return all.find((a) => a.id === id) || null;
  }

  static async submitActivity(payload) {
    const activityId = `ACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const formattedNow = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');

    const newActivity = {
      id: activityId,
      coordinatorId: payload.coordinatorId || 'ADCO-101',
      coordinatorName: payload.coordinatorName || 'أحمد محمود إبراهيم',
      client: payload.client,
      branch: payload.branch,
      coordinatorBranch: payload.coordinatorBranch || payload.branch,
      activity: payload.activity,
      activityType: payload.activityType,
      activityCount: Number(payload.activityCount) || 1,
      brands: Array.isArray(payload.brands) && payload.brands.length > 0 ? payload.brands : ['Velveta (فلفيتا)'],
      skuVariant: payload.skuVariant,
      magazineDate: payload.activity === 'فرشة مجلة' ? (payload.magazineDate || '') : '',
      status: ACTIVITY_STATUS.UNDER_REVIEW,
      supervisorScore: null,
      supervisorNotes: 'قيد الفحص والمراجعة من قبل المشرف',
      reviewerName: null,
      reviewedAt: null,
      photoUrl: payload.photoUrl || (payload.initialPhotos && payload.initialPhotos[0] ? payload.initialPhotos[0].photoUrl : ''),
      photoHash: payload.photoHash || 'sha256-mock-hash-seed',
      timestamp: nowIso,
      createdAt: nowIso,
      activityDate: payload.activityDate || nowIso,
      startDate: formatToEgyptTime ? formatToEgyptTime(payload.activityDate || nowIso) : formattedNow,
      activityDateFormatted: formatToEgyptTime ? formatToEgyptTime(payload.activityDate || nowIso) : formattedNow,
      isClosed: false,
      closureRequested: false,
      endDate: null,
      location: payload.location || {
        latitude: 31.2156,
        longitude: 29.9553,
        accuracy: 10,
        verified: true
      },
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: formattedNow,
          uploadedBy: payload.coordinatorName || 'أحمد محمود إبراهيم',
          uploadedById: payload.coordinatorId || 'ADCO-101',
          sessionScore: null,
          reviewStatus: 'Under Review',
          photos: payload.initialPhotos || [
            {
              photoUrl: payload.photoUrl,
              sizeKb: 180
            }
          ]
        }
      ]
    };

    // Try backend submission
    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.BASE, newActivity);
    } catch (_) {}

    const all = this.getAllActivities();
    all.unshift(newActivity);
    this.saveAllActivities(all);

    return { success: true, record: newActivity };
  }

  static async updateActivityDate(activityId, newDate) {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    const formatted = formatToEgyptTime ? formatToEgyptTime(newDate) : newDate;
    all[idx].activityDate = newDate;
    all[idx].activityDateFormatted = formatted;
    all[idx].startDate = formatted;

    try {
      await apiClient.put(API_ENDPOINTS.ACTIVITIES.UPDATE_DATE(activityId), { newDate });
    } catch (_) {}

    this.saveAllActivities(all);
    return all[idx];
  }

  static async requestActivityCompletion(activityId, reasonType, notes = '') {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    all[idx].closureRequested = true;
    all[idx].closureRequestedAt = new Date().toISOString();
    all[idx].closureReasonType = reasonType;
    all[idx].closureNotes = notes;

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.REQUEST_END(activityId), { reasonType, notes });
    } catch (_) {}

    this.saveAllActivities(all);
    return all[idx];
  }

  static async directCloseActivity(activityId, supervisorFeedback = '') {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    const nowIso = new Date().toISOString();
    const formattedClosed = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');

    all[idx].isClosed = true;
    all[idx].closureRequested = false;
    all[idx].closedAt = nowIso;
    all[idx].endDate = formattedClosed;
    all[idx].closureReasonType = 'قرار المشرف المباشر';
    all[idx].closureSupervisorFeedback = supervisorFeedback;

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.DIRECT_CLOSE(activityId), { supervisorFeedback });
    } catch (_) {}

    this.saveAllActivities(all);
    return all[idx];
  }

  static async processClosureRequest(activityId, decision, supervisorFeedback = '') {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    const nowIso = new Date().toISOString();
    if (decision === 'COMPLETED') {
      all[idx].isClosed = true;
      all[idx].closureRequested = false;
      all[idx].closedAt = nowIso;
      all[idx].endDate = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');
      all[idx].closureSupervisorFeedback = supervisorFeedback;
    } else {
      all[idx].closureRequested = false;
      all[idx].closureRejectedAt = nowIso;
      all[idx].closureSupervisorFeedback = supervisorFeedback;
    }

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.PROCESS_CLOSURE(activityId), { decision, supervisorFeedback });
    } catch (_) {}

    this.saveAllActivities(all);
    return all[idx];
  }

  static async addFollowUpPhotos(activityId, photosBatch, user, location = null) {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    const act = all[idx];
    const sessions = act.followUpHistory || [];
    const nextRoundNum = sessions.length + 1;
    const nowIso = new Date().toISOString();
    const formattedNow = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');

    const newSession = {
      roundNumber: nextRoundNum,
      roundTitle: `متابعة إضافية #${nextRoundNum}`,
      timestamp: formattedNow,
      uploadedBy: user ? user.fullName : act.coordinatorName,
      uploadedById: user ? user.employeeId : act.coordinatorId,
      sessionScore: null,
      reviewStatus: 'Under Review',
      photos: photosBatch,
      location: location || act.location
    };

    sessions.push(newSession);
    act.followUpHistory = sessions;
    act.status = ACTIVITY_STATUS.UNDER_REVIEW;

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.FOLLOW_UP(activityId), newSession);
    } catch (_) {}

    this.saveAllActivities(all);
    return { updatedActivity: act, newSession };
  }

  /**
   * Splits an activity with N selected brands into N separate rows, each with Brand Share = (1 / N)
   */
  static getExpandedBrandRows(activitiesInput = null) {
    const activities = activitiesInput || this.getAllActivities();
    const expandedRows = [];

    activities.forEach((act) => {
      const brandsList = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['عام (أدكو)'];
      const N = brandsList.length;
      const shareRaw = 1 / N;
      const shareDecimal = Number(shareRaw.toFixed(2));
      const sharePct = Math.round(shareRaw * 100);
      const ratingStats = ScoreCalculator.computeOverallRating(act);

      brandsList.forEach((singleBrand, brandIdx) => {
        const startDateDisplay = act.activityDate
          ? (formatToEgyptTime ? formatToEgyptTime(act.activityDate) : act.activityDate)
          : (formatToEgyptTime ? formatToEgyptTime(act.createdAt || act.timestamp) : (act.createdAt || '-'));

        const endDateDisplay = act.isClosed
          ? (act.endDate || (act.closedAt ? (formatToEgyptTime ? formatToEgyptTime(act.closedAt) : act.closedAt) : 'تم الإغلاق'))
          : 'نشط ومستمر';

        expandedRows.push({
          ...act,
          rowKey: `${act.id}-B${brandIdx + 1}`,
          singleBrand,
          brandCount: N,
          brandIndex: brandIdx + 1,
          brandShareDecimal: shareDecimal,
          brandSharePercent: `${sharePct}%`,
          brandShareFormatted: `${shareDecimal} (${sharePct}%)`,
          overallRating: ratingStats.overallRating,
          ratedSessionsCount: ratingStats.ratedCount,
          overallRatingBadge: ratingStats.badgeText,
          activityStartDate: startDateDisplay,
          activityEndDate: endDateDisplay,
          reviewerName: act.reviewerName || (act.status !== 'Under Review' ? 'م. هاني شاكر عبد الله' : '-'),
          reviewedAtFormatted: act.reviewedAt
            ? (formatToEgyptTime ? formatToEgyptTime(act.reviewedAt) : act.reviewedAt.slice(0, 16).replace('T', ' '))
            : (act.status !== 'Under Review' ? '2026-11-01 14:30' : '-'),
          reviewNotes: act.supervisorNotes || '-'
        });
      });
    });

    return expandedRows;
  }
}

// Global aliases for compatibility
if (typeof window !== 'undefined') {
  window.ActivityService = ActivityService;
  window.ActivityManager = ActivityService;
  window.formatDateTime = formatToEgyptTime;
}
