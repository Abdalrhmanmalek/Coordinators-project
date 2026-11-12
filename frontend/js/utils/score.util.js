/**
 * ADCO 100-Point Weighted Score Util
 * Weighted evaluation (40/20/25/15), overall rating and leaderboard ranking.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class ScoreUtil {
    /**
     * 5. OFFICIAL EVALUATION CRITERIA & SCORE WEIGHTS (إجمالي 100 نقطة)
     * - الأنشطة الجديدة المعتمدة: 40 نقطة
     * - جودة التنفيذ: 20 نقطة
     * - مدة الاستمرارية المثبتة: 25 نقطة
     * - الالتزام بالتوثيق وصحة البيانات: 15 نقطة
     * الإجمالي: 100 نقطة
     */
    static computeWeightedEvaluation(act) {
      const sessions = Array.isArray(act.followUpHistory) ? act.followUpHistory : [];
      const ratedSessions = sessions.filter(
        (s) => s.sessionScore !== undefined && s.sessionScore !== null && !isNaN(Number(s.sessionScore))
      );

      // Check if supervisor has explicitly set evaluation breakdown numbers
      let newActivityScore, executionScore, continuityScore, docScore;

      if (act.evaluationBreakdown) {
        const eb = act.evaluationBreakdown;
        newActivityScore = Math.min(40, Math.max(0, Number(eb.newActivity !== undefined ? eb.newActivity : 40)));
        executionScore = Math.min(20, Math.max(0, Number(eb.executionQuality !== undefined ? eb.executionQuality : 18)));
        continuityScore = Math.min(25, Math.max(0, Number(eb.continuity !== undefined ? eb.continuity : 20)));
        docScore = Math.min(15, Math.max(0, Number(eb.documentation !== undefined ? eb.documentation : 15)));
      } else {
        // 1. الأنشطة الجديدة المعتمدة (40 نقطة)
        newActivityScore = act.status === 'Accepted' ? 40 : act.status === 'Under Review' ? 25 : 0;

        // 2. جودة التنفيذ (20 نقطة)
        let rawRating = null;
        if (ratedSessions.length > 0) {
          const sum = ratedSessions.reduce((acc, s) => acc + Number(s.sessionScore), 0);
          rawRating = Number((sum / ratedSessions.length).toFixed(1));
        } else if (act.supervisorScore !== null && act.supervisorScore !== undefined) {
          rawRating = Number(Number(act.supervisorScore).toFixed(1));
        }
        executionScore = rawRating !== null ? Number(((rawRating / 10) * 20).toFixed(1)) : 16;

        // 3. مدة الاستمرارية المثبتة (25 نقطة)
        const rounds = Math.max(1, sessions.length);
        continuityScore = rounds >= 3 ? 25 : rounds === 2 ? 20 : 15;

        // 4. الالتزام بالتوثيق وصحة البيانات (15 نقطة)
        docScore = 15;
        if (act.activity === 'فرشة مجلة' && !act.magazineDate) docScore -= 5;
        if (!act.brands || act.brands.length === 0) docScore -= 5;
      }

      // Total Weighted Score (Out of 100)
      const totalWeightedScore = Math.min(100, Math.round(newActivityScore + executionScore + continuityScore + docScore));
      const overallRatingTen = Number(((executionScore / 20) * 10).toFixed(1));
      const badgeText = `التقييم الشامل: ${totalWeightedScore}/100 نقطة`;

      return {
        overallRating: overallRatingTen,
        totalWeightedScore,
        ratedCount: ratedSessions.length,
        totalSessions: Math.max(1, sessions.length),
        badgeText,
        breakdown: {
          newActivity: { score: newActivityScore, max: 40, label: 'الأنشطة الجديدة المعتمدة' },
          executionQuality: { score: executionScore, max: 20, label: 'جودة التنفيذ' },
          continuity: { score: continuityScore, max: 25, label: 'مدة الاستمرارية المثبتة' },
          documentation: { score: docScore, max: 15, label: 'الالتزام بالتوثيق وصحة البيانات' }
        }
      };
    }

    static computeOverallRating(act) {
      return this.computeWeightedEvaluation(act);
    }

    static getLeaderboardData() {
      const activities = this.getAllActivities();
      const map = {};

      activities.forEach((act) => {
        const cid = act.coordinatorId;
        if (!map[cid]) {
          map[cid] = {
            coordinatorId: cid,
            name: act.coordinatorName,
            branch: act.coordinatorBranch || 'الإسكندرية',
            acceptedCount: 0,
            totalScore: 0,
            submissionsCount: 0,
            weightedScoresSum: 0
          };
        }
        map[cid].submissionsCount += 1;
        const stats = this.computeWeightedEvaluation(act);
        if (act.status === 'Accepted') {
          map[cid].acceptedCount += 1;
        }
        map[cid].weightedScoresSum += stats.totalWeightedScore;
      });

      // Apply Bayesian Volume-Weighted Leaderboard Formula (docs/evaluation.md)
      const m = 5; // Benchmark rounds
      const C = 70; // Baseline prior score
      Object.values(map).forEach((coord) => {
        const N = coord.submissionsCount;
        const rawAvg = N > 0 ? coord.weightedScoresSum / N : 0;
        const weightedBase = ((N * rawAvg) + (m * C)) / (N + m);
        const effortBonus = Math.min(5, Math.round(Math.log2(N + 1) * 1.25));
        coord.rawAverage = Math.round(rawAvg);
        coord.effortBonus = effortBonus;
        coord.totalScore = Math.min(100, Math.max(0, Math.round(weightedBase + effortBonus)));
      });

      const rankingList = Object.values(map).sort((a, b) => b.totalScore - a.totalScore);
      return rankingList.map((item, idx) => ({
        ...item,
        rank: `#${idx + 1}`
      }));
    }
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(ScoreUtil);
  global.ScoreUtil = ScoreUtil;
})(window);
