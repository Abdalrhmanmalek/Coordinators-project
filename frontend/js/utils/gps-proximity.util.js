/**
 * ADCO GPS Proximity Util
 * Branch coordinates lookup, Haversine distance and <= 150m proximity validation.
 * Layer: classic browser script (works on file:// and http://). Mixed into window.ActivityManager by the facade.
 */

(function (global) {
  const ENV = global.ADCO_ENV || {};
  const STORAGE_KEY_ACTIVITIES = (ENV.STORAGE_KEYS && ENV.STORAGE_KEYS.ACTIVITIES) || 'ADCO_ACTIVITIES_DATA_V4';
  const ADCO_CATALOGS = global.ADCO_CATALOGS || {};
  const SEED_ACTIVITIES = global.ADCO_SEED_ACTIVITIES || [];
  void STORAGE_KEY_ACTIVITIES; void ADCO_CATALOGS; void SEED_ACTIVITIES;

  class GpsProximityUtil {
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
  }

  (global.ADCO_ACTIVITY_MODULES = global.ADCO_ACTIVITY_MODULES || []).push(GpsProximityUtil);
  global.GpsProximityUtil = GpsProximityUtil;
})(window);
