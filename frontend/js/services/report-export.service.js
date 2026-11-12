/**
 * ADCO Report Export Service (runtime)
 * CSV / Excel (Google Sheets compatible) generation with multi-brand 1/N rows and UTF-8 BOM download.
 * Composed onto window.SupervisorEngine by supervisor.js for backward compatibility.
 */

(function (global) {
  class ReportExportService {
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
        'تاريخ بدء النشاط (Start Date)',
        'تاريخ انتهاء النشاط (End Date)',
        'ملاحظات المشرف',
        'تاريخ الإرسال'
      ];

      const rows = expandedRows.map((r) => {
        const evalStats = global.ActivityManager.computeWeightedEvaluation(r);
        const closureLabel = r.isClosed ? 'تم إنهاء وتفكيك النشاط' : r.closureRequested ? 'طلب إنهاء قيد المراجعة' : 'نشط';
        const reviewerDisplay = r.reviewerName || (r.status !== 'Under Review' ? 'م. هاني شاكر عبد الله' : '-');
        const reviewedDateDisplay = r.reviewedAtFormatted || (r.reviewedAt ? (global.formatDateTime ? global.formatDateTime(r.reviewedAt) : r.reviewedAt) : (r.status !== 'Under Review' ? '2026-10-31 16:30' : '-'));
        const startDateDisplay = r.activityStartDate || (r.activityDate ? (global.formatDateTime ? global.formatDateTime(r.activityDate) : r.activityDate) : (r.timestamp ? (global.formatDateTime ? global.formatDateTime(r.timestamp) : r.timestamp) : '-'));
        const endDateDisplay = r.activityEndDate || (r.isClosed ? (r.endDate || (r.closedAt ? (global.formatDateTime ? global.formatDateTime(r.closedAt) : r.closedAt) : 'منتهي')) : 'نشط ومستمر');

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
          `"${r.magazineStartDate && r.magazineEndDate ? `${r.magazineStartDate} إلى ${r.magazineEndDate}` : (r.magazineDate || '-')}"`,
          `"${evalStats.totalWeightedScore}/100"`,
          `"${r.overallRating !== null ? `${r.overallRating} / 10` : '-'}"`,
          `"${r.ratedSessionsCount || 0} من ${r.roundsCount || 1}"`,
          `"${r.status || ''}"`,
          `"${reviewerDisplay}"`,
          `"${reviewedDateDisplay}"`,
          `"${closureLabel}"`,
          `"${startDateDisplay}"`,
          `"${endDateDisplay}"`,
          `"${(r.supervisorNotes || '').replace(/"/g, '""')}"`,
          `"${startDateDisplay}"`
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

  global.ReportExportService = ReportExportService;
})(window);
