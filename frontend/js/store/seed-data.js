/**
 * [DEVELOPMENT / OFFLINE DEMO SEED ONLY]
 * This dataset is strictly for client-side demo and offline prototype simulation.
 * In production, all activities are fetched from the ADCO Backend API.
 */
/**
 * ADCO Seed / Demo Activities Dataset
 * Pure data module. Exposed as window.ADCO_SEED_ACTIVITIES.
 * High-resolution realistic retail supermarket shelf & gondola photography.
 */

(function (global) {
  const SEED_ACTIVITIES = [
    {
      id: 'ACT-2026-001',
      coordinatorId: 'ADCO-101',
      coordinatorName: 'أحمد محمود العبد',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع سموحة - الإسكندرية',
      coordinatorBranch: 'الإسكندرية - قطاع وسط',
      brands: ['فلفيتا', 'فييا'],
      products: [
        { brand: 'فلفيتا', skuItem: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر' },
        { brand: 'فييا', skuItem: 'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر' }
      ],
      skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
      activity: 'فرشة مجلة',
      activityType: 'جندولة',
      activityCount: 3,
      displayType: 'فرشة مجلة - جندولة',
      magazineDate: '2026-11-01',
      photoUrl: '../assets/images/fathalla-branch.avif',
      photoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      location: { latitude: 31.2156, longitude: 29.9553, accuracy: 8, address: 'فرع سموحة - الإسكندرية', capturedAt: '2026-10-30 10:15' },
      status: 'Accepted',
      reviewStatus: 'ACCEPTED',
      endStatus: 'OPEN',
      supervisorScore: 8.5,
      overallRating: 8.5,
      ratedSessionsCount: 2,
      supervisorNotes: 'تنفيذ ممتاز وتواجد بارز على الجندولة وتنسيق عبوات فلفيتا وفييا منظم جداً.',
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
          sessionScore: 88,
          scoreBreakdown: {
            newActivity: 36,
            executionQuality: 17,
            continuity: 21,
            documentation: 14
          },
          sessionNotes: 'بداية جيدة وتنسيق مرتب للجندولة وتواجد الأصناف.',
          reviewerName: 'م. هاني شاكر عبد الله',
          reviewedAt: '2026-10-30T18:00:00.000Z',
          brands: ['فلفيتا', 'فييا'],
          products: [
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة مركز نسيم الزهور 1 لتر' },
            { brand: 'فييا', skuItem: 'سائل غسيل أطباق بالليمون الأخضر 1 لتر' }
          ],
          photos: [
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
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
          sessionScore: 94,
          scoreBreakdown: {
            newActivity: 38,
            executionQuality: 19,
            continuity: 23,
            documentation: 14
          },
          sessionNotes: 'تزويد ممتاز للمخزون في المتابعة الثانية ونظافة مميزة للرفوف.',
          reviewerName: 'م. هاني شاكر عبد الله',
          reviewedAt: '2026-10-31T16:30:00.000Z',
          brands: ['فلفيتا', 'فييا'],
          products: [
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة مركز نسيم الزهور 1 لتر' },
            { brand: 'فييا', skuItem: 'سائل غسيل أطباق بالليمون الأخضر 1 لتر' }
          ],
          photos: [
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
              photoHash: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
              sizeKb: 172,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-31 11:40'
            },
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
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
      brands: ['كلوريل', 'ماكسيل ماجيك', 'جلاسي'],
      products: [
        { brand: 'كلوريل', skuItem: 'كلوريل مبيض ومطهر ملابس 1 لتر' },
        { brand: 'ماكسيل ماجيك', skuItem: 'ماكسيل ماجيك منظف أفران 500 مل' },
        { brand: 'جلاسي', skuItem: 'جلاسي ملمع زجاج 600 مل' }
      ],
      skuVariant: 'كلوريل مبيض ومطهر ملابس 1 لتر + ماكسيل ماجيك منظف أفران 500 مل + جلاسي ملمع زجاج 600 مل',
      activity: 'عقد',
      activityType: 'ستاند',
      activityCount: 2,
      displayType: 'عقد - ستاند',
      magazineDate: '',
      photoUrl: '../assets/images/fathalla-branch.avif',
      photoHash: '3a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123',
      location: { latitude: 31.2284, longitude: 29.9482, accuracy: 12, address: 'فرع رشدي - كفر عبده', capturedAt: '2026-10-31 08:30' },
      status: 'Under Review',
      reviewStatus: 'UNDER_REVIEW',
      endStatus: 'OPEN',
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
          brands: ['كلوريل', 'ماكسيل ماجيك', 'جلاسي'],
          products: [
            { brand: 'كلوريل', skuItem: 'كلوريل مبيض ومطهر ملابس 1 لتر' },
            { brand: 'ماكسيل ماجيك', skuItem: 'ماكسيل ماجيك منظف أفران 500 مل' },
            { brand: 'جلاسي', skuItem: 'جلاسي ملمع زجاج 600 مل' }
          ],
          photos: [
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
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
      brands: ['فما', 'ديفا', 'فلفيتا'],
      products: [
        { brand: 'فما', skuItem: 'فما مسحوق غسيل أوتوماتيك 3 كجم' },
        { brand: 'ديفا', skuItem: 'ديفا شاور جل 500 مل' },
        { brand: 'فلفيتا', skuItem: 'فلفيتا معطر أقمشة 1 لتر' }
      ],
      skuVariant: 'فما مسحوق غسيل أوتوماتيك 3 كجم + ديفا شاور جل 500 مل + فلفيتا معطر أقمشة 1 لتر',
      activity: 'مهرجان',
      activityType: 'بوديوم',
      activityCount: 4,
      displayType: 'مهرجان - بوديوم',
      magazineDate: '',
      photoUrl: '../assets/images/fathalla-branch.avif',
      photoHash: '9f8e7d6c5b4a32109876543210fedcba9f8e7d6c5b4a32109876543210fedcba',
      location: { latitude: 31.1921, longitude: 29.9145, accuracy: 6, address: 'فرع محرم بك - قناة السويس', capturedAt: '2026-10-29 14:20' },
      status: 'Accepted',
      reviewStatus: 'ACCEPTED',
      endStatus: 'OPEN',
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
          sessionScore: 92,
          scoreBreakdown: {
            newActivity: 38,
            executionQuality: 18,
            continuity: 22,
            documentation: 14
          },
          sessionNotes: 'بداية قوية للبوديوم وترتيب رائع.',
          reviewerName: 'م. هاني شاكر عبد الله',
          reviewedAt: '2026-10-29T19:00:00.000Z',
          brands: ['فما', 'ديفا', 'فلفيتا'],
          products: [
            { brand: 'فما', skuItem: 'مسحوق غسيل أوتوماتيك 3 كجم' },
            { brand: 'ديفا', skuItem: 'شاور جل 500 مل' },
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة 1 لتر' }
          ],
          photos: [
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
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
          sessionScore: 98,
          scoreBreakdown: {
            newActivity: 40,
            executionQuality: 19,
            continuity: 24,
            documentation: 15
          },
          sessionNotes: 'اكتمال كافة الرفوف واستدامة العرض والتزام تام بالمعايير.',
          reviewerName: 'م. هاني شاكر عبد الله',
          reviewedAt: '2026-10-30T09:15:00.000Z',
          brands: ['فما', 'ديفا', 'فلفيتا'],
          products: [
            { brand: 'فما', skuItem: 'مسحوق غسيل أوتوماتيك 3 كجم' },
            { brand: 'ديفا', skuItem: 'شاور جل 500 مل' },
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة 1 لتر' }
          ],
          photos: [
            {
              photoUrl: '../assets/images/fathalla-branch.avif',
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
  global.ADCO_SEED_ACTIVITIES = [...SEED_ACTIVITIES, ...(global.ADCO_SEED_ACTIVITIES_EXTRA || [])];
})(window);
