# ADCO Frontend Audit Result

> **Audit Date:** 2026-11-13  
> **Source Base:** `frontend/js/`, `frontend/pages/`, `frontend/css/`, `frontend/manifest.json`, `frontend/sw.js`  
> **Audit Standard:** Direct inspection of runtime code only (excluding outdated `README.md` and `docs/`).

---

## 1. Pages and navigation

### 1. List every HTML page in `frontend/pages/` (or equivalent) and what each one shows.

The application contains 1 root page and 11 subpages in `frontend/pages/`:

1. **`frontend/index.html`** (`<title>(ADCO) شركة الاسكندريه للكيماويات و المنظفات</title>`):
   The public landing portal displaying company identity, 3-tier platform overview, fast-login gateway buttons, and session auto-resume.
2. **`frontend/pages/login.html`** (`<title>تسجيل الدخول | شركة أدكو ADCO</title>`):
   Authentication portal with Employee ID and Password inputs, password reset modal, and 3-Tier quick-fill demo switcher buttons (`ADCO-101`, `ADCO-501`, `ADCO-901`).
3. **`frontend/pages/signup-wizard.html`** (`<title>تفعيل حساب موظف جديد | شركة أدكو ADCO</title>`):
   A 3-step employee onboarding wizard: Step 1 (Employee ID & Full Name validation), Step 2 (Mobile/Email verification with 4-digit OTP), Step 3 (Strict password policy creation).
4. **`frontend/pages/dashboard.html`** (`<title>لوحة المنسق الميداني | ADCO Field Portal</title>`):
   Operational feed for coordinators and supervisors: KPI metric cards (Total, Accepted, Under Review), dedicated chain/branch filter toolbar, Master Branch Cards (`master-branch-card.js`), and branch-scoped activity cards (`activity-card-item.js`).
5. **`frontend/pages/activity-card.html`** (`<title>بطاقة النشاط والمتابعة بالصور | ADCO Field Portal</title>`):
   Activity creation and follow-up upload interface. Features client/branch comboboxes, auto-resolved supplying branch, activity and display type selectors, conditional magazine date range, 4-level cascading product picker modal, and sticky live camera dropzone with client-side 720p compression and GPS extraction.
6. **`frontend/pages/activity-details.html`** (`<title>تفاصيل النشاط وسجل المراجعات | شركة أدكو ADCO</title>`):
   Dedicated standalone activity view displaying full activity metadata, supplying branch sector, GPS coordinates, chronological review & follow-up timeline with 4-criteria scorecards ($40/20/25/15$), marketing manager guidance notes, full-screen image inspection modal, and inline follow-up round submission.
7. **`frontend/pages/branch-details.html`** (`<title>تفاصيل الفرع وسجل الأنشطة | ADCO Field Portal</title>`):
   Branch-scoped hub showing master branch details, company supplying branch sector, GPS coordinates, associated coordinators and supervisors, status counters, and the complete list of activities executed at this branch.
8. **`frontend/pages/supervisor-panel.html`** (`<title>لوحة الإشراف وتقييم العمليات | ADCO Supervisor</title>`):
   Supervisor and Marketing Manager dashboard for reviewing activities. Features parent chain/branch filters, interactive status counters, expandable custom search panel, activity cards with closure approval/rejection buttons, and an audit/evaluation modal.
9. **`frontend/pages/evaluation.html`** (`<title>فحص وتقييم بطاقة النشاط | ADCO Field Portal</title>`):
   Full-page evaluation workspace for Marketing Managers: high-resolution image inspection, EXIF camera metadata, GPS proximity verification, interactive 100-point scoring sliders/inputs across 4 pillars ($40/20/25/15$), editable activity date/time, administrative decision dropdown (`Accepted`, `Rejected`, `Under Review`), and supervisor feedback notes.
10. **`frontend/pages/leaderboard.html`** (`<title>لوحة شرف المنسقين والترتيب الميداني | شركة أدكو ADCO</title>`):
    Gamified performance leaderboard displaying segmented time periods (شهرية / أسبوعية / سنوية), top-3 podium cards (with mobile spotlight layout and medal badges), search bar, and ranked coordinator list with score progress bars and position movement trend badges (`+`, `-`, `=`).
11. **`frontend/pages/sheets-view.html`** (`<title>مزامنة Google Sheets وتصدير Excel | ADCO Field Portal</title>`):
    Spreadsheet interface for managers displaying multi-brand activity records, $1/N$ brand shares, and CSV export capabilities (`report-export.service.js`).
12. **`frontend/pages/analytics.html`** (`<title>تحليلات الأداء Power BI | ADCO Field Portal</title>`):
    Executive business intelligence dashboard featuring zero-dependency SVG circular progress rings, cubic-bezier area/wave trend charts, column bar charts, supplying branch performance bars, and display type distribution metrics.

---

### 2. How does navigation between pages work (plain links, a router, a single-page shell)?

The application is structured as a **Multi-Page Application (MPA)** with standalone HTML documents, wrapped by an interceptor in `frontend/js/app.js` (`AppRouter.initSmoothPageTransitions()`):

```javascript
// frontend/js/app.js (lines 45-53, 76-97)
static navigateTo(targetUrl) {
  if (!targetUrl) return;
  if (document.body) {
    document.body.classList.add('page-is-leaving');
  }
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 90);
}
```

- Standard HTML anchor tags (`<a href="...">`) are intercepted on click, triggering a 90ms CSS fade-out transition (`.page-is-leaving`) before invoking `window.location.href = targetUrl`.
- Buttons and programmatic transitions use `window.location.href = './page-name.html'` directly.
- The top header navigation is dynamically injected into `<div id="app-header-mount"></div>` on each page load via `AppRouter.renderTopNavbar()` in `frontend/js/app.js` or `frontend/js/components/navbar.js`.

---

### 3. Which pages are role-specific (coordinator only, supervisor only, manager only), and how is that enforced in the frontend today?

#### Role Allocation:
- **Coordinator (`coordinator`):**
  - Access to: `dashboard.html`, `activity-card.html`, `activity-details.html`, `branch-details.html`, `leaderboard.html`.
  - Navbar links: الرئيسية (`dashboard.html`), نشاط جديد (`activity-card.html`), المتصدرين (`leaderboard.html`).
- **Coordinator Supervisor (`coordinator_supervisor`):**
  - Same operational pages as Coordinator, but with chain-wide branch filtering on `dashboard.html` and competing at Rank #2 on `leaderboard.html`.
- **Marketing Manager / Supervisor (`marketing_manager`, `coordination_manager`, `supervisor`):**
  - Exclusively granted: `supervisor-panel.html`, `evaluation.html`, `sheets-view.html`, `analytics.html`.
  - Navbar links: الإشراف (`supervisor-panel.html`), الشيتات (`sheets-view.html`), التحليلات (`analytics.html`), الأنشطة (`dashboard.html`), المتصدرين (`leaderboard.html`).

#### Enforcement Mechanism:
Enforced on page load via `AuthManager.checkAuthGuard(requiredRole)`:

```javascript
// frontend/js/services/auth.service.js (lines 142-150)
static checkAuthGuard(requiredRole = null) {
  const user = this.getCurrentUser();
  if (!user) {
    const isSub = window.location.pathname.includes('/pages/');
    window.location.href = isSub ? './login.html' : './pages/login.html';
    return null;
  }
  return user;
}
```

In `frontend/js/pages/supervisor.page.js`, `frontend/js/pages/analytics.page.js`, and `frontend/js/pages/sheets.page.js`:
```javascript
// Example from frontend/js/pages/analytics.page.js line 10
AuthManager.checkAuthGuard('supervisor');
```
If no session exists, the user is redirected immediately to `./login.html`. In the top navbar (`frontend/js/components/navbar.js`), navigation links are conditionally rendered based on `user.role`:
```javascript
// frontend/js/components/navbar.js (lines 43-45)
const isManager = user && (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor');
const navLinks = isManager ? managerLinks : coordinatorLinks;
```

---

## 2. Current authentication

### 4. Show the actual login form fields and their `name` or `id` attributes.

From `frontend/pages/login.html` (lines 35-57):

```html
<form id="login-form">
  <div class="form-group lg-s8">
    <label class="form-label lg-s9" for="employeeId">الرقم الوظيفي (Employee ID)</label>
    <input
      type="text"
      id="employeeId"
      class="form-input lg-s10"
      placeholder="مثال: ADCO-101 أو ADCO-901"
      required
      dir="ltr"
    />
  </div>

  <div class="form-group lg-s8">
    <label class="form-label lg-s9" for="password">كلمة المرور</label>
    <input
      type="password"
      id="password"
      class="form-input lg-s11"
      placeholder="••••••••"
      required
    />
  </div>

  <button type="submit" class="btn btn-primary lg-s15" id="login-submit-btn">
    <span>تسجيل الدخول</span>
  </button>
</form>
```

- Field 1: `id="employeeId"` (type: `text`, required)
- Field 2: `id="password"` (type: `password`, required)
- Form: `id="login-form"`
- Submit Button: `id="login-submit-btn"`

---

### 5. Show the exact request the login form sends today (URL, method, body shape). Is it calling a real API, or using mock/local data?

From `frontend/js/services/auth.service.js` (lines 76-92):

```javascript
// Endpoint: '/auth/login' (Base URL: 'http://localhost:3000/api/v1' or '/api/v1')
// Method: POST
// Body Shape:
{
  employeeId: cleanId, // e.g. "ADCO-101"
  password: cleanPass  // e.g. "Pass@1234"
}
```

Code in `frontend/js/services/auth.service.js`:
```javascript
try {
  const resp = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    employeeId: cleanId,
    password: cleanPass
  });
  if (resp && resp.user) {
    apiClient.setTokens(resp.accessToken, resp.refreshToken);
    this.setCurrentUser(resp.user, remember);
    return resp.user;
  }
} catch (apiErr) {
  // If server is unreachable or offline, fall back to local registry validation
  console.warn('Backend login unavailable, falling back to local registry:', apiErr.message);
}
```

**Reality:** It tries to call the backend endpoint, but catches any network failure and falls back to validating credentials against the hardcoded in-browser employee registry in `frontend/js/store/employee-registry.seed.js` (`DEFAULT_REGISTRY`). In production without a live backend, it operates 100% on local/mock data.

---

### 6. Where is the session or token stored after login (`localStorage`, cookie, memory)? Show the code that reads and writes it.

Tokens and user sessions are stored in **`localStorage`** (with a `sessionStorage` fallback when "remember me" is false):

1. **User Session Object:**
   Stored under `localStorage` key `'ADCO_SESSION'`:
   ```javascript
   // frontend/js/services/auth.service.js (lines 53-69)
   static getCurrentUser() {
     const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
     if (!stored) return null;
     try { return JSON.parse(stored); } catch { return null; }
   }

   static setCurrentUser(user, remember = true) {
     const data = JSON.stringify(user);
     if (remember) {
       localStorage.setItem(STORAGE_KEYS.CURRENT_USER, data);
       sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
     } else {
       sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, data);
       localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
     }
   }
   ```

2. **JWT Tokens:**
   Stored under `localStorage` keys `'ADCO_AUTH_TOKEN'` and `'ADCO_REFRESH_TOKEN'`:
   ```javascript
   // frontend/js/api/http-client.js (lines 52-64)
   getAuthToken() {
     return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
   }

   getRefreshToken() {
     return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
   }

   setTokens(accessToken, refreshToken) {
     if (accessToken) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
     if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
   }
   ```

---

### 7. Is there a signup or registration page? If so, show its exact fields.

Yes, `frontend/pages/signup-wizard.html` implements an employee onboarding/account activation wizard with the following exact fields across 3 steps:

- **Step 1 (Verify Employee Identity):**
  - `<input type="text" id="wiz-fullname" class="form-input" placeholder="مثال: أحمد محمود العبد" required />`
  - `<input type="text" id="wiz-empid" class="form-input" placeholder="مثال: ADCO-101" required />`
- **Step 2 (Contact & 4-Digit OTP):**
  - `<input type="text" id="wiz-contact" class="form-input" placeholder="01012345678" required />`
  - `<button type="button" id="dispatch-otp-btn">إرسال OTP</button>`
  - `<input type="text" id="wiz-otp" class="form-input" maxlength="4" placeholder="5 8 2 1" required />`
- **Step 3 (Password Creation):**
  - `<input type="password" id="wiz-pass" class="form-input" required />`
  - `<input type="password" id="wiz-pass-confirm" class="form-input" required />`

---

### 8. How does the frontend decide which role's dashboard to show after login?

In `frontend/js/pages/login.page.js` (lines 48-55):

```javascript
const session = await Auth.login(empId, pass);
const user = session.user || session;
toast(`مرحباً بك ${user.fullName}`, 'success');
setTimeout(() => {
  if (user.role === 'marketing_manager' || user.role === 'coordination_manager' || user.role === 'supervisor') {
    window.location.href = './supervisor-panel.html';
  } else {
    window.location.href = './dashboard.html';
  }
}, 350);
```

Coordinators (`coordinator`) and Coordinator Supervisors (`coordinator_supervisor`) are routed to `./dashboard.html`.  
Marketing Managers and Supervisors (`marketing_manager`, `coordination_manager`, `supervisor`) are routed to `./supervisor-panel.html`.

---

## 3. API calls already written

### 9. List every place in the code that calls `fetch`, `axios`, or similar. For each one, give: the file, the URL or endpoint path, the HTTP method, and the request body shape (field names).

All low-level `fetch` calls are strictly encapsulated in `frontend/js/api/http-client.js`. Higher-level domain services invoke `apiClient.get/post/put/patch`:

| Calling File | Method | URL / Endpoint Path | Request Body Shape (Fields) |
|:---|:---:|:---|:---|
| `frontend/js/api/http-client.js` (line 76) | `GET`/`POST`/`PUT`/`PATCH`/`DELETE` | `fetch(url, { method, headers, body, signal })` | Configured dynamically by callers |
| `frontend/js/api/http-client.js` (line 122) | `POST` | `${this.baseURL}/auth/refresh` | `{ refreshToken }` |
| `frontend/js/services/auth.service.js` (line 79) | `POST` | `/auth/login` | `{ employeeId, password }` |
| `frontend/js/services/auth.service.js` (line 117) | `POST` | `/auth/signup` | `{ employeeId, fullName, contact, password }` |
| `frontend/js/services/auth.service.js` (line 128) | `PUT` | `/profile/update-credentials` | `{ email, mobile }` |
| `frontend/js/services/auth.service.js` (line 133) | `PUT` | `/profile/update-password` | `{ oldPassword, newPassword }` |
| `frontend/js/services/activity.service.js` (line 33) | `GET` | `/activities?role=...&branch=...&client=...` | *None (Query Params)* |
| `frontend/js/services/activity.service.js` (line 119) | `POST` | `/activities` | Full activity object: `{ id, coordinatorId, coordinatorName, client, branch, coordinatorBranch, brands, skuVariant, activity, activityType, activityCount, displayType, magazineDate, products, activityDate, photoUrl, photoHash, location, status, followUpHistory }` |
| `frontend/js/services/activity.service.js` (line 136) | `PATCH` | `/activities/:id/update-date` | `{ activityDate }` |
| `frontend/js/services/activity.service.js` (line 152) | `POST` | `/activities/:id/request-end` | `{ requestedBy, requestedById, reasonType, notes, requestedAt }` |
| `frontend/js/services/activity.service.js` (line 173) | `POST` | `/activities/:id/direct-close` | `{ closedBy, closedById, reasonType, notes, closedAt }` |
| `frontend/js/services/activity.service.js` (line 197) | `POST` | `/activities/:id/process-closure` | `{ action: 'approve'\|'reject', reviewedBy, reviewedById, notes, reviewedAt }` |
| `frontend/js/services/activity.service.js` (line 228) | `POST` | `/activities/:id/follow-up` | `{ roundNumber, roundTitle, timestamp, uploadedBy, uploadedById, reviewStatus, photoUrl, photoHash, location, photos }` |
| `frontend/js/services/branch.service.js` (line 72) | `GET` | `/branches/supplying-branch?client=...&branch=...` | *None (Query Params)* |
| `frontend/js/services/evaluation.service.js` (line 15) | `POST` | `/supervisor/evaluations/:id` | `{ status, supervisorScore, supervisorNotes, roundNumber, evaluationBreakdown: { newActivity, executionQuality, continuity, documentation }, reviewedBy, activityDate }` |
| `frontend/js/services/media.service.js` (line 54) | `POST` | `/media/upload` | `FormData` (`'file'`, `'metadata'`) |
| `frontend/js/services/profile.service.js` (line 12) | `PUT` | `/profile/update-credentials` | `{ email, mobile }` |
| `frontend/js/services/profile.service.js` (line 19) | `PUT` | `/profile/update-password` | `{ oldPassword, newPassword }` |

---

### 10. Is there a central API client/config file (e.g. `api.js`, `config.js`) with a base URL? Show it.

Yes, in `frontend/js/api/http-client.js` and `frontend/js/config/endpoints.js`:

```javascript
// frontend/js/api/http-client.js (lines 27-46)
export class HttpClient {
  constructor() {
    const isHttp = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
    const isLocal = isHttp && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    const envApi = typeof window !== 'undefined' && window.ADCO_ENV && window.ADCO_ENV.API_BASE_URL
      ? window.ADCO_ENV.API_BASE_URL
      : null;
    const globalBase = typeof window !== 'undefined'
      ? (window.__ADCO_API_BASE__ || window.ADCO_API_URL)
      : null;

    this.baseURL = globalBase || envApi || (isLocal ? 'http://localhost:3000/api/v1' : '/api/v1');
    this.timeoutMs = 12000;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }
```

---

### 11. Are responses currently real, or are they mocked/hardcoded? Point to where the mock data lives.

Responses are currently **mocked and fallback-driven**:
1. Every domain service wraps its `apiClient` calls in `try { ... } catch (err) { ... fallback ... }`.
2. Mock / Seed Activities Dataset: `frontend/js/store/seed-data.js` (exposes `window.ADCO_SEED_ACTIVITIES`, 6 fully populated supermarket activity records).
3. Mock Employee Registry: `frontend/js/store/employee-registry.seed.js` (exposes `window.ADCO_EMPLOYEE_REGISTRY`, 6 employee records across 3 tiers).
4. Mock Catalogs & Hierarchy: `frontend/js/config/adco-catalogs.config.js` and `frontend/js/config/catalogs.js` (retail chains, client branches, supplying branches, display media, and 4-tier product hierarchy).

---

## 4. Branch cards and activities

### 12. Show the exact form fields for creating a branch card, if that screen exists yet.

**Not implemented.**  
There is no screen or form for creating a branch card. Branches are statically defined in the master catalogs (`adco-catalogs.config.js`) and dynamically aggregated from activity records into Master Branch Cards (`master-branch-card.js`). The page `frontend/pages/branch-details.html` is a view-only details page.

---

### 13. Show the exact form fields for creating an activity: every input name, its type, and whether it's required.

From `frontend/pages/activity-card.html` (lines 52-174) and `frontend/js/pages/activity-card.page.js`:

| Field Label | DOM Element / Component ID | Input Type | Required? |
|:---|:---|:---:|:---:|
| العميل / السلسلة التجارية (Client Name) | `#combo-client` (Combobox input) | `text` / searchable combobox | **Yes** |
| فرع العميل (Client Branch) | `#combo-branch` (Combobox input) | `text` / searchable combobox | **Yes** |
| فرع الشركة المورد للبضاعة | `#combo-coord-branch` | `text` (read-only auto-resolved) | **Yes** |
| النشاط (Activity) | `#combo-activity` | `text` / combobox ('عقد', 'مهرجان', 'فرشة مجلة') | **Yes** |
| نوع النشاط (Activity Type) | `#combo-activity-type` | `text` / combobox ('بوديوم', 'جندولة', 'فلور', 'ستاند') | **Yes** |
| عدد النشاط (Activity Count) | `#activity-count-select` | `<select>` (values 1 to 10) | **Yes** (defaults to 1) |
| تاريخ بداية المجلة (Start Date) | `#f-magazine-start-date` | `<input type="date">` | **Conditional** (required if النشاط = 'فرشة مجلة') |
| تاريخ نهاية المجلة (End Date) | `#f-magazine-end-date` | `<input type="date">` | **Conditional** (required if النشاط = 'فرشة مجلة') |
| قائمة المنتجات والأصناف المشاركة | `#btn-open-product-modal` / `#selected-products-list` | 4-Level Modal Picker (`product-modal.js`) | **Yes** (at least 1 SKU required) |
| صورة العرض الميداني (Live Photo) | `#camera-input` | `<input type="file" accept="image/*" capture="environment">` | **Yes** |

---

### 14. How does the frontend currently handle the product picker (Brand → Main Group → Sub Group → SKU)? Show the field names at each level.

Handled via `frontend/js/components/product-modal.js` using a 4-level cascading `<select>` modal backed by the product tree hierarchy in `adco-catalogs.config.js`:

```html
<!-- frontend/js/components/product-modal.js lines 91-118 -->
<!-- 1. Brand -->
<select id="picker-brand" class="form-select"></select>

<!-- 2. Main Group -->
<select id="picker-main-group" class="form-select"></select>

<!-- 3. Sub Group -->
<select id="picker-sub-group" class="form-select"></select>

<!-- 4. Item / SKU -->
<select id="picker-sku" class="form-select"></select>
```

Field names at each level:
1. `Brand`: `picker-brand` (e.g. `'فلفيتا'`, `'كلوريل'`, `'ماكسيل ماجيك'`, `'جلاسي'`, `'فيبا'`)
2. `Main Group`: `picker-main-group` (e.g. `'منظفات ومطهرات ومعطرات الأقمشة'`)
3. `Sub Group`: `picker-sub-group` (e.g. `'معطر ملابس مركز'`)
4. `SKU`: `picker-sku` (e.g. `'فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر'`)

---

### 15. Does the UI show an activity reference or ID anywhere (like `CIR-00492/ALX-00944/A004`)? What format does it expect or display today?

- The complex format `CIR-00492/ALX-00944/A004` is **not implemented and not used anywhere**.
- The frontend expects and generates IDs in the format: **`ACT-YYYY-NNN`** (or `ACT-YYYY-NNNN`), for example:
  - Seed records: `'ACT-2026-001'`, `'ACT-2026-002'`, `'ACT-2026-003'`.
  - Generated on creation in `activity-submission.service.js`:
    ```javascript
    const activityId = `ACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    ```
- Where it is displayed in UI:
  - Appended to URL query parameters: `activity-details.html?id=ACT-2026-001`.
  - Placed in card DOM data attributes: `data-act-id="${act.id}"`.
  - Stored in hidden evaluation form input: `<input type="hidden" id="eval-hidden-act-id" value="ACT-2026-001" />`.

---

### 16. How are weekly follow-up rounds represented in the UI, if at all?

Follow-up rounds are represented in two locations:

1. **Standalone Timeline (`activity-details.html` / `activity-details.page.js` lines 345-395):**
   Rendered as a vertical chronological card timeline (`.ad-timeline-step`) displaying:
   - Round badge: e.g. `<span class="ad-round-number-badge">جولة 1</span>` or `طلب إنهاء`.
   - Title: `roundTitle` (e.g. `التوثيق التأسيسي (جولة 1)`, `جولة المتابعة رقم 2`).
   - Round photo with click-to-zoom modal (`.ad-round-photo-wrap`).
   - Uploader metadata: `uploadedBy`, `uploadedById`, and `timestamp`.
   - Review Status badge: `reviewStatus` (`مقبول` / `مرفوض` / `قيد المراجعة`).
   - 4-Criteria Scorecard pill breakdown: `newActivity` (/40), `executionQuality` (/20), `continuity` (/25), `documentation` (/15), and `sessionScore` (/100).
   - Supervisor feedback guidance notes (`sessionNotes`, `reviewerName`).

2. **Outer Activity Cards (`activity-card-item.js` lines 16, 40):**
   - Round counter badge: e.g. `(2 متابعات)` or `(1 متابعة)`.
   - Action buttons: "سجل المراجعات" and "إضافة متابعة" linking to `activity-details.html?id=${act.id}&action=new-followup`.

---

### 17. How does the UI currently represent an activity's status (badges, colors, text)? List every status value used in the code.

Rendered via `renderStatusBadge(status)` across `dashboard.page.js`, `supervisor.page.js`, and `activity-card-item.js`:

```javascript
// frontend/js/pages/dashboard.page.js (lines 43-47)
function renderStatusBadge(status) {
  if (status === 'Accepted' || status === 'مقبول') return '<span class="badge badge-success">مقبول</span>';
  if (status === 'Rejected' || status === 'مرفوض') return '<span class="badge badge-danger">مرفوض</span>';
  return '<span class="badge badge-warning">قيد المراجعة</span>';
}
```

#### Complete list of status values used in the code:
1. `'Accepted'` / `'مقبول'` / `'نشط'`: Badge class `.badge-success` (emerald green text/border).
2. `'Rejected'` / `'مرفوض'`: Badge class `.badge-danger` (red text/border).
3. `'Under Review'` / `'قيد المراجعة'`: Badge class `.badge-warning` (amber text/border).
4. `'طلب إنهاء'` / `'طلب إنهاء قيد المراجعة'`: Badge class `.badge-warning` (amber box with clock icon).
5. `'منتهي'`: Badge class `.badge-success` / `.badge-mint` with archive icon (`act.isClosed = true`).

---

## 5. Photos and location

### 18. Show the exact code that accesses the camera or file input for photos.

In `frontend/pages/activity-card.html` (line 142) and wired in `frontend/js/pages/activity-card.page.js` (lines 357-372):

```html
<input
  class="is-hidden"
  type="file"
  id="camera-input"
  accept="image/*"
  capture="environment"
  multiple
  hidden
  style="display: none !important;"
/>
```

```javascript
// frontend/js/pages/activity-card.page.js (lines 357-362)
const cameraInput = document.getElementById('camera-input');
const triggerBtn = document.getElementById('trigger-camera-btn');
const previewBox = document.getElementById('camera-preview-box');

if (triggerBtn && cameraInput) {
  triggerBtn.addEventListener('click', () => cameraInput.click());
}
if (previewBox && cameraInput) {
  previewBox.addEventListener('click', () => cameraInput.click());
}
```

---

### 19. Show the exact code that calls `navigator.geolocation`. What fields does it read (latitude, longitude, accuracy)?

In `frontend/js/services/media.service.js` (lines 13-33) and `frontend/js/pages/activity-card.page.js`:

```javascript
// frontend/js/services/media.service.js
static async requestDeviceLocation() {
  if (!navigator.geolocation) {
    throw new Error('المتصفح أو الهاتف لا يدعم خدمة الـ GPS، ويلزم توفرها لاعتماد الصور.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy || 10),
          timestamp: new Date().toISOString(),
          verified: true
        });
      },
      (err) => {
        let msg = 'تم رفض إذن الوصول للموقع الجغرافي (Access Denied). يلزم تفعيل الـ GPS لتوثيق الصور.';
        if (err.code === 2) msg = 'تعذر تحديد الموقع الحالي للهاتف (Position Unavailable).';
        if (err.code === 3) msg = 'انتهت مهلة استجابة الـ GPS (Timeout).';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
```

Fields read from `pos.coords`:
1. `pos.coords.latitude`
2. `pos.coords.longitude`
3. `pos.coords.accuracy`

---

### 20. Is there any client-side compression, hashing, or EXIF handling already written? Show it.

Yes, fully implemented in `frontend/js/utils/camera-compressor.js`:

1. **Client-Side 720p Canvas Scaling:**
   ```javascript
   // frontend/js/utils/camera-compressor.js (lines 92-120)
   static async compressImage(file, maxDimension = 1280, quality = 0.78, roundLabel = 'ADCO Verified') {
     // Scales down proportional dimensions to max 1280px (720p)
     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');
     ctx.drawImage(img, 0, 0, width, height);
     const dataUrl = canvas.toDataURL('image/jpeg', quality);
     ...
   ```
2. **SHA-256 Byte Hashing:**
   ```javascript
   // frontend/js/utils/camera-compressor.js (lines 66-75)
   static async computeSHA256(buffer) {
     if (global.crypto && global.crypto.subtle) {
       const hashBuffer = await global.crypto.subtle.digest('SHA-256', buffer);
       const hashArray = Array.from(new Uint8Array(hashBuffer));
       return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
     }
     ...
   ```
3. **Pure-JS JPEG EXIF Parser:**
   ```javascript
   // frontend/js/utils/camera-compressor.js (lines 35-50)
   function parseExifFromBuffer(arrayBuffer) {
     // Reads TIFF tags from APP1 (0xFFE1) marker: Make (0x010F), Model (0x0110),
     // Software (0x0131), DateTimeOriginal (0x9003)
   ```

---

### 21. What does the UI currently do when a coordinator is out of range? Show the exact logic and messages.

From `frontend/js/utils/gps-proximity.util.js` (lines 78-118) and `frontend/js/services/activity-submission.service.js` (lines 56-63):

```javascript
// frontend/js/utils/gps-proximity.util.js
const distanceMeters = this.calculateHaversineDistanceMeters(
  branchCoords.latitude,
  branchCoords.longitude,
  deviceLocation.latitude,
  deviceLocation.longitude
);

const threshold = Number(maxAllowedMeters) || 150;
if (distanceMeters > threshold) {
  return {
    isValid: false,
    distanceMeters,
    maxAllowedMeters: threshold,
    branchCoords,
    errorMessage: 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل'
  };
}
```

In `frontend/js/services/activity-submission.service.js`:
```javascript
const proximityCheck = this.validateBranchProximity(payload.branch, locationData, 150);
if (!proximityCheck.isValid) {
  throw new Error(proximityCheck.errorMessage || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل');
}
```

In `frontend/js/pages/activity-card.page.js`:
The error is caught on form submission and surfaced to the coordinator as an error toast:
```javascript
showToast(err.message || 'موقعك الحالي بعيد جداً عن نطاق الفرع المسجل', 'error');
```
The activity creation/submission is blocked.

---

### 22. Where are photos sent today (an API endpoint, a mock array, local storage)?

Photos are stored locally as **Base64 Data URLs inside `localStorage`**:
1. `CameraCompressor.compressImage()` produces a `data:image/jpeg;base64,...` string.
2. The data URL is assigned to `activity.photoUrl` and `activity.followUpHistory[i].photoUrl`.
3. The activity record is serialized into `localStorage` under key `'ADCO_ACTIVITIES_DATA_V4'`.
4. If offline, it is also queued into `localStorage` under `'ADCO_OFFLINE_QUEUE_FALLBACK'` (and IndexedDB `'offline_queue'`).
5. An endpoint `/media/upload` is declared in `MediaService.uploadMedia()` via `apiClient.post(API_ENDPOINTS.MEDIA.UPLOAD, formData)`, but it has a catch-block fallback that returns `fileOrBlob` directly when the server is offline.

---

## 6. Evaluation and scoring

### 23. Show the exact form fields on the evaluation/scoring screen.

From `frontend/pages/evaluation.html` (lines 310-380):

1. `<input type="hidden" id="eval-hidden-act-id" />`
2. `<input type="datetime-local" id="eval-activity-date-input" class="form-input" />` (تعديل تاريخ ووقت النشاط)
3. `<select id="eval-round-select" class="form-select">` (اختيار جولة المتابعة للتقييم)
4. `<input type="number" id="score-new-act" class="eval-score-num-input" min="0" max="40" step="1" value="40" required />` (الأنشطة الجديدة المعتمدة - 40 نقطة)
5. `<input type="number" id="score-quality" class="eval-score-num-input" min="0" max="20" step="1" value="18" required />` (جودة التنفيذ الميداني - 20 نقطة)
6. `<input type="number" id="score-continuity" class="eval-score-num-input" min="0" max="25" step="1" value="25" required />` (مدة الاستمرارية المثبتة - 25 نقطة)
7. `<input type="number" id="score-docs" class="eval-score-num-input" min="0" max="15" step="1" value="15" required />` (الالتزام بالتوثيق وصحة البيانات - 15 نقطة)
8. `<select id="eval-decision-select" class="form-select" required>` (القرار الإداري: `Accepted`, `Rejected`, `Under Review`)
9. `<textarea id="eval-notes-textarea" class="form-textarea" rows="3" placeholder="اكتب ملاحظاتك وتوجيهاتك للمنسق..."></textarea>`

---

### 24. Does the current UI compute a total score on the client, or only submit the parts? Show the calculation if one exists.

The UI **computes the total score on the client in real-time** and updates UI badges, while submitting both the breakdown parts and the computed scores:

```javascript
// frontend/js/pages/evaluation.page.js (lines 495-506)
function updateScoresTotal() {
  const s1 = Math.min(40, Math.max(0, Number(inputNewAct.value) || 0));
  const s2 = Math.min(20, Math.max(0, Number(inputQuality.value) || 0));
  const s3 = Math.min(25, Math.max(0, Number(inputContinuity.value) || 0));
  const s4 = Math.min(15, Math.max(0, Number(inputDocs.value) || 0));
  const total = Math.min(100, Math.round(s1 + s2 + s3 + s4));

  const text = `${total} / 100 نقطة`;
  let badgeClass = 'badge badge-success';
  if (total < 60) badgeClass = 'badge badge-danger';
  else if (total < 80) badgeClass = 'badge badge-warning';

  if (liveTotalBadge) liveTotalBadge.textContent = text;
}
```

On submit (lines 555-566):
```javascript
const breakdown = {
  newActivity: Number(inputNewAct.value) || 0,
  executionQuality: Number(inputQuality.value) || 0,
  continuity: Number(inputContinuity.value) || 0,
  documentation: Number(inputDocs.value) || 0
};
const rawScore = Number(((breakdown.executionQuality / 20) * 10).toFixed(1));
await SupervisorEngine.reviewActivity(act.id, status, rawScore, notes, roundNum, breakdown, user, newActivityDate);
```

---

### 25. Show how the UI currently displays the monthly leaderboard, including every field shown per row.

In `frontend/js/pages/leaderboard.page.js` (lines 254-294), each leaderboard row is rendered as:

```javascript
<div class="ranking-row ${isUser ? 'is-current-user' : ''}">
  <div class="cell-rank">
    <span class="rank-circle">${item.rank}</span>
    ${renderTrendBadge(trend)} <!-- e.g. +1, -2, or - -->
  </div>

  <div class="cell-user">
    <div class="user-info-sm">
      <div class="user-name-sm">
        <strong>${formatTwoWordName(item.name)}</strong>
        ${isUser ? '<span class="you-pill">أنت</span>' : ''}
      </div>
      <span class="user-sub-sm">${item.branch}</span>
    </div>
  </div>

  <div class="cell-stat points-col">
    <div class="cell-points-wrapper">
      <div class="score-pill-row">
        <strong class="score-main-val">${item.totalScore}</strong>
        <span class="score-total-max">/100</span>
      </div>
      <div class="points-progress-track">
        <div class="points-progress-fill" style="width: ${item.totalScore}%;"></div>
      </div>
    </div>
  </div>

  <div class="cell-stat">
    <span>${item.acceptedCount}</span>
  </div>

  <div class="cell-stat">
    <span>${item.submissionsCount}</span>
  </div>

  <div class="cell-stat">
    <span>${item.qualityRate}</span>
  </div>
</div>
```

Every field shown per row:
1. **Rank & Trend:** `item.rank` (#1, #2, #3, ...) + SVG trend badge (`+`, `-`, `=`).
2. **Coordinator Identity:** `item.name` (two-word formatted) + `isUser` badge ("أنت") + `item.branch`.
3. **Total Points:** `item.totalScore` (/100) + visual progress bar fill (`style="width: ${item.totalScore}%"`).
4. **Accepted Activities:** `item.acceptedCount`.
5. **Completed Follow-Up Rounds:** `item.submissionsCount`.
6. **Execution Quality Rate:** `item.qualityRate` (e.g. `92%`).

---

## 7. Dashboards

### 26. For each dashboard (coordinator, supervisor, manager), list every number or metric shown on screen, with its exact label text.

#### A. Coordinator Dashboard (`dashboard.html` lines 50-68):
1. **إجمالي الأنشطة المسجلة:** Number in `#kpi-total` (Total activities count).
2. **الأنشطة المقبولة:** Number in `#kpi-accepted` (Accepted activities count).
3. **بانتظار المراجعة والتقييم:** Number in `#kpi-under-review` (Under-review activities count).
4. **Personal Rank Badge (Navbar):** e.g. `#3` in `.web-user-rank-pill`.

#### B. Coordinator Supervisor Dashboard (`dashboard.html` + toolbar lines 70-98):
1. Same 3 KPI metrics as Coordinator.
2. Branch Count Badge: `كل الفروع` or count in `#sup-branch-count-badge`.
3. Chain-wide activities filtered by assigned retail chain.

#### C. Supervisor / Marketing Manager Panel (`supervisor-panel.html` lines 68-98):
Filter bar counters with exact labels and element IDs:
1. **الكل:** Number in `<span id="sp-cnt-all">`
2. **طلبات إنهاء النشاط:** Number in `<span id="sp-cnt-closure">`
3. **بانتظار التقييم:** Number in `<span id="sp-cnt-review">`
4. **مقبول:** Number in `<span id="sp-cnt-accepted">`
5. **مرفوض:** Number in `<span id="sp-cnt-rejected">`
6. **الأنشطة المنتهية:** Number in `<span id="sp-cnt-closed">`

---

### 27. Are the dashboards currently fed by a real API, mock data, or hardcoded numbers? Show the source.

Dashboards are fed dynamically from **`localStorage` via `ActivityStore.getAllActivities()`**, populated initially from `frontend/js/store/seed-data.js`:

```javascript
// frontend/js/store/activity.store.js (lines 14-23)
static getAllActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
      return SEED_ACTIVITIES;
    }
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) list = SEED_ACTIVITIES;
    return list;
  }
...
```

Numbers on the cards and KPI rows are not hardcoded static text; they are calculated live in memory by filtering the array:
```javascript
// frontend/js/pages/dashboard.page.js (lines 35-37)
document.getElementById('kpi-total').textContent = activities.length;
document.getElementById('kpi-accepted').textContent = activities.filter((a) => a.status === 'Accepted').length;
document.getElementById('kpi-under-review').textContent = activities.filter((a) => a.status === 'Under Review').length;
```

---

### 28. Is there any "+/−" or change indicator on any dashboard today? Show how it's calculated.

Yes, on the **Leaderboard** (`frontend/pages/leaderboard.html` / `frontend/js/pages/leaderboard.page.js` lines 96-118), rank movement trend indicators (`+N`, `-N`, `-`) are calculated by comparing current rank against a fixed previous-period rank table:

```javascript
// frontend/js/pages/leaderboard.page.js (lines 96-107)
function getTrend(empId, currentRank) {
  const previousRanks = {
    'ADCO-101': 3,
    'ADCO-102': 1,
    'ADCO-103': 2,
    'ADCO-104': 5,
    'ADCO-105': 4,
    'ADCO-106': 6
  };
  const prev = previousRanks[empId] || currentRank;
  if (currentRank < prev) return { type: 'up', delta: prev - currentRank };
  if (currentRank > prev) return { type: 'down', delta: currentRank - prev };
  return { type: 'same', delta: 0 };
}
```

Rendering:
- Up: `<span class="rank-trend trend-up">+${trend.delta}</span>` (green)
- Down: `<span class="rank-trend trend-down">-${trend.delta}</span>` (red)
- Same: `<span class="rank-trend trend-same">-</span>` (gray)

On `dashboard.html` and `supervisor-panel.html`, there are no "+/−" change indicators implemented today.

---

## 8. Offline and PWA

### 29. Paste the full current `manifest.json`.

Full contents of `frontend/manifest.json`:

```json
{
  "name": "ADCO Field Operations PWA",
  "short_name": "ADCO Field",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#f0fdf4",
  "theme_color": "#16a34a",
  "orientation": "portrait-primary",
  "dir": "rtl",
  "lang": "ar",
  "icons": [
    {
      "src": "./assets/ADCO-logo.avif",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "./assets/ADCO-logo.avif",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### 30. Paste the full current `sw.js` (or summarize it if very long, but include the cache strategy and any `sync` event handling).

Full contents of `frontend/sw.js` (73 lines):

```javascript
const CACHE_NAME = 'adco-field-cache-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './css/mobile-pwa.css',
  './css/activity-details.css',
  './assets/ADCO-logo.avif',
  './js/config/env.config.js',
  './js/config/adco-catalogs.config.js',
  './js/utils/formatters.js',
  './js/ui-helpers.js',
  './js/utils/camera-compressor.js',
  './js/store/employee-registry.seed.js',
  './js/auth.js',
  './js/store/seed-data.js',
  './js/store/activity.store.js',
  './js/services/branch.service.js',
  './js/utils/gps-proximity.util.js',
  './js/utils/score.util.js',
  './js/utils/brand-share.util.js',
  './js/services/activity-submission.service.js',
  './js/services/activity-lifecycle.service.js',
  './js/activity-manager.js',
  './js/services/report-export.service.js',
  './js/supervisor.js',
  './js/components/master-branch-card.js',
  './js/components/activity-card-item.js',
  './js/app.js',
  './pages/login.html',
  './pages/signup-wizard.html',
  './pages/dashboard.html',
  './pages/activity-card.html',
  './pages/activity-details.html',
  './js/pages/activity-details.page.js',
  './pages/leaderboard.html',
  './pages/supervisor-panel.html',
  './pages/sheets-view.html',
  './pages/analytics.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(e.request, { ignoreSearch: true }).then((cachedRes) => {
          return cachedRes || caches.match('./index.html');
        });
      })
  );
});
```

- **Cache Strategy:** **Network-First with Cache Fallback** on network failure. Successful GET responses are cloned and saved into `adco-field-cache-v7`.
- **Sync Handling:** **Not implemented.** There is **no `sync` event listener** in `sw.js`. Background synchronization is handled entirely in window context via `window.addEventListener('online', ...)` in `app.js` and `offline-queue.js`.

---

### 31. Is there any offline queue code today (IndexedDB, localStorage, or otherwise)? Show it.

Yes, in `frontend/js/utils/offline-queue.js`:
It implements an **IndexedDB object store (`STORE_OFFLINE_QUEUE = 'offline_queue'`) with an automatic `localStorage` fallback (`'ADCO_OFFLINE_QUEUE_FALLBACK'`)**:

```javascript
// frontend/js/utils/offline-queue.js (lines 40-75)
export async function queueOfflineItem(item) {
  const queuedPayload = { ...item, queuedAt: new Date().toISOString() };
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE_QUEUE);
      const req = store.add(queuedPayload);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    // Fallback: localStorage
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]';
    const queue = JSON.parse(raw);
    queue.push(queuedPayload);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    return queue.length;
  }
}
```

When network connectivity is restored (`window.addEventListener('online')`), `ActivitySubmissionService.syncOfflineSubmissions()` flushes the queue:
```javascript
// frontend/js/services/activity-submission.service.js (lines 222-234)
static async syncOfflineSubmissions() {
  if (!navigator.onLine) return 0;
  const pending = await global.getOfflineQueue();
  if (pending.length === 0) return 0;

  const all = this.getAllActivities();
  for (const item of pending) {
    const localId = item.id;
    delete item.queuedAt;
    all.unshift(item);
    await global.removeOfflineItem(localId);
  }
  this.saveAllActivities(all);
  return pending.length;
}
```

---

### 32. Does the app currently install as a home-screen shortcut? Has this been tested on both Android and iPhone?

- **Manifest/Service Worker status:** `manifest.json` has `display: "standalone"`, `start_url: "./index.html"`, and icons, which qualifies for native browser install prompts in Chromium and Webclip creation in Safari.
- **Custom install UI:** There is **no custom `beforeinstallprompt` listener** or in-app "Install App" button in the JavaScript code today.
- **Physical Device Testing:** **Not tested.** The platform has been developed and validated locally in desktop browser viewports and responsive mobile emulators; it has **not been tested on physical Android or iOS hardware** for home-screen shortcut installation.

---

## 9. Design and shared components

### 33. List the CSS custom properties (variables) used for colors, spacing, and fonts, with their values.

From `frontend/css/variables.css`:

```css
:root {
  /* Soft Teal & Muted Forest Green Corporate Palette */
  --adco-green-primary: #0f766e;
  --adco-green-dark: #115e59;
  --adco-green-deep: #134e4a;
  --adco-green-mint: #f0fdfa;
  --adco-green-soft: #ccfbf1;
  --adco-green-border: #99f6e4;
  --adco-green-vivid: #0d9488;
  --adco-green-main: #0f766e;

  /* Pristine Light Surfaces & Slate Typography */
  --adco-white: #ffffff;
  --adco-gray-50: #f8fafc;
  --adco-gray-100: #f1f5f9;
  --adco-gray-200: #e2e8f0;
  --adco-gray-300: #cbd5e1;
  --adco-gray-400: #94a3b8;
  --adco-gray-500: #64748b;
  --adco-gray-600: #475569;
  --adco-gray-700: #334155;
  --adco-gray-800: #1e293b;

  /* Semantic Status Tokens */
  --adco-danger: #ef4444;
  --adco-danger-soft: #fee2e2;
  --adco-warning: #f59e0b;
  --adco-warning-soft: #fef3c7;

  /* Typography & Rounded Geometry (16px Card Radius) */
  --font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Cairo', Roboto, sans-serif;
  --radius-xs: 8px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* Soft Floating Elevation Shadows */
  --shadow-sm: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -4px rgba(0, 0, 0, 0.025);
  --shadow-md: 0 14px 30px -5px rgba(15, 118, 110, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 20px 38px -8px rgba(15, 23, 42, 0.1), 0 8px 16px -6px rgba(0, 0, 0, 0.04);
  --header-height: 68px;
  --transition-fast: all 0.2s ease;

  /* Standard Responsive Breakpoints */
  --bp-xs: 480px;
  --bp-sm: 768px;
  --bp-md: 1024px;
  --bp-lg: 1280px;
  --bp-xl: 1536px;
}
```

---

### 34. Is there a shared component library or are pages built independently? Show an example of a reused component (e.g. a card, a button, a modal).

The architecture uses a **shared component library located in `frontend/js/components/` and `frontend/css/components.css`**:

Reused components:
1. `MasterBranchCard` (`frontend/js/components/master-branch-card.js`): Reused in `dashboard.page.js`, `supervisor.page.js`, and `branch-details.page.js`.
2. `ActivityCardItem` (`frontend/js/components/activity-card-item.js`): Reused in `dashboard.page.js` and `branch-details.page.js`.
3. `ProductModalComponent` (`frontend/js/components/product-modal.js`): 4-level cascading product picker.
4. `Navbar` (`frontend/js/components/navbar.js` / `app.js`): Global sticky top navbar.
5. `ProfileModal` (`frontend/js/components/profile-modal.js`): Role switcher and user profile modal.
6. `Toast` (`frontend/js/components/toast.js`): Unified notification toast system.

**Example snippet (`MasterBranchCard.render` in `frontend/js/components/master-branch-card.js`):**
```javascript
// frontend/js/components/master-branch-card.js (lines 14-38)
function render(bg, ctx = {}) {
  const isSelected = (ctx.selectedBranchKey || null) === bg.branch;
  const rawCoords = Array.from(bg.coordinators || []).join(' ، ') || ctx.fallbackCoordinatorName || 'أحمد محمود العبد';
  const coordNames = typeof formatTwoWordName === 'function' ? formatTwoWordName(rawCoords) : rawCoords;
  const branchUrl = `./branch-details.html?branch=${encodeURIComponent(bg.branch)}&client=${encodeURIComponent(bg.client)}`;

  return `
    <div class="card master-branch-card ${isSelected ? 'is-selected' : ''}" data-branch="${bg.branch}">
      <div class="branch-card-header">
        <h4 class="branch-card-title">${bg.client}</h4>
        <span class="badge badge-mint">${bg.total} نشط</span>
      </div>
      ...
    </div>`;
}
```

---

### 35. What icon set or image assets are used, and where are they stored?

- **Vector SVG Icons:** Sourced from **Lucide Icons**, stored locally as standalone SVG files in:
  `frontend/assets/icons/`
  Files: `archive.svg`, `arrow-left.svg`, `award.svg`, `bar-chart-3.svg`, `calendar-clock.svg`, `camera.svg`, `check-circle-2.svg`, `circle-check-big.svg`, `circle-x.svg`, `clipboard-edit.svg`, `clipboard-pen.svg`, `clock.svg`, `file-spreadsheet.svg`, `house.svg`, `layout-dashboard.svg`, `list.svg`, `log-in.svg`, `log-out.svg`, `map-pin.svg`, `plus-circle.svg`, `refresh-cw.svg`, `search.svg`, `shield-check.svg`, `sliders.svg`, `star.svg`, `table-2.svg`, `trash-2.svg`, `trophy.svg`, `x-circle.svg`, etc.
- **Images & Avatars:** Stored in:
  `frontend/assets/images/`
  Files: `ADCO-logo.avif`, `avatar-coordinator.svg`, `avatar-supervisor.svg`, `fathalla-branch.svg`, `medal-gold.svg`, `medal-silver.svg`, `medal-bronze.svg`, `auth-hero-bg.svg`, `auth-hero-bg.avif`.

---

### 36. Is the UI RTL (right-to-left) for Arabic? Is English also supported? Show how language switching works, if it exists.

- **RTL Support:** **100% Arabic Right-to-Left (RTL)**. Every single HTML file hardcodes `<html lang="ar" dir="rtl">` at the root.
- **English Support:** **Not implemented.**
- **Language Switching:** **Not implemented.** There is no i18n library, language switcher button, or translation dictionary in the code. All strings are hardcoded Arabic strings.

---

## 10. State and data shapes

### 37. Show the exact shape (fields and types) of the main data objects the frontend works with today: a branch, an activity, an employee, a photo/upload. Use real object literals or TypeScript interfaces from the code, not a description.

#### A. Activity Object Literal (from `frontend/js/store/seed-data.js` lines 10-60):
```javascript
{
  id: "ACT-2026-001",
  coordinatorId: "ADCO-101",
  coordinatorName: "أحمد محمود العبد",
  client: "فتح الله جملة ماركت (Fathalla)",
  branch: "فرع سموحة - الإسكندرية",
  coordinatorBranch: "الإسكندرية - قطاع وسط",
  brands: ["فلفيتا", "فييا"],
  products: [
    { brand: "فلفيتا", skuItem: "فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر" },
    { brand: "فييا", skuItem: "فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر" }
  ],
  skuVariant: "فلفيتا معطر أقمشة مركز نسيم الزهور 1 لتر + فييا سائل غسيل أطباق بالليمون الأخضر 1 لتر",
  activity: "فرشة مجلة",
  activityType: "جندولة",
  activityCount: 3,
  displayType: "فرشة مجلة - جندولة",
  magazineDate: "2026-11-01",
  magazineStartDate: "2026-11-01",
  magazineEndDate: "2026-11-15",
  photoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
  photoHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  location: {
    latitude: 31.2156,
    longitude: 29.9553,
    accuracy: 8,
    address: "فرع سموحة - الإسكندرية",
    capturedAt: "2026-10-30 10:15"
  },
  status: "Accepted", // 'Accepted' | 'Rejected' | 'Under Review'
  supervisorScore: 8.5,
  overallRating: 8.5,
  ratedSessionsCount: 2,
  supervisorNotes: "تنفيذ ممتاز وتواجد بارز على الجندولة وتنسيق عبوات فلفيتا وفييا منظم جداً.",
  reviewerName: "م. هاني شاكر عبد الله",
  reviewedAt: "2026-10-31T16:30:00.000Z",
  timestamp: "2026-10-30T10:15:00.000Z",
  roundsCount: 2,
  totalPhotos: 3,
  isClosed: false,
  closureRequested: false,
  closureReasonType: null,
  closureNotes: null,
  followUpHistory: [
    {
      roundNumber: 1,
      roundTitle: "التوثيق التأسيسي (جولة 1)",
      timestamp: "2026-10-30 10:15",
      uploadedBy: "أحمد محمود العبد",
      uploadedById: "ADCO-101",
      reviewStatus: "Accepted",
      sessionScore: 88,
      scoreBreakdown: {
        newActivity: 36,
        executionQuality: 17,
        continuity: 21,
        documentation: 14
      },
      sessionNotes: "بداية جيدة وتنسيق مرتب للجندولة وتواجد الأصناف.",
      reviewerName: "م. هاني شاكر عبد الله",
      reviewedAt: "2026-10-30T18:00:00.000Z",
      brands: ["فلفيتا", "فييا"],
      products: [
        { brand: "فلفيتا", skuItem: "معطر أقمشة مركز نسيم الزهور 1 لتر" }
      ]
    }
  ]
}
```

#### B. Employee Object Literal (from `frontend/js/store/employee-registry.seed.js` lines 9-22):
```javascript
{
  employeeId: "ADCO-101",
  fullName: "أحمد محمود العبد",
  mobile: "01012345678",
  email: "ahmed.m@adco.com.eg",
  role: "coordinator", // 'coordinator' | 'coordinator_supervisor' | 'marketing_manager'
  rank: "#3",
  score: 88,
  assignedClientName: "فتح الله جملة ماركت (Fathalla)",
  assignedBranchName: "فرع سموحة - الإسكندرية",
  branch: "فرع سموحة - الإسكندرية",
  region: "الإسكندرية",
  passwordHash: "Pass@1234"
}
```

#### C. Branch / BranchGroup Object Literal (from `frontend/js/pages/dashboard.page.js` lines 58-75):
```javascript
{
  client: "فتح الله جملة ماركت (Fathalla)",
  branch: "فرع سموحة - الإسكندرية",
  supplyingBranch: "الإسكندرية - قطاع وسط",
  total: 5,
  accepted: 3,
  underReview: 1,
  rejected: 1,
  pendingClosure: 0,
  closed: 0,
  coordinators: new Set(["أحمد محمود العبد"]),
  supervisors: new Set(["م. هاني شاكر عبد الله"]),
  activityTypes: new Set(["جندولة", "بوديوم"]),
  brands: new Set(["فلفيتا", "فييا"])
}
```

#### D. Photo / Upload Metadata Object Literal (from `frontend/js/utils/camera-compressor.js` lines 125-145):
```javascript
{
  photoUrl: "data:image/jpeg;base64,...",
  photoHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  sizeKb: 168,
  width: 1280,
  height: 720,
  fileName: "upload_2026-11-13.avif",
  originType: "CAMERA_DIRECT", // 'CAMERA_DIRECT' | 'FORWARDED_WHATSAPP' | 'DOWNLOADED_IMAGE'
  originLabel: "التقاط مباشر بكاميرا الهاتف",
  originBadge: "كاميرا مباشرة",
  originBadgeClass: "badge-success",
  exif: {
    hasExif: true,
    make: "Samsung",
    model: "SM-G998B",
    software: "Android 14",
    dateTimeOriginal: "2026-11-13 10:15:00"
  },
  location: {
    latitude: 31.2156,
    longitude: 29.9553,
    accuracy: 8,
    timestamp: "2026-11-13T10:15:00.000Z",
    verified: true
  }
}
```

---

### 38. Is there any global state management (Redux, Zustand, Context, plain globals)? Show how it's structured.

There is **no Redux, Zustand, or Context**. The frontend uses **Plain Globals + LocalStorage Persistence**:

1. **Global Class/Object Singletons:** Modules attach classes directly to `window` (or `global`):
   - `window.ActivityManager`: Lean backward-compatible facade composing modules.
   - `window.AuthManager` / `window.AuthService`: Session management.
   - `window.ActivityStore`: LocalStorage caching & retrieval.
   - `window.ADCO_CATALOGS`: Immutable static dropdown hierarchies.
2. **Modular Facade Aggregator:**
   ```javascript
   // frontend/js/activity-manager.js (lines 36-42)
   const modules = global.ADCO_ACTIVITY_MODULES || [];
   modules.forEach((mod) => {
     Object.getOwnPropertyNames(mod).forEach((key) => {
       if (SKIP.has(key)) return;
       Object.defineProperty(ActivityManager, key, Object.getOwnPropertyDescriptor(mod, key));
     });
   });
   ```
3. **Storage Persistence:**
   Centralized in `localStorage` under defined keys:
   `ADCO_ACTIVITIES_DATA_V4`, `ADCO_SESSION`, `ADCO_EMPLOYEE_REGISTRY`, `ADCO_OFFLINE_QUEUE_FALLBACK`.

---

### 39. List every field name the frontend currently expects to send when creating an activity, and every field name it expects to receive back. This is the most important question in this document: the backend will be built to match these exact names unless there's a strong reason to change them.

From `frontend/js/pages/activity-card.page.js` (lines 405-440), `frontend/js/services/activity-submission.service.js` (lines 20-118), and `frontend/js/services/activity.service.js` (lines 45-125):

#### A. Fields Sent by Frontend (Request Body):

| Field Name | Type | Description |
|:---|:---:|:---|
| `coordinatorId` | `string` | Employee ID of creator (e.g. `"ADCO-101"`) |
| `coordinatorName` | `string` | Full name of creator (e.g. `"أحمد محمود العبد"`) |
| `client` | `string` | Retail client name (e.g. `"فتح الله جملة ماركت (Fathalla)"`) |
| `branch` | `string` | Client branch name (e.g. `"فرع سموحة - الإسكندرية"`) |
| `coordinatorBranch` | `string` | Supplying company branch (e.g. `"الإسكندرية - قطاع وسط"`) |
| `brands` | `string[]` | Array of participating brands (e.g. `["فلفيتا", "فييا"]`) |
| `products` | `object[]` | Array of objects: `[{ brand: string, mainGroup?: string, subGroup?: string, skuItem: string }]` |
| `skuVariant` | `string` | Pipe-delimited SKU names string |
| `activity` | `string` | Activity category (`"عقد"`, `"مهرجان"`, `"فرشة مجلة"`) |
| `activityType` | `string` | Display medium (`"بوديوم"`, `"جندولة"`, `"فلور"`, `"ستاند"`) |
| `activityCount` | `number` | Quantity multiplier (integer `1` to `10`) |
| `magazineStartDate` | `string` (date) | Magazine start date (ISO date string `"YYYY-MM-DD"`) |
| `magazineEndDate` | `string` (date) | Magazine end date (ISO date string `"YYYY-MM-DD"`) |
| `magazineDate` | `string` | Formatted range string (e.g. `"2026-11-01 إلى 2026-11-15"`) |
| `activityDate` | `string` (ISO) | Execution timestamp (e.g. `"2026-11-13T10:15:00.000Z"`) |
| `photoUrl` | `string` | Base64 Data URL or remote URL of the compressed 720p photo |
| `photoHash` | `string` | SHA-256 hex digest of the raw image bytes |
| `initialPhotos` | `object[]` | Array of photo objects: `[{ photoUrl, photoHash, sizeKb, width, height, fileName, originType, exif, location }]` |
| `location` | `object` | Location object: `{ latitude: number, longitude: number, accuracy: number, address: string, capturedAt: string }` |
| `maxBranchProximityMeters` | `number` | Optional cutoff override (default `150`) |

#### B. Fields Expected in Response (Response Body):

The frontend expects back either the created activity object directly or `{ success: true, record: ActivityObject }`:

| Field Name | Type | Description |
|:---|:---:|:---|
| `id` | `string` | Unique activity identifier (e.g. `"ACT-2026-4892"`) |
| `coordinatorId` | `string` | Echoed coordinator ID |
| `coordinatorName` | `string` | Echoed coordinator name |
| `client` | `string` | Echoed client chain |
| `branch` | `string` | Echoed client branch |
| `coordinatorBranch` | `string` | Verified supplying company branch |
| `brands` | `string[]` | Participating brands |
| `products` | `object[]` | Structured product objects |
| `skuVariant` | `string` | SKU variant string |
| `activity` | `string` | Activity category |
| `activityType` | `string` | Display medium |
| `activityCount` | `number` | Count |
| `displayType` | `string` | Combined label (e.g. `"فرشة مجلة - جندولة"`) |
| `magazineDate` | `string` | Magazine date range |
| `magazineStartDate` | `string` | Magazine start date |
| `magazineEndDate` | `string` | Magazine end date |
| `activityDate` | `string` | Activity timestamp |
| `startDate` | `string` | Activity start timestamp |
| `endDate` | `string\|null` | Closure timestamp (initially `null`) |
| `isClosed` | `boolean` | `false` |
| `closureRequested` | `boolean` | `false` |
| `photoUrl` | `string` | Final hosted photo URL |
| `photoHash` | `string` | SHA-256 byte hash |
| `initialPhotos` | `object[]` | Array of initial photos |
| `location` | `object` | Verified location object with `distanceFromBranchMeters` & `proximityVerified: true` |
| `status` | `string` | Initial status (`"Under Review"`) |
| `supervisorScore` | `number\|null` | `null` |
| `overallRating` | `number\|null` | `null` |
| `ratedSessionsCount` | `number` | `0` |
| `supervisorNotes` | `string` | `""` |
| `reviewerName` | `string\|null` | `null` |
| `reviewedAt` | `string\|null` | `null` |
| `timestamp` | `string` | Creation ISO timestamp |
| `roundsCount` | `number` | `1` |
| `totalPhotos` | `number` | Total photo count |
| `followUpHistory` | `object[]` | Initial round array with Round 1 object |

---

## 11. Gaps and known issues

### 40. What features exist in the UI but are not yet connected to any backend logic?

1. **Live Remote Database:** All reads and writes fall back to `localStorage` (`ADCO_ACTIVITIES_DATA_V4`); no PostgreSQL or remote database is connected.
2. **Cloud Media Storage (S3 / Blob):** Photo uploads in `MediaService.uploadMedia()` catch network failures and fallback to in-memory Base64 Data URLs.
3. **SMS / Email OTP Verification Gateway:** `signup.page.js` and `login.page.js` simulate OTP dispatch and validation with local timers and toasts rather than invoking a telecom SMS gateway.
4. **Google Sheets Real-Time Sync:** `sheets.page.js` renders local HTML tables and exports CSV files via client-side Blob generation (`report-export.service.js`); live two-way OAuth2 Google Sheets API sync is simulated.
5. **Real-time Server-Sent Push Notifications:** No WebSocket or Server-Sent Events (SSE) server connection exists for pushing new activities or supervisor decisions instantly to coordinators.
6. **JWT Token Revocation & Server Verification:** Tokens stored in `localStorage` are client-generated mock strings; the frontend never validates token expiration against a live public key or auth server.

---

### 41. What features does the team already know are missing from the frontend?

1. **Branch Creation / Management Interface:** There is no UI to add or edit client branches; branches are hardcoded in catalogs.
2. **English Localization (i18n):** The application is 100% Arabic with hardcoded text; there is no English toggle or translation layer.
3. **Native PWA `beforeinstallprompt` UI:** The application lacks a custom install pill/banner to prompt users on Android or iOS.
4. **Hardware Video Camera Stream Preview:** The photo capture uses the native mobile file input picker (`<input type="file" capture="environment">`) rather than an inline WebRTC HTML5 `<video>` / `<canvas>` viewfinder.
5. **Pagination & Virtual Scrolling:** Long activity lists and sheets render all DOM nodes simultaneously, which will degrade performance on low-end phones with 500+ records.
6. **Role-Specific Coordinator Supervisor Scoring Form:** Coordinator supervisors currently share the main supervisor evaluation interface or view read-only activity states.

---

### 42. Are there any hardcoded values (API keys, URLs, demo passwords) still in the code that need to be removed before going live?

Yes, the following hardcoded items must be removed or externalized into environment variables:

1. **Hardcoded Demo User Passwords & Plain Credentials:**
   - In `frontend/js/store/employee-registry.seed.js` and `frontend/js/services/auth.service.js`:
     - `ADCO-101`: `'Pass@1234'` (Ahmed Mahmoud El-Abd)
     - `ADCO-501`: `'Super@2026'` (Ayman El-Rouby)
     - `ADCO-901`: `'Admin@2026'` (Eng. Hossam El-Din Ghanem)
     - Fallback master bypass passwords in `auth.service.js` line 99: `'123456'`, `'admin123'`.
2. **Hardcoded Fast Login Quick-Fill Buttons in Production HTML:**
   - In `frontend/pages/login.html` (lines 62-79): Quick-fill buttons calling `quickFill('ADCO-101', 'Pass@1234')`, `quickFill('ADCO-501', 'Super@2026')`, `quickFill('ADCO-901', 'Admin@2026')`.
   - In `frontend/js/components/profile-modal.js` (lines 80-105) and `frontend/js/app.js`: Sandbox buttons that automatically log in with the above passwords.
3. **Hardcoded Localhost Base URLs:**
   - In `frontend/js/api/http-client.js` line 42: Fallback base URL `'http://localhost:3000/api/v1'`.
4. **Third-Party CDN Image Dependencies:**
   - In `frontend/js/store/seed-data.js` and `frontend/js/pages/activity-details.page.js`: Hardcoded external Unsplash image fallback URLs (`https://images.unsplash.com/photo-1578916171728-46686eac8d58...`).

