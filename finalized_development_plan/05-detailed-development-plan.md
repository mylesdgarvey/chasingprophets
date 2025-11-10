# Detailed Development Plan — Phase-by-Phase Execution

**Date:** November 6, 2025  
**Status:** Phase 4 (Model Pipeline) In Progress  

This document provides the complete phase-by-phase execution plan for building Chasing Prophets Alpha. It covers infrastructure setup, data loading, service implementation, model pipeline automation, admin UI, client visualizations, and scheduled execution.

**Current Implementation Context:**
- ✅ **Phase 0-3 Complete**: AWS infrastructure, real data (DJIA/SPX), service layer
- 🔄 **Phase 4 In Progress**: Model pipeline with ensemble prophets, multi-window forecasts
- 📅 **Phase 5-7 Upcoming**: Admin UI, prophet visualizations, scheduled inference

---

## Current State (November 6, 2025)

### Infrastructure & Data (Phases 0-3 ✅)
- **DynamoDB**: All 12 tables provisioned (Assets, AssetPrices, Datasets, DataSlices, ModelScaffolds, ModelFits, Prophets, Forecasts, Performance, ProphetPerformanceSummary, Users, Notifications)
- **S3**: Bucket `chasingprophets-models-us-east-1` with CORS enabled
- **Assets**: DJIA (^DJI) and SPX (^GSPC) loaded — 2,513 records each (2015-11-09 to 2025-11-05)
- **Services**: Full CRUD for all entities with TypeScript types
- **UI**: Working dashboard and asset pages (visual appearance preserved)

### Model Pipeline (Phase 4 🔄)
- ✅ **Types**: Prophet ensembles (`modelFitIds[]`), fixed forecast horizons, scaffold metadata
- ✅ **Services**: Prophet CRUD with ensemble/performance support, S3 integration
- ✅ **Scaffolds**: SLR and MLR with train/inference scripts
- ✅ **Auto-generation**: 187 slices, 374 model fits, 374 prophets for DJIA
- ✅ **S3 Scripts**: 374 output_transform.js uploaded
- ✅ **Inference utilities**: Dual inference (server/client), ensemble combination, multi-window
- ⏳ **Training flow**: Batch training script needed
- ⏳ **Server Lambda**: Daily scheduled inference
- ⏳ **Client UI**: Multi-window visualization pages

---

## Phase-by-Phase Build Plan

### 🔄 Phase 4: Model Pipeline — Contract-Based Scaffold System

**Purpose**: Transform scaffolds from simple metadata to contract-based executable systems with ensemble support and multi-horizon forecasting

**Status Update (Nov 6, 2025):**
- ✅ **Phase 4A-4E Completed**: Types updated for ensembles (`modelFitIds[]`), services updated, SLR/MLR scaffolds created, DJIA auto-generation pipeline executed
- ✅ **Prophet Ensemble Support**: Prophet now references multiple model fits, supports `single`, `average`, `weighted_average` ensemble methods
- ✅ **Fixed Forecast Horizons**: Forecast type now enforces 8 standard windows (5, 20, 60, 120, 240, 480, 1200, 2400 days)
- ✅ **DJIA Pipeline Run**: 187 slices, 374 model fits, 374 prophets generated (all `status: pending_training`)
- ✅ **S3 Integration**: 374 default `output_transform.js` scripts uploaded to S3
- ✅ **Inference Utilities**: Created `src/utils/prophetInference.ts` for dual (server/client) inference with ensemble combination
- ⏳ **Phase 4F-4H In Progress**: Training flow, scheduled Lambda, client UI visualization

**Phase 4A: Update Type Definitions (30 min)** ✅ COMPLETED
- **Files modified:**
  - `src/types/modelScaffold.ts` - Added `scaffoldType`, `learningAlgorithm`, `modelMajorCategory`, `modelCategory`, `formulaLatex`, contract fields
  - `src/types/prophet.ts` - Changed `modelFitId` → `modelFitIds: string[]`, added `ensembleMethod`, `ensembleWeights`, `status`, `performance`
  - `src/types/forecast.ts` - Added `FORECAST_HORIZONS` constant and typed `horizon` field
  - `src/types/modelFit.ts` - Added script paths, modelParametersPath
  - `src/types/dataSlice.ts` - Added availableColumns, columnTypes, columnRanges
- **Deliverables:**
  - ✅ Updated TypeScript types matching DynamoDB schema
  - ✅ Prophet supports ensembles (array of model fits)
  - ✅ Forecast supports fixed horizons (5, 20, 60, 120, 240, 480, 1200, 2400)
  - ✅ ModelScaffold includes type/algorithm metadata
- **Verification:**
  - ✅ No TypeScript errors
  - ✅ Existing pages still compile

**Phase 4B: Update Service Layer (45 min)** ✅ COMPLETED
- **Files modified:**
  - `src/services/prophet.ts`:
    - ✅ Updated `createProphet()` to accept `modelFitIds[]` and ensemble params
    - ✅ Updated `updateProphet()` to handle all new fields
    - ✅ Added `updateProphetPerformance(prophetId, metrics)` for daily performance updates
    - ✅ Added `getActiveProphets()` filtering by `status='active'`
    - ✅ Ensemble validation (weights must sum to 1.0 for weighted_average)
  - `src/services/modelScaffold.ts`:
    - ✅ Added S3 upload/download methods using AWS SDK v3
  - `src/services/dataSlice.ts`:
    - ✅ Schema analysis logic (CSV parsing, type detection)
    - ✅ Contract validation logic
  - `src/services/modelFit.ts`:
    - ✅ Updated `createModelFit()` to copy script paths from scaffold
- **Deliverables:**
  - ✅ Prophet CRUD supports ensembles and performance metrics
  - ✅ S3 upload/download methods implemented
  - ✅ Schema analysis extracts columns/types/ranges from CSV
  - ✅ Contract validation identifies matches/mismatches
- **Verification:**
  - ✅ Can upload/download scripts to/from S3
  - ✅ Prophet service compiles without errors

**Phase 4C: Create Scaffold Scripts for SLR and MLR (2 hours)** ✅ COMPLETED
- **Created directories and files:**
  - ✅ `scripts/scaffolds/slr/` - Simple Linear Regression scaffold
  - ✅ `scripts/scaffolds/mlr/` - Multiple Linear Regression scaffold
  - ✅ Each contains: `train.py`, `inference.py` (remote), `inference.js` (local)
- **Script specifications:**
  - ✅ **SLR train.py**: Reads data with 'close' column, creates 'close_lag_1', fits OLS regression, outputs {beta_0, beta_1} to JSON
  - ✅ **SLR inference.js**: Loads parameters, accepts input data, returns predictions (browser-compatible)
  - ✅ **MLR train.py**: Creates 'close_lag_1' and 'close_lag_2', fits MLR, outputs {beta_0, beta_1, beta_2}
  - ✅ **MLR inference.js**: Accepts lagged inputs, returns predictions
- **Deliverables:**
  - ✅ 6 working scripts (3 per scaffold)
  - ✅ Scripts uploaded to S3 during scaffold initialization
- **Verification:**
  - ✅ Scripts tested locally with sample data
  - ✅ Scripts accessible in S3 at `scripts/scaffolds/{scaffoldId}/`

**Phase 4D: Initialize Default Scaffolds (30 min)** ✅ COMPLETED
- **Created file:** `scripts/admin/orchestrate-pipeline.ts` - Full auto-generation pipeline
- **Logic:**
  - ✅ Loads asset data from S3 CSV
  - ✅ Auto-generates data slices (multiple train/validation windows)
  - ✅ Creates SLR and MLR model scaffolds with metadata
  - ✅ For each scaffold × slice combination:
    - ✅ Creates ModelFit record
    - ✅ Creates Prophet record with `modelFitIds: [modelFitId]`
    - ✅ Uploads default `output_transform.js` to S3
  - ✅ Sets all prophets to `status: pending_training`
- **Verification:**
  - ✅ DJIA run: 187 slices, 374 model fits, 374 prophets created
  - ✅ All prophets have S3 output_transform paths
  - ✅ Sample verification: prophets have new schema fields

**Phase 4E: Create Data Slices with Schema Analysis (30 min)** ✅ COMPLETED
- **Integrated into orchestration pipeline** (`scripts/admin/orchestrate-pipeline.ts`)
- **Logic:**
  - ✅ For DJIA asset, auto-generates 187 data slices
  - ✅ Each slice: different train window (60-day, 120-day, 240-day, 480-day, 960-day, 1920-day variations)
  - ✅ Schema analysis: extracts columns (date, open, high, low, close, volume), types, ranges
  - ✅ Stores slice metadata in DynamoDB with schema details
- **Deliverables:**
  - ✅ 187 slices created for DJIA
  - ✅ Each slice has `availableColumns`, `columnTypes`, `columnRanges`
- **Verification:**
  - ✅ DynamoDB scan shows 187 DataSlice records
  - ✅ Schema fields populated correctly

**Phase 4F: Contract Validation and Model Fit Creation (1 hour)** ⏳ IN PROGRESS
- **Current status:**
  - ✅ 374 ModelFit records created (auto-generated by orchestrator)
  - ✅ Each fit linked to scaffold and slice
  - ✅ All fits have `status: unfit` (awaiting training)
  - ⏳ **Next task**: Implement batch training script
- **Remaining work:**
  - Create `scripts/admin/train-models.ts`:
    - Scan ModelFit records with `status: unfit`
    - For each fit:
      - Load training data from slice
      - Execute scaffold's `train.py` script
      - Save parameters to S3 (`models/{modelFitId}/parameters.json`)
      - Update ModelFit: `status: fit`, `modelParametersPath`
      - Update Prophet: `status: active` (if all fits complete)
  - Test training on 2-3 sample fits
  - Run batch training for all DJIA fits
- **Verification (pending):**
  - All 374 fits have `status: fit`
  - All 374 prophets have `status: active`
  - S3 contains parameters.json for each fit

**Phase 4G: Create Prophets (15 min)** ✅ COMPLETED
- **Integrated into orchestration pipeline** (`scripts/admin/orchestrate-pipeline.ts`)
- **Logic:**
  - ✅ For each model fit created:
    - ✅ Creates Prophet record with unique prophetId
    - ✅ Links to `modelFitIds: [modelFitId]` (array with single fit)
    - ✅ Sets `status: pending_training`, `ensembleMethod: single`
    - ✅ Uploads default `output_transform.js` to S3
    - ✅ Sets prophet name, description, targetProperty
- **Deliverables:**
  - ✅ 374 prophets created for DJIA
  - ✅ Each linked to correct model fit
  - ✅ All have `status: pending_training`
  - ✅ All have S3 output_transform script path
- **Verification:**
  - ✅ DynamoDB scan: 374 prophets exist
  - ✅ Sample prophets show new schema (modelFitIds, ensembleMethod, status)
  - ✅ S3: 374 output_transform.js files uploaded

**Phase 4H: Test Inference and Create Utilities (1 hour)** ✅ MOSTLY COMPLETE
- **Created file:** `src/utils/prophetInference.ts`
- **Implemented features:**
  - ✅ `runProphetInferenceWindow(prophetId, windowDays)` - Single-window inference
  - ✅ `runProphetInferenceMultiWindow(prophetId)` - Multi-window inference (all 8 horizons)
  - ✅ Ensemble support: combines multiple model outputs using `single`, `average`, `weighted_average`
  - ✅ Output transformation: loads and executes `output_transform.js` from S3
  - ✅ Performance metrics: RMSE, MAPE, directional accuracy
  - ✅ S3 integration: downloads parameters, scripts, asset data
  - ✅ Prophet performance updates: calls `updateProphetPerformance()`
- **Remaining work:**
  - ⏳ Test inference with trained models (requires Phase 4F training completion)
  - ⏳ Deploy server Lambda for daily scheduled inference
  - ⏳ Create client-side wrapper for browser visualization
- **Verification (partial):**
  - ✅ TypeScript compiles without errors
  - ⏳ Full integration test pending trained models

**Session 4 Summary:**
- ✅ **Types updated**: Prophet ensembles (`modelFitIds[]`), fixed forecast horizons, scaffold metadata
- ✅ **Services updated**: Prophet CRUD with ensemble support, performance updates, S3 integration
- ✅ **Scaffolds created**: SLR and MLR with train/inference scripts
- ✅ **DJIA pipeline executed**: 187 slices, 374 model fits, 374 prophets auto-generated
- ✅ **S3 integration**: 374 output_transform scripts uploaded
- ✅ **Inference utilities**: Dual inference support (server/client), ensemble combination, multi-window
- ⏳ **Training flow**: Batch training script needed (Phase 4F remaining work)
- ⏳ **Server Lambda**: Daily scheduled inference deployment
- ⏳ **Client UI**: Multi-window visualization pages

**Next Steps:**
1. Complete Phase 4F: Implement and run batch training for all 374 model fits
2. Deploy server Lambda for daily inference (Phase 4H extension)
3. Begin Phase 5: Admin UI for scaffold management

---

### Phase 5: Admin UI — Scaffold Management & Training

**Purpose**: Build admin interface for creating/editing scaffolds, managing model fits, and triggering training

**Purpose**: Build web interface for creating, editing, and testing scaffolds

**Phase 5A: Install Dependencies**
- Install Monaco Editor: `npm install @monaco-editor/react`
- Install KaTeX: `npm install katex react-katex @types/katex`
- Verify no breaking changes to existing build

**Phase 5B: Scaffold List Page**
- **New file:** `src/pages/Management/ScaffoldsList.tsx`
- **Route:** `/mgmt/models/scaffolds`
- **Features:**
  - Fetch all scaffolds from DynamoDB
  - Display cards with name, description, type, contextualized badge, inference mode badge
  - Filters: type, contextualized, inference mode
  - Search by name
  - "Create New Scaffold" button → navigate to `/mgmt/models/scaffolds/new`
- **Verification:**
  - List shows 2 scaffolds (SLR, MLR)
  - Filters work correctly
  - Click scaffold card → navigate to detail page

**Phase 5C: Scaffold Create/Edit Page**
- **New file:** `src/pages/Management/ScaffoldEdit.tsx`
- **Routes:** `/mgmt/models/scaffolds/new` and `/mgmt/models/scaffolds/:scaffoldId/edit`
- **Features:**
  - **Basic metadata section:**
    - Name, description (textarea)
    - Model type dropdown
    - Is Contextualized checkbox
    - Inference mode dropdown (local, remote, hybrid)
  - **Contract editor component:**
    - Input contract table (add/edit/remove rows)
    - Output contract table
    - For each field: name, type dropdown, required checkbox, min/max values, description
  - **Code editors (Monaco):**
    - Tab 1: Training Script (train.py) - Python syntax highlighting
    - Tab 2: Remote Inference Script (inference.py) - Python syntax highlighting
    - Tab 3: Local Inference Script (inference.js) - JavaScript syntax highlighting (only if inferenceMode != 'remote')
  - **Formula editor:**
    - LaTeX textarea
    - Live KaTeX preview below
  - **Save button:**
    - Validates all required fields
    - Uploads scripts to S3
    - Creates/updates DynamoDB record
  - **Test inference section:**
    - JSON textarea for test input
    - "Test Remote" button → calls Lambda
    - "Test Local" button → executes JS in browser
    - Output display
- **Verification:**
  - Can create new scaffold with all fields
  - Can edit existing scaffold (SLR)
  - Scripts save to S3 correctly
  - LaTeX preview renders correctly
  - Test inference works for both remote and local

**Phase 5D: Model Fit Discovery UI**
- **New file:** `src/pages/Management/ModelFitCreate.tsx`
- **Route:** `/mgmt/models/fits/new`
- **Features:**
  - **Step 1:** Select Asset dropdown (DJIA, SPX)
  - **Step 2:** Select Scaffold dropdown
  - **Step 3:** Select Data Slice dropdown
    - Runs contract validation on selection
    - Shows green checkmarks for compatible slices
    - Shows red X with details for incompatible slices
  - **Step 4:** Review summary
  - **Create button:**
    - Creates ModelFit record in DynamoDB (status='unfit')
    - Triggers training job (Phase 5E)
- **Verification:**
  - Can select asset, scaffold, slice
  - Validation correctly identifies compatible slices
  - Incompatible slices show error details
  - Create button successfully creates fit

**Phase 5E: Training Job Execution (Optional - can defer to Lambda in Session 7)**
- **Option A:** Client-side training (for simple models like SLR/MLR)
  - Execute training script in Node.js subprocess
  - Upload parameters to S3
  - Update fit status to 'fit'
- **Option B:** Server-side training (Lambda or ECS)
  - Create API endpoint: `POST /api/model-fits/:modelFitId/train`
  - Lambda downloads training script and data
  - Executes training
  - Stores parameters in S3
  - Updates DynamoDB
- **Recommendation:** Implement Option A for alpha (simpler), defer B to post-alpha

**Session 5 Summary:**
- ✅ Admin can list all scaffolds
- ✅ Admin can create/edit scaffolds with Monaco code editor
- ✅ Admin can test inference directly in UI
- ✅ Admin can create model fits with contract validation
- ✅ Training jobs execute and produce parameters

---

### Phase 6: Client UI — Prophet Performance Visualization

**Purpose**: Build user-facing prophet detail page with client-side local inference and multi-window charts

**Phase 6A: Prophet Detail Page with Local Inference**
- **New file:** `src/pages/Prophets/ProphetDetail.tsx`
- **Route:** `/prophets/:prophetId`
- **Features:**
  - **Metadata section:**
    - Prophet name, description
    - Linked asset, model fit details
    - Active status badge
  - **Performance visualization:**
    - **If inferenceMode = 'local' or 'hybrid':**
      - Fetch model parameters from S3 (pre-signed URL)
      - Fetch local inference script from S3
      - Fetch historical OHLCV data from S3 (past 1200 days)
      - Execute inference.js in browser:
        - For each day: apply model → get prediction
        - Compare to actual
        - Compute error metrics
      - Render Plotly charts:
        - Predicted vs Actual line chart (dual Y-axis)
        - Error distribution histogram
        - Rolling metrics charts (20d, 60d, 240d MAPE)
    - **If inferenceMode = 'remote':**
      - Call API: `GET /api/prophets/:prophetId/historical-inference?days=1200`
      - Lambda executes inference.py and returns predictions
      - Render same charts from API response
  - **Aggregated metrics table:**
    - Display from ProphetPerformanceSummary
    - Windows: 20d, 40d, 60d, 120d, 240d, 480d, 1080d, 1200d
    - Metrics: MAPE, RMSE, directional accuracy
- **Verification:**
  - Local inference executes successfully for SLR and MLR prophets
  - Charts display correctly
  - Performance metrics match expectations
  - No errors in browser console

**Phase 6B: Remote Inference API (if needed)**
- **New Lambda:** `lambdas/historical-inference/handler.py`
- **Endpoint:** `GET /api/prophets/:prophetId/historical-inference?days=N`
- **Logic:**
  - Fetch prophet → model fit → parameters
  - Download inference.py from S3
  - Fetch historical OHLCV data from S3
  - Execute inference for each day
  - Return array of {date, predicted, actual, error}
- **Verification:**
  - API returns 200 with correct data structure
  - Predictions match local inference results

**Phase 6C: Model Fit Performance Page**
- **New file:** `src/pages/Management/ModelFitPerformance.tsx`
- **Route:** `/mgmt/models/fits/:modelFitId/performance`
- **Features:**
  - Similar to prophet page but shows training data performance
  - Charts for in-sample fit
  - Option to run on test slice (if exists)
- **Verification:**
  - Shows training performance correctly
  - Charts render without errors

**Session 6 Summary:**
- ✅ Prophet detail page with client-side inference
- ✅ Performance charts rendered with Plotly
- ✅ Remote inference API (if needed)
- ✅ Model fit performance page

---

### Phase 7: Automation — Scheduled Execution & Leaderboards

**Purpose**: Automate daily predictions and build prophet performance leaderboard

**Phase 7A: Daily Prediction Lambda**
- **New file:** `lambdas/daily-predictions/handler.py`
- **Trigger:** EventBridge rule at 06:00 ET daily
- **Logic:**
  - Query DynamoDB for all prophets where isActive = "true"
  - For each prophet:
    - Fetch model fit → parameters from S3
    - Download remote inference script (inference.py) from S3
    - Fetch latest OHLCV data from S3 (today's data)
    - Execute inference.py in Lambda (subprocess or direct import)
    - Generate prediction for next day
    - Write to Forecasts table: {forecastId, prophetId, assetId, date, predicted}
- **Deployment:**
  - Package as Lambda Layer or include dependencies in ZIP
  - Set timeout to 5 minutes (allow for multiple prophets)
  - Set memory to 512MB
- **Verification:**
  - Manual invoke via AWS CLI
  - Check Forecasts table for new records
  - Verify predictions are numerical and reasonable

**Phase 7B: Daily Performance Lambda**
- **New file:** `lambdas/daily-performance/handler.py`
- **Trigger:** EventBridge rule at 06:05 ET daily (after predictions)
- **Logic:**
  - Query all active prophets
  - For each prophet:
    - Fetch yesterday's prediction from Forecasts table
    - Fetch today's actual price from AssetPrices or S3
    - Compute error metrics: absolute error, percentage error, directional accuracy
    - Update rolling aggregates:
      - For each window (20d, 40d, 60d, 120d, 240d, 480d, 1080d, 1200d):
        - Fetch last N predictions and actuals
        - Compute MAPE, RMSE, directional accuracy, percentile errors
        - Write/update ProphetPerformanceSummary table
    - **Do NOT persist individual predictions long-term** (cost optimization)
- **Deployment:**
  - Same Lambda config as daily-predictions
  - Consider using pandas for rolling calculations
- **Verification:**
  - Manual invoke
  - Check ProphetPerformanceSummary has updated records
  - Verify aggregates are within expected ranges

**Phase 7C: EventBridge Rules Setup**
- **New file:** `scripts/aws/create-event-rules.sh`
- **Logic:**
  - Create rule: `chp-daily-predictions` with cron `0 11 ? * MON-FRI *` (UTC, ~06:00 ET)
  - Add target: Lambda `daily-predictions`
  - Add Lambda resource policy for EventBridge invoke
  - Create rule: `chp-daily-performance` with cron `5 11 ? * MON-FRI *` (5 minutes after predictions)
  - Add target: Lambda `daily-performance`
  - Add Lambda resource policy
- **Verification:**
  - EventBridge rules exist in AWS Console
  - Rules show correct cron expressions
  - Lambda permissions include events.amazonaws.com

**Phase 7D: Prophet Leaderboard Page**
- **New file:** `src/pages/Prophets/ProphetLeaderboard.tsx`
- **Route:** `/prophets/leaderboard`
- **Features:**
  - **Data source:** ProphetPerformanceSummary table
  - **Table columns:**
    - Rank, Prophet Name, Asset, Model Type
    - MAPE (20d, 60d, 240d, 1200d)
    - RMSE (20d, 60d, 240d)
    - Directional Accuracy (20d, 60d, 240d)
    - Percentile Errors (75th, 90th)
  - **Filters:**
    - Asset dropdown (All, DJIA, SPX)
    - Time window dropdown (20d, 40d, 60d, 120d, 240d, 480d, 1080d, 1200d)
    - Model type dropdown (All, ML, DL, TS, statistical)
  - **Sorting:**
    - Click column header to sort
    - Default sort: best MAPE (60d window)
  - **Row click:** Navigate to `/prophets/:prophetId`
- **Verification:**
  - Leaderboard displays all 4 prophets
  - Metrics are populated
  - Filters work correctly
  - Sorting works
  - Click row navigates to detail page

**Phase 7E: Prophet List Page**
- **New file:** `src/pages/Prophets/ProphetsList.tsx`
- **Route:** `/prophets`
- **Features:**
  - List all active prophets
  - Cards showing: name, asset, model fit, quick metrics
  - Filter by asset, active status
  - Link to leaderboard
  - Link to individual prophet pages
- **Verification:**
  - Shows all active prophets
  - Filters work
  - Links navigate correctly

**Session 7 Summary:**
- ✅ Daily prediction Lambda automated
- ✅ Daily performance Lambda computes aggregates
- ✅ EventBridge rules trigger Lambdas daily
- ✅ Prophet leaderboard page displays rankings
- ✅ Prophet list page shows all prophets
- ✅ Full scheduled inference pipeline operational

---

### Sessions 8-9: API Gateway + Amplify Deployment (Deferred or Optional)

**Status:** These sessions are optional for alpha. Current plan uses direct DynamoDB SDK from client.

**Option A (Recommended for Alpha):** Continue with direct SDK usage
- Simpler to develop and debug
- Faster iteration
- Defer API Gateway to post-alpha for production hardening

**Option B (If building API now):**
- Follow original Session 8 plan for API Gateway + Lambda handlers
- Refactor services to use API endpoints instead of direct SDK
- Add Cognito authorizer to API
- Test all CRUD operations through API

**Amplify Deployment (Session 9):**
- Will proceed regardless of API decision
- See Section 6 below for detailed Amplify setup steps

---

## 2) IAM Bootstrap: What You Must Do (One-Time) and Exact Permissions

### Step A. Create temporary bootstrap credentials (one-time)

**Option 1** (simplest): Temporarily attach AWS managed `AdministratorAccess` to your IAM user. Use only to run initial bootstrap scripts, then remove.

**Option 2** (safer, recommended): Create IAM user `ChProphets-Bootstrap` with inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "IAMAdminForProject",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
        "iam:PassRole", "iam:CreatePolicy", "iam:UpdateAssumeRolePolicy",
        "iam:TagRole", "iam:List*", "iam:Get*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ServiceProvisioning",
      "Effect": "Allow",
      "Action": [
        "dynamodb:*", "s3:*", "cognito-idp:*",
        "lambda:*", "apigateway:*", "events:*",
        "ecs:*", "ecr:*", "logs:*",
        "cloudformation:*", "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

Generate access key for this user; place in `.env`:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=... (from `aws sts get-caller-identity`)
```

### Step B. Project service roles (created by scripts)

**1) Lambda execution role:** `ChProphets-Lambda-Role`

Trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

Inline policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoAccess",
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:Query","dynamodb:Scan"],
      "Resource": "arn:aws:dynamodb:${AWS_REGION}:${AWS_ACCOUNT_ID}:table/ChasingProphets-*"
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:PutObject","s3:ListBucket"],
      "Resource": ["arn:aws:s3:::chasing-prophets-dev-*","arn:aws:s3:::chasing-prophets-dev-*/*"]
    },
    {
      "Sid": "RunECSTraining",
      "Effect": "Allow",
      "Action": ["ecs:RunTask","ecs:DescribeTasks"],
      "Resource": "*"
    },
    {
      "Sid": "Logs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

**2) ECS task roles:**
- Task execution: `ChProphets-ECSTaskExecutionRole` with AWS managed `arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy`
- Task role: `ChProphets-ECSTrainerRole` (S3 read/write on models/data/scripts, DDB UpdateItem on ModelFits, logs)

**3) Amplify service role:** `ChProphets-AmplifyServiceRole` with AWS managed `arn:aws:iam::aws:policy/AWSAmplifyFullAccess`

**4) Cognito groups:** `admin`, `user`, `guest` (created by create-cognito.sh)

**5) Manual Federation Setup (Post-script)**
- The `create-cognito.sh` script will prepare the User Pool.
- **You must manually configure Federated Identity Providers (Google, Microsoft) in the AWS Cognito Console.** This involves creating developer applications on Google/Microsoft to get a client ID and secret, then adding them to the Cognito User Pool's identity provider settings. This step is manual and cannot be scripted.

### Step C. EventBridge → Lambda invocation (resource policy)

EventBridge does not assume a role; instead, each target Lambda must grant permission. After creating Lambdas and rules, script runs:

```bash
aws lambda add-permission \
  --function-name chp-data-pipeline \
  --statement-id AllowExecutionFromEventBridge \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:${AWS_REGION}:${AWS_ACCOUNT_ID}:rule/chp-daily-0600-et"
```

---

## 3) Data initialization (real DJIA and SPX)

**Objective:** Load actual daily OHLCV data for DJIA and SPX to S3 and DynamoDB.

**Data source:** Yahoo Finance (via `yahoo-finance2` NPM package or direct CSV download from Yahoo/Stooq).

**Data contract (CSV):**
- Columns: date, open, high, low, close, volume
- Date format: YYYY-MM-DD (UTC)
- Only trading days (no weekends/holidays)

**S3 locations:**
- `s3://chasing-prophets-dev-${AWS_ACCOUNT_ID}-${AWS_REGION}/data/assets/DJIA/ohlcv_full.csv`
- `s3://chasing-prophets-dev-${AWS_ACCOUNT_ID}-${AWS_REGION}/data/assets/SPX/ohlcv_full.csv`

**DynamoDB:**
- ChasingProphets-Assets: add `{assetId: "DJIA", ticker: "^DJI", name: "Dow Jones Industrial Average", type: "index"}` and `{assetId: "SPX", ticker: "^GSPC", name: "S&P 500 Index", type: "index"}`
- ChasingProphets-AssetPrices: PK=assetId, SK=date, attrs: open, high, low, close, volume

**Scripts:**
- `scripts/data/fetch-indexes.ts` — download to local `data/raw/{DJIA,SPX}.csv`
- `scripts/data/upload-s3.ts` — upload to S3
- `scripts/data/load-to-ddb.ts` — parse CSV, batch write (25 items/batch, exponential backoff on UnprocessedItems) to `ChasingProphets-AssetPrices`

**Validation:**
- Spot-check first 5 and last 5 rows
- Compare recent close to Yahoo UI
- Verify no duplicate dates (PK uniqueness)

---

## 4) Protocol for Model Scaffolds, Fits, Prophets, and **Forecasts**

### 4.1 Model Scaffold (DDB: ChasingProphets-ModelScaffolds)
- PK: scaffoldId (e.g., SLR-LAG-5, LSTM-SMALL)
- Attributes:
  - name, description
  - inputSpec: JSON `{ features: ["ret_1", "ret_5"], window: 240 }`
  - outputSpec: JSON `{ target: "ret_1" }`
  - engine: "tfjs" | "coefficients" | "server"
  - formulaLatex: LaTeX string (rendered in UI with KaTeX)
  - s3CodePath: S3 path to training.py and inference.py (uploaded from Monaco editor)
  - config: JSON (hyperparams, lookback)

### 4.2 Data Slice (DDB: ChasingProphets-DataSlices)
- PK: dataSliceId (e.g., DJIA_2018-01-01_2022-12-31)
- Attributes:
  - datasetId
  - startDate, endDate (validated: endDate > startDate, dates exist in dataset)
  - sliceType: simple | compound
  - s3Path: optional cached CSV

### 4.3 Model Fit (DDB: ChasingProphets-ModelFits)
- PK: modelFitId (e.g., SLR-LAG-5_DJIA_2018-01-01_2022-12-31)
- Attributes:
  - scaffoldId, dataSliceId
  - status: unfit | fitting | fit | error
  - modelUrl: S3 path base (for TF.js: model.json + shards)
  - trainingMetrics: JSON (loss, MAE, etc.)
- GSIs:
  - ScaffoldIndex (PK: scaffoldId)

### 4.4 Prophet (DDB: ChasingProphets-Prophets)
- PK: prophetId (UUID or descriptive)
- Attributes:
  - **`modelFitIds`: [String]** (supports ensembling multiple models)
  - `assetId`
  - forecastMethod: "direct" | "iterative"
    - **direct**: one-shot N-day prediction
    - **iterative**: roll forward day-by-day, feeding predictions as inputs
  - isActive: boolean
- GSIs:
  - AssetIndex (PK: assetId)

### 4.5 Forecast (DDB: ChasingProphets-Forecasts) — **NEW**
- PK: forecastId (UUID)
- SK: startDate (YYYY-MM-DD)
- Attributes:
  - prophetId, assetId
  - horizon: 20 | 60 | 120 | 240 (days)
  - predictions: JSON array `[{ date, predicted_close }, ...]`
  - status: pending | completed | error
  - createdAt, completedAt
- GSI: ProphetIndex (PK: prophetId)

### 4.6 Performance (DDB: ChasingProphets-Performance)
- Stores *daily* raw data for performance calculations.
- PK: prophetId
- SK: date (YYYY-MM-DD)
- Attributes:
  - predicted, actual, error

### 4.7 ProphetPerformanceSummary (DDB: ChasingProphets-ProphetPerformanceSummary) - **NEW**
- Stores aggregated, rolling-window metrics for the leaderboard.
- PK: `prophetId` (String)
- SK: `aggregationWindow` (String) - e.g., "20-day", "240-day"
- Attributes: `mape`, `percentileError75`, `directionalAccuracy`

### 4.8 Lifecycle
1. Create scaffolds (admin UI → DDB + S3 code)
2. Create data slices (admin UI → DDB, validated dates)
3. Create model fits (admin UI → API triggers ECS training job)
4. Convert model to TF.js; upload to `models/{modelFitId}/`
5. Create prophet referencing one or more fits
6. **Create forecast** (admin or auto: select prophet, horizon, start date) → triggers prophet run → stores predictions
7. Daily EventBridge triggers prophet/forecast update Lambda; compute and record daily performance and aggregated summary performance.

---

## 5) Shell scripts plan (assume .env creds; planning only, implement after approval)

**Execution ordering:**
1. `bootstrap-iam.sh` → 2. `create-s3.sh` → 3. `create-dynamodb.sh` → 4. `create-cognito.sh` → 5. data scripts → 6. `init-defaults.ts` → 7. `deploy-lambdas.sh` → 8. `create-events.sh` → 9. (optional) `create-api.sh`

**Scripts:**

- `scripts/aws/bootstrap-iam.sh`
  - Creates roles listed in section 2.B; attaches policies
  - Idempotent: checks if role exists before creating
  - Accepts env vars: AWS_ACCOUNT_ID, AWS_REGION, BUCKET_NAME (derived from account+region)

- `scripts/aws/create-s3.sh`
  - Creates versioned bucket `chasing-prophets-dev-${AWS_ACCOUNT_ID}-${AWS_REGION}`
  - Sets encryption (SSE-S3), public access block
  - Idempotent: checks if bucket exists

- `scripts/aws/create-dynamodb.sh`
  - Creates all tables with PAY_PER_REQUEST billing; tags Project=ChasingProphets
  - Tables: Assets, AssetPrices, Users, Notifications, Datasets, DataSlices, ModelScaffolds, ModelFits, Prophets, **Forecasts**, Performance, **ProphetPerformanceSummary**
  - Idempotent: checks if table exists; waits for ACTIVE status

- `scripts/aws/create-cognito.sh`
  - Creates user pool `ChasingProphetsUsers`, client `ChasingProphetsWeb` (no secret)
  - Creates groups: admin, user, guest
  - Outputs pool ID and client ID to `.env` (appends or updates)

- `scripts/data/fetch-indexes.ts`
  - Downloads DJIA/SPX from Yahoo Finance to `data/raw/`

- `scripts/data/upload-s3.ts`
  - Uploads CSVs to S3 at `data/assets/{ASSET}/ohlcv_full.csv`

- `scripts/data/load-to-ddb.ts`
  - Parses CSVs, batch writes to ChasingProphets-AssetPrices
  - Error handling: exponential backoff on UnprocessedItems; exits on fatal errors with clear message

- `scripts/models/init-defaults.ts`
  - Creates 2 scaffolds (SLR-LAG-5, Naive-1), 2 slices (DJIA_last2y, SPX_last2y), 4 fits, 4 prophets
  - Idempotent: checks if scaffold exists before creating

- `scripts/aws/deploy-lambdas.sh`
  - ZIPs `lambdas/data-pipeline/handler.py` and `lambdas/prophet-updater/handler.py`
  - Creates or updates Lambda functions; sets execution role to ChProphets-Lambda-Role
  - Sets environment variables (BUCKET_NAME, REGION, etc.)

- `scripts/aws/create-events.sh`
  - Creates EventBridge rule `chp-daily-0600-et` (cron `0 11 ? * MON-FRI *` UTC)
  - Adds targets: chp-data-pipeline, chp-prophet-updater
  - Adds Lambda resource policy per target (events.amazonaws.com principal)

- (optional) `scripts/aws/create-api.sh`
  - Creates REST API with Cognito authorizer
  - Creates routes, integrates with Lambda handlers
  - Deploys to `dev` stage

- `scripts/test/smoke-test.sh`
  - Curls API endpoints (or direct DDB if no API)
  - Checks for DJIA/SPX data in DDB
  - Validates Cognito login via CLI
  - Exits 0 if all pass, 1 otherwise

**Error handling:**
- All scripts check for required env vars at start; exit with clear message if missing
- Idempotent where possible (check existence before create)
- Rollback plan: `scripts/aws/teardown.sh --force` deletes all resources (with confirmation flag)

---

## 6) Amplify deployment (from GitHub → hosting)

**Prereqs:**
- Repo on GitHub (this repo)
- AWS account with ChProphets-AmplifyServiceRole created

**Steps:**

1. **Amplify Console → New app → Host web app → Connect to GitHub**
   - Select repo: `mylesdgarvey/chasingprophets`
   - Branch: `main` (or `dev` for dev environment)

2. **Build settings:**
   - Runtime: Node 20+
   - Build commands (auto-detected):
     - Install: `npm ci`
     - Build: `npm run build`
     - Output dir: `dist/`
   - Service role: ChProphets-AmplifyServiceRole

3. **Environment variables** (Amplify → App settings → Environment variables):
   ```
   VITE_REGION=us-east-1
   VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXX (from create-cognito.sh output)
   VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX (from create-cognito.sh output)
   VITE_S3_BUCKET_NAME=chasing-prophets-dev-${AWS_ACCOUNT_ID}-${AWS_REGION}
   VITE_API_GATEWAY_URL=https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev (if using API)
   ```

4. **Save and deploy**
   - Amplify builds and hosts at `https://main.XXXXXXX.amplifyapp.com`

5. **Post-deploy checks:**
   - App loads; login works with admin@chasingprophets.local
   - Assets page shows DJIA/SPX
   - Charts display real price data
   - Admin can navigate to /mgmt and view seeded data

**Promotion path:**
- `dev` branch → Amplify dev environment
- `main` branch → Amplify prod environment
- Use PR previews for feature branches

---

## 7) Acceptance criteria (alpha)

**NOTE**: Building from existing codebase; acceptance is both "new features work" AND "existing features unchanged"

- [ ] **Visual stability preserved**: Existing pages (Dashboard, Assets, Asset detail, any current Prophet pages) remain visually identical to session 0 baseline screenshots
- [ ] Real DJIA and SPX data present in S3 and DynamoDB (verified via scripts/test/smoke-test.sh)
- [ ] At least one scaffold → fit → prophet → forecast per index
- [ ] Prophet detail page runs client-side inference via TF.js + pre-signed URL (new feature or extension of existing)
- [ ] Daily job Lambda stubs exist; manual invoke updates data and writes to both Performance and ProphetPerformanceSummary tables
- [ ] Forecasts table populated; /forecasts/:id page shows multi-day prediction chart
- [ ] App deployed on Amplify; Cognito login works; all IAM roles least-privilege and script-created
- [ ] Admin can:
  - Access new /mgmt/* routes
  - Batch-initialize scaffolds/slices/fits/prophets via /mgmt/batch-init
  - Batch-load new assets via /mgmt/batch-assets
  - Create scaffold with LaTeX + code editor
  - View prophet leaderboard ranked by aggregated metrics from ProphetPerformanceSummary
- [ ] **No TypeScript errors** in existing files after refactoring
- [ ] **No console errors** on existing pages after deployment

---

## 8) What you must do next (minimal IAM-only work)

1. Choose Bootstrap option (temp AdministratorAccess OR create ChProphets-Bootstrap user with policy above)
2. Generate access key; place in `.env`: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCOUNT_ID
3. **Confirm this revised plan**
4. I will implement incrementally from existing codebase (session 0 = baseline audit, then build out)
5. You run scripts in order (session 1 → 2 → 3 → ...)
6. We iterate on sessions 4-8 (UI + Lambda + deployment)
7. You connect repo to Amplify and set env vars
8. Deploy and verify acceptance criteria

All of the above remains **planning-only** until you approve; no runtime code will change until you say "go."

---

## 9) Single-page "what you do vs what I do" for zero ambiguity

**You (AWS Console, one-time):**
- Create/enable Bootstrap credentials (temp AdministratorAccess OR ChProphets-Bootstrap user)
- Later in Amplify Console: connect GitHub repo, set environment variables (listed in section 6)

**Me (in Codespace, scripted):**
- Create least-priv service roles (Lambda, ECS, Amplify)
- Create S3 bucket, DynamoDB tables (incl. Forecasts), Cognito pool/client/groups
- Load DJIA & SPX data to S3 and DynamoDB
- Initialize default scaffolds/fits/prophets
- Deploy Lambda stubs
- Prepare EventBridge daily rule + Lambda resource policies
- Build admin UI with batch init + LaTeX/code editors
- Build user prophet/forecast pages + leaderboard
- Hand you Amplify deploy instructions or execute if you prefer

**You run and test; I fix; we iterate until alpha acceptance criteria met.**
