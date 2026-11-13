/**
 * ADCO Field Operations System - Evaluation Service
 * Single Responsibility: Supervisor reviews, 100-Point criteria scoring, audit trail logs, and decision workflows
 */

import { ACTIVITY_STATUS } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { apiClient } from '../api/http-client.js';
import { ActivityService } from './activity.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
import { formatToEgyptTime } from '../utils/camera-compressor.esm.js';

export class EvaluationService {
  /**
   * Evaluates or re-evaluates an activity or follow-up session
   */
  static async reviewActivity(
    activityId,
    decision,
    rawScore = null,
    notes = '',
    roundNumber = 1,
    breakdown = null,
    reviewerUser = null,
    newActivityDate = null
  ) {
    const all = ActivityService.getAllActivities();
    const actIndex = all.findIndex((a) => a.id === activityId);
    if (actIndex === -1) throw new Error('النشاط المطلوب غير موجود');

    const act = all[actIndex];
    const nowIso = new Date().toISOString();
    const formattedNow = formatToEgyptTime ? formatToEgyptTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');

    // 1. If supervisor updated activity start date
    if (newActivityDate) {
      act.activityDate = newActivityDate;
      act.activityDateFormatted = formatToEgyptTime ? formatToEgyptTime(newActivityDate) : newActivityDate;
      act.startDate = act.activityDateFormatted;
    }

    // 2. Set review breakdown or fallback defaults
    const evalBreakdown = breakdown || {
      newActivity: decision === 'Accepted' ? 40 : decision === 'Under Review' ? 25 : 0,
      executionQuality: 20,
      continuity: 20,
      documentation: 15
    };

    const reviewStatusEnum = decision === 'Accepted' ? 'ACCEPTED' : decision === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW';

    act.evaluationBreakdown = evalBreakdown;
    act.status = decision;
    act.reviewStatus = reviewStatusEnum;
    act.supervisorNotes = notes;
    act.reviewedAt = nowIso;
    act.reviewerName = reviewerUser ? reviewerUser.fullName : 'م. حسام الدين غانم';
    act.reviewerId = reviewerUser ? reviewerUser.employeeId : 'ADCO-901';

    // 3. Update session in followUpHistory
    if (Array.isArray(act.followUpHistory)) {
      const session = act.followUpHistory.find((s) => Number(s.roundNumber) === Number(roundNumber));
      if (session) {
        session.reviewStatus = reviewStatusEnum;
        session.supervisorFeedback = notes;
        session.reviewedAt = formattedNow;
      }
    }

    const ratingStats = ScoreCalculator.computeOverallRating(act);
    act.overallRating = ratingStats.overallRating;
    act.ratedSessionsCount = ratingStats.ratedCount;

    // Send to backend (Item 9: Send four pillar numbers directly; server computes total)
    try {
      await apiClient.post(API_ENDPOINTS.SUPERVISOR.REVIEW(activityId), {
        decision,
        reviewStatus: reviewStatusEnum,
        notes,
        roundNumber,
        breakdown: evalBreakdown,
        newActivityDate
      });
    } catch (_) {}

    all[actIndex] = act;
    ActivityService.saveAllActivities(all);

    return {
      updatedActivity: act,
      ratingStats
    };
  }
}

// Global aliases for compatibility
if (typeof window !== 'undefined') {
  window.EvaluationService = EvaluationService;
  window.SupervisorEngine = EvaluationService;
}
