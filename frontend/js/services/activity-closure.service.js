/**
 * ADCO Field Operations System - Activity Closure & Follow-Up Service
 * Single Responsibility: Closure requests, supervisor direct closure, follow-up photo rounds,
 * and multi-brand row expansion (1/N share).
 */

import { ACTIVITY_STATUS } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { ADCO_CATALOGS } from '../config/catalogs.js';
import { apiClient } from '../api/http-client.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { formatToEgyptTime } from '../utils/camera-compressor.esm.js';

export async function requestActivityClosureOp(store, activityId, notes = '') {
  const all = store.getAllActivities();
  const idx = all.findIndex((a) => a.id === activityId);
  if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

  all[idx].closureRequested = true;
  all[idx].closureRequestNotes = notes;
  all[idx].closureRequestedAt = new Date().toISOString();

  try {
    await apiClient.post(API_ENDPOINTS.ACTIVITIES.REQUEST_END(activityId), { notes });
  } catch (_) {}

  store.saveAllActivities(all);
  return all[idx];
}

export async function directCloseActivityOp(
  store,
  activityId,
  supervisorFeedback = 'تم الإغلاق المباشر من قبل مسؤول التسويق'
) {
  const all = store.getAllActivities();
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

  store.saveAllActivities(all);
  return all[idx];
}

export async function processClosureRequestOp(store, activityId, decision, supervisorFeedback = '') {
  const all = store.getAllActivities();
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

  store.saveAllActivities(all);
  return all[idx];
}

export async function addFollowUpPhotosOp(store, activityId, photosBatch, user, location = null, updatedProducts = null) {
  const all = store.getAllActivities();
  const idx = all.findIndex((a) => a.id === activityId);
  if (idx === -1) throw new Error('النشاط المطلوب غير موجود');

  const act = all[idx];
  if (location) {
    const proximityCheck = store.validateBranchProximity(
      act.branch,
      location,
      ADCO_CATALOGS.maxBranchProximityMeters || 150
    );
    if (!proximityCheck.isValid) {
      throw new Error(proximityCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
    }
  }

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

  if (Array.isArray(updatedProducts) && updatedProducts.length > 0) {
    newSession.products = updatedProducts;
    act.products = updatedProducts;
    const derivedBrands = [...new Set(updatedProducts.map((p) => (typeof p === 'object' ? p.brand : p)).filter(Boolean))];
    if (derivedBrands.length > 0) {
      act.brands = derivedBrands;
      newSession.brands = derivedBrands;
      act.skuVariant = updatedProducts.map((p) => (typeof p === 'object' ? p.skuItem || p.brand : p)).join(' / ');
    }
  }

  sessions.push(newSession);
  act.followUpHistory = sessions;
  act.status = ACTIVITY_STATUS.UNDER_REVIEW;

  try {
    await apiClient.post(API_ENDPOINTS.ACTIVITIES.FOLLOW_UP(activityId), newSession);
  } catch (_) {}

  store.saveAllActivities(all);
  return { updatedActivity: act, newSession };
}

export function getExpandedBrandRowsOp(activities) {
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

