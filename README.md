# (ADCO) شركة الإسكندرية للكيماويات والمنظفات — Field Operations Platform

> **Enterprise Field Marketing, Merchandising & Evaluation PWA**  
> **Architecture:** Modular Vanilla JS (`≤ 350` lines/file) + Compiled CSS (`app.min.css`) + Offline-First Service Worker  
> **Timezone:** `Africa/Cairo` (UTC+2)

---

## Quick Start

### 1. Local Development
- **Instant Browser Launch (Windows):** Double-click [`run-app.bat`](./run-app.bat) or open [`frontend/index.html`](./frontend/index.html) directly.
- **Local HTTP Server:**
  ```bash
  npx serve frontend -p 3000
  ```
- **Build & Verify:**
  ```bash
  node scripts/build-css.js
  node scripts/verify_workspace_paths.js
  node scripts/test_e2e_verification.js
  ```

### 2. Vercel Deployment & Testing
- Production static routing, SPA fallback rewrites, `sw.js` no-cache headers, and immutable asset caching are configured in [`vercel.json`](./vercel.json).
- Non-production directories (`backend/`, `doc/`, `scripts/`, `src/`, `trash/`) are excluded from deployment bundles via [`.vercelignore`](./.vercelignore).
- Preview locally with `npx vercel dev` or deploy via `npx vercel`.

### 3. Backend Integration Entry Points
- HTTP client & auth headers: [`frontend/js/api/client.js`](./frontend/js/api/client.js) & [`frontend/js/api/http-client.js`](./frontend/js/api/http-client.js)
- Endpoint contracts: [`frontend/js/api/endpoints.js`](./frontend/js/api/endpoints.js)
- Domain orchestration: [`frontend/js/services/`](./frontend/js/services/)

---

## Documentation Index

All engineering documentation is organized into **`doc/frontend/`** and **`doc/backend/`**:

### Frontend Documentation ([`doc/frontend/`](./doc/frontend/))
| Document | Description |
|:---|:---|
| [Architecture](./doc/frontend/architecture.md) | SPA routing, `≤ 350`-line file cap, modular layers, state store & Vercel deployment |
| [UI/UX Design Guide](./doc/frontend/ui-ux-guide.md) | ADCO light-mode design tokens, Lucide icons, `.avif` media pipeline & CSS build |
| [File Structure](./doc/frontend/file-structure.md) | Complete `frontend/` directory tree, CSS cascade & module inventory |
| [Frontend Guardrails](./doc/frontend/guardrails.md) | Coding rules, cache busting, zero-emoji policy & regression prevention |
| [Frontend Audit Result](./doc/frontend/audit-result.md) | Runtime page, state, and component audit reference |

### Backend Documentation ([`doc/backend/`](./doc/backend/))
| Document | Description |
|:---|:---|
| [Backend Architecture](./doc/backend/architecture.md) | Cognito/JWT auth, Lambda/SQS workers, DB store, Google Sheets & Power BI sync |
| [API Contracts](./doc/backend/api-contracts.md) | RESTful API v1 endpoints, headers, RBAC scoping & DTO schemas |
| [File Structure](./doc/backend/file-structure.md) | `backend/` directory tree & target server module blueprint |
| [Backend Guardrails](./doc/backend/guardrails.md) | Security, server-side RBAC, idempotency, GPS/hash validation & deployment rules |
| [Evaluation & Scoring](./doc/backend/evaluation.md) | 100-point 4-pillar scoring matrix & Bayesian leaderboard algorithm |
| [Final System Design](./doc/backend/system-design.md) | Complete v3.0 system specification & relational database schema |
| [System Diagrams](./doc/backend/system-diagrams.md) | Mermaid context, ERD, state machine & sequence diagrams |
