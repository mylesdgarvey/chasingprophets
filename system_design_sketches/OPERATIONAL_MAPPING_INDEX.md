# Operational Mapping Index

**Version:** 1.0  
**Date:** November 5, 2025  
**Project:** Chasing Prophets  
**Purpose:** Master index for all operational flow documentation

---

## Overview

This directory contains detailed operational mappings that describe the **exact data flow** for every user task in the Chasing Prophets application. Each document traces the complete journey of data from user action through all system components (frontend, API Gateway, Lambda, DynamoDB, S3) to the final result.

---

## Document Organization

Operational mappings are organized by **page** to avoid character limits and improve maintainability. Each page may contain tasks for multiple user roles.

---

## Implemented Features (Alpha v1)

### 1. Login Page
**File:** `OPERATIONAL_MAPPING_LOGIN.md`  
**Status:** ✅ Fully Implemented  
**User Roles:** Guest (Unauthenticated)

**Tasks Covered:**
- **G-1:** Navigate to the Login page
- **G-2:** Submit credentials to log in
- **G-3:** Handle new password challenge on first login

**Key Components:**
- AWS Cognito User Pool
- Browser LocalStorage (token storage)
- Amplify Auth SDK
- AuthContext (React)

**Data Flow:**
```
User Input → Cognito Auth → JWT Tokens → LocalStorage → AuthContext → Dashboard Redirect
```

---

### 2. Dashboard Page
**File:** `OPERATIONAL_MAPPING_DASHBOARD.md`  
**Status:** 🟡 Partial (UI functional, test data only)  
**User Roles:** Authenticated User

**Tasks Covered:**
- **U-1:** View the main application dashboard
- **U-2:** View summary of market activity (hero metrics)
- **U-3:** View list of top-performing prophets (UI mockup)

**Key Components:**
- Test data file (`testData.ts`)
- Plotly.js charts
- Client-side metric calculations
- **Future:** API Gateway, Lambda, DynamoDB integration

**Data Flow (Current):**
```
Component Mount → Load Test Data → Calculate Metrics → Render Charts
```

**Data Flow (Future):**
```
Component → API Gateway → Lambda → DynamoDB Query → JSON Response → Render
```

**Note:** Prophet console is UI-only mockup. No real prophet data or inference engine implemented yet.

---

### 3. Assets Pages
**File:** `OPERATIONAL_MAPPING_ASSETS.md`  
**Status:** ✅ Fully Implemented  
**User Roles:** Authenticated User

**Tasks Covered:**

**Assets List (`/assets`):**
- **U-8:** Browse the full list of available assets
- **U-9:** Filter the asset list by letter (A-Z navigation)
- **U-5:** Search for a specific asset (global and page search)

**Asset Detail (`/assets/:assetId`):**
- **U-10:** View the detailed analysis page for an asset
- **U-11:** Analyze an asset's price chart (zoom, pan, hover)
- **U-12:** Add/remove technical indicators on the chart (SMA, EMA, Bollinger Bands, RSI, MACD)
- **U-13:** Change the time window (1M, 3M, 6M, 1Y, Max) and scale (Linear/Log)

**Key Components:**
- DynamoDB: `ChasingProphets-Assets` table
- S3: `chasing-prophets/data/{assetId}_prices.csv`
- API Gateway endpoints
- Lambda functions (getAssets, getAssetById, getAssetPrices)
- Plotly.js chart rendering
- Client-side technical indicator calculations

**Data Flow:**
```
User → API Gateway → Lambda → DynamoDB Get/Scan → JSON Response → Component State → UI Render
User → API Gateway → Lambda → S3 CSV Read → Parse & Filter → JSON Response → Plotly Chart
```

---

### 4. Settings Page
**File:** `OPERATIONAL_MAPPING_SETTINGS.md`  
**Status:** 🟡 Partial (Theme fully functional, Profile UI-only)  
**User Roles:** Authenticated User

**Tasks Covered:**
- **U-14:** Change the application's visual theme (7 themes available)
- **U-15:** Update user profile information (UI-only, no backend save)

**Key Components:**
- ThemeContext (React)
- Theme configurations (`themeConfigs.ts`)
- CSS custom properties (dynamic styling)
- LocalStorage (theme persistence)
- Plotly.js theme integration
- **Future:** DynamoDB `ChasingProphets-Users` table for profile data

**Data Flow (Theme):**
```
User Selection → ThemeContext Update → CSS Variables Applied → LocalStorage Save → Instant UI Re-style
```

**Data Flow (Profile - Future):**
```
User Input → API Gateway → Lambda → DynamoDB Update → Success Response → UI Confirmation
```

**Available Themes:**
1. Default (Light)
2. Dark
3. Midnight
4. Forest
5. Sunset
6. Ocean
7. High Contrast (Accessibility)

---

### 5. Global UI Elements
**File:** `OPERATIONAL_MAPPING_GLOBAL_UI.md`  
**Status:** ✅ Fully Implemented  
**User Roles:** All Authenticated Users

**Tasks Covered:**

**Sidebar Navigation:**
- **U-4:** Navigate between pages using the sidebar
- Collapse/expand sidebar (toggle)
- Active page highlighting

**Header Bar:**
- **U-5:** Global asset search with dropdown results
- Quick theme toggle (sun/moon icon)
- Responsive search with keyboard navigation

**Notifications:**
- **U-6:** View and manage notifications
- Mark as read (individual and bulk)
- Navigate to related entities
- **Future:** Real-time push notifications via WebSocket

**Session Management:**
- **U-7:** Log out of the application
- Clear Cognito tokens
- Clear application state
- Redirect to login

**Key Components:**
- React Router (client-side routing)
- AuthContext (session management)
- ThemeContext (theme toggle)
- NotificationContext (notification state)
- AWS Cognito (logout)
- API Gateway (search endpoint)
- DynamoDB: `ChasingProphets-Assets` (search)

**Data Flow (Navigation):**
```
Sidebar Link Click → React Router → URL Update → Route Match → Component Unmount/Mount
```

**Data Flow (Search):**
```
User Input (Debounced) → API Gateway → Lambda → DynamoDB Scan → JSON Response → Dropdown Render
```

**Data Flow (Logout):**
```
Logout Click → Cognito SignOut → Clear LocalStorage → Clear Contexts → Redirect to Login
```

---

## Not Yet Implemented (Design-Only)

The following pages and features are **documented in design specs** but **not yet implemented** in code:

### Signup/Verification Pages
- User registration
- Email verification
- Password reset

### Datasets Pages
- List datasets
- View dataset details
- Upload CSV data

### Data Slices Pages
- Create simple slices (date ranges)
- Create compound slices (multiple ranges)
- View slice details

### Model Scaffolds Pages
- List scaffolds
- Create/upload scaffold code
- Edit scaffold configurations (LaTeX formulas, input/output shapes)

### Model Fits Pages
- List model fits
- Trigger training jobs
- Monitor training status
- View training metrics

### Prophets Pages
- List all prophets
- View prophet details
- See prediction history
- Compare prophets side-by-side
- Activate/deactivate prophets

### Admin Pages (`/mgmt`)
- System dashboard
- CRUD operations for all entities
- Background job monitoring
- Manual data refresh triggers
- System logs viewer

---

## Document Structure

Each operational mapping document follows this structure:

### 1. Header
- Version, date, status
- Page and user role scope

### 2. Task Sections
Each task includes:
- **Task ID:** Unique identifier (e.g., U-8, G-2)
- **Task Name:** Brief description
- **Status:** ✅ Implemented, 🟡 Partial, ❌ Not Implemented
- **Operational Flow:** Step-by-step data flow (15-20 detailed steps)

### 3. Component Details
- Infrastructure component summary table
- DynamoDB table structures
- S3 bucket/key paths
- API endpoints
- Lambda functions

### 4. Data Examples
- Sample API requests/responses
- DynamoDB record structures
- LocalStorage keys/values
- CSV file formats

### 5. Performance & Security
- Expected response times
- Error handling
- Security considerations
- Accessibility features

---

## Key Infrastructure Components

### Frontend
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State:** Context API (Auth, Theme, Notifications)
- **Charts:** Plotly.js
- **Build:** Vite
- **Hosting:** AWS Amplify (CloudFront + S3)

### Backend
- **API:** AWS API Gateway (REST)
- **Compute:** AWS Lambda (Python 3.11 / Node.js 18)
- **Auth:** AWS Cognito User Pools
- **Database:** AWS DynamoDB (7 tables planned, 2 implemented)
- **Storage:** AWS S3 (`chasing-prophets` bucket)

### Development
- **Repository:** GitHub (`mylesdgarvey/chasingprophets`)
- **Branch:** `codespace-ideal-space-potato-r45vp4qg5xqp2px69`
- **Environment:** Dev Container (Ubuntu 24.04.2)

---

## DynamoDB Tables (Implemented)

### 1. ChasingProphets-Assets
**Status:** ✅ Implemented  
**Primary Key:** `assetId` (String)  
**Purpose:** Store asset metadata (ticker, name, type, sector, exchange)

**Used By:**
- Assets List page (scan all)
- Asset Detail page (get by ID)
- Global search (scan with filter)

### 2. Price Data (S3 CSVs)
**Status:** ✅ Implemented  
**Location:** `s3://chasing-prophets/data/{assetId}_prices.csv`  
**Format:** CSV with columns: date, open, high, low, close, volume

**Used By:**
- Asset Detail page (read and parse CSV)
- Dashboard page (test data only, not from S3)

---

## DynamoDB Tables (Planned, Not Implemented)

### 1. ChasingProphets-Datasets
**Primary Key:** `datasetId`  
**Purpose:** Define OHLCV datasets for assets

### 2. ChasingProphets-DataSlices
**Primary Key:** `sliceId`  
**Purpose:** Fixed time windows for training

### 3. ChasingProphets-ModelScaffolds
**Primary Key:** `scaffoldId`  
**Purpose:** Reusable model architectures

### 4. ChasingProphets-ModelFits
**Primary Key:** `modelFitId`  
**Purpose:** Trained models (scaffold + data slice + asset)

### 5. ChasingProphets-Prophets
**Primary Key:** `prophetId`  
**Purpose:** Live prediction engines (model fit + forecasting method)

### 6. ChasingProphets-ProphetPerformance
**Primary Key:** `prophetId`  
**Sort Key:** `date`  
**Purpose:** Daily prediction accuracy metrics

### 7. ChasingProphets-Users
**Primary Key:** `userId` (Cognito sub)  
**Purpose:** User preferences and profile data

---

## API Endpoints (Implemented)

### Assets
- `GET /api/assets` - List all assets
- `GET /api/assets/{assetId}` - Get asset details
- `GET /api/assets/{assetId}/prices` - Get price history
- `GET /api/assets/search?q={query}` - Search assets

### Authentication
- Handled entirely by AWS Cognito (no custom endpoints)

---

## API Endpoints (Planned, Not Implemented)

### Dashboard
- `GET /api/dashboard/summary` - System stats, top prophets

### Prophets
- `GET /api/prophets` - List all prophets
- `GET /api/prophets/{prophetId}` - Prophet details
- `GET /api/prophets/{prophetId}/model` - Presigned S3 URL for model
- `GET /api/prophets/{prophetId}/performance` - Historical metrics

### User
- `GET /api/user/preferences` - User settings
- `PUT /api/user/preferences` - Update settings

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/{notificationId}` - Mark as read

### Admin (All `/api/admin/*` endpoints not implemented)
- Datasets CRUD
- Data Slices CRUD
- Model Scaffolds CRUD
- Model Fits CRUD + training triggers
- Prophets CRUD + inference triggers

---

## Data Flow Patterns

### Pattern 1: Simple Data Fetch
```
User Action → Component → API Gateway → Lambda → DynamoDB Get → JSON → Component State → Render
```
**Example:** View asset detail page

### Pattern 2: Client-Side Processing
```
User Action → Component → API Fetch → JSON → Client-Side Calculation → Render
```
**Example:** Technical indicator overlays (SMA, RSI calculated in browser)

### Pattern 3: Context-Based State
```
User Action → Component → Context Method → State Update → All Subscribed Components Re-render
```
**Example:** Theme change, authentication state

### Pattern 4: LocalStorage Persistence
```
User Action → Context Update → LocalStorage Write → Page Reload → LocalStorage Read → Context Initialize
```
**Example:** Theme preference, auth tokens

### Pattern 5: Future Model Inference
```
User Action → API → Lambda → S3 Presigned URL → Client Download → TensorFlow.js Load → Inference → Chart Overlay
```
**Example:** Prophet prediction display (planned)

---

## Testing Checklist

Use these operational mappings to verify each flow:

### Login Page
- [ ] Navigate to login page (unauthenticated)
- [ ] Submit valid credentials → Dashboard redirect
- [ ] Submit invalid credentials → Error message
- [ ] New password challenge → Update password → Dashboard redirect
- [ ] Logout → Login redirect

### Dashboard Page
- [ ] View hero metrics (session drift, volatility, 52W high/low)
- [ ] Interact with main chart (zoom, pan, hover)
- [ ] Switch between DJIA and SPX
- [ ] Change time window (1W, 1M, 3M, All)
- [ ] Toggle linear/log scale
- [ ] View prophet cards (UI mockup)

### Assets Pages
- [ ] Browse assets list
- [ ] Filter by letter (A-Z navigation)
- [ ] Search for asset (global and page search)
- [ ] Click asset → Detail page
- [ ] View asset metadata and price chart
- [ ] Add/remove technical indicators
- [ ] Change time window and scale
- [ ] Download chart as PNG

### Settings Page
- [ ] View all 7 themes
- [ ] Select new theme → Instant UI change
- [ ] Theme persists across page reload
- [ ] Theme toggle in header works
- [ ] View profile form (UI-only)
- [ ] Submit profile changes (no backend save)

### Global UI
- [ ] Navigate using sidebar links
- [ ] Collapse/expand sidebar
- [ ] Active page highlighting
- [ ] Global search → Dropdown results → Navigate
- [ ] Keyboard navigation (arrows, enter, escape)
- [ ] View notifications → Mark as read
- [ ] Navigate to notification entity
- [ ] Logout → Clear session → Login redirect

---

## Maintenance Guidelines

### When Adding New Features

1. **Create new operational mapping document** (if new page) or **update existing document** (if new task on existing page)

2. **Follow standard structure:**
   - Task ID and name
   - Status indicator
   - 15-20 detailed operational flow steps
   - Component summary table
   - Data structure examples
   - Performance and security notes

3. **Update this index:**
   - Add task to appropriate section
   - Update status indicators
   - Add new API endpoints
   - Add new DynamoDB tables

4. **Cross-reference related documents:**
   - Link to architecture docs
   - Reference database schema
   - Note dependencies on other features

### When Implementing Planned Features

1. **Update status indicators:**
   - Change ❌ to 🟡 or ✅
   - Add implementation notes

2. **Add actual data flow:**
   - Real API endpoints
   - Actual DynamoDB queries
   - Confirmed table structures

3. **Include performance metrics:**
   - Measured response times
   - Actual database query times
   - Real-world latency

4. **Document edge cases:**
   - Error handling (as implemented)
   - Validation rules
   - Rate limits

---

## Document Versions

| File | Version | Last Updated | Status |
|------|---------|--------------|--------|
| `OPERATIONAL_MAPPING_LOGIN.md` | 1.0 | 2025-11-05 | ✅ Complete |
| `OPERATIONAL_MAPPING_DASHBOARD.md` | 1.0 | 2025-11-05 | ✅ Complete |
| `OPERATIONAL_MAPPING_ASSETS.md` | 1.0 | 2025-11-05 | ✅ Complete |
| `OPERATIONAL_MAPPING_SETTINGS.md` | 1.0 | 2025-11-05 | ✅ Complete |
| `OPERATIONAL_MAPPING_GLOBAL_UI.md` | 1.0 | 2025-11-05 | ✅ Complete |

---

## Related Documentation

- **System Design:** `SYSTEM_DESIGN.md` - High-level architecture
- **Architecture:** `ARCHITECTURE.md` - AWS infrastructure details
- **Database Schema:** `DATABASE_SCHEMA.md` - DynamoDB table specs
- **User Tasks:** `USER_INTERACTIONS_AND_TASKS.md` - Full task catalog
- **Frontend Screens:** `FRONTEND_SCREENS.md` - UI specifications

---

## Contact & Questions

For questions about these operational mappings or to request additional detail:
- Review the specific operational mapping document
- Check related architecture docs
- Consult the codebase (`src/` directory)

---

**End of Operational Mapping Index**
