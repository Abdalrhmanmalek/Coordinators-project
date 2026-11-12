/**
 * ADCO Activity Lifecycle Service
 * Status transitions: closure requests, direct close, closure decisions, date updates.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class ActivityLifecycleService {
    /**
     * Request Activity Completion (طلب إنهاء النشاط من المنسق)
     * Coordinator requests closure with specific reason: "انتهاء المدة" or "انتهاء بطلب من العميل"
     */
    static async requestActivityCompletion(activityId, reasonType = 'انتهاء المدة', userNotes = '') {
      await new Promise((r) => setTimeout(r, 200));
      const all = this.getAllActivities();
      const index = all.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error('لم يتم العثور على بطاقة النشاط.');
      }

      const act = all[index];
      act.closureRequested = true;
      act.closureRequestedAt = new Date().toISOString();
      act.closureReasonType = reasonType; // 'انتهاء المدة' أو 'انتهاء بطلب من العميل'
      act.closureNotes = userNotes ? `${reasonType} (${userNotes})` : reasonType;

      all[index] = act;
      this.saveAllActivities(all);

      return {
        success: true,
        activity: act
      };
    }

    /**
     * Supervisor Direct Activity Closure (إنهاء فوري مباشر من المشرف دون انتظار موافقة أي شخص)
     */
    static async directCloseActivity(activityId, supervisorFeedback = 'تم إنهاء وتفكيك النشاط بقرار مباشر من المشرف') {
      await new Promise((r) => setTimeout(r, 200));
      const all = this.getAllActivities();
      const index = all.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error('لم يتم العثور على بطاقة النشاط.');
      }

      const act = all[index];
      act.isClosed = true;
      act.closedAt = new Date().toISOString();
      act.endDate = global.formatDateTime ? global.formatDateTime(act.closedAt) : act.closedAt;
      act.closureRequested = false;
      act.closureStatus = 'COMPLETED';
      act.closureReasonType = act.closureReasonType || 'قرار إداري مباشر من المشرف';
      act.closureSupervisorFeedback = supervisorFeedback || 'تم إنهاء وتفكيك النشاط بقرار مباشر من المشرف.';

      all[index] = act;
      this.saveAllActivities(all);

      return {
        success: true,
        activity: act
      };
    }

    /**
     * Supervisor processes Activity Closure Request
     */
    static async processClosureRequest(activityId, decision, supervisorFeedback = '') {
      await new Promise((r) => setTimeout(r, 200));
      const all = this.getAllActivities();
      const index = all.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error('لم يتم العثور على بطاقة النشاط.');
      }

      const act = all[index];

      // Requirement 8: Block acceptance if there is a pending review in the activity
      if (decision === 'COMPLETED') {
        const hasPendingReview =
          act.status === 'Under Review' ||
          (Array.isArray(act.followUpHistory) && act.followUpHistory.some((s) => s.reviewStatus === 'Under Review' || s.sessionScore === null));

        if (hasPendingReview) {
          throw new Error('لا يمكن اعتماد إنهاء النشاط: توجد جولات متابعة أو تقييمات قيد المراجعة لم يتم فحصها واعتمادها بعد. يرجى إتمام مراجعة النشاط وتقييمه أولاً.');
        }

        act.isClosed = true;
        act.closedAt = new Date().toISOString();
        act.endDate = global.formatDateTime ? global.formatDateTime(act.closedAt) : act.closedAt;
      }

      act.closureRequested = false;
      act.closureStatus = decision; // 'COMPLETED' or 'REJECTED'
      act.closureSupervisorFeedback = supervisorFeedback;

      all[index] = act;
      this.saveAllActivities(all);

      return {
        success: true,
        activity: act
      };
    }

    /**
     * Supervisor updates Activity Date anytime
     */
    static updateActivityDate(activityId, newDate) {
      const all = this.getAllActivities();
      const index = all.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error('لم يتم العثور على بطاقة النشاط.');
      }
      const act = all[index];
      act.activityDate = newDate;
      act.startDate = newDate;
      act.activityDateFormatted = global.formatDateTime ? global.formatDateTime(newDate) : newDate;
      all[index] = act;
      this.saveAllActivities(all);
      return {
        success: true,
        activity: act
      };
    }
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(ActivityLifecycleService);
  global.ActivityLifecycleService = ActivityLifecycleService;
})(window);
