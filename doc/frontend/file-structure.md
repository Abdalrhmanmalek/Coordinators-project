# ADCO Field Operations Platform — Monorepo File Structure & Inventory

> **Version:** 2.6.0  
> **Company:** (ADCO) شركة الإسكندرية للكيماويات والمنظفات  
> **Architecture:** Production-Grade Monorepo (`frontend/`, `backend/`, `doc/`, `scripts/`, `src/css/`)  
> **Status:** Fully Modularized & Verified

---

## 🏛️ Monorepo High-Level Architecture

The repository is structured as a decoupled enterprise monorepo:

```text
adco-field-app/
├── backend/                  # Backend contracts, architecture specifications & design diagrams
│   ├── doc/
│   │   ├── ADCO-Final-System-Design.md   # PostgreSQL 16 schema & system design specification
│   │   └── ADCO-System-Diagrams.md       # Sequence, ERD, and workflow state diagrams
│   └── README.md                         # Backend services & database overview
│
├── doc/                     # Centralized technical documentation & regulatory references
│   ├── references/
│   │   └── لائحة مسابقة ومنهجية تقييم المنسقين الميدانيين - ADCO.pdf
│   ├── ADCO-Frontend-Audit-Result.md
│   ├── agent-guardrails.md
│   ├── endpoints.md
│   ├── evaluation.md
│   ├── file-structure.md
│   ├── system-architecture.md
│   └── ui-ux-design-guide.md
│
├── frontend/                 # Client PWA, static HTML5 pages, assets & JavaScript engines
│   ├── assets/
│   │   └── images/           # High-efficiency AVIF image assets (zero legacy formats)
│   ├── css/
│   │   └── app.min.css       # Unified compiled production stylesheet
│   ├── js/
│   │   ├── api/              # HTTP client and network wrappers
│   │   ├── components/       # UI components (navbar, master-branch-card, product-modal, etc.)
│   │   ├── config/           # Catalogs, endpoints, constants, env configuration
│   │   ├── pages/            # View controllers for each frontend HTML view
│   │   ├── services/         # Domain services (auth, activity, evaluation, branch, media)
│   │   ├── store/            # Local activity store and employee seed registry
│   │   ├── utils/            # Pure domain utilities (GPS, formatters, score, camera compressor)
│   │   └── vendor/           # Vendored runtime libraries (lucide.min.js)
│   ├── pages/                # Standalone HTML5 application views
│   ├── index.html            # Main application landing portal
│   ├── manifest.json         # PWA Web App Manifest
│   └── sw.js                 # PWA Service Worker (offline cache v11)
│
├── scripts/                  # Production build pipeline and automated verification suites
│   ├── build-css.js          # Cascading CSS compiler and minifier
│   ├── test_e2e_verification.js     # End-to-end automated regression test suite
│   └── verify_workspace_paths.js   # Automated link, script, and import path integrity checker
│
├── src/
│   └── css/                  # 16 modular source stylesheets maintained in cascade order
│
├── trash/                    # Quarantined unused & duplicate files (excluded from Git & Vercel)
│   ├── assets/               # Quarantined unused assets
│   ├── code/                 # Quarantined unused scripts & duplicate configs
│   └── doc/                 # Quarantined duplicate documentation
│
├── .gitignore                # Git exclusions (includes trash/)
├── .vercelignore             # Vercel deployment exclusions (includes trash/, backend/, doc/, scripts/)
├── AGENTS.md                 # Agent guidelines and architectural guardrails
├── README.md                 # Workspace documentation portal
├── run-app.bat               # Windows local launcher
└── vercel.json               # Vercel cloud deployment routing configuration
```

---

## 📁 Root Workspace Files

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `README.md` | Overview / Portal | Repository documentation hub with project overview and links to all technical guides. |
| `run-app.bat` | DevOps / Launch | Windows local launcher script opening `frontend/index.html` in the default web browser. |
| `vercel.json` | Cloud Hosting | Vercel serverless deployment routing mapping root requests directly to `frontend/`. |
| `.gitignore` | Version Control | Standard git exclusions for build outputs and local environment files. |
| `.vercelignore` | Cloud Hosting | Excludes development docs and build scripts from production Vercel builds. |
| `AGENTS.md` | AI Guidelines | Behavioral guardrails, system contracts, and workflow execution rules for AI assistants. |

---

## 🏛️ Backend Architecture (`backend/`)

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `backend/README.md` | Architecture Overview | Summary of PostgreSQL 16 schema, 3-tier RBAC access, and service contracts. |
| `backend/doc/ADCO-Final-System-Design.md` | System Specification | Complete backend system design, database schemas, and REST API contract. |
| `backend/doc/ADCO-System-Diagrams.md` | Visual Architecture | Sequence diagrams, ERD, and workflow state transition diagrams. |

---

## 📚 Documentation Center (`doc/`)

All technical specifications, contracts, and style guides are centralized in `doc/`:

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `doc/agent-guardrails.md` | Compliance Spec | Permanent engineering guardrails for AI agents and maintainers: mandatory reading, zero emojis, modular layer separation, UMD script compatibility, and locked mathematical schemas. |
| `doc/endpoints.md` | API Documentation | Comprehensive REST API endpoint contract, module routing, DTO request/response schemas, and HTTP status codes. |
| `doc/evaluation.md` | Scoring Engine Spec | Technical specifications for 100-point evaluation breakdown (40/20/25/15), anti-cheat deduction rules, Bayesian volume-weighted leaderboard formula, and multi-round review log schema. |
| `doc/file-structure.md` | Inventory Report | Complete workspace inventory, directory architecture, and active file responsibility mapping. |
| `doc/system-architecture.md` | Architecture Spec | Detailed technical specifications for 3-tier RBAC, data flows, and PostgreSQL 16 schema. |
| `doc/ui-ux-design-guide.md` | Design System | Enterprise visual identity, color tokens, typography scales, persistent navbar specs, and accessibility standards. |
| `doc/ADCO-Frontend-Audit-Result.md` | Codebase Audit | Comprehensive technical audit report of all frontend views, scripts, and stylesheets. |
| `doc/references/لائحة مسابقة ومنهجية تقييم المنسقين الميدانيين - ADCO.pdf` | Regulatory Doc | Official ADCO field coordinator contest bylaws and evaluation methodology regulations. |

---

## 📁 Frontend Root (`frontend/`)

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/index.html` | Presentation | Enterprise landing page with authentication gateways and system overview. |
| `frontend/manifest.json` | PWA Configuration | Progressive Web App manifest configuring display, theme colors, and home-screen installability. |
| `frontend/sw.js` | Service Worker | Service Worker providing offline asset caching (cache v11) and network fallback for field operations. |

---

## 🎨 Stylesheets & Production Bundling (`src/css/` & `frontend/css/`)

The application adopts a decoupled source/distribution CSS pipeline:
- **Source Stylesheets (`src/css/`):** 16 modular stylesheets maintained during development in exact cascade order.
- **Production CSS Bundle (`frontend/css/app.min.css`):** Built via `scripts/build-css.js`, concatenating and minifying all stylesheets into a single production asset (~144 KB, ~28% compression). All HTML pages load strictly `app.min.css`.
- **Vector Icons Standard:** All icons are served via **Lucide Icons CDN** (`https://unpkg.com/lucide@latest`) with standard `<i data-lucide="..." class="ui-icon"></i>` tags and reactive `refreshIcons()` lifecycle hooks. Local SVG icon files in `frontend/assets/icons/` have been permanently purged.

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/css/app.min.css` | Production Bundle | Single minified bundle loaded across all HTML files in `frontend/`. |
| `src/css/variables.css` | Design Tokens | Clean light-mode soft teal (`#0f766e`) color palette, `16px` card radius, and soft floating shadows (`0 10px 25px -5px rgba(0, 0, 0, 0.05)`). |
| `src/css/base.css` | Reset & Typography | Foundational light-mode CSS reset (`#f8fafc`), box-sizing, Lucide icon sizing rules, and typography. |
| `src/css/layout.css` | Grid & Structure | Multi-column responsive fluid grids, persistent top navbar, responsive scaling (769px-1024px desktop links visible), and workspace containers. |
| `src/css/components.css` | UI Components | Reusable crisp white (`#ffffff`) cards, soft teal buttons, badges, modals, and form inputs. |
| `src/css/auth.css` | Authentication UI | Pastel mint/teal light backdrop, floating white auth card, and 3-tier fast login switcher. |
| `src/css/dashboard.css` | Operational Feed | KPI metric cards, Master Branch Cards (`border: 1.5px solid #99f6e4`, `border-radius: 18px`), interactive status counters, and activity cards. |
| `src/css/activity.css` | Activity Creator | Responsive 4-level cascading product selector, sticky camera dropzone, and timeline styles. |
| `src/css/activity-details.css` | Activity Details | Standalone activity view, multi-round review log timeline (4-criteria scorecard & manager notes), and integrated follow-up submission. |
| `src/css/evaluation.css` | Evaluation UI | 100-point Bayesian evaluation scorecard, 4-pillar scoring sliders, photo verification, and GPS radius checks. |
| `src/css/sheets.css` | Data Table | Full-bleed spreadsheet grid, multi-parameter filter bar, and brand share pills. |
| `src/css/supervisor.css` | Supervisor Portal | Master Branch Overview cards, interactive status counters, 100-point scoring form, and review modal. |
| `src/css/analytics.css` | Intelligence / BI | Circular SVG progress rings, smooth SVG wave/area chart, vertical column bar charts, and horizontal progress bars. |
| `src/css/leaderboard.css` | Gamification | Top-3 podium visualization with medal icons and ranked coordinator rows. |
| `src/css/enhancements.css` | Micro-interactions | Native CSS `@view-transition`, `0.24s` page entry/exit fade-slide transitions, and `0.2s` hover elevations. |
| `src/css/styles.css` | Global Harmony | Logo blend harmony utility rules. |
| `src/css/mobile-pwa.css` | Mobile Optimization | Viewport-specific overrides and single-column mobile card grid adaptations. |

---

## 📄 Frontend Views (`frontend/pages/`)

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/pages/login.html` | Auth View | Secure login page with Employee ID & password inputs and password recovery OTP modal. |
| `frontend/pages/signup-wizard.html` | Onboarding View | 3-step employee registration wizard (ID check, OTP verification, password setup). |
| `frontend/pages/dashboard.html` | Operations View | Operational dashboard with Parent Client & Branch filters, Master Branch Cards, live Under-Review KPI, and 3-tier scoping. |
| `frontend/pages/branch-details.html` | Operations View | Dedicated branch view displaying full branch metadata, clickable Google Maps location link, advanced activity filters (Type, Date/Time, Status), and branch-scoped activities. |
| `frontend/pages/evaluation.html` | Review View | Dedicated standalone full-screen supervisor evaluation and scoring page (immune to swipe dismissal, F5 refresh persistent, zero text clashing). |
| `frontend/pages/activity-card.html` | Operations View | Activity card creation with dynamic database-bound read-only Supplying Branch (`فرع الشركة المورد للبضاعة`), 4-level cascading product picker, and camera dropzone. |
| `frontend/pages/activity-details.html` | Review & Operations | Dedicated standalone activity view with full metadata (supplying branch, activity type, participating brands), chronological Review Log (4-criteria breakdown & manager notes), and integrated follow-up round submission. |
| `frontend/pages/sheets-view.html` | Reporting View | $1/N$ multi-brand live Google Sheets spreadsheet view with instant Excel (.CSV) export. |
| `frontend/pages/supervisor-panel.html` | Management View | Master Branch Overview cards, live activities feed, 100-point evaluation scoring panel, review workflow, and completion approval module. |
| `frontend/pages/analytics.html` | Intelligence View | Enterprise analytics workspace featuring Power BI integration and KPI trends. |
| `frontend/pages/leaderboard.html` | Gamification View | Coordinator performance leaderboard featuring top-3 podium and evaluation ranks. |

---

## ⚙️ Frontend JavaScript Architecture (`frontend/js/`)

### Core Runtime Engines & Backward-Compatible Facades
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/activity-manager.js` | Facade Orchestrator | Lightweight backward-compatible facade composing `ActivityStore`, `BranchService`, `GpsProximityUtil`, `ScoreUtil`, `BrandShareUtil`, `ActivitySubmissionService`, and `ActivityLifecycleService` onto `window.ActivityManager`. |
| `frontend/js/supervisor.js` | Evaluation Engine | Lean supervisor review engine with composed `ReportExportService` methods onto `window.SupervisorEngine`. |
| `frontend/js/auth.js` | Auth Guard | Client-side 3-tier authentication guard, session persistence, and role resolution. |
| `frontend/js/app.js` | Navigation Engine | Persistent top navbar (mount-once), client-side SPA routing (`navigateTo`), active bold typography, profile modal, and SW registration. |
| `frontend/js/ui-helpers.js` | UI Utilities | Toast notifications, modal backdrop handlers, combobox generators, DOM helpers, and `refreshIcons()`. |

### UI Components (`frontend/js/components/`)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/components/navbar.js` | UI Component | Enterprise website top navbar rendering, mount-once guard, and active link state detection. |
| `frontend/js/components/master-branch-card.js` | UI Component | Clean Master Branch Card component matching Image 3 (rounded 18px, mint border, showcase pills, 2-col info grid, and 5 status counters). |
| `frontend/js/components/activity-card-item.js` | UI Component | Reusable activity card item for feeds with status badge, media photo preview, and action buttons. |
| `frontend/js/components/combobox.js` | UI Component | Accessible searchable dropdown selection component. |
| `frontend/js/components/product-modal.js` | UI Component | 4-level cascading product picker modal with SKU selection and brand share calculation. |
| `frontend/js/components/profile-modal.js` | UI Component | User profile management modal with contact info editing and secure password changing. |
| `frontend/js/components/toast.js` | UI Component | Non-intrusive animated toast notifications. |

### Domain Services (`frontend/js/services/`)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/services/auth.service.js` | Service | Authentication service with token management, credential validation, and role resolution. |
| `frontend/js/services/activity.service.js` | Service | Activity CRUD and retrieval service. |
| `frontend/js/services/activity-submission.service.js` | Service | Activity creation, image processing coordination, and submission pipeline. |
| `frontend/js/services/activity-lifecycle.service.js` | Service | Activity lifecycle transitions, completion requests, and direct supervisor closures. |
| `frontend/js/services/branch.service.js` | Service | Branch metadata resolution and client-branch relationship mapping. |
| `frontend/js/services/evaluation.service.js` | Service | Supervisor grading, scoring computation, and audit logging. |
| `frontend/js/services/media.service.js` | Service | Media handling, camera capture integration, and file compression. |
| `frontend/js/services/report-export.service.js` | Service | Google Sheets synchronization and CSV export engine. |
| `frontend/js/services/reporting.service.js` | Service | Reporting aggregation and analytics data compilation. |

### Data Stores & Seeds (`frontend/js/store/`)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/store/activity.store.js` | Local Store | IndexedDB and localStorage activity caching and persistence. |
| `frontend/js/store/employee-registry.seed.js` | Seed Registry | Initial mock employee database for 3-tier demonstration. |
| `frontend/js/store/seed-data.js` | Seed Data | Mock activities, branches, clients, and catalog seed records. |

### Application View Controllers (`frontend/js/pages/`)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/pages/login.page.js` | Controller | Handles login form submission, authentication validation, and password reset OTP. |
| `frontend/js/pages/signup.page.js` | Controller | Manages the 3-step employee registration wizard and OTP verification. |
| `frontend/js/pages/dashboard.page.js` | Controller | Renders Master Branch Cards, KPI metrics, and activity cards with interactive filters. |
| `frontend/js/pages/branch-details.page.js` | Controller | Dedicated controller for `branch-details.html` showing full branch metadata and branch-filtered activities. |
| `frontend/js/pages/evaluation.page.js` | Controller | Dedicated controller for standalone `evaluation.html` with 3-section ordering and 100-point criteria scoring. |
| `frontend/js/pages/activity-card.page.js` | Controller | Coordinates activity creation form, live camera capture, and follow-up rounds. |
| `frontend/js/pages/activity-details.page.js` | Controller | Manages standalone activity details view, chronological review log rendering (4-criteria scorecard & manager notes), and new follow-up round submissions. |
| `frontend/js/pages/sheets.page.js` | Controller | Handles the multi-brand spreadsheet view, filtering, and Excel (.CSV) export. |
| `frontend/js/pages/supervisor.page.js` | Controller | Controls the supervisor management dashboard, master branch cards, activities feed, and review workflow. |
| `frontend/js/pages/analytics.page.js` | Controller | Manages the Power BI analytics embed view and metric KPI calculations. |
| `frontend/js/pages/leaderboard.page.js` | Controller | Renders the top-3 podium and sorted evaluation ranking table. |
| `frontend/js/pages/landing.page.js` | Controller | Handles landing page navigation buttons and hero interactions. |

### Utility Functions & Pure Domain Logic (`frontend/js/utils/`)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/utils/formatters.js` | Domain Util | Reusable Arabic date/time formatters, Cairo timezone converters, and two-word name truncation helpers. |
| `frontend/js/utils/gps-proximity.util.js` | Domain Util | Haversine distance calculator, GPS coordinate parsing, and $\le 150\text{ m}$ proximity validator. |
| `frontend/js/utils/brand-share.util.js` | Domain Util | $1/N$ multi-brand row multiplication and proportional brand share calculations. |
| `frontend/js/utils/score.util.js` | Domain Util | 100-point weighted evaluation calculations and coordinator leaderboard ranking. |
| `frontend/js/utils/score-calculator.js` | Domain Util | Calculates 100-point weighted evaluation scores (40/20/25/15), anti-cheat deductions, and Bayesian volume-weighted leaderboard rankings. |
| `frontend/js/utils/camera-compressor.js` | Media Util | Consolidated authoritative 720p image compression and SHA-256 byte hashing. |
| `frontend/js/utils/exif-parser.js` | Media Util | Pure-JavaScript EXIF TIFF/GPS tag parser for JPEG captures. |
| `frontend/js/utils/camera-compressor.esm.js` | Media Util (ESM) | ES Module bridge for camera compressor. |
| `frontend/js/utils/validators.js` | Validation Util | Input validation, phone number formatting, and password complexity regex checkers. |
| `frontend/js/utils/offline-queue.js` | Offline Util | Manages offline submission queue and automatic background synchronization. |

### Newly Modularized Layer Additions (≤ 350-Line Cap)
- **API Integration Seams (`frontend/js/api/`):** `client.js`, `endpoints.js`, `http-client.js`
- **Services (`frontend/js/services/`):** `activity-closure.service.js`
- **Store (`frontend/js/store/`):** `seed-data-extra.js`, `employee-registry.esm.js`
- **Components (`frontend/js/components/`):** `analytics-charts.js`, `branch-hero-card.js`, `dashboard-branches.js`, `evaluation-media.js`, `gallery-lightbox.js`, `multi-select-combobox.js`, `router-lifecycle.js`, `ui-combobox.js`, `ui-multi-combobox.js`, `activity-details-hero.js`, `activity-details-timeline.js`, `activity-details-products.js`, `activity-details-followup.js`, `supervisor-branches.js`, `supervisor-feed.js`, `supervisor-review-modal.js`, `supervisor-audit-modal.js`, `activity-card-products.js`, `activity-card-modals.js`, `activity-card-detail-view.js`, `activity-card-detail-actions.js`, `activity-card-gps-camera.js`, `activity-card-submit.js`

---

## 🖼️ Static Assets (`frontend/assets/`)

### Images (`frontend/assets/images/`)
All images in the repository are strictly in high-efficiency `.avif` format with zero legacy image formats (`.png`, `.jpg`, `.jpeg`, `.webp`):
- `ADCO-logo.avif` — Official high-resolution company logo.
- `auth-hero-bg.avif` — Atmospheric background backdrop for authentication pages.
- `avatar-coordinator.avif` — Coordinator user profile avatar.
- `avatar-supervisor.avif` — Supervisor & manager user profile avatar.
- `fathalla-branch.avif` — High-resolution supermarket retail branch showcase photograph.
- `medal-gold.avif` — Gold medal graphic for Leaderboard 1st place.
- `medal-silver.avif` — Silver medal graphic for Leaderboard 2nd place.
- `medal-bronze.avif` — Bronze medal graphic for Leaderboard 3rd place.

---

## 🛠️ Build & Verification Scripts (`scripts/`)

| Script File | Purpose | Description |
|:---|:---|:---|
| `scripts/build-css.js` | Build Pipeline | Concatenates and minifies the 16 source stylesheets from `src/css/` into `frontend/css/app.min.css`. |
| `scripts/test_e2e_verification.js` | Test Suite | 33-point end-to-end automated verification testing navbar, master branch cards, typography, and assets. |
| `scripts/verify_workspace_paths.js` | Integrity Checker | Scans all HTML, JS, CSS, SW, and Manifest files to guarantee 0 broken paths or missing imports. |
