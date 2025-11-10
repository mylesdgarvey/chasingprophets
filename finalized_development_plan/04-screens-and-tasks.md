# Screens, roles, and where work executes

Date: 2025-11-06
Status: Updated for contract-based scaffold system and dual inference architecture

## Roles
- Guest: unauthenticated
- User: authenticated
- Admin: authenticated, in Cognito `admin` group

## Screens and what runs where

- /login (Guest)
  - React renders form; uses Cognito Hosted UI or SDK flows (client)
- /signup (Guest) — planned
  - React UI → Cognito sign-up (client) → email verification in Cognito
- /dashboard (User)
  - React renders widgets; loads summaries (client). Data source: DynamoDB via services (initially direct from SDK; later via API Gateway)
- /assets (User)
  - React lists Assets from DDB; search/filter (client)
- /assets/:ticker (User)
  - React + Plotly chart; indicators computed client-side
  - Data from DDB (initial) or GET /assets/{ticker} (later)
- /prophets/:id (User)
  - **Client-side local inference** (if scaffold has inferenceMode = 'local' or 'hybrid'):
    - React fetches prophet metadata, model fit, model parameters from S3
    - Downloads local inference script (JavaScript) from S3
    - Fetches historical OHLCV data from S3 (past 1200 days)
    - **Executes inference in browser**: For each day, apply model → generate prediction → compare to actual
    - Computes performance metrics client-side (MAPE, RMSE, directional accuracy)
    - Renders Plotly charts: predicted vs actual, error distribution, rolling metrics
  - **Remote inference fallback** (if inferenceMode = 'remote'):
    - React calls API: GET /api/prophets/:prophetId/historical-inference?days=1200
    - Lambda executes remote inference script (Python) and returns predictions
    - React renders charts from API response
- /prophets/leaderboard (User)
  - Performance board ranking all prophets by metrics from ProphetPerformanceSummary table
  - Metrics: MAPE, RMSE, directional accuracy, percentile errors
  - Filterable by asset, time window (20d, 40d, 60d, 120d, 240d, 480d, 1080d, 1200d)
  - Sortable by any metric column
- /forecasts (User) — planned
  - List active forecasts for user's followed assets
- /forecasts/:forecastId (User) — planned
  - Forecast detail: predicted path vs actual (if past horizon), prophet used, performance summary
- /settings (User)
  - Theme persisted locally; profile save later via API

- /mgmt (Admin) — planned
  - Overview cards; system health; links to sub-screens
- /mgmt/batch-init (Admin) — planned
  - Batch initialization UI: text box for JSON array of scaffolds/slices/fits/prophets; button to trigger creation in order
- /mgmt/batch-assets (Admin) — planned
  - Asset batch load: paste list of tickers (JSON or CSV); system fetches data, creates datasets, applies default scaffolds/fits/prophets to all
- /mgmt/assets (Admin)
  - CRUD assets (client → API → DDB)
- /mgmt/assets/:ticker (Admin)
  - Read-only detail + edit panel for one asset (metadata, latest dataset links, related prophets)
- /mgmt/datasets (Admin)
  - Upload CSV to S3, create Dataset in DDB (client → API → S3+DDB)
- /mgmt/datasets/:datasetId (Admin)
  - Dataset detail: schema preview, S3 source location, associated slices, backfill/refresh actions
- /mgmt/dataslices (Admin)
  - Define slices; system analyzes schema from CSV (client → API → S3 read → DDB)
  - **Schema analysis**: Extracts column names, types, and value ranges automatically
  - Stores availableColumns, columnTypes, columnRanges in DataSlice record
- /mgmt/dataslices/:dataSliceId (Admin)
  - Slice detail: schema preview, date range, record count
  - Compatible scaffolds list (based on contract validation)
  - Links to fits using this slice
- /mgmt/models (Admin)
  - Hub for scaffold and fit management
- /mgmt/models/scaffolds (Admin)
  - List all scaffolds with filters (type, contextualized, inference mode)
  - Create new scaffold button → navigate to create page
- /mgmt/models/scaffolds/new (Admin)
  - **Contract editor**: Define input/output contracts
    - Add/edit/remove fields (name, type, required, min/max values, allowed values, description)
  - **Metadata editor**: Name, description, model type, isContextualized flag, inference mode
  - **Code editors** (Monaco):
    - Training script tab (train.py): Python syntax highlighting
    - Remote inference script tab (inference.py): Python syntax highlighting
    - Local inference script tab (inference.js): JavaScript syntax highlighting (optional based on inference mode)
  - **Formula editor**: LaTeX input with KaTeX live preview
  - **Save button**: Validates and uploads scripts to S3, creates scaffold record in DynamoDB
- /mgmt/models/scaffolds/:scaffoldId (Admin)
  - Scaffold detail: all metadata, rendered LaTeX formula, contract specifications
  - **Edit mode**: Same UI as create page, pre-populated with existing data
  - **Test inference section**:
    - Input: JSON object matching input contract
    - "Test Remote Inference" button → calls Lambda with test data
    - "Test Local Inference" button → executes JavaScript in browser
    - Output: JSON result with predicted values
  - **Version history**: List of script changes (if implemented)
  - **Usage stats**: Count of model fits using this scaffold
- /mgmt/models/fits/new (Admin)
  - **Step 1**: Select Asset (dropdown)
  - **Step 2**: Select Scaffold (dropdown, optionally filtered by asset compatibility)
  - **Step 3**: Select Data Slice (dropdown, filtered by contract validation)
    - Shows compatibility warnings if contract doesn't match perfectly
    - Displays: Required fields present ✓/✗, Type matches ✓/✗, Value ranges valid ✓/✗
  - **Step 4**: Review and confirm
  - **Create button**: 
    - Creates ModelFit record in "unfit" status
    - Copies scaffold's script paths to fit
    - Optionally triggers training job (Lambda or ECS)
  - **Training progress**: Polls fit status; updates UI when complete
- /mgmt/models/fits/:modelFitId (Admin)
  - Fit detail: training metrics, model parameters (S3 link), status
  - **Performance visualization**: Client-side local inference on training data
    - Shows predicted vs actual, error metrics
  - **Re-train button**: Triggers new training job
  - **Prophet creation**: "Create Prophet from this Fit" button
- /mgmt/prophets (Admin)
  - List all prophets with status (active/inactive)
  - Create prophet from a model fit (select fit → set name, description, output measure)
  - Bulk actions: Activate/deactivate multiple prophets
- /mgmt/prophets/:prophetId (Admin)
  - Prophet configuration: name, description, model fit link, forecast method, output measure
  - **Status controls**: Activate/deactivate toggle
  - **Performance snapshot**: Latest aggregated metrics from ProphetPerformanceSummary
  - **Manual inference trigger**: "Run Inference Now" button (calls Lambda immediately)
  - **Full performance view**: Link to /mgmt/performance/:prophetId
- /mgmt/forecasts (Admin) — planned
  - List + create forecasts (select prophet, horizon: 20/60/120/240 days, start date)
- /mgmt/forecasts/:forecastId (Admin) — planned
  - Forecast detail + status; trigger re-run; view predictions
- /mgmt/performance/:prophetId (Admin)
  - Time-series metrics (MAE, RMSE, MAPE, directional accuracy, percentile errors) over selectable windows

## Execution placement summary

### Client-side (React in Browser)
- **UI rendering**: All page layouts, forms, tables, charts
- **Interactivity**: Filters, sorting, searching
- **Technical indicators**: Computed on OHLCV data client-side
- **Local inference** (for scaffolds with inferenceMode = 'local' or 'hybrid'):
  - Downloads model parameters and JavaScript inference script from S3
  - Executes inference on historical data (up to 1200 days)
  - Computes performance metrics (MAPE, RMSE, directional accuracy)
  - Renders Plotly charts without server queries
- **Contract validation UI**: Real-time validation feedback when creating model fits

### Server-side Lambda (Python)
- **CRUD operations**: DynamoDB reads/writes via API Gateway
- **S3 pre-signed URLs**: Generate temporary URLs for client access to scripts and parameters
- **Remote inference** (scheduled and on-demand):
  - Downloads model parameters and Python inference script from S3
  - Executes inference on new data
  - Returns predictions or stores in Forecasts/Performance tables
- **Training orchestration**: Triggers ECS tasks or runs simple training directly
- **Schema analysis**: Reads CSV from S3, extracts columns/types/ranges for DataSlice creation
- **Contract validation**: Server-side validation before allowing model fit creation

### Server-side ECS (Docker, Python)
- **Model training** (for complex models requiring more compute):
  - Loads training script from S3
  - Loads data slice from S3
  - Executes training (scikit-learn, TensorFlow, PyTorch, etc.)
  - Stores model parameters in S3
  - Updates ModelFit status in DynamoDB

### EventBridge + Lambda (Scheduled)
- **Daily 06:00 ET**:
  - **Lambda: chp-daily-data-refresh**
    - Fetches latest OHLCV data for all assets (Yahoo Finance)
    - Uploads to S3 as CSV
    - Updates Dataset records
  - **Lambda: chp-daily-predictions**
    - For each active prophet:
      - Loads model parameters from S3
      - Downloads remote inference script from S3
      - Executes inference on latest data
      - Stores prediction in Forecasts table
  - **Lambda: chp-daily-performance**
    - For each prophet:
      - Fetches yesterday's prediction
      - Fetches today's actual price
      - Computes error metrics
      - Updates rolling aggregates (20d through 1200d windows)
      - Writes to ProphetPerformanceSummary table
      - Does NOT persist individual predictions long-term (cost optimization)

### NPM Dependencies (New)
- **Monaco Editor** (`@monaco-editor/react`): Code editing for scaffold scripts
- **KaTeX** (`katex`, `react-katex`): LaTeX formula rendering
- **Plotly.js** (existing): Charting and visualization

Reference: See SYSTEM_DESIGN.md and OPERATIONAL_MAPPING_* docs for detailed actions and UI flows.

---

## Visual stability guardrails (explicit)
- Do not alter existing look and feel (layout, typography, colors, spacing) on current screens.
- New admin screens must inherit the existing layout shell and component styles.
- Any needed shared components must be added as drop-in, non-breaking additions.
- Changes to global CSS/tokens require explicit approval and must be visually no-op for existing pages.