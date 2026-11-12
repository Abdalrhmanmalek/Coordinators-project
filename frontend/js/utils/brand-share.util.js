/**
 * ADCO Brand Share Util
 * Multi-brand row multiplication with proportional 1/N brand share.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class BrandShareUtil {
    /**
     * 4. MULTI-BRAND SHARE CALCULATION & ROW MULTIPLICATION (حصة البراند من النشاط)
     * Splits an activity with N selected brands into N separate rows, each with Brand Share = (1 / N)
     */
    static getExpandedBrandRows(activitiesInput = null) {
      const activities = activitiesInput || this.getAllActivities();
      const expandedRows = [];

      activities.forEach((act) => {
        const brandsList = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['غير محدد'];
        const N = brandsList.length;
        const shareRaw = 1 / N;
        const shareDecimal = Number(shareRaw.toFixed(2));
        const sharePct = Math.round(shareRaw * 100);
        const ratingStats = this.computeOverallRating(act);

        brandsList.forEach((singleBrand, brandIdx) => {
          const startDateDisplay = act.activityDate ? (global.formatDateTime ? global.formatDateTime(act.activityDate) : act.activityDate) : (global.formatDateTime ? global.formatDateTime(act.createdAt || act.timestamp) : (act.createdAt || '-'));
          const endDateDisplay = act.isClosed ? (act.endDate || (act.closedAt ? (global.formatDateTime ? global.formatDateTime(act.closedAt) : act.closedAt) : 'تم الإنهاء')) : 'نشط ومستمر';

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
            reviewedAtFormatted: act.reviewedAt ? (global.formatDateTime ? global.formatDateTime(act.reviewedAt) : act.reviewedAt.slice(0, 16).replace('T', ' ')) : (act.status !== 'Under Review' ? '2026-10-31 16:30' : '-'),
            reviewNotes: act.supervisorNotes || '-'
          });
        });
      });

      return expandedRows;
    }
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(BrandShareUtil);
  global.BrandShareUtil = BrandShareUtil;
})(window);
