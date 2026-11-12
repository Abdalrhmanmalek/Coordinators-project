/**
 * ADCO Supervisor Processing Engine & Google Sheets / Excel Exporter
 * Implements:
 * - Cumulative Overall Rating calculation across follow-up upload sessions
 * - Multi-Brand Row Multiplication & Brand Share (1 / N) Excel Export
 */

(function (global) {
  class SupervisorEngine {
    /**
     * Submit inspection review for a specific follow-up upload session (or latest session)
     * and dynamically recalculate Overall Rating = (Sum of rated session scores) / (Count of rated sessions)
     */
    static async reviewActivity(activityId, status, score, notes, targetRoundNumber = null, evaluationBreakdown = null, reviewerUser = null, newActivityDate = null) {
      await new Promise((r) => setTimeout(r, 300));
      const all = global.ActivityManager.getAllActivities();
      const target = all.find((a) => a.id === activityId);
      if (!target) {
        throw new Error('لم يتم العثور على بطاقة النشاط المحددة.');
      }

      if (newActivityDate) {
        target.activityDate = newActivityDate;
        target.startDate = newActivityDate;
        target.activityDateFormatted = global.formatDateTime ? global.formatDateTime(newActivityDate) : newActivityDate;
      }

      const reviewerName = reviewerUser ? reviewerUser.fullName : (global.AuthManager ? (global.AuthManager.getCurrentUser() || {}).fullName : 'م. هاني شاكر عبد الله') || 'م. هاني شاكر عبد الله';
      const reviewerId = reviewerUser ? reviewerUser.employeeId : (global.AuthManager ? (global.AuthManager.getCurrentUser() || {}).employeeId : 'ADCO-SUP-01');
      const reviewTimestamp = new Date().toISOString();

      if (evaluationBreakdown) {
        target.evaluationBreakdown = {
          newActivity: Math.min(40, Math.max(0, Number(evaluationBreakdown.newActivity) || 0)),
          executionQuality: Math.min(20, Math.max(0, Number(evaluationBreakdown.executionQuality) || 0)),
          continuity: Math.min(25, Math.max(0, Number(evaluationBreakdown.continuity) || 0)),
          documentation: Math.min(15, Math.max(0, Number(evaluationBreakdown.documentation) || 0))
        };
      }

      if (!Array.isArray(target.followUpHistory) || target.followUpHistory.length === 0) {
        target.followUpHistory = [
          {
            roundNumber: 1,
            roundTitle: 'التوثيق التأسيسي (جولة 1)',
            timestamp: global.formatDateTime ? global.formatDateTime(target.timestamp) : target.timestamp,
            uploadedBy: target.coordinatorName,
            uploadedById: target.coordinatorId,
            reviewStatus: status,
            sessionScore: Number(score),
            sessionNotes: notes || '',
            reviewerName,
            reviewerId,
            reviewedAt: reviewTimestamp,
            photos: [{ photoUrl: target.photoUrl, photoHash: target.photoHash }]
          }
        ];
      } else {
        const roundIdx =
          targetRoundNumber !== null
            ? target.followUpHistory.findIndex((s) => Number(s.roundNumber) === Number(targetRoundNumber))
            : target.followUpHistory.length - 1;

        const safeIdx = roundIdx !== -1 ? roundIdx : target.followUpHistory.length - 1;
        target.followUpHistory[safeIdx].sessionScore = Number(score);
        target.followUpHistory[safeIdx].reviewStatus = status;
        target.followUpHistory[safeIdx].sessionNotes = notes || '';
        target.followUpHistory[safeIdx].reviewerName = reviewerName;
        target.followUpHistory[safeIdx].reviewerId = reviewerId;
        target.followUpHistory[safeIdx].reviewedAt = reviewTimestamp;
      }

      // Calculate Cumulative Overall Rating across all rated upload sessions
      const ratingStats = global.ActivityManager.computeWeightedEvaluation(target);
      target.status = status;
      target.overallRating = ratingStats.overallRating;
      target.supervisorScore = ratingStats.overallRating;
      target.totalWeightedScore = ratingStats.totalWeightedScore;
      target.ratedSessionsCount = ratingStats.ratedCount;
      target.supervisorNotes = notes || target.supervisorNotes || '';
      target.reviewerName = reviewerName;
      target.reviewerId = reviewerId;
      target.reviewedAt = reviewTimestamp;

      global.ActivityManager.saveAllActivities(all);
      return {
        activity: target,
        ratingStats
      };
    }

  }

  // Compose report export methods (services/report-export.service.js) onto the engine
  if (global.ReportExportService) {
    Object.getOwnPropertyNames(global.ReportExportService).forEach((k) => {
      if (['length', 'name', 'prototype'].includes(k)) return;
      Object.defineProperty(SupervisorEngine, k, Object.getOwnPropertyDescriptor(global.ReportExportService, k));
    });
  }

  global.SupervisorEngine = SupervisorEngine;
})(window);
