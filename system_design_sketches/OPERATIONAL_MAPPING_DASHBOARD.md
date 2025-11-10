# Operational Mapping: Dashboard Page

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** Partial Implementation (UI with Test Data)  
**Page:** `/dashboard`

---

## ⚠️ Implementation Status Note

The Dashboard page is currently **implemented as UI-only with hardcoded test data**. Real data integration with DynamoDB and AWS services is **not yet implemented**. This document describes the operational flow as it **currently works** (using test data) and notes where database integration **will be required** for full implementation.

---

## Overview

This document provides detailed operational mappings for all tasks on the Dashboard page, describing the data flow from user navigation to data display, including current test data sources and future integration points.

---

## User Role: Authenticated User

### Task U-1: View the Main Application Dashboard

**Task ID:** U-1  
**Task Name:** View the main application dashboard  
**Status:** 🟡 Partial (UI functional, uses test data)

#### Operational Flow

1. **User Navigation**
   - User clicks "Dashboard" link in sidebar OR
   - User successfully logs in (redirected from `/login`) OR
   - User directly enters URL `/dashboard`

2. **Route Protection Check**
   - React Router intercepts navigation
   - Calls protected route component wrapper
   - Checks `AuthContext` for valid authentication

3. **AuthContext Validation**
   - Context checks for stored Cognito tokens in localStorage
   - Validates token hasn't expired:
     - Reads `exp` claim from JWT
     - Compares to current timestamp
   - **If token invalid or expired:**
     - Clear tokens from localStorage
     - Set `isAuthenticated = false`
     - Redirect to `/login` with return URL
     - Flow stops here
   - **If token valid:**
     - Continue to step 4

4. **Dashboard Component Mount**
   - React renders `Dashboard.tsx` component
   - Component state initializes:
     - `selectedAsset: 'DJIA'` (default)
     - `timeWindow: '3M'` (default)
     - `scaleType: 'linear'` (default)
     - `activeProphets: []` (no prophets selected)
     - `loading: true`

5. **Data Loading (Current: Test Data)**
   - Component's `useEffect` hook triggers on mount
   - **Current Implementation:**
     - Imports hardcoded data from `src/data/testData.ts`
     - Loads `DJIA_DATA` array (sample price data)
     - Loads `SPX_DATA` array (sample price data)
     - No API calls made
     - No database queries executed
   - **Future Implementation (NOT YET BUILT):**
     - Call API Gateway endpoint: `GET /api/dashboard/summary`
     - Lambda function queries DynamoDB tables:
       - `ChasingProphets-Assets` (count, active status)
       - `ChasingProphets-Prophets` (top performers)
       - `ChasingProphets-ModelFits` (recent fits)
     - Aggregate statistics and return JSON response

6. **Test Data Structure (Current)**
   - File: `src/data/testData.ts`
   - Data format:
     ```typescript
     export const DJIA_DATA = [
       { date: '2024-08-01', open: 40000, high: 40500, low: 39800, close: 40200, volume: 300000000 },
       { date: '2024-08-02', open: 40200, high: 40700, low: 40000, close: 40500, volume: 320000000 },
       // ... additional rows
     ];
     ```

7. **Component State Update**
   - Data loaded into component state:
     - `assetData = DJIA_DATA` (or SPX_DATA based on selection)
     - `loading = false`
   - Triggers re-render

8. **UI Rendering**
   - Dashboard renders multiple sections:
     - **Header:** "Dashboard" title, user greeting
     - **Asset Selector:** Pill buttons (DJIA / SPX)
     - **Time Window Selector:** Buttons (1W, 1M, 3M, All)
     - **Scale Selector:** Buttons (Linear / Log)
     - **Hero Metrics Panel:** 4 stat cards
     - **Main Chart:** Plotly.js chart component
     - **Prophet Console:** 4 prophet cards (UI mockup)
     - **Comparison Mini-Chart:** Secondary asset chart
     - **Signals Panel:** 3 auto-generated signal cards

9. **Hero Metrics Calculation (Client-Side)**
   - Component calculates statistics from `assetData`:
     - **Session Drift:**
       - Last close price - first close price in dataset
       - Displayed as points and percentage
     - **Annualized Volatility:**
       - Standard deviation of daily returns × √252
       - Rolling 30-day window
     - **52-Week High/Low:**
       - Max/min close price in last 252 trading days
       - Span = High - Low
     - **Prophets Live:**
       - Hardcoded: "3/3" (UI mockup)
       - Future: Query `ChasingProphets-Prophets` table WHERE `isActive = true`

10. **Main Chart Rendering**
    - Plotly.js initializes chart with config:
      - Data series: Close price line (blue)
      - X-axis: Dates (filtered by time window)
      - Y-axis: Price (scale type: linear or log)
      - Interactions: Zoom, pan, hover tooltips enabled
    - Chart filters data based on `timeWindow` state:
      - '1W': Last 7 days
      - '1M': Last 30 days
      - '3M': Last 90 days
      - 'All': Full dataset

11. **Prophet Console Rendering (UI Mockup)**
    - Displays 4 hardcoded prophet cards:
      - **TimeSage AI:** "Advanced neural network"
      - **TrendOracle:** "Statistical trend analysis"
      - **MarketMind:** "Ensemble learning model"
      - **QuantumPredictor:** "Quantum-inspired algorithm"
    - Each card shows:
      - Title and description
      - Color-coded accent bar
      - Toggle button (non-functional)
    - **Current:** Click does nothing (mockup only)
    - **Future:** 
      - Query `ChasingProphets-Prophets` table
      - Load prophet predictions from `ChasingProphets-ProphetPerformance`
      - Overlay predictions on main chart

12. **Comparison Mini-Chart Rendering**
    - Shows opposite asset (SPX if DJIA selected, vice versa)
    - Fixed 3M time window
    - Smaller Plotly chart with:
      - Price line (gray)
      - Dashed overlay line (mockup - "TrendOracle")
      - No interaction (display only)

13. **Signals Panel Rendering**
    - 3 auto-generated signal cards:
      - **Momentum:** Based on 14-day RSI calculation
        - Client-side calculation from price data
        - Shows "Bullish" or "Bearish" with icon
      - **Prophet Sync:** Hardcoded "High" (mockup)
      - **Volatility:** Based on standard deviation
        - Client-side calculation
        - Shows "Elevated" or "Normal"
    - Icons and color-coded borders

14. **Final State**
    - User sees fully rendered dashboard
    - All charts interactive (zoom, pan, hover)
    - Asset selector and time window responsive to clicks
    - Loading spinner hidden (`loading = false`)

---

### Task U-2: View Summary of Market Activity

**Task ID:** U-2  
**Task Name:** View a summary of market activity  
**Status:** 🟡 Partial (Mockup with calculated test data metrics)

#### Operational Flow

1. **Component Render**
   - Dashboard component renders Hero Metrics Panel
   - Located at top of page below asset selector

2. **Data Source (Current)**
   - Uses `assetData` state (DJIA_DATA or SPX_DATA)
   - All calculations performed client-side in React component

3. **Session Drift Calculation**
   - Formula:
     ```typescript
     const firstClose = assetData[0].close;
     const lastClose = assetData[assetData.length - 1].close;
     const driftPoints = lastClose - firstClose;
     const driftPercent = (driftPoints / firstClose) * 100;
     ```
   - Display:
     - Points: "+250.5 pts" or "-120.3 pts"
     - Percentage: "+0.62%" or "-0.30%"
     - Color: Green (positive) or Red (negative)

4. **Annualized Volatility Calculation**
   - Steps:
     - Calculate daily returns: `(close[i] - close[i-1]) / close[i-1]`
     - Calculate standard deviation of returns (last 30 days)
     - Annualize: `stdDev × Math.sqrt(252)`
   - Display:
     - "12.5%" (yellow icon for elevated volatility)

5. **52-Week High/Low Calculation**
   - Steps:
     - Filter last 252 trading days from `assetData`
     - Find maximum close price (52W High)
     - Find minimum close price (52W Low)
     - Calculate span: High - Low
   - Display:
     - "High: $42,500"
     - "Low: $38,200"
     - "Span: $4,300"

6. **Prophets Live Display**
   - **Current:** Hardcoded "3/3"
   - **Future Implementation:**
     - Query `ChasingProphets-Prophets` table
     - Filter: `assetId = selectedAsset AND isActive = true`
     - Count results
     - Display: "{count}/3" (max 3 prophets per asset)

7. **Metric Cards Render**
   - Each metric displayed in card component:
     - Icon (top-left)
     - Metric name (below icon)
     - Value (large, centered)
     - Tooltip icon (hover for explanation)

8. **Tooltip Interaction**
   - User hovers over info icon
   - Browser shows native tooltip with explanation:
     - "Session Drift: Change from market open to current"
     - "Annualized Volatility: Price fluctuation measure"
     - "52W High/Low: Year-long price range"
     - "Prophets Live: Active prediction models"

---

### Task U-3: View List of Top-Performing Prophets

**Task ID:** U-3  
**Task Name:** View a list of top-performing prophets  
**Status:** 🟡 Partial (UI mockup only, no real data)

> Scope note: This is a lightweight, read-only snapshot meant for quick discovery from the Dashboard. Full prophet browsing, filtering, sorting, evaluation, and performance analysis live on the Prophets pages (`OPERATIONAL_MAPPING_PROPHETS.md`, Tasks U-16–U-18).

#### Operational Flow

1. **Component Render**
   - Prophet Console section renders below main chart
   - Displays grid of 4 prophet cards

2. **Data Source (Current)**
   - **Hardcoded prophet metadata** in component:
     ```typescript
     const MOCK_PROPHETS = [
       {
         id: 'timesage-ai',
         name: 'TimeSage AI',
         description: 'Advanced neural network with 3-layer architecture',
         color: 'blue',
         emphasisMetric: 'MAE: 0.012'
       },
       {
         id: 'trendoracle',
         name: 'TrendOracle',
         description: 'Statistical trend analysis with momentum indicators',
         color: 'green',
         emphasisMetric: 'Accuracy: 72%'
       },
       // ... 2 more prophets
     ];
     ```
   - No API call made
   - No database query

3. **Future Implementation (NOT YET BUILT)**
   - API call: `GET /api/prophets/top?assetId={selectedAsset}&limit=4`
   - Lambda function:
     - Queries `ChasingProphets-Prophets` table
     - Filters: `assetId = selectedAsset AND isActive = true`
     - Joins with `ChasingProphets-ProphetPerformance` table (GSI)
     - Aggregates metrics (MAE, RMSE, accuracy) over last 30 days
     - Sorts by composite performance score
     - Returns top 4 prophets
   - DynamoDB query structure:
     ```javascript
     // Query Prophets by asset
     const prophetsQuery = {
       TableName: 'ChasingProphets-Prophets',
       IndexName: 'assetId-index',
       KeyConditionExpression: 'assetId = :assetId',
       FilterExpression: 'isActive = :true',
       ExpressionAttributeValues: {
         ':assetId': 'DJIA',
         ':true': true
       }
     };
     
     // For each prophet, query performance
     const performanceQuery = {
       TableName: 'ChasingProphets-ProphetPerformance',
       KeyConditionExpression: 'prophetId = :prophetId AND #date BETWEEN :startDate AND :endDate',
       ExpressionAttributeNames: { '#date': 'date' },
       ExpressionAttributeValues: {
         ':prophetId': 'timesage-ai-001',
         ':startDate': '2025-10-01',
         ':endDate': '2025-11-05'
       }
     };
     ```

4. **Prophet Card Rendering**
   - Each card displays:
     - **Header:**
       - Prophet name (e.g., "TimeSage AI")
       - Color-coded accent bar (left border)
     - **Body:**
       - Description text (2 lines, truncated)
       - Emphasis metric badge (e.g., "MAE: 0.012")
     - **Footer:**
       - Toggle switch (currently non-functional)
       - "Active" indicator (if prophet is selected)

5. **Prophet Selection (UI Only - Current)**
   - User clicks prophet card or toggle switch
   - Component updates local state:
     - `activeProphets` array adds/removes prophet ID
     - Max 3 prophets can be active simultaneously
   - Card visual update:
     - Selected: Border highlight, "Active" badge shows
     - Deselected: Normal border, no badge
   - **No API call or prediction loading occurs**

6. **Future: Prophet Activation Flow**
   - User clicks toggle on prophet card
   - Frontend calls: `GET /api/prophets/{prophetId}/model`
   - Lambda function:
     - Retrieves prophet record from `ChasingProphets-Prophets` table
     - Gets associated `modelFitId`
     - Queries `ChasingProphets-ModelFits` for model file location
     - Generates pre-signed S3 URL:
       ```javascript
       const s3Params = {
         Bucket: 'chasing-prophets',
         Key: `models/${modelFitId}/model.json`,
         Expires: 900 // 15 minutes
       };
       const presignedUrl = s3.getSignedUrl('getObject', s3Params);
       ```
     - Returns: `{ modelUrl: presignedUrl, inputData: [...] }`
   - Frontend downloads model from S3 via presigned URL
   - TensorFlow.js loads model in browser:
     ```typescript
     const model = await tf.loadLayersModel(modelUrl);
     const predictions = model.predict(inputTensor);
     ```
   - Predictions plotted as dashed line on main chart

7. **Error Handling (Future)**
   - If prophet model unavailable:
     - Display: "Model temporarily unavailable"
     - Disable toggle switch
   - If download fails:
     - Display: "Unable to load prophet. Please try again."
   - If TensorFlow.js error:
     - Log to console
     - Display: "Prediction engine error"

---

## Infrastructure Component Summary

### Components Involved in Dashboard Tasks

| Component | Role | Location/Identifier | Status |
|-----------|------|---------------------|--------|
| **React Router** | Route protection and navigation | `src/main.tsx` | ✅ Implemented |
| **AuthContext** | Authentication state validation | `src/context/AuthContext.tsx` | ✅ Implemented |
| **Dashboard Component** | Main UI rendering and state management | `src/pages/Dashboard.tsx` | ✅ Implemented (UI only) |
| **Test Data File** | Hardcoded DJIA/SPX price data | `src/data/testData.ts` | ✅ Implemented |
| **Plotly.js** | Chart rendering engine | NPM package `plotly.js-dist` | ✅ Implemented |
| **Hero Metrics Logic** | Client-side calculations | Inline in `Dashboard.tsx` | ✅ Implemented |
| **Prophet Cards** | Mockup prophet display | Inline in `Dashboard.tsx` | 🟡 UI only |
| **API Gateway** | `/api/dashboard/*` endpoints | AWS API Gateway | ❌ Not implemented |
| **Lambda Functions** | Dashboard data aggregation | AWS Lambda | ❌ Not implemented |
| **DynamoDB Tables** | Prophet, Asset, Performance data | Multiple tables | 🟡 Assets table exists, others not implemented |
| **S3 Bucket** | Model file storage | `chasing-prophets/models/` | ❌ Not implemented |
| **TensorFlow.js** | Client-side ML inference | NPM package `@tensorflow/tfjs` | ❌ Not implemented |

---

## Data Flow Diagrams

### Current Implementation (Test Data)

```
User → Dashboard Component → testData.ts → Client-Side Calculations → UI Render
                                                    ↓
                                            Plotly Chart Display
```

### Future Implementation (Database Integration)

```
User → Dashboard Component → API Gateway → Lambda Function
                                               ↓
                                          DynamoDB Query
                                          (Prophets, Assets,
                                           Performance)
                                               ↓
                                          Aggregate Data
                                               ↓
                                          JSON Response
                                               ↓
Dashboard Component → State Update → UI Render
                          ↓
                  Plotly Chart + Prophet Cards
                          ↓
              User Activates Prophet → S3 Presigned URL
                          ↓
              Download Model → TensorFlow.js Inference
                          ↓
              Predictions Overlay on Chart
```

---

## Test Data Details

### DJIA_DATA Structure

**File:** `src/data/testData.ts`

**Sample Data:**
```typescript
export const DJIA_DATA: PriceDataPoint[] = [
  {
    date: '2024-08-01',
    open: 40000.50,
    high: 40500.75,
    low: 39800.25,
    close: 40200.00,
    volume: 300000000
  },
  // ... approximately 90 days of data for 3M window
];
```

**Data Characteristics:**
- **Date Range:** Last 90 days (for 3M default view)
- **Frequency:** Daily (one record per trading day)
- **Format:** ISO 8601 date strings, numeric OHLCV values
- **Volume:** Realistic values (200M - 400M shares)

### Prophet Mockup Data

**Hardcoded in Component:**
```typescript
const MOCK_PROPHETS = [
  {
    id: 'timesage-ai',
    name: 'TimeSage AI',
    description: 'Advanced neural network with 3-layer LSTM architecture',
    color: '#3b82f6', // blue
    emphasisMetric: 'MAE: 0.012',
    isActive: false
  },
  {
    id: 'trendoracle',
    name: 'TrendOracle',
    description: 'Statistical trend analysis with momentum indicators',
    color: '#10b981', // green
    emphasisMetric: 'Accuracy: 72%',
    isActive: false
  },
  {
    id: 'marketmind',
    name: 'MarketMind',
    description: 'Ensemble learning model combining 5 algorithms',
    color: '#8b5cf6', // purple
    emphasisMetric: 'RMSE: 0.018',
    isActive: false
  },
  {
    id: 'quantumpredictor',
    name: 'QuantumPredictor',
    description: 'Quantum-inspired optimization algorithm',
    color: '#f59e0b', // amber
    emphasisMetric: 'R²: 0.89',
    isActive: false
  }
];
```

---

## User Interactions and State Changes

### Asset Selection

**User Action:** Click "SPX" pill button

**State Change:**
```typescript
// Before
state = { selectedAsset: 'DJIA', assetData: DJIA_DATA }

// After
state = { selectedAsset: 'SPX', assetData: SPX_DATA }
```

**Effects:**
- Main chart data updates to SPX prices
- Hero metrics recalculated for SPX
- Comparison mini-chart switches to DJIA

### Time Window Selection

**User Action:** Click "1M" button

**State Change:**
```typescript
// Before
state = { timeWindow: '3M', filteredData: last90Days }

// After
state = { timeWindow: '1M', filteredData: last30Days }
```

**Effects:**
- Chart X-axis zooms to last 30 days
- Chart auto-scales Y-axis to fit visible data
- Hero metrics recalculated for 30-day window

### Scale Type Toggle

**User Action:** Click "Log" button

**State Change:**
```typescript
// Before
state = { scaleType: 'linear' }

// After
state = { scaleType: 'log' }
```

**Effects:**
- Plotly chart Y-axis type updates to logarithmic
- Percentage changes become visually equidistant

### Prophet Activation (Current: No-Op)

**User Action:** Click prophet toggle switch

**State Change (UI Only):**
```typescript
// Before
state = { activeProphets: [] }

// After (if less than 3 active)
state = { activeProphets: ['timesage-ai'] }
```

**Effects:**
- Prophet card border highlights
- "Active" badge appears
- **No prediction loading or chart overlay** (not implemented)

---

## Performance Metrics

**Current Implementation:**
- Dashboard load time: < 100ms (test data is synchronous)
- Chart render time: 100-300ms (Plotly initialization)
- Hero metrics calculation: < 10ms (client-side math)
- Total time to interactive: < 500ms

**Future Implementation (With API):**
- API call latency: +200-800ms (DynamoDB query + Lambda)
- Model download: +500-2000ms (S3 presigned URL + model.json)
- TensorFlow.js inference: +100-500ms (browser compute)
- Total time to interactive: 1-3 seconds

---

## Known Limitations (Current Implementation)

1. **No Real Prophets:**
   - Prophet cards are UI mockups
   - Toggle switches are non-functional
   - No predictions displayed on chart

2. **Static Test Data:**
   - Price data limited to ~90 days
   - No live updates
   - No historical data beyond test set

3. **No Performance Tracking:**
   - Hero metrics calculated from test data only
   - No prophet performance history
   - No comparison to actual market outcomes

4. **No User Preferences:**
   - Default asset (DJIA) hardcoded
   - Time window resets on page reload
   - No saved favorites or watchlists

5. **No Real-Time Updates:**
   - Market data is static
   - No WebSocket connection
   - No auto-refresh

---

## Future Integration Points

### Required API Endpoints

1. **`GET /api/dashboard/summary`**
   - Returns: Asset count, active prophets, recent model fits
   - Lambda queries: Assets, Prophets, ModelFits tables

2. **`GET /api/prophets/top?assetId={id}&limit=4`**
   - Returns: Top-performing prophets for asset
   - Lambda queries: Prophets (GSI on assetId) + ProphetPerformance

3. **`GET /api/prophets/{prophetId}/model`**
   - Returns: Presigned S3 URL for model.json + input data
   - Lambda generates: S3 presigned URL (15-min expiration)

4. **`GET /api/assets/{assetId}/prices?startDate={date}&endDate={date}`**
   - Returns: OHLCV price data for asset
   - Lambda queries: Datasets table or reads from S3 CSV

### Required DynamoDB Queries

**Assets Table:**
```javascript
// Get all assets
const params = {
  TableName: 'ChasingProphets-Assets',
  FilterExpression: 'isActive = :true',
  ExpressionAttributeValues: { ':true': true }
};
```

**Prophets Table (GSI):**
```javascript
// Get prophets for asset
const params = {
  TableName: 'ChasingProphets-Prophets',
  IndexName: 'assetId-index',
  KeyConditionExpression: 'assetId = :assetId',
  FilterExpression: 'isActive = :true',
  ExpressionAttributeValues: {
    ':assetId': 'DJIA',
    ':true': true
  }
};
```

**ProphetPerformance Table:**
```javascript
// Get prophet metrics for date range
const params = {
  TableName: 'ChasingProphets-ProphetPerformance',
  KeyConditionExpression: 'prophetId = :prophetId AND #date BETWEEN :start AND :end',
  ExpressionAttributeNames: { '#date': 'date' },
  ExpressionAttributeValues: {
    ':prophetId': 'timesage-ai-001',
    ':start': '2025-10-01',
    ':end': '2025-11-05'
  }
};
```

---

## End of Dashboard Page Operational Mapping
