# Alexandria Company for Chemicals and Detergents (ADCO) — Master Backend API Endpoints Specification

> **System Version:** 2.5.0 Enterprise Architecture  
> **Official Corporate Entity:** Alexandria Company for Chemicals and Detergents (ADCO)  
> **Backend Architecture:** Node.js / TypeScript RESTful JSON API v1  
> **Database:** PostgreSQL 16 + Redis Cache + S3 Media Store  
> **Timezone Requirement:** Strictly `Africa/Cairo` (UTC+2)  
> **Standard Base URL:** `/api/v1`  

---

## 1. Global Request & Response Specifications

### 1.1 Universal Headers
All incoming requests to the API Gateway must adhere to the following header specifications:

| Header Name | Type | Required | Description |
|:---|:---|:---:|:---|
| **`Content-Type`** | `string` | Conditional | Must be `application/json` for JSON payloads or `multipart/form-data` for file uploads. |
| **`Authorization`** | `string` | Yes (for protected endpoints) | Format: `Bearer <JWT_ACCESS_TOKEN>`. |
| **`Idempotency-Key`** | `string (UUIDv4)` | Yes (for state-mutating requests) | Required on all `POST`, `PUT`, `PATCH` operations to prevent duplicate transactions. |
| **`Accept-Language`** | `string` | Optional | Defaults to `en-US, en;q=0.9, ar;q=0.8`. |

### 1.2 3-Tier Role-Based Access Control (RBAC) Matrix

| Role Identifier | Role Title | Tier Level | Scoping Rule & Access Boundaries |
|:---|:---|:---:|:---|
| **`COORDINATOR`** | Field Coordinator | Tier 1 | Restricted strictly to activities created for their single assigned client branch (`assignedClientName` + `assignedBranchName`). Cannot view activities from other branches. |
| **`COORDINATOR_SUPERVISOR`** | Coordinator Supervisor | Tier 2 | Scoped to **all branches of their assigned retail client in their region** (e.g. all branches of *Fathalla Wholesale Market* in Alexandria). Has full operational capabilities + dedicated branch and coordinator filtering toolbar over all client activities. |
| **`MARKETING_MANAGER`**<br>*(alias: `COORDINATION_MANAGER`)* | Marketing Manager | Tier 3 | Unrestricted nationwide administrative access. Evaluates follow-ups with 100-point scoring, approves/rejects activities & closure requests, exports $1/N$ multi-brand sheets, and inspects analytics. |

### 1.3 Standard Error Response Structure
All error responses from the backend follow this standardized JSON schema:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Magazine end date must be greater than or equal to start date",
  "errors": [
    {
      "field": "magazineEndDate",
      "rule": "endDate >= startDate",
      "message": "Invalid magazine end date"
    }
  ],
  "timestamp": "2026-11-05T20:30:00.000Z",
  "path": "/api/v1/activities"
}
```

---

## 2. Authentication & Session Module

### 2.1 Employee Login
* **Method & Path:** `POST /api/v1/auth/login`
* **Target Backend File:** `src/modules/auth/auth.routes.ts` -> `AuthController.login`
* **Required Role:** Public (Unauthenticated)
* **Description:** Validates corporate employee ID (`ADCO-xxx`) and password credentials against the PostgreSQL `users` table. On success, returns signed JWT access token, refresh token, and authenticated user profile with assigned 3-tier scoping data.
* **Request Headers:**
  * `Content-Type: application/json`
* **Request Body DTO (Zod Schema):**
  ```typescript
  z.object({
    employeeId: z.string().trim().regex(/^ADCO-\d{3,5}$/i, "Employee ID must begin with ADCO followed by digits"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
  ```
* **Sample Request Payload:**
  ```json
  {
    "employeeId": "ADCO-501",
    "password": "Super@2026"
  }
  ```
* **Expected Response & HTTP Status Codes:**
  * **`200 OK`**:
    ```json
    {
      "success": true,
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "tokenType": "Bearer",
      "expiresIn": 3600,
      "user": {
        "employeeId": "ADCO-501",
        "fullName": "Ayman Abdelrahman El-Rouby",
        "mobile": "01055566677",
        "email": "ayman.r@adco.com.eg",
        "role": "coordinator_supervisor",
        "rank": "#2",
        "score": 92,
        "assignedClientName": "Fathalla Wholesale Market",
        "assignedBranchName": null,
        "region": "Alexandria",
        "branch": "Fathalla Wholesale Market Operations - Alexandria"
      }
    }
    ```
  * **`400 Bad Request`**: Missing or invalid field formats.
  * **`401 Unauthorized`**: Invalid credentials or employee ID not registered in ADCO system.

---

### 2.2 3-Step Employee Registration Wizard
* **Method & Path:** `POST /api/v1/auth/signup`
* **Target Backend File:** `src/modules/auth/auth.routes.ts` -> `AuthController.signup`
* **Required Role:** Public
* **Description:** Finalizes new employee account onboarding after 3-step verification (ID match, SMS/Email OTP validation, password creation). Inserts user record and auto-logs in.
* **Request Headers:**
  * `Content-Type: application/json`
  * `Idempotency-Key: <UUID>`
* **Request Body DTO (Zod Schema):**
  ```typescript
  z.object({
    employeeId: z.string().trim().regex(/^ADCO-\d{3,5}$/i),
    fullName: z.string().min(3).max(100),
    mobile: z.string().regex(/^01[0125]\d{8}$/, "Invalid Egyptian mobile phone number"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6),
    role: z.enum(['coordinator', 'coordinator_supervisor']).default('coordinator'),
    branch: z.string().min(2).max(100),
    assignedClientName: z.string().nullable().optional(),
    assignedBranchName: z.string().nullable().optional(),
    region: z.string().default('Alexandria')
  })
  ```
* **Expected Response & HTTP Status Codes:**
  * **`201 Created`**: Returns `{ success: true, accessToken, refreshToken, user }`.
  * **`400 Bad Request`**: Validation rules failed.
  * **`409 Conflict`**: Employee ID or mobile number already registered.

---

### 2.3 Silent Token Refresh
* **Method & Path:** `POST /api/v1/auth/refresh`
* **Target Backend File:** `src/modules/auth/auth.routes.ts` -> `AuthController.refreshToken`
* **Required Role:** Public (Valid Refresh Token)
* **Description:** Rotates expired access JWTs using long-lived refresh token stored in client storage.
* **Request Body DTO:**
  ```json
  {
    "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
  ```
* **Expected Response & HTTP Status Codes:**
  * **`200 OK`**: `{ "accessToken": "...", "refreshToken": "..." }`.
  * **`401 Unauthorized`**: Refresh token expired, revoked, or blacklisted.

---

### 2.4 User Logout
* **Method & Path:** `POST /api/v1/auth/logout`
* **Target Backend File:** `src/modules/auth/auth.routes.ts` -> `AuthController.logout`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Revokes current refresh token and blacklists access token in Redis cache.
* **Expected Response & HTTP Status Codes:**
  * **`200 OK`**: `{ "success": true, "message": "Successfully logged out" }`.
  * **`401 Unauthorized`**: Missing or invalid token.

---

## 3. Employee Profile & Account Settings Module

### 3.1 Get Profile Information
* **Method & Path:** `GET /api/v1/employees/me`
* **Target Backend File:** `src/modules/profile/profile.routes.ts` -> `ProfileController.getProfile`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Returns profile metadata, security lock state, contact phone/email, and personal performance tier.
* **Expected Response:**
  * **`200 OK`**: User profile object with cumulative KPI stats.
  * **`401 Unauthorized`**: Token missing or invalid.

---

### 3.2 Update Contact Credentials (Password-Protected Gate)
* **Method & Path:** `PUT /api/v1/profile/update-credentials`
* **Target Backend File:** `src/modules/profile/profile.routes.ts` -> `ProfileController.updateContactInfo`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Updates mobile number and/or email address for the logged-in user.
* **Request Body DTO:**
  ```json
  {
    "email": "ahmed.m@adco.com.eg",
    "mobile": "01012345678"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: `{ "success": true, "message": "Contact credentials successfully updated" }`.
  * **`400 Bad Request`**: Invalid Egyptian phone or email structure.
  * **`401 Unauthorized`**: Unauthenticated.

---

### 3.3 Change Password
* **Method & Path:** `PUT /api/v1/profile/update-password`
* **Target Backend File:** `src/modules/profile/profile.routes.ts` -> `ProfileController.updatePassword`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Validates old password and updates employee password hash.
* **Request Body DTO:**
  ```json
  {
    "oldPassword": "Pass@1234",
    "newPassword": "NewStrongPass@2026"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: `{ "success": true, "message": "Password successfully updated" }`.
  * **`400 Bad Request`**: New password does not meet minimum 6-character length.
  * **`401 Unauthorized`**: Old password is incorrect.

---

## 4. Field Activities Module

### 4.1 List Activities (3-Tier Data Scoped)
* **Method & Path:** `GET /api/v1/activities`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.listActivities`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Retrieves paginated activities feed strictly scoped by requester's role:
  * `COORDINATOR`: WHERE `client_name = user.assignedClientName` AND `branch_name = user.assignedBranchName`.
  * `COORDINATOR_SUPERVISOR`: WHERE `client_name = user.assignedClientName`. Supports query filters `branch` and `coordinatorId`.
  * `MARKETING_MANAGER`: Nationwide unrestricted dataset.
* **Query Parameters:**
  * `status`: `'Under Review' | 'Accepted' | 'Rejected' | 'ALL'` (default: `'ALL'`)
  * `branch`: Specific branch name (optional)
  * `coordinatorId`: Filter by specific coordinator employee ID (optional)
  * `startDate`: `YYYY-MM-DD` (optional)
  * `endDate`: `YYYY-MM-DD` (optional)
  * `page`: Integer $\ge 1$ (default: 1)
  * `limit`: Integer $\le 100$ (default: 50)
* **Expected Response & HTTP Status Codes:**
  * **`200 OK`**:
    ```json
    {
      "success": true,
      "data": [ /* Array of Activity DTOs */ ],
      "meta": {
        "totalCount": 24,
        "page": 1,
        "limit": 50,
        "totalPages": 1
      }
    }
    ```
  * **`401 Unauthorized`**

---

### 4.2 Create Activity Card (4-Level Product Cascade & Magazine Validation)
* **Method & Path:** `POST /api/v1/activities`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.createActivity`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Creates an operational activity card. Normalizes products into `activity_products`, calculates $1/N$ brand shares into `activity_brands`, validates mandatory magazine date range when `activity = 'Magazine Feature'`, and validates hardware GPS lock.
* **Request Headers:**
  * `Authorization: Bearer <token>`
  * `Content-Type: application/json`
  * `Idempotency-Key: <UUID>`
* **Request Body DTO (Zod Schema):**
  ```typescript
  z.object({
    client: z.string().min(2).max(80),
    branch: z.string().min(2).max(100),
    coordinatorBranch: z.string().min(2).max(100),
    activity: z.string().min(2).max(80),
    activityType: z.enum([
      'Gondola', 'Dress Up', 'Side Gondola', 'Stand', 'Podium',
      'Pillar', 'Cut Man', 'See-Through', 'Light Box', 'Floor Display'
    ]),
    activityCount: z.number().int().min(1).max(10).default(1),
    magazineStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    magazineEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    activityDate: z.string().datetime({ offset: true }),
    products: z.array(z.object({
      brandName: z.string().min(2).max(80),
      mainGroup: z.string().min(2).max(100),
      subGroup: z.string().min(2).max(100),
      skuItem: z.string().min(2).max(200)
    })).min(1, "At least one product item must be added via the 4-level structure"),
    photoUrl: z.string().url(),
    photoHash: z.string().length(64),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).refine((data) => {
    if (data.activity === 'Magazine Feature') {
      return data.magazineStartDate && data.magazineEndDate && data.magazineEndDate >= data.magazineStartDate;
    }
    return true;
  }, {
    message: "Magazine start date and end date are required when Magazine Feature is selected, and end date must be after or equal to start date",
    path: ["magazineEndDate"]
  })
  ```
* **Sample Request Payload:**
  ```json
  {
    "client": "Fathalla Wholesale Market",
    "branch": "Smouha Branch - Alexandria",
    "coordinatorBranch": "East Alexandria Sector (Smouha / Roushdy / Sidi Gaber)",
    "activity": "Magazine Feature",
    "activityType": "Gondola",
    "activityCount": 2,
    "magazineStartDate": "2026-11-01",
    "magazineEndDate": "2026-11-15",
    "activityDate": "2026-11-01T10:15:00+02:00",
    "products": [
      {
        "brandName": "Velveta",
        "mainGroup": "Fabric Softeners",
        "subGroup": "Concentrated Softener",
        "skuItem": "Velveta Concentrated Floral Breeze 1L"
      },
      {
        "brandName": "Fairy",
        "mainGroup": "Dishwashing Liquid",
        "subGroup": "Platinum Plus",
        "skuItem": "Fairy Platinum Plus Lemon 650ml"
      }
    ],
    "photoUrl": "https://cdn.adco.com.eg/photos/2026/11/act-0841.jpg",
    "photoHash": "a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9",
    "latitude": 31.2156,
    "longitude": 29.9553
  }
  ```
* **Expected Response & HTTP Status Codes:**
  * **`201 Created`**: Returns `{ success: true, id: "ACT-2026-0841", status: "Under Review", ... }`.
  * **`400 Bad Request`**: Validation error.
  * **`401 Unauthorized`**: Token missing or expired.
  * **`403 Forbidden`**: Coordinator attempting to submit card for unauthorized branch.

---

### 4.3 Get Activity by ID
* **Method & Path:** `GET /api/v1/activities/:id`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.getActivityById`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Retrieves full card details, follow-up timeline rounds, photo hashes, supervisor notes, and closure status.
* **Expected Response:**
  * **`200 OK`**: Complete Activity DTO.
  * **`403 Forbidden`**: Out of scope for this coordinator.
  * **`404 Not Found`**: Activity ID not found.

---

### 4.4 Upload Follow-Up Photo Round
* **Method & Path:** `POST /api/v1/activities/:id/follow-up`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.addFollowUpRound`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Appends a follow-up inspection round (Round #2, #3, ...) with new photos, EXIF data, and hardware GPS coordinates. Resets card status to `Under Review`.
* **Request Body DTO:**
  ```json
  {
    "roundNumber": 2,
    "roundTitle": "Additional Follow-Up #2",
    "photos": [
      {
        "photoUrl": "https://cdn.adco.com.eg/photos/2026/11/followup-2.jpg",
        "photoHash": "b4c7d912f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c2e3",
        "sizeKb": 184
      }
    ],
    "location": {
      "latitude": 31.2156,
      "longitude": 29.9553,
      "accuracy": 8
    }
  }
  ```
* **Expected Response:**
  * **`201 Created`**: Updated activity with appended session.
  * **`400 Bad Request`**: Invalid photo payload.
  * **`404 Not Found`**: Activity not found.

---

### 4.5 Submit "Request Activity Completion" (Closure Request)
* **Method & Path:** `POST /api/v1/activities/:id/request-end`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.requestClosure`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`
* **Description:** Initiates formal completion request from the field when contract or magazine period concludes. Sets `closureRequested: true` for supervisor review.
* **Request Body DTO:**
  ```json
  {
    "notes": "Conclusion of magazine feature display period and dismantling stands per branch management instructions"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: `{ "success": true, "message": "Activity completion request submitted and pending supervisor review" }`.
  * **`404 Not Found`**: Activity not found.

---

### 4.6 Direct Close Activity (Supervisor Action)
* **Method & Path:** `POST /api/v1/activities/:id/direct-close`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.directClose`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Directly closes an activity card, stamps `endDate` in Cairo time, and sets `isClosed: true`.
* **Request Body DTO:**
  ```json
  {
    "supervisorFeedback": "Field campaign concluded and final dismantling approved"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: `{ "success": true, "isClosed": true, "endDate": "2026-11-05 14:30" }`.
  * **`403 Forbidden`**: Only Marketing Manager / Supervisors can perform direct closure.

---

### 4.7 Process Closure Request (Approve / Reject)
* **Method & Path:** `POST /api/v1/activities/:id/process-closure`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.processClosure`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Decides on a pending coordinator closure request. Approving sets `isClosed: true` and stamps `endDate`; rejecting returns card to active state with supervisor explanation.
* **Request Body DTO:**
  ```json
  {
    "decision": "COMPLETED",
    "supervisorFeedback": "Dismantling inspection photos verified; activity completion officially approved"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: Updated activity with new closure state.
  * **`400 Bad Request`**: Decision must be `COMPLETED` or `REJECTED`.
  * **`403 Forbidden`**: Role authorization failure.

---

### 4.8 Modify Activity Start Date
* **Method & Path:** `PATCH /api/v1/activities/:id/update-date`
* **Target Backend File:** `src/modules/activities/activities.routes.ts` -> `ActivityController.updateDate`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Adjusts installation start date of an activity when documented date differs from initial creation timestamp.
* **Request Body DTO:**
  ```json
  {
    "activityDate": "2026-11-01T08:00:00+02:00"
  }
  ```
* **Expected Response:**
  * **`200 OK`**: `{ "success": true, "activityDate": "2026-11-01T08:00:00+02:00" }`.
  * **`403 Forbidden`**: Unauthorized role.

---

## 5. Media & EXIF Verification Module

### 5.1 Upload Captured Image
* **Method & Path:** `POST /api/v1/media/upload`
* **Target Backend File:** `src/modules/media/media.routes.ts` -> `MediaController.upload`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Accepts `multipart/form-data` image stream, validates dimensions $\le 1280 \times 720$, verifies byte size $< 1\text{MB}$, computes SHA-256 hash, and saves to S3 media bucket.
* **Expected Response:**
  * **`201 Created`**:
    ```json
    {
      "url": "https://cdn.adco.com.eg/media/2026/act-img-9912.jpg",
      "photoHash": "a8f5f167f44f4964e6c998dee827110c92b8b7f483021a874f63218b10f6c1d9",
      "sizeKb": 184,
      "width": 1280,
      "height": 720
    }
    ```
  * **`400 Bad Request`**: Image exceeds $1\text{MB}$ or has invalid MIME type.

---

### 5.2 Validate EXIF & Geofence
* **Method & Path:** `POST /api/v1/media/verify-metadata`
* **Target Backend File:** `src/modules/media/media.routes.ts` -> `MediaController.verifyMetadata`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Verifies EXIF metadata against hardware GPS coordinates and Egypt timezone.
* **Expected Response:**
  * **`200 OK`**: `{ "verified": true, "geofenceDistanceMeters": 42 }`.

---

## 6. Supervisor Evaluations Module

### 6.1 Submit 100-Point Evaluation Review
* **Method & Path:** `POST /api/v1/supervisor/evaluations/:id`
* **Target Backend File:** `src/modules/evaluations/evaluations.routes.ts` -> `EvaluationController.submitReview`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Submits official evaluation scoring across the 4 criteria (Total: 100 Points):
  1. **New Verified Activities (`newActivity`):** Max 40 points
  2. **Field Execution Quality (`executionQuality`):** Max 20 points
  3. **Proven Continuity (`continuity`):** Max 25 points
  4. **Documentation & Data Integrity (`documentation`):** Max 15 points
* **Request Body DTO (Zod Schema):**
  ```typescript
  z.object({
    decision: z.enum(['Accepted', 'Under Review', 'Rejected']),
    rawScore: z.number().min(0).max(10),
    roundNumber: z.number().int().min(1).default(1),
    notes: z.string().max(1000).optional(),
    breakdown: z.object({
      newActivity: z.number().min(0).max(40),
      executionQuality: z.number().min(0).max(20),
      continuity: z.number().min(0).max(25),
      documentation: z.number().min(0).max(15)
    }),
    newActivityDate: z.string().datetime({ offset: true }).optional()
  })
  ```
* **Sample Request Payload:**
  ```json
  {
    "decision": "Accepted",
    "rawScore": 9.5,
    "roundNumber": 1,
    "notes": "Excellent execution and optimal brand share distribution between both brands",
    "breakdown": {
      "newActivity": 40,
      "executionQuality": 19,
      "continuity": 25,
      "documentation": 15
    }
  }
  ```
* **Expected Response:**
  * **`200 OK`**:
    ```json
    {
      "success": true,
      "totalWeightedScore": 99,
      "badgeTier": "Excellent - Diamond Tier",
      "overallRating": 9.9,
      "updatedActivity": { /* Activity DTO */ }
    }
    ```
  * **`400 Bad Request`**: Score exceeds criteria maximums.
  * **`403 Forbidden`**: Only Marketing Manager / Supervisors can evaluate.

---

### 6.2 Get Multi-Brand Sheets View ($1/N$ Rows)
* **Method & Path:** `GET /api/v1/supervisor/sheets-view`
* **Target Backend File:** `src/modules/evaluations/evaluations.routes.ts` -> `EvaluationController.getSheetsView`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Multiplies each activity having $N$ distinct brands into $N$ individual records with exact Brand Share = $(1/N)$.
* **Query Parameters:**
  * `startDate`: `YYYY-MM-DD` (optional)
  * `endDate`: `YYYY-MM-DD` (optional)
  * `brand`: Filter by specific brand name (optional)
  * `client`: Filter by client name (optional)
* **Expected Response:**
  * **`200 OK`**: Array of expanded brand rows with `brandShareDecimal`, `brandSharePercent`, and `brandShareFormatted`.

---

### 6.3 Export CSV Spreadsheet (Excel UTF-8 BOM)
* **Method & Path:** `GET /api/v1/supervisor/export-csv`
* **Target Backend File:** `src/modules/evaluations/evaluations.routes.ts` -> `EvaluationController.exportCsv`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Streams a UTF-8 with BOM (`\uFEFF`) CSV file formatted for direct import into Microsoft Excel.
* **Expected Response:**
  * **`200 OK`**: Binary CSV stream (`Content-Type: text/csv; charset=utf-8`).

---

## 7. Reports & Leaderboard Module

### 7.1 Analytics KPI Metrics
* **Method & Path:** `GET /api/v1/reports/analytics`
* **Target Backend File:** `src/modules/reports/reports.routes.ts` -> `ReportsController.getAnalytics`
* **Required Role:** `MARKETING_MANAGER`
* **Description:** Aggregates nationwide KPIs: total volume, acceptance rate, brand distribution share, and branch velocity.
* **Expected Response:**
  * **`200 OK`**:
    ```json
    {
      "total": 48,
      "accepted": 41,
      "underReview": 5,
      "rejected": 2,
      "closed": 14,
      "acceptanceRate": 85,
      "averageScore": 92
    }
    ```

---

### 7.2 Ranked Leaderboard Standings
* **Method & Path:** `GET /api/v1/leaderboard`
* **Target Backend File:** `src/modules/reports/reports.routes.ts` -> `ReportsController.getLeaderboard`
* **Required Role:** `COORDINATOR`, `COORDINATOR_SUPERVISOR`, `MARKETING_MANAGER`
* **Description:** Ranks all coordinators by weighted 100-point performance score and approved submissions count.
* **Expected Response:**
  * **`200 OK`**:
    ```json
    [
      {
        "rank": "#1",
        "coordinatorId": "ADCO-102",
        "coordinatorName": "Sara Tarek Ibrahim",
        "branch": "Loran Branch - Corniche",
        "totalScore": 98,
        "acceptedCount": 14,
        "tier": "Excellent - Diamond Tier"
      },
      {
        "rank": "#2",
        "coordinatorId": "ADCO-501",
        "coordinatorName": "Ayman Abdelrahman El-Rouby",
        "branch": "Fathalla Wholesale Market Operations - Alexandria",
        "totalScore": 94,
        "acceptedCount": 12,
        "tier": "Excellent - Diamond Tier"
      },
      {
        "rank": "#3",
        "coordinatorId": "ADCO-101",
        "coordinatorName": "Ahmed Mahmoud El-Abd",
        "branch": "Smouha Branch - Alexandria",
        "totalScore": 88,
        "acceptedCount": 9,
        "tier": "Very Good - Gold Tier"
      }
    ]
    ```

---

## 8. Summary RBAC Permission Matrix

| Endpoint Route | Method | `COORDINATOR` | `COORDINATOR_SUPERVISOR` | `MARKETING_MANAGER` |
|:---|:---:|:---:|:---:|:---:|
| `/api/v1/auth/login` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/auth/signup` | `POST` | ✅ | ✅ | ❌ |
| `/api/v1/auth/refresh` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/auth/logout` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/employees/me` | `GET` | ✅ | ✅ | ✅ |
| `/api/v1/profile/update-credentials` | `PUT` | ✅ | ✅ | ✅ |
| `/api/v1/profile/update-password` | `PUT` | ✅ | ✅ | ✅ |
| `/api/v1/activities` | `GET` | ✅ *(Own branch)* | ✅ *(Assigned client branches)* | ✅ *(Global)* |
| `/api/v1/activities` | `POST` | ✅ *(Own branch)* | ✅ *(Assigned client branches)* | ✅ *(Global)* |
| `/api/v1/activities/:id` | `GET` | ✅ *(Own branch)* | ✅ *(Assigned client branches)* | ✅ *(Global)* |
| `/api/v1/activities/:id/follow-up` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/activities/:id/request-end` | `POST` | ✅ | ✅ | ❌ |
| `/api/v1/activities/:id/direct-close` | `POST` | ❌ | ❌ | ✅ |
| `/api/v1/activities/:id/process-closure`| `POST` | ❌ | ❌ | ✅ |
| `/api/v1/activities/:id/update-date` | `PATCH`| ❌ | ❌ | ✅ |
| `/api/v1/media/upload` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/media/verify-metadata` | `POST` | ✅ | ✅ | ✅ |
| `/api/v1/supervisor/evaluations/:id` | `POST` | ❌ | ❌ | ✅ |
| `/api/v1/supervisor/sheets-view` | `GET` | ❌ | ❌ | ✅ |
| `/api/v1/supervisor/export-csv` | `GET` | ❌ | ❌ | ✅ |
| `/api/v1/reports/analytics` | `GET` | ❌ | ❌ | ✅ |
| `/api/v1/leaderboard` | `GET` | ✅ | ✅ | ✅ |
