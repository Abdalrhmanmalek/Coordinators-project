/**
 * ADCO Field Operations - Activity Card Detail View
 */
(function (global) {
  function createDetailView(ctx) {
    const { ActivityManager, AuthManager, user, formatDateTime, formatTwoWordName, renderStatusBadge, showToast } = ctx;
    return function renderActivityDetailView(id) {
      const act = ActivityManager.getActivityById(id);
      if (!act) {
        if (typeof showToast === 'function') {
          showToast('عذراً، لم يتم العثور على بطاقة النشاط المطلوبة', 'warning');
        }
        return;
      }

      const detailSec = document.getElementById('detail-view-section');
      const createSec = document.getElementById('create-form-section');
      if (detailSec) {
        detailSec.classList.remove('is-hidden');
        detailSec.style.display = 'block';
      }
      if (createSec) {
        createSec.classList.add('is-hidden');
        createSec.style.display = 'none';
      }

      const roundsCount = act.followUpHistory ? act.followUpHistory.length : 1;
      const ratingStats = ActivityManager.computeOverallRating(act);
      const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
      const brandShareVal = (1 / brandCount).toFixed(2);

      const sessions = Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0 
        ? act.followUpHistory 
        : [{
            roundNumber: 1,
            roundTitle: 'التوثيق التأسيسي (جولة 1)',
            timestamp: act.timestamp || new Date().toISOString(),
            uploadedBy: act.coordinatorName || 'المنسق',
            uploadedById: act.coordinatorId || 'ADCO',
            reviewStatus: act.status || 'Under Review',
            sessionScore: act.supervisorScore || null,
            sessionNotes: act.supervisorNotes || '',
            reviewerName: act.reviewerName || 'مدير التسويق',
            reviewedAt: act.reviewedAt || null,
            photos: act.initialPhotos || [{ photoUrl: act.photoUrl, sizeKb: 180, width: 1280, height: 720 }]
          }];

      const reviewsFeedHtml = `
        <div class="reviews-feed-container" id="reviews-feed-section">
          <div class="reviews-feed-header">
            <div>
              <h3 class="reviews-feed-title">
                <i data-lucide="clipboard-edit" class="ui-icon ui-icon-md"></i>
                <span>سجل المراجعات وتوجيهات مدير التسويق (${sessions.length} جولات)</span>
              </h3>
              <p class="reviews-feed-subtitle">
                توجيهات وملاحظات إدارة التسويق المباشرة للمنسق لتحسين ترتيب المعروضات ورفع جودة التنسيق الميداني
              </p>
            </div>
            <span class="badge badge-mint" style="font-weight: 700;">
              ${sessions.length} ${sessions.length === 1 ? 'جولة توثيق' : 'جولات توثيق'}
            </span>
          </div>

          <div class="reviews-feed-list">
            ${sessions.map((s, sIdx) => {
              const isPending = !s.sessionScore && (s.reviewStatus === 'Under Review' || !s.reviewStatus);
              const sReviewer = s.reviewerName || act.reviewerName || 'أ. محمد الديب - مدير التسويق';

              let roundScore100 = null;
              let breakdown = null;
              if (s.scoreBreakdown) {
                breakdown = s.scoreBreakdown;
                roundScore100 = (breakdown.newActivity || 0) + (breakdown.executionQuality || 0) + (breakdown.continuity || 0) + (breakdown.documentation || 0);
              } else if (s.sessionScore !== null && s.sessionScore !== undefined) {
                const rawNum = Number(s.sessionScore);
                roundScore100 = rawNum <= 10 ? Math.round(rawNum * 10) : Math.round(rawNum);
                const r = roundScore100 / 100;
                breakdown = {
                  newActivity: Math.min(40, Math.round(40 * r)),
                  executionQuality: Math.min(20, Math.round(20 * r)),
                  continuity: Math.min(25, Math.round(25 * r)),
                  documentation: Math.min(15, Math.round(15 * r))
                };
              }

              // Active products / SKUs for this round
              const roundProducts = Array.isArray(s.products) && s.products.length > 0 
                ? s.products 
                : (Array.isArray(act.products) && act.products.length > 0 ? act.products : null);
              const roundBrands = Array.isArray(s.brands) && s.brands.length > 0
                ? s.brands
                : (Array.isArray(act.brands) && act.brands.length > 0 ? act.brands : ['فلفيتا', 'فييا']);
              const roundSkuText = roundProducts 
                ? roundProducts.map((p) => (typeof p === 'object' ? `${p.brand ? p.brand + ' - ' : ''}${p.skuItem || p.sku || ''}` : p)).filter(Boolean).join(' ، ')
                : (act.skuVariant || 'جميع أصناف العرض المعتمدة');

              return `
                <div class="review-round-card">
                  <div class="review-round-top">
                    <div>
                      <div class="review-round-heading">
                        <span style="color: var(--adco-green-main);">#${s.roundNumber || (sIdx + 1)}</span>
                        <span>${s.roundTitle || `متابعة رقم ${sIdx + 1}`}</span>
                      </div>
                      <div class="review-round-meta">
                        <span>تم الرفع بواسطة: <strong>${s.uploadedBy || act.coordinatorName}</strong></span>
                        <span>•</span>
                        <span dir="ltr">${formatDateTime(s.timestamp)}</span>
                      </div>
                      ${s.location ? `
                        <div class="review-round-gps">
                          <i data-lucide="map-pin" class="ui-icon ui-icon-xs"></i>
                          <span>موقع الهاتف GPS: ${s.location.latitude}&deg; N, ${s.location.longitude}&deg; E (نطاق معتمد &le; 150م)</span>
                        </div>
                      ` : ''}

                      <!-- Participating Products / SKUs in this round -->
                      <div class="review-round-skus" style="margin-top: 8px; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge badge-mint" style="font-size: 0.72rem; font-weight: 700;">العلامات والأصناف بالجولة:</span>
                        <span style="color: var(--adco-gray-700); font-weight: 600;">${roundBrands.join(' ، ')} &bull; ${roundSkuText}</span>
                      </div>
                    </div>

                    <div style="text-align: left; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                      ${renderStatusBadge(s.reviewStatus || act.status)}
                      ${roundScore100 !== null ? `
                        <span class="badge badge-warning" style="font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">
                          <i data-lucide="star" class="ui-icon ui-icon-xs"></i>
                          <span>التقييم: ${roundScore100} / 100</span>
                        </span>
                      ` : `
                        <span class="badge badge-secondary" style="font-size: 0.74rem;">قيد التقييم</span>
                      `}
                    </div>
                  </div>

                  <!-- Photos Gallery for this round -->
                  <div style="margin-top: 10px;">
                    <div style="font-size: 0.75rem; color: var(--adco-gray-600); margin-bottom: 6px; font-weight: 600;">
                      الصور المرفوعة في هذه الجولة (${(s.photos || []).length} صورة — اضغط للتكبير):
                    </div>
                    <div class="timeline-thumbs-grid">
                      ${(s.photos || []).map((p, pIdx) => `
                        <div class="timeline-thumb-item inline-review-thumb" data-sidx="${sIdx}" data-pidx="${pIdx}" title="اضغط لتكبير الصورة">
                          <img src="${p.photoUrl || act.photoUrl}" alt="${s.roundTitle}" onerror="this.onerror=null; this.src='../assets/images/fathalla-branch.avif';" />
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- 4-Criteria Numerical Evaluation Breakdown (Task 2) -->
                  ${breakdown ? `
                    <div class="round-criteria-box" style="margin-top: 10px; background: #ffffff; border: 1px solid var(--adco-green-border); border-radius: 8px; padding: 10px 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--adco-green-deep); display: flex; align-items: center; gap: 5px;">
                          <i data-lucide="trophy" class="ui-icon ui-icon-xs"></i>
                          <span>تقييم مدير التسويق للجولة (المعايير الأربعة الرسمية):</span>
                        </span>
                        <span class="badge badge-success" style="font-size: 0.80rem; font-weight: 800;">${roundScore100} / 100 نقطة</span>
                      </div>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px;">
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>نشاط جديد:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.newActivity} / 40</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>جودة العرض:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.executionQuality} / 20</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>الاستمرارية:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.continuity} / 25</strong>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; font-size: 0.74rem;">
                          <span>التوثيق والدقة:</span>
                          <strong style="color: var(--adco-green-deep); font-weight: 700;">${breakdown.documentation} / 15</strong>
                        </div>
                      </div>
                    </div>
                  ` : ''}

                  <!-- Marketing Manager Written Guidance / Feedback Box -->
                  <div class="review-supervisor-bubble ${isPending ? 'is-pending' : ''}">
                    <div class="review-bubble-header">
                      <span class="review-bubble-title">
                        <i data-lucide="${isPending ? 'clock' : 'clipboard-edit'}" class="ui-icon ui-icon-xs"></i>
                        <span>${isPending ? 'حالة التقييم والتوجيه:' : 'توجيهات مدير التسويق للمنسق:'}</span>
                      </span>
                      <div class="review-bubble-meta">
                        <span class="feedback-reviewer-name">${sReviewer}</span>
                        ${s.reviewedAt ? `<span dir="ltr">(${formatDateTime(s.reviewedAt)})</span>` : ''}
                      </div>
                    </div>

                    ${isPending ? `
                      <p class="review-bubble-pending-text">
                        هذه الجولة بانتظار فحص واعتماد مدير التسويق. سيتم تحديث التقييم وتوجيهات التحسين فور مراجعتها.
                      </p>
                    ` : `
                      <p class="review-bubble-notes">
                        "${s.sessionNotes || act.supervisorNotes || 'تم فحص وترتيب العرض، والتأكد من مطابقة المعايير الميدانية المعتمدة.'}"
                      </p>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Callout: Add Follow-up Photo (Directly below reviews) -->
          <div class="add-followup-callout">
            <div class="add-followup-callout-inner">
              <div class="add-followup-callout-icon">
                <i data-lucide="camera" class="ui-icon ui-icon-lg"></i>
              </div>
              <h4 class="add-followup-callout-title">إضافة متابعة ميدانية جديدة بالصور (متابعة #${roundsCount + 1})</h4>
              <p class="add-followup-callout-desc">
                المنسق المتميز يقوم بتوثيق النشاط بشكل دوري ومستمر لتأكيد استمرارية العرض، ونظافة الستاند، وتوافر جميع الأصناف. كل جولة متابعة جديدة ترفع نقاط تقييمك العام لدى مدير التسويق.
              </p>
              <button type="button" class="btn btn-primary btn-add-followup-cta btn-trigger-followup" id="btn-add-followup-bottom">
                <i data-lucide="camera" class="ui-icon ui-icon-md"></i>
                <span>التقاط وإضافة متابعة جديدة (متابعة #${roundsCount + 1})</span>
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('detail-card-mount').innerHTML = `
        <div class="activity-workspace-grid">
          <!-- Right: Metadata & History -->
          <div class="card" style="padding: 24px;">
            <div class="overall-rating-banner">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i data-lucide="star" class="ui-icon ui-icon-md"></i>
                <div>
                  <strong style="font-size: 1rem; display: block;">${ratingStats.badgeText}</strong>
                  <span style="font-size: 0.78rem;">متوسط تقييمات المشرف عبر جولات المتابعة</span>
                </div>
              </div>
              ${renderStatusBadge(act.status)}
            </div>

            <h2 style="margin-bottom: 6px;">${act.client}</h2>
            <div style="font-size: 0.8rem; color: var(--adco-gray-600); margin-bottom: 16px;">كود البطاقة: ${act.id}</div>

            <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm btn-trigger-followup" id="btn-add-followup-top">
                <i data-lucide="camera" class="ui-icon ui-icon-sm"></i>
                <span>إضافة متابعة بالصور (متابعة #${roundsCount + 1})</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-open-timeline">
                <i data-lucide="calendar-clock" class="ui-icon ui-icon-sm"></i>
                <span>سجل المراجعات والتوجيهات (${roundsCount})</span>
              </button>
            </div>

            <div class="meta-row"><span>الفرع:</span><strong>${act.branch}</strong></div>
            <div class="meta-row"><span>قطاع المنسق:</span><strong>${act.coordinatorBranch || '-'}</strong></div>
            <div class="meta-row"><span>المنسق:</span><strong>${act.coordinatorName} (${act.coordinatorId})</strong></div>
            <div class="meta-row"><span>النشاط:</span><strong>${act.activity || '-'}</strong></div>
            <div class="meta-row"><span>نوع النشاط:</span><strong>${act.activityType || '-'}</strong></div>
            <div class="meta-row"><span>عدد النشاط:</span><strong>${act.activityCount || 1}</strong></div>
            <div class="meta-row"><span>العلامات التجارية (${brandCount}):</span><strong>${(act.brands || []).join(' ، ')}</strong></div>
            <div class="meta-row"><span>المنتج:</span><strong>${act.skuVariant}</strong></div>
            ${act.magazineDate ? `<div class="meta-row"><span>تاريخ إصدار المجلة:</span><strong></strong></div>` : ''}
            <div class="meta-row"><span>تاريخ إنشاء البطاقة:</span><strong dir="ltr">${formatDateTime(act.createdAt || act.timestamp)}</strong></div>
            <div class="meta-row" style="background: #f0fdf4; padding: 6px 10px; border-radius: 6px; border: 1px solid #bbf7d0;">
              <span>تاريخ وتوقيت بدء النشاط:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong dir="ltr" id="detail-start-date-val">${act.activityDateFormatted || (act.activityDate ? formatDateTime(act.activityDate) : formatDateTime(act.timestamp))}</strong>
                ${(user && user.role === 'supervisor') ? `
                  <button type="button" class="btn btn-outline btn-xs" id="btn-edit-act-date" title="تعديل تاريخ بدء النشاط كمشرف" style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">
                    تعديل التاريخ
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="meta-row" style="background: ${act.isClosed ? '#f8fafc' : '#f0fdf4'}; padding: 6px 10px; border-radius: 6px; border: 1px solid ${act.isClosed ? '#cbd5e1' : '#86efac'};">
              <span>تاريخ وتوقيت انتهاء النشاط:</span>
              <strong dir="ltr">${act.endDate || (act.closedAt ? formatDateTime(act.closedAt) : '<span class="badge badge-mint" style="font-size:0.75rem;">نشط ومستمر (لم ينتهِ بعد)</span>')}</strong>
            </div>

            <!-- INLINE REVIEWS & MARKETING GUIDANCE SECTION -->
            ${reviewsFeedHtml}

            <!-- Official Evaluation Criteria Breakdown (100 Points) -->
            <div class="card" style="margin-top: 16px; background: #f8fafc; border: 1.5px solid var(--adco-green-border); padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--adco-gray-200); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <strong style="color: var(--adco-green-deep); font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="shield-check" class="ui-icon ui-icon-sm"></i>
                  <span>معايير التقييم الرسمي (إجمالي 100 نقطة)</span>
                </strong>
                <span class="badge badge-success" style="font-size: 0.92rem; font-weight: 800;">
                  ${ratingStats.totalWeightedScore} / 100 نقطة
                </span>
              </div>
              <div class="responsive-form-grid" style="gap: 10px;">
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">الأنشطة الجديدة المعتمدة</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.newActivity.score} / 40</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">جودة التنفيذ</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.executionQuality.score} / 20</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">مدة الاستمرارية المثبتة</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.continuity.score} / 25</span>
                </div>
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; font-weight:600;">الالتزام بالتوثيق وصحة البيانات</span>
                  <span class="badge badge-mint" style="font-weight:700;">${ratingStats.breakdown.documentation.score} / 15</span>
                </div>
              </div>
            </div>

${global.ActivityCardDetailActions.renderCompletionAndRightPanel(act, user, formatDateTime)}`;
      global.ActivityCardDetailActions.bindDetailEvents(ctx, act);
    };
  }
  global.ActivityCardDetailView = { create: createDetailView };
})(typeof window !== 'undefined' ? window : globalThis);
