# Alexandria Company for Chemicals and Detergents (ADCO)
## Field Operations & Promotion Verification Platform

[![Version](https://img.shields.io/badge/version-2.5.0-success.svg)](./docs/file-structure.md)
[![Architecture](https://img.shields.io/badge/RBAC-3--Tier-blue.svg)](./docs/system-architecture.md)
[![PWA](https://img.shields.io/badge/PWA-Enabled-emerald.svg)](./frontend/manifest.json)
[![Status](https://img.shields.io/badge/Frontend-Modularized-brightgreen.svg)](./docs/file-structure.md)

The unified digital enterprise platform for **Alexandria Company for Chemicals and Detergents (ADCO)** to manage, document, and verify field marketing operations, retail product displays, $1/N$ multi-brand visibility shares, and field execution quality according to certified 100-point evaluation criteria.

---

## 🚀 Local Quick Start

### Running the Application:
- **Windows OS:** Double-click [`run-app.bat`](./run-app.bat) to launch the portal directly in your default browser.
- **Any Modern Browser:** Open [`frontend/index.html`](./frontend/index.html) directly (fully supports the offline local `file://` protocol as well as static HTTP servers like Live Server, Nginx, or Vercel).

---

## 👥 3-Tier RBAC Demo Accounts

| User Level / Role | Name & Employee ID | Password | Data Scoping & Operational Permissions |
|:---|:---|:---|:---|
| **1. Field Coordinator (`COORDINATOR`)** | Ahmed Mahmoud El-Abd (`ADCO-101`) | `Pass@1234` | Create activity cards, upload follow-up photo rounds, submit "Request Activity Completion", view personal rank & Leaderboard. Scoped strictly to their single assigned branch (Smouha Branch). |
| **2. Coordinator Supervisor (`COORDINATOR_SUPERVISOR`)** | Ayman Abdel Rahman El-Rouby (`ADCO-501`) | `Super@2026` | Identical operational capabilities with extended oversight across **all branches of their assigned retail chain in Alexandria (Fathalla Market)**. Competes on the Leaderboard at Rank #2 (Silver Medal). Dedicated client branch & coordinator filter toolbar. |
| **3. Marketing Manager (`MARKETING_MANAGER`)** | Eng. Hossam El-Din Ghanem (`ADCO-901`) | `Admin@2026` | Unrestricted nationwide administrative access. Audits and grades follow-ups using the 100-point evaluation matrix, approves/rejects activities & completion requests, inspects live $1/N$ multi-brand sheets, and views Power BI analytics. |

---

## ⚡ Key Architectural Capabilities

- **Strict Single Source of Truth (SSOT):** Clean entry point via `frontend/index.html` with zero duplicate root shells or orphaned test scripts.
- **Decoupled CSS & Component Architecture:** Zero embedded or inline styles; 14 modular stylesheets in `frontend/css/` and isolated single-responsibility page controllers in `frontend/js/pages/`.
- **4-Level Cascading Product Picker:** Dynamic cascading selection (`Brand` ➔ `Main Group` ➔ `Sub Group` ➔ `Item/SKU`) with real-time $1/N$ brand share weight recalculation.
- **Client-Side Camera & Media Pipeline:** Live hardware capture, 720p canvas compression ($< 1\text{MB}$), SHA-256 byte hashing, and EXIF timestamp extraction validated against Egypt standard time (`Africa/Cairo`).
- **100-Point Supervisor Evaluation Matrix:** Structured scoring across 4 weighted pillars: New Verified Activities (40 pts), Execution Quality (20 pts), Continuity (25 pts), and Documentation & Accuracy (15 pts).
- **Responsive Stacking & Mobile PWA:** True mobile-first layout with CSS flexbox order podium ranking on mobile devices and offline service worker caching.

---

## 📚 Technical Documentation Center (`docs/`)

All architectural specifications, database schemas, API contracts, and design tokens are organized inside the [`docs/`](./docs/) directory:

| Document | Scope & Contents |
|:---|:---|
| 📋 [**File Structure & Inventory (`docs/file-structure.md`)**](./docs/file-structure.md) | Exhaustive file-by-file inventory mapping every active asset, stylesheet, page, component, and service to its architectural responsibility. |
| 🔌 [**REST API Specifications & DTOs (`docs/endpoints.md`)**](./docs/endpoints.md) | Complete backend API contract detailing HTTP verbs, module routing, request DTOs, Zod validation schemas, and PostgreSQL 16 response structures. |
| 🏛️ [**System Architecture & Data Flows (`docs/system-architecture.md`)**](./docs/system-architecture.md) | In-depth engineering blueprint covering 3-tier RBAC security, $1/N$ multi-brand row multiplication algorithms, and end-to-end data lifecycle. |
| 🎨 [**UI/UX Design & Style Guide (`docs/ui-ux-design-guide.md`)**](./docs/ui-ux-design-guide.md) | Enterprise design system standards, official ADCO emerald/mint green color palettes, typography hierarchy, zero-emoji policy, and responsive mobile rules. |

---

## 🏗️ Repository Directory Structure

```text
adco-field-app/
├── docs/                                       # 📚 Centralized Technical Documentation
│   ├── endpoints.md                            # REST API specifications & DTO schemas
│   ├── file-structure.md                       # Repository file inventory & responsibility guide
│   ├── system-architecture.md                  # 3-tier RBAC architecture & data flow matrix
│   └── ui-ux-design-guide.md                   # UI/UX design tokens & visual standards
│
├── frontend/                                   # 💻 Client Application (Single Source of Truth)
│   ├── index.html                              # Primary web application landing shell
│   ├── manifest.json                           # Progressive Web App (PWA) manifest
│   ├── sw.js                                   # Offline Service Worker & cache strategy
│   ├── assets/                                 # 23 vector icons & branded graphics
│   ├── css/                                    # 14 decoupled modular CSS stylesheets
│   ├── pages/                                  # 8 semantic operational HTML views
│   └── js/                                     # Runtime engines, API client, & SRP controllers
│
├── run-app.bat                                 # Windows desktop launcher script
├── vercel.json                                 # Vercel serverless deployment routing
└── README.md                                   # Master documentation portal
```

---

## 🔒 Git Version Control Guidelines
- All feature additions, refactoring, and audits are verified and tested locally before committing.
- Commit messages follow the Conventional Commits specification (`feat:`, `fix:`, `docs:`, `refactor:`).
- Pushes to remote repositories require explicit supervisor approval.
