const fs = require('fs');
const path = require('path');

console.log('--- Starting ADCO E2E Comprehensive Verification ---');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS:', message);
    pass++;
  } else {
    console.error('  FAIL:', message);
    fail++;
  }
}

// 1. Check MasterBranchCard HTML structure
const mbcPath = path.resolve(__dirname, '../frontend/js/components/master-branch-card.js');
const mbcCode = fs.readFileSync(mbcPath, 'utf8');

assert(mbcCode.includes('class="branch-master-card'), 'MasterBranchCard renders .branch-master-card');
assert(!mbcCode.includes('branch-total-badge'), 'MasterBranchCard removes redundant total activities badge');
assert(!mbcCode.includes('branch-showcase-type-pill'), 'MasterBranchCard removes showcase type pill from exterior card');
assert(!mbcCode.includes('branch-brand-pill'), 'MasterBranchCard removes brand pills from exterior card');
assert(mbcCode.includes('branch-meta-grid'), 'MasterBranchCard renders 2-column + full-span details box');
assert(mbcCode.includes('branch-status-counters'), 'MasterBranchCard renders 5 status counters row');
assert(mbcCode.includes('data-st="ALL"'), 'Status counter ALL exists');
assert(mbcCode.includes('data-st="Accepted"'), 'Status counter Accepted exists');
assert(mbcCode.includes('data-st="Under Review"'), 'Status counter Under Review exists');
assert(mbcCode.includes('data-st="Rejected"'), 'Status counter Rejected exists');
assert(mbcCode.includes('data-st="CLOSED"'), 'Status counter CLOSED exists');

// 2. Check Persistent Navbar in app.js
const appJsPath = path.resolve(__dirname, '../frontend/js/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

assert(appJs.includes("document.getElementById('app-navbar')"), 'app.js checks for existing persistent navbar DOM element');
assert(appJs.includes('navigateTo(targetUrl'), 'app.js contains SPA router navigateTo method');
assert(appJs.includes('updateActiveNavLink(cleanUrl)'), 'app.js updates active link in-place');
assert(appJs.includes("'الإشراف'"), 'Supervisor link label includes concise الإشراف');
assert(appJs.includes("'التقارير'"), 'Supervisor link label includes concise التقارير');
assert(appJs.includes('web-mobile-center-title'), 'app.js contains web-mobile-center-title container');
assert(appJs.includes('getPageTitle(path)'), 'app.js dynamically derives page title instead of hardcoding brand');
assert(!appJs.includes('<span class="wmct-name">(ADCO)'), 'app.js does NOT hardcode brand in mobile center title');

// 3. Check Persistent Navbar in navbar.js
const nbPath = path.resolve(__dirname, '../frontend/js/components/navbar.js');
const nb = fs.readFileSync(nbPath, 'utf8');

assert(nb.includes("window.AppRouter.renderTopNavbar()"), 'navbar.js delegates to AppRouter.renderTopNavbar');
assert(nb.includes("document.getElementById('app-navbar')"), 'navbar.js contains mount-once guard');
assert(!nb.includes('<span class="wmct-name">(ADCO)'), 'navbar.js does NOT hardcode brand in mobile center title');

// 4. Check CSS in app.min.css
const cssPath = path.resolve(__dirname, '../frontend/css/app.min.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert(css.includes('#app-navbar'), 'app.min.css contains #app-navbar rules');
assert(css.includes('font-weight:500'), 'app.min.css has medium 500 default font-weight for nav items');
assert(css.includes('font-weight:800 !important'), 'app.min.css has bold 800 active font-weight for nav items');
assert(css.includes('background-color:#f0fdfa !important'), 'app.min.css has light teal background for active nav items');
assert(css.includes('border:1.5px solid #99f6e4'), 'app.min.css styles branch card with 1.5px solid #99f6e4');
assert(css.includes('(min-width:769px) and (max-width:1024px)'), 'app.min.css preserves nav links visible on 769px-1024px screens');

// 5. Check Dashboard section header
const dashHtmlPath = path.resolve(__dirname, '../frontend/pages/dashboard.html');
const dashHtml = fs.readFileSync(dashHtmlPath, 'utf8');
assert(!dashHtml.includes('title="عرض لوحة المتصدرين"'), 'Dashboard branch section header has removed duplicate stray button');

// 6. Check Supervisor panel has both branch cards and activities feed
const supHtmlPath = path.resolve(__dirname, '../frontend/pages/supervisor-panel.html');
const supHtml = fs.readFileSync(supHtmlPath, 'utf8');
assert(supHtml.includes('id="supervisor-branches-overview"'), 'supervisor-panel.html has branch cards overview container');
assert(supHtml.includes('id="supervisor-cards-mount"'), 'supervisor-panel.html has activities feed container');

// 7. Verify zero legacy images in frontend/assets
const assetsDir = path.resolve(__dirname, '../frontend/assets');
const legacyExts = ['.png', '.jpg', '.jpeg', '.webp'];
let legacyFound = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (legacyExts.includes(ext)) {
        console.error('  Legacy image found:', full);
        legacyFound++;
      }
    }
  }
}
scanDir(assetsDir);
assert(legacyFound === 0, 'Zero legacy image formats (.png, .jpg, .jpeg, .webp) remain in frontend/assets');

// 8. Check Leaderboard page overhaul (Container width, toolbar, top-3 podium, and table)
const lbHtmlPath = path.resolve(__dirname, '../frontend/pages/leaderboard.html');
const lbHtml = fs.readFileSync(lbHtmlPath, 'utf8');
assert(lbHtml.includes('class="leaderboard-toolbar"'), 'leaderboard.html contains modern .leaderboard-toolbar');
assert(lbHtml.includes('class="lb-month-selector-pill"'), 'leaderboard.html contains cohesive .lb-month-selector-pill');
assert(lbHtml.includes('class="lb-month-select"'), 'leaderboard.html contains custom .lb-month-select');

const lbCssPath = path.resolve(__dirname, '../src/css/leaderboard.css');
const lbCss = fs.readFileSync(lbCssPath, 'utf8');
assert(lbCss.includes('max-width: 1440px'), 'leaderboard.css expands container to max-width: 1440px');
assert(lbCss.includes('.leaderboard-toolbar'), 'leaderboard.css styles unified toolbar');
assert(lbCss.includes('.top-card.rank-1'), 'leaderboard.css styles #1 gold spotlight card');
assert(css.includes('max-width:1440px'), 'app.min.css includes 1440px leaderboard container');
assert(css.includes('.leaderboard-toolbar'), 'app.min.css includes leaderboard toolbar');

console.log(`\n=== Verification Results: ${pass} Passed, ${fail} Failed ===`);
process.exit(fail > 0 ? 1 : 0);
