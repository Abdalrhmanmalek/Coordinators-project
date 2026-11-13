# ADCO Field Operations Platform — Backend Guardrails & Security Rules

> **Enforcement Level:** Mandatory for all backend services, API contracts, and integration code  
> **Timezone Standard:** `Africa/Cairo` (UTC+2)

---

## 1. Security & Access Control

1. **Server-Side RBAC Enforcement:** Never trust client-supplied `role`, `branch`, or `totalScore` fields. Derive user identity and branch/client scope strictly from the verified JWT (`Authorization: Bearer <token>`).
2. **3-Tier Scoping:**
   - `coordinator`: Read/write only activities matching their assigned `client` + `branch`.
   - `coordinator_supervisor`: Read/write across all branches of their assigned `client`.
   - `marketing_manager`: Full administrative, evaluation, direct-close, and export privileges.
3. **Supplying Branch & Brand Share Privacy:** Internal `supplyingBranch` and $1/N$ brand share analytics must only be exposed to authorized supervisor/manager endpoints and internal detail payloads.

---

## 2. Data Integrity, Validation & Idempotency

1. **Idempotency Required:** Every `POST`, `PUT`, and `PATCH` endpoint must require and deduplicate by `Idempotency-Key` (UUIDv4) so offline PWA retries never create duplicate activities or follow-up rounds.
2. **Server-Computed Scores:** Evaluation endpoints accept only the four pillar inputs (`newActivity` 0–40, `executionQuality` 0–20, `continuity` 0–25, `documentation` 0–15). The server computes the capped 100-point total and Bayesian leaderboard rank (see [evaluation.md](./evaluation.md)).
3. **GPS & Media Deduplication:**
   - Enforce Haversine proximity ($\le 150\text{ m}$ threshold) against branch coordinates.
   - Reject duplicate `photoHash` (SHA-256) submissions across activities/rounds.
4. **Date & Timezone Validation:** Validate `magazineEndDate >= magazineStartDate` and normalize all timestamps to `Africa/Cairo` (`UTC+2`).

---

## 3. Code Quality & Deployment Rules

1. **350-Line Hard Cap:** No `.js` (or `.ts`) file in `backend/` may exceed **350 lines**. Split controllers, validators, services, and repositories into focused single-responsibility modules.
2. **Vercel Exclusion:** `backend/` and `doc/` are excluded from Vercel static frontend deployments via [`.vercelignore`](../../.vercelignore).
3. **No Unauthorized `git push`:** Keep changes local and verified until explicitly approved.

---

## 4. Related Documentation

- [Backend Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Frontend Guardrails](../frontend/guardrails.md)

