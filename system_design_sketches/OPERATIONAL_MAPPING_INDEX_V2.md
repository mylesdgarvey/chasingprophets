# Operational Mapping Index (Updated)

**Version:** 2.0  
**Date:** November 5, 2025  
**Project:** Chasing Prophets  
**Purpose:** Master index for all operational flow documentation

---

## Overview

This directory contains detailed operational mappings that describe the **exact data flow** for every user task in the Chasing Prophets application. Each document traces the complete journey of data from user action through all system components (frontend, API Gateway, Lambda, DynamoDB, S3) to the final result.

Related: For a cross-cutting map of AWS resources (APIs, Lambdas, DynamoDB tables, S3 prefixes, ECS, EventBridge), see:
- `RESOURCE_INVENTORY.md`

---

## Document Inventory

| File | Pages Covered | Task Count | Status |
|------|---------------|------------|---------|
| **OPERATIONAL_MAPPING_LOGIN.md** | Login, Password Reset | 3 | ✅ Complete |
| **OPERATIONAL_MAPPING_DASHBOARD.md** | Dashboard | 3 | 🟡 Partial (test data) |
| **OPERATIONAL_MAPPING_ASSETS.md** | Assets List, Asset Detail | 6 | ✅ Complete |
| **OPERATIONAL_MAPPING_SETTINGS.md** | Settings (Theme, Profile) | 2 | 🟡 Partial |
| **OPERATIONAL_MAPPING_GLOBAL_UI.md** | Navigation, Search, Notifications, Logout | 4 | ✅ Complete |
| **OPERATIONAL_MAPPING_SIGNUP.md** | Signup, Verify, Forgot/Reset | 6 | ❌ Not Implemented |
| **OPERATIONAL_MAPPING_PROPHETS.md** | Prophets List, Prophet Detail | 3 | ❌ Not Implemented |
| **OPERATIONAL_MAPPING_DATASETS_SLICES.md** | Datasets, Data Slices (4 pages) | 8 | ❌ Not Implemented |
| **OPERATIONAL_MAPPING_MODELS.md** | Model Scaffolds, Model Fits | 6 | ❌ Not Implemented |
| **OPERATIONAL_MAPPING_ADMIN.md** | Admin Management (9 pages) | 9 | ❌ Not Implemented |

**Total Tasks Documented:** 49  
**Implementation Status:** 14 Complete (Implemented), 4 Partial, 31 Planned (Design Specs)

---

## Quick Task Reference

### Implemented Features

| Task ID | Task Name | Page | Status | File |
|---------|-----------|------|--------|------|
| G-1 | Navigate to Login | Login | ✅ | LOGIN |
| G-2 | Submit Credentials | Login | ✅ | LOGIN |
| G-3 | New Password Challenge | Login | ✅ | LOGIN |
| U-1 | View Dashboard | Dashboard | 🟡 | DASHBOARD |
| U-2 | Market Summary Metrics | Dashboard | 🟡 | DASHBOARD |
| U-3 | Prophet Console | Dashboard | 🟡 | DASHBOARD |
| U-4 | Navigate via Sidebar | Global | ✅ | GLOBAL_UI |
| U-5 | Global Asset Search | Global | ✅ | GLOBAL_UI |
| U-6 | View Notifications | Global | ✅ | GLOBAL_UI |
| U-7 | Logout | Global | ✅ | GLOBAL_UI |
| U-8 | Browse Assets List | Assets | ✅ | ASSETS |
| U-9 | Filter Assets by Letter | Assets | ✅ | ASSETS |
| U-10 | View Asset Detail | Assets | ✅ | ASSETS |
| U-11 | Toggle Chart Type | Assets | ✅ | ASSETS |
| U-12 | Toggle Indicators | Assets | ✅ | ASSETS |
| U-13 | Change Time Window | Assets | ✅ | ASSETS |
| U-14 | Change Theme | Settings | ✅ | SETTINGS |
| U-15 | Edit Profile | Settings | 🟡 | SETTINGS |

### Planned Features (Design Specifications)

| Task ID | Task Name | Page | Status | File |
|---------|-----------|------|--------|------|
| U-16 | Browse Prophets List | Prophets | ❌ | PROPHETS |
| U-17 | View Prophet Detail | Prophets | ❌ | PROPHETS |
| U-18 | Evaluate Prophet Predictions | Prophets | ❌ | PROPHETS |
| U-19 | Browse Datasets | Datasets | ❌ | DATASETS_SLICES |
| U-20 | View Dataset Detail | Datasets | ❌ | DATASETS_SLICES |
| U-21 | Browse Data Slices | Data Slices | ❌ | DATASETS_SLICES |
| U-22 | View Data Slice Detail | Data Slices | ❌ | DATASETS_SLICES |
| U-23 | Create Simple Data Slice | Data Slices | ❌ | DATASETS_SLICES |
| U-24 | Create Compound Data Slice | Data Slices | ❌ | DATASETS_SLICES |
| U-26 | Preview Data Slice | Data Slices | ❌ | DATASETS_SLICES |
| U-27 | Browse Model Scaffolds | Model Scaffolds | ❌ | MODELS |
| U-28 | View Model Scaffold Detail | Model Scaffolds | ❌ | MODELS |
| U-29 | Browse Model Fits | Model Fits | ❌ | MODELS |
| U-30 | View Model Fit Detail | Model Fits | ❌ | MODELS |
| U-31 | View Model Training Metrics | Model Fits | ❌ | MODELS |
| U-32 | Download Model File | Model Fits | ❌ | MODELS |
| A-1 | Admin Dashboard | Admin | ❌ | ADMIN |
| A-2 | Manage Assets (CRUD) | Admin | ❌ | ADMIN |
| A-3 | Upload Dataset | Admin | ❌ | ADMIN |
| A-4 | Manage Data Slices | Admin | ❌ | ADMIN |
| A-5 | Manage Model Scaffolds | Admin | ❌ | ADMIN |
| A-6 | Train Model Fit | Admin | ❌ | ADMIN |
| A-7 | Manage Prophets | Admin | ❌ | ADMIN |
| A-8 | System Settings | Admin | ❌ | ADMIN |
| A-9 | Monitor Background Jobs | Admin | ❌ | ADMIN |

---

## Quick Reference: API Endpoints

### Implemented Endpoints

No server endpoints are implemented in this repo. The frontend uses Cognito directly for auth and either local JSON or direct DynamoDB access in the browser (when credentials are provided).

### Planned Endpoints

| Endpoint | Method | Purpose | Lambda | Status |
|----------|--------|---------|--------|--------|
| `/api/prophets` | GET | List prophets | getProphets | ❌ |
| `/api/prophets/{id}` | GET | Prophet detail | getProphet | ❌ |
| `/api/prophets/{id}/predictions` | GET | Prophet predictions | getProphetPredictions | ❌ |
| `/api/datasets` | GET | List datasets | getDatasets | ❌ |
| `/api/datasets/{id}` | GET | Dataset detail | getDataset | ❌ |
| `/api/dataslices` | GET | List data slices | getDataSlices | ❌ |
| `/api/dataslices/{id}` | GET | Slice detail | getDataSlice | ❌ |
| `/api/model-scaffolds` | GET | List scaffolds | getModelScaffolds | ❌ |
| `/api/model-scaffolds/{id}` | GET | Scaffold detail | getModelScaffold | ❌ |
| `/api/model-fits` | GET | List model fits | getModelFits | ❌ |
| `/api/model-fits/{id}` | GET | Fit detail | getModelFit | ❌ |
| `/api/model-fits/{id}/metrics` | GET | Training metrics | getModelFitMetrics | ❌ |
| `/api/admin/*` | * | Admin operations | adminCRUD | ❌ |
| `/api/admin/jobs/*` | * | Job management | jobManager | ❌ |

---

## DynamoDB Tables Summary

| Table Name | Purpose | Primary Key | Sort Key | Status |
|------------|---------|-------------|----------|--------|
| ChasingProphets-Assets | Asset metadata | ticker | - | 🟡 Scripted (FE direct) |
| ChasingProphets-AssetPrices | Historical prices | ticker | date | 🟡 Scripted (FE direct) |
| ChasingProphets-Notifications | User notifications | userId | notificationId | 🟡 Scripted (FE direct) |
| ChasingProphets-Users | User profiles | userId | - | ❌ Planned |
| ChasingProphets-Prophets | Prophet configs | prophetId | - | ❌ Planned |
| ChasingProphets-ProphetPerformance | Prophet predictions | prophetId | timestamp | ❌ Planned |
| ChasingProphets-Datasets | Dataset metadata | datasetId | - | ❌ Planned |
| ChasingProphets-DataSlices | Data slice configs | sliceId | - | ❌ Planned |
| ChasingProphets-ModelScaffolds | Model architectures | scaffoldId | - | ❌ Planned |
| ChasingProphets-ModelFits | Trained models | fitId | - | ❌ Planned |
| ChasingProphets-AdminAuditLog | Admin action log | logId | timestamp | ❌ Planned |

---

## S3 Data Organization (Planned)

**Bucket:** `chasing-prophets`

```
chasing-prophets/
  data/
    {ticker}_prices.csv                            ❌ Historical OHLCV data (planned; not wired)
    {assetId}/{type}/{frequency}/raw_{ts}.csv      ❌ Uploaded datasets (planned)
    slices/{sliceId}.csv                           ❌ Cached data slices (planned)
  models/
    {fitId}/                                       ❌ Trained models (planned)
      model.h5                                     ❌ TensorFlow model file
      model.json                                   ❌ TensorFlow.js format
      weights.bin                                  ❌ Model weights
      metadata.json                                ❌ Training metadata
  scripts/
    scaffolds/{scaffoldId}/                        ❌ Training scripts (planned)
      train.py                                     ❌ Python training script
      requirements.txt                             ❌ Python dependencies
```

---

## Document Structure

Each operational mapping document follows this structure:

### 1. Header
- Version, date, status
- Page and user role scope
- Implementation status warning (if not implemented)

### 2. Task Sections
Each task includes:
- **Task ID:** Unique identifier (e.g., U-8, G-2, A-3)
- **Task Name:** Brief description
- **Status:** ✅ Implemented, 🟡 Partial, ❌ Not Implemented
- **Operational Flow:** Step-by-step data flow (15-20 detailed steps)

### 3. Component Details
- Infrastructure component summary table
- DynamoDB table structures with sample records
- S3 bucket/key paths
- API endpoints
- Lambda functions
- ECS task definitions (for training jobs)

### 4. Data Examples
- Sample API requests/responses
- DynamoDB record structures (JSON)
- LocalStorage keys/values
- CSV file formats
- Error response formats

### 5. Performance & Security
- Expected response times
- Error handling strategies
- Security considerations
- Accessibility features
- Audit logging

---

## Key Infrastructure Components

### Frontend
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State:** Context API (Auth, Theme, Notifications)
- **Charts:** Plotly.js
- **ML Inference:** TensorFlow.js (planned)
- **Build:** Vite
- **Hosting:** AWS Amplify (CloudFront + S3)

### Backend
- **API:** AWS API Gateway (REST) — not implemented
- **Compute:** AWS Lambda (Python 3.11 / Node.js 18) — not implemented
- **Training:** AWS ECS Fargate (planned)
- **Auth:** AWS Cognito User Pools
- **Database:** AWS DynamoDB (9 tables planned; 3 available via local script; used directly by FE)
- **Storage:** AWS S3 (`chasing-prophets` bucket)
- **Monitoring:** AWS CloudWatch Logs
- **Orchestration:** AWS EventBridge (scheduled jobs, planned)
- **Workflow:** AWS Step Functions (complex workflows, planned)

### Machine Learning Pipeline (Planned)
- **Data Preparation:** Lambda functions → Data slices
- **Model Training:** ECS Fargate tasks running Python/TensorFlow
- **Model Storage:** S3 (models/ prefix)
- **Inference Engine:** 
  - Browser: TensorFlow.js (lightweight models)
  - Server: Lambda with TensorFlow (complex models)
- **Performance Tracking:** DynamoDB ProphetPerformance table

---

## Data Flow Patterns

### Pattern 1: Simple Read (Current FE Implementation)
```
User Action → FE Service → (a) Local JSON fallback OR (b) DynamoDB SDK Query/Get → JSON → Component Render
```
**Examples:** View asset detail, view notifications (no API layer yet)

### Pattern 2: Search/Filter (Current FE Implementation)
```
User Input (Debounced) → In-memory filter on loaded assets → UI Update
```
**Examples:** Asset search, filter assets by letter (no server search yet)

### Pattern 3: Inline Data Preview (Current FE Implementation)
```
User Click → FE loads local JSON or DynamoDB results → UI Table/Chart (no CSV download)
```
**Examples:** Price history chart (datasets/slices previews not implemented)

### Pattern 4: State Change with Persistence (Implemented)
```
User Selection → Context Update → LocalStorage Save → CSS Apply → UI Re-render
```
**Examples:** Change theme, toggle sidebar

### Pattern 5: CRUD Operations (Planned)
```
User Form Submit → API Gateway → Lambda → DynamoDB Put/Update/Delete → Success Response → UI Refresh
```
**Examples:** Create asset (admin), edit prophet, delete data slice

### Pattern 6: File Upload (Planned)
```
User File Select → Multipart Upload → API Gateway → Lambda → S3 PutObject → Parse CSV → DynamoDB Put → Success
```
**Examples:** Upload dataset CSV, upload training script

### Pattern 7: Background Job (Planned)
```
User Trigger → API Gateway → Lambda → ECS RunTask → DynamoDB Status Update → EventBridge Monitor → Completion Webhook
```
**Examples:** Train model fit, refresh all datasets

### Pattern 8: ML Inference (Planned)
---

## Current vs Planned: At-a-Glance

- Auth: Cognito user pool in FE (current) → Add API authorizers and role-based guards (planned)
- Assets & Prices: FE local JSON / direct DynamoDB (current) → API Gateway + Lambdas (planned)
- Notifications: FE direct DynamoDB (current) → API endpoints with auth (planned)
- Datasets/Slices/Models/Prophets: Not implemented (current) → Read-only APIs first, then admin CRUD (planned)
- Storage: No S3 wiring (current) → S3 for datasets/models; inline preview only (planned)

```
Scheduled Event → Lambda → Get Model from S3 → TensorFlow Predict → DynamoDB Put (Prediction) → User View
```
**Examples:** Daily prophet predictions

---

## Navigation Map

### Public Routes
- `/login` → LOGIN.md (G-1, G-2, G-3)
- `/signup` → SIGNUP.md (S-1, S-2)
- `/verify` → SIGNUP.md (S-3, S-4)
- `/forgot-password` → SIGNUP.md (S-5)
- `/reset-password` → SIGNUP.md (S-6)

### User Routes (Authenticated)
- `/dashboard` → DASHBOARD.md (U-1, U-2, U-3)
- `/assets` → ASSETS.md (U-8, U-9)
- `/assets/:assetId` → ASSETS.md (U-10, U-11, U-12, U-13)
- `/prophets` → PROPHETS.md (U-16)
- `/prophets/:prophetId` → PROPHETS.md (U-17, U-18)
- `/datasets` → DATASETS_SLICES.md (U-19)
- `/datasets/:datasetId` → DATASETS_SLICES.md (U-20)
- `/dataslices` → DATASETS_SLICES.md (U-21, U-23, U-24)
- `/dataslices/:sliceId` → DATASETS_SLICES.md (U-22, U-26)
- `/model-scaffolds` → MODELS.md (U-27)
- `/model-scaffolds/:scaffoldId` → MODELS.md (U-28)
- `/model-fits` → MODELS.md (U-29)
- `/model-fits/:fitId` → MODELS.md (U-30, U-31, U-32)
- `/settings` → SETTINGS.md (U-14, U-15)
- **Global:** Sidebar, Search, Notifications → GLOBAL_UI.md (U-4, U-5, U-6, U-7)

### Admin Routes (Admin Role Only)
- `/mgmt` → ADMIN.md (A-1)
- `/mgmt/assets` → ADMIN.md (A-2)
- `/mgmt/datasets` → ADMIN.md (A-3)
- `/mgmt/dataslices` → ADMIN.md (A-4)
- `/mgmt/model-scaffolds` → ADMIN.md (A-5)
- `/mgmt/model-fits` → ADMIN.md (A-6)
- `/mgmt/prophets` → ADMIN.md (A-7)
- `/mgmt/settings` → ADMIN.md (A-8)
- `/mgmt/jobs` → ADMIN.md (A-9)

---

## Implementation Roadmap

### Phase 1: Foundation (Complete)
- ✅ Authentication (Cognito)
- ✅ Asset browsing and detail
- ✅ Price chart visualization
- ✅ Theme system
- ✅ Navigation and search
- ✅ Notifications

### Phase 2: Data Management (Planned)
- ❌ Dataset upload and management
- ❌ Data slice creation (simple and compound)
- ❌ CSV export functionality (de-scoped in alpha: no CSV downloads; use inline preview)
- ❌ Data quality validation

### Phase 3: Model Training (Planned)
- ❌ Model scaffold creation
- ❌ Training script upload
- ❌ ECS training job orchestration
- ❌ Training metrics visualization
- ❌ Model fit management

### Phase 4: Prophet Engine (Planned)
- ❌ Prophet creation
- ❌ TensorFlow.js inference
- ❌ Prediction history tracking
- ❌ Performance metrics
- ❌ Prophet comparison tools

### Phase 5: Admin Tools (Planned)
- ❌ Admin dashboard
- ❌ CRUD operations for all entities
- ❌ Background job monitoring
- ❌ System logs viewer
- ❌ Audit trail

### Phase 6: Advanced Features (Future)
- ❌ Real-time WebSocket notifications
- ❌ Advanced backtesting
- ❌ Portfolio simulation
- ❌ Social features (sharing prophets)
- ❌ API for external integrations

---

## Document Maintenance

**When to Update:**
- New feature implemented → Create/update operational mapping
- API endpoint changed → Update endpoint tables
- DynamoDB schema changed → Update table summaries
- S3 structure changed → Update data organization
- Task flow modified → Update step-by-step flows

**Review Frequency:**
- After each sprint/iteration
- Before major releases
- When onboarding new developers

**Ownership:**
- **Technical Lead:** Overall accuracy and completeness
- **Backend Engineers:** Lambda functions, DynamoDB, S3 flows
- **Frontend Engineers:** React components, UI interactions
- **DevOps:** Infrastructure, ECS, EventBridge configurations

---

## Related Documentation

- `SYSTEM_DESIGN.md` - High-level architecture
- `FRONTEND_SCREENS.md` - UI mockups and wireframes
- `DATABASE_SCHEMA.md` - DynamoDB table details
- `CODE_AUDIT.md` - Current implementation status
- `USER_INTERACTIONS_AND_TASKS.md` - User stories and requirements
- `WIDGET_SYSTEM.md` - Dashboard widget system (planned)
- `RESOURCE_INVENTORY.md` - Resource inventory (APIs, tables, S3, Lambdas, schedules)

---

## End of Index

**Last Updated:** November 5, 2025  
**Documentation Complete:** 9 of 9 operational mapping files created  
**Coverage:** 44 tasks across all user roles and pages
