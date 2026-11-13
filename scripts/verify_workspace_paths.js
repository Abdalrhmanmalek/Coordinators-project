const fs = require('fs');
const path = require('path');

console.log('=== ADCO Monorepo Path Integrity & Link Verification ===\n');

const repoRoot = path.resolve(__dirname, '..');
const frontendDir = path.join(repoRoot, 'frontend');

let errors = 0;
let checked = 0;

function checkFileExists(targetPath, sourceFile, refText) {
  checked++;
  if (!fs.existsSync(targetPath)) {
    console.error(`[BROKEN PATH] in ${path.relative(repoRoot, sourceFile)}`);
    console.error(`  Reference: "${refText}"`);
    console.error(`  Resolved : ${targetPath}\n`);
    errors++;
    return false;
  }
  return true;
}

// 1. Scan HTML files
const htmlFiles = [
  path.join(frontendDir, 'index.html'),
  ...fs.readdirSync(path.join(frontendDir, 'pages'))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(frontendDir, 'pages', f))
];

console.log(`Scanning ${htmlFiles.length} HTML files...`);

for (const htmlFile of htmlFiles) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  const dir = path.dirname(htmlFile);

  // Check <script src="...">
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://')) continue;
    const resolved = path.resolve(dir, src.split('?')[0]);
    checkFileExists(resolved, htmlFile, src);
  }

  // Check <link rel="stylesheet" href="..."> and <link rel="icon" href="...">
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    if (href.startsWith('#')) continue;
    const resolved = path.resolve(dir, href.split('?')[0]);
    checkFileExists(resolved, htmlFile, href);
  }

  // Check <img src="...">
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) continue;
    if (src.includes('${') || src === '') continue; // dynamic JS template
    const resolved = path.resolve(dir, src.split('?')[0]);
    checkFileExists(resolved, htmlFile, src);
  }
}

// 2. Scan JS files for ES module imports
console.log('Scanning JS files for ES module imports...');
function scanJsDir(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) {
      scanJsDir(full);
    } else if (entry.name.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
      let m;
      while ((m = importRegex.exec(code)) !== null) {
        const importPath = m[1];
        if (importPath.startsWith('http://') || importPath.startsWith('https://')) continue;
        if (importPath.startsWith('.')) {
          const resolved = path.resolve(d, importPath);
          checkFileExists(resolved, full, importPath);
        }
      }
    }
  }
}
scanJsDir(path.join(frontendDir, 'js'));

// 3. Scan sw.js cache list
console.log('Scanning Service Worker ASSETS_TO_CACHE...');
const swPath = path.join(frontendDir, 'sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');
const cacheArrayMatch = swContent.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
if (cacheArrayMatch) {
  const items = cacheArrayMatch[1]
    .split(',')
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  for (const item of items) {
    if (item === './') {
      checkFileExists(path.join(frontendDir, 'index.html'), swPath, item);
    } else {
      const resolved = path.resolve(frontendDir, item);
      checkFileExists(resolved, swPath, item);
    }
  }
}

// 4. Scan manifest.json icons
console.log('Scanning manifest.json icons...');
const manifestPath = path.join(frontendDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (Array.isArray(manifest.icons)) {
  for (const icon of manifest.icons) {
    const resolved = path.resolve(frontendDir, icon.src);
    checkFileExists(resolved, manifestPath, icon.src);
  }
}

console.log(`\n========================================`);
console.log(`Checked ${checked} paths across workspace.`);
if (errors === 0) {
  console.log(`SUCCESS: 0 broken paths! All links & imports are 100% valid.`);
} else {
  console.error(`FAILED: Found ${errors} broken paths!`);
}
console.log(`========================================\n`);

process.exit(errors > 0 ? 1 : 0);

