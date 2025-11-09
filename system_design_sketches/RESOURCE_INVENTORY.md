# Resource Inventory

Date: November 5, 2025

This document enumerates all application resources (data, app, API, infrastructure) with implementation status and ownership. It serves as a build checklist and traceability map.

---

## Legend

- Status: ✅ Implemented | 🟡 Partial | ❌ Planned
- Owner: FE (Frontend), BE (Backend), DevOps (Infra)

---

## 1. Identity & Access

| Resource | Details | Status | Owner | Notes |
|----------|---------|--------|-------|-------|
| Cognito User Pool | User authentication | 🟡 | DevOps | Frontend integrates via amazon-cognito-identity-js; requires env config; no IaC in repo |
| Cognito App Client | SPA client | 🟡 | DevOps | Used by FE; configuration via env only; no provisioning code in repo |
| Cognito Groups | admin | ❌ | DevOps | Not enforced in code; no group-based checks present |
| IAM Roles/Policies | Lambda, API, ECS, S3, DynamoDB | ❌ | DevOps | Not provisioned in repo; FE currently uses access keys if provided |

---

## 2. API Layer (REST)

| API | Resource | Methods | Lambda | Status | Owner |
|-----|----------|---------|--------|--------|-------|
| API Gateway | /assets | GET | getAssets | ❌ | BE |
| API Gateway | /assets/{id} | GET | getAsset | ❌ | BE |
| API Gateway | /assets/{id}/prices | GET | getAssetPrices | ❌ | BE |
| API Gateway | /assets/search | GET | searchAssets | ❌ | BE |
| API Gateway | /notifications | GET | getNotifications | ❌ | BE |
| API Gateway | /notifications/{id} | PUT | updateNotification | ❌ | BE |
| API Gateway | /prophets | GET | getProphets | ❌ | BE |
| API Gateway | /prophets/{id} | GET | getProphet | ❌ | BE |
| API Gateway | /prophets/{id}/predictions | GET | getProphetPredictions | ❌ | BE |
| API Gateway | /datasets | GET | getDatasets | ❌ | BE |
| API Gateway | /datasets/{id} | GET | getDataset | ❌ | BE |
| API Gateway | /dataslices | GET | getDataSlices | ❌ | BE |
| API Gateway | /dataslices/{id} | GET | getDataSlice | ❌ | BE |
| API Gateway | /model-scaffolds | GET | getModelScaffolds | ❌ | BE |
| API Gateway | /model-scaffolds/{id} | GET | getModelScaffold | ❌ | BE |
| API Gateway | /model-fits | GET | getModelFits | ❌ | BE |
| API Gateway | /model-fits/{id} | GET | getModelFit | ❌ | BE |
| API Gateway | /admin/* | POST/PUT/PATCH/DELETE/GET | admin* | ❌ | BE |

Note: No API Gateway or Lambda endpoints are implemented in this repo. Current frontend uses either local static data or direct DynamoDB access via AWS SDK in the browser when credentials are provided.

---

## 3. Compute (Functions/Containers)

| Type | Name (suggested) | Purpose | Status | Owner |
|------|-------------------|---------|--------|-------|
| Lambda | getAssets | List assets | ❌ | BE |
| Lambda | getAsset | Get asset detail | ❌ | BE |
| Lambda | getAssetPrices | Price history | ❌ | BE |
| Lambda | searchAssets | Search assets | ❌ | BE |
| Lambda | getNotifications | List notifications | ❌ | BE |
| Lambda | updateNotification | Update notification | ❌ | BE |
| Lambda | getProphets | Prophets list | ❌ | BE |
| Lambda | getProphet | Prophet detail | ❌ | BE |
| Lambda | getProphetPredictions | Predictions | ❌ | BE |
| Lambda | getDatasets | Datasets list | ❌ | BE |
| Lambda | getDataset | Dataset detail | ❌ | BE |
| Lambda | getDataSlices | Data slices list | ❌ | BE |
| Lambda | getDataSlice | Slice detail | ❌ | BE |
| Lambda | getModelScaffolds | Scaffolds list | ❌ | BE |
| Lambda | getModelScaffold | Scaffold detail | ❌ | BE |
| Lambda | getModelFits | Model fits list | ❌ | BE |
| Lambda | getModelFit | Model fit detail | ❌ | BE |
| Lambda | adminAssets* | Admin asset CRUD | ❌ | BE |
| Lambda | adminDatasets* | Admin dataset CRUD/ingest | ❌ | BE |
| Lambda | adminDataSlices* | Admin slice CRUD/cache | ❌ | BE |
| Lambda | adminModelScaffolds* | Scaffold CRUD/code | ❌ | BE |
| Lambda | adminModelFits* | Fit lifecycle | ❌ | BE |
| Lambda | adminProphets* | Prophet lifecycle | ❌ | BE |
| Lambda | adminBootstrap* | Seed/Clear/Load | ❌ | BE |
| Lambda | adminOrchestrate* | Build pipeline | ❌ | BE |
| Lambda | jobManager | Trigger jobs | ❌ | BE |
| ECS Fargate | training-cluster | Train models | ❌ | DevOps |
| ECS TaskDef | model-trainer | TensorFlow container | ❌ | DevOps |

---

## 4. Data Stores

| Store | Name | Key Schema | GSIs | Status | Owner | Notes |
|-------|------|------------|------|--------|-------|-------|
| DynamoDB | ChasingProphets-Assets | PK: ticker | MarketIndex (market) | 🟡 | BE | FE reads directly via AWS SDK if creds; created via local script |
| DynamoDB | ChasingProphets-AssetPrices | PK: ticker, SK: date | - | 🟡 | BE | FE reads directly via AWS SDK if creds; created via local script |
| DynamoDB | ChasingProphets-Notifications | PK: userId, SK: notificationId | - | 🟡 | BE | FE reads/writes directly via AWS SDK if creds; created via local script |
| DynamoDB | ChasingProphets-Users | PK: userId | EmailIndex | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-Datasets | PK: datasetId | assetId-index | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-DataSlices | PK: sliceId, SK: version | datasetId-index | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-ModelScaffolds | PK: scaffoldId | - | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-ModelFits | PK: modelFitId | scaffoldId-index; assetId-status-index | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-Prophets | PK: prophetId | - | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-ProphetPerformance | PK: prophetId, SK: timestamp | period-index (optional) | ❌ | BE | Planned |
| DynamoDB | ChasingProphets-AdminAuditLog | PK: logId, SK: timestamp | user-index | ❌ | BE | Planned |

---

## 5. Storage

| Bucket/Prefix | Purpose | Status | Owner | Notes |
|---------------|---------|--------|-------|-------|
| S3 `chasing-prophets/data/` | Live datasets (OHLCV etc.) | ❌ | DevOps | Not wired in code; FE uses `src/data/generatedPrices.json` fallback |
| S3 `chasing-prophets/data/slices/` | Cached data slices (materialized) | ❌ | DevOps | Planned |
| S3 `chasing-prophets/models/{fitId}/` | Trained model artifacts | ❌ | DevOps | Planned (tfjs/server formats) |
| S3 `chasing-prophets/scripts/scaffolds/` | Training/inference scripts | ❌ | DevOps | Planned |
| S3 `chasing-prophets/bootstrap/` | Dummy data seeds, staging | ❌ | DevOps | Planned |

---

## 6. Schedules & Jobs

| Type | Name | Schedule | Purpose | Status | Owner |
|------|------|----------|---------|--------|-------|
| EventBridge Rule | daily-data-refresh | 06:00 ET daily | Append latest OHLCV | ❌ | DevOps |
| EventBridge Rule | daily-prophet-update | 06:30 ET daily | Inference + performance update | ❌ | DevOps |
| EventBridge Rule | weekly-backup | Sun 02:00 | Snapshot data stores | ❌ | DevOps |
| EventBridge Rule | integrity-check | Hourly | Health and consistency checks | ❌ | DevOps |

---

## 7. Frontend (Routes/Components)

| Route | Component | Status | Owner |
|-------|-----------|--------|-------|
| /login | Login | ✅ | FE |
| /signup | Signup | ❌ | FE |
| /verify | Verify | ❌ | FE |
| /forgot-password | ForgotPassword | ❌ | FE |
| /reset-password | ResetPassword | ❌ | FE |
| /dashboard | Dashboard | 🟡 | FE |
| /assets | Assets | ✅ | FE |
| /assets/:assetId | AssetDetail | ✅ | FE |
| /prophets | Prophets | ❌ | FE |
| /prophets/:prophetId | ProphetDetail | ❌ | FE |
| /datasets | Datasets | ❌ | FE |
| /datasets/:datasetId | DatasetDetail | ❌ | FE |
| /dataslices | DataSlices | ❌ | FE |
| /dataslices/:sliceId | DataSliceDetail | ❌ | FE |
| /model-scaffolds | ModelScaffolds | ❌ | FE |
| /model-scaffolds/:scaffoldId | ScaffoldDetail | ❌ | FE |
| /model-fits | ModelFits | ❌ | FE |
| /model-fits/:fitId | ModelFitDetail | ❌ | FE |
| /settings | Settings | 🟡 | FE |
| /mgmt | AdminDashboard | ❌ | FE |
| /mgmt/* | Admin Sections | ❌ | FE |

---

## 8. Mapping: Features → Resources

Planned target state (server-backed):
- Assets browsing → API: getAssets/getAsset/getAssetPrices; DB: Assets/AssetPrices; S3 data
- Global search → API: searchAssets; DB: Assets
- Datasets listing → API: getDatasets; DB: Datasets
- Data slice preview → API: getDataSlice; DB: DataSlices; optional S3 cache
- Model scaffolds list → API: getModelScaffolds; DB: ModelScaffolds; S3 scripts
- Model fits list/detail → API: getModelFits/getModelFit; DB: ModelFits; S3 models
- Prophets list/detail → API: getProphets/getProphet/getProphetPredictions; DB: Prophets/ProphetPerformance; S3 models (tfjs/server)
- Admin CRUD → API: /admin/* family; Lambdas per object; AdminAuditLog
- Training → ECS cluster + model-trainer TaskDef; S3 models; ModelFits table
- Scheduling → EventBridge rules; jobManager Lambda

Current code reality (alpha):
- Assets browsing → FE loads `src/data/generatedPrices.json` (no API); if env AWS creds present, FE queries DynamoDB directly via @aws-sdk
- Global search → In-memory prefix search over assets loaded in FE
- Notifications → FE queries/updates DynamoDB table `ChasingProphets-Notifications` directly if creds; otherwise returns empty
- Auth → amazon-cognito-identity-js in FE; requires env pool/client; no server authorizers
- Charts → Plotly.js rendering from local JSON or direct DynamoDB query results
- Admin/Models/Datasets/Slices/Prophets → Not implemented in FE; no backend

---

## 9. Reality Check & Disparity Notes

- Backend APIs (API Gateway + Lambda): Not present. FE currently accesses DynamoDB directly or uses local JSON; replace with secure API layer.
- Data Stores: Only Assets, AssetPrices, Notifications are referenced and can be created via scripts. All other tables are planned.
- Storage (S3): Not wired; local JSON used. Align code to read via API-backed S3/DB reads.
- AuthZ (roles/groups): Not enforced beyond an email check; implement Cognito group-based authorization on API and FE guards.
- Observability & Schedules: No EventBridge/CloudWatch wiring; add scheduled jobs and monitoring.

## 10. Next Steps (Actionable)

1) Introduce API Gateway + Lambda for assets, prices, notifications; remove browser-side AWS credentials usage.  
2) Add Cognito authorizer to APIs; propagate groups/roles; enforce admin-only routes.  
3) Migrate FE data access: swap `services/assets.ts` and `services/notifications.ts` to use API endpoints.  
4) Stand up DynamoDB tables via IaC (CDK/Terraform) and align schemas (ticker PK; AssetPrices composite key).  
5) Implement datasets/slices/scaffolds/fits/prophets read-only pages; add corresponding GET endpoints.  
6) Add training orchestration (ECS) and daily prophet updates (EventBridge); write to ProphetPerformance.  
7) Keep “no CSV download” policy; provide inline previews and optional admin-only report views later.  

---

End of Resource Inventory
