# Chasing Prophets - Frontend Screens & Navigation

**Version:** 1.0  
**Date:** November 4, 2025  
**Status:** Screen Flow Design

---

## Navigation Overview

```
┌─────────────┐
│ Login Page  │
└──────┬──────┘
       │
       ├──→ No Auth ──→ Signup Page
       │
       └──→ Verified ──→ Dashboard
                            │
                ┌───────────┼───────────┬────────────┬──────────────┐
                │           │           │            │              │
            ┌───▼────┐  ┌───▼─────┐ ┌──▼──────┐ ┌──▼────────┐ ┌───▼────────┐
            │ Assets │  │Datasets │ │Data     │ │Model Fits │ │  Prophets  │
            │        │  │         │ │Slices   │ │           │ │            │
            └───┬────┘  └───┬─────┘ └──┬──────┘ └──┬────────┘ └───┬────────┘
                │           │           │           │              │
                │           │           │           │              │
          ┌─────▼─────┐ ┌───▼─────────▼───────────▼──────────────▼──────┐
          │ Asset     │ │                                                 │
          │ Detail    │ │        System Management (Admin Only)          │
          │  Page     │ │                                                 │
          └───────────┘ │  ┌──────────────────────────────────────────┐  │
                        │  │ Mgmt/assets/:assetId                     │  │
                        │  │ Mgmt/datasets/:datasetId                 │  │
                        │  │ Mgmt/dataslices/:dataSliceId             │  │
                        │  │ Mgmt/model-scaffolds/:scaffoldId         │  │
                        │  │ Mgmt/model-fits/:modelFitId              │  │
                        │  │ Mgmt/prophets/:prophetId                 │  │
                        │  │ Mgmt/SYSTEM                              │  │
                        │  └──────────────────────────────────────────┘  │
                        └─────────────────────────────────────────────────┘
                        
            ┌───────────────────┐
            │ Prophet Detail    │
            │ prophets/         │
            │ :prophetId        │
            └───────────────────┘
```

---

## Screen Inventory

### 1. Authentication Screens

#### `/login` - Login Page
**Access:** Public (unauthenticated only)  
**Purpose:** User authentication  
**Navigation:**
- Success → `/dashboard`
- No account → `/signup`

**Elements:**
- Username/email input
- Password input
- Login button
- "Sign up" link
- Error message display

---

#### `/signup` - Signup Page
**Access:** Public (unauthenticated only)  
**Purpose:** New user registration  
**Navigation:**
- Success → `/login` (with verification)
- Already have account → `/login`

**Elements:**
- Email input
- Username input
- Password input
- Confirm password input
- Sign up button
- "Already have account" link

---

### 2. Main Navigation Screens

#### `/dashboard` - Dashboard (Main Hub)
**Access:** All authenticated users (user, admin)  
**Purpose:** Central navigation and overview  

**Navigation Links:**
- → `/assets` - Browse all assets
- → `/datasets` - View datasets
- → `/dataslices` - View data slices
- → `/model-fits` - View model fits
- → `/prophets` - Browse prophets
- → `/mgmt` - System Management (Admin only)

**Elements:**
- Quick stats cards (total assets, active prophets, etc.)
- Recent activity feed
- Featured prophets carousel
- Market overview charts
- Navigation cards to main sections

---

### 3. Entity List Screens

#### `/assets` - Assets List
**Access:** All authenticated users  
**Purpose:** Browse and search all tracked assets  

**Navigation:**
- Click asset → `/assets/:assetId`

**Elements:**
- Search/filter bar
- Asset cards grid showing:
  - Ticker symbol
  - Asset name
  - Current price
  - Price change
  - Type (stock, index, etc.)
- Sort options (alphabetical, by performance, by volume)
- Pagination

---

#### `/assets/:assetId` - Asset Detail Page
**Access:** All authenticated users  
**Purpose:** Detailed view of a specific asset  

**Navigation:**
- → Related datasets
- → Prophets tracking this asset
- Back to `/assets`

**Elements:**
- Asset header (name, ticker, logo, description)
- Price chart (OHLCV)
- Technical indicators
- Related datasets list
- Related prophets list
- Performance metrics
- News/sentiment (future)

---

#### `/datasets` - Datasets List
**Access:** All authenticated users  
**Purpose:** Browse all datasets  

**Navigation:**
- Click dataset → `/datasets/:datasetId`

**Elements:**
- Dataset cards showing:
  - Dataset name
  - Asset reference
  - Type (OHLCV, fundamentals, etc.)
  - Date range
  - Number of records
  - Live status
- Filter by asset, type, date range

---

#### `/datasets/:datasetId` - Dataset Detail
**Access:** All authenticated users  
**Purpose:** View dataset details and slices  

**Elements:**
- Dataset metadata
- Data preview table
- Column definitions (CEE)
- Related data slices
- Download options (CSV, JSON)
- Visualization

---

#### `/dataslices` - Data Slices List
**Access:** All authenticated users  
**Purpose:** Browse data slices  

**Navigation:**
- Click slice → `/dataslices/:dataSliceId`

**Elements:**
- Slice cards showing:
  - Slice ID
  - Parent dataset
  - Date range
  - Type (simple/compound)
  - Number of records
- Filter by dataset, date range, type

---

#### `/dataslices/:dataSliceId` - Data Slice Detail
**Access:** All authenticated users  
**Purpose:** View slice composition and usage  

**Elements:**
- Slice metadata
- For compound slices: list of component slices
- Data preview
- Used by model fits (list)
- Visualization

---

#### `/model-fits` - Model Fits List
**Access:** All authenticated users  
**Purpose:** Browse trained models  

**Navigation:**
- Click fit → `/model-fits/:modelFitId`

**Elements:**
- Model fit cards showing:
  - Fit name
  - Scaffold type
  - Asset
  - Training status
  - Model size
  - Performance metrics
- Filter by scaffold, asset, status

---

#### `/model-fits/:modelFitId` - Model Fit Detail
**Access:** All authenticated users  
**Purpose:** View model details and performance  

**Elements:**
- Model metadata
- Training information (date, slices used)
- Performance metrics
- Model architecture diagram
- Download model (if permitted)
- Used by prophets (list)

---

#### `/prophets` - Prophets List
**Access:** All authenticated users  
**Purpose:** Browse and discover prophets  

**Navigation:**
- Click prophet → `/prophets/:prophetId`

**Elements:**
- Prophet cards showing:
  - Prophet name
  - Asset
  - Performance metrics (MAPE, accuracy)
  - Status (active/inactive)
  - Last updated
- Sort by performance, asset, date
- Filter by asset, performance threshold

---

#### `/prophets/:prophetId` - Prophet Detail Page
**Access:** All authenticated users  
**Purpose:** View prophet predictions and performance  

**Elements:**
- Prophet header (name, description)
- Asset information
- Performance dashboard
  - MAPE over time
  - Prediction accuracy
  - Directional accuracy
- Prediction chart (predictions vs actuals)
- Model fits used (list with links)
- Training slices used
- Download predictions (CSV)
- Performance metrics table

---

### 4. Admin Management Screens

#### `/mgmt` - System Management Dashboard
**Access:** Admin only  
**Purpose:** Central admin hub  

**Navigation:**
- → `/mgmt/assets` - Manage assets
- → `/mgmt/datasets` - Manage datasets
- → `/mgmt/dataslices` - Manage data slices
- → `/mgmt/model-scaffolds` - Manage model scaffolds
- → `/mgmt/model-fits` - Manage model fits
- → `/mgmt/prophets` - Manage prophets
- → `/mgmt/system` - System settings

**Elements:**
- Quick action buttons (Create new asset, Create new prophet, etc.)
- System health indicators
- Recent admin activity log
- Background job status
- User management (future)

---

#### `/mgmt/assets/:assetId` - Manage Asset
**Access:** Admin only  
**Purpose:** CRUD operations for assets  

**Elements:**
- Asset form:
  - Ticker symbol
  - Name
  - Description
  - Type (dropdown)
  - Sector
  - Exchange
  - Logo upload
  - Active status toggle
- Save/Cancel buttons
- Delete button (with confirmation)
- View public page link

---

#### `/mgmt/datasets/:datasetId` - Manage Dataset
**Access:** Admin only  
**Purpose:** CRUD operations for datasets  

**Elements:**
- Dataset form:
  - Dataset name
  - Asset selector (dropdown)
  - Type (OHLCV, fundamentals, etc.)
  - Column definitions (CEE)
  - S3 folder path
  - Live status toggle
  - Upload CSV
- Refresh data button (trigger data pull)
- Save/Cancel buttons
- Delete button

---

#### `/mgmt/dataslices/:dataSliceId` - Manage Data Slice
**Access:** Admin only  
**Purpose:** CRUD operations for data slices  

**Elements:**
- Data slice form:
  - Slice ID (auto-generated or custom)
  - Parent dataset selector
  - Start date picker
  - End date picker
  - Slice type (simple/compound radio)
  - For compound: multi-select child slices
- Preview data button
- Save/Cancel buttons
- Delete button

---

#### `/mgmt/model-scaffolds/:scaffoldId` - Manage Model Scaffold
**Access:** Admin only  
**Purpose:** CRUD operations for model scaffolds  

**Elements:**
- Scaffold form:
  - Scaffold ID
  - Name
  - Type (ML, DL, TS, ECON dropdown)
  - Input features (list editor)
  - Output features (list editor)
  - Hyperparameters (JSON editor)
  - Description (rich text editor)
  - Formula (LaTeX editor)
  - Code upload (Python file)
- Test scaffold button (validate code)
- Save/Cancel buttons
- Delete button
- View all fits using this scaffold

---

#### `/mgmt/model-fits/:modelFitId` - Manage Model Fit
**Access:** Admin only  
**Purpose:** CRUD operations and training jobs  

**Elements:**
- Model fit form:
  - Fit name
  - Scaffold selector (dropdown)
  - Asset selector
  - Training slices selector (multi-select)
  - Custom hyperparameters override (JSON)
  - Code override upload (optional)
- Train model button (trigger ECS job)
- Training status indicator
- Training logs viewer (real-time)
- Model file download
- Save/Cancel buttons
- Delete button

---

#### `/mgmt/prophets/:prophetId` - Manage Prophet
**Access:** Admin only  
**Purpose:** CRUD operations for prophets  

**Elements:**
- Prophet form:
  - Prophet name (auto-generated or custom)
  - Asset selector
  - Datasets selector (multi-select)
  - Training slices selector (multi-select)
  - Model fits selector (multi-select)
  - Output measure (dropdown: close_price, returns, volatility, etc.)
  - Forecast method (dropdown: direct, iterative, multi-step)
  - Inference code upload (optional custom code)
  - Active status toggle
- Run inference button (trigger prophet update)
- Performance metrics preview
- Save/Cancel buttons
- Delete button
- View public page link

---

#### `/mgmt/system` - System Settings
**Access:** Admin only  
**Purpose:** Global system configuration  

**Elements:**
- Data pipeline settings:
  - Data provider API keys
  - Update schedule (cron editor)
  - Retry policies
- Compute settings:
  - ECS cluster configuration
  - Lambda timeout settings
  - Training job limits
- Storage settings:
  - S3 bucket paths
  - Cleanup policies
  - Model retention
- User management:
  - Invite users
  - Manage roles
  - View activity logs
- System logs viewer
- Manual triggers:
  - Run daily data update now
  - Run all prophet updates now
  - Clear cache

---

## User Flows

### Guest/Unauthenticated User Flow
```
1. Visit site → Redirected to /login
2. No account → /signup
3. Enter details → Email verification
4. Verify email → /login
5. Login → /dashboard
```

### Regular User Flow (Browse & Discover)
```
1. Login → /dashboard
2. Browse prophets → /prophets
3. Click prophet → /prophets/:prophetId
4. View predictions and performance
5. Explore related assets → /assets/:assetId
6. View asset details and other prophets for same asset
```

### Admin Flow (Create New Prophet)
```
1. Login → /dashboard
2. Navigate to System Management → /mgmt
3. Create/verify asset exists → /mgmt/assets/:assetId
4. Create/verify dataset exists → /mgmt/datasets/:datasetId
5. Create data slice → /mgmt/dataslices/:dataSliceId
6. Create/select model scaffold → /mgmt/model-scaffolds/:scaffoldId
7. Train model fit → /mgmt/model-fits/:modelFitId (trigger training)
8. Wait for training completion (status updates)
9. Create prophet → /mgmt/prophets/:prophetId
10. Run inference → Trigger prophet update
11. View public page → /prophets/:prophetId
```

### Admin Flow (Daily Maintenance)
```
1. Login → /dashboard
2. Navigate to System Management → /mgmt/system
3. Review background job status
4. Manually trigger data update if needed
5. Check prophet update results
6. Review system logs for errors
```

---

## Navigation Menu Structure

### Sidebar (All Users)
```
├─ Dashboard
├─ Assets
│  └─ [Asset Detail]
├─ Datasets (optional for users, may hide)
├─ Data Slices (optional, may hide)
├─ Model Fits (optional, may show top performers)
├─ Prophets
│  └─ [Prophet Detail]
└─ Settings
```

### Sidebar (Admin Additional)
```
└─ System Management
   ├─ Manage Assets
   ├─ Manage Datasets
   ├─ Manage Data Slices
   ├─ Manage Model Scaffolds
   ├─ Manage Model Fits
   ├─ Manage Prophets
   └─ System Settings
```

---

## Page-Specific Navigation Breadcrumbs

### Example: Prophet Detail Page
```
Dashboard > Prophets > TimeSage AI - SPX
```

### Example: Admin Manage Model Fit
```
Dashboard > System Management > Model Fits > SLR-NonMasked-Lag1
```

---

## Key Interaction Patterns

### 1. Card-Based Lists
All list screens use card layouts with:
- Thumbnail/icon
- Title
- Key metrics
- Status indicators
- Click to navigate to detail

### 2. Detail Pages
All detail pages have:
- Header section (title, key info, actions)
- Tabs or sections (Overview, Performance, Related Items, etc.)
- Related entities (clickable links)
- Action buttons (Edit for admins, Favorite for users)

### 3. Admin Forms
All admin management pages have:
- Form fields with validation
- Save/Cancel/Delete buttons
- Preview/Test functionality
- Status indicators for async operations
- Confirmation dialogs for destructive actions

### 4. Real-time Updates
Pages with background jobs show:
- Status badges (Training, Processing, Complete, Failed)
- Progress indicators
- Log streams (for training jobs)
- Auto-refresh or WebSocket updates

---

## Mobile Considerations

### Responsive Breakpoints
- **Desktop:** Full sidebar, multi-column layouts
- **Tablet:** Collapsible sidebar, 2-column layouts
- **Mobile:** Hamburger menu, single-column, swipeable tabs

### Mobile Navigation
- Bottom tab bar for main sections
- Hamburger menu for secondary navigation
- Swipe gestures for navigating between detail tabs
- Pull-to-refresh on list screens

---

## Future Enhancements

### Phase 2 Screens
- `/forecasts` - User-created forecast chains
- `/forecasts/:forecastId` - Forecast detail and comparison
- `/leaderboard` - Top performing prophets globally
- `/compare` - Side-by-side prophet comparison
- `/portfolio` - User's favorite prophets dashboard

### Phase 3 Screens
- `/marketplace` - Prophet marketplace (buy/sell)
- `/studio` - Prophet builder (visual editor)
- `/community` - Social features, comments, sharing
- `/alerts` - Custom alert configuration
- `/api` - API key management for developers

---

## Summary

**Total Screens (v1):**
- 3 Auth screens (Login, Signup, Verification)
- 1 Dashboard
- 10 Entity list screens (Assets, Datasets, Slices, Scaffolds, Fits, Prophets + their details)
- 7 Admin management screens
- 1 System settings screen

**~22 unique screens/routes for v1 alpha**

All screens follow consistent design patterns and navigation structures, making the system intuitive and scalable for future features.

