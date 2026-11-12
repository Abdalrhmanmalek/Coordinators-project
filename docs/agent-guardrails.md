# ADCO Platform — Agent Guardrails & Operating Rules

> **Status:** Mandatory Strict Compliance for All AI Development Agents  
> **Target:** Prevent Code Destruction, Architectural Drift, and Unauthorized Assumptions  
> **Document Version:** 1.1.0  
> **Enforcement Level:** **ZERO-TOLERANCE**

---

## 🛑 1. The Golden Rule (Read Before Acting)
* **Never guess or invent architectural patterns.** Before modifying any component, page, or service, the AI agent **MUST** read and adhere strictly to:
  1. [`docs/system-architecture.md`](./system-architecture.md) (for RBAC, data flows, and module contracts).
  2. [`docs/evaluation.md`](./evaluation.md) (for the 100-point scoring engine and Bayesian formulas).
  3. [`docs/file-structure.md`](./file-structure.md) (for authorized directory paths and file responsibilities).

---

## 📁 2. Architectural & Modular Constraints
* **Modular Isolation:** Never bloat core files (e.g., `frontend/js/activity-manager.js` must remain a lean facade under 150 lines). All new business logic must reside in `frontend/js/services/`, state in `frontend/js/store/`, pure math/helpers in `frontend/js/utils/`, reusable UI in `frontend/js/components/`, and standalone views in `frontend/js/pages/`.
* **Zero Emojis Policy:** Unicode emojis (📸, 🏆, ⭐, 📍, 📝, 🚀, ⏳, ✅, ❌, etc.) are **strictly forbidden** across all HTML templates, JS files, and CSS. Use clean vector SVG icons from `frontend/assets/icons/` or inline SVGs.
* **Brand Share Isolation:** The `1/N` brand share calculations (`brand-share.util.js`) must be stored in the database payload and shown **ONLY** to the Marketing Manager during evaluation (`supervisor.page.js`), never on external coordinator cards or views.
* **Supplying Branch Privacy:** The supplying branch (`فرع الشركة المورد للبضاعة`) must remain strictly inside internal detail views (`activity-details.html`, `branch-details.html`, and supervisor modal). Never display it on outer summary cards (`master-branch-card.js`, `activity-card-item.js`).

---

## 🔒 3. Safety & Git Restrictions
* **No Unauthorized Pushes:** AI agents are strictly forbidden from running `git push` unless explicitly commanded by the user with direct approval. All changes must remain local and tested first.
* **Zero Regressions:** Every refactoring or bug fix must preserve existing Light Mode soft teal styling (`#0f766e`), sticky top navbar layouts, smooth `navigateTo` transitions, and `scrollbar-gutter: stable`.
* **Offline & Protocol Compatibility:** The application must run without Node/bundler overhead via local `file://` (`run-app.bat`). Scripts must avoid naked ES module `import`/`export` and use universal IIFE / UMD closures.

---

## 📊 4. Core Mathematical Specifications

### 100-Point Evaluation Matrix (Locked Schema)
$$\text{Total Score} = S_{\text{new}} \ (40) + S_{\text{quality}} \ (20) + S_{\text{continuity}} \ (25) + S_{\text{docs}} \ (15) = 100\text{ pts}$$

| Pillar | Arabic Name | Max Points | DOM Field ID |
|:---|:---|:---:|:---|
| **Pillar 1: Approved New Activity Value** | الأنشطة الجديدة المعتمدة | **40 pts** | `#eval-score-new-act` |
| **Pillar 2: Execution Quality** | جودة التنفيذ والعرض | **20 pts** | `#eval-score-quality` |
| **Pillar 3: Verified Continuity** | مدة الاستمرارية المثبتة | **25 pts** | `#eval-score-continuity` |
| **Pillar 4: Documentation & Data Integrity** | الالتزام بالتوثيق وصحة البيانات | **15 pts** | `#eval-score-docs` |

### Multi-Brand $1/N$ Weighting
$$\text{Brand Share} = \frac{1}{N}, \quad \sum_{i=1}^{N} \text{Share}_i = 1.00 \ (100\%)$$

### GPS & Location Verification
* Maximum allowable distance discrepancy: **$150\text{ meters}$** (computed via Haversine formula in `geo.js` / `gps-proximity.util.js`).
* EXIF timestamps and device submissions validated against Cairo Standard Time (`Africa/Cairo`, UTC+2).

---

## ✅ 5. Pre-Commit Verification Checklist

Before reporting completion to the user, every agent must execute:
1. `node scratch/audit_workspace.js`: Verify 0 broken `<script>` / `<link>` paths across all 12 HTML pages.
2. `node -c <file>`: Verify 0 syntax errors on all modified JavaScript files.
3. Verify zero Unicode emojis across all modified files.
4. Keep all changes committed **strictly locally** (`git commit`) with **ZERO unauthorized pushes** (`git push` forbidden).
