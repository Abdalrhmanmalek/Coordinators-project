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
  const STORAGE_KEY_ACTIVITIES = 'ADCO_ACTIVITIES_DATA_V4';

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
      'قطاع الدلتا والبحيرة',
      'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
      'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)'
    ],
    supplyingBranchMap: {
      'فرع سموحة - الإسكندرية': 'الإسكندرية - قطاع وسط',
      'فرع محرم بك - قناة السويس': 'الإسكندرية - قطاع غرب',
      'فرع المنشية - الإسكندرية': 'الإسكندرية - قطاع وسط',
      'فرع رشدي - كفر عبده': 'الإسكندرية - قطاع شرق',
      'فرع رشدي - الإسكندرية': 'الإسكندرية - قطاع شرق',
      'فرع كفر عبده - الإسكندرية': 'الإسكندرية - قطاع شرق',
      'فرع سيدي جابر - طريق الحرية': 'الإسكندرية - قطاع شرق',
      'فرع لوران - الكورنيش': 'الإسكندرية - قطاع شرق',
      'فرع المنتزه - شيراتون': 'الإسكندرية - قطاع شرق',
      'فرع ميامي - جمال عبد الناصر': 'الإسكندرية - قطاع شرق',
      'فرع جليم - سان ستيفانو': 'الإسكندرية - قطاع شرق',
      'فرع ستانلي - الإسكندرية': 'الإسكندرية - قطاع شرق',
      'فرع سيدي بشر - الإسكندرية': 'الإسكندرية - قطاع شرق',
      'فرع العجمي - الهانوفيل': 'الإسكندرية - قطاع غرب',
      'فرع العجمي - الإسكندرية': 'الإسكندرية - قطاع غرب',
      'فرع برج العرب الجديدة': 'برج العرب والساحل الشمالي',
      'فرع المعادي - القاهرة': 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
      'فرع مدينة نصر - القاهرة': 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
      'فرع مصر الجديدة - القاهرة': 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
      'فرع التجمع الخامس - القاهرة': 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)',
      'فرع الشيخ زايد - الجيزة': 'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)',
      'فرع الدقي - الجيزة': 'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)',
      'فرع المهندسين - الجيزة': 'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)',
      'فرع طنطا - الغربية': 'قطاع الدلتا والبحيرة',
      'فرع المنصورة - الدقهلية': 'قطاع الدلتا والبحيرة',
      'فرع دمنهور - البحيرة': 'قطاع الدلتا والبحيرة'
    },
    branchCoordinatesMap: {
      'فرع سموحة - الإسكندرية': { latitude: 31.2156, longitude: 29.9553 },
      'فرع لوران - الكورنيش': { latitude: 31.2421, longitude: 29.9654 },
      'فرع المنتزه - شيراتون': { latitude: 31.2854, longitude: 30.0123 },
      'فرع ميامي - جمال عبد الناصر': { latitude: 31.2652, longitude: 29.9945 },
      'فرع محرم بك - قناة السويس': { latitude: 31.1921, longitude: 29.9145 },
      'فرع رشدي - كفر عبده': { latitude: 31.2284, longitude: 29.9482 },
      'فرع رشدي - الإسكندرية': { latitude: 31.2284, longitude: 29.9482 },
      'فرع سيدي جابر - طريق الحرية': { latitude: 31.2221, longitude: 29.9412 },
      'فرع ستانلي - الإسكندرية': { latitude: 31.2351, longitude: 29.9511 },
      'فرع سيدي بشر - الإسكندرية': { latitude: 31.2589, longitude: 29.9881 },
      'فرع العجمي - الهانوفيل': { latitude: 31.1195, longitude: 29.7824 },
      'فرع العجمي - الإسكندرية': { latitude: 31.1195, longitude: 29.7824 },
      'فرع المنشية - الإسكندرية': { latitude: 31.1981, longitude: 29.8942 },
      'فرع كفر عبده - الإسكندرية': { latitude: 31.2268, longitude: 29.9512 },
      'فرع جليم - سان ستيفانو': { latitude: 31.2454, longitude: 29.9681 },
      'فرع برج العرب الجديدة': { latitude: 30.8882, longitude: 29.5754 },
      'فرع المعادي - القاهرة': { latitude: 29.9602, longitude: 31.2569 },
      'فرع مدينة نصر - القاهرة': { latitude: 30.0561, longitude: 31.3301 },
      'فرع مصر الجديدة - القاهرة': { latitude: 30.0909, longitude: 31.3227 },
      'فرع التجمع الخامس - القاهرة': { latitude: 30.0074, longitude: 31.4913 },
      'فرع الشيخ زايد - الجيزة': { latitude: 30.0444, longitude: 30.9756 },
      'فرع الدقي - الجيزة': { latitude: 30.0385, longitude: 31.2122 },
      'فرع المهندسين - الجيزة': { latitude: 30.0528, longitude: 31.2009 },
      'فرع طنطا - الغربية': { latitude: 30.7865, longitude: 31.0004 },
      'فرع المنصورة - الدقهلية': { latitude: 31.0409, longitude: 31.3785 },
      'فرع دمنهور - البحيرة': { latitude: 31.0341, longitude: 30.4682 }
    },
    maxBranchProximityMeters: 150,
    officialBrands: [
      'جلاسي',
      'ديفا',
      'سبيد',
      'فلفيتا',
      'فما',
      'فييا',
      'كلوريل',
      'ماكسيل ماجيك'
    ],
    brands: [
      'جلاسي',
      'ديفا',
      'سبيد',
      'فلفيتا',
      'فما',
      'فييا',
      'كلوريل',
      'ماكسيل ماجيك'
    ],
    skus: [
      'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
      'فلفيتا جل غسيل أوتوماتيك وايت باور 2.5 لتر عرض التوفير',
      'كلوريل مبيض ومطهر ملابس 1 لتر + كلوريل جل حماية الألوان 950 مل',
      'فما مسحوق غسيل أوتوماتيك 3 كجم + فلفيتا معطر أقمشة مركز لافندر 1 لتر',
      'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
      'ماكسيل ماجيك منظف أفران ودهون صعبة 500 مل + مطهر أرضيات 1 لتر',
      'جلاسي ملمع زجاج ومرايا بالبخاخ 600 مل + ديفا شاور جل 500 مل',
      'سبيد مبيد حشرات طائرة وزاحفة 400 مل'
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
      'فلور',
      'بوديوم',
      'بيلر',
      'كات مان',
      'سي ثرو',
      'لايت بوكس',
      'عرض أرضي'
    ],
    productHierarchy: {
      'جلاسي': {
        'منظفات الزجاج والأسطح': {
          'ملمع زجاج ومرايا': [
            'جلاسي ملمع زجاج ومرايا بالبخاخ 600 مل',
            'جلاسي ملمع زجاج مضاد للضباب 750 مل',
            'جلاسي بخاخ تلميع كريستال وأسطح 500 مل'
          ],
          'منظف أسطح متعدد الاستخدام': [
            'جلاسي منظف أسطح ومكاتب برائحة الليمون 750 مل',
            'جلاسي ملمع ستانلس وأخشاب 600 مل'
          ]
        }
      },
      'ديفا': {
        'العناية الشخصية والجمال': {
          'شاور جل وصابون سائل': [
            'ديفا شاور جل برائحة التوت البري 500 مل',
            'ديفا صابون سائل لليدين باللافندر 450 مل',
            'ديفا شاور جل بالورد والمسك الأبيض 750 مل'
          ],
          'شامبو وبلسم العناية بالشعر': [
            'ديفا شامبو بزيت الأرجان والكيراتين 400 مل',
            'ديفا بلسم مرطب للشعر الجاف 400 مل'
          ]
        }
      },
      'سبيد': {
        'مبيدات ومنتجات حماية المنزل': {
          'سبيد إيروسول': [
            'سبيد مبيد حشرات طائرة وزاحفة 400 مل',
            'سبيد بدون رائحة حماية مضاعفة 600 مل',
            'سبيد مبيد حشرات برائحة اللافندر 500 مل'
          ],
          'سبيد حماية مركزة': [
            'سبيد مبيد للصراصير والنمل مفعول ممتد 400 مل',
            'سبيد سائل طارد للناموس والحشرات 300 مل'
          ]
        }
      },
      'فلفيتا': {
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
          ]
        }
      },
      'فما': {
        'مساحيق ومنظفات الغسيل': {
          'مسحوق غسيل فما أوتوماتيك': [
            'فما مسحوق غسيل أوتوماتيك 3 كجم',
            'فما مسحوق غسيل أوتوماتيك باللافندر 4 كجم',
            'فما مسحوق غسيل أوتوماتيك توفير عائلي 6 كجم'
          ],
          'مسحوق غسيل فما يدوي': [
            'فما مسحوق غسيل يدوي رغوة وفيرة 1.5 كجم',
            'فما مسحوق غسيل يدوي نسيم الربيع 800 جم'
          ]
        }
      },
      'فييا': {
        'سائل غسيل الأطباق': {
          'فييا مركز بالليمون': [
            'فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
            'فييا سائل غسيل أطباق بالليمون المركز 2.5 لتر عرض التوفير',
            'فييا سائل غسيل أطباق بالليمون والنعناع 650 مل'
          ],
          'فييا بالتفاح والخل': [
            'فييا سائل غسيل أطباق بالتفاح الأخضر 750 مل',
            'فييا سائل غسيل أطباق بقوة الخل لإزالة الدهون 1 لتر'
          ]
        }
      },
      'كلوريل': {
        'مبيضات ومطهرات ملابس': {
          'كلوريل أبيض ناصع': [
            'كلوريل مبيض ومطهر ملابس 1 لتر',
            'كلوريل مبيض ملابس عبوة التوفير 2 لتر',
            'كلوريل مبيض ومطهر برائحة الصنوبر 1 لتر'
          ],
          'كلوريل جل للألوان': [
            'كلوريل جل حماية الألوان 950 مل',
            'كلوريل جل للألوان برائحة الزهور 1.8 لتر'
          ]
        }
      },
      'ماكسيل ماجيك': {
        'منظفات ومطهرات متعددة الأغراض': {
          'ماكسيل ماجيك باور للدهون': [
            'ماكسيل ماجيك منظف أفران ودهون صعبة 500 مل',
            'ماكسيل ماجيك مذيب شحوم ودهون المطبخ 750 مل'
          ],
          'ماكسيل ماجيك مطهر أرضيات وحمامات': [
            'ماكسيل ماجيك مطهر أرضيات وحمامات 1 لتر',
            'ماكسيل ماجيك جل منظف ومطهر تواليت 750 مل',
            'ماكسيل ماجيك مطهر برائحة اللافندر 2 لتر'
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
      brands: ['فلفيتا', 'فييا'],
      skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر',
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
      brands: ['كلوريل', 'ماكسيل ماجيك', 'جلاسي'],
      skuVariant: 'كلوريل مبيض ومطهر ملابس 1 لتر + ماكسيل ماجيك منظف أفران 500 مل + جلاسي ملمع زجاج 600 مل',
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
      brands: ['فما', 'ديفا', 'فلفيتا'],
      skuVariant: 'فما مسحوق غسيل أوتوماتيك 3 كجم + ديفا شاور جل 500 مل + فلفيتا معطر أقمشة 1 لتر',
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
      brands: ['سبيد', 'جلاسي'],
      skuVariant: 'سبيد مبيد حشرات طائرة وزاحفة 400 مل + جلاسي ملمع زجاج ومرايا 600 مل',
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
      supervisorNotes: 'تنسيق عرض رائع وتوزيع مثالي لعلامات سبيد وجلاسي على السايد جندولة.',
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
      brands: ['فلفيتا', 'ديفا'],
      skuVariant: 'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + ديفا شاور جل برائحة التوت البري 500 مل',
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
      brands: ['فلفيتا', 'فما'],
      skuVariant: 'فلفيتا معطر أقمشة مركز 1 لتر + فما مسحوق غسيل أوتوماتيك 3 كجم',
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
      supervisorNotes: 'إشراف ميداني متميز وتنسيق عالي الجودة لعلامات فلفيتا وفما.',
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

    /**
     * Resolve Supplying Branch (فرع الشركة المورد للبضاعة) synchronously from relational DB mapping
     */
    static getSupplyingBranchSync(clientName, branchName) {
      const cName = (clientName || '').trim();
      const bName = (branchName || '').trim();
      if (!bName && !cName) return ADCO_CATALOGS.coordinatorBranches[0] || 'الإسكندرية - قطاع وسط';

      // 1. Check live / seeded activities database for exact (client, branch) match
      const all = this.getAllActivities();
      if (bName) {
        const exactMatch = all.find((a) => {
          const sameBranch = (a.branch || '').trim() === bName || (a.branch || '').includes(bName) || bName.includes(a.branch || '');
          const sameClient = !cName || (a.client || '').includes(cName) || cName.includes(a.client || '');
          return sameBranch && sameClient && a.coordinatorBranch;
        });
        if (exactMatch && exactMatch.coordinatorBranch) {
          return exactMatch.coordinatorBranch;
        }
      }

      // 2. Check relational supplyingBranchMap catalog
      const map = ADCO_CATALOGS.supplyingBranchMap || {};
      if (bName && map[bName]) {
        return map[bName];
      }
      for (const [key, val] of Object.entries(map)) {
        if (bName && (bName.includes(key) || key.includes(bName))) {
          return val;
        }
      }

      // 3. Keyword geographical inference fallback
      if (/سموحة|المنشية|وسط/.test(bName)) return 'الإسكندرية - قطاع وسط';
      if (/رشدي|كفر عبده|لوران|المنتزه|ميامي|سيدي جابر|جليم|ستانلي|سيدي بشر|شرق/.test(bName)) return 'الإسكندرية - قطاع شرق';
      if (/محرم بك|العجمي|الهانوفيل|غرب/.test(bName)) return 'الإسكندرية - قطاع غرب';
      if (/برج العرب|الساحل|العلمين/.test(bName)) return 'برج العرب والساحل الشمالي';
      if (/المعادي|مدينة نصر|مصر الجديدة|التجمع|القاهرة/.test(bName)) return 'قطاع القاهرة الكبرى (مدينة نصر / التجمع)';
      if (/زايد|الدقي|المهندسين|الجيزة|أكتوبر/.test(bName)) return 'قطاع الجيزة وأكتوبر (الشيخ زايد / الدقي)';
      if (/طنطا|المنصورة|دمنهور|الدلتا|البحيرة|الغربية/.test(bName)) return 'قطاع الدلتا والبحيرة';

      // 4. Check any branch record matching branchName alone
      if (bName) {
        const branchOnlyMatch = all.find((a) => ((a.branch || '').includes(bName) || bName.includes(a.branch || '')) && a.coordinatorBranch);
        if (branchOnlyMatch && branchOnlyMatch.coordinatorBranch) {
          return branchOnlyMatch.coordinatorBranch;
        }
      }

      return ADCO_CATALOGS.coordinatorBranches[0] || 'الإسكندرية - قطاع وسط';
    }

    /**
     * Async Database / API call to fetch the Company Supplying Branch (فرع الشركة المورد للبضاعة)
     * based on selected Client (العميل) and Client Branch (فرع العميل).
     */
    static async fetchSupplyingBranch(clientName, branchName) {
      const cName = (clientName || '').trim();
      const bName = (branchName || '').trim();

      // Attempt backend REST API call when running over HTTP/HTTPS with active API
      if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http') && global.apiClient) {
        try {
          const endpoint = (global.API_ENDPOINTS && global.API_ENDPOINTS.BRANCHES && global.API_ENDPOINTS.BRANCHES.SUPPLYING_BRANCH)
            || '/branches/supplying-branch';
          const query = `?client=${encodeURIComponent(cName)}&branch=${encodeURIComponent(bName)}`;
          const res = await global.apiClient.get(`${endpoint}${query}`);
          if (res && (res.supplyingBranch || (res.data && res.data.supplyingBranch))) {
            return res.supplyingBranch || res.data.supplyingBranch;
          }
        } catch (_) {
          // Graceful fallback to local relational database mapping
        }
      }

      return this.getSupplyingBranchSync(cName, bName);
    }

    /**
     * Resolve stored GPS coordinates (latitude, longitude) for a specific client branch
     */
    static getBranchCoordinatesSync(branchName) {
      const bName = (branchName || '').trim();
      if (!bName) return null;

      // 1. Check live/seeded activities for exact branch GPS coordinates
      const all = this.getAllActivities();
      const matchedAct = all.find((a) => {
        const ab = (a.branch || '').trim();
        return (ab === bName || ab.includes(bName) || bName.includes(ab)) && a.location && a.location.latitude && a.location.longitude;
      });
      if (matchedAct && matchedAct.location) {
        return {
          latitude: Number(matchedAct.location.latitude),
          longitude: Number(matchedAct.location.longitude)
        };
      }

      // 2. Check master branchCoordinatesMap catalog
      const coordsMap = ADCO_CATALOGS.branchCoordinatesMap || {};
      if (coordsMap[bName]) {
        return coordsMap[bName];
      }
      for (const [key, coords] of Object.entries(coordsMap)) {
        if (bName.includes(key) || key.includes(bName)) {
          return coords;
        }
      }

      return null;
    }

    /**
     * Haversine Formula: Calculates great-circle distance in meters between two GPS coordinates
     */
    static calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
      const R = 6371000; // Earth mean radius in meters
      const toRad = (deg) => (Number(deg) * Math.PI) / 180;
      const dLat = toRad(Number(lat2) - Number(lat1));
      const dLon = toRad(Number(lon2) - Number(lon1));
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    }

    /**
     * Automated GPS Proximity Validation (Branch vs. Coordinator Location)
     * Compares stored branch GPS coordinates against coordinator's current device GPS coordinates.
     * Configurable threshold defaults to 150 meters.
     */
    static validateBranchProximity(branchName, deviceLocation, maxAllowedMeters = ADCO_CATALOGS.maxBranchProximityMeters || 150) {
      if (!deviceLocation || deviceLocation.latitude === undefined || deviceLocation.longitude === undefined) {
        return {
          isValid: false,
          distanceMeters: null,
          maxAllowedMeters,
          branchCoords: null,
          errorMessage: 'يرجى السماح بالوصول إلى الموقع الجغرافي (GPS) للتحقق من تواجدك داخل نطاق الفرع'
        };
      }

      const branchCoords = this.getBranchCoordinatesSync(branchName);
      if (!branchCoords) {
        return {
          isValid: true,
          distanceMeters: 0,
          maxAllowedMeters,
          branchCoords: null,
          errorMessage: null
        };
      }

      const distanceMeters = this.calculateHaversineDistanceMeters(
        branchCoords.latitude,
        branchCoords.longitude,
        deviceLocation.latitude,
        deviceLocation.longitude
      );

      const threshold = Number(maxAllowedMeters) || 150;
      if (distanceMeters > threshold) {
        return {
          isValid: false,
          distanceMeters,
          maxAllowedMeters: threshold,
          branchCoords,
          errorMessage: 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل'
        };
      }

      return {
        isValid: true,
        distanceMeters,
        maxAllowedMeters: threshold,
        branchCoords,
        errorMessage: null
      };
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
