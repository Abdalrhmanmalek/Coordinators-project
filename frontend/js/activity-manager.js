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
      'كات مان',
      'سي ثرو',
      'لايت بوكس',
      'عرض أرضي'
    ],
    productHierarchy: {
      'Velveta (فلفيتا)': {
        'معطرات الأقمشة': {
          'معطر مركز': [
            'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
            'فلفيتا معطر أقمشة مركز لافندر 1 لتر',
            'فلفيتا معطر أقمشة مركز عبير الشرق 1 لتر',
            'فلفيتا معطر أقمشة مركز مسك أبيض 1 لتر'
          ],
          'معطر عادي': [
            'فلفيتا معطر أقمشة رقيق نسيم البحر 2 لتر',
            'فلفيتا معطر أقمشة رقيق ياسمين 2 لتر',
            'فلفيتا معطر أقمشة رقيق بينك روز 3 لتر'
          ]
        },
        'منظفات الملابس': {
          'جل غسيل أوتوماتيك': [
            'فلفيتا جل غسيل أوتوماتيك وايت باور 2.5 لتر',
            'فلفيتا جل غسيل أوتوماتيك حماية الألوان 2.5 لتر',
            'فلفيتا جل غسيل أوتوماتيك نسيم الشرق 3 لتر'
          ],
          'مسحوق غسيل': [
            'فلفيتا مسحوق يدوي رغوة غنية 1 كجم',
            'فلفيتا مسحوق غسيل أوتوماتيك 3 كجم'
          ]
        }
      },
      'Fairy (فيري)': {
        'سائل غسيل الأطباق': {
          'بلاتينيوم بلس': [
            'فيري بلاتينيوم بلس ليمون 650 مل',
            'فيري بلاتينيوم بلس برتقال 650 مل',
            'فيري بلاتينيوم بلس توت أزرق 650 مل'
          ],
          'أصلي ومركز': [
            'فيري ليمون أخضر مركز 1 لتر',
            'فيري تفاح مضاد للبكتيريا 1 لتر',
            'فيري رغوة تدوم طويلاً 2.5 لتر'
          ]
        },
        'أقراص غسالات الأطباق': {
          'كبسولات أوتوماتيك الكل في واحد': [
            'فيري كبسولات أوتوماتيك ليمون 42 قرص',
            'فيري بلاتينيوم بلس أقراص غسالات 30 قرص'
          ]
        }
      },
      'Persil (برسيل)': {
        'منظفات الملابس السائلة (جل)': {
          'برسيل جل أوتوماتيك': [
            'برسيل جل لافندر 3.9 لتر + داوني 1 لتر هدية',
            'برسيل جل حماية الألوان كولور 2.6 لتر',
            'برسيل جل باور كلين الأبيض الناصع 3.9 لتر'
          ],
          'برسيل بلاك للأقمشة الداكنة': [
            'برسيل بلاك جل حماية العبايات والأقمشة السوداء 2.5 لتر',
            'برسيل بلاك معطر العود الفاخر 3 لتر'
          ]
        },
        'مساحيق غسيل بودرة': {
          'مسحوق أوتوماتيك باور': [
            'برسيل مسحوق أوتوماتيك لافندر 4 كجم + 1 كجم مجاناً',
            'برسيل مسحوق أوتوماتيك بتقنية التنظيف العميق 6 كجم'
          ]
        }
      },
      'Pril (بريل)': {
        'سائل تنظيف الأطباق': {
          'بريل قوة الليمون المركز': [
            'بريل سائل أطباق بالليمون الأخضر عبوة 1 لتر',
            'بريل سائل أطباق مضاد للدهون 2.5 لتر عرض التوفير'
          ],
          'بريل بالخل وبيكربونات الصوديوم': [
            'بريل برودكت الخل وبيكربونات 1.25 لتر'
          ]
        }
      },
      'Clorox (كلوركس)': {
        'مبيضات ومطهرات ملابس': {
          'كلوركس ألوان': [
            'كلوركس ألوان جل 750 مل برائحة اللافندر',
            'كلوركس ألوان سائل 1.8 لتر عرض مزدوج'
          ],
          'كلوركس مبيض تقليدي': [
            'كلوركس مبيض أقمشة بيضاء 950 مل'
          ]
        },
        'منظفات ومطهرات الأسطح': {
          'بخاخات تعقيم وتطهير': [
            'كلوركس بخاخ تعقيم أسطح 750 مل',
            'كلوركس جل تنظيف التواليت 700 مل صنوبر'
          ]
        }
      },
      'Downy (داوني)': {
        'مركزات منعم ومعطر أقمشة': {
          'عطور منعشة': [
            'داوني مركز أزهار منعشة 1 لتر',
            'داوني مركز نسيم الوادي 880 مل'
          ],
          'عطور فاخرة': [
            'داوني دريم جولد عطور فرنسية 1 لتر',
            'داوني باشن أحمر عطور ملكية 1 لتر'
          ]
        }
      },
      'Harpic (هاربيك)': {
        'منظفات ومطهرات التواليت': {
          'هاربيك باور بلس 10x': [
            'هاربيك باور بلس أوريجينال 750 مل عبوة مزدوجة',
            'هاربيك باور بلس ليمون 750 مل'
          ],
          'أقراص حافة التواليت': [
            'هاربيك أقراص نشطة للحافة برائحة اللافندر 35 جم'
          ]
        }
      },
      'Oxi (أوكسي)': {
        'مساحيق غسيل أوتوماتيك': {
          'أوكسي بودرة': [
            'أوكسي مسحوق أوتوماتيك 4 كجم نسيم الشرق',
            'أوكسي مسحوق أوتوماتيك 2.5 كجم لافندر'
          ],
          'أوكسي جل سائل': [
            'أوكسي جل غسيل مركز 2.5 لتر'
          ]
        }
      },
      'Dettol (ديتول)': {
        'مطهرات ومعقمات': {
          'سائل مطهر متعدد الأغراض': [
            'ديتول سائل معقم ومطهر 725 مل',
            'ديتول بخاخ معقم أسطح وأثاث 500 مل'
          ]
        }
      },
      'Finish (فينيش)': {
        'مستلزمات غسالات الأطباق': {
          'كبسولات وأقراص': [
            'فينيش كوانتم ألتيميت ليمون 30 كبسولة',
            'فينيش الكل في واحد أقراص 40 قرص'
          ],
          'إضافات غسالات': [
            'فينيش مساعد شطف وتلميع 400 مل',
            'فينيش ملح غسالات أطباق عالي النقاوة 2 كجم'
          ]
        }
      }
    },
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
    },
    {
      id: 'ACT-2026-004',
      coordinatorId: 'ADCO-102',
      coordinatorName: 'سارة طارق إبراهيم',
      client: 'فتح الله جملة ماركت (Fathalla)',
      branch: 'فرع لوران - الكورنيش',
      coordinatorBranch: 'الإسكندرية - قطاع شرق',
      brands: ['Persil (برسيل)', 'Downy (داوني)'],
      skuVariant: 'برسيل جل لافندر 3.9 لتر + داوني 1 لتر هدية',
      activity: 'عقد',
      activityType: 'سايد جندولة',
      activityCount: 2,
      displayType: 'عقد - سايد جندولة',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
      photoHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      location: { latitude: 31.2421, longitude: 29.9654, accuracy: 7, address: 'فرع لوران - الكورنيش', capturedAt: '2026-11-01 11:30' },
      status: 'Accepted',
      supervisorScore: 9.0,
      overallRating: 9.0,
      ratedSessionsCount: 1,
      supervisorNotes: 'تنسيق عرض رائع وتوزيع مثالي على السايد جندولة.',
      reviewerName: 'م. حسام الدين غانم',
      reviewedAt: '2026-11-02T10:00:00.000Z',
      timestamp: '2026-11-01T11:30:00.000Z',
      roundsCount: 1,
      totalPhotos: 2,
      followUpHistory: [
        {
          roundNumber: 1,
          roundTitle: 'التوثيق التأسيسي (جولة 1)',
          timestamp: '2026-11-01 11:30',
          uploadedBy: 'سارة طارق إبراهيم',
          uploadedById: 'ADCO-102',
          reviewStatus: 'Accepted',
          sessionScore: 9,
          sessionNotes: 'تنسيق ممتاز وعرض وافي للعلامات.',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=720&q=80',
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
      brands: ['Velveta (فلفيتا)', 'Fairy (فيري)'],
      skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر',
      activity: 'إضافي',
      activityType: 'ستاند',
      activityCount: 1,
      displayType: 'إضافي - ستاند',
      magazineDate: '',
      photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=720&q=80',
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
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=720&q=80',
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
      brands: ['Velveta (فلفيتا)', 'Persil (برسيل)'],
      skuVariant: 'فلفيتا معطر أقمشة مركز 1 لتر',
      activity: 'افتتاح فرع جديد',
      activityType: 'ستاند',
      activityCount: 2,
      displayType: 'افتتاح فرع جديد - ستاند',
      photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
      photoHash: 'e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
      location: { latitude: 31.2489, longitude: 29.9678, accuracy: 6, address: 'فرع لوران - الكورنيش', capturedAt: '2026-11-03 09:30' },
      status: 'Accepted',
      supervisorScore: 9.2,
      overallRating: 9.2,
      ratedSessionsCount: 2,
      supervisorNotes: 'إشراف ميداني متميز وتنسيق عالي الجودة لعلامات فلفيتا وبرسيل.',
      reviewerName: 'م. حسام الدين غانم',
      reviewedAt: '2026-11-04T12:00:00.000Z',
      timestamp: '2026-11-03T09:30:00.000Z',
      followUpHistory: [
        {
          id: 'FU-501-1',
          roundNumber: 1,
          timestamp: '2026-11-03 09:30',
          uploadedBy: 'أيمن عبد الرحمن الروبي',
          uploadedById: 'ADCO-501',
          reviewStatus: 'Accepted',
          sessionScore: 9.2,
          sessionNotes: 'عرض متناسق وجاهزية تامة',
          photos: [
            {
              photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=720&q=80',
              photoHash: 'e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
              sizeKb: 182,
              width: 1280,
              height: 720,
              capturedAt: '2026-11-03 09:30'
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
        let list = JSON.parse(raw);
        if (!Array.isArray(list)) list = SEED_ACTIVITIES;

        // Auto-merge new seed activities (ACT-2026-004, ACT-2026-005)
        let updated = false;
        SEED_ACTIVITIES.forEach((seed) => {
          if (!list.some((a) => a.id === seed.id)) {
            list.push(seed);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(list));
        }
        return list;
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

    static getActivitiesForUser(userOrId) {
      const all = this.getAllActivities();
      if (!userOrId) return all;

      if (typeof userOrId === 'object') {
        const user = userOrId;
        const role = user.role;

        // Tier 3: Coordination Manager (Global Visibility)
        if (role === 'marketing_manager' || role === 'coordination_manager' || role === 'supervisor') {
          return all;
        }

        // Tier 2: Coordinator Supervisor (Responsible for all branches of assigned client)
        if (role === 'coordinator_supervisor') {
          const clientName = (user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)').trim();
          return all.filter((a) => {
            const actClient = (a.client || '').trim();
            return actClient.includes(clientName) || clientName.includes(actClient);
          });
        }

        // Tier 1: Coordinator (Strictly restricted to single assigned client branch)
        if (user.assignedClientName && user.assignedBranchName) {
          const cName = user.assignedClientName.trim();
          const bName = user.assignedBranchName.trim();
          return all.filter((a) => {
            const matchClient = (a.client || '').includes(cName) || cName.includes(a.client || '');
            const matchBranch = (a.branch || '').includes(bName) || bName.includes(a.branch || '');
            return matchClient && matchBranch;
          });
        }

        // Fallback to employeeId match
        return all.filter((a) => a.coordinatorId === user.employeeId);
      }

      // String ID passed
      return all.filter((a) => a.coordinatorId === userOrId);
    }

    static getBranchesForClient(clientName) {
      const all = this.getAllActivities();
      const filtered = all.filter((a) => (a.client || '').includes(clientName) || clientName.includes(a.client || ''));
      const branches = [...new Set(filtered.map((a) => a.branch).filter(Boolean))];
      return branches.length > 0 ? branches : [
        'فرع سموحة - الإسكندرية',
        'فرع لوران - الكورنيش',
        'فرع المنتزه - شيراتون',
        'فرع ميامي - جمال عبد الناصر',
        'فرع محرم بك - قناة السويس'
      ];
    }

    static getCoordinatorsForClient(clientName) {
      const all = this.getAllActivities();
      const filtered = all.filter((a) => (a.client || '').includes(clientName) || clientName.includes(a.client || ''));
      const coords = [];
      const seen = new Set();
      filtered.forEach((a) => {
        if (a.coordinatorId && !seen.has(a.coordinatorId)) {
          seen.add(a.coordinatorId);
          coords.push({ id: a.coordinatorId, name: a.coordinatorName || a.coordinatorId });
        }
      });
      if (coords.length === 0) {
        coords.push({ id: 'ADCO-101', name: 'أحمد محمود العبد' }, { id: 'ADCO-102', name: 'سارة طارق إبراهيم' });
      }
      return coords;
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
