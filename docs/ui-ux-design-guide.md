# (ADCO) شركة الاسكندريه للكيماويات و المنظفات — UI/UX Design & Frontend Style Guide

This master design guide defines the enterprise visual standards, responsive layout architecture, typography hierarchy, zero-emoji policy, and component design system for **(ADCO) شركة الاسكندريه للكيماويات و المنظفات**.

---

## 1. Global Corporate Identity & Branding

* **Official Entity Name:** `(ADCO) شركة الاسكندريه للكيماويات و المنظفات`
* **Brand Primary Colors:**
  * Forest Green: `#15803d` (`--adco-green-primary`)
  * Deep Emerald: `#064e3b` (`--adco-green-deep`)
  * Mint Soft: `#dcfce7` (`--adco-green-soft`)
  * Slate Dark: `#0f172a` (`--adco-dark`)
  * Neutral Background: `#f8fafc`
* **Zero-Emoji Policy:**
  * All legacy emojis (`📸`, `🔄`, `📊`, `🔐`, `⭐`, `📅`, `🛡️`, `🥇`, `🥈`, `🥉`) are replaced with official vector SVG icons (`20×20px`, `stroke-width="1.75"`).

---

## 2. Layout, Navigation & Screen Hierarchy

### 2.1 Sticky Top Website Navigation Bar (`web-top-navbar`)
* Standardized full-width sticky navigation bar (`height: 68px`, `background: #FFFFFF`, `border-bottom: 1px solid #E2E8F0`).
* **Right Side (RTL):**
  * Official transparent ADCO logo (`ADCO-logo.png`).
  * Corporate title: `(ADCO) شركة الاسكندريه للكيماويات و المنظفات`.
  * Subtitle: `منظومة إدارة العمليات الميدانية والتقارير`.
* **Center:**
  * Coordinator Links: `الرئيسية`, `إضافة نشاط`, `لوحة الترتيب`.
  * Supervisor Links: `لوحة الإشراف`, `جدول البيانات`, `التحليلات`, `سجل الأنشطة`.
* **Left Side:**
  * Coordinator Rank Badge (e.g. `#1`, `#2`, `#3` — automatically hidden in Supervisor mode).
  * User profile card trigger and clean logout button.

### 2.2 Authentication Screen (`pages/login.html`)
* **Page Title & Heading:** `منظومة ادارة العمليات` (Management of Operations System).
* **Vertical Centering & Stacking:**
  * The auth box header is aligned vertically in a centered flex column (`display: flex; flex-direction: column; align-items: center; text-align: center;`).
  * Exact vertical order:
    1. **Company Logo:** `ADCO-logo.png` (transparent background, centered).
    2. **Security Badge:** Pill badge `بوابة العمليات الميدانية المعتمدة` with shield SVG icon.
    3. **Heading Title:** `منظومة ادارة العمليات` (bold emerald `#064e3b`).
    4. **Subtitle:** `أدخل الرقم الوظيفي وكلمة المرور المسجلة بسجلات أدكو`.
* Password input features an eye toggle button (`show/hide password`).

### 2.3 Coordinator Dashboard (`pages/dashboard.html`)
* **Welcome Heading:** `أهلاً، <اسم الموظف>`
* **Role Subtitle:** Labeled strictly **"منسق ميداني"** for field coordinators.
* **KPI Metrics:**
  * `إجمالي الأنشطة المسجلة`: Total activities.
  * `الانشطه المقبوله`: Approved activities count.
  * `متوسط التقييم الشامل`: Average weighted score out of 100 points.

### 2.4 Activity Creation Form (`pages/activity-card.html`)
* **Branch Labels:**
  * Client retail branch labeled strictly: **"فرع العميل *"**.
  * Coordinator logistic sector labeled strictly: **"فرع الشركة (Branch) *"**.
* **Activity Categories (`نوع النشاط`):**
  * Includes standardized categories: `جندولة`, `دريس اب`, `سايد جندولة`, `ستاند`, `بوديوم`, `بيلر`, **`كات مان`**, `سي ثرو`, **`لايت بوكس`**, `عرض أرضي`.
* **Magazine Date Range (`فرشة مجلة`):**
  * When `activity === 'فرشة مجلة'`, displays a dedicated warning container with two mandatory date fields:
    * **تاريخ البداية (`magazineStartDate`)**
    * **تاريخ النهاية (`magazineEndDate`)** (validation: End Date $\ge$ Start Date).
  * Automatically hidden and cleared when any other activity type is selected.
* **4-Level Cascading Product Picker Modal (`+ إضافة منتج`):**
  * Launches `#product-picker-modal` with 4 cascading select dropdowns:
    1. **اسم البراند** (Brand Name)
    2. **مجموعة رئيسية** (Main Group — filtered by Brand)
    3. **مجموعة فرعية** (Sub Group — filtered by Main Group)
    4. **الصنف** (Item / SKU — filtered by Sub Group)
  * Clicking **"إضافة الصنف"** appends the product to the active card list and updates the $1/N$ brand share badge.

### 2.5 Leaderboard & Mobile Podium Order (`pages/leaderboard.html`)
* **Desktop View (`> 768px`):** Horizontal podium (#2 Silver, #1 Gold centered and elevated, #3 Bronze).
* **Mobile View (`<= 768px`):** Explicit CSS flexbox `order` rules ensure the podium stacks in true vertical ranking:
  * **Top (`order: 1`):** 1st Place (Gold `#1`).
  * **Middle (`order: 2`):** 2nd Place (Silver `#2`).
  * **Bottom (`order: 3`):** 3rd Place (Bronze `#3`).
