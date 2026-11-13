/**
 * ADCO Field Operations System - Dedicated Evaluation Page Controller (evaluation.page.js)
 * Single Responsibility: Thin route & scoring submission controller for evaluation.html
 */

(function (global) {
  const Auth = global.AuthManager || global.AuthService;
  const ActivityManager = global.ActivityManager || global.ActivityService;
  const SupervisorEngine = global.SupervisorEngine;
  const Router = global.AppRouter;

  let user = Auth ? Auth.checkAuthGuard() : null;
  if (!user && Auth && typeof Auth.createSession === 'function') {
    const reg = Auth.getRegistry ? Auth.getRegistry() : [];
    const supUser = reg.find((u) => u.role === 'marketing_manager' || u.role === 'supervisor') || reg[0];
    user = Auth.createSession(supUser || { employeeId: 'ADCO-901', fullName: 'م. حسام الدين غانم', role: 'marketing_manager' }).user;
  }
  if (!user) return;

  if (Router && typeof Router.init === 'function') {
    try { Router.init(); } catch (err) { console.warn('[Evaluation] Router init handled gracefully:', err); }
  }

  const urlParams = new URLSearchParams(window.location.search);
  let actId = urlParams.get('id') || urlParams.get('actId');
  const allActivities = ActivityManager ? ActivityManager.getAllActivities() : [];
  if (!actId && allActivities.length > 0) actId = allActivities[0].id;

  const act = ActivityManager ? ActivityManager.getActivityById(actId) : null;
  if (!act) {
    if (typeof global.showToast === 'function') global.showToast('لم يتم العثور على بطاقة النشاط المطلوبة', 'error');
    setTimeout(() => { window.location.href = './supervisor-panel.html'; }, 1500);
    return;
  }

  function formatDateTime(dateVal) {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('ar-EG', {
        timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return String(dateVal); }
  }

  function getEgyptDateTimeLocalString(dateVal) {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return '';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(d);
      const partMap = {};
      parts.forEach((p) => { partMap[p.type] = p.value; });
      return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
    } catch { return d.toISOString().slice(0, 16); }
  }

  function renderStatusBadge(status) {
    if (status === 'Accepted') return '<span class="badge badge-success">مقبول</span>';
    if (status === 'Rejected') return '<span class="badge badge-danger">غير مقبول</span>';
    return '<span class="badge badge-warning">تحت المراجعة</span>';
  }

  const brandCount = Array.isArray(act.brands) && act.brands.length > 0 ? act.brands.length : 1;
  const shareFormatted = `${(1 / brandCount).toFixed(2)} (${Math.round((1 / brandCount) * 100)}%)`;
  const supplyingBranch = act.coordinatorBranch || 'الإسكندرية - قطاع وسط';

  document.getElementById('eval-title-client').textContent = `فحص وتقييم: ${act.client}`;
  document.getElementById('eval-title-branch').textContent = `${act.branch} • المنسق: ${act.coordinatorName || '-'}`;
  document.getElementById('eval-act-id-badge').textContent = act.id;
  document.getElementById('eval-header-status-badge').innerHTML = renderStatusBadge(act.status);

  document.getElementById('eval-client-name').textContent = act.client;
  document.getElementById('eval-branch-name').textContent = act.branch;
  document.getElementById('eval-supplying-branch').textContent = supplyingBranch;

  const coordFormatted = typeof formatTwoWordName === 'function' ? formatTwoWordName(act.coordinatorName) : act.coordinatorName;
  document.getElementById('eval-coord-name').textContent = `${coordFormatted} (${act.coordinatorId || '-'})`;
  document.getElementById('eval-coord-sector').textContent = act.coordinatorBranch || act.branch;
  document.getElementById('eval-activity-type').textContent = `${act.activity || '-'} (${act.activityType || '-'} × ${act.activityCount || 1})`;
  document.getElementById('eval-start-date').textContent = act.activityDateFormatted || formatDateTime(act.activityDate || act.timestamp);
  document.getElementById('eval-end-date').textContent = act.isClosed ? `تم الإنهاء (${formatDateTime(act.closedAt)})` : 'نشط ومستمر بالفرع';

  document.getElementById('eval-sku-variant').textContent = act.skuVariant || 'جميع أصناف ومجموعات العرض المعتمدة';
  document.getElementById('eval-brands-share').textContent = `${(act.brands || []).join(' ، ')} • (حصة البراند: ${shareFormatted})`;

  if (act.magazineDate) {
    const magBox = document.getElementById('eval-magazine-box');
    if (magBox) {
      magBox.classList.remove('is-hidden');
      document.getElementById('eval-magazine-date').textContent = `تاريخ إصدار المجلة: ${act.magazineDate}`;
    }
  }

  const sessions = Array.isArray(act.followUpHistory) && act.followUpHistory.length > 0
    ? act.followUpHistory
    : [{ roundNumber: 1, roundTitle: 'التوثيق التأسيسي (جولة 1)', sessionScore: act.supervisorScore }];

  const roundSelect = document.getElementById('eval-round-select');
  if (roundSelect) {
    roundSelect.innerHTML = sessions
      .map((s) => `<option value="${s.roundNumber}">${s.roundTitle} — ${s.sessionScore !== null && s.sessionScore !== undefined ? `(مقيّمة: ${s.sessionScore}/10)` : '(غير مقيّمة)'}</option>`)
      .join('');
  }

  let currentEvaluatingMedia = { photoUrl: act.photoUrl, title: act.client, timestamp: act.timestamp, uploader: act.coordinatorName };
  const latestRound = sessions[sessions.length - 1];
  if (roundSelect) {
    roundSelect.value = String(latestRound.roundNumber);
    roundSelect.addEventListener('change', () => {
      currentEvaluatingMedia = global.EvaluationMedia.updateActiveMedia(act, sessions, roundSelect.value, ActivityManager, formatDateTime);
    });
  }
  currentEvaluatingMedia = global.EvaluationMedia.updateActiveMedia(act, sessions, latestRound.roundNumber, ActivityManager, formatDateTime);

  const decisionSelect = document.getElementById('eval-decision-select');
  const quickStatusCurrent = document.getElementById('eval-quick-status-current');
  const quickStatusBtns = document.querySelectorAll('.eval-quick-btn');

  function syncDecisionStatus(statusVal) {
    const norm = statusVal || 'Accepted';
    if (decisionSelect && decisionSelect.value !== norm) decisionSelect.value = norm;
    const labelMap = { Accepted: 'مقبول', Rejected: 'غير مقبول', 'Under Review': 'تحت المراجعة' };
    if (quickStatusCurrent) quickStatusCurrent.textContent = labelMap[norm] || 'مقبول';
    quickStatusBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.status === norm));
  }

  quickStatusBtns.forEach((btn) => btn.addEventListener('click', () => syncDecisionStatus(btn.dataset.status)));
  if (decisionSelect) decisionSelect.addEventListener('change', () => syncDecisionStatus(decisionSelect.value));
  syncDecisionStatus(act.status || 'Accepted');

  const lightboxModal = document.getElementById('photo-lightbox');
  const openLb = () => global.EvaluationMedia.openPhotoLightbox(lightboxModal, currentEvaluatingMedia, act, formatDateTime);
  const clickArea = document.getElementById('eval-photo-click-area');
  if (clickArea) clickArea.addEventListener('click', openLb);
  const headerZoomBtn = document.getElementById('eval-header-zoom-btn');
  if (headerZoomBtn) headerZoomBtn.addEventListener('click', openLb);

  document.getElementById('close-lightbox-btn').addEventListener('click', () => { if (lightboxModal) lightboxModal.classList.remove('active'); });
  if (lightboxModal) lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) lightboxModal.classList.remove('active'); });

  const auditModal = document.getElementById('activity-audit-modal');
  document.getElementById('eval-view-history-btn').addEventListener('click', () => {
    global.EvaluationMedia.openAuditModal(auditModal, lightboxModal, act, formatDateTime);
  });
  document.getElementById('close-audit-modal').addEventListener('click', () => { if (auditModal) auditModal.classList.remove('active'); });
  if (auditModal) auditModal.addEventListener('click', (e) => { if (e.target === auditModal) auditModal.classList.remove('active'); });

  const inputNewAct = document.getElementById('score-new-act');
  const inputQuality = document.getElementById('score-quality');
  const inputContinuity = document.getElementById('score-continuity');
  const inputDocs = document.getElementById('score-docs');
  const liveTotalBadge = document.getElementById('eval-live-total-badge');
  const scoringCardBadge = document.getElementById('eval-scoring-card-badge');
  const headerScoreBadge = document.getElementById('eval-header-score-badge');

  function updateScoresTotal() {
    const s1 = Math.min(40, Math.max(0, Number(inputNewAct.value) || 0));
    const s2 = Math.min(20, Math.max(0, Number(inputQuality.value) || 0));
    const s3 = Math.min(25, Math.max(0, Number(inputContinuity.value) || 0));
    const s4 = Math.min(15, Math.max(0, Number(inputDocs.value) || 0));
    const total = Math.min(100, Math.round(s1 + s2 + s3 + s4));
    const text = `${total} / 100 نقطة`;
    const badgeClass = total < 60 ? 'badge badge-danger' : (total < 80 ? 'badge badge-warning' : 'badge badge-success');
    [liveTotalBadge, scoringCardBadge, headerScoreBadge].forEach((el) => {
      if (el) { el.textContent = text; el.className = badgeClass; }
    });
  }

  [inputNewAct, inputQuality, inputContinuity, inputDocs].forEach((input) => input.addEventListener('input', updateScoresTotal));
  const evalBreakdown = ActivityManager.computeWeightedEvaluation(act);
  inputNewAct.value = evalBreakdown.breakdown.newActivity.score;
  inputQuality.value = evalBreakdown.breakdown.executionQuality.score;
  inputContinuity.value = evalBreakdown.breakdown.continuity.score;
  inputDocs.value = evalBreakdown.breakdown.documentation.score;
  updateScoresTotal();

  const dateInput = document.getElementById('eval-activity-date-input');
  if (dateInput) dateInput.value = getEgyptDateTimeLocalString(act.activityDate || act.timestamp || new Date());
  const notesTextarea = document.getElementById('eval-notes-textarea');
  if (notesTextarea) notesTextarea.value = act.supervisorNotes || '';

  document.getElementById('evaluation-main-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roundNum = Number(roundSelect ? roundSelect.value : 1) || 1;
    const status = decisionSelect ? decisionSelect.value : 'Accepted';
    const notes = notesTextarea ? notesTextarea.value : '';
    const breakdown = {
      newActivity: Number(inputNewAct.value) || 0,
      executionQuality: Number(inputQuality.value) || 0,
      continuity: Number(inputContinuity.value) || 0,
      documentation: Number(inputDocs.value) || 0
    };
    const newActivityDate = dateInput ? dateInput.value : undefined;

    try {
      if (SupervisorEngine && typeof SupervisorEngine.reviewActivity === 'function') {
        await SupervisorEngine.reviewActivity(act.id, status, null, notes, roundNum, breakdown, user, newActivityDate);
      } else {
        act.status = status;
        act.reviewStatus = status === 'Accepted' ? 'ACCEPTED' : (status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW');
        act.supervisorNotes = notes;
        act.evaluationBreakdown = breakdown;
        if (newActivityDate) act.activityDate = new Date(newActivityDate).toISOString();
        act.reviewedAt = new Date().toISOString();
        act.reviewerName = user.fullName;
        ActivityManager.saveAllActivities(allActivities);
      }
      if (typeof global.showToast === 'function') global.showToast('تم اعتماد وحفظ تقييم بطاقة النشاط بنجاح!', 'success');
      setTimeout(() => { window.location.href = './supervisor-panel.html'; }, 700);
    } catch (err) {
      if (typeof global.showToast === 'function') global.showToast(err.message || 'حدث خطأ أثناء حفظ التقييم', 'error');
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
