/**
 * ADCO Field Operations - Activity Card Form Submission
 */
(function (global) {
  function initSubmit(ctx) {
    const { ActivityManager, ADCO_CATALOGS, user, getSelectedProducts, getStagedPhotos, getCurrentActivityId, getDeviceLocation, requestDeviceLocation, showToast } = ctx;
    document.getElementById('activity-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientVal = clientCombo.getValue();
      const branchVal = branchCombo.getValue();
      const coordBranchVal = coordBranchCombo.getValue();
      const activityVal = activityCombo.getValue();
      const activityTypeVal = activityTypeCombo.getValue();
      const activityCountVal = countSelect ? (Number(countSelect.value) || 1) : 1;
      const distinctBrands = [...new Set(getSelectedProducts().map((p) => p.brand).filter(Boolean))];
      const skuVal = getSelectedProducts().map((p) => p.sku).join(' | ');
      const magStartVal = magStartInput ? magStartInput.value : '';
      const magEndVal = magEndInput ? magEndInput.value : '';

      if (!clientVal || !branchVal || !coordBranchVal || !activityVal || !activityTypeVal || !skuVal) {
        return showToast('يرجى استكمال جميع الحقول الإلزامية', 'warning');
      }

      if (activityVal === 'فرشة مجلة') {
        if (!magStartVal || !magEndVal) {
          return showToast('يرجى تحديد تاريخي البداية والنهاية للمجلة عند اختيار "فرشة مجلة"', 'warning');
        }
        if (magEndVal < magStartVal) {
          return showToast('تاريخ نهاية المجلة يجب أن يكون لاحقاً أو مساوياً لتاريخ البداية', 'warning');
        }
      }

      if (getSelectedProducts().length === 0) {
        return showToast('يرجى إضافة منتج واحد على الأقل عبر زر (+ إضافة منتج)', 'warning');
      }

      const actDateEl = document.getElementById('f-activity-date');
      const actDateVal = actDateEl ? actDateEl.value : '';

      const btn = document.getElementById('submit-activity-btn');
      btn.disabled = true;
      btn.innerHTML = `<span>جاري التحقق من الموقع الجغرافي (GPS)...</span>`;

      try {
        // Ensure live device GPS coordinates are captured
        if (!getDeviceLocation()) {
          await requestDeviceLocation(branchVal);
        }

        const catalogs = window.ADCO_CATALOGS || {};
        const bMap = catalogs.branchDetailsMap || {};
        const cMap = catalogs.clientDetailsMap || {};
        const branchEntry = bMap[branchVal] || {};
        const clientEntry = cMap[clientVal] || {};
        const branchId = branchEntry.id || `BR-${encodeURIComponent(branchVal).slice(0, 10)}`;
        const branchCode = branchEntry.code || 'ALX-00944';
        const clientId = clientEntry.id || `CLI-${encodeURIComponent(clientVal).slice(0, 8)}`;

        // Item 3: Ensure open Branch Card ID
        const urlParams = new URLSearchParams(window.location.search);
        let branchCardId = urlParams.get('branchCardId');
        if (!branchCardId) {
          const storedCards = JSON.parse(localStorage.getItem('ADCO_BRANCH_CARDS') || '{}');
          const branchKey = `${clientId}::${branchId}`;
          if (storedCards[branchKey]) {
            branchCardId = storedCards[branchKey].id;
          } else {
            branchCardId = `BC-${branchCode}-${Date.now().toString().slice(-4)}`;
            storedCards[branchKey] = { id: branchCardId, clientId, branchId, branchCode, openedAt: new Date().toISOString(), status: 'OPEN' };
            localStorage.setItem('ADCO_BRANCH_CARDS', JSON.stringify(storedCards));
          }
        }

        // Item 4: Send structured IDs
        const productsPayload = getSelectedProducts().map((p) => ({
          brandId: p.brandId || `BRD-${encodeURIComponent(p.brand || 'VELV').slice(0, 8)}`,
          productGroupId: p.productGroupId || 'GRP-DEFAULT',
          skuId: p.skuId || `SKU-${encodeURIComponent(p.sku || p.skuItem || 'DEF').slice(0, 10)}`
        }));

        // Item 7: Multiple photos array per round
        const photosPayload = initialProcessedPhotos.map((p) => ({
          photoUrl: p.photoUrl,
          photoHash: p.photoHash || 'placeholder-hash',
          width: p.width || 1280,
          height: p.height || 720,
          sizeKb: p.sizeKb || 165,
          capturedAt: p.capturedAt || new Date().toISOString(),
          originType: p.originType || 'CAMERA_DIRECT'
        }));

        const payload = {
          branchCardId,
          coordinatorId: user.employeeId,
          coordinatorName: user.fullName,
          client: clientVal,
          clientId,
          branch: branchVal,
          branchId,
          branchCode,
          coordinatorBranch: coordBranchVal,
          activity: activityVal,
          activityType: activityTypeVal,
          activityCount: activityCountVal,
          products: productsPayload,
          brands: distinctBrands,
          skuVariant: skuVal,
          activityDate: actDateVal || undefined,
          magazineDate: activityVal === 'فرشة مجلة' ? (magStartVal + (magEndVal ? ' إلى ' + magEndVal : '')) : '',
          magazineStartDate: activityVal === 'فرشة مجلة' ? magStartVal : null,
          magazineEndDate: activityVal === 'فرشة مجلة' ? magEndVal : null,
          photos: photosPayload,
          initialPhotos: photosPayload,
          photoUrl: photosPayload[0] ? photosPayload[0].photoUrl : '',
          photoHash: photosPayload[0] ? photosPayload[0].photoHash : '',
          latitude: getDeviceLocation() ? getDeviceLocation().latitude : undefined,
          longitude: getDeviceLocation() ? getDeviceLocation().longitude : undefined,
          location: getDeviceLocation(),
          locationConfirmedOutOfRange: window._adcoConfirmedOutOfRange || false
        };

        btn.innerHTML = `<span>جاري اعتماد البيانات...</span>`;
        const res = await ActivityManager.submitActivity(payload);
        window._adcoConfirmedOutOfRange = false;
        showToast('تم اعتماد النشاط وحفظه بنجاح داخل بطاقة الفرع', 'success');
        setTimeout(() => {
          const targetId = res.record ? (res.record.activityRef || res.record.id) : '';
          window.location.href = `./activity-details.html?id=${encodeURIComponent(targetId)}`;
        }, 400);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check-circle-2" class="ui-icon"></i><span>اعتماد وإرسال بطاقة النشاط</span>`;

        // Item 6: Out-of-range confirmation dialog (< 500m)
        if (err.code === 'CONFIRM_OUT_OF_RANGE') {
          const userConfirmed = confirm(err.message + '\n\nاضغط "موافق" للإرسال مع إشعار المشرف بتأكيد الموقع، أو "إلغاء" للعودة.');
          if (userConfirmed) {
            window._adcoConfirmedOutOfRange = true;
            document.getElementById('activity-form').dispatchEvent(new Event('submit'));
            return;
          }
        }
        showToast(err.message, 'error', 6000);
      }
    });
  }
  global.ActivityCardSubmit = { init: initSubmit };
})(typeof window !== 'undefined' ? window : globalThis);
