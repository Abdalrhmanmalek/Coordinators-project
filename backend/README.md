# ADCO Field Operations System — Backend Services & Architecture

> **Architecture Standard:** PostgreSQL 16 + RESTful API Contract  
> **Company:** (ADCO) شركة الإسكندرية للكيماويات والمنظفات  
> **Status:** Specification & API Schema Ready

---

## 🏛️ Overview
This directory houses the backend contracts, data architecture, and service specifications for the ADCO Field Operations Platform.

The backend provides:
1. **Multi-Tenant / 3-Tier RBAC Access Control:**
   - Field Coordinators (`coordinator`)
   - Coordinator Supervisors (`coordinator_supervisor`)
   - Marketing Managers (`marketing_manager`)
2. **PostgreSQL 16 Enterprise Relational Schema:**
   - Employees, Branches, Clients, Activities, Review Sessions, Evaluation Logs, Audit Records.
3. **Field Image & Media Pipeline:**
   - Web-optimized AVIF ingestion, EXIF preservation, GPS coordinate verification, SHA-256 deduplication.
4. **Bayesian Evaluation & Scorecard Engine:**
   - 100-point 4-pillar scoring matrix ($40/20/25/15$), anti-cheat deductions, and volume-weighted coordinator leaderboard rankings.

---

## 📁 Backend Directory Structure
```
backend/
├── docs/
│   ├── ADCO-Final-System-Design.md   # Complete system architecture & database schema specification
│   └── ADCO-System-Diagrams.md       # Sequence, ERD, and workflow state diagrams
└── README.md                         # This architecture guide
```

---

## 🔗 Architecture References
- Complete Database & API Schema: [ADCO-Final-System-Design.md](file:///e:/project_build/adco-field-app/backend/docs/ADCO-Final-System-Design.md)
- Workflows & Entity Diagrams: [ADCO-System-Diagrams.md](file:///e:/project_build/adco-field-app/backend/docs/ADCO-System-Diagrams.md)
- REST Endpoint Inventory: [endpoints.md](file:///e:/project_build/adco-field-app/docs/endpoints.md)
- Evaluation & Scoring Spec: [evaluation.md](file:///e:/project_build/adco-field-app/docs/evaluation.md)

