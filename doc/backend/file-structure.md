# ADCO Field Operations Platform — Backend File Structure & Inventory

> **Status:** Specification & Integration Contracts Ready  
> **Scope:** `backend/` workspace directory and `doc/backend/` engineering documentation

---

## 1. Current Repository Layout

```text
adco-field-app/
├── backend/                          # Backend workspace root (excluded from Vercel static bundle via .vercelignore)
├── doc/
│   └── backend/
│       ├── api-contracts.md          # RESTful API v1 endpoints, headers, DTOs, and error schemas
│       ├── architecture.md           # Cloud, AWS Cognito/Lambda/SQS/DB, Sheets & Power BI sync architecture
│       ├── evaluation.md             # 100-point scoring matrix, anti-cheat rules, and Bayesian ranking spec
│       ├── file-structure.md         # This backend file structure and module inventory
│       ├── guardrails.md             # Backend security, validation, idempotency, and deployment rules
│       ├── system-design.md          # Full v3.0 system specification & relational database schema
│       └── system-diagrams.md        # Mermaid context, ERD, state machine, and sequence diagrams
└── frontend/
    └── js/
        └── api/                      # Frontend HTTP client & endpoint contract seams
            ├── client.js
            ├── endpoints.js
            └── http-client.js
```

---

## 2. Target Backend Service Module Layout (Implementation Blueprint)

When implementing the Node.js / TypeScript backend service inside `backend/`, follow the strict single-responsibility module layout (max **350 lines per `.js`/`.ts` file**):

```text
backend/
├── src/
│   ├── config/                       # Env config, Africa/Cairo timezone, DB & S3 clients
│   ├── middleware/                   # JWT auth guard, RBAC tier enforcement, idempotency, rate limiting
│   ├── modules/
│   │   ├── auth/                     # Login, OTP signup wizard, password reset, token refresh
│   │   ├── activities/               # Activity creation, follow-up rounds, closure requests, direct close
│   │   ├── evaluations/              # Server-side 100-point scoring, anti-cheat, Bayesian leaderboard
│   │   ├── branches/                 # Client chains, branches, supplying sector mapping, GPS coords
│   │   ├── media/                    # Signed S3 upload URLs, SHA-256 deduplication, EXIF validation
│   │   └── exports/                  # 1/N multi-brand Google Sheets & Power BI sync jobs
│   └── utils/                        # Haversine distance, Cairo date helpers, validation schemas
└── tests/                            # Unit & integration tests per module
```

---

## 3. Related Links

- [Backend Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Frontend File Structure](../frontend/file-structure.md)

