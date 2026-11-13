/**
 * ADCO Pure-JavaScript EXIF Parser for JPEG Images
 * Single Responsibility: Reads TIFF tags (Make, Model, Software, DateTimeOriginal, GPS Info)
 */

(function (global) {
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
      if (dataView.getUint16(0) !== 0xffd8) return result;

      let offset = 2;
      const length = dataView.byteLength;

      while (offset < length - 2) {
        const marker = dataView.getUint16(offset);
        offset += 2;

        if (marker === 0xffe1) {
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

            const ifd0 = parseIFD(getU32(4));

            if (ifd0[0x010f]) {
              const o = ifd0[0x010f].count > 4 ? getU32(ifd0[0x010f].offset) : ifd0[0x010f].offset;
              result.make = getString(o, ifd0[0x010f].count);
            }
            if (ifd0[0x0110]) {
              const o = ifd0[0x0110].count > 4 ? getU32(ifd0[0x0110].offset) : ifd0[0x0110].offset;
              result.model = getString(o, ifd0[0x0110].count);
            }
            if (ifd0[0x0131]) {
              const o = ifd0[0x0131].count > 4 ? getU32(ifd0[0x0131].offset) : ifd0[0x0131].offset;
              result.software = getString(o, ifd0[0x0131].count);
            }

            if (ifd0[0x8769]) {
              const exifIfd = parseIFD(getU32(ifd0[0x8769].offset));
              if (exifIfd[0x9003]) {
                const o = exifIfd[0x9003].count > 4 ? getU32(exifIfd[0x9003].offset) : exifIfd[0x9003].offset;
                const dtStr = getString(o, exifIfd[0x9003].count);
                if (dtStr) {
                  result.dateTimeOriginal = dtStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                }
              }
            }

            if (ifd0[0x8825]) {
              const gpsIfd = parseIFD(getU32(ifd0[0x8825].offset));
              if (gpsIfd[0x0002] && gpsIfd[0x0004]) {
                const latO = getU32(gpsIfd[0x0002].offset);
                let lat = getRational(latO) + getRational(latO + 8) / 60 + getRational(latO + 16) / 3600;
                const latRef = String.fromCharCode(dataView.getUint8(tiffStart + gpsIfd[0x0001].offset));
                if (latRef === 'S') lat = -lat;

                const lonO = getU32(gpsIfd[0x0004].offset);
                let lon = getRational(lonO) + getRational(lonO + 8) / 60 + getRational(lonO + 16) / 3600;
                const lonRef = String.fromCharCode(dataView.getUint8(tiffStart + gpsIfd[0x0003].offset));
                if (lonRef === 'W') lon = -lon;

                result.gpsLatitude = Number(lat.toFixed(5));
                result.gpsLongitude = Number(lon.toFixed(5));
              }
            }
          }
          break;
        } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffd8 && marker !== 0xffd9) {
          offset += dataView.getUint16(offset);
        } else {
          break;
        }
      }
    } catch (e) {
      console.warn('EXIF parse non-critical error:', e);
    }

    return result;
  }

  global.parseExifFromBuffer = parseExifFromBuffer;
})(typeof window !== 'undefined' ? window : globalThis);

