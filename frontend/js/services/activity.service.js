/**
 * ADCO Field Operations System - Activity Service
 * Single Responsibility: Activity lifecycle management, 3-tier data scoping,
 * multi-brand row multiplication ($1/N$ share), follow-up photos, and supervisor closure operations.
 */

import { STORAGE_KEYS, ACTIVITY_STATUS, CLOSURE_STATUS } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { formatToEgyptTime } from '../utils/camera-compressor.js';

export const INITIAL_SEED_ACTIVITIES = [
  {
    id: 'ACT-2026-0841',
    coordinatorId: 'ADCO-101',
    coordinatorName: 'أحمد محمود العبد',
    client: 'فتح الله جملة ماركت (Fathalla)',
    branch: 'فرع سموحة - الإسكندرية',
    coordinatorBranch: 'قطاع شرق الإسكندرية (سموحة / رشدي / سيدي جابر)',
    activity: 'فرشة مجلة',
    activityType: 'جندولة',
    activityCount: 2,
    brands: ['Velveta (فلفيتا)', 'Fairy (فيري)'],
    products: [
      {
        brandName: 'Velveta (فلفيتا)',
        mainGroup: 'معطرات الأقمشة',
        subGroup: 'معطر مركز',
        skuItem: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر'
      },
      {
        brandName: 'Fairy (فيري)',
        mainGroup: 'سائل غسيل الأطباق',
        subGroup: 'بلاتينيوم بلس',
        skuItem: 'فيري بلاتينيوم بلس ليمون 650 مل'
      }
    ],
    skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر / فيري بلاتينيوم بلس ليمون 650 مل',
    magazineStartDate: '2026-11-01',
    magazineEndDate: '2026-11-15',
    magazineDate: '2026-11-01 إلى 2026-11-15',
    status: ACTIVITY_STATUS.ACCEPTED,
    supervisorScore: 9.5,
    evaluationBreakdown: {
      newActivity: 40,
      executionQuality: 19,
      continuity: 25,
      documentation: 15
    },
    supervisorNotes: 'تنفيذ ممتاز وتوزيع نموذجي لحصص العرض بين العلامتين',
    reviewerName: 'م. حسام الدين غانم',
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
        uploadedBy: 'أحمد محمود العبد',
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
    id: 'ACT-2026-0855',
    coordinatorId: 'ADCO-102',
    coordinatorName: 'سارة طارق إبراهيم',
    client: 'فتح الله جملة ماركت (Fathalla)',
    branch: 'فرع لوران - الكورنيش',
    coordinatorBranch: 'قطاع المنتزه وميامي (سيدي بشر / ميامي / العصافرة)',
    activity: 'عقد',
    activityType: 'ستاند',
    activityCount: 1,
    brands: ['Persil (برسيل)'],
    products: [
      {
        brandName: 'Persil (برسيل)',
        mainGroup: 'منظفات الملابس السائلة (جل)',
        subGroup: 'برسيل جل أوتوماتيك',
        skuItem: 'برسيل جل لافندر 3.9 لتر + داوني 1 لتر هدية'
      }
    ],
    skuVariant: 'برسيل جل لافندر 3.9 لتر + داوني 1 لتر هدية',
    magazineStartDate: null,
    magazineEndDate: null,
    magazineDate: '',
    status: ACTIVITY_STATUS.ACCEPTED,
    supervisorScore: 9.8,
    evaluationBreakdown: {
      newActivity: 40,
      executionQuality: 20,
      continuity: 25,
      documentation: 15
    },
    supervisorNotes: 'ستاند مميز جداً على الواجهة الرئيسية للفرع',
    reviewerName: 'م. حسام الدين غانم',
    reviewedAt: '2026-11-02T16:00:00Z',
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
      accuracy: 10,
      verified: true
    },
    followUpHistory: [
      {
        roundNumber: 1,
        roundTitle: 'التوثيق التأسيسي (جولة 1)',
        timestamp: '2026-11-02 13:45',
        uploadedBy: 'سارة طارق إبراهيم',
        uploadedById: 'ADCO-102',
        sessionScore: 9.8,
        reviewStatus: 'Accepted',
        photos: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
            sizeKb: 210
          }
        ]
      }
    ]
  },
  {
    id: 'ACT-2026-0912',
    coordinatorId: 'ADCO-101',
    coordinatorName: 'أحمد محمود العبد',
    client: 'فتح الله جملة ماركت (Fathalla)',
    branch: 'فرع سموحة - الإسكندرية',
    coordinatorBranch: 'قطاع شرق الإسكندرية (سموحة / رشدي / سيدي جابر)',
    activity: 'إضافي',
    activityType: 'عرض أرضي',
    activityCount: 1,
    brands: ['Oxi (أوكسي)'],
    products: [
      {
        brandName: 'Oxi (أوكسي)',
        mainGroup: 'مساحيق غسيل أوتوماتيك',
        subGroup: 'أوكسي بودرة',
        skuItem: 'أوكسي مسحوق أوتوماتيك 4 كجم نسيم الشرق'
      }
    ],
    skuVariant: 'أوكسي مسحوق أوتوماتيك 4 كجم نسيم الشرق',
    magazineStartDate: null,
    magazineEndDate: null,
    magazineDate: '',
    status: ACTIVITY_STATUS.UNDER_REVIEW,
    supervisorScore: null,
    supervisorNotes: 'قيد مراجعة دقة أبعاد العرض المعتمدة',
    reviewerName: null,
    reviewedAt: null,
    photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
    photoHash: 'c5d8e023f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c3f4',
    timestamp: '2026-11-03T11:45:00Z',
    createdAt: '2026-11-03T11:45:00Z',
    activityDate: '2026-11-03T11:45:00Z',
    activityDateFormatted: '2026-11-03 13:45',
    isClosed: false,
    closureRequested: false,
    endDate: null,
    location: {
      latitude: 31.2156,
      longitude: 29.9553,
      accuracy: 9,
      verified: true
    },
    followUpHistory: [
      {
        roundNumber: 1,
        roundTitle: 'التوثيق التأسيسي (جولة 1)',
        timestamp: '2026-11-03 13:45',
        uploadedBy: 'أحمد محمود العبد',
        uploadedById: 'ADCO-101',
        sessionScore: null,
        reviewStatus: 'Under Review',
        photos: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
            sizeKb: 195
          }
        ]
      }
    ]
  },
  {
    id: 'ACT-2026-0930',
    coordinatorId: 'ADCO-103',
    coordinatorName: 'محمود عبد الفتاح',
    client: 'كارفور (Carrefour Egypt)',
    branch: 'فرع المعادي - القاهرة',
    coordinatorBranch: 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
    activity: 'عقد',
    activityType: 'دريس اب',
    activityCount: 1,
    brands: ['Clorox (كلوركس)', 'Downy (داوني)'],
    products: [
      {
        brandName: 'Clorox (كلوركس)',
        mainGroup: 'مبيضات ومطهرات ملابس',
        subGroup: 'كلوركس ألوان',
        skuItem: 'كلوركس ألوان جل 750 مل برائحة اللافندر'
      },
      {
        brandName: 'Downy (داوني)',
        mainGroup: 'مركزات منعم ومعطر أقمشة',
        subGroup: 'عطور منعشة',
        skuItem: 'داوني مركز أزهار منعشة 1 لتر'
      }
    ],
    skuVariant: 'كلوركس ألوان جل 750 مل / داوني مركز أزهار منعشة 1 لتر',
    magazineStartDate: null,
    magazineEndDate: null,
    magazineDate: '',
    status: ACTIVITY_STATUS.ACCEPTED,
    supervisorScore: 9.0,
    evaluationBreakdown: {
      newActivity: 40,
      executionQuality: 18,
      continuity: 25,
      documentation: 15
    },
    supervisorNotes: 'تنسيق ممتاز وعرض واجهة متناسق',
    reviewerName: 'م. حسام الدين غانم',
    reviewedAt: '2026-11-04T12:00:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
    photoHash: 'd6e9f134f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c4a5',
    timestamp: '2026-11-04T09:30:00Z',
    createdAt: '2026-11-04T09:30:00Z',
    activityDate: '2026-11-04T09:30:00Z',
    activityDateFormatted: '2026-11-04 11:30',
    isClosed: false,
    closureRequested: false,
    endDate: null,
    location: {
      latitude: 29.9602,
      longitude: 31.2569,
      accuracy: 11,
      verified: true
    },
    followUpHistory: [
      {
        roundNumber: 1,
        roundTitle: 'التوثيق التأسيسي (جولة 1)',
        timestamp: '2026-11-04 11:30',
        uploadedBy: 'محمود عبد الفتاح',
        uploadedById: 'ADCO-103',
        sessionScore: 9.0,
        reviewStatus: 'Accepted',
        photos: [
          {
            photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
            sizeKb: 188
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

  static saveAllActivities(activities) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE, JSON.stringify(activities));
    } catch (_) {}
  }

  static getActivityById(id) {
    const all = this.getAllActivities();
    return all.find((a) => a.id === id) || null;
  }

  /**
   * 3-Tier Data Scoping Filter:
   * 1. COORDINATOR: Single assigned client branch only
   * 2. COORDINATOR_SUPERVISOR: All branches of assigned client
   * 3. MARKETING_MANAGER: Global nationwide scope
   */
  static getActivitiesForUser(userOrId) {
    const all = this.getAllActivities();
    if (!userOrId) return all;

    if (typeof userOrId === 'object') {
      const user = userOrId;
      const role = user.role;

      // Tier 3: Marketing Manager / Coordination Manager (Global Visibility)
      if (role === 'marketing_manager' || role === 'coordination_manager' || role === 'supervisor') {
        return all;
      }

      // Tier 2: Coordinator Supervisor (Responsible for all branches of assigned client)
      if (role === 'coordinator_supervisor') {
        const clientName = (user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)').trim();
        return all.filter((a) => {
          const actClient = (a.client || '').trim();
          return actClient.includes(clientName) || clientName.includes(actClient);
        });
      }

      // Tier 1: Coordinator (Strictly restricted to single assigned client branch)
      if (user.assignedClientName && user.assignedBranchName) {
        const cName = user.assignedClientName.trim();
        const bName = user.assignedBranchName.trim();
        return all.filter((a) => {
          const actClient = (a.client || '').trim();
          const actBranch = (a.branch || '').trim();
          const matchClient = actClient.includes(cName) || cName.includes(actClient);
          const matchBranch = actBranch.includes(bName) || bName.includes(actBranch);
          return matchClient && matchBranch;
        });
      }

      return all.filter((a) => a.coordinatorId === user.employeeId);
    }

    return all.filter((a) => a.coordinatorId === userOrId);
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
      photoUrl: payload.photoUrl || 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
      photoHash: payload.photoHash || '',
      timestamp: nowIso,
      createdAt: nowIso,
      activityDate: payload.activityDate || nowIso,
      activityDateFormatted: payload.activityDate ? (formatToEgyptTime ? formatToEgyptTime(payload.activityDate) : payload.activityDate) : formattedNow,
      isClosed: false,
      closureRequested: false,
      endDate: null,
      location: payload.location || {
        latitude: payload.latitude || 31.2001,
        longitude: payload.longitude || 29.9187,
        accuracy: 10,
        verified: true
      },
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: formattedNow,
          uploadedBy: payload.coordinatorName || 'منسق أدكو',
          uploadedById: payload.coordinatorId || 'ADCO-101',
          sessionScore: null,
          reviewStatus: 'Under Review',
          photos: [
            {
              photoUrl: payload.photoUrl || 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
              sizeKb: 180
            }
          ]
        }
      ]
    };

    // Attempt remote API post
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

  static async requestActivityClosure(activityId, notes = '') {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    all[idx].closureRequested = true;
    all[idx].closureRequestNotes = notes;
    all[idx].closureRequestedAt = new Date().toISOString();

    try {
      await apiClient.post(API_ENDPOINTS.ACTIVITIES.REQUEST_END(activityId), { notes });
    } catch (_) {}

    this.saveAllActivities(all);
    return all[idx];
  }

  static async directCloseActivity(activityId, supervisorFeedback = 'تم الإغلاق المباشر من قبل مسؤول التسويق') {
    const all = this.getAllActivities();
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

    const nowIso = new Date().toISOString();
    all[idx].isClosed = true;
    all[idx].closureRequested = false;
    all[idx].closedAt = nowIso;
    all[idx].endDate = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');
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
    if (decision === 'COMPLETED' || decision === 'APPROVED') {
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
          reviewerName: act.reviewerName || (act.status !== 'Under Review' ? 'م. حسام الدين غانم' : '-'),
          reviewedAtFormatted: act.reviewedAt
            ? (formatToEgyptTime ? formatToEgyptTime(act.reviewedAt) : act.reviewedAt.slice(0, 16).replace('T', ' '))
            : (act.status !== 'Under Review' ? '2026-11-01 14:30' : '-'),
          reviewNotes: act.supervisorNotes || '-'
        });
      });
    });

    return expandedRows;
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
