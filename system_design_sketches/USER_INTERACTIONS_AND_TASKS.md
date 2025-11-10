# User Interactions and Tasks Analysis# Chasing Prophets — User Interactions & Tasks Catalog# Chasing Prophets — User Interactions & Tasks Catalog# Chasing Prophets — User Interactions & Tasks Catalog



**Version:** 1.0

**Date:** November 5, 2025

**Status:** Initial Draft**Version:** 3.0 — Implemented Features Only  



---**Date:** November 5, 2025  



## 1. Objective**Status:** Revised to match actual working code (excludes `/code_generated` folder)**Version:** 2.0  Version: 1.0  



This document breaks down the application's functionality into specific user roles and the tasks they can perform. This serves as a foundation for understanding user flows and feature requirements.

> Policy Update (November 5, 2025): CSV downloads are removed across user flows. Inline preview (tables/charts) replaces file downloads for datasets, data slices, predictions, and performance. Admins may receive future export tools via reports, but end-users do not download CSVs in alpha. Any mentions of “Download CSV/Predictions/Data” below are deprecated and superseded by this policy.



## 2. User Roles---**Date:** November 5, 2025  Date: November 4, 2025  



There are three primary user roles envisioned for this application:



1.  **Guest (Unauthenticated):** Any visitor who has not logged in.## IMPORTANT: Scope of This Document**Status:** Revised to align with core system purposeSource basis: `FRONTEND_SCREENS.md`, `DATABASE_SCHEMA.md`, `ARCHITECTURE.md` (plus prior whiteboard images referenced in docs)

2.  **User (Authenticated):** The standard user who logs in to analyze assets and prophets.

3.  **Admin (Authenticated):** A privileged user responsible for managing the system's data and processes.



## 3. Task Analysis by RoleThis version catalogs **ONLY** the features that are currently implemented and working in the codebase. All future/planned features are clearly marked in a separate section at the end.



### **Role 1: Guest (Unauthenticated)**



A guest's interaction is limited to the authentication process.**What's Implemented:**---Note on prior images: The whiteboard/UI diagrams referenced in earlier chat aren’t attached in this workspace. This catalog reflects those concepts where they’re already embedded in the design docs (e.g., prophet composition, admin flows). If you want this aligned pixel-for-pixel with the images, share them and we’ll refine labels and groupings.



| Task ID | Task Description | Associated Screen(s) | Status |- ✅ Login (with Cognito)

| :--- | :--- | :--- | :--- |

| G-1 | Navigate to the Login page | `/login` | ✅ **Implemented** |- ✅ Dashboard (with hardcoded test data for DJIA/SPX)

| G-2 | Submit credentials to log in | `/login` | ✅ **Implemented** |

| G-3 | Be prompted for a new password on first login | `/login` | ✅ **Implemented** |- ✅ Assets list (letter-based navigation, DynamoDB integration)

| G-4 | Navigate to the Signup page | `/signup` | ❌ **Not Implemented** |

| G-5 | Create a new account | `/signup` | ❌ **Not Implemented** |- ✅ Asset detail page (full charting, indicators, widgets)## 1. System Purpose & Alpha Scope---



---- ✅ Settings (theme selection, UI-only profile form)



### **Role 2: User (Authenticated)**- ✅ Layout (sidebar, search, notifications, theme toggle)



This role has access to the main analytics features of the application.



| Task ID | Task Description | Associated Screen(s) | Status |**What's NOT Implemented (Design-Only):****Chasing Prophets** helps users identify which "prophets" (trained models + forecasting methods) best predict future outcomes for financial assets.## Scope & Roles

| :--- | :--- | :--- | :--- |

| U-1 | View the main application dashboard | `/dashboard` | 🟡 **Partial** |- ❌ Signup/verification pages

| U-2 | View a summary of market activity | `/dashboard` | 🟡 **Partial (Mock Data)** |

| U-3 | View a list of top-performing prophets | `/dashboard` | 🟡 **Partial (UI Mockup)** |- ❌ Datasets, Data Slices, Model Fits, Model Scaffolds pages

| U-4 | Navigate between pages using the sidebar | Global | ✅ **Implemented** |

| U-5 | Search for a specific asset | Global | ✅ **Implemented** |- ❌ Prophets pages (list and detail)

| U-6 | View and manage notifications | Global | ✅ **Implemented** |

| U-7 | Log out of the application | Global | ✅ **Implemented** |- ❌ All `/mgmt` admin pages### Core Conceptual ModelThis file enumerates every observable user interaction and task in the v1 alpha:

| U-8 | Browse the full list of available assets | `/assets` | ✅ **Implemented** |

| U-9 | Filter the asset list by letter | `/assets` | ✅ **Implemented** |- ❌ CSV uploads, training jobs, inference jobs

| U-10 | View the detailed analysis page for an asset | `/assets/:ticker` | ✅ **Implemented** |

| U-11 | Analyze an asset's price chart | `/assets/:ticker` | ✅ **Implemented** |- ❌ System settings, logs viewer, manual triggers- Roles: Guest (unauthenticated), Authenticated User, Admin.

| U-12 | Add/remove technical indicators on the chart | `/assets/:ticker` | ✅ **Implemented** |

| U-13 | Change the time window and scale of the chart | `/assets/:ticker` | ✅ **Implemented** |

| U-14 | Change the application's visual theme | `/settings` | ✅ **Implemented** |

| U-15 | Update their user profile information | `/settings` | 🟡 **Partial (UI Only)** |---**Assets** → **Datasets** → **Data Slices** → **Model Scaffolds** → **Model Fits** → **Prophets** → **Performance Metrics**- Domains: Auth, Dashboard, Assets, Datasets, Data Slices, Model Fits, Prophets, System Management, Settings, Notifications.

| U-16 | Browse the full list of available prophets | `/prophets` | ❌ **Not Implemented** |

| U-17 | View the detailed performance page for a prophet | `/prophets/:id` | ❌ **Not Implemented** |

| U-18 | Evaluate a prophet's predictions against historical data | `/prophets/:id` | ❌ **Not Implemented** |

## 1. System Purpose & Implementation Status- Cross-cutting: Charts, Lists, File Upload/Download, Async jobs, Errors & confirmations.

---



### **Role 3: Admin (Authenticated)**

**Chasing Prophets** helps users identify which "prophets" (trained models + forecasting methods) best predict future outcomes for financial assets.- **Assets:** Objects being predicted (stocks, indices like DJIA, SPX)

This role is responsible for the entire data lifecycle and system management. *None of these tasks are currently implemented.*



| Task ID | Task Description | Associated Screen(s) | Status |

| :--- | :--- | :--- | :--- |**Alpha Implementation Status:**- **Datasets:** Standardized OHLCV data about assets (mostly "live," updated daily)Conventions:

| A-1 | View a system management dashboard | `/mgmt` | ❌ **Not Implemented** |

| A-2 | **C**reate, **R**ead, **U**pdate, **D**elete (CRUD) Assets | `/mgmt/assets` | ❌ **Not Implemented** |- Assets and price data: ✅ Working (DynamoDB integration)

| A-3 | Upload new historical data to create a **Dataset** | `/mgmt/datasets` | ❌ **Not Implemented** |

| A-4 | Create **Data Slices** from a Dataset | `/mgmt/dataslices` | ❌ **Not Implemented** |- Prophet system: ❌ Design-only (not implemented yet)- **Data Slices:** Fixed, immutable time intervals from datasets- “Click” includes keyboard activation (Enter/Space) and touch taps.

| A-5 | Create/upload **Model Scaffolds** | `/mgmt/models` | ❌ **Not Implemented** |

| A-6 | Train a model on a data slice to create a **Model Fit** | `/mgmt/models` | ❌ **Not Implemented** |- Admin management: ❌ Design-only (not implemented yet)

| A-7 | Combine a model fit and method to create a **Prophet** | `/mgmt/prophets` | ❌ **Not Implemented** |

| A-8 | Monitor the performance of all prophets | `/mgmt/prophets` | ❌ **Not Implemented** |  - **Simple:** Single continuous date range- Where features are “future”, they’re explicitly marked (not enforced for v1).

| A-9 | Trigger and monitor background jobs (e.g., training) | `/mgmt/jobs` | ❌ **Not Implemented** |

---

  - **Compound:** Multiple simple slices combined

## 2. User Roles & Access

  - Stored as metadata (start/end dates), constructed on-the-fly when needed---

### Guest (Unauthenticated)

- Can only access `/login`- **Model Scaffolds:** Reusable model architectures (e.g., "SLR-NONMASKED-LAG-1-OLS")

- Any other route redirects to `/login`

  - Define inputs, outputs, learning algorithm, model structure## Global Interactions (All Authenticated Users)

### User (Authenticated, role='user')

- Can access: Dashboard, Assets (list + detail), Settings  - Include mathematical descriptions (LaTeX/HTML)

- Can use: Global search, Notifications, Theme selection

- Cannot access: Admin pages (none exist yet)  - Generic until paired with data### Navigation Tasks



### Admin (Authenticated, role='admin')- **Model Fits:** Scaffolds trained on specific data slices for specific assets- Click to open/close sidebar

- Identified by email: `admin@chasingprophets.local`

- Same access as User  - Status: `unfit`, `fitting`, or `fit`- Navigate to primary routes: Dashboard, Assets, Datasets, Data Slices, Model Fits, Prophets, Settings

- **Note:** No admin-specific features implemented yet

  - Stored as model files on S3- Use breadcrumb links to navigate back to parent pages

---

- **Prophets:** Model fits + forecasting methods + daily performance tracking- Return to list views from detail pages

## 3. Authentication Tasks (Guest)

  - Tied to ONE asset and ONE measure (e.g., closing price, close-to-close return)

### Login (`/login`)

  - Run inference client-side in browser using TensorFlow.js### Search & Quick Access Tasks

**Implemented Features:**

- Enter username (Cognito username)  - Updated nightly via scheduled job: compute predictions, compare to actuals, store performance metrics- Type search queries in global or page-specific search boxes

- Enter password

- Submit login form- Filter entity lists by name, ticker, or ID

- Handle new password challenge (if Cognito forces password reset)

  - Enter new password field appears### Alpha User Journeys- Clear search filters to reset view

  - Submit with new password

- View error messages:

  - Invalid credentials

  - Network errors**Users (Authenticated):**### Theme & Preferences Tasks

  - Missing required fields

- Browse prophets by performance metrics- Select and apply a different theme

**NOT Implemented:**

- Signup page- Evaluate prophet predictions vs. actuals- Save theme preference (persists to user profile)

- "Forgot password" link/flow

- Email verification page- Understand which prophets work best for which assets

- "Remember me" checkbox

### Notification Tasks

**User Tasks:**

1. Navigate to site → redirected to `/login`**Admins:**- Open notifications center/panel

2. Enter Cognito username

3. Enter password- Manage full entity lifecycle (Assets → Datasets → Slices → Scaffolds → Fits → Prophets)- Click on a notification to open it

4. Click "Sign In"

5. If new password required: enter new password and resubmit- Trigger training jobs and inference updates- Mark individual notifications as read/unread

6. On success → redirect to `/dashboard`

7. On error → read error message and retry- Monitor system health and background jobs- Mark all notifications as read



---- Dismiss individual notifications



## 4. Global UI Elements (All Authenticated Pages)### Out of Scope (Future Releases)- Click notification links to navigate to related entities



### Layout & Sidebar- User-created prophets or forecasts



**Implemented Features:**- Multi-prophet forecast chains (using predictions as inputs for next-day predictions)### Session Tasks

- Collapsible sidebar (click logo to toggle)

- Navigation links:- Social features (comments, sharing)- Access user profile settings (future)

  - Dashboard

  - Assets- Marketplace or API access- Log out from any page

  - Settings

  - Log Out- Server-side inference (models run in browser for alpha)

- Active page highlighting

- Tooltips on collapsed sidebar- Analysis/explanation features (prediction-only for now)---



**User Tasks:**

- Click logo to collapse/expand sidebar

- Click nav link to navigate to page---## Authentication Tasks

- Hover over collapsed nav item to see tooltip

- Click "Log Out" to sign out



### Header Bar## 2. User Roles### Login (`/login`)



**Implemented Features:**- Enter username or email address

- Global search box

- Theme toggle button (Sun/Moon icon)- **Guest:** Can only sign up or log in- Enter password

- Notifications bell with unread count badge

- Username display- **Authenticated User:** Browse and evaluate all entities; cannot create/modify- Submit login form

- Logout button

- **Admin:** Full CRUD access; can trigger background jobs (training, updates)- Review validation error messages (if credentials invalid)

**User Tasks:**

- Type in search box to search assets- Click "Sign Up" link to create new account

- Click theme toggle to switch between day/night modes

- Click notifications bell to open notification popup---- Click "Forgot Password" link (future)

- View unread notification count badge

- See current username displayed

- Click logout button to sign out

## 3. Key User Stories (High-Level Planning)### Sign Up (`/signup`)

### Global Search

- Enter email address

**Implemented Features:**

- Search input with 200ms debounce### User Stories- Enter desired username

- Searches assets by ticker or name

- Dropdown results showing:1. **As a User, I can discover high-performing prophets** so I can identify reliable prediction models.- Enter password

  - Ticker symbol

  - Asset name   - Browse prophets, filter/sort by performance (MAPE, accuracy), view predictions vs. actuals- Re-enter password for confirmation

  - Market

  - Last price2. **As a User, I can investigate the asset a prophet tracks** so I understand the underlying data.- Submit registration form

- Keyboard navigation:

  - Arrow Down/Up to navigate results   - Navigate from prophet to asset, view historical price charts, see all prophets for that asset- Review validation errors (weak password, duplicate email, etc.)

  - Enter to select highlighted result

  - Escape to close dropdown3. **As a User, I can personalize my experience** via theme selection and account settings.- Check email for verification link

- Click result to navigate to asset detail page

- Validates asset exists before navigation- Click verification link in email

- Shows loading state while searching

- Empty state when no results found### Admin Epics- Return to login page after verification



**User Tasks:**1. **As an Admin, I can manage the complete prophet lifecycle** from asset creation to live prophet.

1. Click in search box or press `/` key

2. Type asset ticker or name (e.g., "AAPL" or "Apple")   - CRUD for: Assets, Datasets (+ upload CSV), Data Slices (simple/compound), Model Scaffolds (+ LaTeX descriptions), Model Fits (+ trigger training), Prophets (+ trigger inference)### Logout

3. Wait for debounced search (200ms)

4. Review dropdown results2. **As an Admin, I can maintain system operations** to ensure reliable daily updates.- Click logout button/link from any authenticated page

5. Use arrow keys to navigate or hover over result

6. Press Enter or click to select   - Monitor background jobs, view logs, manually trigger data refreshes/prophet updates, configure system settings- Confirm logout if confirmation modal appears

7. Navigate to `/assets/:ticker` page

8. Press Escape to close dropdown without selecting



### Notifications------



**Implemented Features:**

- Notifications bell icon in header

- Unread count badge## 4. Authentication Tasks (Guest)## Dashboard Tasks (`/dashboard`)

- Popup panel showing:

  - Notification title

  - Notification message

  - Timestamp### Sign Up- Review system overview statistics (asset count, active prophets, recent fits)

  - "Mark as Read" button per notification

- "Mark All as Read" button- Navigate to signup page- Interact with market overview charts (zoom, pan, reset, export)

- Auto-refresh of unread count after marking

- Empty state when no notifications- Enter email, username, password, confirm password- Scroll through featured prophets carousel

- Loading state while fetching

- Submit form- Click featured prophet card to open detail page

**User Tasks:**

1. See unread count badge on bell icon- Check email for verification link- Click navigation cards to access: Assets, Datasets, Data Slices, Model Fits, Prophets, Admin

2. Click bell icon to open notifications popup

3. Read notification messages- Click verification link- Read recent activity feed entries

4. Click "Mark as Read" for individual notification

5. Click "Mark All as Read" to clear all- Return to login- Click activity feed items to navigate to related entities (assets, prophets, fits)

6. Click outside popup to close

7. Observe unread count badge update



---### Login---



## 5. Dashboard (`/dashboard`)- Navigate to login page



### ⚠️ Implementation Note- Enter email/username and password## Assets Tasks

Dashboard is **fully functional UI** but uses **hardcoded test data** (DJIA_DATA, SPX_DATA from `testData.ts`). Prophet selection is UI-only; no real prophets from database yet.

- Submit form

**User requested:** Ignore dashboard tasks for now (still being designed).

- Handle validation errors (invalid credentials, unverified email)### Assets List (`/assets`)

### Implemented Features (For Reference)

- Type in search box to find assets by ticker or name

**Asset Selection:**

- Toggle between DJIA and SPX (pill buttons)### Session Management- Click "Clear search" to reset filters



**Time Window Selection:**- Log out from any page- Select filter options: type (stock/index/etf/crypto), sector, exchange, active-only

- Select time range: 1W, 1M, 3M, All (pill buttons)

- Session expires → redirect to login with message- Choose sort order: alphabetical, performance, volume

**Scale Selection:**

- Toggle between Linear and Log scale (pill buttons)- Navigate pages using pagination controls or scroll infinitely



**Hero Metrics Panel:**---- Click an asset card/row to open detail page

- Session Drift (points and %)

- Annualized Volatility (30d window)

- 52W High/Low Span

- Prophets Live count (X/3 max)## 5. User Tasks — Discovery & Evaluation### Asset Detail (`/assets/:assetId`)



**Prophet Console:**- Read asset header information (name, ticker, description, logo, type, exchange)

- Grid of 4 prophets:

  - TimeSage AI### Dashboard (`/dashboard`)- Interact with price chart:

  - TrendOracle

  - MarketMind- Review system overview: total assets, active prophets, recent model fits  - Draw zoom box to zoom in on time range

  - QuantumPredictor

- Click prophet card to toggle on/off- Browse featured prophets carousel (high-performing prophets)  - Click and drag to pan across time

- Max 3 prophets active at once

- Color-coded accent bars- Click prophet card to view details  - Hover over data points to see tooltips

- Each card shows: title, description, emphasis metric

- Navigate to main sections: Assets, Prophets, Datasets, Model Fits  - Click "Reset axes" to restore default view

**Main Chart Panel:**

- Plotly chart with:  - Click "Autoscale" to fit data to view

  - Close price line (blue)

  - Active prophet predictions (dashed colored lines)### Assets List (`/assets`)  - Toggle technical indicator overlays on/off

  - Time window applied

  - Scale type applied- Search assets by ticker or name  - Click "Download as PNG" to save chart image

  - Zoom, pan, hover interactions

- Footer stats: 52W High, 52W Low, Session Δ- Filter by type (stock, index, ETF), sector, exchange- Select time window: 1M, 3M, 6M, 1Y, Max, Custom



**Comparison Asset Mini-Chart:**- Sort alphabetically or by performance- Toggle chart scale between linear and logarithmic

- Shows other asset (SPX if DJIA selected, vice versa)

- 3M time window- Click asset to view detail page- Review performance metrics and hover for tooltip descriptions

- TrendOracle overlay

- Scroll through related datasets list

**Signals Panel:**

- 3 auto-generated signal cards:### Asset Detail (`/assets/:assetId`)- Click dataset link to open dataset detail

  - Momentum

  - Prophet Sync- View asset metadata (ticker, name, type, sector, exchange)- Scroll through related prophets list

  - Volatility

- Icons and descriptions- Interact with OHLCV price chart:- Click prophet link to open prophet detail



**User Tasks:**  - Zoom, pan, reset view

- Select asset (DJIA or SPX)

- Select time window (1W, 1M, 3M, All)  - Change time window (1M, 3M, 6M, 1Y, Max)---

- Select scale (Linear or Log)

- Review hero metrics  - Toggle linear/log scale

- Click prophet cards to activate/deactivate

- Interact with main chart (zoom, pan, hover)  - Hover for data tooltips## Datasets Tasks

- Review comparison asset mini-chart

- Read signal cards  - Download chart as PNG



---- Browse related datasets### Datasets List (`/datasets`)



## 6. Assets List (`/assets`)- Browse all prophets tracking this asset- Select filter for asset (dropdown)



### Implemented Features- Click prophet to view predictions- Select filter for type: OHLCV, fundamentals, sentiment



**Navigator Mode Selection:**- Toggle live status filter (live datasets only)

- 4 option cards displayed:

  - "By Ticker Spelling" (enabled, working)### Prophets List (`/prophets`)- Pick start date and end date in date range filter

  - "By Top Prophets" (disabled, future feature)

  - "By Top Forecasts" (disabled, future feature)- Search prophets by name- Click "Clear range" to reset date filters

  - "By Industry" (disabled, future feature)

- Only "By Ticker Spelling" is clickable- Filter by asset, performance threshold (MAPE < X%), status (active/inactive)- Choose sort order: by date, size, or name

- Disabled cards show "Locked" tag

- Sort by performance metrics (MAPE ascending, accuracy descending), last updated- Click dataset card to open detail page

**Letter-Based Filtering:**

- After selecting "By Ticker Spelling":- Click prophet to view detail page

  - Shows A-Z + # letter grid

  - Each letter shows count of assets### Dataset Detail (`/datasets/:datasetId`)

  - Disabled letters grayed out (no assets for that letter)

  - Click letter to filter results### Prophet Detail (`/prophets/:prophetId`)- Review dataset metadata (name, asset, type, CEE columns, date range, record count, live status)

- Compact letter grid remains visible while viewing results

- Active letter highlighted**Core User Experience: Client-Side Inference**- Navigate data preview table pages



**Asset Cards Grid:**- Prophet page loads → model downloaded from S3 → TensorFlow.js loads model in browser- Scroll horizontally to view all columns

- Displays filtered assets for selected letter

- Each card shows:- Standardized input data fetched → predictions computed locally → displayed to user- Click cell to select and copy value

  - Ticker symbol (large, bold)

  - Asset name- Compare predictions vs. actual values in interactive chart- Expand column dictionary (CEE) to view data types and definitions

  - Market label

  - Last price (formatted as $X.XX)- Review performance metrics computed during nightly updates:- Scroll related data slices list

  - Price change % (colored green/red)

- Click card to navigate to asset detail page  - MAPE (Mean Absolute Percentage Error)- Click slice link to open data slice detail



**Breadcrumb Navigation:**  - Directional accuracy- Click "Download dataset" button

- "Back to letters" button (when viewing results)

- "Back to options" button (when viewing letters)  - Per-period performance (last 7D, 30D, 90D, 1Y)- Select download format: CSV or JSON (if permitted)

- "Reset" button (clears all filters and returns to root)

- Understand prophet composition:- Click "Visualize data" to display basic charts

**Hero Metrics:**

- Tracked Assets (total count from DynamoDB)  - Which model fit is used- Interact with visualization charts (zoom, pan, export)

- Live Buckets (count of letters with ≥1 asset)

- Focused letter summary (selected letter + count)  - Which data slices were used for training



**Loading & Error States:**  - Which asset and measure the prophet tracks---

- Loading spinner while fetching assets

- Error message if fetch fails- Download prediction results as CSV

- Empty state when no assets available

- "No assets found for this letter" message- Review last update timestamp (when nightly job ran)## Data Slices Tasks



### User Tasks



1. **Navigate to Assets List**### Browse Data Entities (Read-Only for Users)### Data Slices List (`/dataslices`)

   - Click "Assets" in sidebar

   - Land on root view with 4 navigator options- Select parent dataset filter



2. **Select Navigator Mode****Datasets List (`/datasets`)**- Pick date range filter (start and end dates)

   - Click "By Ticker Spelling" card

   - See letter grid appear- Filter by asset, type (OHLCV), live status- Select slice type filter: simple or compound



3. **Filter by Letter**- Sort by date range, record count- Choose sort order: start date, end date, or record count

   - Click a letter (e.g., "A")

   - See results panel populate with assets starting with A- Click to view dataset detail- Click data slice card to open detail page

   - See compact letter grid remain visible

   - Active letter highlighted



4. **Switch Letters****Dataset Detail (`/datasets/:datasetId`)**### Data Slice Detail (`/dataslices/:dataSliceId`)

   - Click different letter in compact grid

   - Results update to show new letter's assets- View metadata: asset, type, CEE columns, date range, record count- Review slice metadata (slice ID, parent dataset, date range, record count, type)



5. **View Asset Cards**- Preview sample data in table- For compound slices: expand component slice list

   - Scroll through asset cards in results panel

   - Read ticker, name, market, price, change%- See which data slices reference this dataset- Click component slice link to navigate to that slice

   - Observe positive/negative color coding

- Download dataset as CSV (if permitted)- Navigate data preview pages

6. **Navigate to Asset Detail**

   - Click asset card- Scroll "Used by" list to see model fits using this slice

   - Navigate to `/assets/:ticker`

**Data Slices List (`/dataslices`)**- Click model fit link to open model fit detail

7. **Reset Navigation**

   - Click "Back to letters" to return to letter grid (clears results)- Filter by parent dataset, date range, type (simple/compound)- Interact with timeline visualization (zoom, pan to see slice window)

   - Click "Back to options" to return to navigator options

   - Click "Reset" to clear all and return to root- Sort by start date, record count



8. **Review Metrics**- Click to view slice detail---

   - Check "Tracked Assets" count

   - Check "Live Buckets" count

   - Check "Focused" summary when letter selected

**Data Slice Detail (`/dataslices/:dataSliceId`)**## Model Fits Tasks

---

- View slice metadata: date range, type, record count

## 7. Asset Detail Page (`/assets/:ticker`)

- For compound slices: see list of component simple slices### Model Fits List (`/model-fits`)

### ⚠️ Implementation Note

This page is **fully functional** with DynamoDB integration. All indicators are calculated client-side. No references to prophets, datasets, or other entities (those aren't implemented yet).- Preview sample data- Select scaffold type filter: ML, DL, TS, ECON



### Implemented Features- See which model fits used this slice for training- Select asset filter



**Header:**- Select training status filter: fit, fitting, failed

- Asset ticker (from DynamoDB or URL param)

- Asset name (from DynamoDB)**Model Fits List (`/model-fits`)**- Choose sort order: performance, date, size

- Market label (from DynamoDB)

- Filter by scaffold type, asset, training status- Click model fit card to open detail page

**Range Selector:**

- Buttons: 30D, 1M, 3M, 6M, 1Y, YTD, 5Y, 10Y- Sort by performance, date, model size

- Click to change time range

- Active range highlighted- Click to view fit detail### Model Fit Detail (`/model-fits/:modelFitId`)

- Filters price data to selected range

- 5Y/10Y downsample to weekly candlesticks- Review model metadata (name, scaffold, asset, training date, model size, format)



**Widget System:****Model Fit Detail (`/model-fits/:modelFitId`)**- Scroll training slices list

- Modular expandable panels (widgets)

- Each widget has:- View fit metadata: scaffold used, asset, training date, model size, format- Click training slice link to open data slice detail

  - Title bar

  - Expand/collapse toggle- See which data slices were used for training- Review performance metrics (MAPE, accuracy)

  - Independent expand/collapse state

- "Expand All" button (expands all widgets)- Review training performance metrics- Interact with time series performance plots (hover for details, zoom, pan)

- "Collapse All" button (collapses all widgets)

- Download model artifact (if admin or permitted)- Expand/collapse model architecture diagram

**Widgets:**

- See which prophets use this fit- Click "Download model" button (if permitted by role/policy)

1. **OHLCV Chart (PriceVolumeExplorer)**

   - Candlestick chart (green/red candles)- Confirm download and save artifact

   - Volume bars (subplot below)

   - Psychedelic theme: color-cycling candlesticks### User Settings (`/settings`)- Scroll "Used by Prophets" list

   - Hover tooltips (date, OHLCV values)

   - Zoom/pan interactions (Plotly)- Select and save UI theme- Click prophet link to open prophet detail

   - Responsive layout

- View account information

2. **Time Window Explorer (TimeExplorer)**

   - Candlestick chart- Log out---

   - Grid of indicator toggle buttons:

     - SMA20, SMA50, SMA200

     - EMA12, EMA26

   - Click button to show/hide indicator line---## Prophets Tasks

   - Active indicators highlighted

   - Hover tooltips



3. **Mini Indicators**## 6. Admin Tasks — System Management### Prophets List (`/prophets`)

   - Current Close Price (large display)

   - RSI (14-period)- Select asset filter

   - MACD Histogram

   - OBV (On-Balance Volume)### General Admin Principles- Set performance threshold filter (minimum MAPE, accuracy, etc.)

   - ATR (14-period)

   - Stochastic %K / %D- **Full CRUD:** Admins can Create, Read, Update, Delete all system entities- Select status filter: active or inactive

   - Bollinger Bands (middle/upper/lower)

   - ROC (12-period)- **Job Triggering:** Admins initiate asynchronous jobs (data uploads, model training, inference)- Choose sort order: performance (MAPE ascending), asset, last updated

   - Simple SMA (20/50/200 values)

   - Each indicator shows:- **Monitoring:** Admins track job status, view logs, and ensure system health- Click prophet card to open detail page

     - Label

     - Current value

     - Formatted display

### Admin Hub (`/mgmt`)### Prophet Detail (`/prophets/:prophetId`)

4. **SMA Combined Chart**

   - Line chart showing:- View system health dashboard (active jobs, recent errors, prophet update status)- Review prophet header (name, description, asset reference)

     - Close price (blue line)

     - SMA20 (orange line)- Quick actions: "Create New [Asset/Dataset/Slice/Scaffold/Fit/Prophet]"- Review performance metrics in metric panels (MAPE, accuracy, directional accuracy)

     - SMA50 (green line)

   - Legend with clickable items (show/hide series)- Navigate to entity management pages- Select time range for performance calculations

   - Hover tooltips

   - Zoom/pan- Monitor nightly update job results- Interact with predictions vs actuals chart:



**Data Processing (Client-Side):**  - Hover to see prediction and actual values

- Load asset metadata from DynamoDB (Assets table)

- Load price history from DynamoDB (AssetPrices table)---  - Zoom into time ranges

- Filter prices to dates ≤ today

- Sort prices chronologically  - Export chart as image

- Compute indicators:

  - SMA (20, 50, 200)### Manage Assets (`/mgmt/assets`)  - Toggle prediction and actual series visibility

  - EMA (12, 26)

  - RSI (14)- Expand composition section

  - MACD histogram

  - OBV**Create/Edit Asset**- Click model fit links to open fit details

  - ATR (14)

  - Stochastic %K/%D- Enter ticker symbol (unique identifier)- Click training slice links to open slice details

  - Bollinger Bands (20-period, 2σ)

  - ROC (12-period)- Enter asset name and description- Click dataset links to open dataset details

- Downsample to weekly for 5Y/10Y ranges

- Slice indicators to match selected time range- Select type: stock, index, ETF, crypto- Click "Download predictions CSV" button



**Loading & Error States:**- Select sector and exchange- Confirm filename and initiate download

- Loading spinner while fetching data

- "Asset not found" error if ticker doesn't exist- Upload logo image- Review last update timestamp and status indicator

- Graceful fallback if metadata missing but prices exist

- Toggle "Active" status (whether currently tracked)

### User Tasks

- Save changes---

1. **Navigate to Asset Detail**

   - From assets list: click asset card

   - From search: select search result

   - Direct URL: `/assets/:ticker` (e.g., `/assets/AAPL`)**Delete Asset**## Settings Tasks (`/settings`)



2. **Select Time Range**- Click Delete

   - Click range button (30D, 1M, 3M, 6M, 1Y, YTD, 5Y, 10Y)

   - Observe chart and indicators update- Review impact: "This will affect X datasets and Y prophets"- Browse available theme presets

   - Active range highlighted

   - Long ranges (5Y/10Y) show weekly candles- Confirm deletion- Select a theme from the list



3. **Interact with OHLCV Chart**- Click "Save" to persist theme preference

   - Hover over candles to see OHLCV tooltips

   - Click and drag to zoom into region**Navigate**- Preview theme changes before saving

   - Scroll to zoom vertically

   - Double-click to reset zoom- View public asset page (user-facing view)- Edit profile information: name, username, email (future)

   - Observe volume bars below chart

   - Psychedelic theme: see color-cycling candles- Configure notification preferences (future)



4. **Toggle Indicators on Time Explorer**---- Change password (future)

   - Click indicator button (SMA20, SMA50, SMA200, EMA12, EMA26)

   - See indicator line appear/disappear on chart- Manage connected accounts (future)

   - Active buttons highlighted

   - Hover over lines to see values### Manage Datasets (`/mgmt/datasets`)



5. **Expand/Collapse Widgets**---

   - Click widget header to toggle individual widget

   - Click "Expand All" to expand all widgets at once**Create/Edit Dataset**

   - Click "Collapse All" to collapse all widgets

   - Observe smooth expand/collapse animations- Enter dataset name## Admin Tasks — System Management



6. **Review Mini Indicators**- Select parent asset

   - Scroll to Mini Indicators widget

   - Expand widget if collapsed- Select type: OHLCV (primary for alpha), fundamentals, sentiment### Admin Hub (`/mgmt`)

   - Read current values for:

     - Close price- Define CEE columns (Column-Entity-Encoding: the standardized column names like "date", "open", "high", "low", "close", "volume")- Review system health indicators dashboard

     - RSI (overbought >70, oversold <30)

     - MACD histogram (positive/negative)- Enter S3 folder path where raw data is stored- Read recent admin activity log

     - OBV trend

     - ATR (volatility)- Toggle "Live" status (updated daily vs. archived)- Click navigation links to: Assets, Datasets, Data Slices, Model Scaffolds, Model Fits, Prophets, System Settings

     - Stochastic (momentum)

     - Bollinger Bands (upper/middle/lower)- Save dataset- Click "Create new [entity]" quick action buttons

     - ROC (rate of change %)

     - SMA values- Monitor background job status



7. **Interact with SMA Combined Chart****Upload Data (Critical Admin Task)**

   - Hover over lines to see tooltips

   - Click legend items to show/hide series- Click "Upload CSV"### Manage Asset (`/mgmt/assets/:assetId`)

   - Double-click legend item to isolate series

   - Zoom/pan to explore time ranges- Select CSV file (drag-and-drop or file picker)



8. **Handle Loading States**- System validates columns match CEE definition#### Create/Edit Asset Tasks

   - Wait for loading spinner

   - If asset not found: read error message- Preview ingestion (sample rows, record count)- Click "Create New Asset" button

   - If no data: see empty state message

- Confirm upload- Enter ticker symbol

---

- Monitor progress- Enter asset name

## 8. Settings (`/settings`)

- Review success/error messages- Type description text

### Implemented Features

- Select type from dropdown: stock, index, ETF, crypto

**Theme Mode Section:**

- Grid of 7 theme cards:**Refresh Data (For Live Datasets)**- Select sector from dropdown

  1. **Night Blue** (deep blues, neon highlights, dark rooms)

  2. **Day Light** (bright, glassmorphic, daylight)- Click "Refresh Data" button- Select exchange from dropdown

  3. **Cyber Purple** (magenta/purple, cyberpunk)

  4. **Forest Green** (earthy greens, calm)- Trigger data pull job (fetches latest data from source)- Upload logo image file (drag-and-drop or file picker)

  5. **Sunset Orange** (warm sunset tones)

  6. **Deep Space** (ultra-dark, OLED-optimized)- Monitor job status: Queued → Running → Complete/Failed- Preview uploaded logo

  7. **Psychedelic** (neon magenta/cyan/green, trippy)

- Each theme card shows:- Review completion summary or error logs- Replace or remove logo

  - Theme icon

  - Title- Toggle "Active" status switch

  - Description

  - Gradient preview with accent color**Delete Dataset**- Click "Save" to create/update asset

  - Active state border/highlighting

- Click card to apply theme immediately- Click Delete- Review validation errors (duplicate ticker, required fields)

- Theme persists to localStorage (`chasingprophets.theme`)

- All charts and UI update in real-time- Review impact: "This will affect X slices and Y model fits"



**Operator Profile Section:**- Confirm deletion#### Delete Asset Tasks

- Email input field (not connected to backend)

- New password input field (not connected to backend)- Click "Delete" button

- "Reset" button (clears form fields)

- "Save Changes" button (shows "Saved" status for 2.2s)---- Review impact summary in confirmation modal (datasets/prophets affected)

- **⚠️ Note:** Profile form is **UI-only**; does not persist to Cognito or DynamoDB

- Read irreversible warning

### User Tasks

### Manage Data Slices (`/mgmt/dataslices`)- Type confirmation text (if required)

1. **Select Theme**

   - Navigate to Settings page- Confirm deletion

   - Scroll to "Theme Mode" section

   - Click on a theme card (e.g., "Cyber Purple")**Create Simple Slice**

   - Observe immediate theme change across all UI

   - See active theme card highlighted- Select parent dataset#### Navigation Tasks

   - Theme saves to localStorage automatically

- Pick start date (inclusive)- Click "View public asset page" link to open user-facing page

2. **Preview Theme Before Selecting**

   - Hover over theme card- Pick end date (inclusive)

   - View gradient preview with accent color

   - Read description to understand theme purpose- Slice type: Simple### Manage Dataset (`/mgmt/datasets/:datasetId`)

   - Click to apply

- Save slice (stored as metadata only; data constructed on-the-fly when needed)

3. **Toggle Between Themes**

   - Click different theme cards#### Create/Edit Dataset Tasks

   - Observe UI colors update in real-time

   - Charts, buttons, panels all reflect new theme**Create Compound Slice**- Click "Create New Dataset" button

   - Navigate to other pages to see theme applied globally

- Select parent dataset- Enter dataset name

4. **Edit Profile (UI-Only)**

   - Scroll to "Operator Profile" section- Slice type: Compound- Select asset from dropdown

   - Enter email address in input field

   - Enter new password in input field- Multi-select component simple slices- Select type: OHLCV, fundamentals, sentiment, other

   - Click "Reset" to clear form

   - Click "Save Changes" to trigger "Saved" status- System validates: no cyclical dependencies, no overlaps (or define merge behavior)- Define CEE columns (add/remove/reorder column names)

   - **⚠️ Warning:** Changes do NOT persist to backend

- Configure union/concatenation rules- Enter S3 folder path

---

- Save compound slice- Validate S3 path format

## 9. Cross-Cutting Interaction Patterns

- Toggle "Live" status switch

### Chart Interactions (Plotly)

**Preview Slice**- Click "Save" to create/update dataset

**All charts support:**

- **Hover:** Tooltips showing data values- Click "Preview Data"- Review validation errors

- **Click-and-drag zoom:** Draw box to zoom into region

- **Scroll zoom:** Scroll wheel to zoom vertically- View sample rows constructed from slice definition

- **Pan:** Click and drag to move across data (when zoomed)

- **Double-click reset:** Restores default zoom- Check date range and record count#### Upload Data Tasks

- **Legend interactions:**

  - Click legend item to hide/show series- Click "Upload CSV" button

  - Double-click legend item to isolate series

- **Responsive:** Charts resize with browser window**Delete Slice**- Select CSV file (drag-and-drop or file picker)

- **Theme-aware:** Colors update with theme changes

- Click Delete- Review column validation against CEE definition

**User Tasks:**

- Hover over data points to see values- Review impact: "This slice is used by X model fits"- Preview ingestion (sample rows, row count)

- Click and drag to zoom into time range

- Scroll to zoom in/out- Confirm deletion- Click "Confirm" to process upload

- Double-click to reset view

- Click legend to toggle series visibility- Monitor upload progress

- Double-click legend to isolate one series

---- Review success/error messages

### Search & Filter Patterns



**Assets List:**

- Letter-based filtering### Manage Model Scaffolds (`/mgmt/model-scaffolds`)#### Refresh Data Tasks

- Click letter → update results

- Switch letters without returning to root- Click "Refresh Data" button



**Global Search:****Create/Edit Scaffold**- Trigger data pull job

- Type-to-search with debounce

- Keyboard navigation- Enter scaffold ID (e.g., "SLR-NONMASKED-LAG-1-OLS")- Monitor job status: Queued → Running → Completed/Failed

- Click or Enter to select

- Enter human-readable name- Review completion message or error details

**User Tasks:**

- Type search query- Select type: ML (Machine Learning), DL (Deep Learning), TS (Time Series), ECON (Econometric)

- Wait for debounced results (200ms)

- Navigate results with arrow keys- Define required inputs (list of input feature names, e.g., "close_lag1")#### Delete Dataset Tasks

- Select with Enter or click

- Close with Escape- Define outputs (e.g., "predicted_return")- Click "Delete" button



### Loading & Error States- Specify default hyperparameters (JSON editor)- Review affected slices and fits in confirmation modal



**Patterns:**- Write mathematical description (LaTeX or HTML):- Confirm deletion

- Loading spinner with text (e.g., "Loading assets…")

- Error messages in red panel  - Model structure

- Empty states with helpful text

- Graceful degradation (missing data → fallback display)  - Learning algorithm (e.g., OLS, Adam, MLE)### Manage Data Slice (`/mgmt/dataslices/:dataSliceId`)



**User Tasks:**  - Assumptions and use cases

- Wait for loading to complete

- Read error messages- Upload training code (Python script that implements the scaffold)#### Create/Edit Slice Tasks

- Understand empty state guidance

- Retry on error (refresh or go back)- Save scaffold- Click "Create New Slice" button



### Navigation Patterns- Select parent dataset from dropdown



**Breadcrumb-style:****Test Scaffold**- Pick start date using date picker

- "Back to [parent]" buttons

- "Reset" buttons to clear filters- Click "Test Scaffold"- Pick end date using date picker

- Active state highlighting on current page

- Run validation: static analysis, syntax check, lint- Select slice type: simple or compound

**User Tasks:**

- Click "Back" buttons to navigate up hierarchy- Review validation results and error messages- For compound slices:

- Click "Reset" to clear all filters

- Observe active page highlight in sidebar  - Multi-select child slices from list



---**View Usage**  - Review cycle validation messages



## 10. Theme System Deep-Dive- Click "View all fits using this scaffold"  - Configure union/concat rules



### Available Themes- Navigate to filtered list of model fits- Click "Save" to create/update slice



1. **Night Blue**- Review validation errors

   - Primary: `#0a1628` (deep navy)

   - Accent: `#5eb8ff` (bright blue)**Delete Scaffold**

   - Use case: Dark rooms, overnight monitoring

- Click Delete#### Preview Slice Tasks

2. **Day Light**

   - Primary: `#f8fafc` (bright gray)- If active fits exist: system blocks or requires confirmation override- Click "Preview Data" button

   - Accent: `#3b82f6` (vibrant blue)

   - Use case: Well-lit environments, daytime- Confirm deletion- Review sample rows displayed



3. **Cyber Purple**- Check date range information

   - Primary: `#1a0a28` (deep purple)

   - Accent: `#d946ef` (bright magenta)---

   - Use case: Futuristic command center aesthetic

#### Delete Slice Tasks

4. **Forest Green**

   - Primary: `#0a1610` (dark forest)### Manage Model Fits (`/mgmt/model-fits`)- Click "Delete" button

   - Accent: `#34d399` (emerald green)

   - Use case: Calm, focused environment- Confirm deletion in modal



5. **Sunset Orange****Create/Edit Fit**

   - Primary: `#1a0f0a` (dark warm brown)

   - Accent: `#ff985e` (warm orange)- Enter fit name (e.g., "SLR-NONMASKED-LAG-1-OLS-DJIA-1900-JAN-01_1900-JAN-31_CC-RET")### Manage Model Scaffold (`/mgmt/model-scaffolds/:scaffoldId`)

   - Use case: Evening trading sessions

- Select scaffold (defines model architecture)

6. **Deep Space**

   - Primary: `#000000` (true black)- Select asset (provides context for data)#### Create/Edit Scaffold Tasks

   - Accent: `#8ab4f8` (light blue)

   - Use case: OLED screens, reduced eye strain- Multi-select training data slices (the data to train on)- Click "Create New Scaffold" button



7. **Psychedelic**- Optionally override hyperparameters (JSON editor)- Enter scaffold ID

   - Primary: `#1a0d2e` (deep purple-black)

   - Accent: `#ff00ff` (neon magenta)- Optionally upload custom training code (overrides scaffold default)- Enter scaffold name

   - Special: Color-cycling candlesticks, neon effects

   - Use case: Ultimate trippy experience- Save fit (status: `unfit` until training job completes)- Select type: ML, DL, TS, ECON



### Theme Application- Add/remove input feature names to list



**CSS Variables:****Train Model (Critical Admin Task)**- Add/remove output feature names to list

Each theme defines:

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`- Click "Train Model" button- Edit hyperparameters in JSON editor

- `--text-primary`, `--text-secondary`, `--text-muted`

- `--accent`, `--accent-hover`- System triggers ECS job or Lambda function- Validate JSON syntax

- `--border-light`, `--border-strong`

- Chart-specific colors (Plotly theme objects)- Job:- Write description in rich text editor (format text, add links)



**Persistence:**  1. Loads scaffold code and hyperparameters- Write or edit formula using LaTeX editor

- Saved to localStorage as `chasingprophets.theme`

- Restored on page reload  2. Constructs training data from selected slices on-the-fly- Preview LaTeX rendering

- Handles legacy `night`/`day` values by mapping to `night-blue`/`day-light`

  3. Trains model using scaffold's learning algorithm- Upload training code (Python file)

**Real-Time Updates:**

- All UI elements update immediately  4. Saves trained model to S3 (e.g., .keras, .h5, or coefficients JSON)- Click "Save" to create/update scaffold

- Charts re-render with new colors

- No page reload required  5. Updates fit status to `fit` in DynamoDB



**User Tasks:**- Monitor training status: Queued → Running → Complete/Failed#### Test Scaffold Tasks

- Select theme in Settings

- See immediate visual change- Watch live log stream (auto-refresh)- Click "Test Scaffold" button

- Navigate to other pages

- Observe theme applied consistently- On completion:- Run validation (static analysis, linting)

- Return later and see theme remembered

  - Click S3 link to download model artifact- Review validation results and error messages

---

  - Review model size and checksum

## 11. Future Features (NOT Implemented)

- On failure:#### View Usage Tasks

The following are in design documents but **do not exist in code**:

  - Review error message- Click "View all fits using this scaffold" link

### Authentication & User Management

- ❌ Signup page (`/signup`)  - Download logs for debugging- Navigate to filtered model fits list

- ❌ Email verification page (`/verify`)

- ❌ Forgot password flow  - Retry training

- ❌ Profile editing (persist to Cognito)

- ❌ User roles management#### Delete Scaffold Tasks

- ❌ Multi-factor authentication

**Delete Fit**- Click "Delete" button

### Data Entities (User-Facing)

- ❌ Datasets list (`/datasets`)- Click Delete- If blocked: review message about active fits

- ❌ Dataset detail (`/datasets/:datasetId`)

- ❌ Data Slices list (`/dataslices`)- Review warning: "This fit is used by X prophets"- If allowed: confirm deletion with override checkbox

- ❌ Data Slice detail (`/dataslices/:dataSliceId`)

- ❌ Model Fits list (`/model-fits`)- Confirm deletion

- ❌ Model Fit detail (`/model-fits/:modelFitId`)

- ❌ Model Scaffolds (admin-only entity, not visible to users)### Manage Model Fit (`/mgmt/model-fits/:modelFitId`)



### Prophets (Core Feature)---

- ❌ Prophets list (`/prophets`)

- ❌ Prophet detail (`/prophets/:prophetId`)#### Create/Edit Fit Tasks

- ❌ Client-side TensorFlow.js inference

- ❌ Predictions vs. actuals charts### Manage Prophets (`/mgmt/prophets`)- Click "Create New Fit" button

- ❌ Performance metrics (MAPE, accuracy, directional accuracy)

- ❌ Download predictions as CSV- Enter fit name

- ❌ Prophet composition details (model fit, slices, datasets)

**Create/Edit Prophet (Critical Admin Workflow)**- Select scaffold from dropdown

### Admin Management (`/mgmt`)

- ❌ Admin hub (`/mgmt`)- Enter prophet name (or auto-generate)- Select asset from dropdown

- ❌ Manage Assets (CRUD)

- ❌ Manage Datasets (CRUD + CSV upload)- Select asset (prophet is tied to ONE asset)- Multi-select training slices

- ❌ Manage Data Slices (CRUD + composition)

- ❌ Manage Model Scaffolds (CRUD + code upload + validation)- Select output measure (e.g., "close_price", "close_to_close_return", "volatility")- Edit hyperparameter overrides in JSON editor (optional)

- ❌ Manage Model Fits (CRUD + training jobs)

- ❌ Manage Prophets (CRUD + inference jobs)  - **Critical:** The measure must align with the model fit's output and the input data's available columns- Upload code override file (optional)

- ❌ System Settings:

  - Data pipeline configuration- Select model fit (must be status `fit`)- Click "Save" to create/update fit

  - Compute settings (ECS, Lambda)

  - Storage settings (S3, cleanup)  - **Validation:** Ensure fit's inputs match available measures in the dataset/derived measures

  - User management

  - Logs viewer- Select forecast method:#### Train Model Tasks

  - Manual triggers (data refresh, prophet updates, cache clear)

  - **Direct:** Use yesterday's actual value to predict today- Click "Train Model" button

### Background Jobs & Operations

- ❌ CSV upload and ingestion  - **Iterative:** Use yesterday's prediction to predict today (multi-step)- Trigger ECS training job

- ❌ Model training jobs (ECS/Lambda)

- ❌ Prophet inference jobs  - **Multi-step:** Predict multiple future periods at once- Monitor training status badges: Queued → Running → Complete/Failed

- ❌ Nightly update jobs (data refresh + prophet updates)

- ❌ Job status monitoring- Select datasets to apply the prophet to (for inference)- Watch live log stream (auto-refresh)

- ❌ Live log streaming

- ❌ Retry mechanisms- Select data slices for evaluation (compare predictions to actuals)- Scroll log viewer



### Advanced Features (v2+)- Optionally upload custom inference code (overrides default)- Click "Open in separate viewer" for full-screen logs

- ❌ User-created prophets

- ❌ Multi-prophet forecast chains- Toggle "Active" status (whether included in nightly updates)- Click "Download logs" to save log file

- ❌ Social features (comments, sharing)

- ❌ Leaderboards- Save prophet- When complete: click S3 model artifact link

- ❌ Marketplace

- ❌ API access / developer keys- Review model size and checksum

- ❌ Analysis tools (why did prophet perform well/poorly?)

- ❌ Confidence intervals**Run Inference (Manual Trigger)**

- ❌ Server-side inference (for large models)

- Click "Run Inference" button#### Delete Fit Tasks

---

- System triggers inference job:- Click "Delete" button

## 12. Implementation Notes & Recommendations

  1. Loads prophet's model fit from S3- Review warning if used by prophets

### Dashboard

- **Status:** Fully functional UI with hardcoded test data  2. Fetches latest data from selected datasets- Confirm deletion

- **Recommendation:** Connect to real assets and prophets from DynamoDB when prophet system is implemented

- **Data source:** Currently uses `DJIA_DATA` and `SPX_DATA` from `testData.ts`  3. Transforms inputs to match model's expected format

- **Prophets:** UI-only; no real prophet data or inference

  4. Runs inference (generates predictions)### Manage Prophet (`/mgmt/prophets/:prophetId`)

### Assets

- **Status:** Fully functional with DynamoDB integration ✅  5. Compares predictions to actuals (if available)

- **Recommendation:** No changes needed; this is production-ready

- **Navigator modes:** Keep other modes (prophets/forecasts/industry) disabled until backend supports them  6. Computes performance metrics (MAPE, directional accuracy, etc.)#### Create/Edit Prophet Tasks



### Asset Detail  7. Stores predictions and metrics in DynamoDB/S3- Click "Create New Prophet" button

- **Status:** Fully functional with DynamoDB integration ✅

- **Recommendation:** No changes needed; this is production-ready- Monitor job status: Queued → Running → Complete/Failed- Enter prophet name (or use auto-generated)

- **Indicators:** All computed client-side; performant for typical use cases

- **Future:** Add links to related entities (datasets, prophets) when those pages exist- On failure: retry or review logs- Select asset from dropdown



### Settings- Multi-select datasets

- **Status:** Theme selection works perfectly; profile form is UI-only

- **Recommendation:** **Review Performance**- Multi-select training slices

  - Keep theme system as-is (excellent UX)

  - Connect profile form to Cognito `updateUserAttributes()` API- Click "Preview Latest Performance"- Multi-select model fits

  - Add password change flow with `changePassword()` API

  - Consider storing theme preference in DynamoDB user profile table (currently localStorage only)- View summary metrics (MAPE, accuracy over last 30 days)- Select output measure from dropdown: close_price, returns, volatility, etc.



### Themes- Drill into performance charts (predictions vs. actuals over time)- Select forecast method: direct, iterative, multi-step

- **Status:** Excellent implementation with 7 themes, real-time updates, localStorage persistence ✅

- **Recommendation:** - Upload inference code file (optional)

  - Add user preference sync to DynamoDB (store theme per user)

  - Fetch theme preference on login**Navigate**- Toggle "Active" status switch

  - Keep localStorage as fallback for non-authenticated state

- Click "View public prophet page" (user-facing prophet detail page)- Click "Save" to create/update prophet

### Search

- **Status:** Fully functional asset search with DynamoDB integration ✅

- **Recommendation:** 

  - Add search for other entities when implemented (datasets, prophets, etc.)**Delete Prophet**#### Run Inference Tasks

  - Consider server-side search for better performance at scale

  - Add search history / recent searches- Click Delete- Click "Run Inference" button



### Notifications- Warning: "Performance history will be retained for X days"- Trigger prophet update job

- **Status:** Fully functional with DynamoDB integration ✅

- **Recommendation:** - Confirm deletion- Monitor job status: Queued → Running → Completed/Failed

  - Add notification types (system, prophet updates, errors, etc.)

  - Add click-to-navigate links in notification messages- Review error messages if failed

  - Add notification preferences (which types to receive)

---- Click to retry on failure

---



## 13. User Flows (Implemented Only)

### System Settings (`/mgmt/system`)#### Review Performance Tasks

### New User Login Flow

1. Visit site → redirect to `/login`- Click "Preview Latest Performance" button

2. Enter Cognito username and password

3. If new password required: enter new password**Data Pipeline Settings**- Review metric summary

4. Submit → redirect to `/dashboard`

5. See hardcoded DJIA/SPX data and prophet UI- Edit data provider API keys (masked display for security)- Drill into performance charts (zoom, hover)



### Discover Assets Flow- Save API keys (stored in AWS Secrets Manager)

1. From dashboard: click "Assets" in sidebar

2. Land on assets list root view- Test connectivity to data sources#### Navigation Tasks

3. Click "By Ticker Spelling" card

4. Click letter (e.g., "A")- Edit update schedule (cron expression for nightly data refresh)- Click "View public prophet page" link

5. See asset cards for tickers starting with A

6. Click asset card → navigate to asset detail page- Validate cron syntax

7. View charts and indicators

8. Use search to find specific asset- Configure retry policies (retry count, backoff strategy)#### Delete Prophet Tasks

9. Return to assets list or navigate to another asset

- Save settings- Click "Delete" button

### Change Theme Flow

1. From any page: click "Settings" in sidebar- Read warning about performance history retention

2. Scroll to "Theme Mode" section

3. Review theme cards and previews**Compute Settings**- Confirm deletion

4. Click theme card (e.g., "Psychedelic")

5. See immediate UI color change- Edit ECS cluster configuration (for training jobs)

6. Navigate to other pages (dashboard, assets)

7. Confirm theme applied globally- Adjust Lambda timeout settings (for inference jobs)### System Settings (`/mgmt/system`)

8. Return later → theme remembered from localStorage

- Set training job concurrency limits (max simultaneous jobs)

### Search Asset Flow

1. From any page: click in global search box- Save settings#### Data Pipeline Settings Tasks

2. Type asset ticker or name (e.g., "MSFT")

3. Wait 200ms for debounced search- Click "Edit API Keys" button

4. See dropdown with matching results

5. Use arrow keys or mouse to select result**Storage Settings**- Enter API key values (masked display)

6. Press Enter or click to navigate to asset detail

7. View asset charts and data- Edit S3 bucket paths and prefixes- Click "Save" to store keys

8. Press Escape to close search without selecting

- Configure cleanup policies:- Click "Test Connectivity" to validate keys

### Review Notifications Flow

1. See unread badge on bell icon (e.g., "3")  - Model retention (e.g., keep models for 365 days)- Edit update schedule using cron expression editor

2. Click bell icon

3. Popup opens showing 3 notifications  - Log retention- Validate cron expression syntax

4. Read notification messages

5. Click "Mark as Read" on individual notification  - Temporary file cleanup- Click "Save Schedule"

6. Notification removed from list

7. Badge count decrements to "2"- Run cleanup dry-run to preview what would be deleted- Configure retry count and backoff policy (input fields)

8. Click "Mark All as Read"

9. All notifications cleared- Review dry-run results- Save retry/backoff settings

10. Badge disappears

11. Click outside popup to close- Confirm cleanup or adjust policies



---- Save settings#### Compute Settings Tasks



## 14. Testing Checklist- Edit ECS cluster configuration values



Use this checklist to verify all implemented features:**Manual Triggers (Critical for Maintenance)**- Adjust Lambda timeout settings (slider or input)



### Authentication- **Run Daily Data Update Now:**- Set training job concurrency limits

- [ ] Can load login page

- [ ] Can submit credentials  - Click button- Save compute settings

- [ ] Receives error on invalid credentials

- [ ] New password challenge appears when needed  - Confirm trigger

- [ ] Successful login redirects to dashboard

- [ ] Unauthenticated access to protected routes redirects to login  - System fetches latest data for all live datasets#### Storage Settings Tasks



### Dashboard (Hardcoded Data)  - Monitor job status and results- Edit S3 bucket paths and prefixes (text inputs)

- [ ] Page loads without errors

- [ ] Can toggle between DJIA and SPX- **Run All Prophet Updates Now:**- Configure cleanup policies (retention days, size limits)

- [ ] Can select time windows (1W, 1M, 3M, All)

- [ ] Can toggle scale (Linear, Log)  - Click button- Set model retention rules

- [ ] Hero metrics display correct values

- [ ] Can click prophet cards to activate/deactivate  - Confirm batch update- Click "Run Cleanup Dry-Run" to preview cleanup

- [ ] Max 3 prophets enforced

- [ ] Main chart updates when selections change  - System iterates through all active prophets:- Review dry-run results

- [ ] Comparison chart displays

- [ ] Signal cards display    - Loads model- Save storage settings



### Assets List    - Fetches latest data (up to 480 days)

- [ ] Page loads and fetches assets from DynamoDB

- [ ] Loading spinner displays while fetching    - Runs inference for any new dates#### User Management Tasks (future)

- [ ] Error message displays on fetch failure

- [ ] Navigator options display    - Computes performance metrics- Click "Invite User" button

- [ ] Can click "By Ticker Spelling"

- [ ] Letter grid displays with counts    - Stores results in database- Enter user email address

- [ ] Disabled letters grayed out

- [ ] Can click letter to filter  - Monitor batch progress (X of Y prophets completed)- Select role: admin, user, guest

- [ ] Results panel updates

- [ ] Asset cards display correct data  - Review completion summary- Send invitation

- [ ] Can click asset card to navigate

- [ ] "Back" and "Reset" buttons work- **Clear Caches:**- View user list

- [ ] Hero metrics update correctly

  - Select cache types: browser cache, server cache, CDN cache- Click user row to edit

### Asset Detail

- [ ] Page loads with ticker from URL  - Confirm cache clear- Change user role assignment

- [ ] Fetches asset metadata from DynamoDB

- [ ] Fetches price history from DynamoDB  - Review status results- Click "Deactivate User" button

- [ ] Loading spinner displays

- [ ] Error message if asset not found- Confirm deactivation

- [ ] Header displays ticker, name, market

- [ ] Range selector buttons work**View Logs**

- [ ] Charts update when range changes

- [ ] Can expand/collapse widgets- Select log filters: date range, severity (info/warning/error), component (training/inference/data-pipeline)#### Logs & Triggers Tasks

- [ ] "Expand All" and "Collapse All" work

- [ ] OHLCV chart displays candlesticks and volume- Click "Apply Filters"- Select log filters: date range, level (info/warning/error), component

- [ ] Hover tooltips work on charts

- [ ] Can zoom/pan on charts- Scroll log entries- Click "Apply Filters" to refresh log view

- [ ] Time Explorer indicator toggles work

- [ ] Mini Indicators display correct values- Click "Download Logs" to export for offline analysis- Scroll log entries

- [ ] SMA Combined chart displays

- [ ] Legend interactions work- Click "Download Logs" to export

- [ ] 5Y/10Y downsample to weekly candles

- [ ] Psychedelic theme: color-cycling candles---- Click "Run Daily Data Update Now" button



### Settings- Confirm manual trigger

- [ ] Page loads

- [ ] Theme cards display## 7. Cross-Cutting Interaction Patterns- Monitor manual job status

- [ ] Can click theme card to change theme

- [ ] Theme applies immediately- Click "Run All Prophet Updates Now" button

- [ ] Theme persists to localStorage

- [ ] Theme remembered on page reload### Chart Interactions (Plotly)- Confirm batch update

- [ ] Profile form displays

- [ ] Can enter email and passwordAll charts (asset price charts, prophet prediction charts) support:- Monitor batch progress

- [ ] "Reset" button clears form

- [ ] "Save Changes" shows "Saved" status- **Zoom:** Click and drag to draw zoom box; drag on axis to zoom along that dimension- Click "Clear Caches" button

- [ ] Profile changes do NOT persist (UI-only)

- **Pan:** Click pan tool and drag to move across data- Select cache types to clear

### Layout & Navigation

- [ ] Sidebar displays- **Reset:** Click "Reset axes" to restore default view- Confirm cache clear

- [ ] Can collapse/expand sidebar

- [ ] Nav links highlight active page- **Tooltips:** Hover over data points to see values- Review status results

- [ ] Can navigate between pages

- [ ] Logout button works- **Legend:** Click legend item to hide/show series; double-click to isolate

- [ ] Global search box displays

- [ ] Theme toggle works- **Export:** Click "Download as PNG" to save chart image### Manage Data Slice (`/mgmt/dataslices/:dataSliceId`)

- [ ] Notifications bell displays

- [ ] Unread badge shows count- **Scale:** Toggle between linear and logarithmic scale (where applicable)- CRUD

- [ ] Username displays

  - Create slice: choose parent dataset; pick start/end dates; type (simple/compound).

### Global Search

- [ ] Can type in search box### List & Table Interactions  - For compound: multi-select child slices; validate no cycles; compute union/concat rules.

- [ ] Debounced search fires after 200ms

- [ ] Results dropdown displaysAll list pages (assets, prophets, datasets, etc.) support:  - Update/delete; show confirm.

- [ ] Can navigate with arrow keys

- [ ] Enter key selects result- **Search:** Type in search box (debounced auto-search or explicit submit)- Preview

- [ ] Click selects result

- [ ] Escape closes dropdown- **Filter:** Select options from filter dropdowns; click chips to review/remove active filters  - “Preview data” button: sample rows; range info.

- [ ] Validates asset exists before navigating

- [ ] Empty state displays when no results- **Sort:** Click column header to sort; click again to toggle ascending/descending



### Notifications- **Pagination:** Click "Next"/"Previous" or select page size; scroll to trigger infinite load (if enabled)### Manage Model Scaffold (`/mgmt/model-scaffolds/:scaffoldId`)

- [ ] Bell icon displays unread count

- [ ] Can click bell to open popup- **Quick Actions (Admin):** Click row-level "Edit"/"Delete"/"View" buttons- CRUD

- [ ] Popup displays notifications

- [ ] Can mark individual as read  - Create/update scaffold: id, name, type, inputs/outputs lists, hyperparameters (JSON editor), description (rich text), formula (LaTeX).

- [ ] Can mark all as read

- [ ] Unread count updates after marking### File Upload & Download  - Delete scaffold (blocked if active fits exist or require confirm override).

- [ ] Popup closes when clicking outside

- [ ] Empty state when no notifications- **Upload (Admin):**- Code



### Charts (All)  - Drag file to drop zone or click to open file picker  - Upload/replace training code (Python) for validation runs; basic syntax validation.

- [ ] Charts render without errors

- [ ] Hover tooltips work  - System validates file (size, format, columns for CSV)  - Test scaffold: run validation (static/lint level) and show results.

- [ ] Click-and-drag zoom works

- [ ] Scroll zoom works  - Progress bar shows upload status- Insights

- [ ] Double-click reset works

- [ ] Pan works when zoomed  - Success/error notification displayed  - “View all fits using this scaffold” link to filtered fits list.

- [ ] Legend click toggles series

- [ ] Legend double-click isolates series- **Download (Users & Admin):**

- [ ] Charts responsive to window resize

- [ ] Charts update with theme changes  - Click "Download" button### Manage Model Fit (`/mgmt/model-fits/:modelFitId`)



### Themes  - Confirm if file is large- CRUD

- [ ] All 7 themes load without errors

- [ ] Night Blue applies correctly  - Browser initiates download  - Create/update fit: name, scaffold selection, asset, training slices, hyperparameter overrides; optional code override upload.

- [ ] Day Light applies correctly

- [ ] Cyber Purple applies correctly  - Permission error shown if access denied  - Delete fit; confirm (check if used by prophets).

- [ ] Forest Green applies correctly

- [ ] Sunset Orange applies correctly- Training Job

- [ ] Deep Space applies correctly

- [ ] Psychedelic applies correctly (with special effects)### Async Job Handling (Admin)  - Train model: trigger ECS job; show training status badges (Queued → Running → Complete/Failed).

- [ ] Theme persists across page navigations

- [ ] Theme remembered on browser reload- **Status Badges:** Visual indicators (Queued, Running, Complete, Failed)  - View streaming logs; auto-refresh; open in separate viewer; download logs.

- [ ] Charts reflect theme colors

- **Log Streaming:** Click to expand live log viewer; auto-refreshes during job execution  - On completion: model artifact link (S3); size; checksum.

---

- **Intervention:** Click "Retry" on failed jobs; click "Resubmit" to restart

## 15. Summary

- **Error Details:** Expand error message section; copy error ID for support### Manage Prophet (`/mgmt/prophets/:prophetId`)

**Total Implemented Pages:** 5

- `/login`- CRUD

- `/dashboard` (hardcoded data)

- `/assets`### Form Validation & Confirmations  - Create/update prophet: name, asset, datasets, training slices, model fits, output measure, forecast method; optional inference code.

- `/assets/:ticker`

- `/settings`- **Validation:** Inline error messages for required fields, type constraints, uniqueness checks  - Toggle active status; save; status immediately reflected in listings.



**Total Implemented Components:** 15+- **Corrections:** User fixes inputs based on feedback; click "Submit" to retry  - Delete prophet; confirm; warn about performance history retention.

- Layout, Sidebar, Header

- SearchBox, NotificationPopup- **Destructive Actions:** Confirmation modal shows impact summary (e.g., "This will affect 5 prophets")- Inference

- StockChart, PriceVolumeExplorer, TimeExplorer

- MiniIndicator, SMACombined, Widget- **Confirmation:** Type confirmation text or check checkbox; click "Confirm" to proceed or "Cancel" to abort  - Run inference: trigger prophet update job; show queued/running/completed/failed; surface error messages.

- ThemeContext, AuthContext

- Asset services, Notification services  - Preview latest performance metrics; drill into charts.



**Total User Tasks Documented:** ~150---- Links



**Implementation Coverage:**  - View public prophet page.

- Authentication: ✅ Login only

- Assets: ✅ Fully working## 8. Key User Flows (End-to-End Examples)

- Themes: ✅ Excellent implementation

- Search: ✅ Working### System Settings (`/mgmt/system`)

- Notifications: ✅ Working

- Prophets: ❌ Not implemented### User Flow: Discover a High-Performing Prophet- Data Pipeline

- Admin: ❌ Not implemented

- Datasets/Slices/Fits: ❌ Not implemented1. User logs in → lands on dashboard  - Edit API keys (masked); save; test connectivity.



**Next Steps:**2. Dashboard shows "Featured Prophets" carousel with top performers  - Edit update schedule (cron); validate expression; save.

1. Implement prophet system (list, detail, inference)

2. Implement admin management pages3. User clicks a prophet card  - Configure retry/backoff policies.

3. Connect dashboard to real data

4. Add signup/verification flows4. Prophet detail page loads:- Compute

5. Implement background jobs

6. Add dataset/slice/fit pages   - Model downloaded from S3 to browser  - ECS cluster config; Lambda timeout settings; training job concurrency limits.


   - TensorFlow.js loads model- Storage

   - Input data fetched  - S3 bucket paths/prefixes; cleanup and retention policies; run cleanup dry-run.

   - Predictions computed locally- User Management (future)

   - Chart displays predictions vs. actuals  - Invite users; assign roles; deactivate users.

5. User reviews performance metrics (MAPE: 1.8%, Accuracy: 87%)- Logs & Triggers

6. User clicks "Download Predictions CSV"  - View system logs with filters; download.

7. User explores related asset to see other prophets for same stock  - Manual triggers: run daily data update; run all prophet updates; clear caches; show statuses.

8. User bookmarks prophet (future: save to favorites)

---

### Admin Flow: Create a New Prophet from Scratch

1. Admin logs in → navigates to System Management## Notifications & Messages Tasks

2. **Step 1: Ensure Asset Exists**

   - Navigate to "Manage Assets"- Check unread notification count badge

   - Search for "AAPL" (Apple Inc.)- Click to open notifications center/panel

   - If missing: Create new asset (enter ticker, name, type, save)- Scroll through notification list (infinite scroll or paginate)

3. **Step 2: Ensure Dataset Exists**- Click on a notification to read full details

   - Navigate to "Manage Datasets"- Click notification link to navigate to related entity (asset/dataset/slice/fit/prophet/system log)

   - Check if "AAPL Daily OHLCV" dataset exists- Mark individual notification as read/unread

   - If missing: Create dataset (name, asset, CEE columns, S3 path, live status)- Click "Mark all as read" button

   - Upload historical CSV data- Click undo to reverse mark-as-read action (brief window)

   - Monitor upload completion- For error notifications:

4. **Step 3: Create Training Data Slice**  - Expand error detail section

   - Navigate to "Manage Data Slices"  - Copy error ID to clipboard

   - Click "Create New Slice"  - Click link to view full logs (admin only)

   - Select "AAPL Daily OHLCV" dataset- Dismiss individual notifications

   - Pick date range: 2020-01-01 to 2023-12-31

   - Type: Simple---

   - Save slice

5. **Step 4: Select or Create Model Scaffold**## Performance Tracking Tasks (ManagedPerformance)

   - Navigate to "Manage Model Scaffolds"

   - Select existing scaffold: "LSTM-SEQ-30-ADAM" (30-day sequence LSTM)### On Prophet Detail Page

   - (Or create new scaffold: define inputs, outputs, hyperparameters, LaTeX description, upload code)- Click time window selector dropdown

6. **Step 5: Create and Train Model Fit**- Select time range: 7D, 30D, 90D, 1Y, All Time, Custom

   - Navigate to "Manage Model Fits"- For custom range: pick start and end dates

   - Click "Create New Fit"- Click "Apply" to recompute metrics for selected window

   - Name: "LSTM-SEQ-30-AAPL-2020-2023"- Toggle metric series visibility (MAPE, Accuracy, Directional Accuracy checkboxes)

   - Select scaffold: "LSTM-SEQ-30-ADAM"- Click table header to sort per-day values by date or metric value

   - Select asset: "AAPL"- Select rows in performance table

   - Select training slice: "AAPL-2020-2023"- Click "Export to CSV" to download selected subset

   - Save fit (status: `unfit`)- Confirm export filename

   - Click "Train Model"

   - Monitor training job (watch logs, check status)### On Admin Performance Overview

   - Wait for completion (status changes to `fit`)- Select asset filter to view prophets for specific asset

   - Review model artifact link- Pick date range for performance analysis

7. **Step 6: Create Prophet**- Review performance streams chart across multiple prophets

   - Navigate to "Manage Prophets"- Click prophet in chart legend to highlight its series

   - Click "Create New Prophet"- Click "Export All" to download full performance dataset

   - Name: "LSTM Prophet - AAPL Close Price"- Confirm export format and initiate download

   - Select asset: "AAPL"

   - Select output measure: "close_price"---

   - Select model fit: "LSTM-SEQ-30-AAPL-2020-2023"

   - Select forecast method: "Direct"## Cross-Cutting Interaction Patterns

   - Select datasets for inference: "AAPL Daily OHLCV"

   - Toggle "Active" status ON### Chart Interaction Tasks (Plotly)

   - Save prophet- Click zoom tool and drag box to zoom into region

8. **Step 7: Run Initial Inference**- Click pan tool and drag to move across data

   - Click "Run Inference" button- Click box select or lasso select to highlight data points (if enabled)

   - Monitor inference job- Click "Autoscale" button to fit all data in view

   - Wait for completion- Click "Reset axes" to restore default zoom/pan

   - Preview performance metrics- Toggle spike lines on/off for crosshair guides

9. **Step 8: Verify Public View**- Hover over data points to compare values

   - Click "View public prophet page"- Click "Download as PNG" to save chart image

   - Verify prophet is visible to users- Click legend item to hide/show that data series

   - Verify predictions are displayed correctly (model runs client-side)- Double-click legend item to isolate that series only

- Drag on axis to zoom along that dimension

### Admin Flow: Daily Maintenance- Click scale toggle to switch between log and linear (where provided)

1. Admin logs in → navigates to System Management → System Settings

2. Check "Background Job Status" panel### List & Table Interaction Tasks

3. Review nightly update results:- Type in search box (debounced auto-search or explicit submit)

   - Data refresh: Complete (5 datasets updated)- Click to open multi-select filter dropdown

   - Prophet updates: 47 of 50 complete, 3 failed- Select/deselect filter options

4. Identify failed prophets- Click date picker to choose date range

5. Click "Download Logs" for failed prophet "TimeSage AI - SPX"- Click filter chips to review active filters

6. Review error: "Model file not found in S3"- Click "X" on filter chip to remove that filter

7. Navigate to "Manage Model Fits" → find associated fit- Click "Clear all filters" to reset view

8. Re-train model fit- Click column header to sort by that column

9. Wait for training completion- Click column header again to toggle ascending/descending

10. Navigate to "Manage Prophets" → find "TimeSage AI - SPX"- View active sort indicator (arrow icon)

11. Click "Run Inference" to retry- Select page size from dropdown

12. Monitor job completion- Click "Next" or "Previous" for pagination

13. Verify success- Scroll to trigger infinite scroll load (if configured)

14. If data is stale: Click "Run Daily Data Update Now" (manual trigger)- Click row/card quick action button (edit, delete, view - admin only)

15. Monitor data refresh

16. When complete: Click "Run All Prophet Updates Now"### File Upload & Download Tasks

17. Monitor batch progress- Drag file and drop onto upload zone

18. Review final status: All prophets updated successfully- Click upload zone to open file picker

19. Check system health indicators return to normal- Select file from system dialog

- Review file validation messages (size, format, columns)

---- Watch upload progress bar

- Review upload success/error notification

## 9. Edge Cases & Error Handling- Click "Download" button for model artifacts/predictions/CSV/JSON

- Confirm download size warning if large file

### Authentication- Initiate browser download

- Invalid email format → inline validation error- Review permission error if download fails

- Wrong password → "Invalid credentials" message

- Unverified email → "Please verify your email" message### Async Job Handling Tasks

- Session expires while browsing → redirect to login with "Session expired" message- Monitor status badge changes: Training → Processing → Complete/Failed

- Click to expand live log stream section

### Access Control- Watch auto-refreshing logs during training

- Non-admin tries to access `/mgmt` → show 403 Forbidden page- Scroll log viewer to review earlier entries

- Non-admin sees admin buttons disabled/hidden- Click "Retry" button on failed jobs

- User tries to download restricted model artifact → "Permission denied" error- Click "Resubmit" button to restart job

- Click to expand error message details

### Data Upload (Admin)- Copy error message to clipboard

- CSV columns don't match CEE definition → "Column mismatch: expected [date, open, high, low, close, volume], got [Date, O, H, L, C]"

- File too large → "File exceeds 100MB limit"### Error & Confirmation Tasks

- Invalid date format → "Invalid date in row 42: expected YYYY-MM-DD, got 01/15/2020"- Review form validation messages (required fields, type constraints, uniqueness)

- Correct invalid form inputs based on validation feedback

### Data Slices (Admin)- Click "Submit" to retry after fixing errors

- Compound slice references itself → "Cyclical dependency detected"- Read destructive action confirmation modal

- Overlapping child slices → show merge behavior documentation or error- Review impact summary (e.g., affected entities)

- Type confirmation text if required

### Model Training (Admin)- Check confirmation checkbox

- Resource limits exceeded → job fails with "Out of memory" error- Click "Confirm" to proceed with destructive action

- Invalid hyperparameters → validation error before job starts- Click "Cancel" to abort action

- Training data missing for selected slice → job fails with "Data not found: slice AAPL-2020-2023 not found"- Read API error toast/banner message

- S3 write fails → job fails with "Failed to save model artifact to S3"- Click to expand error detail drawer

- Copy error ID for support ticket

### Prophet Inference (Admin)- Click support/help link to get assistance

- Model file deleted from S3 → inference fails with "Model file not found: s3://bucket/models/fit-123.keras"

- Model fit inputs don't match dataset columns → "Input mismatch: model expects 'close_lag1', dataset has 'close'"---

- Data stale beyond threshold → warning message: "Data last updated 5 days ago; predictions may be inaccurate"

## User Flow Examples

### Prophet Client-Side Inference (User)

- Model too large for browser → show loading spinner; fallback to server-side inference (future)### Guest/New User Flow

- TensorFlow.js fails to load → "Unable to load prediction model; please try again later"1. Visit site URL (redirected to `/login`)

- Network error fetching model → "Failed to download model; check your connection"2. Click "Sign Up" link

3. Enter email, username, password, confirm password

### Deletions (Admin)4. Submit registration form

- Delete asset with active datasets → confirmation: "This will affect 3 datasets and 5 prophets"5. Check email for verification link

- Delete model fit used by prophets → confirmation: "This fit is used by 2 prophets: [Prophet A, Prophet B]"6. Click verification link

- Admin confirms despite warnings → cascade delete or block based on system policy7. Return to login page

8. Enter credentials and log in

---9. Land on dashboard



## 10. Future Enhancements (v2+ Roadmap)### Regular User Discovery Flow

1. Log in to dashboard

These features are **out of scope** for the alpha but planned for future releases:2. Click "Prophets" navigation link

3. Filter prophets by asset (e.g., "SPX")

### Multi-Prophet Forecasts4. Sort by performance (MAPE ascending)

- Users create forecast chains using multiple prophets5. Click on top-performing prophet card

- Use Prophet A's prediction for Day 1 as input to Prophet B for Day 26. Review prophet detail page

- Fixed-horizon forecasts: 5, 10, 15, 20, 60, 120, 240, 480 days into future7. Interact with predictions chart (zoom, hover)

- Compare user-created forecasts to system-generated forecasts8. Click "Download predictions CSV"

- Identify which combinations of prophets produce the most stable, accurate predictions9. Save file

10. Click related asset link

### User-Created Prophets11. View asset detail page

- Users can clone existing prophets and customize them12. Review other prophets for same asset

- Users can train models on custom data slices (within quotas)

- Sandbox environment for experimentation### Admin Prophet Creation Flow

- User prophets tracked separately from system-managed prophets1. Log in to dashboard

2. Click "System Management" link

### Social & Community Features3. Navigate to "Manage Assets"

- Leaderboards: Top-performing prophets globally4. Verify asset exists (or create new)

- Comments and discussions on prophet pages5. Navigate to "Manage Datasets"

- Share prophets via social media links6. Verify dataset exists (or create/upload data)

- Follow other users' prophet portfolios7. Navigate to "Manage Data Slices"

8. Create new training slice with date range

### Marketplace & Monetization9. Navigate to "Manage Model Scaffolds"

- Marketplace for sharing/selling high-performing prophets10. Select or create scaffold

- API access for developers (API key management)11. Navigate to "Manage Model Fits"

- Subscription tiers for advanced features12. Click "Create New Fit"

13. Select scaffold, asset, training slices

### Advanced Analysis & Explanation14. Click "Train Model"

- Analysis tools: Why did this prophet perform well/poorly?15. Monitor training job status

- Explanation features: What patterns did the model learn?16. Watch live logs

- Confidence intervals and uncertainty quantification17. Wait for completion

18. Navigate to "Manage Prophets"

### Server-Side Inference19. Click "Create New Prophet"

- For large models that can't run in browser20. Enter name, select asset, datasets, slices, model fits

- For proprietary models where code should not be exposed21. Choose output measure and forecast method

- Send only predictions to client, not full model22. Click "Save"

23. Click "Run Inference"

---24. Monitor inference job

25. Preview performance metrics

## 11. Entity-to-Task Traceability Map26. Click "View public prophet page"

27. Verify prophet is visible to users

| Entity | User Tasks | Admin Tasks |

|--------|------------|-------------|### Admin Daily Maintenance Flow

| **Users** | Sign up, login, logout, change theme | N/A (future: manage user roles) |1. Log in to dashboard

| **Assets** | Browse list, view details, view price charts | CRUD, upload logos |2. Click "System Management"

| **Datasets** | Browse list, view details, preview data, download CSV | CRUD, upload CSV data, trigger data refresh |3. Click "System Settings"

| **Data Slices** | Browse list, view details, preview slice data | CRUD (simple & compound slices), preview |4. Review background job status panel

| **Model Scaffolds** | View associated model fits | CRUD, define architecture, upload code, test validation |5. Check for failed jobs

| **Model Fits** | Browse list, view details, review performance | CRUD, trigger training jobs, monitor logs, download artifacts |6. Click "Download Logs" for failed jobs

| **Prophets** | Browse list, view details, interact with predictions, download CSV | CRUD, trigger inference jobs, monitor performance, toggle active status |7. Review error messages

| **Performance Metrics** | View on prophet pages, filter by time range, export CSV | Configure metrics, view aggregated dashboard |8. If data is stale: click "Run Daily Data Update Now"

| **System Settings** | N/A | Configure data pipeline, compute, storage; trigger manual jobs; view logs |9. Confirm manual trigger

| **Notifications** | View unread count, mark as read, navigate to related entities | N/A (future: send custom notifications) |10. Monitor update progress

11. When complete: click "Run All Prophet Updates Now"

---12. Monitor batch prophet inference

13. Review completion status

## 12. Document Summary14. Check system health indicators return to normal



**Version 2.0 Changes:**---

- **Aligned with core system purpose:** Focus on helping users identify high-performing prophets

- **Clarified alpha scope:** Client-side inference, admin-only prophet creation, nightly update jobs## Edge Cases & Validation Examples

- **Removed out-of-scope features:** User-created prophets, forecasts, social features, marketplace (moved to "Future Enhancements")

- **Emphasized critical workflows:** Asset → Dataset (+ CSV upload) → Data Slice → Model Scaffold → Model Fit (+ training) → Prophet (+ inference)### Authentication Edge Cases

- **Added conceptual model:** Explained how data slices are stored as metadata and constructed on-the-fly- User enters invalid email format → show format validation error

- **Clarified inference model:** TensorFlow.js runs in browser; models downloaded from S3; predictions computed locally- User enters wrong password → show "Invalid credentials" message

- **Detailed nightly update process:** Scheduled job iterates through prophets, computes predictions, stores performance metrics- User with unverified email tries to log in → show "Please verify your email" message

- User session expires while browsing → redirect to login with "Session expired" message

**Coverage:**

- ✅ All core system entities (Assets, Datasets, Slices, Scaffolds, Fits, Prophets)### Access Control Edge Cases

- ✅ Complete user journey: from signup to evaluating prophet performance- Non-admin user tries to access `/mgmt` URL → show 403 Forbidden page

- ✅ Complete admin journey: from creating assets to managing live prophets- Non-admin sees admin-only buttons disabled/hidden in UI

- ✅ All critical workflows: data upload, model training, inference, daily updates- User tries to download restricted model → show permission denied error

- ✅ Edge cases and error handling

- ✅ Future roadmap (clearly scoped as out-of-alpha)### Data Upload Edge Cases

- Admin uploads CSV with columns not matching CEE → show "Column mismatch: expected [A, B, C], got [X, Y, Z]"

**Document is ready for:**- Admin uploads file larger than limit → show "File too large: maximum 100MB"

- Sprint planning (high-level user stories + detailed acceptance criteria)- Admin uploads CSV with invalid date formats → show "Invalid date format in row 42: expected YYYY-MM-DD"

- Development (clear task descriptions for each entity and workflow)

- QA (comprehensive test cases for all interactions and edge cases)### Compound Slice Edge Cases

- Stakeholder communication (conceptual overview + future roadmap)- Admin tries to create compound slice referencing itself → show "Cyclical dependency detected"

- Admin selects overlapping child slices → show documented merge behavior

### Model Training Edge Cases
- Training exceeds resource limits → job fails with "Out of memory" error
- Invalid hyperparameters provided → validation error before job starts
- Training data missing for selected slice → job fails with "Data not found" error
- S3 write fails during model save → job fails with artifact write error

### Prophet Inference Edge Cases
- Model file deleted from S3 → inference fails with "Model file not found"
- Model fit incompatible with current data → inference fails with compatibility error
- Data hasn't been updated and is beyond staleness threshold → warning message, inference may proceed with stale data

### Deletion Edge Cases
- Admin tries to delete asset with active datasets → show confirmation with "This will affect 3 datasets and 2 prophets"
- Admin tries to delete model fit used by prophets → show "This model fit is used by 2 prophets: [Prophet A, Prophet B]"
- Admin confirms deletion despite warnings → cascade delete or block based on policy

---

## Future Interactions (Planned for v2+)

- Browse leaderboard of top-performing prophets globally
- Compare 2-4 prophets side-by-side on split-screen view
- Create portfolio of favorite prophets for quick access
- Configure custom alerts: "Notify me when MAPE < 2.0% for SPX prophets"
- Browse marketplace to discover community-shared prophets
- Use visual prophet builder/studio to construct forecasts without code
- Comment on prophets and discuss with community
- Share prophet links on social media
- Generate and manage API keys for programmatic access
- Create user-managed prophet instances with quotas
- Train user-managed model fits in sandbox environment
- Clone and customize existing prophets

---

---

## Entity-to-Task Traceability Map

This section maps database entities to the user tasks that interact with them:

**Users**
- Sign up, log in, log out
- Change theme preferences
- Receive and manage notifications
- View/edit profile (future)

**Assets**
- Search and filter asset lists
- View asset details and charts
- Admin: create, edit, delete assets
- Admin: upload asset logos

**Datasets**
- Browse and filter dataset lists
- View dataset details and preview data
- Download dataset files
- Admin: create, edit, delete datasets
- Admin: upload CSV data
- Admin: trigger data refresh jobs

**DataSlices**
- Browse and filter data slice lists
- View slice details and composition
- Preview slice data on timeline
- Admin: create, edit, delete slices
- Admin: configure compound slice composition

**ModelScaffolds**
- Admin: create, edit, delete scaffolds
- Admin: define model architecture and hyperparameters
- Admin: upload and test training code
- Admin: view fits using scaffold

**ModelFits**
- Browse and filter model fit lists
- View fit details and performance metrics
- Download model artifacts (if permitted)
- Admin: create, edit, delete fits
- Admin: trigger training jobs
- Admin: monitor training progress and logs

**Prophets**
- Search and filter prophet lists
- View prophet details and predictions
- Interact with performance charts
- Download prediction results
- Admin: create, edit, delete prophets
- Admin: trigger inference jobs
- Admin: monitor inference status

**Messages**
- View unread notification count
- Read notifications
- Mark as read/unread
- Navigate to related entities from notifications
- Dismiss notifications

**ManagedPerformance (Prophet Performance Metrics)**
- Select time windows for performance analysis
- Toggle metric series visibility
- Sort and filter performance data
- Export performance data to CSV
- Compare performance across prophets (admin)

---

## Document Statistics

**Total User Roles:** 3 (Guest, Authenticated User, Admin)

**Total Pages/Screens with Interactions:**
- 2 Authentication pages (Login, Sign Up)
- 1 Dashboard
- 6 Entity list pages (Assets, Datasets, Slices, Fits, Prophets, Settings)
- 6 Entity detail pages
- 1 Admin hub
- 7 Admin management pages
- 1 System settings page
- 1 Notifications center
- **Total: ~25 unique pages**

**Total Interaction Categories:**
- Navigation (sidebar, breadcrumbs, links)
- Search & filtering
- Sorting & pagination
- Chart interactions (Plotly)
- Form inputs & validation
- File uploads & downloads
- CRUD operations (admin)
- Async job monitoring
- Notifications
- Error handling & confirmations

**Estimated Task Count:** 300+ discrete user tasks and interactions enumerated

---

## Implementation & QA Usage

This document serves multiple purposes:

1. **Development Reference:** Each bullet is a potential user story or acceptance criterion
2. **QA Test Cases:** Every interaction should have corresponding test coverage
3. **UI/UX Design:** Ensures all necessary controls and feedback mechanisms are designed
4. **Documentation:** Forms the basis for user guides and help documentation
5. **API Requirements:** Identifies all backend endpoints and data operations needed

---

## Completion Summary

This catalog provides a comprehensive enumeration of all user-initiated tasks and interactions in the Chasing Prophets v1 alpha system. Every item is framed as an action the user performs, not a system behavior they observe. The organization follows role-based access (Guest → User → Admin) and entity-based groupings (Assets → Datasets → Slices → Fits → Prophets), with cross-cutting patterns documented separately.

**Coverage verified against:**
- ✅ All screens in `FRONTEND_SCREENS.md`
- ✅ All entities in `DATABASE_SCHEMA.md`
- ✅ All user roles in `ARCHITECTURE.md`
- ✅ Cross-cutting concerns (charts, lists, uploads, jobs, errors)
- ✅ Edge cases and validation scenarios
- ✅ Future enhancements roadmap

The document is ready for use in sprint planning, development, QA, and documentation efforts.

