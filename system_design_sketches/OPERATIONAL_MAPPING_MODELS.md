# Operational Mapping: Model Scaffolds and Model Fits Pages

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ❌ Not Yet Implemented (Design Specification)  
**Pages:** `/model-scaffolds`, `/model-scaffolds/:scaffoldId`, `/model-fits`, `/model-fits/:modelFitId`

---

## ⚠️ IMPORTANT: This is a Design Specification

These pages are **NOT YET IMPLEMENTED** in the codebase. This document describes the **planned operational flows**.

---

## Overview

**Model Scaffolds** are reusable model architecture templates (e.g., "Simple Linear Regression", "3-Layer LSTM"). **Model Fits** are trained instances of scaffolds on specific data slices for specific assets.

---

## Page 1: Model Scaffolds List (`/model-scaffolds`)

### User Role: Authenticated User (view), Admin (create/edit)

---

### Task: Browse All Model Scaffolds

**Task Name:** Browse the full list of model scaffolds  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **User Navigation**
   - Click "Model Scaffolds" in sidebar
   - Route: `/model-scaffolds`

2. **API Request**
   ```
   GET /api/model-scaffolds?limit=100
   ```

3. **DynamoDB Table: ModelScaffolds**
   - **Primary Key:** `scaffoldId` (String)
   - **Attributes:**
     - `scaffoldId` (PK): e.g., "SLR-LAG-1-OLS"
     - `name`: Display name "Simple Linear Regression (1-day lag)"
     - `type`: 'ML' | 'DL' | 'TS' (Machine Learning, Deep Learning, Time Series)
     - `category`: 'regression' | 'classification' | 'ensemble'
     - `description`: Detailed explanation
     - `formulaLatex`: LaTeX mathematical formula (optional)
     - `formulaHtml`: HTML rendered formula (optional)
     - `inputShape`: Expected input dimensions [features, timesteps]
     - `outputShape`: Expected output dimensions
     - `hyperparameters`: JSON object with default values
     - `inferenceEngine`: 'tfjs' | 'coefficients' | 'server'
     - `s3CodePath`: Path to training script in S3
     - `config`: JSON (additional settings)
     - `createdBy`: User ID
     - `createdAt`: ISO timestamp
     - `updatedAt`: ISO timestamp

4. **Sample Records**

   **Simple Linear Regression:**
   ```json
   {
     "scaffoldId": "SLR-LAG-1-OLS",
     "name": "Simple Linear Regression (1-day lag)",
     "type": "ML",
     "category": "regression",
     "description": "Linear regression model using previous day's closing price to predict next day's close. Uses Ordinary Least Squares estimation.",
     "formulaLatex": "Y_t = \\beta_0 + \\beta_1 X_{t-1} + \\epsilon_t",
     "formulaHtml": "<p>Y<sub>t</sub> = β<sub>0</sub> + β<sub>1</sub> X<sub>t-1</sub> + ε<sub>t</sub></p>",
     "inputShape": [1, 1],
     "outputShape": [1],
     "hyperparameters": {
       "lagDays": 1,
       "fitIntercept": true
     },
     "inferenceEngine": "coefficients",
     "s3CodePath": "scripts/scaffolds/slr_lag_1_ols.py",
     "config": {
       "requiresScaling": true,
       "scalingMethod": "standardization"
     },
     "createdBy": "admin@chasingprophets.local",
     "createdAt": "2025-09-01T10:00:00Z",
     "updatedAt": "2025-10-15T08:30:00Z"
   }
   ```

   **LSTM Neural Network:**
   ```json
   {
     "scaffoldId": "LSTM-3LAYER-128-64-32",
     "name": "3-Layer LSTM (128-64-32 units)",
     "type": "DL",
     "category": "regression",
     "description": "Deep learning model with 3 LSTM layers. Uses 30-day lookback window with closing price and volume. Includes dropout for regularization.",
     "formulaLatex": null,
     "formulaHtml": "<p>Architecture: LSTM(128) → Dropout(0.2) → LSTM(64) → Dropout(0.2) → LSTM(32) → Dense(1)</p>",
     "inputShape": [30, 2],
     "outputShape": [1],
     "hyperparameters": {
       "lookbackDays": 30,
       "lstm1Units": 128,
       "lstm2Units": 64,
       "lstm3Units": 32,
       "dropoutRate": 0.2,
       "epochs": 100,
       "batchSize": 32,
       "learningRate": 0.001
     },
     "inferenceEngine": "tfjs",
     "s3CodePath": "scripts/scaffolds/lstm_3layer.py",
     "config": {
       "requiresScaling": true,
       "scalingMethod": "minmax",
       "framework": "tensorflow"
     },
     "createdBy": "admin@chasingprophets.local",
     "createdAt": "2025-09-15T14:00:00Z",
     "updatedAt": "2025-10-20T11:15:00Z"
   }
   ```

5. **UI Rendering**
   - **Card Grid View:**
     - Scaffold name (large, bold)
     - Type badge (ML/DL/TS)
     - Category badge (Regression, etc.)
     - Description (truncated to 2 lines)
     - Formula preview (LaTeX or HTML)
     - "View Details" button
   
   - **Filters:**
     - Type dropdown (All, ML, DL, TS)
     - Category dropdown
     - Inference Engine (TensorFlow.js, Coefficients, Server)
   
   - **Sort Options:**
     - Alphabetical
     - Most recently created
     - Most used (by model fits count)

6. **User Clicks Scaffold**
   - Navigate to `/model-scaffolds/{scaffoldId}`

---

## Page 2: Model Scaffold Detail (`/model-scaffolds/:scaffoldId`)

### User Role: Authenticated User (view), Admin (edit)

---

### Task: View Model Scaffold Details

**Task Name:** View detailed information about a model scaffold  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **API Requests**
   - **Request 1:** `GET /api/model-scaffolds/{scaffoldId}`
   - **Request 2:** `GET /api/model-scaffolds/{scaffoldId}/fits` - List of model fits using this scaffold

2. **UI Sections**

   **Header:**
   - Scaffold name
   - Type and category badges
   - Created by, created date
   - Last updated timestamp
   - **Admin Actions:** Edit, Delete buttons (admin only)

   **Description Card:**
   - Full description (multiple paragraphs)
   - Mathematical formula (rendered LaTeX or HTML)
   - Architecture diagram (if deep learning)

   **Input/Output Specification:**
   - **Input Shape:** [30, 2] - "30 timesteps, 2 features (close, volume)"
   - **Output Shape:** [1] - "1 value (predicted close price)"
   - **Expected Features:** List with descriptions
     - Feature 1: Closing price (normalized)
     - Feature 2: Trading volume (normalized)

   **Hyperparameters Table:**
   - Parameter Name | Default Value | Description | Range
   - lookbackDays | 30 | Days of history used | 1-100
   - lstm1Units | 128 | Units in first LSTM layer | 16-256
   - dropoutRate | 0.2 | Dropout rate for regularization | 0.0-0.5
   - learningRate | 0.001 | Adam optimizer learning rate | 0.0001-0.01

   **Inference Engine:**
   - Type: TensorFlow.js (runs in browser)
   - Requirements: Model file exported as TF.js format
   - Performance: ~100-500ms per prediction

   **Training Code:**
   - Download button: "Download Training Script"
   - Presigned S3 URL for `s3://chasing-prophets/scripts/scaffolds/{scaffoldId}.py`
   - Code preview (syntax highlighted)

   **Model Fits Using This Scaffold:**
   - Table: Asset | Data Slice | Status | Performance | Created
   - DJIA | 2015-2024 | Fit | MAE: 48.5 | Oct 20, 2025
   - SPX | 2015-2024 | Fit | MAE: 52.3 | Oct 21, 2025
   - AAPL | 2018-2024 | Fitting | - | Nov 1, 2025 (in progress)
   - Click row to navigate to model fit detail

3. **Admin: Edit Scaffold**
   - Click "Edit" button
   - Form with all fields editable
   - Update hyperparameters, description, formula
   - Upload new training script
   - Submit → API: `PUT /api/admin/model-scaffolds/{scaffoldId}`

---

## Admin Task: Create Model Scaffold (See Admin Pages)

Admin CRUD for scaffolds (create, edit, delete, upload training scripts) is documented in `OPERATIONAL_MAPPING_ADMIN.md` (Task A-5). The Model Scaffolds pages in this file are read-only for end users and focus on discovery and inspection.

---

## Page 3: Model Fits List (`/model-fits`)

### User Role: Authenticated User (view), Admin (create/trigger training)

---

### Task: Browse All Model Fits

**Task Name:** Browse the full list of trained models  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **API Request**
   ```
   GET /api/model-fits?status=all&limit=100
   ```

2. **DynamoDB Table: ModelFits**
   - **Primary Key:** `modelFitId` (String)
   - **Attributes:**
     - `modelFitId` (PK): UUID or composite (e.g., "lstm-3layer-djia-2015-2025")
     - `scaffoldId`: Foreign key to ModelScaffolds
     - `assetId`: Asset trained on
     - `dataSliceId`: Data slice used for training
     - `status`: 'unfit' | 'fitting' | 'fit' | 'failed'
     - `modelUrl`: S3 path to model files (null if unfit)
     - `modelSize`: File size in bytes
     - `trainingMetrics`: JSON (loss, accuracy, etc.)
     - `hyperparametersUsed`: JSON (actual values used)
     - `trainingJobId`: ECS task ARN (if using ECS)
     - `trainingStarted`: ISO timestamp
     - `trainingCompleted`: ISO timestamp
     - `createdBy`: User ID
     - `createdAt`: ISO timestamp
     - `updatedAt`: ISO timestamp
   - **GSI-1:** `scaffoldId-index`
   - **GSI-2:** `assetId-status-index` (Composite sort key)

3. **Sample Record**
   ```json
   {
     "modelFitId": "lstm-3layer-djia-2015-2025-001",
     "scaffoldId": "LSTM-3LAYER-128-64-32",
     "assetId": "DJIA",
     "dataSliceId": "DJIA_2015-01-01_2024-12-31",
     "status": "fit",
     "modelUrl": "s3://chasing-prophets/models/lstm-3layer-djia-2015-2025-001/model.json",
     "modelSize": 4567890,
     "trainingMetrics": {
       "finalLoss": 0.0023,
       "validationLoss": 0.0031,
       "mae": 45.2,
       "rmse": 58.7,
       "r2": 0.89,
       "epochs": 87,
       "earlyStoppedAt": 87
     },
     "hyperparametersUsed": {
       "lookbackDays": 30,
       "lstm1Units": 128,
       "lstm2Units": 64,
       "lstm3Units": 32,
       "dropoutRate": 0.2,
       "epochs": 100,
       "batchSize": 32,
       "learningRate": 0.001
     },
     "trainingJobId": "arn:aws:ecs:us-east-1:123456789:task/training-cluster/abc123",
     "trainingStarted": "2025-10-20T10:00:00Z",
     "trainingCompleted": "2025-10-20T12:35:00Z",
     "createdBy": "admin@chasingprophets.local",
     "createdAt": "2025-10-20T09:55:00Z",
     "updatedAt": "2025-10-20T12:35:15Z"
   }
   ```

4. **UI Rendering**
   - **Table View:**
     - Columns: Model Name, Asset, Scaffold, Status, Performance (MAE), Size, Training Time, Created
     - Status badges:
       - Unfit: Gray
       - Fitting: Blue with spinner
       - Fit: Green
       - Failed: Red
     - Click row to view detail

   - **Filters:**
     - Status dropdown (All, Unfit, Fitting, Fit, Failed)
     - Asset dropdown
     - Scaffold dropdown
     - Date range (created)

   - **Admin Actions:**
     - "Create Model Fit" button
     - Bulk actions: Delete, Retrain

5. **Real-Time Status Updates (Future)**
   - WebSocket connection or polling
   - Status changes from "fitting" to "fit" update live
   - Progress bar for training (if ECS provides progress)

---

## Page 4: Model Fit Detail (`/model-fits/:modelFitId`)

### User Role: Authenticated User (view), Admin (manage)

---

### Task: View Model Fit Details and Training Results

**Task Name:** View detailed information about a trained model  
**Status:** ❌ Not Implemented (Planned)

#### Operational Flow (Planned)

1. **API Requests**
   - **Request 1:** `GET /api/model-fits/{modelFitId}`
   - **Request 2:** `GET /api/model-fits/{modelFitId}/prophets` - Prophets using this fit

2. **UI Sections**

   **Header:**
   - Model Fit ID
   - Asset link
   - Scaffold link
   - Status badge
   - Created by, created date

   **Training Configuration:**
   - **Data Slice:** Link to slice detail
   - **Date Range:** 2015-01-01 to 2024-12-31 (2,520 days)
   - **Training/Validation Split:** 80/20
   - **Hyperparameters Used:** Table or JSON viewer

   **Training Results (if status = fit):**
   - **Training Duration:** 2 hours 35 minutes
   - **Final Training Loss:** 0.0023
   - **Validation Loss:** 0.0031
   - **Validation Metrics:**
     - MAE: 45.2 points
     - RMSE: 58.7 points
     - R²: 0.89
     - Directional Accuracy: 74%
   
   - **Training Curves Chart:**
     - X-axis: Epoch (1-87)
     - Y-axis: Loss
     - Series 1: Training loss (blue line)
     - Series 2: Validation loss (orange line)
     - Shows convergence and early stopping point

   **Model Files:**
   - **Model Size:** 4.35 MB
   - **File Location:** S3 path (masked)
   - **Download Model:** Button (generates presigned URL)
   - **TensorFlow.js Files:**
     - model.json
     - group1-shard1of1.bin

   **Prophets Using This Model:**
   - Table: Prophet Name | Asset | Active | Performance
   - TimeSage AI - DJIA | DJIA | Active | 72% accuracy
   - Click to navigate to prophet detail

   **Admin Actions:**
   - **Retrain:** Trigger new training job with same configuration
   - **Create Prophet:** Use this fit to create new prophet
   - **Delete:** Remove model fit (confirm modal)
   - **Download Logs:** Training job logs from CloudWatch

3. **Training Status (if status = fitting):**
   - **Progress:** 45% complete (if available)
   - **Current Epoch:** 45/100
   - **Elapsed Time:** 1 hour 15 minutes
   - **Estimated Remaining:** 1 hour 20 minutes
   - **Live Logs:** Streaming output from ECS task
   - **Cancel Training:** Button (stops ECS task)

4. **Failed Status (if status = failed):**
   - **Error Message:** Display error from training job
   - **Logs:** CloudWatch logs link
   - **Retry Button:** Attempt training again
   - **Edit Configuration:** Adjust hyperparameters and retry

---

## Admin Task: Create Model Fit (See Admin Pages)

Training orchestration (creating a model fit, triggering ECS jobs, monitoring status) is centralized in `OPERATIONAL_MAPPING_ADMIN.md` (Task A-6). This document's Model Fits pages focus on browsing and viewing results as an end user.

---

## Infrastructure Components (Planned)

| Component | Role | Status |
|-----------|------|--------|
| **ModelScaffolds Component** | List page | ❌ To be created |
| **ScaffoldDetail Component** | Detail page | ❌ To be created |
| **ModelFits Component** | List page | ❌ To be created |
| **ModelFitDetail Component** | Detail page | ❌ To be created |
| **CreateModelFit Component** | Admin form | ❌ To be created |
| **API Gateway** | `/api/model-scaffolds/*`, `/api/model-fits/*` | ❌ To be created |
| **Lambda: Scaffold CRUD** | List, get, create, update | ❌ To be created |
| **Lambda: ModelFit CRUD** | List, get, create | ❌ To be created |
| **Lambda: triggerTraining** | Start ECS task | ❌ To be created |
| **ECS Fargate** | Training jobs | ❌ To be created |
| **Docker Image** | Training container (Python + TensorFlow) | ❌ To be created |
| **DynamoDB: ModelScaffolds** | Scaffold metadata | ❌ To be created |
| **DynamoDB: ModelFits** | Fit metadata | ❌ To be created |
| **S3: scripts/scaffolds/** | Training code | ❌ To be created |
| **S3: models/** | Trained model files | ❌ To be created |
| **CloudWatch Logs** | Training job logs | ✅ Available (AWS service) |

---

## End of Model Scaffolds and Fits Operational Mapping
