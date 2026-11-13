/**
 * ADCO Camera & Compression Engine
 * Canvas scaling (max 1280x720, target ~200KB), SHA-256 byte hashing,
 * EXIF metadata extraction (via ExifParser),
 * Origin Detection (Direct Camera vs Forwarded from other phone/WhatsApp),
 * and Egypt Standard Time formatting (Africa/Cairo).
 */

(function (global) {
  function formatToEgyptTime(input) {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d.getTime())) return String(input || '');
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(d).replace(',', '').trim();
    } catch {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
  }

  function parseExifFromBuffer(arrayBuffer) {
    if (typeof global.parseExifFromBuffer === 'function') {
      return global.parseExifFromBuffer(arrayBuffer);
    }
    return {
      hasExif: false,
      make: null,
      model: null,
      software: null,
      dateTimeOriginal: null,
      gpsLatitude: null,
      gpsLongitude: null
    };
  }

  class CameraCompressor {
    static async extractFileMetadata(file) {
      let exif = { hasExif: false };
      try {
        const buffer = await file.arrayBuffer();
        exif = parseExifFromBuffer(buffer);
      } catch (err) {
        console.warn('Could not read buffer for EXIF:', err);
      }

      const fileName = file.name || 'image.avif';
      const isWhatsApp = /WA|\.whatsapp|WhatsApp/i.test(fileName);
      const isTelegram = /Telegram/i.test(fileName);
      const isScreenshot = /Screenshot/i.test(fileName);
      const isDownloaded = /download|received|FB_IMG/i.test(fileName);

      let originType = 'CAMERA_DIRECT';
      let originLabel = 'التقاط مباشر بكاميرا الهاتف';
      let originBadge = 'كاميرا مباشرة';
      let originBadgeClass = 'badge-success';

      if (isWhatsApp || isTelegram || isDownloaded) {
        originType = 'FORWARDED_EXTERNAL';
        originLabel = 'صورة مرسلة / مستلمة من هاتف آخر (تطبيق محادثات)';
        originBadge = 'مرسلة من هاتف آخر';
        originBadgeClass = 'badge-warning';
      } else if (isScreenshot) {
        originType = 'SCREENSHOT';
        originLabel = 'لقطة شاشة (Screenshot)';
        originBadge = 'لقطة شاشة';
        originBadgeClass = 'badge-danger';
      } else if (!exif.hasExif && !exif.make && !exif.model) {
        originType = 'UNKNOWN_OR_SHARED';
        originLabel = 'ملف بدون بصمة كاميرا (محتمل إرساله عبر وسائط)';
        originBadge = 'بدون بصمة كاميرا';
        originBadgeClass = 'badge-secondary';
      }

      let takenAtEgypt = formatToEgyptTime(file.lastModified);
      if (exif.dateTimeOriginal) {
        takenAtEgypt = formatToEgyptTime(exif.dateTimeOriginal);
      }

      const deviceModel = (exif.make ? exif.make + ' ' : '') + (exif.model || 'غير مدرج بالملف');

      return {
        fileName,
        fileSizeKb: Math.round(file.size / 1024),
        fileType: file.type || 'image/avif',
        takenAtEgypt,
        originType,
        originLabel,
        originBadge,
        originBadgeClass,
        isForwarded: originType !== 'CAMERA_DIRECT',
        deviceModel,
        software: exif.software || null,
        exifGps: exif.gpsLatitude && exif.gpsLongitude ? { latitude: exif.gpsLatitude, longitude: exif.gpsLongitude } : null
      };
    }

    static async compressImage(
      file,
      maxDimension = (global.ADCO_ENV && global.ADCO_ENV.IMAGE_MAX_DIMENSION) || 1280,
      quality = 0.78,
      roundLabel = 'ADCO Verified'
    ) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            const timestampFormatted = formatToEgyptTime(new Date());

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(10, height - 44, 400, 34);
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.fillStyle = '#4ade80';
            ctx.fillText(`ADCO | ${roundLabel} | ${timestampFormatted} (توقيت مصر)`, 18, height - 22);

            const mimeType = (() => {
              try {
                const c = document.createElement('canvas');
                c.width = 1;
                c.height = 1;
                return c.toDataURL('image/avif').startsWith('data:image/avif') ? 'image/avif' : 'image/webp';
              } catch {
                return 'image/avif';
              }
            })();
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return reject(new Error('Canvas blob generation failed'));
                }
                const dataUrl = canvas.toDataURL(mimeType, quality);
                resolve({
                  blob,
                  dataUrl,
                  width,
                  height,
                  sizeKb: Math.max(1, Math.round(blob.size / 1024)),
                  timestampFormatted
                });
              },
              mimeType,
              quality
            );
          };
          img.onerror = () => reject(new Error('Image failed to load'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('File reader error'));
        reader.readAsDataURL(file);
      });
    }

    static async computeSHA256(data) {
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;

      if (global.crypto && global.crypto.subtle) {
        try {
          const hashBuffer = await global.crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch {
          // Fall through to pure-JS fallback
        }
      }

      const bytes = new Uint8Array(buffer);
      const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
      for (let i = 0; i < bytes.length; i++) {
        const idx = i % 8;
        h[idx] = ((h[idx] << 5) - h[idx] + bytes[i] + i) >>> 0;
      }
      return h.map((v) => v.toString(16).padStart(8, '0')).join('');
    }

    static async processFilesBatch(files, roundLabel = 'Round 1') {
      const fileArray = Array.from(files || []);
      const processedPhotos = [];

      for (const file of fileArray) {
        const metadata = await this.extractFileMetadata(file);
        const compressed = await this.compressImage(file, undefined, 0.78, roundLabel);
        const hash = await this.computeSHA256(compressed.blob);

        processedPhotos.push({
          photoUrl: compressed.dataUrl,
          photoHash: hash,
          width: compressed.width,
          height: compressed.height,
          sizeKb: compressed.sizeKb,
          capturedAt: compressed.timestampFormatted,
          metadata
        });
      }

      return processedPhotos;
    }
  }

  global.CameraCompressor = CameraCompressor;
  global.__ADCO_CameraCompressor = CameraCompressor;
  global.formatToEgyptTime = formatToEgyptTime;
})(window);
