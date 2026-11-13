# ADCO Platform: System Diagrams

> Companion to **ADCO-System-Specification.md** (v3.0). Section references (for example "D11" or "8.5") point to that file.
> All diagrams use [Mermaid](https://mermaid.js.org). They render on GitHub, GitLab, and in VS Code with a Mermaid extension. To export an image, paste a diagram into https://mermaid.live.

## Contents

1. System context
2. Modules and how they interact
3. Module ownership of database tables
4. Database entity relationships
5. End-to-end workflow
6. Branch card and activity states
7. Sequence: coordinator creates an activity with photos
8. Sequence: offline upload and sync
9. Sequence: manager reviews and scores
10. Flow: monthly score and leaderboard lock
11. Sequence: manager opens a location (audited)
12. Sequence: registration and login
13. Flow: daily retention job

---

## 1. System context

Who uses the system, and which external services it depends on.

```mermaid
flowchart LR
    subgraph Users
        COORD["Coordinator<br/>phone PWA"]
        SUP["Supervisor<br/>browser"]
        MGR["Marketing manager<br/>browser"]
    end

    CF["Cloudflare<br/>DNS, SSL, WAF, rate limits"]

    subgraph VPS["Hostinger VPS"]
        NGINX["Nginx"]
        APP["Node.js API<br/>(PM2)"]
        PG[("PostgreSQL 16")]
    end

    R2[("Cloudflare R2<br/>private photo bucket")]
    MAIL["Email provider<br/>verification and reset"]
    BI["Analytics<br/>Power BI, read-only exports"]

    COORD -->|HTTPS| CF
    SUP -->|HTTPS| CF
    MGR -->|HTTPS| CF
    CF --> NGINX --> APP
    APP --> PG
    APP -->|signed URLs| R2
    COORD -.->|direct upload, presigned PUT| R2
    APP --> MAIL
    APP -->|exports without location fields| BI
```

---

## 2. Modules and how they interact

The application is one deployable service, split into modules. Modules call each other only through their service interfaces (section 16.2).

```mermaid
flowchart TD
    AUTH["Auth<br/>accounts, sessions, registration"]
    ORG["Org<br/>regions, branches, assignments"]
    CAT["Catalog<br/>brands, groups, SKUs"]
    ACT["Activities<br/>branch cards, activities, endings"]
    MEDIA["Media<br/>uploads, location, EXIF strip"]
    EVAL["Evaluations<br/>scoring, review decisions"]
    REP["Reporting<br/>leaderboard, dashboard, exports"]
    AUD["Audit<br/>who did what, when"]
    JOBS["Scheduled jobs<br/>retention, month lock, cleanup"]

    AUTH -->|"resolves user scope"| ORG
    ACT -->|"checks card is open and user in scope"| ORG
    ACT -->|"brand shares 1/N"| CAT
    ACT -->|"links upload IDs"| MEDIA
    EVAL -->|"reads activity, sets review status"| ACT
    REP -->|"reads evaluations and activities"| EVAL
    REP -->|"reads activities"| ACT
    MEDIA -->|"decrypt request, manager only"| AUTH
    JOBS -->|"delete expired photos"| MEDIA
    JOBS -->|"lock month, write snapshots"| REP

    ACT -.->|"every change"| AUD
    EVAL -.->|"every score"| AUD
    MEDIA -.->|"every location view"| AUD
    AUTH -.->|"logins, role changes"| AUD
    ORG -.->|"transfers"| AUD
```

Solid arrows are direct service calls. Dotted arrows are audit writes.

---

## 3. Module ownership of database tables

Each module writes only to its own tables. Other modules read through the owning service.

```mermaid
flowchart LR
    subgraph AUTH_M["Auth module"]
        T1[employees]
        T2[users]
        T3[sessions]
        T4[reset_tokens]
    end
    subgraph ORG_M["Org module"]
        T5[regions]
        T6[branches]
        T7[branch_assignments]
        T8[supervisor_branches]
    end
    subgraph CAT_M["Catalog module"]
        T9[brands]
        T10[product_groups]
        T11[skus]
    end
    subgraph ACT_M["Activities module"]
        T12[branch_cards]
        T13[activities]
        T14[activity_products]
        T15[activity_brands]
        T16[follow_up_rounds]
    end
    subgraph MEDIA_M["Media module"]
        T17[media_files<br/>incl. encrypted location]
    end
    subgraph EVAL_M["Evaluations module"]
        T18[evaluations<br/>versioned]
    end
    subgraph REP_M["Reporting module"]
        T19[monthly_snapshots]
    end
    subgraph AUD_M["Audit module"]
        T20[audit_log]
    end

    DB[("PostgreSQL 16")]
    AUTH_M --> DB
    ORG_M --> DB
    CAT_M --> DB
    ACT_M --> DB
    MEDIA_M --> DB
    EVAL_M --> DB
    REP_M --> DB
    AUD_M --> DB
```

Rule: reporting reads evaluations and activities but never writes to them, and the reporting database role cannot select `capture_location_enc` (section 18).

---

## 4. Database entity relationships

```mermaid
erDiagram
    REGIONS ||--o{ BRANCHES : contains
    PARENT_CHAINS ||--o{ BRANCHES : owns
    SUPPLYING_BRANCHES ||--o{ BRANCHES : supplies

    PARENT_CHAINS {
        int id PK
        string parent_code UK
        string name
        string name_norm
    }
    BRANCHES {
        int id PK
        string branch_code UK
        int parent_chain_id FK
        string supplying_code FK
        int next_activity_no
        string name_norm
    }
    SUPPLYING_BRANCHES {
        string code PK
        smallint region_number UK
    }
    EMPLOYEES ||--o| USERS : "has account"
    USERS ||--o{ SESSIONS : "signed in with"
    EMPLOYEES ||--o{ BRANCH_ASSIGNMENTS : "coordinates, dated"
    BRANCHES ||--o{ BRANCH_ASSIGNMENTS : "assigned to"
    EMPLOYEES ||--o{ SUPERVISOR_BRANCHES : supervises
    BRANCHES ||--o{ SUPERVISOR_BRANCHES : "supervised by"
    BRANCHES ||--o{ BRANCH_CARDS : "has one open at a time"
    BRANCH_CARDS ||--o{ ACTIVITIES : contains
    ACTIVITIES ||--o| ACTIVITIES : "replaces (resubmission)"
    ACTIVITIES ||--o{ ACTIVITY_PRODUCTS : includes
    SKUS ||--o{ ACTIVITY_PRODUCTS : "product on shelf"
    ACTIVITIES ||--o{ ACTIVITY_BRANDS : "share per brand"
    BRANDS ||--o{ ACTIVITY_BRANDS : "brand"
    BRANDS ||--o{ PRODUCT_GROUPS : has
    PRODUCT_GROUPS ||--o{ SKUS : has
    ACTIVITIES ||--o{ FOLLOW_UP_ROUNDS : "weekly rounds"
    ACTIVITIES ||--o{ MEDIA_FILES : "photos"
    FOLLOW_UP_ROUNDS ||--o{ MEDIA_FILES : "round photos"
    ACTIVITIES ||--o{ EVALUATIONS : "scored, versioned"
    EMPLOYEES ||--o{ MONTHLY_SNAPSHOTS : "ranked each month"
    EMPLOYEES ||--o{ AUDIT_LOG : "acts in"

    BRANCH_CARDS {
        uuid id PK
        uuid branch_id FK
        string status "OPEN or CLOSED"
        string close_reason
    }
    ACTIVITIES {
        uuid id PK
        uuid branch_card_id FK
        string coordinator_id
        string review_status
        string activity_ref UK
        int branch_id FK
        string end_status
        string end_reason
    }
    MEDIA_FILES {
        uuid id PK
        uuid upload_id UK
        string location_status
        numeric distance_m
        bytea capture_location_enc
    }
    EVALUATIONS {
        uuid id PK
        uuid activity_id FK
        int version
        smallint total "computed by database"
    }
```

Notes:
- `branch_cards` has a partial unique index: one `OPEN` card per branch (D21).
- `media_files.capture_location_enc` is encrypted. Its row and object are deleted 30 days after the activity ends (D11).
- `evaluations` is append-only. A new version is inserted for each re-score.

---

## 5. End-to-end workflow

From opening a branch card to monthly ranking.

```mermaid
flowchart TD
    A["Open branch card for a client branch<br/>(one open card per branch, D21)"] --> B["Add activity inside the card<br/>type, products, dates"]
    B --> C["Take shelf photos<br/>compress, hash, record location and time"]
    C --> D{"Connected?"}
    D -- no --> Q["Queue in IndexedDB<br/>(section 14)"]
    Q --> D2["Sync when online"]
    D2 --> E
    D -- yes --> E["Upload photos<br/>two-step, idempotent"]
    E --> F["Server checks location<br/>distance, accuracy, time"]
    F --> G{"Location status"}
    G -- ok --> H["Activity saved"]
    G -- "out of range, low accuracy, stale" --> H2["Activity saved with flag<br/>coordinator chose Submit"]
    H --> I["Manager reviews"]
    H2 --> I
    I --> J{"Decision"}
    J -- Accepted --> K["Score 4 pillars, total 100"]
    J -- Rejected --> L["Score recorded as 0 points<br/>manager notes sent"]
    L --> M["Coordinator submits new card<br/>replaces_activity_id links old one"]
    M --> B
    K --> N["Weekly follow-up round<br/>review again"]
    N --> I
    K --> O{"Ending requested or manager ends"}
    O -- "completed, cancelled, or mistake" --> P["Activity ENDED<br/>never deleted"]
    P --> R["Photos kept 30 days after end, then deleted"]
    P --> S["All activities ended, manager closes branch card"]
    K --> T["Monthly score = total points / submissions<br/>(D9)"]
    L --> T
    T --> U["Review deadline 3rd of next month<br/>leaderboard locks (D10)"]
```

---

## 6. Branch card and activity states

### 6.1 Branch card

```mermaid
stateDiagram-v2
    [*] --> OPEN : manager or coordinator opens card
    OPEN --> OPEN : activities added or ended
    OPEN --> CLOSED : manager closes after all activities ended
    CLOSED --> [*]
```

### 6.2 Activity review status and ending status

```mermaid
stateDiagram-v2
    direction LR
    state "Review status" as RS {
        [*] --> UNDER_REVIEW
        UNDER_REVIEW --> ACCEPTED : manager accepts
        UNDER_REVIEW --> REJECTED : manager rejects
        ACCEPTED --> UNDER_REVIEW : new follow-up round
        REJECTED --> [*]
    }
    state "Ending status" as ES {
        [*] --> OPEN
        OPEN --> ENDING_REQUESTED : coordinator or supervisor requests
        ENDING_REQUESTED --> OPEN : manager rejects request
        ENDING_REQUESTED --> ENDED : manager approves
        OPEN --> ENDED : manager ends directly
        ENDED --> [*]
    }
```

Rules that the diagram enforces:
- `ENDED` is terminal. An ended card is read-only.
- A rejected activity is not edited. The coordinator creates a new card that references it.
- A card is never deleted. Its end reason is `completed`, `cancelled`, or `added_by_mistake`.

---

## 7. Sequence: coordinator creates an activity with photos

Online path. Offline behavior is in section 8.

```mermaid
sequenceDiagram
    autonumber
    participant C as Coordinator PWA
    participant API as API server
    participant M as Media module
    participant R2 as Cloudflare R2
    participant A as Activities module
    participant O as Org module
    participant DB as PostgreSQL
    participant AU as Audit log

    C->>API: POST /media/uploads with sha256, lat, lng, accuracy, captured_at
    API->>M: create upload record
    M->>DB: insert upload, status PENDING
    M-->>C: uploadId and presigned PUT URL (5 min)

    C->>R2: PUT compressed photo (720p, under 1 MB)
    C->>API: POST /media/uploads/uploadId/complete
    API->>M: verify upload
    M->>R2: read object, check size and hash
    Note over M: strip all EXIF, create 300 px thumbnail
    Note over M: distance to branch, location status
    Note over M: encrypt exact point (AES-256-GCM), add HMAC tag
    M->>DB: update media_files, status READY
    API-->>C: 200 READY, location_status shown

    C->>API: POST /branch-cards/cardId/activities with uploadIds and products
    API->>A: create activity
    A->>O: is card OPEN, is user in scope
    O->>DB: read branch_cards, branch_assignments, supervisor_branches
    O-->>A: allowed
    A->>DB: take next activity_no from branch counter, insert activity and products
    Note over A: compute 1/N brand shares on the server
    A->>DB: insert activity_brands
    A->>M: attach upload IDs to activity
    M->>DB: set activity_id on media_files
    A->>AU: log activity created
    API-->>C: 201 activity created
```

---

## 8. Sequence: offline upload and sync

Photos taken without signal are kept in IndexedDB and sent when the phone reconnects.

```mermaid
sequenceDiagram
    autonumber
    participant C as Coordinator
    participant PAGE as PWA page
    participant IDB as IndexedDB
    participant SW as Service worker
    participant API as API server
    participant R2 as Cloudflare R2

    C->>PAGE: take photo with no signal
    PAGE->>PAGE: compress, hash, read location and time
    PAGE->>IDB: save blob, metadata, uploadId, status pending
    PAGE->>SW: register sync "upload-queue"
    PAGE-->>C: show "3 photos waiting to upload"

    Note over SW,API: Later, when the connection returns
    SW->>IDB: read pending items, oldest first
    loop each item
        SW->>API: POST /media/uploads with metadata
        API-->>SW: uploadId and presigned URL
        SW->>R2: PUT bytes
        SW->>API: POST complete
        alt 200 or 409 already received
            API-->>SW: success
            SW->>IDB: delete item
        else network or 5xx error
            SW->>IDB: keep item, increase attempts
            Note over SW: stop batch, retry with backoff
        else permanent error
            API-->>SW: 4xx, for example activity ended
            SW->>IDB: mark failed, show to coordinator
        end
    end
```

Triggers that start the sync: the `sync` event (Android), the `online` event (iPhone, only while the app is open), and app start.

Late photos: if the capture time is more than 10 minutes before receipt, the server sets `stale`. Photos older than 72 hours are rejected with a recapture message (section 14.4).

---

## 9. Sequence: manager reviews and scores

```mermaid
sequenceDiagram
    autonumber
    participant M as Manager
    participant API as API server
    participant E as Evaluations module
    participant MED as Media module
    participant A as Activities module
    participant DB as PostgreSQL
    participant AU as Audit log

    M->>API: POST /evaluations/activityId with 4 pillar scores, decision, notes
    API->>E: validate ranges (40, 20, 25, 15), check manager role
    E->>MED: fetch anti-cheat flags for this round's photos
    MED-->>E: is_duplicate, exif_present, distance_m (section 9.3.1)
    alt is_duplicate true
        Note over E: documentation forced to 0, round effectively scored 0
    end
    alt exif_present false
        Note over E: shown to manager as ERR_FAKE_CAMERA flag, manager decides
    end
    alt distance_m > 500
        Note over E: round auto-rejected (D31), manager cannot override to ACCEPTED
    end
    E->>DB: read latest evaluation version
    E->>DB: insert new version, total computed by database
    E->>DB: insert evaluation_violations for any manual deductions
    E->>A: set review_status to ACCEPTED, REJECTED, or UNDER_REVIEW
    A->>DB: update activities
    E->>AU: log score, decision, and any violations
    API-->>M: 200 with total

    alt decision REJECTED or UNDER_REVIEW
        Note over E: excluded from N and R in the monthly score (section 10.1)
        Note over A: coordinator sees manager notes (if rejected)
    end
```

---

## 10. Flow: monthly score and leaderboard lock (Bayesian engine, D27)

```mermaid
flowchart TD
    A["Evaluation finalized: ACCEPTED"] --> B["Add to coordinator's N and R for this month<br/>(REJECTED and UNDER_REVIEW excluded, D27)"]
    B --> C["WeightedBase = (N·R + m0·C) / (N + m0)<br/>m0 = 5, C = 70.0 (app_config)"]
    C --> D["EffortBonus = min(5, round(log2(N+1) × 1.25))"]
    D --> E["MonthlyScore = min(100, round(WeightedBase + EffortBonus))"]
    E --> F{"Review deadline reached?<br/>23:59 Cairo, 3rd of next month"}
    F -- no --> G["Show provisional score<br/>with pending-review count"]
    G --> F
    F -- yes --> H{"Unreviewed submissions left?"}
    H -- yes --> I["Warn managers on dashboard<br/>leaderboard still locks"]
    H -- no --> J
    I --> J["Write monthly_snapshots<br/>coordinators only (D29)"]
    J --> K["Rank by MonthlyScore, tie-break by N, then employee ID"]
    K --> L["Set locked_at<br/>leaderboard read-only"]
    L --> M["New month begins:<br/>N and R reset to zero per coordinator (D30)"]
    L --> N{"Manager reopens with reason?"}
    N -- yes --> O["Unlock, log to audit, recompute"]
    O --> J
    N -- no --> P["Month stays locked"]
```

Supervisors and marketing managers are never written to `monthly_snapshots` and never appear on the leaderboard (D29), even though they can still be the ones scoring activities.

Tie-breaks: unrounded score, then number of accepted activities, then employee ID.

---

## 11. Sequence: manager opens a location (audited)

Only managers can decrypt the exact upload point (D13). The audit entry is written before the response is sent.

```mermaid
sequenceDiagram
    autonumber
    participant M as Manager browser
    participant API as API server
    participant AUTH as Auth (role check)
    participant AU as Audit log
    participant MED as Media module
    participant DB as PostgreSQL
    participant KS as Key store (VPS env or secret manager)

    M->>API: GET /media/id/location-link
    API->>AUTH: role is MARKETING_MANAGER?
    alt not a manager
        AUTH-->>API: denied
        API-->>M: 403 (logged)
    else manager
        AUTH-->>API: allowed
        API->>AU: write entry, manager ID, media ID, IP, time
        API->>MED: decrypt location
        MED->>DB: read capture_location_enc and tag
        MED->>KS: fetch key for version
        MED->>MED: verify HMAC tag, AES-256-GCM decrypt
        MED-->>API: latitude, longitude
        API-->>M: 200 Google Maps link, Cache-Control no-store
    end
    Note over API: rate limit 30 per hour per manager, alert on bursts
```

---

## 12. Sequence: registration and login

Registration is allowlisted (D1). The role comes from the employee record, never from the request.

```mermaid
sequenceDiagram
    autonumber
    participant E as Employee
    participant API as API server
    participant DB as PostgreSQL
    participant MAIL as Email provider

    rect rgb(240, 248, 255)
        Note over E,DB: Registration
        E->>API: POST /auth/register/check with employeeId and code
        API->>DB: read employees, compare code hash
        API->>DB: check no users row exists for this employee
        alt match and not yet registered
            API-->>E: registration token, 10 min
        else anything else
            API-->>E: generic error (same message for all)
        end
        E->>API: POST /auth/register/complete with token, email, password
        API->>DB: insert users (role from employees)
        API->>MAIL: send verification link
        API-->>E: 201 check email
    end

    rect rgb(245, 255, 245)
        Note over E,DB: Login and session
        E->>API: POST /auth/login with employeeId and password
        API->>DB: read users, check lock
        API->>DB: insert sessions (token hash)
        API-->>E: access token (15 min), refresh cookie (HttpOnly, 7 days)
        E->>API: request with access token
        API->>DB: resolve scope (branches, region)
        API-->>E: data within scope only
    end
```

---

## 13. Flow: daily retention job

Runs once per day. Deletes photos 30 days after their activity ends (D11), and never while an activity is open or under dispute.

```mermaid
flowchart TD
    A["Daily job starts<br/>02:00 Cairo time"] --> B["Find media where activity ended<br/>more than 30 days ago"]
    B --> C{"Activity still open,<br/>or dispute open?"}
    C -- yes --> X["Skip, keep photo"]
    C -- no --> D{"Any rows left?"}
    X --> D
    D -- no --> Z["Write count summary to audit log"]
    D -- yes --> E["Delete object from R2"]
    E --> F{"R2 delete succeeded?"}
    F -- no --> G["Keep row, retry next run"]
    F -- yes --> H["Set deleted_at<br/>clear capture_location_enc and tag"]
    G --> Z
    H --> Z
```

The activity card, distance, accuracy, status, products, shares, ending record, and evaluations are kept. Only photos and encrypted location are removed.

---

## 14. Code generation and lookup

How the activity reference and the employee ADCO code are issued. Both use a locked counter so two requests can't receive the same number.

```mermaid
flowchart TD
    subgraph ACT["Activity reference (per-branch counter, section 8.6)"]
        A1["Create activity in open card"] --> A2["BEGIN transaction"]
        A2 --> A3["UPDATE branches: next_activity_no + 1<br/>(row lock)"]
        A3 --> A4{"activity_no between 1 and 999?"}
        A4 -- no --> A5["Reject: branch counter full<br/>alert administrator"]
        A4 -- yes --> A6["Read parent_code and branch_code"]
        A6 --> A7["Build PARENT/BRANCH/Annn"]
        A7 --> A8["INSERT activity<br/>unique index on activity_ref"]
        A8 --> A9["COMMIT and return reference"]
    end
    subgraph EMP["ADCO employee code (per role and region, section 5.4)"]
        E1["Admin creates employee"] --> E2["BEGIN transaction"]
        E2 --> E3["Increment last_seq for role and region<br/>(row lock)"]
        E3 --> E4{"last_seq between 1 and 99?"}
        E4 -- no --> E5["Block: 99 reached<br/>administrator changes format"]
        E4 -- yes --> E6["Build ADCO-RRSSS"]
        E6 --> E7["INSERT employee<br/>unique index on adco_code"]
        E7 --> E8["COMMIT"]
    end
```

```mermaid
flowchart LR
    Q["Search input"] --> N["normalizeName<br/>trim, unify letter variants"]
    N --> R{"Exact code?"}
    R -- "activity_ref" --> IX1[("unique index<br/>activities.activity_ref")]
    R -- "branch_code or parent_code" --> IX2[("unique index<br/>branches / parent_chains")]
    R -- "free text" --> IX3[("pg_trgm GIN index<br/>name_norm")]
    IX1 --> OUT["Result"]
    IX2 --> OUT
    IX3 --> OUT
```

## Maintenance

When the specification changes, update the matching diagram here in the same change. The diagrams should not describe behavior that the specification does not allow.
