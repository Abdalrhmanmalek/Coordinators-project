/**
 * ADCO Activity Store
 * localStorage cache, seed merge/auto-heal, getters/setters and RBAC-scoped query filtering.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class ActivityStore {
    static getAllActivities() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
        if (!raw) {
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
          return SEED_ACTIVITIES;
        }
        let list = JSON.parse(raw);
        if (!Array.isArray(list)) list = SEED_ACTIVITIES;

        // Auto-merge new seed activities and heal broken Fathalla assets
        let updated = false;
        SEED_ACTIVITIES.forEach((seed) => {
          if (!list.some((a) => a.id === seed.id)) {
            list.push(seed);
            updated = true;
          }
        });

        // Upgrade legacy cartoon SVG placeholders to high-res realistic retail shelf photos
        const realisticPhoto = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
        list.forEach((act) => {
          if (!act.photoUrl || act.photoUrl.includes('fathalla-branch.svg')) {
            act.photoUrl = realisticPhoto;
            updated = true;
          }
          if (Array.isArray(act.followUpHistory)) {
            act.followUpHistory.forEach((s) => {
              if (Array.isArray(s.photos)) {
                s.photos.forEach((p) => {
                  if (!p.photoUrl || p.photoUrl.includes('fathalla-branch.svg')) {
                    p.photoUrl = realisticPhoto;
                    updated = true;
                  }
                });
              }
            });
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

        // Tier 3: Coordination Manager / Marketing Manager (Global Visibility)
        if (role === 'marketing_manager' || role === 'coordination_manager' || role === 'supervisor') {
          return all;
        }

        // Tier 2: Coordinator Supervisor (Responsible for all branches of assigned client)
        if (role === 'coordinator_supervisor') {
          const clientName = (user.assignedClientName || 'فتح الله جملة ماركت (Fathalla)').trim();
          const filtered = all.filter((a) => {
            const actClient = (a.client || '').trim();
            return actClient.includes(clientName) || clientName.includes(actClient);
          });
          return filtered.length > 0 ? filtered : all;
        }

        // Tier 1: Coordinator (Prioritize assigned client branch, fallback to coordinatorId/fullName, fallback to client)
        let filtered = [];
        if (user.assignedClientName && user.assignedBranchName) {
          const cName = user.assignedClientName.trim();
          const bName = user.assignedBranchName.trim();
          filtered = all.filter((a) => {
            const matchClient = (a.client || '').includes(cName) || cName.includes(a.client || '');
            const matchBranch = (a.branch || '').includes(bName) || bName.includes(a.branch || '');
            return matchClient && matchBranch;
          });
        }

        if (filtered.length === 0 && user.employeeId) {
          filtered = all.filter((a) => a.coordinatorId === user.employeeId);
        }

        if (filtered.length === 0 && user.fullName) {
          filtered = all.filter((a) => a.coordinatorName === user.fullName);
        }

        if (filtered.length === 0 && (user.assignedBranchName || user.branch)) {
          const b = (user.assignedBranchName || user.branch).trim();
          filtered = all.filter((a) => (a.branch || '').includes(b) || b.includes(a.branch || ''));
        }

        if (filtered.length === 0 && user.assignedClientName) {
          filtered = all.filter((a) => (a.client || '').includes(user.assignedClientName));
        }

        return filtered.length > 0 ? filtered : all;
      }

      // String ID passed
      const byId = all.filter((a) => a.coordinatorId === userOrId);
      return byId.length > 0 ? byId : all;
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
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(ActivityStore);
  global.ActivityStore = ActivityStore;
})(window);
