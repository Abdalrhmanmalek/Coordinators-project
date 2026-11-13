/**
 * ADCO Field Operations System - Score Calculator
 * Single Responsibility: Pure math calculations for the 100-Point Evaluation Criteria,
 * anti-cheat penalty checks, Bayesian Volume-Weighted Leaderboard rankings, and achievement tiers.
 *
 * Implements Specification: docs/evaluation.md (ADCO-ENG-SPEC-005)
 */
import { EVALUATION_CRITERIA } from '../config/constants.js';
export const EVALUATION_WEIGHTS = Object.freeze({
  NEW_ACTIVITY: 40,
  EXECUTION_QUALITY: 20,
  CONTINUITY: 25,
  DOCUMENTATION: 15,
  TOTAL: 100
});
export const BAYESIAN_LEADERBOARD_DEFAULTS = Object.freeze({
  MIN_BENCHMARK_ROUNDS: 5, // m
  BASELINE_PRIOR_SCORE: 70, // C
  MAX_EFFORT_BONUS: 5,
  BONUS_MULTIPLIER: 1.25
});
export class ScoreCalculator {
  /**
   * Computes weighted evaluation breakdown across the 4 official criteria (100 Points Total)
   * 1. New Activity (40 Points Max)
   * 2. Execution Quality (20 Points Max)
   * 3. Verified Continuity (25 Points Max)
   * 4. Documentation & Data Integrity (15 Points Max)
   *
   * @param {Object} act Activity card object
   * @returns {Object} Weighted evaluation summary with breakdown and badge tier
   */
  static computeWeightedEvaluation(act) {
    if (!act) {
      return {
        totalWeightedScore: 0,
        badgeText: '0 / 100 نقطة',
        badgeTier: 'غير مقيّم',
        badgeClass: 'badge-neutral',
        overallRating: 0,
        ratedCount: 0,
        totalSessions: 0,
        breakdown: {
          newActivity: { score: 0, max: EVALUATION_WEIGHTS.NEW_ACTIVITY, label: 'الأنشطة الجديدة المعتمدة' },
          executionQuality: { score: 0, max: EVALUATION_WEIGHTS.EXECUTION_QUALITY, label: 'جودة التنفيذ الميداني' },
          continuity: { score: 0, max: EVALUATION_WEIGHTS.CONTINUITY, label: 'مدة الاستمرارية المثبتة' },
          documentation: { score: 0, max: EVALUATION_WEIGHTS.DOCUMENTATION, label: 'الالتزام بالتوثيق وصحة البيانات' }
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
      newActivityScore = Math.min(EVALUATION_WEIGHTS.NEW_ACTIVITY, Math.max(0, Number(eb.newActivity !== undefined ? eb.newActivity : 40)));
      executionScore = Math.min(EVALUATION_WEIGHTS.EXECUTION_QUALITY, Math.max(0, Number(eb.executionQuality !== undefined ? eb.executionQuality : 18)));
      continuityScore = Math.min(EVALUATION_WEIGHTS.CONTINUITY, Math.max(0, Number(eb.continuity !== undefined ? eb.continuity : 20)));
      docScore = Math.min(EVALUATION_WEIGHTS.DOCUMENTATION, Math.max(0, Number(eb.documentation !== undefined ? eb.documentation : 15)));
    } else {
      // 1. Approved New Activities (40 Points Max)
      if (act.status === 'Accepted') {
        newActivityScore = EVALUATION_WEIGHTS.NEW_ACTIVITY;
      } else if (act.status === 'Under Review') {
        newActivityScore = 25;
      } else {
        newActivityScore = 0;
      }
      // 2. Execution Quality (20 Points Max)
      let rawRating = null;
      if (ratedSessions.length > 0) {
        const sum = ratedSessions.reduce((acc, s) => acc + Number(s.sessionScore), 0);
        rawRating = Number((sum / ratedSessions.length).toFixed(1));
      } else if (act.supervisorScore !== null && act.supervisorScore !== undefined) {
        rawRating = Number(Number(act.supervisorScore).toFixed(1));
      }
      executionScore = rawRating !== null
        ? Math.round((rawRating / 10) * EVALUATION_WEIGHTS.EXECUTION_QUALITY)
        : act.status === 'Accepted' ? 18 : 12;
      executionScore = Math.min(EVALUATION_WEIGHTS.EXECUTION_QUALITY, Math.max(0, executionScore));
      // 3. Verified Continuity Duration (25 Points Max)
      const daysCount = act.daysActive || 15;
      const rounds = Math.max(1, sessions.length);
      if (rounds >= 3 || daysCount >= 30) {
        continuityScore = 25;
      } else if (rounds === 2 || daysCount >= 14) {
        continuityScore = 20;
      } else if (daysCount >= 7) {
        continuityScore = 15;
      } else {
        continuityScore = 10;
      }
      // 4. Documentation & Data Integrity (15 Points Max)
      docScore = 15;
      if (act.location && typeof act.location.distanceMeters === 'number' && act.location.distanceMeters > 150) {
        docScore -= 5;
      } else if (act.location && act.location.verified === false) {
        docScore -= 5;
      }
      if (act.activity === 'فرشة مجلة' && !act.magazineDate) {
        docScore -= 5;
      }
      if (!act.brands || act.brands.length === 0) {
        docScore -= 5;
      }
      docScore = Math.min(EVALUATION_WEIGHTS.DOCUMENTATION, Math.max(0, docScore));
    }
    const totalWeightedScore = Math.min(
      EVALUATION_WEIGHTS.TOTAL,
      Math.max(0, Math.round(newActivityScore + executionScore + continuityScore + docScore))
    );
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
        newActivity: { score: newActivityScore, max: EVALUATION_WEIGHTS.NEW_ACTIVITY, label: 'الأنشطة الجديدة المعتمدة' },
        executionQuality: { score: executionScore, max: EVALUATION_WEIGHTS.EXECUTION_QUALITY, label: 'جودة التنفيذ الميداني' },
        continuity: { score: continuityScore, max: EVALUATION_WEIGHTS.CONTINUITY, label: 'مدة الاستمرارية المثبتة' },
        documentation: { score: docScore, max: EVALUATION_WEIGHTS.DOCUMENTATION, label: 'الالتزام بالتوثيق وصحة البيانات' }
      }
    };
  }
  static computeOverallRating(act) {
    return this.computeWeightedEvaluation(act);
  }
  /**
   * Evaluates anti-cheat rules and penalty deductions for an activity or follow-up round
   * @param {Object} roundData Input metadata containing photos, location, and coordinator input
   * @returns {Object} Audit result with deductions and disqualification status
   */
  static checkAntiCheatPenalties(roundData = {}) {
    const deductions = [];
    let isDisqualified = false;
    let roundZeroed = false;
    // 1. Duplicate Photo Check
    if (roundData.isDuplicate || roundData.duplicateHashDetected) {
      roundZeroed = true;
      deductions.push({
        code: 'ERR_PHOTO_DUPLICATE',
        points: 15,
        targetPillar: 'documentation',
        label: 'صورة مكررة مرتين'
      });
    }
    // 2. Fake / Non-Camera Image Check
    if (roundData.isFakeCamera || roundData.liveVerified === false) {
      isDisqualified = true;
      deductions.push({
        code: 'ERR_FAKE_CAMERA',
        points: 100,
        targetPillar: 'all',
        label: 'صورة وهمية أو غير ملتقطة بالكاميرا المباشرة'
      });
    }
    // 3. GPS Location Mismatch (>150m)
    const distanceMeters = Number(roundData.distanceMeters || (roundData.location && roundData.location.distanceMeters) || 0);
    if (distanceMeters > 150) {
      deductions.push({
        code: 'ERR_GPS_MISMATCH',
        points: 5,
        targetPillar: 'documentation',
        label: 'تجاوز النطاق الجغرافي للفرع (>150م)',
        distanceMeters
      });
      if (distanceMeters > 500) {
        roundZeroed = true;
      }
    }
    // 4. Poor Image Quality
    if (roundData.poorQuality) {
      const penalty = Math.min(12, Math.max(5, Number(roundData.qualityDeduction) || 8));
      deductions.push({
        code: 'ERR_POOR_QUALITY',
        points: penalty,
        targetPillar: 'executionQuality',
        label: 'ضعف جودة الصورة أو صورة مهزوزة'
      });
    }
    // 5. Inaccurate SKU / Brand Reporting
    if (roundData.skuMismatch) {
      const penalty = Math.min(10, Math.max(5, Number(roundData.skuDeduction) || 5));
      deductions.push({
        code: 'ERR_SKU_MISMATCH',
        points: penalty,
        targetPillar: 'documentation',
        label: 'عدم تطابق الأصناف المسجلة مع الصورة'
      });
    }
    // 6. Neglected Follow-Ups
    if (roundData.neglectedFollowUp) {
      const penalty = Math.min(25, Math.max(10, Number(roundData.continuityDeduction) || 15));
      deductions.push({
        code: 'ERR_NEGLECTED_FOLLOWUP',
        points: penalty,
        targetPillar: 'continuity',
        label: 'إهمال المتابعة الدورية أو فراغ العرض'
      });
    }
    const totalDeductionPoints = deductions.reduce((sum, d) => sum + d.points, 0);
    return {
      isEligible: !isDisqualified && !roundZeroed,
      isDisqualified,
      roundZeroed,
      totalDeductionPoints,
      deductions
    };
  }
  /**
   * Calculates progressive logarithmic Effort & Volume Bonus (up to +5 points)
   * Formula: min(5, round(log2(N + 1) * 1.25))
   * @param {number} approvedRoundsCount Total approved rounds (N)
   * @returns {number} Effort bonus [0 - 5]
   */
  static calculateEffortBonus(approvedRoundsCount = 0) {
    const N = Math.max(0, Number(approvedRoundsCount) || 0);
    if (N === 0) return 0;
    const rawBonus = Math.log2(N + 1) * BAYESIAN_LEADERBOARD_DEFAULTS.BONUS_MULTIPLIER;
    return Math.min(BAYESIAN_LEADERBOARD_DEFAULTS.MAX_EFFORT_BONUS, Math.round(rawBonus));
  }
  /**
   * Computes the Fair Bayesian Volume-Weighted Leaderboard Score
   * Formula:
   *   WeightedBase = ((N * R) + (m * C)) / (N + m)
   *   EffortBonus = min(5, round(log2(N + 1) * 1.25))
   *   FinalScore = min(100, round(WeightedBase + EffortBonus))
   *
   * @param {number} approvedRoundsCount Total approved rounds/activities (N)
   * @param {number} rawAverageScore Raw average of approved scores (R)
   * @param {Object} [options] Overrides for benchmark rounds (m) and prior (C)
   * @returns {Object} Complete mathematical breakdown of the leaderboard score
   */
  static calculateBayesianLeaderboardScore(approvedRoundsCount = 0, rawAverageScore = 0, options = {}) {
    const N = Math.max(0, Number(approvedRoundsCount) || 0);
    const R = Math.max(0, Math.min(100, Number(rawAverageScore) || 0));
    const m = Number(options.m !== undefined ? options.m : BAYESIAN_LEADERBOARD_DEFAULTS.MIN_BENCHMARK_ROUNDS);
    const C = Number(options.C !== undefined ? options.C : BAYESIAN_LEADERBOARD_DEFAULTS.BASELINE_PRIOR_SCORE);
    if (N === 0) {
      return {
        finalScore: 0,
        weightedBase: 0,
        effortBonus: 0,
        rawAverage: 0,
        roundsCount: 0,
        confidenceBenchmark: m,
        baselinePrior: C
      };
    }
    const weightedBase = ((N * R) + (m * C)) / (N + m);
    const effortBonus = this.calculateEffortBonus(N);
    const finalScore = Math.min(100, Math.max(0, Math.round(weightedBase + effortBonus)));
    return {
      finalScore,
      weightedBase: Number(weightedBase.toFixed(2)),
      effortBonus,
      rawAverage: Number(R.toFixed(1)),
      roundsCount: N,
      confidenceBenchmark: m,
      baselinePrior: C
    };
  }
  /**
   * Resolves official ADCO enterprise achievement tier badge
   */
  static resolveTierBadge(score) {
    const num = Number(score) || 0;
    if (num >= 90) return { label: 'ممتاز - فئة ماسية', className: 'badge-success', tierCode: 'DIAMOND' };
    if (num >= 80) return { label: 'جيد جداً - فئة ذهبية', className: 'badge-mint', tierCode: 'GOLD' };
    if (num >= 70) return { label: 'جيد - فئة فضية', className: 'badge-warning', tierCode: 'SILVER' };
    if (num >= 60) return { label: 'مقبول - فئة برونزية', className: 'badge-warning', tierCode: 'BRONZE' };
    return { label: 'قيد التحسين', className: 'badge-danger', tierCode: 'UNDER_IMPROVEMENT' };
  }
  /**
   * Calculates overall profile score for a coordinator across all submitted activities
   */
  static calculateCoordinatorProfileStats(activities, coordinatorId) {
    const userActivities = (activities || []).filter((a) => a.coordinatorId === coordinatorId);
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
if (typeof window !== 'undefined') {
  window.ScoreCalculator = ScoreCalculator;
  window.EVALUATION_WEIGHTS = EVALUATION_WEIGHTS;
  window.BAYESIAN_LEADERBOARD_DEFAULTS = BAYESIAN_LEADERBOARD_DEFAULTS;
}
