/**
 * ADCO Default Employee Registry (demo seed)
 * Pure data module consumed by auth.js. Exposed as window.ADCO_DEFAULT_REGISTRY.
 */

(function (global) {
  const DEFAULT_REGISTRY = [
    {
      employeeId: 'ADCO-101',
      fullName: 'أحمد محمود العبد',
      mobile: '01012345678',
      email: 'ahmed.m@adco.com.eg',
      role: 'coordinator',
      rank: '#3',
      score: 88,
      assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
      assignedBranchName: 'فرع سموحة - الإسكندرية',
      branch: 'فرع سموحة - الإسكندرية',
      region: 'الإسكندرية',
      passwordHash: 'Pass@1234'
    },
    {
      employeeId: 'ADCO-102',
      fullName: 'سارة طارق إبراهيم',
      mobile: '01198765432',
      email: 'sara.t@adco.com.eg',
      role: 'coordinator',
      rank: '#1',
      score: 96,
      assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
      assignedBranchName: 'فرع لوران - الكورنيش',
      branch: 'فرع لوران - الكورنيش',
      region: 'الإسكندرية',
      passwordHash: 'Pass@1234'
    },
    {
      employeeId: 'ADCO-103',
      fullName: 'محمد علي حسن',
      mobile: '01222334455',
      email: 'mohamed.ali@adco.com.eg',
      role: 'coordinator',
      rank: '#4',
      score: 84,
      assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
      assignedBranchName: 'فرع المنتزه - شيراتون',
      branch: 'فرع المنتزه - شيراتون',
      region: 'الإسكندرية',
      passwordHash: 'Pass@1234'
    },
    {
      employeeId: 'ADCO-501',
      fullName: 'أيمن عبد الرحمن الروبي',
      mobile: '01055566677',
      email: 'ayman.r@adco.com.eg',
      role: 'coordinator_supervisor',
      rank: '#2',
      score: 92,
      assignedClientName: 'فتح الله جملة ماركت (Fathalla)',
      assignedBranchName: null,
      region: 'الإسكندرية',
      branch: 'مسؤول فروع فتح الله جملة ماركت - الإسكندرية',
      passwordHash: 'Super@2026'
    },
    {
      employeeId: 'ADCO-901',
      fullName: 'م. حسام الدين غانم',
      mobile: '01234567890',
      email: 'hossam.g@adco.com.eg',
      role: 'marketing_manager',
      rank: 'مسؤول التسويق',
      score: 100,
      assignedClientName: null,
      assignedBranchName: null,
      region: 'الجمهورية (إشراف عام)',
      branch: 'المقر الرئيسي - برج العرب',
      passwordHash: 'Admin@2026'
    }
  ];

  global.ADCO_DEFAULT_REGISTRY = DEFAULT_REGISTRY;
})(window);
