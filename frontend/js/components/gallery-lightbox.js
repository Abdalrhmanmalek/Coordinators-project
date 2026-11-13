/**
 * ADCO Multi-Photo Gallery Lightbox (Global Browser Script)
 */
/**
 * Normalize follow-up round photos from either `photos` array (strings or objects)
 * or legacy `photo` / `photoUrl` fields into a clean array of `{ url, photoUrl, ... }`.
 */
function getFollowUpPhotos(round) {
  if (!round || typeof round !== 'object') return [];
  const rawList = Array.isArray(round.photos) && round.photos.length > 0
    ? round.photos
    : (round.photo || round.photoUrl ? [round.photo || round.photoUrl] : []);

  return rawList
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed ? { url: trimmed, photoUrl: trimmed } : null;
      }
      if (typeof item === 'object') {
        const url = item.photoUrl || item.url || item.src || item.photo || '';
        if (!url || typeof url !== 'string') return null;
        return {
          ...item,
          url: url.trim(),
          photoUrl: url.trim()
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Full-screen interactive multi-photo lightbox gallery viewer.
 * Accepts an array of URL strings or `{ url | photoUrl }` objects.
 */
function openPhotoGalleryLightbox(photos, startIndex = 0, meta = {}) {
  if (typeof document === 'undefined') return;
  const normalized = (Array.isArray(photos) ? photos : [photos])
    .map((p) => (typeof p === 'string' ? p : (p && (p.url || p.photoUrl || p.src)) || ''))
    .filter(Boolean);

  if (normalized.length === 0) return;

  let currentIdx = Math.max(0, Math.min(Number(startIndex) || 0, normalized.length - 1));
  let modal = document.getElementById('adco-gallery-lightbox');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adco-gallery-lightbox';
    modal.className = 'adco-gallery-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="adco-gallery-topbar">
        <div class="adco-gallery-meta">
          <strong id="adco-gal-title" class="adco-gallery-title">معاينة الصور الميدانية</strong>
          <span id="adco-gal-subtitle" class="adco-gallery-subtitle"></span>
        </div>
        <div class="adco-gallery-controls">
          <span id="adco-gal-counter" class="adco-gallery-counter">1 / 1</span>
          <button type="button" id="adco-gal-close" class="adco-gallery-close-btn" aria-label="إغلاق">
            <i data-lucide="x" class="ui-icon ui-icon-md"></i>
          </button>
        </div>
      </div>
      <div class="adco-gallery-stage">
        <button type="button" id="adco-gal-prev" class="adco-gallery-nav-btn adco-gallery-nav-prev" aria-label="الصورة السابقة">
          <i data-lucide="chevron-right" class="ui-icon ui-icon-lg"></i>
        </button>
        <img id="adco-gal-img" class="adco-gallery-img" src="" alt="معاينة الصورة الميدانية" />
        <button type="button" id="adco-gal-next" class="adco-gallery-nav-btn adco-gallery-nav-next" aria-label="الصورة التالية">
          <i data-lucide="chevron-left" class="ui-icon ui-icon-lg"></i>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    if (typeof window.refreshIcons === 'function') {
      window.refreshIcons(modal);
    }
  }

  const imgEl = modal.querySelector('#adco-gal-img');
  const titleEl = modal.querySelector('#adco-gal-title');
  const subEl = modal.querySelector('#adco-gal-subtitle');
  const counterEl = modal.querySelector('#adco-gal-counter');
  const prevBtn = modal.querySelector('#adco-gal-prev');
  const nextBtn = modal.querySelector('#adco-gal-next');
  const closeBtn = modal.querySelector('#adco-gal-close');

  const renderSlide = () => {
    const total = modal._galPhotos.length;
    const idx = modal._galIdx;
    imgEl.src = modal._galPhotos[idx];
    counterEl.textContent = `${idx + 1} / ${total}`;
    const showNav = total > 1;
    prevBtn.style.display = showNav ? 'inline-flex' : 'none';
    nextBtn.style.display = showNav ? 'inline-flex' : 'none';
  };

  const stepSlide = (delta) => {
    const total = modal._galPhotos.length;
    if (total <= 1) return;
    modal._galIdx = (modal._galIdx + delta + total) % total;
    renderSlide();
  };

  const closeLightbox = () => {
    modal.classList.remove('active');
    if (modal._galKeyHandler) {
      document.removeEventListener('keydown', modal._galKeyHandler);
      modal._galKeyHandler = null;
    }
  };

  modal._galPhotos = normalized;
  modal._galIdx = currentIdx;
  titleEl.textContent = (meta && meta.title) || 'معاينة الصور الميدانية';
  const subParts = [];
  if (meta && meta.user) subParts.push(`بواسطة: ${meta.user}`);
  if (meta && meta.time) subParts.push(meta.time);
  subEl.textContent = subParts.join(' • ');

  prevBtn.onclick = (e) => { e.stopPropagation(); stepSlide(-1); };
  nextBtn.onclick = (e) => { e.stopPropagation(); stepSlide(1); };
  closeBtn.onclick = (e) => { e.stopPropagation(); closeLightbox(); };
  modal.onclick = (e) => {
    if (e.target === modal || e.target.classList.contains('adco-gallery-stage')) {
      closeLightbox();
    }
  };

  if (modal._galKeyHandler) {
    document.removeEventListener('keydown', modal._galKeyHandler);
  }
  modal._galKeyHandler = (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      stepSlide(1);
    } else if (e.key === 'ArrowRight') {
      stepSlide(-1);
    }
  };
  document.addEventListener('keydown', modal._galKeyHandler);

  renderSlide();
  modal.classList.add('active');
  if (typeof window.refreshIcons === 'function') {
    window.refreshIcons(modal);
  }
}

if (typeof window !== 'undefined') {
  window.getFollowUpPhotos = getFollowUpPhotos;
  window.openPhotoGalleryLightbox = openPhotoGalleryLightbox;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...(module.exports || {}),
    getFollowUpPhotos,
    openPhotoGalleryLightbox
  };
}

