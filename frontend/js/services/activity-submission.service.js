/**
 * ADCO Activity Submission Service
 * Create activity, append follow-up rounds and sync offline queue.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class ActivitySubmissionService {
    /**
     * Submit a new Activity Card with "النشاط", "نوع النشاط", "عدد النشاط", and conditional "تاريخ إصدار المجلة"
     */
    static async submitActivity(payload) {
      const activityId = `ACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();
      const formattedNow = global.formatDateTime ? global.formatDateTime(nowIso) : nowIso.slice(0, 16).replace('T', ' ');

      const initialPhotos =
        payload.initialPhotos && payload.initialPhotos.length > 0
          ? payload.initialPhotos
          : [
              {
                photoUrl: payload.photoUrl,
                photoHash: payload.photoHash,
                sizeKb: payload.sizeKb || 175,
                width: payload.width || 1280,
                height: payload.height || 720,
                capturedAt: formattedNow
              }
            ];

      const activityVal = payload.activity || 'عقد';
      const activityTypeVal = payload.activityType || 'جندولة';
      const activityCountVal = Math.max(1, Math.min(10, Number(payload.activityCount) || 1));
      const magStartVal = activityVal === 'فرشة مجلة' ? (payload.magazineStartDate || payload.magazineDate || '') : '';
      const magEndVal = activityVal === 'فرشة مجلة' ? (payload.magazineEndDate || '') : '';
      const magazineDateVal = magStartVal ? (magEndVal ? `${magStartVal} إلى ${magEndVal}` : magStartVal) : '';
      const actDate = payload.activityDate ? payload.activityDate : nowIso;
      const formattedActDate = global.formatDateTime ? global.formatDateTime(actDate) : actDate;

      const defaultLoc = {
        latitude: Number((31.2001 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        longitude: Number((29.9187 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        accuracy: 8,
        address: payload.branch || 'الإسكندرية',
        capturedAt: formattedNow
      };
      const locationData = payload.location || defaultLoc;

      // Automated GPS Proximity Validation (Haversine distance <= 150m from registered branch)
      const proximityCheck = this.validateBranchProximity(
        payload.branch,
        locationData,
        payload.maxBranchProximityMeters || ADCO_CATALOGS.maxBranchProximityMeters || 150
      );
      if (!proximityCheck.isValid) {
        throw new Error(proximityCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
      }
      locationData.distanceFromBranchMeters = proximityCheck.distanceMeters;
      locationData.proximityVerified = true;

      const newRecord = {
        id: activityId,
        coordinatorId: payload.coordinatorId,
        coordinatorName: payload.coordinatorName,
        client: payload.client,
        branch: payload.branch,
        coordinatorBranch: payload.coordinatorBranch,
        brands: payload.brands || [],
        skuVariant: payload.skuVariant,
        activity: activityVal,
        activityType: activityTypeVal,
        activityCount: activityCountVal,
        displayType: `${activityVal} - ${activityTypeVal}`,
        magazineDate: magazineDateVal,
        magazineStartDate: magStartVal,
        magazineEndDate: magEndVal,
        products: Array.isArray(payload.products) ? payload.products : [],
        activityDate: actDate,
        startDate: actDate,
        activityDateFormatted: formattedActDate,
        endDate: null,
        isClosed: false,
        photoUrl: initialPhotos[0].photoUrl,
        photoHash: initialPhotos[0].photoHash,
        initialPhotos: initialPhotos,
        location: locationData,
        status: 'Under Review',
        supervisorScore: null,
        overallRating: null,
        ratedSessionsCount: 0,
        supervisorNotes: '',
        reviewerName: null,
        reviewedAt: null,
        timestamp: nowIso,
        roundsCount: 1,
        totalPhotos: initialPhotos.length,
        followUpHistory: [
          {
            roundNumber: 1,
            roundTitle: 'التوثيق التأسيسي (جولة 1)',
            timestamp: formattedNow,
            uploadedBy: payload.coordinatorName,
            uploadedById: payload.coordinatorId,
            reviewStatus: 'Under Review',
            sessionScore: null,
            sessionNotes: '',
            location: locationData,
            photos: initialPhotos
          }
        ]
      };

      if (!navigator.onLine) {
        await global.queueOfflineItem(newRecord);
        return { success: true, offline: true, record: newRecord };
      }

      await new Promise((r) => setTimeout(r, 350));
      const all = this.getAllActivities();
      all.unshift(newRecord);
      this.saveAllActivities(all);

      return { success: true, offline: false, record: newRecord };
    }

    /**
     * Append Follow-up Photo Session (متابعة بالصور)
     */
    static async addFollowUpPhotos(activityId, processedPhotos, user, location = null) {
      await new Promise((r) => setTimeout(r, 300));
      const all = this.getAllActivities();
      const index = all.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error('لم يتم العثور على بطاقة النشاط لإضافة المتابعة.');
      }

      const act = all[index];
      if (!Array.isArray(act.followUpHistory)) {
        act.followUpHistory = [];
      }

      const nextRoundNumber = act.followUpHistory.length + 1;
      const roundTitle = nextRoundNumber === 1 ? 'التوثيق التأسيسي (جولة 1)' : `متابعة رقم ${nextRoundNumber}`;
      const timestamp = global.formatDateTime ? global.formatDateTime(new Date()) : new Date().toISOString();

      const sessionLocation = location || act.location || {
        latitude: Number((31.2001 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        longitude: Number((29.9187 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        accuracy: 10,
        address: act.branch || 'الإسكندرية',
        capturedAt: timestamp
      };

      // Automated GPS Proximity Validation on follow-up photo upload
      const proximityCheck = this.validateBranchProximity(
        act.branch,
        sessionLocation,
        ADCO_CATALOGS.maxBranchProximityMeters || 150
      );
      if (!proximityCheck.isValid) {
        throw new Error(proximityCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
      }
      sessionLocation.distanceFromBranchMeters = proximityCheck.distanceMeters;
      sessionLocation.proximityVerified = true;

      const newSession = {
        roundNumber: nextRoundNumber,
        roundTitle,
        timestamp,
        uploadedBy: user ? user.fullName : act.coordinatorName,
        uploadedById: user ? user.employeeId : act.coordinatorId,
        reviewStatus: 'Under Review',
        sessionScore: null,
        sessionNotes: '',
        location: sessionLocation,
        photos: processedPhotos
      };

      act.followUpHistory.push(newSession);
      act.roundsCount = act.followUpHistory.length;
      act.totalPhotos = act.followUpHistory.reduce((sum, s) => sum + (s.photos ? s.photos.length : 0), 0);
      act.location = sessionLocation;

      if (processedPhotos.length > 0) {
        const latest = processedPhotos[processedPhotos.length - 1];
        act.photoUrl = latest.photoUrl;
        act.photoHash = latest.photoHash;
      }

      // Recalculate cumulative rating
      const ratingStats = this.computeOverallRating(act);
      act.overallRating = ratingStats.overallRating;
      act.ratedSessionsCount = ratingStats.ratedCount;

      all[index] = act;
      this.saveAllActivities(all);

      return {
        updatedActivity: act,
        newSession
      };
    }

    static async syncOfflineSubmissions() {
      if (!navigator.onLine) return 0;
      const pending = await global.getOfflineQueue();
      if (pending.length === 0) return 0;

      const all = this.getAllActivities();
      for (const item of pending) {
        const localId = item.id;
        delete item.queuedAt;
        all.unshift(item);
        await global.removeOfflineItem(localId);
      }
      this.saveAllActivities(all);
      return pending.length;
    }
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(ActivitySubmissionService);
  global.ActivitySubmissionService = ActivitySubmissionService;
})(window);
