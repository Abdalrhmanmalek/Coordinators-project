/**
 * ADCO Activity Manager & DynamoDB Connector Engine
 * Implements:
 * - "النشاط" (activity) with conditional "فرشة مجلة" date
 * - "نوع النشاط" (activityType)
 * - "عدد النشاط" (activityCount: 1..10)
 * - Multi-Brand Row Multiplication & Share Calculation (1 / N)
 * - Cumulative Overall Activity Rating (التقييم العام للنشاط) across follow-up rounds
 */

(function (global) {
  const STORAGE_KEY_ACTIVITIES = 'ADCO_ACTIVITIES_DATA_V3';

  const ADCO_CATALOGS = {
    clients: [
      'فتح الله جملة ماركت (Fathalla)',
      'سوبر ماركت زهران (Zahran)',
      'كارفور هايبر ماركت (Carrefour)',
      'أسواق فتح الله - روز (Rose)',
      'مترو ماركت (Metro)',
      'كازيون ماركت (Kazyon)',
      'بيم ماركت (BIM)',
      'سبينيس هايبر ماركت (Spinneys)',
      'أوكازيون ماركت (Okazion)',
      'الفرجاني ماركت (El-Fergany)'
    ],
    branches: [
      'فرع سموحة - الإسكندرية',
      'فرع رشدي - كفر عبده',
      'فرع سيدي جابر - طريق الحرية',
      'فرع محرم بك - قناة السويس',
      'فرع المنتزه - شيراتون',
      'فرع لوران - الكورنيش',
      'فرع العجمي - الهانوفيل',
      'فرع ميامي - جمال عبد الناصر',
      'فرع جليم - سان ستيفانو',
      'فرع برج العرب الجديدة'
    ],
    coordinatorBranches: [
      'الإسكندرية - قطاع وسط',
      'الإسكندرية - قطاع شرق',
      'الإسكندرية - قطاع غرب',
      'برج العرب والساحل الشمالي',
      'قطاع الدلتا والبحيرة'
    ],
    brands: [
      'Velveta (فلفيتا)',
      'Fairy (فيري)',
      'Persil (برسيل)',
      'Pril (بريل)',
      'Clorox (كلوركس)',
      'Downy (داوني)',
      'Harpic (هاربيك)',
      'Oxi (أوكسي)',
      'Dettol (ديتول)',
      'Finish (فينيش)'
    ],
    skus: [
      'فلفيتا معطر أقمشة مركز 1 لتر + فيري ليمون 650 مل',
      'فلفيتا جل غسيل أوتوماتيك 2.5 لتر عرض التوفير',
      'كلوركس جيل مطهر 750 مل برائحة اللافندر',
      'برسيل جيل لافندر 3.9 لتر + داوني 1 لتر هدية',
      'بريل سائل أطباق بالليمون الأخضر عبوة 1 لتر',
      'هاربيك منظف ومطهر تواليت قوة 10x عبوة مزدوجة',
      'أوكسي مسحوق أوتوماتيك 4 كجم نسيم الشرق'
    ],
    // 1. Renamed field "النشاط" options
    activities: [
      'عقد',
      'فرشة مجلة',
      'إضافي',
      'افتتاح فرع جديد',
      'مهرجان',
      'موسمي'
    ],
    // 2. New field "نوع النشاط" options
    activityTypes: [
      'جندولة',
      'دريس اب',
      'سايد جندولة',
      'ستاند',
      'بوديوم',
      'بيلر',
      'كاتمان',
      'سي ثرو',
      'جيفت بوكس',
      'عرض أرضي'
    ]
  };

  const SEED_ACTIVITIES = [
    {
      id: 'ACT-2026-001',
      coordinatorId: 'ADCO-101',
      coordinatorName: 'أحمد محمود العبد',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع سموحة - الإسكندرية',
      coordinatorBranch: 'الإسكندرية - قطاع وسط',
      brands: ['Fairy (فيري)', 'Velveta (فلفيتا)'],
      skuVariant: 'فلفيتا معطر أقمشة مركز 1 لتر + فيري ليمون 650 مل',
      activity: 'فرشة مجلة',
      activityType: 'جندولة',
      activityCount: 3,
      displayType: 'فرشة مجلة - جندولة',
      magazineDate: '2026-11-01',
      photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
      photoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      location: { latitude: 31.2156, longitude: 29.9553, accuracy: 8, address: 'فرع سموحة - الإسكندرية', capturedAt: '2026-10-30 10:15' },
      status: 'Accepted',
      supervisorScore: 8.5,
      overallRating: 8.5,
      ratedSessionsCount: 2,
      supervisorNotes: 'تنفيذ ممتاز وتواجد بارز على الجندولة وتنسيق عبوات فلفيتا وفيري منظم جداً.',
      reviewerName: 'م. هاني شاكر عبد الله',
      reviewedAt: '2026-10-31T16:30:00.000Z',
      timestamp: '2026-10-30T10:15:00.000Z',
      roundsCount: 2,
      totalPhotos: 3,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-10-30 10:15',
          uploadedBy: 'أحمد محمود العبد',
          uploadedById: 'ADCO-101',
          reviewStatus: 'Accepted',
          sessionScore: 8,
          sessionNotes: 'بداية جيدة وتنسيق مرتب للجندولة.',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
              photoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              sizeKb: 184,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-30 10:15'
            }
          ]
        },
        {
          roundNumber: 2,
          roundTitle: 'متابعة رقم 2',
          timestamp: '2026-10-31 11:40',
          uploadedBy: 'أحمد محمود العبد',
          uploadedById: 'ADCO-101',
          reviewStatus: 'Accepted',
          sessionScore: 9,
          sessionNotes: 'تزويد ممتاز للمخزون في المتابعة الثانية.',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=720&q=80',
              photoHash: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
              sizeKb: 172,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-31 11:40'
            },
            {
              photoUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=720&q=80',
              photoHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
              sizeKb: 190,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-31 11:41'
            }
          ]
        }
      ]
    },
    {
      id: 'ACT-2026-002',
      coordinatorId: 'ADCO-101',
      coordinatorName: 'أحمد محمود العبد',
      client: 'سوبر ماركت زهران (Zahran)',
      branch: 'فرع رشدي - كفر عبده',
      coordinatorBranch: 'الإسكندرية - قطاع شرق',
      brands: ['Clorox (كلوركس)', 'Harpic (هاربيك)', 'Pril (بريل)'],
      skuVariant: 'كلوركس جيل مطهر 750 مل برائحة اللافندر',
      activity: 'عقد',
      activityType: 'ستاند',
      activityCount: 2,
      displayType: 'عقد - ستاند',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=720&q=80',
      photoHash: '3a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123',
      location: { latitude: 31.2284, longitude: 29.9482, accuracy: 12, address: 'فرع رشدي - كفر عبده', capturedAt: '2026-10-31 08:30' },
      status: 'Under Review',
      supervisorScore: null,
      overallRating: null,
      ratedSessionsCount: 0,
      supervisorNotes: '',
      reviewerName: null,
      reviewedAt: null,
      timestamp: '2026-10-31T08:30:00.000Z',
      roundsCount: 1,
      totalPhotos: 1,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-10-31 08:30',
          uploadedBy: 'أحمد محمود العبد',
          uploadedById: 'ADCO-101',
          reviewStatus: 'Under Review',
          sessionScore: null,
          sessionNotes: '',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=720&q=80',
              photoHash: '3a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123',
              sizeKb: 168,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-31 08:30'
            }
          ]
        }
      ]
    },
    {
      id: 'ACT-2026-003',
      coordinatorId: 'ADCO-102',
      coordinatorName: 'سارة طارق إبراهيم',
      client: 'كارفور هايبر ماركت (Carrefour)',
      branch: 'فرع محرم بك - قناة السويس',
      coordinatorBranch: 'الإسكندرية - قطاع غرب',
      brands: ['Persil (برسيل)', 'Downy (داوني)', 'Velveta (فلفيتا)'],
      skuVariant: 'برسيل جيل لافندر 3.9 لتر + داوني 1 لتر هدية',
      activity: 'مهرجان',
      activityType: 'بوديوم',
      activityCount: 4,
      displayType: 'مهرجان - بوديوم',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=720&q=80',
      photoHash: '9f8e7d6c5b4a32109876543210fedcba9f8e7d6c5b4a32109876543210fedcba',
      location: { latitude: 31.1921, longitude: 29.9145, accuracy: 6, address: 'فرع محرم بك - قناة السويس', capturedAt: '2026-10-29 14:20' },
      status: 'Accepted',
      supervisorScore: 9.5,
      overallRating: 9.5,
      ratedSessionsCount: 2,
      supervisorNotes: 'أداء نموذجي وتنسيق بوديوم المهرجان بأعلى جودة.',
      reviewerName: 'م. هاني شاكر عبد الله',
      reviewedAt: '2026-10-30T09:15:00.000Z',
      timestamp: '2026-10-29T14:20:00.000Z',
      roundsCount: 2,
      totalPhotos: 2,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-10-29 14:20',
          uploadedBy: 'سارة طارق إبراهيم',
          uploadedById: 'ADCO-102',
          reviewStatus: 'Accepted',
          sessionScore: 9,
          sessionNotes: 'بداية قوية للبوديوم.',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=720&q=80',
              photoHash: '9f8e7d6c5b4a32109876543210fedcba9f8e7d6c5b4a32109876543210fedcba',
              sizeKb: 195,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-29 14:20'
            }
          ]
        },
        {
          roundNumber: 2,
          roundTitle: 'متابعة رقم 2',
          timestamp: '2026-10-30 16:10',
          uploadedBy: 'سارة طارق إبراهيم',
          uploadedById: 'ADCO-102',
          reviewStatus: 'Accepted',
          sessionScore: 10,
          sessionNotes: 'اكتمال كافة الرفوف واستدامة العرض.',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
              photoHash: '1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
              sizeKb: 182,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-30 16:10'
            }
          ]
        }
      ]
    }
  ];

  class ActivityManager {
    static getAllActivities() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
        if (!raw) {
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
          return SEED_ACTIVITIES;
        }
        return JSON.parse(raw);
      } catch {
        return SEED_ACTIVITIES;
      }
    }

    static saveAllActivities(activities) {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
      } catch {}
    }

    static getActivityById(id) {
      const all = this.getAllActivities();
      return all.find((a) => a.id === id) || null;
    }

    static getActivitiesForUser(coordinatorId) {
      const all = this.getAllActivities();
      return all.filter((a) => a.coordinatorId === coordinatorId);
    }

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
            reviewerName: act.reviewerName || (act.status !== 'Under Review' ? 'م. هاني شاكر عبد الله' : '-'),
            reviewedAtFormatted: act.reviewedAt ? (global.formatDateTime ? global.formatDateTime(act.reviewedAt) : act.reviewedAt.slice(0, 16).replace('T', ' ')) : (act.status !== 'Under Review' ? '2026-10-31 16:30' : '-'),
            reviewNotes: act.supervisorNotes || '-'
          });
        });
      });

      return expandedRows;
    }

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
      const magazineDateVal = activityVal === 'فرشة مجلة' ? payload.magazineDate || '' : '';

      const defaultLoc = {
        latitude: Number((31.2001 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        longitude: Number((29.9187 + (Math.random() - 0.5) * 0.03).toFixed(5)),
        accuracy: 8,
        address: payload.branch || 'الإسكندرية',
        capturedAt: formattedNow
      };
      const locationData = payload.location || defaultLoc;

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
        map[cid].totalScore = Math.round(map[cid].weightedScoresSum / map[cid].submissionsCount);
      });

      const rankingList = Object.values(map).sort((a, b) => b.totalScore - a.totalScore);
      return rankingList.map((item, idx) => ({
        ...item,
        rank: `#${idx + 1}`
      }));
    }
  }

  global.ADCO_CATALOGS = ADCO_CATALOGS;
  global.ActivityManager = ActivityManager;
})(window);
