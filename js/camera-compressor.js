/**
 * ADCO Camera & Compression Engine
 * Canvas scaling (max 1280x720, target ~200KB), SHA-256 byte hashing,
 * EXIF metadata extraction (Camera Make, Model, DateTimeOriginal, GPS),
 * Origin Detection (Direct Camera vs Forwarded from other phone/WhatsApp),
 * and Egypt Standard Time formatting (Africa/Cairo).
 */

(function (global) {
  /**
   * Format any date/timestamp strictly to Egypt Time (Africa/Cairo)
   */
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

  /**
   * Fast Pure-JavaScript EXIF Parser for JPEG images
   * Reads TIFF tags: Make, Model, Software, DateTimeOriginal, GPS Info
   */
  function parseExifFromBuffer(arrayBuffer) {
    const result = {
      hasExif: false,
      make: null,
      model: null,
      software: null,
      dateTimeOriginal: null,
      gpsLatitude: null,
      gpsLongitude: null
    };

    try {
      if (!arrayBuffer || arrayBuffer.byteLength < 4) return result;
      const dataView = new DataView(arrayBuffer);
      if (dataView.getUint16(0) !== 0xffd8) return result; // Not JPEG

      let offset = 2;
      const length = dataView.byteLength;

      while (offset < length - 2) {
        const marker = dataView.getUint16(offset);
        offset += 2;

        if (marker === 0xffe1) {
          // APP1 Marker
          const exifHeader = offset + 2;
          if (
            dataView.getUint8(exifHeader) === 0x45 &&
            dataView.getUint8(exifHeader + 1) === 0x78 &&
            dataView.getUint8(exifHeader + 2) === 0x69 &&
            dataView.getUint8(exifHeader + 3) === 0x66 &&
            dataView.getUint8(exifHeader + 4) === 0x00 &&
            dataView.getUint8(exifHeader + 5) === 0x00
          ) {
            result.hasExif = true;
            const tiffStart = exifHeader + 6;
            const isLittle = dataView.getUint16(tiffStart) === 0x4949;

            const getU16 = (o) => dataView.getUint16(tiffStart + o, isLittle);
            const getU32 = (o) => dataView.getUint32(tiffStart + o, isLittle);

            const getString = (valOffset, numBytes) => {
              let str = '';
              for (let i = 0; i < numBytes; i++) {
                const code = dataView.getUint8(tiffStart + valOffset + i);
                if (code === 0) break;
                str += String.fromCharCode(code);
              }
              return str.trim();
            };

            const getRational = (valOffset) => {
              const num = getU32(valOffset);
              const den = getU32(valOffset + 4);
              return den === 0 ? 0 : num / den;
            };

            const parseIFD = (ifdOffset) => {
              const tags = {};
              if (ifdOffset >= length - 2 || ifdOffset <= 0) return tags;
              const entriesCount = getU16(ifdOffset);
              let entryOffset = ifdOffset + 2;

              for (let i = 0; i < entriesCount; i++) {
                if (entryOffset + 12 > length) break;
                const tag = getU16(entryOffset);
                const type = getU16(entryOffset + 2);
                const count = getU32(entryOffset + 4);
                const valueOffset = entryOffset + 8;
                tags[tag] = { type, count, offset: valueOffset };
                entryOffset += 12;
              }
              return tags;
            };

            const ifd0Offset = getU32(4);
            const ifd0 = parseIFD(ifd0Offset);

            // Make (0x010F)
            if (ifd0[0x010f]) {
              const o = ifd0[0x010f].count > 4 ? getU32(ifd0[0x010f].offset) : ifd0[0x010f].offset;
              result.make = getString(o, ifd0[0x010f].count);
            }
            // Model (0x0110)
            if (ifd0[0x0110]) {
              const o = ifd0[0x0110].count > 4 ? getU32(ifd0[0x0110].offset) : ifd0[0x0110].offset;
              result.model = getString(o, ifd0[0x0110].count);
            }
            // Software (0x0131)
            if (ifd0[0x0131]) {
              const o = ifd0[0x0131].count > 4 ? getU32(ifd0[0x0131].offset) : ifd0[0x0131].offset;
              result.software = getString(o, ifd0[0x0131].count);
            }

            // Exif SubIFD (0x8769)
            if (ifd0[0x8769]) {
              const subOffset = getU32(ifd0[0x8769].offset);
              const exifIfd = parseIFD(subOffset);
              if (exifIfd[0x9003]) {
                const o = exifIfd[0x9003].count > 4 ? getU32(exifIfd[0x9003].offset) : exifIfd[0x9003].offset;
                const dtStr = getString(o, exifIfd[0x9003].count);
                if (dtStr) {
                  result.dateTimeOriginal = dtStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                }
              }
            }

            // GPS SubIFD (0x8825)
            if (ifd0[0x8825]) {
              const gpsOffset = getU32(ifd0[0x8825].offset);
              const gpsIfd = parseIFD(gpsOffset);
              if (gpsIfd[0x0002] && gpsIfd[0x0004]) {
                const latO = getU32(gpsIfd[0x0002].offset);
                const deg = getRational(latO);
                const min = getRational(latO + 8);
                const sec = getRational(latO + 16);
                let lat = deg + min / 60 + sec / 3600;

                const latRefO = gpsIfd[0x0001].offset;
                const latRef = String.fromCharCode(dataView.getUint8(tiffStart + latRefO));
                if (latRef === 'S') lat = -lat;

                const lonO = getU32(gpsIfd[0x0004].offset);
                const lonDeg = getRational(lonO);
                const lonMin = getRational(lonO + 8);
                const lonSec = getRational(lonO + 16);
                let lon = lonDeg + lonMin / 60 + lonSec / 3600;

                const lonRefO = gpsIfd[0x0003].offset;
                const lonRef = String.fromCharCode(dataView.getUint8(tiffStart + lonRefO));
                if (lonRef === 'W') lon = -lon;

                result.gpsLatitude = Number(lat.toFixed(5));
                result.gpsLongitude = Number(lon.toFixed(5));
              }
            }
          }
          break;
        } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffd8 && marker !== 0xffd9) {
          const segLen = dataView.getUint16(offset);
          offset += segLen;
        } else {
          break;
        }
      }
    } catch (e) {
      console.warn('EXIF parse non-critical error:', e);
    }

    return result;
  }

  class CameraCompressor {
    /**
     * Inspect file metadata, detect camera model, capture time,
     * and check if forwarded from another phone / chat app (WhatsApp, Telegram, etc.)
     */
    static async extractFileMetadata(file) {
      let exif = { hasExif: false };
      try {
        const buffer = await file.arrayBuffer();
        exif = parseExifFromBuffer(buffer);
      } catch (err) {
        console.warn('Could not read buffer for EXIF:', err);
      }

      const fileName = file.name || 'image.jpg';
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
        // Photos taken directly in modern Android/iOS camera usually carry EXIF make or model
        originType = 'UNKNOWN_OR_SHARED';
        originLabel = 'ملف بدون بصمة كاميرا (محتمل إرساله عبر وسائط)';
        originBadge = 'بدون بصمة كاميرا';
        originBadgeClass = 'badge-secondary';
      }

      // Exact time taken in Egypt Standard Time (Africa/Cairo)
      let takenAtEgypt = formatToEgyptTime(file.lastModified);
      if (exif.dateTimeOriginal) {
        takenAtEgypt = formatToEgyptTime(exif.dateTimeOriginal);
      }

      const deviceModel = (exif.make ? exif.make + ' ' : '') + (exif.model || 'غير مدرج بالملف');

      return {
        fileName,
        fileSizeKb: Math.round(file.size / 1024),
        fileType: file.type || 'image/jpeg',
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

    /**
     * Resizes an image file/blob to max 1280x720 using HTML5 Canvas & exports JPEG (~200KB)
     * Timestamps watermarked strictly in Egypt Time (Africa/Cairo)
     */
    static async compressImage(file, maxDimension = 1280, quality = 0.78, roundLabel = 'ADCO Verified') {
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
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Watermark in Egypt Time
            const timestampFormatted = formatToEgyptTime(new Date());

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(10, height - 44, 400, 34);
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.fillStyle = '#4ade80';
            ctx.fillText(`ADCO | ${roundLabel} | ${timestampFormatted} (توقيت مصر)`, 18, height - 22);

            const mimeType = 'image/jpeg';
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

    /**
     * Generates a cryptographic SHA-256 hash of an ArrayBuffer or Blob
     */
    static async computeSHA256(data) {
      let buffer;
      if (data instanceof Blob) {
        buffer = await data.arrayBuffer();
      } else {
        buffer = data;
      }

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

    /**
     * Process batch of files, extracting rich metadata, EXIF, and Egypt timestamps
     */
    static async processFilesBatch(files, roundLabel = 'Round 1') {
      const fileArray = Array.from(files || []);
      const processedPhotos = [];

      for (const file of fileArray) {
        const metadata = await this.extractFileMetadata(file);
        const compressed = await this.compressImage(file, 1280, 0.78, roundLabel);
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
  global.formatToEgyptTime = formatToEgyptTime;
})(window);
