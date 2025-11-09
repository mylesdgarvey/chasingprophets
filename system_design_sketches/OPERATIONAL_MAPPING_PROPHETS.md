# Operational Mapping: Prophets Pages

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ❌ Not Yet Implemented (Design Specification)  
**Pages:** `/prophets` (list) and `/prophets/:prophetId` (detail)

---

## ⚠️ IMPORTANT: This is a Design Specification

These pages are **NOT YET IMPLEMENTED** in the codebase. This document describes the **planned operational flows** for when these features are built. All data flows, API endpoints, and components described below are **design specifications only**.

---

## Overview

This document provides detailed operational mappings for all planned tasks on the Prophets List and Prophet Detail pages. Prophets are the core prediction engines that combine trained models with forecasting methods to generate live predictions.

---

## Page 1: Prophets List (`/prophets`)

### User Role: Authenticated User

---

### Task U-16: Browse the Full List of Available Prophets

**Task ID:** U-16  
**Task Name:** Browse the full list of available prophets  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - User clicks "Prophets" in sidebar OR
   - User enters URL `/prophets` directly OR
   - User clicks "View All Prophets" from Dashboard

2. **Route Protection**
   - React Router intercepts navigation
   - Checks AuthContext for valid Cognito tokens
   - If unauthorized: redirect to `/login`
   - If authorized: continue to step 3

3. **Prophets List Component Mount**
   - React renders `Prophets.tsx` component (to be created)
   - Component state initializes:
     - `prophets: []`
     - `loading: true`
     - `filters: { assetId: null, status: 'active', sortBy: 'performance' }`
     - `error: null`

4. **API Request Initiation**
   - Component's `useEffect` hook triggers on mount
   - Calls async function: `fetchProphets()`
   - Function from `src/services/prophets.ts` (to be created)

5. **API Gateway Request**
   - Frontend makes HTTP request:
     ```
     GET https://<api-gateway-id>.execute-api.<region>.amazonaws.com/prod/prophets?status=active&sortBy=performance&limit=50
     Headers:
       Authorization: Bearer <cognito-id-token>
       Content-Type: application/json
     ```

6. **API Gateway Authorization**
   - API Gateway validates JWT token using Cognito authorizer
   - If invalid: Return 401, flow ends
   - If valid: Forward to Lambda

7. **Lambda Function Execution**
   - Function: `getProphets` (to be created)
   - Runtime: Python 3.11 or Node.js 18
   - Receives query parameters:
     - `status`: 'active' | 'inactive' | 'all'
     - `assetId`: Optional filter by asset
     - `sortBy`: 'performance' | 'name' | 'created'
     - `limit`: Number of results (default 50)

8. **DynamoDB Query Operation**
   - Lambda queries `ChasingProphets-Prophets` table (to be created)
   - If filtering by asset:
     ```javascript
     const params = {
       TableName: 'ChasingProphets-Prophets',
       IndexName: 'assetId-index',
       KeyConditionExpression: 'assetId = :assetId',
       FilterExpression: 'isActive = :status',
       ExpressionAttributeValues: {
         ':assetId': assetId,
         ':status': status === 'active'
       }
     };
     ```
   - If no asset filter (all prophets):
     ```javascript
     const params = {
       TableName: 'ChasingProphets-Prophets',
       FilterExpression: 'isActive = :status',
       ExpressionAttributeValues: {
         ':status': status === 'active'
       }
     };
     ```

9. **DynamoDB Table Structure**
   - **Table Name:** `ChasingProphets-Prophets`
   - **Primary Key:** `prophetId` (String)
   - **Attributes:**
     - `prophetId` (PK): Unique identifier (UUID or descriptive)
     - `name`: Display name (e.g., "TimeSage AI - DJIA")
     - `description`: Brief description
     - `assetId`: Asset being predicted
     - `modelFitId`: Reference to trained model
     - `forecastMethod`: 'direct' | 'iterative' | 'rolling'
     - `outputMeasure`: What it predicts (e.g., 'close_price', 'return')
     - `isActive`: Boolean
     - `createdBy`: User ID who created it
     - `createdAt`: ISO timestamp
     - `updatedAt`: ISO timestamp
   - **GSI-1:** `assetId-index` (Partition Key: assetId)
   - **GSI-2:** `modelFitId-index` (Partition Key: modelFitId)

10. **Sample DynamoDB Record**
    ```json
    {
      "prophetId": "timesage-ai-djia-001",
      "name": "TimeSage AI - DJIA",
      "description": "Advanced LSTM network trained on 10 years of DJIA data",
      "assetId": "DJIA",
      "modelFitId": "lstm-3layer-djia-2015-2025",
      "forecastMethod": "direct",
      "outputMeasure": "close_price",
      "horizon": 1,
      "isActive": true,
      "createdBy": "admin@chasingprophets.local",
      "createdAt": "2025-10-15T10:00:00Z",
      "updatedAt": "2025-11-05T06:00:00Z"
    }
    ```

11. **Fetch Performance Metrics (Aggregated)**
    - For each prophet, Lambda queries recent performance
    - Table: `ChasingProphets-ProphetPerformance`
    - Query last 30 days of metrics:
      ```javascript
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const performanceParams = {
        TableName: 'ChasingProphets-ProphetPerformance',
        KeyConditionExpression: 'prophetId = :prophetId AND #date >= :startDate',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
          ':prophetId': 'timesage-ai-djia-001',
          ':startDate': thirtyDaysAgo.toISOString().split('T')[0]
        }
      };
      ```

12. **Performance Metrics Aggregation**
    - Lambda calculates aggregate metrics:
      ```javascript
      const metrics = {
        mae: average(performances.map(p => p.mae)),
        rmse: average(performances.map(p => p.rmse)),
        mape: average(performances.map(p => p.mape)),
        directionalAccuracy: (correctDirections / total) * 100,
        r2: calculateR2(performances),
        lastUpdated: performances[performances.length - 1].date
      };
      ```

13. **Lambda Response Processing**
    - Combine prophet data with performance metrics
    - Sort by requested criteria
    - Response body:
      ```json
      {
        "success": true,
        "prophets": [
          {
            "id": "timesage-ai-djia-001",
            "name": "TimeSage AI - DJIA",
            "description": "Advanced LSTM network trained on 10 years of DJIA data",
            "assetId": "DJIA",
            "assetName": "Dow Jones Industrial Average",
            "isActive": true,
            "performance": {
              "mae": 0.012,
              "rmse": 0.018,
              "mape": 1.2,
              "directionalAccuracy": 72.5,
              "r2": 0.89,
              "lastUpdated": "2025-11-05"
            },
            "createdAt": "2025-10-15T10:00:00Z"
          },
          {
            "id": "trendoracle-spx-002",
            "name": "TrendOracle - S&P 500",
            "description": "Statistical trend analysis with momentum indicators",
            "assetId": "SPX",
            "assetName": "S&P 500 Index",
            "isActive": true,
            "performance": {
              "mae": 0.015,
              "rmse": 0.021,
              "mape": 1.5,
              "directionalAccuracy": 68.3,
              "r2": 0.85,
              "lastUpdated": "2025-11-05"
            },
            "createdAt": "2025-10-01T08:30:00Z"
          }
          // ... more prophets
        ],
        "count": 24
      }
      ```

14. **Frontend Receives Response**
    - Component updates state:
      - `prophets = response.prophets`
      - `loading = false`
    - Triggers re-render

15. **UI Rendering**
    - Prophets component renders prophet list
    - **Grid View (Default):**
      - Prophet cards with:
        - Prophet name (large, bold)
        - Asset badge (e.g., "DJIA")
        - Description (2 lines, truncated)
        - Performance metrics cards:
          - Directional Accuracy (large, %)
          - MAE (small)
          - RMSE (small)
        - Active/Inactive badge
        - "View Details" button
    - **Table View (Alternative):**
      - Columns: Name, Asset, Directional Accuracy, MAE, RMSE, R², Status, Actions
      - Sortable columns
      - Row click navigates to detail page

16. **Filter Panel Render**
    - Sidebar or top bar with filters:
      - **Asset Filter:** Dropdown (All Assets, DJIA, SPX, AAPL, etc.)
      - **Status Filter:** Toggles (Active Only, Include Inactive)
      - **Sort Options:** Dropdown (Best Performance, Alphabetical, Recently Created)
      - **Performance Threshold:** Slider (Min Directional Accuracy %)
    - Filter changes trigger new API request

17. **Empty State**
    - If no prophets match filters:
      - Display: "No prophets found"
      - Suggestion: "Try adjusting your filters"
      - Button: "Clear All Filters"

18. **Error Handling**
    - Network error: "Unable to load prophets. Check connection."
    - 401: Redirect to login
    - 500: "Server error. Please try again."
    - Retry button available

---

### Task: Filter Prophets by Asset

**Task Name:** Filter prophet list by asset  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Selects Asset Filter**
   - User clicks "Asset" dropdown
   - Selects "DJIA" from list

2. **State Update**
   - Component updates filter state:
     ```typescript
     setFilters({ ...filters, assetId: 'DJIA' });
     ```

3. **API Re-query**
   - New API request with filter:
     ```
     GET /prophets?assetId=DJIA&status=active
     ```

4. **DynamoDB Query with GSI**
   - Lambda uses assetId-index GSI:
     ```javascript
     const params = {
       TableName: 'ChasingProphets-Prophets',
       IndexName: 'assetId-index',
       KeyConditionExpression: 'assetId = :assetId',
       FilterExpression: 'isActive = :active',
       ExpressionAttributeValues: {
         ':assetId': 'DJIA',
         ':active': true
       }
     };
     ```

5. **Filtered Results Display**
   - Component shows only DJIA prophets
   - Count updates: "Showing 5 prophets for DJIA"
   - Filter badge appears: "DJIA ✕" (click to remove)

6. **Clear Filter**
   - User clicks ✕ on filter badge
   - State resets: `assetId = null`
   - Full list re-displayed

---

### Task: Sort Prophets by Performance

**Task Name:** Sort prophets by performance metrics  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Selects Sort Option**
   - User clicks "Sort by" dropdown
   - Selects "Best Performance" (default) or "Lowest MAE" or "Alphabetical"

2. **Client-Side Sort (If Data Already Loaded)**
   - Component sorts `prophets` array:
     ```typescript
     const sorted = [...prophets].sort((a, b) => {
       if (sortBy === 'performance') {
         return b.performance.directionalAccuracy - a.performance.directionalAccuracy;
       } else if (sortBy === 'mae') {
         return a.performance.mae - b.performance.mae;
       } else {
         return a.name.localeCompare(b.name);
       }
     });
     ```

3. **UI Updates**
   - Prophet cards re-order instantly
   - No API call needed (sorting is client-side)

4. **Alternative: Server-Side Sort**
   - For very large lists, pass `sortBy` to API:
     ```
     GET /prophets?sortBy=performance&order=desc
     ```
   - Lambda sorts before returning results

---

## Page 2: Prophet Detail (`/prophets/:prophetId`)

### User Role: Authenticated User

---

### Task U-17: View the Detailed Performance Page for a Prophet

**Task ID:** U-17  
**Task Name:** View the detailed performance page for a prophet  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - User clicks prophet card from Prophets List OR
   - User clicks prophet link from Asset Detail page OR
   - User enters URL: `/prophets/timesage-ai-djia-001`

2. **Route Matching**
   - React Router extracts `:prophetId` from URL
   - Example: `/prophets/timesage-ai-djia-001` → `prophetId = "timesage-ai-djia-001"`

3. **Prophet Detail Component Mount**
   - React renders `ProphetDetail.tsx` component (to be created)
   - Component state initializes:
     - `prophet: null`
     - `performance: []`
     - `predictions: []`
     - `loading: true`
     - `timeWindow: '30D'` (default)

4. **Parallel API Requests**
   - Component initiates multiple API calls:
     - **Request 1:** Prophet metadata
     - **Request 2:** Performance history
     - **Request 3:** Recent predictions
     - **Request 4:** Model file URL (for client-side inference)

5. **API Request 1: Prophet Metadata**
   - Endpoint: `GET /prophets/{prophetId}`
   - Lambda queries DynamoDB:
     ```javascript
     const params = {
       TableName: 'ChasingProphets-Prophets',
       Key: { prophetId: 'timesage-ai-djia-001' }
     };
     ```
   - Returns prophet record + asset details + model fit details

6. **Lambda Response 1: Prophet Data**
   ```json
   {
     "success": true,
     "prophet": {
       "id": "timesage-ai-djia-001",
       "name": "TimeSage AI - DJIA",
       "description": "Advanced LSTM network with 3-layer architecture trained on 10 years of DJIA data. Uses closing prices and volume as inputs.",
       "assetId": "DJIA",
       "assetName": "Dow Jones Industrial Average",
       "modelFitId": "lstm-3layer-djia-2015-2025",
       "forecastMethod": "direct",
       "outputMeasure": "close_price",
       "horizon": 1,
       "isActive": true,
       "metadata": {
         "inputFeatures": ["close", "volume", "sma_20", "sma_50"],
         "lookbackWindow": 30,
         "modelArchitecture": "LSTM 128 -> Dropout 0.2 -> LSTM 64 -> Dense 1",
         "trainingPeriod": "2015-01-01 to 2024-12-31",
         "validationAccuracy": 0.72
       },
       "createdBy": "admin@chasingprophets.local",
       "createdAt": "2025-10-15T10:00:00Z",
       "lastUpdated": "2025-11-05T06:00:00Z"
     }
   }
   ```

7. **API Request 2: Performance History**
   - Endpoint: `GET /prophets/{prophetId}/performance?days=30`
   - Lambda queries `ChasingProphets-ProphetPerformance`:
     ```javascript
     const params = {
       TableName: 'ChasingProphets-ProphetPerformance',
       KeyConditionExpression: 'prophetId = :prophetId AND #date >= :startDate',
       ExpressionAttributeNames: { '#date': 'date' },
       ExpressionAttributeValues: {
         ':prophetId': 'timesage-ai-djia-001',
         ':startDate': '2025-10-06' // 30 days ago
       }
     };
     ```

8. **ProphetPerformance Table Structure**
   - **Table Name:** `ChasingProphets-ProphetPerformance`
   - **Primary Key:** `prophetId` (String)
   - **Sort Key:** `date` (String, YYYY-MM-DD)
   - **Attributes:**
     - `prophetId` (PK)
     - `date` (SK)
     - `predicted`: Predicted value
     - `actual`: Actual value
     - `error`: Difference (actual - predicted)
     - `absoluteError`: |error|
     - `percentageError`: (error / actual) * 100
     - `directionCorrect`: Boolean (predicted direction matches actual)
     - `mae`: Mean Absolute Error (rolling window)
     - `rmse`: Root Mean Squared Error (rolling window)
     - `mape`: Mean Absolute Percentage Error (rolling window)
     - `metadata`: JSON (additional context)

9. **Lambda Response 2: Performance Data**
   ```json
   {
     "success": true,
     "prophetId": "timesage-ai-djia-001",
     "performance": [
       {
         "date": "2025-10-06",
         "predicted": 40150.5,
         "actual": 40200.0,
         "error": 49.5,
         "absoluteError": 49.5,
         "percentageError": 0.12,
         "directionCorrect": true,
         "mae": 45.2,
         "rmse": 58.3,
         "mape": 0.11
       },
       {
         "date": "2025-10-07",
         "predicted": 40250.0,
         "actual": 40180.0,
         "error": -70.0,
         "absoluteError": 70.0,
         "percentageError": -0.17,
         "directionCorrect": false,
         "mae": 47.8,
         "rmse": 60.1,
         "mape": 0.12
       }
       // ... 28 more days
     ],
     "summary": {
       "averageMae": 48.5,
       "averageRmse": 59.7,
       "averageMape": 0.12,
       "directionalAccuracy": 72.5,
       "totalPredictions": 30
     }
   }
   ```

10. **API Request 3: Model File URL**
    - Endpoint: `GET /prophets/{prophetId}/model`
    - Lambda retrieves model file location from ModelFits table
    - Generates S3 presigned URL:
      ```javascript
      const s3Params = {
        Bucket: 'chasing-prophets',
        Key: `models/${modelFitId}/model.json`,
        Expires: 900 // 15 minutes
      };
      const presignedUrl = await s3.getSignedUrl('getObject', s3Params);
      ```
    - Returns:
      ```json
      {
        "success": true,
        "modelUrl": "https://chasing-prophets.s3.amazonaws.com/models/lstm-3layer-djia-2015-2025/model.json?X-Amz-Algorithm=...",
        "weightsUrls": [
          "https://chasing-prophets.s3.amazonaws.com/models/.../group1-shard1of1.bin?..."
        ],
        "expiresAt": "2025-11-05T13:00:00Z"
      }
      ```

11. **Frontend Receives All Responses**
    - Prophet metadata stored in `prophet` state
    - Performance data stored in `performance` state
    - Model URLs stored in `modelUrls` state
    - Loading set to false
    - Triggers re-render

12. **UI Rendering - Header Section**
    - **Prophet Name:** Large, bold heading
    - **Asset Badge:** Clickable link to asset detail
    - **Status Badge:** Green "Active" or Gray "Inactive"
    - **Description:** Full text, multiple paragraphs allowed
    - **Metadata Cards:**
      - Forecast Method (e.g., "Direct, 1-day horizon")
      - Output Measure (e.g., "Closing Price")
      - Model Architecture (e.g., "3-Layer LSTM")
      - Last Updated (e.g., "5 minutes ago")

13. **UI Rendering - Performance Overview Section**
    - **Metric Cards (Large):**
      - Directional Accuracy: 72.5% (with trend arrow)
      - Average MAE: 48.5 points
      - Average RMSE: 59.7 points
      - Average MAPE: 0.12%
    - **Time Window Selector:**
      - Buttons: 7D, 30D, 90D, 1Y, All
      - Selected: 30D (highlighted)

14. **UI Rendering - Predictions vs Actuals Chart**
    - Plotly.js chart with:
      - **X-axis:** Dates (last 30 days)
      - **Y-axis:** Price values
      - **Series 1:** Actual values (solid blue line)
      - **Series 2:** Predicted values (dashed orange line)
      - **Series 3:** Error bars or shaded area (difference)
    - Interactions:
      - Hover: Show predicted, actual, error values
      - Zoom: Focus on specific date range
      - Toggle: Show/hide error visualization

15. **UI Rendering - Error Distribution Chart**
    - Histogram showing distribution of prediction errors
    - X-axis: Error magnitude (bins: -100 to +100 points)
    - Y-axis: Frequency
    - Shows if errors are symmetric or biased

16. **UI Rendering - Directional Accuracy Timeline**
    - Binary chart showing correct vs incorrect direction predictions
    - Green bars: Correct direction
    - Red bars: Incorrect direction
    - Shows streaks and patterns

17. **Download Model (Client-Side Inference)**
    - Component downloads model from S3 using presigned URL:
      ```typescript
      const model = await tf.loadLayersModel(modelUrls.modelUrl);
      ```
    - TensorFlow.js loads model in browser
    - Model stored in component state for inference

18. **Live Prediction Section (Future)**
    - **Current Asset Price:** Displayed with real-time data
    - **Predicted Next Value:** Calculated using downloaded model
    - **Confidence Interval:** ± error range
    - **"Run Prediction" Button:** Triggers inference
    - **Input Features:** Shows what data model is using (last 30 close prices, volume, etc.)

19. **Related Information Tabs**
    - **Tab 1: Performance** (default, shown above)
    - **Tab 2: Model Details**
      - Training period
      - Validation metrics
      - Hyperparameters
      - Architecture diagram
    - **Tab 3: Training Data**
      - Data slices used
      - Training set size
      - Validation set size
    - **Tab 4: Comparison**
      - Compare this prophet to others for same asset
      - Side-by-side metrics

---

### Task U-18: Evaluate a Prophet's Predictions Against Historical Data

**Task ID:** U-18  
**Task Name:** Evaluate a prophet's predictions against historical data  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Interacts with Performance Chart**
   - User hovers over specific date on chart
   - Tooltip displays:
     - Date: "October 15, 2025"
     - Predicted: 40,150.50
     - Actual: 40,200.00
     - Error: +49.50 (+0.12%)
     - Direction: Correct ✓

2. **User Zooms into Date Range**
   - User draws box on chart to zoom
   - Chart focuses on selected dates (e.g., Oct 1-15)
   - Y-axis auto-scales to visible data

3. **User Changes Time Window**
   - User clicks "90D" button
   - New API request:
     ```
     GET /prophets/timesage-ai-djia-001/performance?days=90
     ```
   - Chart updates with 90 days of data
   - Metric cards recalculate for 90-day window

4. **User Compares Multiple Metrics**
   - User toggles checkboxes:
     - [ ] Show MAE
     - [✓] Show RMSE
     - [ ] Show MAPE
   - Secondary chart appears with selected metrics over time

5. [Removed] CSV performance downloads are not supported. Performance is visualized inline via charts and tables; exports may be provided later via admin reports.

6. **User Views Error Analysis**
   - User scrolls to "Error Analysis" section
   - Displays:
     - **Error Distribution Chart:** Histogram
     - **Error by Day of Week:** Grouped bar chart (Monday errors vs Tuesday errors, etc.)
     - **Error Trends:** Rolling average of errors over time
     - **Worst Predictions:** Table of 5 largest errors with context

7. **User Compares to Other Prophets**
   - User clicks "Compare" tab
   - Dropdown: "Select prophet to compare"
   - User selects "TrendOracle - DJIA"
   - Side-by-side comparison:
     - Directional Accuracy: 72.5% vs 68.3%
     - MAE: 48.5 vs 55.2
     - RMSE: 59.7 vs 68.1
   - Chart overlay: Both prophets' predictions on same timeline

---

## Infrastructure Component Summary

### Components Involved in Prophets Pages (Planned)

| Component | Role | Location/Identifier | Status |
|-----------|------|---------------------|--------|
| **Prophets Component** | List page UI | `src/pages/Prophets.tsx` | ❌ To be created |
| **ProphetDetail Component** | Detail page UI | `src/pages/ProphetDetail.tsx` | ❌ To be created |
| **Prophets Service** | API calls | `src/services/prophets.ts` | ❌ To be created |
| **API Gateway** | REST endpoints | `/prod/prophets/*` | ❌ To be created |
| **Lambda: getProphets** | List all prophets | AWS Lambda | ❌ To be created |
| **Lambda: getProphetById** | Get prophet metadata | AWS Lambda | ❌ To be created |
| **Lambda: getProphetPerformance** | Get performance history | AWS Lambda | ❌ To be created |
| **Lambda: getProphetModel** | Generate S3 presigned URL | AWS Lambda | ❌ To be created |
| **DynamoDB: Prophets** | Prophet metadata | `ChasingProphets-Prophets` | ❌ To be created |
| **DynamoDB: ProphetPerformance** | Daily metrics | `ChasingProphets-ProphetPerformance` | ❌ To be created |
| **DynamoDB: ModelFits** | Model file locations | `ChasingProphets-ModelFits` | ❌ To be created |
| **S3 Bucket** | Model files (TF.js) | `chasing-prophets/models/` | ❌ To be created |
| **TensorFlow.js** | Client-side inference | NPM package `@tensorflow/tfjs` | ⚠️ Installed but not used |
| **Plotly.js** | Performance charts | NPM package | ✅ Already used |

---

## End of Prophets Pages Operational Mapping
