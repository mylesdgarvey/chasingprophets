# Operational Mapping: Datasets and Data Slices Pages

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ❌ Not Yet Implemented (Design Specification)  
**Pages:** `/datasets`, `/datasets/:datasetId`, `/dataslices`, `/dataslices/:dataSliceId`

---

## ⚠️ IMPORTANT: This is a Design Specification

These pages are **NOT YET IMPLEMENTED** in the codebase. This document describes the **planned operational flows** for when these features are built.

---

## Overview

Datasets are standardized collections of historical data for assets (e.g., daily OHLCV data). Data Slices are fixed, immutable time windows extracted from datasets for training models.

---

## Page 1: Datasets List (`/datasets`)

### User Role: Authenticated User

---

### Task: Browse All Datasets

**Task Name:** Browse the full list of available datasets  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - User clicks "Datasets" in sidebar
   - Route: `/datasets`

2. **Component Mount**
   - `Datasets.tsx` component renders
   - State initializes:
     - `datasets: []`
     - `loading: true`
     - `filters: { assetId: null, type: 'all', liveOnly: false }`

3. **API Request**
   ```
   GET /api/datasets?limit=100
   ```

4. **Lambda Query**
   ```javascript
   const params = {
     TableName: 'ChasingProphets-Datasets',
     // Scan all or filter by asset if specified
   };
   ```

5. **DynamoDB Table: Datasets**
   - **Primary Key:** `datasetId` (String)
   - **Attributes:**
     - `datasetId` (PK): e.g., "DJIA_OHLCV_DAILY"
     - `assetId`: Foreign key to Assets table
     - `name`: Human-readable name
     - `type`: 'OHLCV' | 'fundamentals' | 'sentiment' | 'custom'
     - `frequency`: 'daily' | 'hourly' | 'minute'
     - `columns`: Array of column names (CEE - Column Enumeration Entity)
     - `s3Folder`: Path to data files in S3
     - `isLive`: Boolean (actively updated)
     - `startDate`: First date in dataset
     - `endDate`: Last date in dataset (null if live)
     - `recordCount`: Number of rows
     - `lastUpdated`: ISO timestamp
     - `metadata`: JSON (additional info)
   - **GSI-1:** `assetId-index`

6. **Sample Record**
   ```json
   {
     "datasetId": "DJIA_OHLCV_DAILY",
     "assetId": "DJIA",
     "name": "DJIA Daily OHLCV",
     "type": "OHLCV",
     "frequency": "daily",
     "columns": ["date", "open", "high", "low", "close", "volume"],
     "s3Folder": "data/djia/ohlcv/daily/",
     "isLive": true,
     "startDate": "1900-01-01",
     "endDate": null,
     "recordCount": 31250,
     "lastUpdated": "2025-11-05T06:00:00Z",
     "metadata": {
       "source": "Yahoo Finance",
       "updateSchedule": "Daily at 6:00 AM ET"
     }
   }
   ```

7. **UI Rendering**
   - **List View:**
     - Dataset name
     - Asset badge
     - Type badge (OHLCV, Fundamentals, etc.)
     - Live indicator (green dot if isLive)
     - Record count
     - Date range
     - Last updated timestamp
   - **Filters:**
     - Asset dropdown
     - Type dropdown (All, OHLCV, Fundamentals)
     - Live Only checkbox
     - Frequency dropdown (Daily, Hourly, etc.)

8. **User Clicks Dataset**
   - Navigate to `/datasets/{datasetId}`

---

## Page 2: Dataset Detail (`/datasets/:datasetId`)

### User Role: Authenticated User

---

### Task: View Dataset Details and Data Preview

**Task Name:** View detailed information about a dataset  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - Click dataset from list
   - URL: `/datasets/DJIA_OHLCV_DAILY`

2. **Component Mount**
   - `DatasetDetail.tsx` renders
   - Extract `datasetId` from URL

3. **Parallel API Requests**
   - **Request 1:** `GET /api/datasets/{datasetId}` - Metadata
   - **Request 2:** `GET /api/datasets/{datasetId}/preview?limit=100` - Sample data

4. **Lambda: Get Dataset Metadata**
   - DynamoDB Get operation
   - Returns full dataset record

5. **Lambda: Get Data Preview**
   - Read from S3 or query sample:
     ```javascript
     const s3Params = {
       Bucket: 'chasing-prophets',
       Key: `${dataset.s3Folder}latest.csv`,
       Range: 'bytes=0-10000' // First 10KB for preview
     };
     const csvData = await s3.getObject(s3Params).promise();
     const parsed = parseCSV(csvData.Body.toString());
     return parsed.slice(0, 100); // First 100 rows
     ```

6. **UI Sections**
   - **Header:**
     - Dataset name
     - Asset link
     - Type and frequency badges
     - Live status indicator
   
   - **Metadata Cards:**
     - Start Date / End Date
     - Total Records
     - Column Count
     - File Size
     - Last Updated
     - Update Schedule
   
   - **Column Schema Table:**
     - Column Name | Data Type | Sample Values
     - date | Date | 2025-11-05
     - open | Float | 40150.5
     - close | Float | 40200.0
     - volume | Integer | 52000000
   
   - **Data Preview Table:**
     - First 100 rows (inline preview)
     - Scrollable
     - Sortable columns
   
   - **Related Data Slices:**
     - List of slices created from this dataset
     - Click to navigate to slice detail

7. [Removed] CSV download functionality is not part of the system. Full dataset exports are not supported; users analyze data via in-app previews and visualizations.

---

## Page 3: Data Slices List (`/dataslices`)

### User Role: Authenticated User and Admin

---

### Task: Browse All Data Slices

**Task Name:** Browse the full list of data slices  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - Click "Data Slices" in sidebar
   - Route: `/dataslices`

2. **API Request**
   ```
   GET /api/dataslices?limit=100
   ```

3. **DynamoDB Table: DataSlices**
   - **Primary Key:** `sliceId` (String)
   - **Sort Key:** `version` (Number) - for compound slices
   - **Attributes:**
     - `sliceId` (PK): e.g., "DJIA_2020-01-01_2020-12-31"
     - `version` (SK): 1 (for simple slices)
     - `datasetId`: Foreign key to Datasets
     - `sliceType`: 'simple' | 'compound'
     - `startDate`: ISO date (for simple slices)
     - `endDate`: ISO date (for simple slices)
     - `components`: Array of sub-slices (for compound slices)
     - `s3Path`: Optional cached file location
     - `recordCount`: Number of rows in slice
     - `createdBy`: User ID
     - `createdAt`: ISO timestamp
     - `metadata`: JSON
   - **GSI-1:** `datasetId-index`

4. **Sample Records**
   
   **Simple Slice:**
   ```json
   {
     "sliceId": "DJIA_2020-01-01_2020-12-31",
     "version": 1,
     "datasetId": "DJIA_OHLCV_DAILY",
     "sliceType": "simple",
     "startDate": "2020-01-01",
     "endDate": "2020-12-31",
     "components": null,
     "s3Path": null,
     "recordCount": 253,
     "createdBy": "admin@chasingprophets.local",
     "createdAt": "2025-10-01T10:00:00Z",
     "metadata": {
       "purpose": "Training data for 2020 models"
     }
   }
   ```
   
   **Compound Slice:**
   ```json
   {
     "sliceId": "DJIA_COMPOUND_CRISIS_PERIODS",
     "version": 1,
     "datasetId": "DJIA_OHLCV_DAILY",
     "sliceType": "compound",
     "startDate": null,
     "endDate": null,
     "components": [
       {
         "startDate": "2008-09-01",
         "endDate": "2009-03-31",
         "label": "2008 Financial Crisis"
       },
       {
         "startDate": "2020-02-01",
         "endDate": "2020-05-31",
         "label": "COVID-19 Initial Impact"
       }
     ],
     "s3Path": "data/slices/djia_compound_crisis_periods.csv",
     "recordCount": 320,
     "createdBy": "admin@chasingprophets.local",
     "createdAt": "2025-10-15T14:30:00Z",
     "metadata": {
       "purpose": "Train on crisis behavior patterns"
     }
   }
   ```

5. **UI Rendering**
   - **List View:**
     - Slice ID
     - Dataset link
     - Type badge (Simple/Compound)
     - Date range OR "Multiple periods" (for compound)
     - Record count
     - Created by
     - Created date
   - **Filters:**
     - Dataset dropdown
     - Type toggle (Simple/Compound/All)
     - Date range picker
   - **Sort Options:**
     - Most recent
     - Largest (by record count)
     - Alphabetical

6. **User Clicks Slice**
   - Navigate to `/dataslices/{sliceId}`

---

## Page 4: Data Slice Detail (`/dataslices/:dataSliceId`)

### User Role: Authenticated User and Admin

---

### Task: View Data Slice Composition and Usage

**Task Name:** View detailed information about a data slice  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - Click slice from list
   - URL: `/dataslices/DJIA_2020-01-01_2020-12-31`

2. **API Requests**
   - **Request 1:** `GET /api/dataslices/{sliceId}` - Slice metadata
   - **Request 2:** `GET /api/dataslices/{sliceId}/usage` - Models trained on this slice

3. **UI Sections**
   
   **For Simple Slice:**
   - **Header:**
     - Slice ID
     - Dataset link
     - Type: Simple
   - **Date Range Card:**
     - Start Date: Jan 1, 2020
     - End Date: Dec 31, 2020
     - Duration: 365 days
     - Trading Days: 253
   - **Timeline Visualization:**
     - Horizontal bar showing slice position within full dataset
     - Shaded area representing this slice
   
   **For Compound Slice:**
   - **Header:**
     - Slice ID
     - Dataset link
     - Type: Compound
   - **Components Table:**
     - Period 1: Sep 1, 2008 - Mar 31, 2009 (150 days) - "2008 Financial Crisis"
     - Period 2: Feb 1, 2020 - May 31, 2020 (89 days) - "COVID-19 Initial Impact"
     - Total Days: 239 trading days
   - **Timeline Visualization:**
     - Multiple highlighted periods on dataset timeline

4. **Data Preview Section**
   - If slice has cached S3 file:
     - Display first 50 rows (inline)
   - If constructed on-the-fly:
     - Note: "Data is generated dynamically from dataset"
     - "Preview available when used in model training"

5. **Usage Section**
   - **Title:** "Models Trained on This Slice"
   - **Table:**
     - Model Fit Name | Status | Performance | Created Date
     - LSTM-3Layer-DJIA | Fit | MAE: 45.2 | Oct 20, 2025
     - SimpleLinReg-DJIA | Fit | MAE: 78.5 | Oct 18, 2025
   - Click row to navigate to Model Fit detail

6. **Admin Actions (Admin Only)**
   - **Edit Slice:** Modify date ranges (simple) or components (compound)
   - **Delete Slice:** Remove slice (only if not used by any model fits)
   - **Duplicate Slice:** Create copy with new ID

---

## Admin Task: Create Data Slice (See Admin Pages)

Creation, editing, and deletion of data slices are covered in `OPERATIONAL_MAPPING_ADMIN.md` (Task A-4). The user-facing Data Slices pages (`/dataslices`, `/dataslices/:id`) are read-only for alpha and focus on browsing, inspecting composition, and inline preview only (no CSV downloads).

---

## Infrastructure Component Summary

### Components for Datasets/Slices (Planned)

| Component | Role | Status |
|-----------|------|--------|
| **Datasets Component** | List page | ❌ To be created |
| **DatasetDetail Component** | Detail page | ❌ To be created |
| **DataSlices Component** | List page | ❌ To be created |
| **DataSliceDetail Component** | Detail page | ❌ To be created |
| **CreateDataSlice Component** | Admin form | ❌ To be created |
| **API Gateway** | `/api/datasets/*`, `/api/dataslices/*` | ❌ To be created |
| **Lambda: getDatasets** | List datasets | ❌ To be created |
| **Lambda: getDatasetById** | Dataset detail | ❌ To be created |
| **Lambda: getDatasetPreview** | Sample data | ❌ To be created |
| **Lambda: getDataSlices** | List slices | ❌ To be created |
| **Lambda: getDataSliceById** | Slice detail | ❌ To be created |
| **Lambda: createDataSlice** | Admin create | ❌ To be created |
| **DynamoDB: Datasets** | Metadata storage | ❌ To be created |
| **DynamoDB: DataSlices** | Slice definitions | ❌ To be created |
| **S3: data/** | CSV files | 🟡 Partial (some price data exists) |
| **S3: data/slices/** | Cached slices | ❌ To be created |

---

## Data Flow Patterns

### Simple Slice Creation Flow
```
Admin Form → API Gateway → Lambda → Validate Dates → DynamoDB Insert
                                           ↓
                              (If cacheToS3) → Read Dataset from S3 
                                           ↓
                                  Filter by Date Range 
                                           ↓
                              Write to S3: data/slices/{id}.csv
                                           ↓
                              Update DynamoDB with s3Path
                                           ↓
                              Return Success → Navigate to Detail
```

### Compound Slice Creation Flow
```
Admin Form → Define Multiple Periods → API Gateway → Lambda
                                                        ↓
                                        DynamoDB Insert (components array)
                                                        ↓
                            (If cacheToS3) → For Each Component:
                                                        ↓
                                        Read Dataset, Filter Dates
                                                        ↓
                                            Concatenate All Periods
                                                        ↓
                                Write Combined CSV to S3: data/slices/{id}.csv
                                                        ↓
                                        Update DynamoDB with s3Path
                                                        ↓
                                        Return Success
```

---

## End of Datasets and Data Slices Pages Operational Mapping
