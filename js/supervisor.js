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
    static async reviewActivity(activityId, status, score, notes, targetRoundNumber = null, evaluationBreakdown = null, reviewerUser = null) {
      await new Promise((r) => setTimeout(r, 300));
      const all = global.ActivityManager.getAllActivities();
      const target = all.find((a) => a.id === activityId);
      if (!target) {
        throw new Error('لم يتم العثور على بطاقة النشاط المحددة.');
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

    /**
     * Export Multi-Brand Expanded Rows to CSV (Excel UTF-8 BOM)
     * Splits an activity with N brands into N separate rows with Brand Share = (1 / N)
     */
    static exportToCSV(customRows = null) {
      const expandedRows = customRows || global.ActivityManager.getExpandedBrandRows();
      const headers = [
        'رقم البطاقة (Activity ID)',
        'اسم المنسق (Coordinator)',
        'الرقم الوظيفي للمنسق',
        'العميل (Client)',
        'الفرع (Branch)',
        'قطاع المنسق',
        'العلامة التجارية (Brand)',
        'حصة البراند من النشاط (Brand Share)',
        'المنتج المحدد (SKU)',
        'النشاط',
        'نوع النشاط',
        'عدد النشاط',
        'تاريخ إصدار المجلة',
        'التقييم الشامل الموزون (من 100)',
        'التقييم العام للنشاط (Overall Rating)',
        'عدد المتابعات المقيّمة',
        'الحالة (Status)',
        'اسم المشرف المراجع (Reviewer)',
        'تاريخ المراجعة (Review Date)',
        'حالة إنهاء النشاط',
        'ملاحظات المشرف',
        'تاريخ الإرسال'
      ];

      const rows = expandedRows.map((r) => {
        const evalStats = global.ActivityManager.computeWeightedEvaluation(r);
        const closureLabel = r.isClosed ? 'تم إنهاء وتفكيك النشاط' : r.closureRequested ? 'طلب إنهاء قيد المراجعة' : 'نشط';
        const reviewerDisplay = r.reviewerName || (r.status !== 'Under Review' ? 'م. هاني شاكر عبد الله' : '-');
        const reviewedDateDisplay = r.reviewedAtFormatted || (r.reviewedAt ? (global.formatDateTime ? global.formatDateTime(r.reviewedAt) : r.reviewedAt) : (r.status !== 'Under Review' ? '2026-10-31 16:30' : '-'));

        return [
          `"${r.id}"`,
          `"${r.coordinatorName || ''}"`,
          `"${r.coordinatorId || ''}"`,
          `"${r.client || ''}"`,
          `"${r.branch || ''}"`,
          `"${r.coordinatorBranch || ''}"`,
          `"${r.singleBrand || ''}"`,
          `"${r.brandShareDecimal}"`,
          `"${r.skuVariant || ''}"`,
          `"${r.activity || '-'}"`,
          `"${r.activityType || '-'}"`,
          `"${r.activityCount || 1}"`,
          `"${r.magazineDate || '-'}"`,
          `"${evalStats.totalWeightedScore}/100"`,
          `"${r.overallRating !== null ? `${r.overallRating} / 10` : '-'}"`,
          `"${r.ratedSessionsCount || 0} من ${r.roundsCount || 1}"`,
          `"${r.status || ''}"`,
          `"${reviewerDisplay}"`,
          `"${reviewedDateDisplay}"`,
          `"${closureLabel}"`,
          `"${(r.supervisorNotes || '').replace(/"/g, '""')}"`,
          `"${new Date(r.timestamp).toLocaleString('ar-EG')}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ADCO_MultiBrand_Sheet_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  global.SupervisorEngine = SupervisorEngine;
})(window);
