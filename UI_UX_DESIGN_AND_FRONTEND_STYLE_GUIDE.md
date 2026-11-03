# ADCO Field Operations Platform — Website-First Frontend Architecture & Screen-by-Screen Blueprint

This updated blueprint transforms the **ADCO Field Operations Platform** (`adco-field-app`) from a mobile-confined card interface into a **clean, full-width enterprise web portal** on desktop while remaining responsive on mobile devices. All emojis, promotional feature pills, and demo credential boxes have been strictly removed in favor of clean vector iconography (Lucide/Heroicons SVGs) and corporate visual assets.

---

## 0. Master Prompt for Your Coding Agent (Copy & Paste to Apply Edits)

```text
Please refactor the entire frontend (`index.html`, `pages/*.html`, `css/*.css`, and `js/*.js`) according to these strict UI/UX rules:

1. LANDING PAGE (`index.html`) CLEANUP:
   - DELETE the three feature pills (`كاميرا 720p مشفرة SHA-256`, `جولات متابعة بالصور`, `تكامل Sheets & Power BI`).
   - DELETE the entire Demo/Test Accounts box (`حسابات تجريبية جاهزة للفحص (DynamoDB Seed)`).
   - CHANGE the primary login button text from `تسجيل الدخول للمنظومة` to `تسجيل دخول`.
   - CHANGE the secondary signup button text to `تفعيل حساب موظف جديد` (no emojis).
   - CHANGE the subtitle text to: `شركة الإسكندرية للكيماويات والمنظفات (ADCO) — المنصة الرقمية الموحدة لإدارة العمليات الميدانية والتقارير التحليلية.`

2. ZERO EMOJIS POLICY (ALL PAGES & JS FILES):
   - Strip EVERY emoji (`📸`, `🔄`, `📊`, `🔐`, `✨`, `🚀`, `⏳`, `✓`, `✕`, `⭐`, `✍️`, `📅`, `🛡️`, `🥇`, `🥈`, `🥉`, `👤`, `🧑‍💼`, `🚪`, `🔷`, `🔶`) from all HTML templates and JavaScript string literals (`app.js`, `activity-manager.js`, `supervisor.js`, `ui-helpers.js`).
   - Replace them with clean inline SVG vector icons (`20x20px`, `stroke-width="1.75"`) or clean corporate PNG/SVG badges.

3. WEBSITE-STYLE TOP NAVIGATION BAR (REPLACE FLOATING APP DOCK):
   - Remove the mobile-app floating bottom taskbar (`#bottom-nav-mount` / `mobile-pwa.css` floating pill dock).
   - Replace it across all authenticated pages with a sticky, full-width Website Top Header (`height: 68px`, `width: 100%`, `background: #FFFFFF`, `border-bottom: 1px solid #E2E8F0`).
   - Right side (RTL): ADCO Brand Logo + Portal Title (`بوابة العمليات الميدانية`).
   - Center: Horizontal website navigation links (`الرئيسية`, `إضافة نشاط`, `لوحة الترتيب` for Coordinators | `لوحة الإشراف`, `جدول البيانات`, `التحليلات`, `سجل الأنشطة` for Supervisors) with a clean bottom active border (`3px solid #0B6E4F`).
   - Left side: User Profile Trigger (Name, Role tag, Employee ID) + clean `تسجيل خروج` button.

4. FULL-SCREEN DESKTOP LAYOUT (`100%` WIDTH):
   - Remove narrow mobile wrapper constraints (`max-width: 480px` or centered phone-frame cards) on desktop viewports.
   - Make `.app-shell`, `.main-container`, and `.auth-split-layout` span the full viewport width (`width: 100%`, `min-height: 100vh`, `padding: 24px 40px` on desktop `>= 1024px`).
   - Use multi-column responsive CSS Grids (`grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))`) for activity feeds, 12-column layouts for forms/details, and `100%` full-bleed tables for `sheets-view.html`.
```

---

## 1. Visual Assets & Images Guide (What to Download Instead of Emojis)

To make the platform look like an executive corporate web portal instead of using emojis, here are the exact images and vector icons you should download or place in an `assets/` folder:

### 1.1 Corporate & UI Photography (`assets/images/`)
| Asset File Name | Where It Appears | What Image to Download / Use | Recommended Specs |
| :--- | :--- | :--- | :--- |
| **`adco-logo.png` / `.svg`** | Top Website Navbar, Splash Header, Login Screen | Official transparent high-resolution ADCO green logo. | SVG or PNG (`400×160px` transparent) |
| **`hero-warehouse-bg.jpg`** | Desktop Left Split-Screen Panel on `index.html` & `login.html` | A clean, modern photo of a bright hypermarket aisle, organized retail shelves, or ADCO manufacturing/distribution facility with a dark emerald gradient overlay. | `1920×1080px` WebP/JPG (`~180 KB`) |
| **`avatar-coordinator.svg`** | Top Navbar Profile & Profile Modal (`حسابي`) | Clean flat vector illustration or minimal corporate silhouette of a field specialist in emerald/slate tones (replaces `🧑‍💼`). | `128×128px` SVG |
| **`avatar-supervisor.svg`** | Top Navbar Profile & Supervisor Header | Clean flat vector badge/avatar representing an operations manager (replaces `🛡️`). | `128×128px` SVG |
| **`medal-gold.svg` / `silver.svg` / `bronze.svg`** | Leaderboard Top-3 Podium (`leaderboard.html`) | Clean flat vector metallic ribbons/medals in Gold (`#D97706`), Silver (`#64748B`), and Bronze (`#B45309`) to replace `🥇 🥈 🥉`. | `64×64px` SVG |
| **`empty-state-activities.svg`** | Dashboard & Supervisor Panel when filter has 0 results | Minimal line-art vector illustration of a clipboard or retail shelf in `#0B6E4F` and gray tones. | `240×240px` SVG |

### 1.2 Clean Inline SVG Icons (Replaces All Functional Emojis)
Use **Lucide Icons** (`https://lucide.dev`) or **Heroicons** (`https://heroicons.com`) inline SVGs (`stroke="currentColor" stroke-width="1.75"`):
* **Camera Dropzone (replaces `📸`):** `camera` or `upload-cloud` SVG icon.
* **Status Badges (replaces `⏳`, `✓`, `✕`):** `clock` (amber), `check-circle-2` (emerald), `x-circle` (red) SVG icons.
* **Overall Rating (replaces `⭐`):** Solid `star` SVG icon (`fill="#F59E0B"`).
* **Supervisor Evaluation (replaces `✍️`):** `clipboard-check` or `SlidersHorizontal` SVG icon.
* **Follow-Up Timeline (replaces `📅`):** `history` or `layers` SVG icon.
* **Excel Export (replaces `📊`):** `file-spreadsheet` or `download` SVG icon.
* **Logout (replaces `🚪`):** `log-out` SVG icon.

---

## 2. Website Navigation & Full-Screen Layout Architecture

### 2.1 Desktop Full-Screen Layout System (`css/styles.css`)
Instead of centering pages inside a small mobile card on desktop monitors, every screen uses a full-viewport desktop grid:
* **Landing & Auth Pages (`index.html`, `login.html`, `signup-wizard.html`):**
  * **Desktop (`>= 1024px`):** Full-screen **2-Column Split Layout (`100vw × 100vh`)**.
    * **Right Column (`45%` width):** Clean white form container with generous padding, ADCO logo, form inputs, and action buttons.
    * **Left Column (`55%` width):** Full-height corporate visual banner (`hero-warehouse-bg.jpg`) with an emerald brand overlay (`#064E3B` to `#0B6E4F`) displaying ADCO corporate identity and live system status.
* **Internal Application Pages (`dashboard.html`, `activity-card.html`, `supervisor-panel.html`, `sheets-view.html`, `analytics.html`, `leaderboard.html`):**
  * **Top Website Header (`68px` fixed height, `100%` width):** Spans edge-to-edge across the top of the screen.
  * **Main Workspace (`width: 100%`, `max-width: 100%`, `padding: 32px 48px`):** Uses the entire desktop monitor width with multi-column grids.

### 2.2 Role-Based Website Top Navigation Bar (`AppRouter.renderTopNavbar`)
Managed in `js/app.js`, the navigation bar is rendered at the top of the page like a standard corporate web portal:

| Role | Right Brand Area (RTL) | Center Website Navigation Links | Left User Utility Area |
| :--- | :--- | :--- | :--- |
| **Coordinator (`COORDINATOR`)** | ADCO Logo + `بوابة العمليات الميدانية` | 1. **الرئيسية** (`dashboard.html`)<br>2. **تسجيل نشاط جديد** (`activity-card.html`)<br>3. **لوحة الترتيب** (`leaderboard.html`) | • Rank Badge (`الترتيب: #3`)<br>• Profile Trigger (`أحمد محمود العبد — منسق`)<br>• **تسجيل خروج** (SVG Icon) |
| **Supervisor (`SUPERVISOR`)** | ADCO Logo + `منظومة الإشراف والتحليلات` | 1. **لوحة الإشراف** (`supervisor-panel.html`)<br>2. **سجل البيانات والشيت** (`sheets-view.html`)<br>3. **التحليلات الميدانية** (`analytics.html`)<br>4. **الأنشطة الميدانية** (`dashboard.html`)<br>5. **لوحة الترتيب** (`leaderboard.html`) | • Role Badge (`مشرف عمليات`)<br>• Profile Trigger (`سجل الحساب`)<br>• **تسجيل خروج** (SVG Icon) |

---

## 3. Page-by-Page Breakdown (Updated Clean Spec)

---

### Screen 0: Landing & Portal Entry (`index.html`)
* **Page Title:** `شركة الإسكندرية للكيماويات والمنظفات | ADCO`
* **Objective:** Clean corporate web entry portal that routes employees to login, new account activation, or their active session without clutter or test credentials.
* **UI Layout & Component Structure:**
  * **Full-Screen Split Layout (Desktop):**
    * **Right Portal Pane:**
      * **ADCO Brand Logo (`adco-logo.png`):** Crisp centered or right-aligned corporate mark.
      * **Main Heading:** `منظومة المتابعة والتنسيق الميداني`
      * **Updated Subtitle:** `شركة الإسكندرية للكيماويات والمنظفات (ADCO) — المنصة الرقمية الموحدة لإدارة العمليات الميدانية والتقارير التحليلية.`
      * *(Removed: Feature pills `كاميرا 720p...`, `جولات متابعة...`, `تكامل Sheets...`)*
      * **Primary Action Button:** `تسجيل دخول` (Solid ADCO green button `#0B6E4F`, links to `pages/login.html`, zero emojis).
      * **Secondary Action Button:** `تفعيل حساب موظف جديد` (Subtle outlined button, links to `pages/signup-wizard.html`, zero emojis).
      * **Conditional Active Session Button:** `متابعة الجلسة النشطة` (Only rendered if a valid JWT session exists in storage; zero emojis).
      * *(Removed: Demo accounts box `حسابات تجريبية جاهزة للفحص`)*
    * **Left Visual Pane (Desktop `>= 1024px`):** Full-height corporate photography banner with ADCO branding watermark.

---

### Screen 1: Unified Login & 3-Step Account Activation (`pages/login.html` & `pages/signup-wizard.html`)

#### 1A. Login Screen (`pages/login.html`)
* **Page Title:** `تسجيل دخول | شركة الإسكندرية للكيماويات والمنظفات ADCO`
* **UI Layout & Component Structure:**
  * **Full-Screen 2-Column Split Layout** matching `index.html`.
  * **Login Form (`#login-form`):**
    * `employeeId` input (`ADCO-101`).
    * `password` input.
    * Utility links: `نسيت كلمة المرور؟` (`#open-reset-btn`) and `تفعيل حساب موظف جديد`.
    * Submit button: `تسجيل دخول` (`#login-submit-btn`).
  * **Password Recovery Modal (`#reset-modal`):** Clean modal dialog for 4-digit OTP password reset without emojis.

#### 1B. 3-Step Employee Activation Wizard (`pages/signup-wizard.html`)
* **Page Title:** `تفعيل حساب موظف جديد | شركة ADCO`
* **UI Layout & Component Structure:**
  * **Clean Numeric Progress Stepper (`.stepper`):** `1. التحقق الوظيفي` $\rightarrow$ `2. رمز التأكيد` $\rightarrow$ `3. تعيين كلمة المرور`.
  * **Step 1 (`#step-1`):** Full Name (`#wiz-fullname`) and Employee ID (`#wiz-empid`).
  * **Step 2 (`#step-2`):** Verified employee banner (`#verified-emp-banner`), official email/mobile input (`#wiz-contact`), `إرسال رمز التحقق` button, and 4-digit OTP input (`#wiz-otp`).
  * **Step 3 (`#step-3`):** Password (`#wiz-pass`), Confirm Password (`#wiz-pass-confirm`), and 4-rule validation checklist using SVG checkmarks.

---

### Screen 2: Coordinator Submission & Follow-Up Workspace (`pages/activity-card.html`)

* **Page Title:** `بطاقة النشاط والمتابعة الميدانية | ADCO`
* **Desktop Full-Screen Layout:**
  * **Top Website Navbar** across the top.
  * **2-Pane Desktop Workspace (`12-Column CSS Grid`):**
    * **Right Pane (8 Columns on Desktop):** Main Activity Data Form (Mode A) or Activity Metadata & Follow-up Timeline Table (Mode B).
    * **Left Pane (4 Columns on Desktop):** Sticky Live Camera Uploader, Compression Telemetry & SHA-256 Verification Box (Mode A), or High-Resolution Photo Preview & Follow-up Upload Card (Mode B).
* **Key UI Elements (Emoji-Free):**
  * **Fields:** `العميل / السلسلة التجارية`, `فرع العميل`, `قطاع المنسق`, `النشاط`, `نوع النشاط`, `عدد النشاط (1–10)`.
  * **Conditional Magazine Date Box (`#magazine-date-group`):** Appears automatically when `النشاط === 'فرشة مجلة'`.
  * **Multi-Brand Selector (`#combo-brands`):** Tag selector displaying `حصة كل براند: (1/N) | عدد الصفوف بالتقارير: N`.
  * **Overall Rating Banner (Mode B):** Uses an inline gold star SVG: `التقييم العام: X.X / 10 (من أصل K متابعات)`.
  * **Follow-Up Buttons (Mode B):** `إضافة جولة متابعة بالصور` and `عرض سجل المتابعات` with clean SVG icons.

---

### Screen 3: Coordinator Dashboard & Activity Feed (`pages/dashboard.html`)
* **Page Title:** `الرئيسية — سجل الأنشطة الميدانية | ADCO`
* **Desktop Full-Screen Layout:**
  * **Top Website Navbar** (`100%` width).
  * **Full-Width KPI Ribbon:** 3 wide metric cards across the top (`إجمالي الأنشطة المسجلة`, `الأنشطة المعتمدة`, `متوسط التقييم العام`) with clean vector icons inside soft emerald circles.
  * **Filter & Search Bar Row:** Status filter tabs (`الكل`, `قيد المراجعة`, `مقبول`, `مرفوض`) on the right + quick `+ تسجيل نشاط جديد` primary button on the left.
  * **Multi-Column Activity Card Grid (`grid-template-columns: repeat(auto-fill, minmax(380px, 1fr))`):** Fills the entire desktop screen width (`3` to `4` cards per row on widescreen monitors) instead of a single narrow column.

---

### Screen 4: Supervisor Operations Suite (`pages/supervisor-panel.html`, `pages/sheets-view.html`, `pages/analytics.html`)

#### 4A. Supervisor Review & Scoring Panel (`pages/supervisor-panel.html`)
* **Page Title:** `لوحة الإشراف وتقييم الأنشطة | ADCO`
* **Desktop Full-Screen Layout:**
  * **Top Website Navbar** + Filter Toolbar (`الكل`, `بانتظار التقييم`, `مقبول`, `مرفوض`).
  * **Full-Width 3-Column Inspection Grid:** Displays coordinator submissions across the full desktop viewport. Each card shows the retail chain, coordinator name, branch, `النشاط (نوع النشاط × عدد النشاط)`, $1/N$ brand share pills, cumulative score, and clean action buttons (`فحص وتقييم الجولات` and `عرض التفاصيل`).
  * **Evaluation Modal (`#review-modal`):** Clean dialog with Round Selector dropdown (`#rev-round-select`), 1–10 Score input/slider, Decision selector (`مقبول` / `مرفوض`), and Supervisor Notes.

#### 4B. Multi-Brand Split Sheet View (`pages/sheets-view.html`)
* **Page Title:** `سجل البيانات الموحد وتصدير التقارير | ADCO`
* **Desktop Full-Screen Layout:**
  * Uses `100%` of the viewport width for the 14-column analytical data grid (`vw_multi_brand_activity_sheet`), with a sticky table header, instant search input (`#sheet-search`), and a clean `تصدير ملف Excel (CSV)` button (`#export-excel-btn`) with a spreadsheet SVG icon.

#### 4C. Executive Field Analytics (`pages/analytics.html`)
* **Page Title:** `التحليلات الميدانية ومؤشرات الأداء | ADCO`
* **Desktop Full-Screen Layout:** Full-width 12-column analytics dashboard slicing acceptance rates, average supervisor scores, and weighted brand shares ($\sum 1/N$) by retail chain and activity type.

---

### Screen 5: Coordinator Leaderboard (`pages/leaderboard.html`)
* **Page Title:** `لوحة الترتيب ومؤشرات التميز | ADCO`
* **Desktop Full-Screen Layout:**
  * **Top-3 Podium Section:** Uses clean custom SVG medal badges (`medal-gold.svg`, `medal-silver.svg`, `medal-bronze.svg`) instead of emojis.
  * **Full-Width Ranking Table:** Displays Rank `#`, Coordinator Name, Employee ID, Assigned Region, Accepted Activities Count, Average Rating, and Total Points across the desktop screen.