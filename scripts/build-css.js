/**
 * ADCO CSS Bundler & Minifier
 * Concatenates source CSS files in strict cascade order and produces a clean,
 * stripped, production-ready app.min.css.
 */

const fs = require('fs');
const path = require('path');

const CASCADE_ORDER = [
  'variables.css',
  'base.css',
  'layout.css',
  'components.css',
  'auth.css',
  'dashboard.css',
  'activity.css',
  'activity-details.css',
  'evaluation.css',
  'sheets.css',
  'supervisor.css',
  'analytics.css',
  'leaderboard.css',
  'enhancements.css',
  'styles.css',
  'mobile-pwa.css'
];

function minifyCSS(css) {
  return css
    // 1. Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 2. Collapse all whitespace into single spaces
    .replace(/\s+/g, ' ')
    // 3. Remove space around { } ;
    .replace(/\s*([{};])\s*/g, '$1')
    // 4. Remove space after colons and commas
    .replace(/:\s+/g, ':')
    .replace(/,\s+/g, ',')
    // 5. Remove space around > and ~ combinators
    .replace(/\s*([>~])\s*/g, '$1')
    // 6. Remove trailing semicolons before closing brace
    .replace(/;}/g, '}')
    .trim();
}

function build() {
  const rootDir = path.resolve(__dirname, '..');
  const srcDir = fs.existsSync(path.join(rootDir, 'src', 'css'))
    ? path.join(rootDir, 'src', 'css')
    : path.join(rootDir, 'frontend', 'css');

  const outDir = path.join(rootDir, 'frontend', 'css');
  const outFile = path.join(outDir, 'app.min.css');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`[build-css] Reading source files from: ${srcDir}`);

  let combined = '';
  let totalRawBytes = 0;

  for (const filename of CASCADE_ORDER) {
    const filePath = path.join(srcDir, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`[build-css] ERROR: Missing stylesheet "${filename}" at ${filePath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    totalRawBytes += Buffer.byteLength(content, 'utf8');
    combined += `\n/* --- ${filename} --- */\n` + content;
  }

  const minified = minifyCSS(combined);
  const minBytes = Buffer.byteLength(minified, 'utf8');

  fs.writeFileSync(outFile, minified, 'utf8');

  const savings = ((1 - minBytes / totalRawBytes) * 100).toFixed(1);
  console.log(`[build-css] Successfully built ${outFile}`);
  console.log(`[build-css] Raw size: ${(totalRawBytes / 1024).toFixed(1)} KB | Minified size: ${(minBytes / 1024).toFixed(1)} KB (Saved ${savings}%)`);
}

build();
