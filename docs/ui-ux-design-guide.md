# (ADCO) شركة الاسكندريه للكيماويات و المنظفات — UI/UX Design & Frontend Style Guide

This master design guide defines the enterprise visual standards, clean light-mode design system, responsive layout architecture, typography hierarchy, zero-emoji policy, and component design system for **(ADCO) شركة الاسكندريه للكيماويات و المنظفات**.

---

## 1. Global Corporate Identity & Clean Light-Mode Color System

* **Official Entity Name:** `(ADCO) شركة الاسكندريه للكيماويات و المنظفات`
* **Theme Policy (Clean Light Mode Only — No Dark Mode):**
  * **Page Background:** `#f8fafc` (`--adco-gray-50`) with a subtle pastel teal top radial accent.
  * **Floating Surface Cards:** Crisp `#ffffff` (`--adco-white`) containers with `border-radius: 16px` (`--radius-md`) and soft floating drop shadows (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -4px rgba(0, 0, 0, 0.025)`).
* **Corporate Soft Teal / Muted Forest Green Palette:**
  * Primary Soft Teal / Muted Green: `#0f766e` (`--adco-green-primary`)
  * Dark Teal Accent: `#115e59` (`--adco-green-dark`)
  * Deep Forest Heading Tone: `#134e4a` (`--adco-green-deep`)
  * Soft Mint Surface Tint: `#f0fdfa` (`--adco-green-mint`)
  * Soft Badge Tint: `#ccfbf1` (`--adco-green-soft`)
  * Soft Teal Border: `#99f6e4` (`--adco-green-border`)
  * Vivid Teal Highlight: `#0d9488` (`--adco-green-vivid`)
  * Slate Typography: `#1e293b` (`--adco-gray-800`) and `#475569` (`--adco-gray-600`)
* **Micro-Interactions, Smooth Page Transitions & Performance:**
  * All interactive elements, cards, filter chips, and buttons use lightweight hardware-friendly transitions (`transition: all 0.2s ease;`).
  * **Fluid Page Transitions & Scroll Restoration (`enhancements.css` & `AppRouter.navigateTo`):**
    * Native CSS `@view-transition { navigation: auto; }` paired with `.web-main-workspace` / `.pwa-content` entry (`adcoPageEnter 0.24s cubic-bezier(0.22, 1, 0.36, 1)`) and exit (`body.page-is-leaving` `0.16s ease-in-out`) animations provide seamless, flicker-free transitions when navigating between pages (such as clicking a Master Branch Card to open `branch-details.html`).
    * `AppRouter.initSmoothPageTransitions()` preserves scroll position in `sessionStorage` (`ADCO_SCROLL_<pathname>`) and restores scroll state on back/forward history navigation.
  * **Zero Hover Clipping Guarantee:** All card grids (`.kpi-row`, `.master-branches-grid`, `#activities-list`, `#supervisor-cards-mount`, `.circular-charts-row`), filter chip bars (`.filter-bar`, `.filter-chips`), and interactive card wrappers use `overflow: visible` with top breathing room (`padding-top: 6px–8px`) so that upward hover elevations (`transform: translateY(-3px)`) and soft drop shadows are never clipped at the top edge.
* **Zero-Emoji Policy:**
  * All legacy emojis are replaced with official vector SVG icons (`20×20px`, `stroke-width="1.75"`).

---

## 2. Layout, Navigation & Screen Hierarchy

### 2.1 Floating Top Website Navigation Bar (`web-top-navbar`)
* Sleek, lightweight **floating top navigation bar** (`max-width: 1560px`, `height: 64px`, `border-radius: 18px`, `background: rgba(255, 255, 255, 0.88)`, `backdrop-filter: blur(16px)`, `box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.06)`).
* **Right Side (RTL):**
  * Official ADCO logo (`ADCO-logo.png`).
  * Corporate title: `(ADCO) شركة الاسكندريه للكيماويات و المنظفات`.
  * Subtitle: `منظومة إدارة العمليات الميدانية والتقارير`.
* **Center:**
  * Coordinator Links: `الرئيسية`, `إضافة نشاط`, `لوحة الترتيب`.
  * Supervisor Links: `لوحة الإشراف`, `جدول البيانات`, `التحليلات`, `سجل الأنشطة`.
* **Left Side:**
  * Coordinator Rank Badge (`#1`, `#2`, `#3` — automatically hidden in Tier 3 Manager mode).
  * User profile card trigger and clean logout button.

### 2.2 Authentication & Landing Screens (`frontend/index.html` & `frontend/pages/login.html`)
* **Light Atmospheric Backdrop:** Soft pastel mint/teal gradient (`#f8fafc` ➔ `#f0fdfa` ➔ `#ecfdf5`) with a crisp `#ffffff` centered floating card (`border-radius: 20px`, `box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.07)`).
* **3-Tier Fast Login Switcher:** Instant one-click login buttons for all 3 RBAC tiers:
  1. **Coordinator (`ADCO-101`):** أحمد محمود العبد (سموحة)
  2. **Coordinator Supervisor (`ADCO-501`):** أيمن عبد الرحمن الروبي (فروع فتح الله)
  3. **Marketing Manager (`ADCO-901`):** م. حسام الدين غانم (إشراف عام)

### 2.3 Master Branch Cards, Hierarchy & Click Navigation (`dashboard.html`, `supervisor-panel.html`, & `branch-details.html`)
* **Top Dual Filtering Toolbar (`#sup-filter-toolbar` & `#sp-filter-parent-client`):**
  1. **Filter 1 (`اسم العميل الأم`):** Selects the Parent Client retail chain (e.g., `فتح الله جملة ماركت (Fathalla)`, `كارفور هايبر ماركت (Carrefour)`).
  2. **Filter 2 (`اسم فرع العميل`):** Dynamically filters and lists the branches belonging to the selected Parent Client.
* **KPI Metrics Row (`dashboard.html`):**
  1. `إجمالي الأنشطة المسجلة` (Total Registered Activities)
  2. `الأنشطة المقبولة` (Accepted Activities)
  3. `إجمالي الأنشطة تحت المراجعه` (Total Activities Under Review — live count)
* **Master Branch Card Hierarchy (`.branch-master-card`):**
  * **Parent Client First (`العميل الأم`):** Displayed as the primary bold title (`h4.branch-card-title`, e.g., `فتح الله جملة ماركت (Fathalla)`).
  * **Branch Name Underneath (`فرع العميل`):** Displayed cleanly directly below the parent client (`.branch-card-sub`, e.g., `فرع سموحة - الإسكندرية`).
  * **Supplying Company Branch (`فرع الشركة المورد للبضاعة`):** Highlighted in a soft teal pill (`.branch-supply-pill`) mapped from `act.coordinatorBranch`.
  * **Assigned Personnel & GPS Location:** Displays the field coordinator name(s), responsible supervisor name, and GPS branch address.
  * **Interactive Activity Status Counters (`.status-counter-btn`):** 5 live counters ordered consistently as `الكل`, `المقبولة`, `مراجعة / بانتظار`, `المرفوضة`, and `المنتهية` placed directly next to `المرفوضة`.
  * **Full-Card Click Navigation & Branch Details View (`branch-details.html`):**
    * Clicking anywhere on a Master Branch Card navigates smoothly to `branch-details.html?branch=...&client=...`.
    * **Interactive Google Maps Link (`.branch-gps-map-link`):** Clicking the branch GPS location text/icon opens Google Maps in a new tab (`window.open('https://www.google.com/maps/search/?api=1&query=...')`) using the branch's coordinates or address.
    * **Advanced Activity Filter Bar:** Filters branch activities by Activity Type (`نوع النشاط`), Date/Time range (`من التاريخ والوقت` / `إلى التاريخ والوقت`), and Activity Status (`المقبولة`, `تحت المراجعة`, `المرفوضة`, `المنتهية`).

### 2.4 Supervisor Analytics & Modern Charts (`frontend/pages/analytics.html`)
* Designed for laptops and wide screens using lightweight, zero-dependency SVG and CSS charts with generous top padding (`padding: 26px 24px 24px; line-height: 1.5; border-bottom: none`) so Arabic chart headers are never clipped and free of unwanted horizontal divider lines:
  1. **Circular Progress Ring Indicators (`.circular-charts-row`):** 4 SVG progress rings showing Acceptance Rate (`%`), Execution Quality (`/10`), Weighted Evaluation Score (`%`), and Live GPS Verification (`%`).
  2. **Right Chart — Official ADCO Brand Share & Activity Histogram (`#brand-histogram-mount`):** Allows selecting any official ADCO brand (`جلاسي`, `ديفا`, `سبيد`, `فلفيتا`, `فما`, `فييا`, `كلوريل`, `ماكسيل ماجيك`), filtering by specific Activity Type, and applying a Time Range Filter (`الفلتر الزمني`) to inspect the brand's histogram distribution across all display types.
  3. **Left Chart — Activity Types & Brand Pie/Distribution Chart (`#activity-brand-pie-mount`):** Provides an Activity Type selector that renders a multi-slice SVG Pie/Donut Chart and legend breakdown showing each official ADCO brand's percentage share within that specific activity type.
  4. **Display Type Distribution Chart (`#display-type-vbar-mount` — `تحليل وسائل العرض الميدانية`):** Vertical bar chart with strictly Arabic bar labels (`جندولة`, `دريس أب`, `ستاند`, `فلور`, `بوديوم`, `بيلر`, `سايد جندولة`, `لايت بوكس`), officially using **`فلور`** (Floor) across all chart labels, mock data, and UI elements.

### 2.5 Activity Creation Form (`frontend/pages/activity-card.html`)
* **Form Grid Alignment & Read-Only Supplying Branch Styling:**
  * `.responsive-form-grid` aligns all form controls along a shared baseline (`align-items: end; gap: 18px 16px`) so **Client (`العميل`)**, **Client Branch (`فرع العميل`)**, and **Supplying Branch (`فرع الشركة المورد للبضاعة`)** sit flush on the same row without wrapping or height mismatch.
  * **Read-Only Database Auto-Population (`.supplying-branch-readonly-wrap`):** When the coordinator selects **Client (`العميل`)** and **Client Branch (`فرع العميل`)**, `ActivityManager.fetchSupplyingBranch(client, branch)` automatically populates `#f-supplying-branch-readonly`. The field is styled with a muted solid teal-gray container (`background-color: #e6f4f1; border: 1.5px solid #2dd4bf`), bold typography (`font-weight: 700; color: #134e4a`), a compact single-line label badge (`تلقائي`), and an explicit lock indicator pill (`مقفل`) to clearly communicate that it is auto-populated from the database and non-editable.
* **4-Level Cascading Product Picker Modal (`+ إضافة منتج`):**
  * Launches `#product-picker-modal` with 4 cascading dropdowns (`اسم البراند` ➔ `مجموعة رئيسية` ➔ `مجموعة فرعية` ➔ `الصنف`) populated exclusively with the 8 official ADCO brands (`جلاسي`, `ديفا`, `سبيد`, `فلفيتا`, `فما`, `فييا`, `كلوريل`, `ماكسيل ماجيك`) and live $1/N$ brand share calculation.
* **Automated GPS Proximity Validation (Branch vs. Coordinator Location):**
  * Automatically captures the coordinator's device geolocation via `navigator.geolocation.getCurrentPosition` and compares it against the registered branch's coordinates using the Haversine formula (`MAX_BRANCH_PROXIMITY_METERS = 150`). If the coordinator is outside the 150m branch radius, submission is blocked with the error: `"موقعك الحالي بعيد جداً عن نطاق الفرع المسجل"`.

### 2.6 Leaderboard & Mobile Podium Order (`frontend/pages/leaderboard.html`)
* **Desktop View (`> 768px`):** Horizontal podium (#2 Silver, #1 Gold centered and elevated, #3 Bronze).
* **Mobile View (`<= 768px`):** Explicit CSS flexbox `order` rules ensure the podium stacks in true vertical ranking (`#1` Top, `#2` Middle, `#3` Bottom).

### 2.7 Supervisor Review Panel: Side-by-Side GPS Comparison & Quick Status Controls (`frontend/pages/supervisor-panel.html` & `frontend/css/supervisor.css`)
* **Side-by-Side GPS Comparison View (`.gps-comparison-grid`):**
  * Displays both **the Coordinator's Submitted Location (`لوكيشن المنسق`)** and **the Branch's Registered Location (`لوكيشن الفرع المسجل`)** side-by-side (or stacked cleanly on narrow mobile viewports).
  * **Live Distance & Geographical Discrepancy Indicator (`.gps-distance-banner`):** Calculates and displays the exact Haversine distance in meters between the coordinator's capture point and the official branch coordinates, accompanied by a proximity status badge (`مطابق للنطاق ≤ 150م` vs. `خارج النطاق > 150م`) and an interactive **Google Maps Comparison / Directions Link** (`https://www.google.com/maps/dir/?api=1&origin=...&destination=...`).
* **Quick Evaluation Status Controls (`.rev-quick-status-group`):**
  * Placed directly inside the Location Review card so the supervisor can immediately set the review decision (`مقبول`, `غير مقبول`, or `تحت المراجعة`) right next to the GPS comparison view, synced bidirectionally with the form's `#rev-status` selector.

### 2.8 Mobile Responsive Analytics & Staggered Slide-Up Box Transitions (`frontend/css/analytics.css` & `frontend/css/enhancements.css`)
* **Mobile Responsive Analytics (`<= 768px` & `<= 480px`):**
  * `.circular-charts-row`, `.analytics-dashboard-grid`, `.vbar-chart-grid`, `.histogram-chart-grid`, `.pie-chart-layout`, `.chart-inline-filters`, and `.chart-kpi-strip` scale fluidly on mobile phones and tablets without horizontal overflow or layout shifts.
* **Staggered Slide-Up Box Entrance Animations (`@keyframes adcoSlideUpBox`):**
  * Cards, KPI boxes, branch cards, circular rings, and chart containers load and slide up from bottom to top like neatly stacking boxes (`translateY(18px) -> translateY(0)` over `0.28s` with `cubic-bezier(0.16, 1, 0.3, 1)` and subtle `0.02s–0.17s` stagger delays).
