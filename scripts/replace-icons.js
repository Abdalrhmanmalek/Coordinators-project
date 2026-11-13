const fs = require('fs');
const path = require('path');

const ICON_MAP = {
  'archive': 'archive',
  'arrow-left': 'arrow-left',
  'bar-chart-3': 'bar-chart-3',
  'building-2': 'building-2',
  'calendar-clock': 'calendar-clock',
  'camera': 'camera',
  'check-circle-2': 'check-circle-2',
  'circle-check-big': 'circle-check-big',
  'circle-x': 'circle-x',
  'clipboard-edit': 'clipboard-edit',
  'clipboard-pen': 'clipboard-pen',
  'clock': 'clock',
  'file-spreadsheet': 'file-spreadsheet',
  'house': 'house',
  'layout-dashboard': 'layout-dashboard',
  'list': 'list',
  'log-in': 'log-in',
  'log-out': 'log-out',
  'map-pin': 'map-pin',
  'plus-circle': 'plus-circle',
  'plus': 'plus',
  'search': 'search',
  'sheet': 'sheet',
  'shield-check': 'shield-check',
  'sliders': 'sliders-horizontal',
  'sliders-horizontal': 'sliders-horizontal',
  'star': 'star',
  'table-2': 'table-2',
  'trophy': 'trophy',
  'user-cog': 'user-cog',
  'user-plus': 'user-plus',
  'user': 'user',
  'x-circle': 'x-circle'
};

function getAllFiles(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') getAllFiles(full, list);
    } else if (/\.(html|js)$/.test(f)) {
      list.push(full);
    }
  }
  return list;
}

const files = getAllFiles('frontend');
let totalReplacements = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Add Lucide CDN to HTML files if not present
  if (filePath.endsWith('.html')) {
    if (!content.includes('unpkg.com/lucide')) {
      const lucideTag = '  <script src="https://unpkg.com/lucide@latest"></script>\n';
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${lucideTag}</head>`);
      }
    }
  }

  // 2. Replace static <img> tags referencing icons
  // Matches <img ...src="...icons/NAME.svg" ... /> (any attribute order)
  const imgRegex = /<img\s+([^>]*?)src=["'][^"']*?icons\/([a-zA-Z0-9_\-]+)\.svg["']([^>]*?)\/?>/gi;
  content = content.replace(imgRegex, (match, before, rawIconName, after) => {
    totalReplacements++;
    const lucideName = ICON_MAP[rawIconName.toLowerCase()] || rawIconName;
    const combinedAttrs = `${before} ${after}`.trim();
    
    // Extract class
    const classMatch = combinedAttrs.match(/class=["']([^"']+)["']/i);
    let classVal = classMatch ? classMatch[1] : 'ui-icon';
    if (!classVal.includes('icon') && !classVal.includes('ui-icon')) {
      classVal = `ui-icon ${classVal}`.trim();
    }

    // Extract other non-src, non-alt attributes (id, title, style, etc.)
    let remainingAttrs = combinedAttrs
      .replace(/class=["'][^"']*["']/gi, '')
      .replace(/alt=["'][^"']*["']/gi, '')
      .replace(/style=["'][^"']*filter:\s*brightness\(0\)\s*invert\(1\);?[^"']*["']/gi, '') // strip invert filter
      .replace(/\s{2,}/g, ' ')
      .trim();

    const extraAttrStr = remainingAttrs ? ` ${remainingAttrs}` : '';
    return `<i data-lucide="${lucideName}" class="${classVal}"${extraAttrStr}></i>`;
  });

  // Also match cases where src comes before other attributes:
  const imgRegex2 = /<img\s+src=["'][^"']*?icons\/([a-zA-Z0-9_\-]+)\.svg["']([^>]*?)\/?>/gi;
  content = content.replace(imgRegex2, (match, rawIconName, after) => {
    totalReplacements++;
    const lucideName = ICON_MAP[rawIconName.toLowerCase()] || rawIconName;
    const combinedAttrs = after.trim();
    
    const classMatch = combinedAttrs.match(/class=["']([^"']+)["']/i);
    let classVal = classMatch ? classMatch[1] : 'ui-icon';
    if (!classVal.includes('icon') && !classVal.includes('ui-icon')) {
      classVal = `ui-icon ${classVal}`.trim();
    }

    let remainingAttrs = combinedAttrs
      .replace(/class=["'][^"']*["']/gi, '')
      .replace(/alt=["'][^"']*["']/gi, '')
      .replace(/style=["'][^"']*filter:\s*brightness\(0\)\s*invert\(1\);?[^"']*["']/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const extraAttrStr = remainingAttrs ? ` ${remainingAttrs}` : '';
    return `<i data-lucide="${lucideName}" class="${classVal}"${extraAttrStr}></i>`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated icons in: ${filePath}`);
  }
});

console.log(`Finished icon replacement pass! Total replacements made: ${totalReplacements}`);

