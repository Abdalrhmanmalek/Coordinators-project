# ADCO Field Operations Platform — File Structure & Inventory

> **Version:** 2.5.0  
> **Company:** (ADCO) شركة الإسكندرية للكيماويات والمنظفات  
> **Status:** Production-Ready Modularized Frontend & API Contract

---

## 📁 Root Workspace Files

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `README.md` | Overview / Portal | Repository documentation hub with project overview and links to all technical guides. |
| `run-app.bat` | DevOps / Launch | Windows local launcher script opening `frontend/index.html` in the default web browser. |
| `vercel.json` | Cloud Hosting | Vercel serverless deployment routing mapping root requests directly to `frontend/`. |

---

## 📚 Documentation Center (`docs/`)

All technical specifications, contracts, and style guides are centralized in `docs/`:

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `docs/endpoints.md` | API Documentation | Comprehensive REST API endpoint contract, module routing, DTO request/response schemas, and HTTP status codes. |
| `docs/file-structure.md` | Inventory Report | Complete workspace inventory, directory architecture, and active file responsibility mapping. |
| `docs/system-architecture.md` | Architecture Spec | Detailed technical specifications for 3-tier RBAC, data flows, and PostgreSQL 16 schema. |
| `docs/ui-ux-design-guide.md` | Design System | Enterprise visual identity, color tokens, typography scales, and accessibility standards. |

---

## 📁 Frontend Root (`frontend/`)

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/index.html` | Presentation | Enterprise landing page with authentication gateways and system overview. |
| `frontend/manifest.json` | PWA Configuration | Progressive Web App manifest configuring display, theme colors, and home-screen installability. |
| `frontend/sw.js` | Service Worker | Service Worker providing offline asset caching and network fallback for field operations. |

---

## 🎨 Frontend Styling (`frontend/css/`)

All HTML files are decoupled from inline styles, loading modular CSS files from `frontend/css/`:

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/css/variables.css` | Design Tokens | Clean light-mode soft teal (`#0f766e`) color palette, `16px` card radius, and soft floating shadows (`0 10px 25px -5px rgba(0, 0, 0, 0.05)`). |
| `frontend/css/base.css` | Reset & Typography | Foundational light-mode CSS reset (`#f8fafc`), box-sizing, and base typography rules. |
| `frontend/css/layout.css` | Grid & Structure | Multi-column responsive fluid grids, sticky top navbar, and workspace containers. |
| `frontend/css/components.css` | UI Components | Reusable crisp white (`#ffffff`) cards, soft teal buttons, badges, modals, and form inputs. |
| `frontend/css/auth.css` | Authentication UI | Pastel mint/teal light backdrop, floating white auth card, and 3-tier fast login switcher. |
| `frontend/css/dashboard.css` | Operational Feed | KPI metric cards, Master Branch Cards (`فرع الشركة المورد للبضاعة`), interactive status counters, and activity cards. |
| `frontend/css/activity.css` | Activity Creator | Responsive 4-level cascading product selector, sticky camera dropzone, and timeline styles. |
| `frontend/css/sheets.css` | Data Table | Full-bleed spreadsheet grid, multi-parameter filter bar, and brand share pills. |
| `frontend/css/supervisor.css` | Evaluation UI | Master Branch Overview cards, interactive status counters, 100-point scoring form, and review modal. |
| `frontend/css/analytics.css` | Intelligence / BI | Circular SVG progress rings, smooth SVG wave/area chart, vertical column bar charts, and horizontal progress bars. |
| `frontend/css/leaderboard.css` | Gamification | Top-3 podium visualization with medal icons and ranked coordinator rows. |
| `frontend/css/enhancements.css` | Micro-interactions | Native CSS `@view-transition`, `0.24s` page entry/exit fade-slide transitions, and `0.2s` hover elevations. |
| `frontend/css/styles.css` | Global Harmony | Logo blend harmony utility rules. |
| `frontend/css/mobile-pwa.css` | Mobile Optimization | Viewport-specific overrides and single-column mobile card grid adaptations. |

---

## 📄 Frontend Views (`frontend/pages/`)

| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/pages/login.html` | Auth View | Secure login page with 3-tier demo account switcher and password recovery OTP modal. |
| `frontend/pages/signup-wizard.html` | Onboarding View | 3-step employee registration wizard (ID check, OTP verification, password setup). |
| `frontend/pages/dashboard.html` | Operations View | Operational dashboard with Parent Client & Branch filters, Master Branch Cards, live Under-Review KPI, and 3-tier scoping. |
| `frontend/pages/branch-details.html` | Operations View | Dedicated branch view displaying full branch metadata, clickable Google Maps location link, advanced activity filters (Type, Date/Time, Status), and branch-scoped activities. |
| `frontend/pages/activity-card.html` | Operations View | Activity card creation with dynamic database-bound read-only Supplying Branch (`فرع الشركة المورد للبضاعة`), 4-level cascading product picker, and camera dropzone. |
| `frontend/pages/sheets-view.html` | Reporting View | $1/N$ multi-brand live Google Sheets spreadsheet view with instant Excel (.CSV) export. |
| `frontend/pages/supervisor-panel.html` | Management View | 100-point evaluation scoring panel, review workflow, and completion approval module. |
| `frontend/pages/analytics.html` | Intelligence View | Enterprise analytics workspace featuring Power BI integration and KPI trends. |
| `frontend/pages/leaderboard.html` | Gamification View | Coordinator performance leaderboard featuring top-3 podium and evaluation ranks. |

---

## ⚙️ Frontend JavaScript Architecture (`frontend/js/`)

### Core Runtime Engines
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/auth.js` | Auth Engine | Client-side 3-tier authentication, session management, and auth guard validation. |
| `frontend/js/app.js` | Navigation Engine | Sticky top navbar, smooth page transitions (`navigateTo`), scroll restoration, profile modal, and SW registration. |
| `frontend/js/activity-manager.js` | Operations Engine | Activity card CRUD, $1/N$ brand share row multiplication, and local cache manager. |
| `frontend/js/supervisor.js` | Evaluation Engine | 100-point weighted evaluation scoring, activity approvals, and CSV export engine. |
| `frontend/js/ui-helpers.js` | UI Utilities | Toast notifications, date/time formatters, network connectivity listeners, and DOM helpers. |
| `frontend/js/camera-compressor.js` | Media Engine | HTML5 canvas image processing and 720p client-side compression engine. |

### API & Services
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/api/http-client.js` | API Layer | Unified `fetch` wrapper handling Bearer tokens, headers, and error handling. |
| `frontend/js/services/auth.service.js` | Service Layer | Authentication, registration, session persistence, and role management service. |
| `frontend/js/services/activity.service.js` | Service Layer | Activity creation, scoped data fetching, and follow-up round management service. |
| `frontend/js/services/evaluation.service.js` | Service Layer | Supervisor 100-point scoring, reviews, and completion approvals service. |
| `frontend/js/services/media.service.js` | Service Layer | Photo compression, hashing, and cloud media upload service. |
| `frontend/js/services/profile.service.js` | Service Layer | Password-protected employee contact updates and password change service. |
| `frontend/js/services/reporting.service.js` | Service Layer | Brand share calculation, analytics data aggregation, and CSV export service. |

### Reusable UI Components
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/components/combobox.js` | UI Component | Accessible, searchable dropdown combobox component for retail clients and branches. |
| `frontend/js/components/navbar.js` | UI Component | Responsive website top navigation bar with dynamic 3-tier role link switching. |
| `frontend/js/components/product-modal.js` | UI Component | 4-level cascading product picker modal (Brand → Main Group → Sub Group → Item/SKU). |
| `frontend/js/components/profile-modal.js` | UI Component | User profile overview, contact info editor, and 3-tier role switcher sandbox. |
| `frontend/js/components/toast.js` | UI Component | Modern floating notification toast alerts with status colors and auto-dismiss. |

### Configuration
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/config/catalogs.js` | Configuration | Retail client lists, branch catalogs, brand definitions, and product hierarchies. |
| `frontend/js/config/constants.js` | Configuration | Immutable application constants, roles, activity statuses, and storage keys. |
| `frontend/js/config/endpoints.js` | Configuration | Centralized REST API endpoint paths for backend integration. |

### Page Controllers (Single Responsibility Principle)
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/pages/login.page.js` | Controller | Handles login form submission, input validation, and 3-tier fast login buttons. |
| `frontend/js/pages/signup.page.js` | Controller | Manages the 3-step employee registration wizard and OTP verification. |
| `frontend/js/pages/dashboard.page.js` | Controller | Renders Master Branch Cards (Parent Client first, Branch underneath), KPI metrics, and activity cards. |
| `frontend/js/pages/branch-details.page.js` | Controller | Dedicated controller for `branch-details.html` showing full branch metadata and branch-filtered activities. |
| `frontend/js/pages/activity-card.page.js` | Controller | Coordinates activity creation form, live camera capture, and follow-up rounds. |
| `frontend/js/pages/sheets.page.js` | Controller | Handles the multi-brand spreadsheet view, filtering, and Excel (.CSV) export. |
| `frontend/js/pages/supervisor.page.js` | Controller | Controls the 100-point evaluation slider review panel and activity approval workflow. |
| `frontend/js/pages/analytics.page.js` | Controller | Manages the Power BI analytics embed view and metric KPI calculations. |
| `frontend/js/pages/leaderboard.page.js` | Controller | Renders the top-3 podium and sorted evaluation ranking table. |
| `frontend/js/pages/landing.page.js` | Controller | Handles landing page navigation buttons and hero interactions. |

### Utility Functions
| File Path | Module / Layer | Description |
|:---|:---|:---|
| `frontend/js/utils/validators.js` | Utility | Input validation, phone number formatting, and password complexity regex checkers. |
| `frontend/js/utils/score-calculator.js` | Utility | Calculates weighted evaluation scores (New Activity, Quality, Continuity, Documentation). |
| `frontend/js/utils/offline-queue.js` | Utility | Manages offline submission queue and automatic background synchronization. |
| `frontend/js/utils/camera-compressor.js` | Utility | Handles image resizing, aspect ratio preservation, and JPEG quality compression. |

---

## 🖼️ Static Assets (`frontend/assets/`)

### Icons (`frontend/assets/icons/`)
Vector SVG icons utilized across the application:
`archive.svg`, `arrow-left.svg`, `bar-chart-3.svg`, `calendar-clock.svg`, `camera.svg`, `check-circle-2.svg`, `circle-check-big.svg`, `circle-x.svg`, `clipboard-edit.svg`, `clipboard-pen.svg`, `clock.svg`, `file-spreadsheet.svg`, `house.svg`, `layout-dashboard.svg`, `list.svg`, `log-in.svg`, `log-out.svg`, `map-pin.svg`, `plus-circle.svg`, `plus.svg`, `sheet.svg`, `shield-check.svg`, `sliders.svg`, `star.svg`, `table-2.svg`, `trophy.svg`, `user-cog.svg`, `user-plus.svg`, `x-circle.svg`.

### Images (`frontend/assets/images/`)
Raster and vector graphics:
- `ADCO-logo.png` — Official high-resolution company emblem.
- `auth-hero-bg.webp` / `auth-hero-bg.svg` — Atmospheric background backdrop for authentication pages.
- `avatar-coordinator.svg` — Coordinator user profile avatar.
- `avatar-supervisor.svg` — Supervisor & manager user profile avatar.
- `medal-gold.svg` — Gold medal icon for Leaderboard 1st place.
- `medal-silver.svg` — Silver medal icon for Leaderboard 2nd place.
- `medal-bronze.svg` — Bronze medal icon for Leaderboard 3rd place.

---

## 🎯 Target Backend Directory Structure (`src/modules/`)

As detailed in `endpoints.md`, the backend API architecture maps directly to these modules:

```text
src/
└── modules/
    ├── auth/            # POST /api/v1/auth/login, POST /api/v1/auth/verify-employee, OTP dispatch
    ├── users/           # GET /api/v1/users/me, PATCH /api/v1/users/contact-info, PATCH /api/v1/users/password
    ├── activities/      # GET/POST /api/v1/activities, POST /api/v1/activities/:id/follow-ups, POST completion
    ├── evaluation/      # POST /api/v1/evaluation/:activityId/score, GET /api/v1/evaluation/leaderboard
    ├── reporting/       # GET /api/v1/reports/brand-shares, GET /api/v1/reports/export/csv, GET /api/v1/reports/kpis
    └── media/           # POST /api/v1/media/upload
```

