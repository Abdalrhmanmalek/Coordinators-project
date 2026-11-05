# Alexandria Company for Chemicals and Detergents (ADCO) — UI/UX Design & Frontend Style Guide

This master design guide defines the enterprise visual standards, responsive layout architecture, typography hierarchy, zero-emoji policy, and component design system for **Alexandria Company for Chemicals and Detergents (ADCO)**.

---

## 1. Global Corporate Identity & Branding

* **Official Entity Name:** `Alexandria Company for Chemicals and Detergents (ADCO)`
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
* **Header Branding:**
  * Official transparent ADCO logo (`ADCO-logo.png`).
  * Corporate title: `Alexandria Company for Chemicals and Detergents (ADCO)`.
  * Subtitle: `Field Operations & Reporting Management System`.
* **Navigation Links:**
  * Coordinator Links: `Home`, `Add Activity`, `Leaderboard`.
  * Supervisor Links: `Supervision Board`, `Data Sheet`, `Analytics`, `Activity Log`.
* **User Controls & Status:**
  * Coordinator Rank Badge (e.g. `#1`, `#2`, `#3` — automatically hidden in Supervisor mode).
  * User profile card trigger and clean logout button.

### 2.2 Authentication Screen (`frontend/pages/login.html`)
* **Page Title & Heading:** `Operations Management System`.
* **Vertical Centering & Stacking:**
  * The auth box header is aligned vertically in a centered flex column (`display: flex; flex-direction: column; align-items: center; text-align: center;`).
  * Exact vertical order:
    1. **Company Logo:** `ADCO-logo.png` (transparent background, centered).
    2. **Security Badge:** Pill badge `Certified Field Operations Portal` with shield SVG icon.
    3. **Heading Title:** `Operations Management System` (bold emerald `#064e3b`).
    4. **Subtitle:** `Enter employee ID and password registered with ADCO records.`.
* Password input features an eye toggle button (`show/hide password`).

### 2.3 Coordinator Dashboard (`frontend/pages/dashboard.html`)
* **Welcome Heading:** `Welcome, <Employee Name>`
* **Role Subtitle:** Labeled strictly **"Field Coordinator"** for field coordinators.
* **KPI Metrics:**
  * `Total Registered Activities`: Total activities.
  * `Approved Activities`: Approved activities count.
  * `Average Comprehensive Evaluation`: Average weighted score out of 100 points.

### 2.4 Activity Creation Form (`frontend/pages/activity-card.html`)
* **Branch Labels:**
  * Client retail branch labeled strictly: **"Client Branch *"**.
  * Coordinator logistic sector labeled strictly: **"Company Branch *"**.
* **Activity Categories (`Activity Category`):**
  * Includes standardized categories: `Gondola`, `Dress Up`, `Side Gondola`, `Stand`, `Podium`, `Pillar`, `Cut Man`, `See-Through`, `Light Box`, `Floor Display`.
* **Magazine Date Range (`Magazine Feature`):**
  * When `activity === 'Magazine Feature'`, displays a dedicated warning container with two mandatory date fields:
    * **Start Date (`magazineStartDate`)**
    * **End Date (`magazineEndDate`)** (validation: End Date $\ge$ Start Date).
  * Automatically hidden and cleared when any other activity type is selected.
* **4-Level Cascading Product Picker Modal (`+ Add Product`):**
  * Launches `#product-picker-modal` with 4 cascading select dropdowns:
    1. **Brand Name** (Brand Name)
    2. **Main Group** (Main Group — filtered by Brand)
    3. **Sub Group** (Sub Group — filtered by Main Group)
    4. **Item / SKU** (Item / SKU — filtered by Sub Group)
  * Clicking **"Add Item"** appends the product to the active card list and updates the $1/N$ brand share badge.

### 2.5 Leaderboard & Mobile Podium Order (`frontend/pages/leaderboard.html`)
* **Desktop View (`> 768px`):** Horizontal podium (#2 Silver, #1 Gold centered and elevated, #3 Bronze).
* **Mobile View (`<= 768px`):** Explicit CSS flexbox `order` rules ensure the podium stacks in true vertical ranking:
  * **Top (`order: 1`):** 1st Place (Gold `#1`).
  * **Middle (`order: 2`):** 2nd Place (Silver `#2`).
  * **Bottom (`order: 3`):** 3rd Place (Bronze `#3`).
