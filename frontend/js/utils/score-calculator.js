/**
 * ADCO Field Operations System - Score Calculator
 * Single Responsibility: Pure math calculations for the 100-Point Evaluation Criteria,
 * session weighting, coordinator overall ratings, and achievement tier badges.
 */

import { EVALUATION_CRITERIA } from '../config/constants.js';

export class ScoreCalculator {
  /**
   * Computes weighted evaluation breakdown across the 4 official criteria (100 Points Total)
   * @param {Object} act Activity card object
   */
  static computeWeightedEvaluation(act) {
    if (!act) {
      return {
        totalWeightedScore: 0,
        badgeText: '0 / 100 نقطة',
        badgeTier: 'غير مقيّم',
        overallRating: 0,
        ratedCount: 0,
        totalSessions: 0,
        breakdown: {
          newActivity: { score: 0, max: 40 },
          executionQuality: { score: 0, max: 20 },
          continuity: { score: 0, max: 25 },
          documentation: { score: 0, max: 15 }
        }
      };
    }

    const sessions = Array.isArray(act.followUpHistory) ? act.followUpHistory : [];
    const ratedSessions = sessions.filter(
      (s) => s.sessionScore !== undefined && s.sessionScore !== null && !isNaN(Number(s.sessionScore))
    );

    let newActivityScore = 0;
    let executionScore = 0;
    let continuityScore = 0;
    let docScore = 0;

    if (act.evaluationBreakdown) {
      const eb = act.evaluationBreakdown;
      newActivityScore = Math.min(40, Math.max(0, Number(eb.newActivity !== undefined ? eb.newActivity : 40)));
      executionScore = Math.min(20, Math.max(0, Number(eb.executionQuality !== undefined ? eb.executionQuality : 18)));
      continuityScore = Math.min(25, Math.max(0, Number(eb.continuity !== undefined ? eb.continuity : 20)));
      docScore = Math.min(15, Math.max(0, Number(eb.documentation !== undefined ? eb.documentation : 15)));
    } else {
      // 1. Approved New Activities (40 Points)
      newActivityScore = act.status === 'Accepted' ? 40 : act.status === 'Under Review' ? 25 : 0;

      // 2. Execution Quality (20 Points)
      let rawRating = null;
      if (ratedSessions.length > 0) {
        const sum = ratedSessions.reduce((acc, s) => acc + Number(s.sessionScore), 0);
        rawRating = Number((sum / ratedSessions.length).toFixed(1));
      } else if (act.supervisorScore !== null && act.supervisorScore !== undefined) {
        rawRating = Number(Number(act.supervisorScore).toFixed(1));
      }
      executionScore = rawRating !== null ? Math.round((rawRating / 10) * 20) : act.status === 'Accepted' ? 18 : 12;

      // 3. Continuity Duration (25 Points)
      const daysCount = act.daysActive || 15;
      continuityScore = daysCount >= 30 ? 25 : daysCount >= 14 ? 20 : daysCount >= 7 ? 15 : 10;

      // 4. Documentation & Data Accuracy (15 Points)
      docScore = act.location && act.location.verified ? 15 : 10;
    }

    const totalWeightedScore = Math.min(100, Math.max(0, newActivityScore + executionScore + continuityScore + docScore));
    const tier = this.resolveTierBadge(totalWeightedScore);

    return {
      totalWeightedScore,
      badgeText: `${totalWeightedScore} / 100 (${tier.label})`,
      badgeTier: tier.label,
      badgeClass: tier.className,
      overallRating: Number((totalWeightedScore / 10).toFixed(1)),
      ratedCount: ratedSessions.length,
      totalSessions: sessions.length || 1,
      breakdown: {
        newActivity: { score: newActivityScore, max: 40 },
        executionQuality: { score: executionScore, max: 20 },
        continuity: { score: continuityScore, max: 25 },
        documentation: { score: docScore, max: 15 }
      }
    };
  }

  static computeOverallRating(act) {
    return this.computeWeightedEvaluation(act);
  }

  static resolveTierBadge(score) {
    if (score >= 90) return { label: 'ممتاز - فئة ماسية', className: 'badge-success' };
    if (score >= 80) return { label: 'جيد جداً - فئة ذهبية', className: 'badge-mint' };
    if (score >= 70) return { label: 'جيد - فئة فضية', className: 'badge-warning' };
    if (score >= 60) return { label: 'مقبول - فئة برونزية', className: 'badge-warning' };
    return { label: 'قيد التحسين', className: 'badge-danger' };
  }

  /**
   * Calculates overall profile score for a coordinator across all submitted activities
   */
  static calculateCoordinatorProfileStats(activities, coordinatorId) {
    const userActivities = activities.filter((a) => a.coordinatorId === coordinatorId);
    const count = userActivities.length;
    if (count === 0) {
      return {
        submissionsCount: 0,
        acceptedCount: 0,
        totalScore: 0,
        overallRating: '0.0',
        badgeTier: 'مبتدئ'
      };
    }

    let acceptedCount = 0;
    let totalScoreSum = 0;

    userActivities.forEach((act) => {
      if (act.status === 'Accepted') acceptedCount += 1;
      const evalStats = this.computeWeightedEvaluation(act);
      totalScoreSum += evalStats.totalWeightedScore;
    });

    const averageScore = Math.round(totalScoreSum / count);
    const tier = this.resolveTierBadge(averageScore);

    return {
      submissionsCount: count,
      acceptedCount,
      totalScore: averageScore,
      overallRating: (averageScore / 10).toFixed(1),
      badgeTier: tier.label
    };
  }
}
