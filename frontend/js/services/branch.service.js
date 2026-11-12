/**
 * ADCO Branch Lookup Service
 * Supplying-branch resolution (sync + API with fallback) and coordinators per client.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class BranchService {
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
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(BranchService);
  global.BranchService = BranchService;
})(window);
