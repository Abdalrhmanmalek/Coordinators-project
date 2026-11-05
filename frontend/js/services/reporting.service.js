/**
 * ADCO Field Operations System - Reporting Service
 * Single Responsibility: Data reporting, analytics metrics calculation, CSV / Excel spreadsheet exports, and leaderboard rankings
 */

import { ActivityService } from './activity.service.js';
import { ScoreCalculator } from '../utils/score-calculator.js';

export class ReportingService {
  /**
   * Generates CSV file from expanded brand rows with UTF-8 BOM
   */
  static exportToCSV(customRows = null) {
    const expandedRows = customRows || ActivityService.getExpandedBrandRows();
    const headers = [
      'كود النشاط (Activity ID)',
      'اسم المنسق (Coordinator)',
      'القطاع التابع له المنسق',
      'العميل (Client)',
      'الفرع (Branch)',
      'عدد النشاط',
      'العلامة التجارية (Brand)',
      'حصة البراند من العرض (Brand Share)',
      'المنتج المروج (SKU)',
      'النشاط',
      'نوع النشاط',
      'تاريخ بداية المجلة',
      'تاريخ نهاية المجلة',
      'التقييم الشامل المعتمد (من 100)',
      'متوسط تقييم النشاط (Overall Rating)',
      'عدد المتابعات الموثقة',
      'الحالة (Status)',
      'اسم المشرف المراجع (Reviewer)',
      'تاريخ المراجعة (Review Date)',
      'حالة إنهاء النشاط',
      'تاريخ بدء النشاط (Start Date)',
      'تاريخ انتهاء النشاط (End Date)',
      'ملاحظات المشرف'
    ];

    const rows = expandedRows.map((r) => [
      `"${r.id || ''}"`,
      `"${r.coordinatorName || ''}"`,
      `"${r.coordinatorBranch || r.branch || ''}"`,
      `"${r.client || ''}"`,
      `"${r.branch || ''}"`,
      r.activityCount || 1,
      `"${r.singleBrand || ''}"`,
      `"${r.brandShareFormatted || '1.00 (100%)'}"`,
      `"${r.skuVariant || ''}"`,
      `"${r.activity || ''}"`,
      `"${r.activityType || ''}"`,
      `"${r.magazineStartDate || ''}"`,
      `"${r.magazineEndDate || ''}"`,
      `"${r.overallRatingBadge || ''}"`,
      r.overallRating || 0,
      r.ratedSessionsCount || 1,
      `"${r.status || ''}"`,
      `"${r.reviewerName || ''}"`,
      `"${r.reviewedAtFormatted || ''}"`,
      `"${r.isClosed ? 'منتهي ومفكك' : r.closureRequested ? 'طلب إنهاء قيد المراجعة' : 'نشط ومستمر'}"`,
      `"${r.activityStartDate || ''}"`,
      `"${r.activityEndDate || ''}"`,
      `"${(r.supervisorNotes || r.reviewNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ADCO_Field_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Calculates dashboard analytics metrics
   */
  static getAnalyticsMetrics(activities = null) {
    const list = activities || ActivityService.getAllActivities();
    const total = list.length;
    const accepted = list.filter((a) => a.status === 'Accepted').length;
    const underReview = list.filter((a) => a.status === 'Under Review').length;
    const rejected = list.filter((a) => a.status === 'Rejected').length;
    const closed = list.filter((a) => a.isClosed).length;
    const closurePending = list.filter((a) => a.closureRequested).length;

    let scoreSum = 0;
    list.forEach((a) => {
      scoreSum += ScoreCalculator.computeWeightedEvaluation(a).totalWeightedScore;
    });

    const avgScore = total > 0 ? Math.round(scoreSum / total) : 0;

    return {
      total,
      accepted,
      underReview,
      rejected,
      closed,
      closurePending,
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      averageScore: avgScore
    };
  }

  /**
   * Generates dynamic leaderboard rankings across coordinators
   */
  static getLeaderboard(activities = null) {
    const list = activities || ActivityService.getAllActivities();
    const map = {};

    list.forEach((act) => {
      const cid = act.coordinatorId || 'ADCO-101';
      if (!map[cid]) {
        map[cid] = {
          coordinatorId: cid,
          coordinatorName: act.coordinatorName || 'منسق أدكو',
          branch: act.branch || 'الإسكندرية',
          submissionsCount: 0,
          acceptedCount: 0,
          weightedScoresSum: 0,
          totalScore: 0
        };
      }

      map[cid].submissionsCount += 1;
      const stats = ScoreCalculator.computeWeightedEvaluation(act);
      if (act.status === 'Accepted') map[cid].acceptedCount += 1;
      map[cid].weightedScoresSum += stats.totalWeightedScore;
      map[cid].totalScore = Math.round(map[cid].weightedScoresSum / map[cid].submissionsCount);
    });

    const sorted = Object.values(map).sort((a, b) => b.totalScore - a.totalScore);
    return sorted.map((item, idx) => ({
      ...item,
      rank: `#${idx + 1}`,
      tier: ScoreCalculator.resolveTierBadge(item.totalScore).label
    }));
  }
}

if (typeof window !== 'undefined') {
  window.ReportingService = ReportingService;
}
