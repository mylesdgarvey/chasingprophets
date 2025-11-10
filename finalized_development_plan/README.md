# Chasing Prophets — Alpha Development Plan# Chasing Prophets — Alpha Development Plan (REVISED FOR CONTRACT SYSTEM)



**Version:** 1.0  **Status:** 🔄 Sessions 0-3 Complete, Session 4 In Progress  

**Last Updated:** November 6, 2025  **Date:** 2025-11-06  

**Status:** Phase 4 (Model Pipeline) In Progress**Revision:** Updated for contract-based scaffold system with dual inference architecture



---## 📋 Document Overview



## 📖 About This DocumentationThis folder contains the **complete, execution-ready** development plan for Chasing Prophets Alpha with contract-based model scaffolds.



This folder contains the complete development plan for **Chasing Prophets Alpha** — a financial prediction ecosystem that auto-generates model scaffolds, trains predictive models, and visualizes multi-horizon forecasts for assets like DJIA and SPX.### Planning Documents (Read in Order)



The documentation is structured to align with the **human design standards** outlined in `/system_design_sketches/HUMAN_DESIGNER_CONCEPT_DESCRIPTION.md`.1. **`00-REVISED-PLAN-SESSION-4.md`** — **NEW:** Complete overview of contract-based scaffold system

2. **`01-conceptual-overview.md`** — Vision, alpha scope, object graph (UPDATED for contracts + dual inference)

---3. **`02-architecture.md`** — Stack details, AWS services, inference architecture (UPDATED)

4. **`03-resources-and-locations.md`** — AWS resource inventory with schema details (UPDATED)

## 📚 Documentation Structure5. **`04-screens-and-tasks.md`** — All screens with execution placement (UPDATED for local/remote inference)

6. **`05-detailed-development-plan.md`** — **Authoritative execution plan** (UPDATED for Sessions 4-7)

Read these documents **in order**:7. **`00-AUDIT-AND-FIXES.md`** — Historical audit (completed in earlier sessions)

8. **`00-INCREMENTAL-BUILD-STRATEGY.md`** — Historical strategy document

### 1. **01-conceptual-overview.md**

- High-level vision and philosophy## 🎯 Current Status

- Core object model: Entity → Dataset → Slice → Scaffold → ModelFit → Prophet → Forecast

- Alpha scope and boundaries### ✅ Completed (Sessions 0-3)

- What we're building vs. what's deferred to post-alpha- **Session 0:** Codebase assessment (implicit)

- **Session 1:** AWS infrastructure setup

### 2. **02-architecture.md**  - DynamoDB: All 12 tables created

- Technology stack (React + TypeScript, AWS services)  - S3: `chasingprophets-models-us-east-1` bucket with CORS

- Data layer architecture (DynamoDB schema, S3 structure)  - Cognito: User pool (if created)

- Dual inference system:- **Session 2:** Real data loading

  - **Server-side**: Daily batch predictions via Lambda/EventBridge  - DJIA (^DJI): 2,513 records in S3 (2015-11-09 to 2025-11-05)

  - **Client-side**: On-demand multi-window visualizations in browser  - SPX (^GSPC): 2,513 records in S3

- Prophet ensemble support (single model, average, weighted average)  - CSV architecture: `data/assets/{TICKER}/ohlcv_full.csv`

- Fixed forecast horizons (5, 20, 60, 120, 240, 480, 1200, 2400 days)- **Session 3:** Service layer

- Security and IAM roles  - Types: dataset, dataSlice, modelScaffold, modelFit, prophet, forecast, performance

  - Services: Full CRUD for all entities

### 3. **03-resources-and-locations.md**

- Complete inventory of AWS resources:### 🔄 In Progress (Session 4)

  - 12 DynamoDB tables with schema details- **Phase 4A-4H:** Contract-based scaffold system

  - S3 bucket structure and file paths  - Contract validation

  - IAM roles and policies  - Executable scripts (Python + JavaScript)

- Where code, data, and artifacts live  - Dual inference (local + remote)

- Naming conventions  - Default scaffolds (SLR, MLR)

  - See `00-REVISED-PLAN-SESSION-4.md` for details

### 4. **04-screens-and-tasks.md**

- All user and admin screens with wireframes### 📅 Upcoming (Sessions 5-7)

- User tasks: Browse prophets, view performance, explore multi-window forecasts- **Session 5:** Admin UI for scaffold management (Monaco editor, contract editor)

- Admin tasks: Upload datasets, create scaffolds, manage model fits, train models- **Session 6:** Prophet performance visualization (client-side inference)

- UI/UX flow and navigation- **Session 7:** Scheduled execution + leaderboard



### 5. **05-detailed-development-plan.md**## 🚀 Quick Start (Resume from Session 4)

- **Authoritative execution plan** broken into phases:

  - **Phase 0**: Environment setup### Current Focus: Contract-Based Scaffolds

  - **Phase 1**: AWS infrastructure (DynamoDB, S3, IAM)

  - **Phase 2**: Data loading (DJIA, SPX)We are implementing a sophisticated model scaffold system with:

  - **Phase 3**: Service layer (CRUD for all entities)

  - **Phase 4**: Model pipeline (auto-generation, training, inference) ← **Current**1. **Input/Output Contracts**: Precise field specifications (names, types, ranges)

  - **Phase 5**: Admin UI (Monaco editor, contract validation)2. **Contextualized vs Generic**: Scaffolds can be asset-specific or generic

  - **Phase 6**: Prophet visualization (multi-window charts)3. **Three Scripts Per Scaffold**:

  - **Phase 7**: Scheduled execution and leaderboards   - `train.py` - Training logic (Python)

- Step-by-step tasks with acceptance criteria   - `inference.py` - Server-side inference (Python, runs on Lambda)

- Current progress tracking   - `inference.js` - Client-side inference (JavaScript, runs in browser)

4. **Dual Inference Architecture**:

---   - **Server-side (remote)**: Daily scheduler runs predictions, stores aggregates

   - **Client-side (local)**: Browser computes historical performance on-demand

## ✅ Current Implementation Status5. **Contract Validation**: Data slices must match scaffold contracts before fits can be created



### Completed Phases (0-3)### Step 1: IAM Bootstrap (one-time, ~5 minutes)

- ✅ AWS infrastructure fully provisionedChoose **one** option:

- ✅ Real data loaded (DJIA: 2,513 records, SPX: 2,513 records)

- ✅ Service layer implemented (types + CRUD for all entities)**Option A (Simplest):**

- ✅ Two default model scaffolds created (SLR, MLR)- Temporarily attach `AdministratorAccess` to your IAM user

- Use only for running scripts; remove after

### Phase 4 Progress (Model Pipeline)- Place creds in `.env`: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ACCOUNT_ID`

- ✅ **Types updated**: Prophet supports ensembles (`modelFitIds[]`), Forecast has fixed horizons

- ✅ **Services updated**: Prophet CRUD handles ensembles, performance updates**Option B (Safer, recommended):**

- ✅ **Auto-generation**: Orchestrator creates slices, scaffolds, model fits, prophets- Follow section 2.A in `05-detailed-development-plan.md`

- ✅ **S3 integration**: Default output_transform scripts uploaded- Create IAM user `ChProphets-Bootstrap` with inline policy (copy from doc)

- ✅ **DJIA pipeline run**: 187 slices, 374 model fits, 374 prophets generated (pending_training)- Generate access key → `.env`

- ✅ **Inference utilities**: `src/utils/prophetInference.ts` for server/client inference

- ⏳ **Training flow**: Batch training + parameter upload (next task)### Step 2: Confirm Plan

- ⏳ **Server Lambda**: Daily scheduled inference (next task)Review `05-detailed-development-plan.md` sections 1-9; approve or request changes.

- ⏳ **Client UI**: Multi-window visualization pages (next task)

### Step 3: Execute Sessions (iterative)

---I will implement each session (0-8); you run and verify; we iterate.



## 🎯 Design Standards**Session 0:** Visual guardrails (screenshots, NPM deps)  

**Session 1:** IAM roles + AWS foundation (S3, DDB, Cognito) — all scripted  

This plan adheres to the **human design standards** from the original concept:**Session 2:** Real DJIA/SPX data seeding  

**Session 3:** DDB schema + default models  

1. **Entity-centric architecture**: Everything flows from the core entity (Asset)**Session 4:** Admin UI (batch init, LaTeX/code editors, detail pages)  

2. **Contract-based scaffolds**: Input/output contracts validate data compatibility**Session 5:** Prophet/forecast user pages + leaderboard  

3. **Dual inference**: Same logic runs server-side (daily) and client-side (on-demand)**Session 6:** Daily job (EventBridge + Lambda stubs)  

4. **Fixed forecast horizons**: Standard windows for consistent performance comparison**Session 7:** API Gateway (optional; can defer to Phase 2)  

5. **Prophet ensembles**: Support single or multiple model fits per prophet**Session 8:** Amplify deployment + smoke tests  

6. **Performance-driven**: Daily metrics updates, rolling aggregates, leaderboards

7. **Admin tooling**: Full CRUD for scaffolds, fits, prophets with code editor### Step 4: Deploy to Amplify

8. **User visualization**: Rich multi-window charts showing predicted vs. actual- Connect repo to Amplify Console

- Set environment variables (listed in section 6 of detailed plan)

---- Verify acceptance criteria



## 🚀 Next Steps## ✨ What's Included (Key Features)



If you're implementing features, start with **05-detailed-development-plan.md** and follow the current phase instructions.### Contract-Based Model Scaffolds (NEW!)

- **Input/Output Contracts**: Define precise field specifications

If you're onboarding to the project, read documents **01 → 05** in sequence to understand the full system architecture.  - Field names (e.g., "close_lag_1", "volume")

  - Field types (numerical, text, categorical, datetime, boolean)

For historical context or human design philosophy, see `/system_design_sketches/HUMAN_DESIGNER_CONCEPT_DESCRIPTION.md`.  - Value ranges and constraints

  - Required vs optional fields

---- **Contextualized Scaffolds**: OHLCV-specific models that work with any asset's OHLCV data

- **Non-Contextualized Scaffolds**: Generic models that work with any data

## 📝 Notes- **Executable Scripts**: Three scripts per scaffold:

  - Training script (Python): Fits model on data

- This is a **living plan** — updated as implementation progresses  - Remote inference script (Python): Runs on Lambda for daily predictions

- All scratch/session notes have been removed; only canonical docs remain  - Local inference script (JavaScript): Runs in browser for performance visualization

- Original human design sketches preserved in `/system_design_sketches/` (read-only reference)- **Contract Validation**: System automatically checks if data slices match scaffold contracts

- Code structure documented in `/src/` with TypeScript types matching this plan

### Admin Pages (`/mgmt`)
- **Scaffold Management**:
  - Create/edit scaffolds with Monaco code editor
  - Contract editor (add/remove input/output fields)
  - LaTeX formula editor with KaTeX live preview
  - Test inference directly in UI (local + remote)
  - Upload and edit Python/JavaScript scripts
- **Model Fit Creation**:
  - Select asset, scaffold, data slice
  - Real-time contract validation with detailed errors
  - Automated training job execution
- **Batch Operations**:
  - Batch asset load: Paste tickers → auto-fetch data, create datasets
  - Batch initialization: Create multiple models at once
- **Detail Pages**: Individual views for assets, datasets, slices, scaffolds, fits, prophets, forecasts

### User Pages
- `/prophets` — List all active prophets
- `/prophets/:id` — **Prophet detail with client-side inference:**
  - Downloads model parameters + inference.js from S3
  - Executes inference on 1200 days of historical data in browser
  - Renders performance charts (predicted vs actual, error distribution)
  - Displays aggregate metrics (20d through 1200d windows)
  - **No server queries needed for historical performance!**
- `/prophets/leaderboard` — Performance ranking with filterable metrics:
  - MAPE, RMSE, directional accuracy across multiple time windows
  - Filter by asset, time window, model type
  - Sortable columns
- `/forecasts` — List active forecasts
- `/forecasts/:id` — Forecast detail with predicted vs actual chart

### Data & Models
- **Real Data**: DJIA/SPX daily OHLCV from Yahoo Finance → S3 CSVs
  - 2,513 records each (2015-11-09 to 2025-11-05)
- **Schema Analysis**: Automatic column/type/range detection for data slices
- **Default Models**: 
  - SLR-LAG-1-OHLCV (Simple Linear Regression, 1-day lag)
  - MLR-LAG-1-2-OHLCV (Multiple Linear Regression, 1&2-day lags)
- **Model Artifacts**: Parameters stored in S3 as JSON (e.g., regression coefficients)

### Automation
- **Daily Scheduler** (EventBridge + Lambda):
  - 06:00 ET: Fetch latest prices, run remote inference for all active prophets
  - 06:05 ET: Compute performance metrics, update rolling aggregates
  - Stores only aggregate metrics (cost optimization)
- **Dual Inference**:
  - Server-side: Daily predictions via Lambda
  - Client-side: Historical analysis in browser
- All AWS resources created by scripts (minimal manual setup)

## 📊 Acceptance Criteria (Alpha)

### Infrastructure
- [x] All 12 DynamoDB tables created and operational
- [x] S3 bucket with CORS enabled
- [x] Real DJIA/SPX data loaded to S3 (2,513 records each)
- [ ] EventBridge rules for daily scheduler
- [ ] Lambda functions for predictions and performance

### Contract-Based Scaffolds
- [ ] 2 default scaffolds created (SLR, MLR) with full contracts
- [ ] 6 executable scripts uploaded to S3 (train.py, inference.py, inference.js per scaffold)
- [ ] Contract validation working (checks field names, types, ranges)
- [ ] Schema analysis working (extracts columns/types from CSV)

### Model Fits & Prophets
- [ ] 2 data slices with analyzed schemas (DJIA_last2y, SPX_last2y)
- [ ] 4 model fits trained with parameters in S3
- [ ] 4 prophets created and linked to fits
- [ ] All prophets can execute local inference successfully

### Admin UI
- [ ] Scaffold list page with filters
- [ ] Scaffold create/edit page with:
  - [ ] Contract editor (add/edit/remove fields)
  - [ ] Monaco code editor for Python and JavaScript
  - [ ] LaTeX editor with KaTeX preview
  - [ ] Test inference UI (local + remote)
- [ ] Model fit creation wizard with contract validation
- [ ] Prophet management pages

### User Pages
- [ ] Prophet detail page with client-side inference:
  - [ ] Downloads parameters and script from S3
  - [ ] Executes inference on 1200 days in browser
  - [ ] Renders performance charts (Plotly)
  - [ ] Shows aggregate metrics from ProphetPerformanceSummary
- [ ] Prophet leaderboard with sortable/filterable metrics
- [ ] Prophet list page

### Automation
- [ ] Daily prediction Lambda (remote inference)
- [ ] Daily performance Lambda (aggregate computation)
- [ ] Forecasts table populated with predictions
- [ ] ProphetPerformanceSummary table with rolling metrics

### Deployment
- [ ] App deployed on Amplify
- [ ] Cognito login works
- [ ] All environment variables configured
- [ ] Visual stability: existing screens unchanged

## 📚 Key Concepts

### Contract-Based Validation
Data slices and scaffolds must have compatible contracts before model fits can be created. The system validates:
- All required input fields exist in the data slice
- Field types match (numerical, text, categorical, etc.)
- Value ranges are within allowed bounds

### Dual Inference Architecture
- **Server-side (Remote)**: Lambda executes Python inference scripts daily for predictions
- **Client-side (Local)**: Browser executes JavaScript inference scripts for historical analysis
- Benefits: Reduced server load, faster visualization, cost optimization

### Aggregate-Only Persistence
Daily scheduler computes performance metrics and stores only rolling aggregates (20d, 40d, 60d, etc.). Individual predictions are not persisted long-term. When users view prophet performance, predictions are computed on-demand in the browser using local inference.

---

**For detailed implementation steps, see `05-detailed-development-plan.md` (Sessions 4-7)**

## 🔒 IAM Philosophy

**You do (one-time):** Bootstrap credentials (temp admin or ChProphets-Bootstrap user)  
**Scripts do (automated):** All service roles, DDB tables, S3 bucket, Cognito pool, EventBridge rules, Lambdas

**Result:** Least-privilege service roles; no standing admin access; all resources tagged and auditable.

## 🐛 If Issues Arise

1. Check `00-AUDIT-AND-FIXES.md` for context on what was fixed
2. Verify `.env` has all required vars (AWS_ACCESS_KEY_ID, AWS_REGION, AWS_ACCOUNT_ID)
3. Run scripts in dependency order (1 → 2 → 3 → ...)
4. Review error messages; all scripts have clear exit messages
5. Report back; I'll debug and fix

## 📝 Notes

- **No visual changes:** Existing app screens unchanged; only new routes/components added
- **Planning complete:** All docs internally consistent, execution-ready
- **No code changes yet:** Awaiting your approval to proceed with implementation
- **API optional:** Can defer API Gateway to Phase 2; Alpha uses direct DDB access
- **ECS deferred:** Model training triggers mentioned; full ECS setup can be Phase 2 (Alpha uses pre-trained coefficients or client TF.js)

---

**Ready to start?** Review `05-detailed-development-plan.md` and confirm, or ask questions. Once approved, we'll execute session 0 (visual guardrails) and session 1 (IAM + AWS foundation scripts).
