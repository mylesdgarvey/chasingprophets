# Operational Mapping: Admin Management Pages

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ❌ Not Yet Implemented (Design Specification)  
**Pages:** `/mgmt/*` (System Management Dashboard and all admin CRUD pages)

---

## ⚠️ IMPORTANT: This is a Design Specification

These pages are **NOT YET IMPLEMENTED** in the codebase. This document describes the **planned operational flows** for administrative functions.

---

## Overview

Admin pages provide full CRUD (Create, Read, Update, Delete) operations for all entities in the system, plus background job management, system monitoring, and data pipeline triggers.

---

## Access Control

**User Role:** Admin only  
**Authorization Check:**
```typescript
// On all /mgmt/* routes
if (!user.groups.includes('admin')) {
  redirect('/dashboard');
  showError('Unauthorized: Admin access required');
}
```

**AWS Cognito Groups:**
- Admin users must be in `admin` Cognito group
- Verified via JWT token claims: `cognito:groups`

---

## Page 1: Admin Dashboard (`/mgmt`)

### Task: View System Management Dashboard

**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - Admin clicks "Admin" or "Management" in sidebar
   - Route: `/mgmt`

2. **API Request**
   ```
   GET /api/admin/dashboard
   ```

3. **Lambda Aggregation**
   - Queries multiple DynamoDB tables to gather stats:
     ```javascript
     const stats = {
       assets: {
         total: await countAssets(),
         active: await countAssets({ isActive: true })
       },
       datasets: {
         total: await countDatasets(),
         live: await countDatasets({ isLive: true })
       },
       dataSlices: {
         total: await countDataSlices(),
         simple: await countDataSlices({ sliceType: 'simple' }),
         compound: await countDataSlices({ sliceType: 'compound' })
       },
       modelFits: {
         total: await countModelFits(),
         fit: await countModelFits({ status: 'fit' }),
         fitting: await countModelFits({ status: 'fitting' }),
         unfit: await countModelFits({ status: 'unfit' }),
         failed: await countModelFits({ status: 'failed' })
       },
       prophets: {
         total: await countProphets(),
         active: await countProphets({ isActive: true })
       },
       users: {
         total: await countUsers(),
         admins: await countUsers({ role: 'admin' })
       }
     };
     ```

4. **UI Rendering**
   
   **Overview Cards (Top Row):**
   - **Assets:** 42 total (38 active)
   - **Datasets:** 45 total (40 live)
   - **Model Fits:** 127 total (98 fit, 3 fitting, 26 failed)
   - **Prophets:** 24 total (18 active)
   
   **Quick Actions Panel:**
   - **Create New Asset** → Button
   - **Upload Dataset** → Button
   - **Create Data Slice** → Button
   - **Trigger Training Job** → Button
   - **Create Prophet** → Button
   
   **Recent Activity Feed:**
   - List of recent admin actions (last 50)
   - Timestamp, User, Action, Entity
   - Example: "10:30 AM - admin@cp.local - Created - Asset: TSLA"
   
   **Background Jobs Panel:**
   - **Active Jobs:** 2
     - Model training: lstm-3layer-aapl-001 (45% complete)
     - Data refresh: Yahoo Finance OHLCV (running)
   - **Recent Completed:** 15 today
   - **Failed Jobs:** 2 (view details)
   
   **System Health:**
   - **API Status:** All endpoints operational ✓
   - **Database:** DynamoDB healthy ✓
   - **Storage:** S3 available (45.2 GB used)
   - **Last Data Update:** 6:05 AM (5 minutes ago)
   
   **Navigation Cards:**
   - Manage Assets →
   - Manage Datasets →
   - Manage Data Slices →
   - Manage Model Scaffolds →
   - Manage Model Fits →
   - Manage Prophets →
   - System Settings →
   - View Logs →

---

## Page 2: Manage Assets (`/mgmt/assets`)

### Task A-2: Assets CRUD (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-2.1 List/Filter/Sort Assets
1. GET `/api/admin/assets?limit=100&includeInactive=true`
2. Table: Ticker, Name, Type, Sector, Exchange, Active, Updated
3. Filters: Type, Sector, Active; Sort: Name, Updated

#### A-2.2 Create Asset
1. Open "Create Asset" form
2. Fields: assetId, name, type, sector, exchange, description, logoUrl, isActive
3. POST `/api/admin/assets` → Validate unique ID → Put to DynamoDB → Audit log

#### A-2.3 Edit Asset
1. Open edit form pre-filled
2. PUT `/api/admin/assets/{assetId}` → Validate changes → Update DynamoDB → Audit log

#### A-2.4 Deactivate/Reactivate Asset
1. PATCH `/api/admin/assets/{assetId}/status` → Toggle isActive → Audit log

#### A-2.5 Delete Asset (Guarded)
1. Dependency check: datasets, prophets, fits
2. If dependencies exist: block hard delete; offer soft delete
3. DELETE `/api/admin/assets/{assetId}` (soft by default)
4. Cascade cleanup jobs (optional)

---

## Page 3: Manage Datasets (`/mgmt/datasets`)

### Task A-3: Datasets CRUD (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-3.1 List/Filter/Sort Datasets
1. GET `/api/admin/datasets?limit=100`
2. Filters: assetId, type, frequency, isLive; Sort: updated

#### A-3.2 Create Dataset (Ingest Source)
1. Form: assetId, type, frequency, name, isLive, s3IngestPath or provider config, columnMapping
2. POST `/api/admin/datasets`
3. Lambda: validate mapping; register dataset; kick off optional initial ingest job (no CSV downloads exposed)

#### A-3.3 Update Dataset Metadata
1. PUT `/api/admin/datasets/{datasetId}` → Edit name, description, isLive, provider settings

#### A-3.4 Replace/Append Data (Admin Ingest)
1. Trigger job to append new records from provider or from S3 staged file (admin-only staging area)
2. POST `/api/admin/datasets/{datasetId}/ingest`

#### A-3.5 Delete Dataset (Guarded)
1. Block if used by slices/fits; require migration or confirmation
2. DELETE `/api/admin/datasets/{datasetId}` (soft by default)

---

## Page 4: Manage Data Slices (`/mgmt/dataslices`)

### Task A-4: Data Slices CRUD (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-4.1 List/Filter/Sort Slices
1. GET `/api/admin/dataslices?limit=100`
2. Filters: datasetId, type (simple/compound)

#### A-4.2 Create Simple Slice
1. Form: datasetId, startDate, endDate, sliceId (auto or custom), metadata, cacheToS3 (optional)
2. POST `/api/admin/dataslices`

#### A-4.3 Create Compound Slice
1. Form: datasetId, components[{startDate,endDate,label}], sliceId, metadata, cacheToS3 (optional)
2. POST `/api/admin/dataslices`

#### A-4.4 Edit Slice
1. PUT `/api/admin/dataslices/{sliceId}` → Modify dates/components/metadata

#### A-4.5 Delete Slice (Guarded)
1. Check usage by model fits; block or confirm
2. DELETE `/api/admin/dataslices/{sliceId}`

#### A-4.6 Cache Management
1. POST `/api/admin/dataslices/{sliceId}/materialize`
2. POST `/api/admin/dataslices/{sliceId}/invalidate-cache`

---

## Page 5: Manage Model Scaffolds (`/mgmt/model-scaffolds`)

### Task A-5: Model Scaffolds CRUD (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-5.1 List Scaffolds
1. GET `/api/admin/model-scaffolds`

#### A-5.2 Create Scaffold (Paste Code)
1. Form fields include: scaffoldId, name, type, category, description, formulaLatex/html, inputShape, outputShape, hyperparameters, inferenceEngine
2. Code editors:
   - Training Code (Python): pasted inline; stored to S3 `scripts/scaffolds/{scaffoldId}.py`
   - Inference Code (client/server): pasted inline; stored to S3 or DB depending on engine
3. POST `/api/admin/model-scaffolds`

#### A-5.3 Edit Scaffold
1. PUT `/api/admin/model-scaffolds/{scaffoldId}`

#### A-5.4 Enable/Disable Scaffold
1. PATCH `/api/admin/model-scaffolds/{scaffoldId}/status`

#### A-5.5 Delete Scaffold (Guarded)
1. Block if used by model fits

---

## Page 6: Manage Model Fits (`/mgmt/model-fits`)

### Task A-6: Model Fits Lifecycle (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-6.1 Create Model Fit (Configure)
1. POST `/api/admin/model-fits` → create with status 'unfit'

#### A-6.2 Trigger Training
1. POST `/api/admin/model-fits/{fitId}/train` → ECS runTask

#### A-6.3 Monitor Training
1. GET `/api/admin/model-fits/{fitId}/status` → fitting progress
2. GET `/api/admin/model-fits/{fitId}/logs` → CloudWatch stream

#### A-6.4 Cancel Training
1. POST `/api/admin/model-fits/{fitId}/cancel`

#### A-6.5 Retrain with Edits
1. PUT `/api/admin/model-fits/{fitId}` → update hyperparameters; retrigger

#### A-6.6 Delete Fit
1. DELETE `/api/admin/model-fits/{fitId}`

#### A-6.7 Bulk Operations
1. Train on all assets for a scaffold + slice

---

## Page 7: Manage Prophets (`/mgmt/prophets`)

### Task A-7: Prophets Lifecycle (Enumerated)

**Status:** ❌ Not Implemented (Planned)

#### A-7.1 Create Prophet
1. POST `/api/admin/prophets` with assetId, modelFitId, forecastMethod, outputMeasure, horizon, isActive, description

#### A-7.2 Edit Prophet
1. PUT `/api/admin/prophets/{prophetId}` (name, description, status)

#### A-7.3 Activate/Deactivate Prophet
1. PATCH `/api/admin/prophets/{prophetId}/status`

#### A-7.4 Trigger Manual Inference
1. POST `/api/admin/prophets/{prophetId}/run`

#### A-7.5 Delete Prophet
1. DELETE `/api/admin/prophets/{prophetId}` (soft by default)

---

## Page 8: Background Jobs & System Management (`/mgmt/jobs`)

### Task A-9: Trigger and Monitor Background Jobs

**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

**Jobs Dashboard:**

1. **Active Jobs Table**
   - Columns: Job Type, Entity, Status, Progress, Started, Actions
   - **Job Types:**
     - Model Training (ECS Fargate task)
     - Data Refresh (EventBridge + Lambda)
     - Prophet Update (Lambda)
     - Bulk Operation (Step Functions)
   - **Actions:**
     - View logs
     - Cancel job
     - View details

2. **Completed Jobs Table**
   - Last 100 jobs
   - Filter by: Status (Success, Failed), Type, Date range
   - View logs for past jobs

3. **Manual Triggers Panel**
   
   **Data Pipeline:**
   - **Trigger Data Refresh:** Button
     - Fetches latest OHLCV from Yahoo Finance
     - Updates all live datasets
     - Estimated time: 5-10 minutes
   
   **Prophet Updates:**
   - **Update All Active Prophets:** Button
     - Runs inference for all active prophets
     - Updates ProphetPerformance table
     - Estimated time: 2-5 minutes
   
   **Maintenance:**
   - **Rebuild Indexes:** Button (DynamoDB)
   - **Clear Cache:** Button (if using ElastiCache)
   - **Generate Reports:** Button (inline reports only; no CSV downloads)

4. **Scheduled Jobs (EventBridge Rules)**
   - List of scheduled tasks
   - Rule Name, Schedule (cron), Last Run, Next Run, Enabled
   - **Daily Data Refresh:** 6:00 AM ET daily
   - **Daily Prophet Update:** 6:30 AM ET daily
   - **Weekly Backup:** Sunday 2:00 AM
   - Toggle enable/disable
   - Edit schedule

**Trigger Manual Job:**

5. **User Clicks "Trigger Data Refresh"**
   - Confirmation modal: "This will fetch latest data for all live datasets. Continue?"
   - If confirmed:
     ```
     POST /api/admin/jobs/data-refresh
     Body: { "datasets": "all" }
     ```

6. **Lambda Processing**
   - Trigger EventBridge event or invoke Lambda directly
   - Create job record in jobs table (if tracking)
   - Return job ID

7. **Data Refresh Lambda Execution**
   - For each live dataset:
     - Call Yahoo Finance API (or other provider)
     - Fetch latest OHLCV data
     - Append to S3 CSV file
     - Update dataset record: `lastUpdated`, `recordCount`, `endDate`
   - Log progress to CloudWatch
   - On completion: Trigger prophet update

8. **Frontend Polling**
   - Poll job status every 5 seconds
   - Update progress bar
   - When complete: Show success message
   - Refresh datasets list

**View Job Logs:**

9. **User Clicks "View Logs" on Job**
   - API call: `GET /api/admin/jobs/{jobId}/logs`
   - Lambda queries CloudWatch Logs:
     ```javascript
     const logs = await cloudwatchLogs.filterLogEvents({
       logGroupName: '/aws/lambda/data-refresh',
       filterPattern: `[job_id="${jobId}"]`,
       startTime: job.startTime,
       endTime: job.endTime
     }).promise();
     ```
   - Returns log entries

10. **UI Displays Logs**
    - Code block with syntax highlighting
    - Auto-scroll to bottom
    - Download logs button
    - Example:
      ```
      2025-11-05 06:00:15 [INFO] Starting data refresh for DJIA
      2025-11-05 06:00:18 [INFO] Fetching from Yahoo Finance...
      2025-11-05 06:00:22 [INFO] Retrieved 1 new record
      2025-11-05 06:00:23 [INFO] Appending to S3: data/djia/ohlcv/daily/latest.csv
      2025-11-05 06:00:25 [INFO] Dataset DJIA_OHLCV_DAILY updated successfully
      ```

---

## Page 9: System Settings (`/mgmt/settings`)

### Task: Configure System-Wide Settings

**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **Settings Categories**
   
   **Data Provider Settings:**
   - Yahoo Finance API Key (if required)
   - Alternative data sources (Alpha Vantage, IEX Cloud, etc.)
   - Rate limits and quotas
   
   **Training Configuration:**
   - Default ECS cluster for training
   - Max concurrent training jobs
   - Default timeout for training (hours)
   - Notification email for training completion/failure
   
   **Prophet Configuration:**
   - Default forecast horizon (days)
   - Default inference engine (tfjs/server)
   - Performance metrics retention (days)
   
   **Storage Configuration:**
   - S3 bucket name
   - S3 lifecycle policies
   - DynamoDB table names (read-only display)
   
   **Notification Settings:**
   - SMTP server for email notifications
   - Slack webhook URL
   - Alert thresholds (e.g., notify if model fit fails)
   
   **Security Settings:**
   - API rate limits
   - Session timeout (minutes)
   - Allowed CORS origins

2. **User Edits Setting**
   - Inline editing or form submission
   - API: `PUT /api/admin/settings/{category}`

3. **Lambda Processing**
   - Update settings in DynamoDB table `ChasingProphets-Settings`
   - Or update AWS Systems Manager Parameter Store
   - Some settings require service restart (notify admin)

4. **Success**
   - Show confirmation
   - If restart required: Display warning and "Restart Service" button

---

## Page 10: Data Initialization & Orchestration

### Task A-10: Seed Dummy Development Data
1. POST `/api/admin/bootstrap/seed-dummy`
2. Seeds: assets, datasets (simulated), slices, scaffolds (with example code), fits (status=fit with dummy metrics), prophets, notifications
3. Uploads dummy scripts/models to S3 (small TFJS or placeholders)

### Task A-11: Clear Dummy Data (Reset)
1. POST `/api/admin/bootstrap/clear-dummy` → Removes seeded items and S3 placeholders
2. Leaves admin account and base configuration intact

### Task A-12: Production Data Load
1. POST `/api/admin/bootstrap/load-production`
2. Config-driven ingestion of real assets/datasets; validates schemas; registers datasets; creates default slices

### Task A-13: Auto-Build Slices/Scaffolds/Fits by Asset
1. POST `/api/admin/orchestrate/build`
2. For each asset: create standard slices → instantiate scaffolds → create fits → trigger training queue

### Task A-14: Script Library & Scheduling
1. CRUD: scripts (store code in S3), parameters, and schedules
2. EventBridge rules management (create/update/enable/disable)
3. Job types: data refresh, prophet updates, backups, reports, integrity checks

---

## Infrastructure Components (Admin Pages)

| Component | Role | Status |
|-----------|------|--------|
| **Admin Dashboard Component** | Overview page | ❌ To be created |
| **ManageAssets Component** | Assets CRUD | ❌ To be created |
| **ManageDatasets Component** | Datasets CRUD + upload | ❌ To be created |
| **ManageDataSlices Component** | Slices CRUD | ❌ To be created |
| **ManageModelScaffolds Component** | Scaffolds CRUD | ❌ To be created |
| **ManageModelFits Component** | Fits CRUD + training | ❌ To be created |
| **ManageProphets Component** | Prophets CRUD | ❌ To be created |
| **JobsMonitor Component** | Background jobs | ❌ To be created |
| **SystemSettings Component** | Config UI | ❌ To be created |
| **API Gateway** | `/api/admin/*` endpoints | ❌ To be created |
| **Lambda: Admin CRUD** | All entity operations | ❌ To be created |
| **Lambda: triggerJobs** | Manual job triggers | ❌ To be created |
| **Lambda: getJobStatus** | Job monitoring | ❌ To be created |
| **Lambda: dataRefresh** | Daily data pipeline | ❌ To be created |
| **Lambda: prophetUpdate** | Daily prophet inference | ❌ To be created |
| **EventBridge** | Scheduled rules | ✅ Available (AWS service) |
| **ECS Fargate** | Training jobs | ❌ To be created |
| **CloudWatch Logs** | Job logging | ✅ Available |
| **DynamoDB: All Tables** | Entity storage | 🟡 Partial (2 tables exist) |
| **S3: chasing-prophets** | Data and model storage | 🟡 Partial (some data exists) |

---

## Security Considerations

**Admin-Only Access:**
- All `/mgmt/*` routes protected by role check
- API Gateway authorizer validates `cognito:groups` includes `admin`
- Frontend hides admin nav links for non-admin users

**Sensitive Operations:**
- Delete operations require confirmation modal
- Irreversible actions (hard delete) require password re-entry
- Audit log all admin actions to DynamoDB table

**Rate Limiting:**
- Bulk operations limited (max 100 entities at once)
- Training job queue (max 5 concurrent)
- Data refresh throttled (once per hour max)

**Data Validation:**
- CSV uploads validated before processing
- SQL injection protection (parameterized queries)
- File size limits enforced (50 MB for datasets, 5 MB for scripts)

---

## Audit Logging

**Admin Actions Table:**
- Table: `ChasingProphets-AdminAuditLog`
- Attributes:
  - `logId` (PK): UUID
  - `timestamp` (SK): ISO timestamp
  - `userId`: Admin user ID
  - `email`: Admin email
  - `action`: 'create' | 'update' | 'delete' | 'trigger'
  - `entityType`: 'asset' | 'dataset' | 'prophet' | etc.
  - `entityId`: ID of affected entity
  - `changes`: JSON (before/after values)
  - `ipAddress`: Request IP
  - `userAgent`: Browser info

**Usage:**
- All admin mutations logged automatically
- Queryable by date, user, entity type
- View in "Audit Log" page (`/mgmt/audit`)
- Exports: Inline reports only in alpha (no CSV downloads)

---

## End of Admin Management Pages Operational Mapping
