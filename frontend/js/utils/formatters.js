/**
 * ADCO Formatters Util
 * Reusable pure formatters: two-word Arabic name truncation, Cairo date/time formatting.
 * Exposed globally (window.formatTwoWordName, window.formatDateTime, window.getEgyptDateTimeLocalString)
 * and as window.ADCOFormatters. Loaded before ui-helpers.js.
 */

(function (global) {
function formatTwoWordName(fullName) {
  if (!fullName || typeof fullName !== 'string') return fullName || '';
  if (fullName.includes('،') || fullName.includes(',')) {
    const delim = fullName.includes('،') ? '،' : ',';
    return fullName
      .split(delim)
      .map((part) => formatTwoWordName(part.trim()))
      .filter(Boolean)
      .join(' ، ');
  }

  const clean = fullName.replace(/\(.*?\)/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return clean;

  const compoundPrefixes = ['عبد', 'أبو', 'ابو', 'أم', 'ام', 'ابن', 'آل'];
  let first = words[0];
  let startIndex = 1;

  if (compoundPrefixes.includes(words[0]) && words.length > 2) {
    first = `${words[0]} ${words[1]}`;
    startIndex = 2;
  }

  let last = words[words.length - 1];
  if (words.length > startIndex + 1 && compoundPrefixes.includes(words[words.length - 2])) {
    last = `${words[words.length - 2]} ${words[words.length - 1]}`;
  }

  return `${first} ${last}`;
}

function formatDateTime(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) return String(isoOrDate || '');
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

function getEgyptDateTimeLocalString(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) return '';
  try {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(d);
    const m = {};
    p.forEach((x) => (m[x.type] = x.value));
    return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}

global.formatTwoWordName = formatTwoWordName;
global.formatDateTime = formatDateTime;
global.getEgyptDateTimeLocalString = getEgyptDateTimeLocalString;
global.ADCOFormatters = { formatTwoWordName, formatDateTime, getEgyptDateTimeLocalString };
})(typeof window !== 'undefined' ? window : globalThis);
