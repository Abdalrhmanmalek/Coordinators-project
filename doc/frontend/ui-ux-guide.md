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

### 2.1 Persistent Top Website Navigation Bar (`web-top-navbar`)
* Sleek, lightweight **persistent top navigation bar** (`max-width: 1560px`, `height: 64px`, `border-radius: 18px`, `background: rgba(255, 255, 255, 0.96)`, `backdrop-filter: blur(16px)`, `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08)`, `position: fixed`, `top: 0`, `z-index: 1000`).
* **Mount-Once & Client-Side SPA Routing (`navigateTo`):**
  * Mounted once outside the dynamic viewport container (`#app-header-mount`).
  * Never destroyed or re-created during view switches.
  * Internal links trigger instant SPA content swapping on `<main class="web-main-workspace">`, maintaining scroll position, history state, and avoiding full browser reloads.
* **Typography & Active Link States:**
  * **Default state:** `font-weight: 500; color: #475569; padding: 0.5rem 0.9rem; border-radius: 10px; transition: color 0.15s ease, background-color 0.15s ease;`
  * **Active / Pressed / Focus state:** `font-weight: 800 !important; color: #0f766e !important; background-color: #f0fdfa !important; border-radius: 10px !important;`
  * Zero blurry text shadows, zero underline glitches, and identical horizontal padding to prevent layout jitter.
* **Responsive Breakpoint Behavior:**
  * **Desktop & Laptop Screens (769px to 1240px):** All primary navigation links remain persistently visible with compact padding (`padding: 0.45rem 0.65rem`), preserving full navigation capabilities without collapsing.
  * **Mobile & Small Tablet Portrait (<= 768px):** Navigation smoothly collapses into a clean mobile header featuring the active page title pill (`.web-mobile-center-title`) and Lucide hamburger menu toggle (`#web-mobile-menu-btn`), sliding open the drawer with all navigation links.
* **Right Side (RTL):**
  * Official ADCO logo (`ADCO-logo.avif`).
  * Corporate title: `(ADCO) شركة الاسكندريه للكيماويات و المنظفات`.
  * Subtitle: `منظومة إدارة العمليات الميدانية والتقارير`.
* **Center Navigation Links:**
  * **Coordinator Links:** `الرئيسية`, `نشاط جديد`, `المتصدرين`.
  * **Supervisor / Marketing Manager Links:** `الإشراف والتقييم`, `التقارير والشيتات`, `التحليلات`, `الأنشطة`, `المتصدرين` (with glowing amber badge for pending review activities).
* **Left Side:**
  * Coordinator Rank Badge (`#1`, `#2`, `#3` — automatically hidden in Tier 3 Manager mode).
  * User profile card trigger (`.web-profile-pill`) and clean logout button.

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

### 2.9 Full-Screen Mobile Modals & Desktop Outside-Click Dismissal (`frontend/css/components.css` & `frontend/js/app.js`)
* **Full-Screen Mobile Takeover (`<= 768px`):**
  * Opening any modal (`#review-modal`, `#activity-audit-modal`, `#timeline-modal`, `#product-picker-modal`, `#profile-modal`, etc.) takes over the **full screen** (`width: 100%`, `height: 100dvh`, `border-radius: 0`, `padding: 18px 16px`) instead of appearing as a cramped floating dialog box, ensuring breathing room for typography, smooth touch scrolling, and easy navigation back and forth.
* **Desktop Outside-Click Dismissal (`initDesktopOutsideModalDismissal`):**
  * Clicking outside modal contents on desktop dismisses the modal gracefully.

### 2.10 External Card Architecture & Interactive Review Log
* **External Card Simplification (Hide Supplying Branch Externally):**
  * Outer Master Branch Cards (`master-branch-card.js`) and Activity Cards (`activity-card-item.js`) hide the Supplying Company Branch (`فرع الشركة المورد للبضاعة`). This detail is kept strictly inside internal detail views (`branch-details.html`, `activity-card.html`, `evaluation.html`) as secondary operational metadata.
  * External cards prominently highlight **Activity Types / Display Mediums (`نوع النشاط / وسيلة العرض`)** and **Participating ADCO Brands (`العلامات التجارية المشاركة`)** using clean mint pills and outline badges.
* **Unified Review Log & Per-Round 4-Criteria Breakdown (`activity-card.page.js`):**
  * Clicking an activity card or its `سجل المراجعات` button opens a dedicated full-page view displaying the complete chronological Review & Follow-Up Log.
  * Each follow-up round displays:
    1. Round number, timestamp, submitted photo, and verified coordinator GPS location.
    2. Numerical evaluation breakdown across the 4 official criteria:
       * Approved New Activities: Max 40 points
       * Execution Quality: Max 20 points
       * Continuity Duration: Max 25 points
       * Documentation & Data Accuracy: Max 15 points
       Alongside the total round score (e.g. `94 / 100 نقطة`).
    3. The Marketing Manager's written guidance and feedback note.
    4. Active participating products and SKUs for that specific round.
* **Streamlined "Add New Follow-Up" Submission & Brand Modification:**
  * By default requires only 2 actions: capturing a new photo (720p client compressor) and live GPS location (Haversine proximity check $\le 150\text{m}$).
  * An optional collapsible section `تعديل المنتجات والعلامات المشاركة (اختياري)` allows updating products and brands for that round, with automatic live recalculation of the $1/N$ brand share.
* **Strict Zero Emojis Policy & High-Resolution Retail Photography:**
  * Zero text emojis across HTML templates, JS components, buttons, and mock data. All icons are rendered via **Lucide Icons CDN** (`<i data-lucide="..." class="ui-icon"></i>`).
  * Cartoon SVG placeholders (`fathalla-branch.svg`) are replaced with high-resolution realistic retail supermarket shelf, gondola, and podium photos from Unsplash.
* **Sticky Navbar Offset Protection:**
  * Top padding on `.web-main-workspace` and `.pwa-content` is configured to `calc(108px + env(safe-area-inset-top, 0px))` on desktop and `calc(88px + env(safe-area-inset-top, 0px))` on mobile, completely preventing header text clipping under the 86px floating navbar.
  * On desktop viewports, clicking anywhere outside the bounds of an active floating window automatically closes/dismisses it immediately without requiring manual interaction with the 'X' button.

### 2.10 Branch-Centric Activities & Glowing Under-Review Badges (`frontend/pages/dashboard.html` & `frontend/css/dashboard.css`)
* **Elimination of Standalone Activities Feed:**
  * Standalone loose activity cards floating outside branches have been removed from the dashboard. Activities are exclusively accessed by opening their respective **Master Branch Card** (navigating to `branch-details.html`).
* **Glowing Under-Review Badge (`@keyframes adcoReviewPulse`):**
  * Master Branch Cards feature a high-visibility pulsing glow effect on the "Under Review" (`مراجعة`) status button whenever that branch contains pending activities requiring supervisor review.

### 2.11 Uniform Chart Bar Baselines & Supervisor Review Mobile Positioning (`frontend/css/analytics.css` & `frontend/css/supervisor.css`)
* **Uniform Chart Bar Baselines:**
  * Fixed vertical bar chart label containers to a uniform height (`height: 36px`) so two-line labels flow naturally without elevating or misaligning the bar tracks above. All bars remain anchored to an identical baseline.
* **Supervisor Mobile Positioning:**
  * In mobile supervisor cards, coordinator metadata and avatar appear prominently at the top (`order: 1`), action buttons in the middle (`order: 2`), and the numerical rating card/box is anchored to the absolute bottom of the container (`order: 3; margin-top: auto`).

### 2.12 Layout Shift Prevention & Stable Scrollbar Reservation (`frontend/css/base.css` & `frontend/css/enhancements.css`)
* **Global Scrollbar Gutter Reservation:**
  * Applied `scrollbar-gutter: stable;` and `overflow-y: scroll;` globally on the root `html` element. This permanently reserves the vertical scrollbar track across all desktop and mobile browsers, guaranteeing that the viewport width remains identical when navigating between short pages (e.g. login) and long pages (e.g. dashboard, branch details), eliminating content horizontal jumps and flickering.
* **Custom Light Mode Scrollbars:**
  * Sleek `#f1f5f9` track with rounded `#cbd5e1` thumb matching the corporate Light Mode palette.
* **Page Transition Continuity:**
  * `body.page-is-leaving` maintains `overflow-y: scroll !important;` so scroll dimensions do not collapse during the 150ms transition exit animation.

### 2.13 Fixed Persistent Top Navigation Bar (`frontend/css/layout.css` & `frontend/js/app.js`)
* **Persistent Fixed Header:**
  * `#app-header-mount` is permanently anchored to the top of the viewport (`position: sticky; top: 0; left: 0; right: 0; width: 100%; z-index: 1000;`) across all application pages during vertical scrolling and page transitions.
  * Frosted glass background (`rgba(255, 255, 255, 0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(226, 232, 240, 0.85); box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);`) smoothly blurs all content passing underneath it without any gaps or overlapping glitches.
* **Layout Offset & Breathing Room:**
  * `.web-main-workspace` features standard top padding (`28px 32px 48px;` desktop, `20px 14px 40px;` mobile) ensuring page titles and headings are never covered or cut off by the fixed header.

### 2.14 Stacked Chart Data Labels Alignment (`frontend/js/pages/analytics.page.js` & `frontend/css/analytics.css`)
* **Elimination of Text Collisions Above Chart Bars:**
  * Previously, values and percentage badges were rendered horizontally side-by-side on a single line (`<span class="vbar-val">${share} (${pct}%)</span>`) which exceeded column widths (~30px–45px in an 8-column layout), causing adjacent labels to collide into an unreadable overlapped string.
  * Refactored into a vertically-stacked container (`.vbar-val-box`):
    * **Top Line (`.vbar-num`):** Bold numerical metric (`7.9` or raw count) centered directly above the bar.
    * **Bottom Line (`.vbar-pct`):** Subtle teal percentage badge (`(21%)`) neatly placed under the value.
* **Responsive Scaling Across Devices:**
  * Desktop: `.vbar-num` at `0.76rem`, `.vbar-pct` at `0.62rem`, `.vbar-val-box` min-height `28px`.
  * Tablet/Mobile (`<= 768px`): Scaled to `0.66rem` / `0.56rem`, min-height `24px`.
  * Small Mobile (`<= 480px`): Compact `0.60rem` / `0.52rem`, min-height `22px`.
  * Guarantees crystal-clear readability for all 8 official ADCO brand columns and display types with zero overlap or truncation.

### 2.15 Leaderboard Mobile Spotlight Podium & Trend Indicators (`frontend/css/leaderboard.css` & `frontend/js/pages/leaderboard.page.js`)
* **Redesigned Mobile Spotlight Podium (<= 768px):**
  * **1st Place Gold Card (المركز الأول):** Spans full width (`grid-column: 1 / -1; order: 1`) at the top of the mobile screen with a gold gradient border (`#f59e0b`), warm gold radial gradient backdrop, and prominent score pill.
  * **2nd & 3rd Place Cards (المركز الثاني والثالث):** Positioned side-by-side in a balanced 2-column grid directly underneath (`grid-template-columns: repeat(2, minmax(0, 1fr))`), compact, symmetrical, and easy to scan with zero horizontal overflow.
* **Removal of Letter Avatars:** Circular avatar badges with coordinator initials are completely removed, focusing attention on the name, branch, rank number, and trend badge.
* **Rank Trend Indicators:**
  * **Moved Up (صعود):** Green upward arrow SVG (`#10b981` text/icon with soft `#ecfdf5` pill background, e.g., `+2`).
  * **Moved Down (هبوط):** Red downward arrow SVG (`#ef4444` text/icon with soft `#fef2f2` pill background, e.g., `-1`).
  * **No Change (ثبات):** Slate horizontal dash/line SVG (`#64748b` with `#f1f5f9` background).

### 2.16 Mobile Branch Header Hierarchy, Glowing Pulse Indicator & Two-Word Coordinator Formatting
* **Mobile Branch Header Sequence (`.bd-hero-card-header`):**
  * On mobile viewports (`<= 768px`), elements inside the branch hero card stack in a clean, vertical sequence:
    1. Parent Client & Branch title group (`.bd-hero-title-group`).
    2. Supplying Branch Box (`.bd-hero-supply-box`) occupying 100% width with shield vector icon.
    3. Google Maps location button (`.bd-hero-map-btn`) rendered as a full-width clickable action button.
    4. Metadata grid (`.branch-meta-grid`) dynamically reorganizing into a single 100%-width column.
* **High-Visibility Glowing Pulse Indicator (`.glowing-under-review` & `@keyframes adcoReviewPulse`):**
  * Applied across all pending review counters ("بانتظار" / Under Review), including master branch status counters, filter chips (`#sp-cnt-review`, `#bd-cnt-review`), KPI cards (`#kpi-card-under-review`), and top navigation drawer badges whenever pending items require supervisor review.
  * Emits an attention-grabbing amber glow (`rgba(245, 158, 11, 0.7)`), 1.8s smooth pulse animation, and bold `#b45309` typography.
* **Two-Word Coordinator Name Formatting (`UIHelpers.formatTwoWordName`):**
  * On all external master branch cards and list views, coordinator names are truncated strictly to First and Last Name (اسم ثنائي - e.g. "أحمد العبد" instead of "أحمد محمود العبد"), while smartly preserving compound prefixes (e.g. "عبد الرحمن", "عبد العزيز") and handling multi-coordinator comma-separated lists.

### 2.17 Compact Mobile KPI Summary Bars (`frontend/css/dashboard.css` & `frontend/css/mobile-pwa.css`)
* **2+1 Mobile Summary Grid (<= 768px):**
  * Top 3 KPI metric cards reconfigure into a compact 2+1 grid on mobile screens (first 2 metrics side-by-side on row 1, and the 3rd metric spanning full width horizontally underneath), reducing mobile scroll time significantly.

### 2.18 Ultra-Light Transitions & Scrollbar Stabilization (`frontend/css/base.css`, `frontend/css/enhancements.css`, `frontend/js/app.js`)
* **Stable Scrollbar Track:** `html { overflow-y: scroll; scrollbar-gutter: stable; overflow-x: hidden; }` locks the vertical scrollbar track to eliminate page layout shift and pop-in second scrollbars during navigation.
* **Instant GPU-Accelerated Opacity Fade:** 120ms ease-out opacity transition without vertical transform shifts provides instantaneous page transitions.

### 2.19 Dedicated Activity Details & Follow-Up View (`frontend/pages/activity-details.html`)
* **Internal View Architecture:** Standalone full-page view navigated to by clicking any activity card, rendering the Supplying Branch Sector (`فرع الشركة المورد للبضاعة`), chronological Review Log with 4-criteria scorecards and manager guidance, and integrated live camera follow-up submission.


---

## 🛠️ Production Asset, Icon & CSS Build Standards

- **Lucide Vector Icons Standard:** All UI icons use `<i data-lucide="..." class="ui-icon"></i>` rendered via `frontend/js/vendor/lucide.min.js` with `refreshIcons()` called after every dynamic DOM mount. Zero Unicode emojis are permitted.
- **AVIF-Only Media Pipeline:** All raster images in `frontend/assets/images/` are strictly `.avif` (zero `.png`/`.jpg`/`.webp`). Client-side camera captures are compressed via `CameraCompressor` (`frontend/js/utils/camera-compressor.js`) with EXIF parsing via `frontend/js/utils/exif-parser.js`.
- **CSS Cascade & Build Workflow:** Edit source stylesheets in `src/css/` and compile into `frontend/css/app.min.css` using `node scripts/build-css.js` (preserving strict 16-file cascade order).
