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
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
      photoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      location: { latitude: 31.2156, longitude: 29.9553, accuracy: 8, address: 'فرع سموحة - الإسكندرية', capturedAt: '2026-10-30 10:15' },
      status: 'Accepted',
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
              photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
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
              photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
              photoHash: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
              sizeKb: 172,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-31 11:40'
            },
            {
              photoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
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
      photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
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
          brands: ['كلوريل', 'ماكسيل ماجيك', 'جلاسي'],
          products: [
            { brand: 'كلوريل', skuItem: 'كلوريل مبيض ومطهر ملابس 1 لتر' },
            { brand: 'ماكسيل ماجيك', skuItem: 'ماكسيل ماجيك منظف أفران 500 مل' },
            { brand: 'جلاسي', skuItem: 'جلاسي ملمع زجاج 600 مل' }
          ],
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
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
      photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80',
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
              photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80',
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
              photoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
              photoHash: '1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
              sizeKb: 182,
              width: 1280,
              height: 720,
              capturedAt: '2026-10-30 16:10'
            }
          ]
        }
      ]
    },
    {
      id: 'ACT-2026-004',
      coordinatorId: 'ADCO-102',
      coordinatorName: 'سارة طارق إبراهيم',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع لوران - الكورنيش',
      coordinatorBranch: 'الإسكندرية - قطاع شرق',
      brands: ['سبيد', 'جلاسي'],
      products: [
        { brand: 'سبيد', skuItem: 'سبيد مبيد حشرات طائرة وزاحفة 400 مل' },
        { brand: 'جلاسي', skuItem: 'جلاسي ملمع زجاج ومرايا 600 مل' }
      ],
      skuVariant: 'سبيد مبيد حشرات طائرة وزاحفة 400 مل + جلاسي ملمع زجاج ومرايا 600 مل',
      activity: 'عقد',
      activityType: 'سايد جندولة',
      activityCount: 2,
      displayType: 'عقد - سايد جندولة',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      photoHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      location: { latitude: 31.2421, longitude: 29.9654, accuracy: 7, address: 'فرع لوران - الكورنيش', capturedAt: '2026-11-01 11:30' },
      status: 'Accepted',
      supervisorScore: 9.0,
      overallRating: 9.0,
      ratedSessionsCount: 1,
      supervisorNotes: 'تنسيق عرض رائع وتوزيع مثالي لعلامات سبيد وجلاسي على السايد جندولة.',
      reviewerName: 'م. حسام الدين غانم',
      reviewedAt: '2026-11-02T10:00:00.000Z',
      timestamp: '2026-11-01T11:30:00.000Z',
      roundsCount: 1,
      totalPhotos: 1,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-11-01 11:30',
          uploadedBy: 'سارة طارق إبراهيم',
          uploadedById: 'ADCO-102',
          reviewStatus: 'Accepted',
          sessionScore: 90,
          scoreBreakdown: {
            newActivity: 36,
            executionQuality: 18,
            continuity: 22,
            documentation: 14
          },
          sessionNotes: 'تنسيق ممتاز وعرض وافي للعلامات.',
          reviewerName: 'م. حسام الدين غانم',
          reviewedAt: '2026-11-02T10:00:00.000Z',
          brands: ['سبيد', 'جلاسي'],
          products: [
            { brand: 'سبيد', skuItem: 'مبيد حشرات 400 مل' },
            { brand: 'جلاسي', skuItem: 'ملمع زجاج ومرايا 600 مل' }
          ],
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
              photoHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
              sizeKb: 180,
              width: 1280,
              height: 720,
              capturedAt: '2026-11-01 11:30'
            }
          ]
        }
      ]
    },
    {
      id: 'ACT-2026-005',
      coordinatorId: 'ADCO-103',
      coordinatorName: 'محمد سمير رضوان',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع المنتزه - شيراتون',
      coordinatorBranch: 'الإسكندرية - قطاع شرق',
      brands: ['فلفيتا', 'ديفا'],
      products: [
        { brand: 'فلفيتا', skuItem: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر' },
        { brand: 'ديفا', skuItem: 'ديفا شاور جل برائحة التوت البري 500 مل' }
      ],
      skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + ديفا شاور جل برائحة التوت البري 500 مل',
      activity: 'إضافي',
      activityType: 'ستاند',
      activityCount: 1,
      displayType: 'إضافي - ستاند',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
      photoHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      location: { latitude: 31.2854, longitude: 30.0123, accuracy: 9, address: 'فرع المنتزه - شيراتون', capturedAt: '2026-11-02 14:15' },
      status: 'Under Review',
      supervisorScore: null,
      overallRating: null,
      ratedSessionsCount: 0,
      supervisorNotes: '',
      reviewerName: null,
      reviewedAt: null,
      timestamp: '2026-11-02T14:15:00.000Z',
      roundsCount: 1,
      totalPhotos: 1,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-11-02 14:15',
          uploadedBy: 'محمد سمير رضوان',
          uploadedById: 'ADCO-103',
          reviewStatus: 'Under Review',
          sessionScore: null,
          sessionNotes: '',
          brands: ['فلفيتا', 'ديفا'],
          products: [
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة 1 لتر' },
            { brand: 'ديفا', skuItem: 'شاور جل 500 مل' }
          ],
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
              photoHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
              sizeKb: 175,
              width: 1280,
              height: 720,
              capturedAt: '2026-11-02 14:15'
            }
          ]
        }
      ]
    },
    {
      id: 'ACT-2026-006',
      coordinatorId: 'ADCO-501',
      coordinatorName: 'أيمن عبد الرحمن الروبي (مشرف منسق)',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع لوران - الكورنيش',
      coordinatorBranch: 'مسؤول فروع فتح الله جملة ماركت - الإسكندرية',
      brands: ['فلفيتا', 'فما'],
      products: [
        { brand: 'فلفيتا', skuItem: 'فلفيتا معطر أقمشة مركز 1 لتر' },
        { brand: 'فما', skuItem: 'فما مسحوق غسيل أوتوماتيك 3 كجم' }
      ],
      skuVariant: 'فلفيتا معطر أقمشة مركز 1 لتر + فما مسحوق غسيل أوتوماتيك 3 كجم',
      activity: 'افتتاح فرع جديد',
      activityType: 'ستاند',
      activityCount: 2,
      displayType: 'افتتاح فرع جديد - ستاند',
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
      photoHash: 'e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
      location: { latitude: 31.2489, longitude: 29.9678, accuracy: 6, address: 'فرع لوران - الكورنيش', capturedAt: '2026-11-03 09:30' },
      status: 'Accepted',
      supervisorScore: 9.2,
      overallRating: 9.2,
      ratedSessionsCount: 1,
      supervisorNotes: 'إشراف ميداني متميز وتنسيق عالي الجودة لعلامات فلفيتا وفما.',
      reviewerName: 'م. حسام الدين غانم',
      reviewedAt: '2026-11-03T18:00:00.000Z',
      timestamp: '2026-11-03T09:30:00.000Z',
      roundsCount: 1,
      totalPhotos: 1,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-11-03 09:30',
          uploadedBy: 'أيمن عبد الرحمن الروبي',
          uploadedById: 'ADCO-501',
          reviewStatus: 'Accepted',
          sessionScore: 92,
          scoreBreakdown: {
            newActivity: 38,
            executionQuality: 18,
            continuity: 22,
            documentation: 14
          },
          sessionNotes: 'افتتاح رسمي وتواجد مكثف للمنتجات على الستاند.',
          reviewerName: 'م. حسام الدين غانم',
          reviewedAt: '2026-11-03T18:00:00.000Z',
          brands: ['فلفيتا', 'فما'],
          products: [
            { brand: 'فلفيتا', skuItem: 'معطر أقمشة مركز 1 لتر' },
            { brand: 'فما', skuItem: 'مسحوق غسيل أوتوماتيك 3 كجم' }
          ],
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
              photoHash: 'e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
              sizeKb: 215,
              width: 1280,
              height: 720,
              capturedAt: '2026-11-03 09:30'
            }
          ]
        }
      ]
    }
  ];

  global.ADCO_SEED_ACTIVITIES = SEED_ACTIVITIES;
})(window);
