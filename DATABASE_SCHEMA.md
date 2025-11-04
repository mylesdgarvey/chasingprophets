# Chasing Prophets - DynamoDB Schema Design

**Version:** 1.0  
**Date:** November 4, 2025  
**Status:** Initial Design

---

## Table Overview

The system uses **8 DynamoDB tables** with multiple tables approach for clear separation of concerns:

1. **Users** - User accounts and authentication
2. **Assets** - Financial instruments (stocks, indices)
3. **Datasets** - OHLCV data collections per asset
4. **DataSlices** - Fixed time-window slices for training
5. **ModelScaffolds** - Reusable model architectures
6. **ModelFits** - Trained models (scaffold + data + weights)
7. **Prophets** - Deployed prediction engines
8. **Messages** - System notifications and alerts
9. **ManagedProphets** (future) - User-managed prophet instances
10. **ManagedModelFits** (future) - User-managed model fits

---

## Table 1: Users

**Purpose:** Store user profiles, authentication metadata, and preferences.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **userId** (PK) | String | Cognito sub UUID |
| passwordHash | String | Hashed password (handled by Cognito) |
| role | String | `admin`, `user`, `guest` |
| firstName | String | User's first name |
| lastName | String | User's last name |
| username | String | Display username |
| email | String | Email address |
| theme | String | UI theme preference |
| themePrefs | Map | Additional theme customizations (JSON) |
| logFile | String | S3 path to user activity logs |
| createdAt | String | ISO 8601 timestamp |
| lastLogin | String | ISO 8601 timestamp |

### GSI-1: email-index
- **PK:** email
- **Purpose:** Look up user by email address

### Example Data

```json
{
  "userId": "0000-01",
  "passwordHash": "****",
  "role": "user",
  "firstName": "Mike",
  "lastName": "Saturn",
  "username": "msaturn",
  "email": "msaturn@email.com",
  "theme": "night-blue",
  "themePrefs": {},
  "logFile": "s3://chasing-prophets/logs/users/0000-01-20250104.txt",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLogin": "2025-11-04T14:30:00Z"
}
```

```json
{
  "userId": "0000-02",
  "role": "admin",
  "firstName": "Myles",
  "lastName": "Garvey",
  "username": "mgarvey",
  "email": "mgarvey@chasingprophets.com",
  "theme": "cyber-purple",
  "createdAt": "2024-12-01T00:00:00Z",
  "lastLogin": "2025-11-04T15:00:00Z"
}
```

---

## Table 2: Assets

**Purpose:** Track financial instruments that can be analyzed and predicted.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **assetId** (PK) | String | Unique identifier (ticker or custom ID) |
| name | String | Full asset name |
| ticker | String | Stock ticker symbol |
| description | String | Brief description |
| logo | String | S3 path or URL to logo image |
| type | String | `index`, `stock`, `etf`, `crypto`, etc. |
| sector | String | Industry sector |
| exchange | String | Exchange where traded |
| isActive | Boolean | Whether asset is currently tracked |
| startedTracking | String | ISO 8601 date when tracking began |
| lastPrice | Number | Most recent closing price |
| priceChange | Number | Change from previous close |
| priceChangePercent | Number | Percentage change |

### Example Data

```json
{
  "assetId": "SPX",
  "name": "S&P 500",
  "ticker": "SPX",
  "description": "The S&P 500 is a stock market index...",
  "logo": "s3://chasing-prophets/static/logos/spx.png",
  "type": "index",
  "sector": null,
  "exchange": "NYSE",
  "isActive": true,
  "startedTracking": "1900-01-01",
  "lastPrice": 4783.45,
  "priceChange": 23.12,
  "priceChangePercent": 0.49
}
```

```json
{
  "assetId": "DJIA",
  "name": "Dow Jones Industrial Average",
  "ticker": "DJIA",
  "description": "The Dow Jones DJIA...",
  "logo": "s3://chasing-prophets/static/logos/djia.png",
  "type": "index",
  "sector": null,
  "exchange": "NYSE",
  "isActive": true,
  "startedTracking": "1896-05-26",
  "lastPrice": 35891.23,
  "priceChange": -102.45,
  "priceChangePercent": -0.28
}
```

---

## Table 3: Datasets

**Purpose:** Catalog of OHLCV data collections for each asset.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **datasetId** (PK) | String | Unique dataset identifier |
| assetId | String | Reference to Assets table |
| name | String | Human-readable dataset name |
| type | String | `OHLCV`, `fundamentals`, `sentiment`, etc. |
| CEE | List | Column names (Open, High, Low, Close, Volume, etc.) |
| folder | String | S3 folder path |
| startDate | String | ISO 8601 date of earliest data |
| endDate | String | ISO 8601 date of latest data (null for live) |
| numRecords | Number | Total number of data points |
| isLive | Boolean | Whether dataset is actively updated |
| dataSliceId | String | Reference to canonical slice (if applicable) |

### GSI-1: assetId-index
- **PK:** assetId
- **Purpose:** Query all datasets for a specific asset

### Example Data

```json
{
  "datasetId": "01",
  "assetId": "SPX",
  "name": "SPX Daily OHLCV",
  "type": "OHLCV",
  "CEE": ["date", "open", "high", "low", "close", "volume"],
  "folder": "s3://chasing-prophets/data/assets/SPX/",
  "startDate": "1900-01-01",
  "endDate": null,
  "numRecords": 32145,
  "isLive": true,
  "dataSliceId": null
}
```

```json
{
  "datasetId": "02",
  "assetId": "DJIA",
  "name": "DJIA Daily Panel",
  "type": "OHLCV",
  "CEE": ["date", "open", "high", "low", "close", "volume"],
  "folder": "s3://chasing-prophets/data/assets/DJIA/",
  "startDate": "1896-05-26",
  "endDate": null,
  "numRecords": 35890,
  "isLive": true,
  "dataSliceId": null
}
```

---

## Table 4: DataSlices

**Purpose:** Fixed, immutable slices of datasets used for training and evaluation.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **sliceId** (PK) | String | Unique slice identifier |
| datasetId | String | Parent dataset reference |
| startDate | String | ISO 8601 start date (inclusive) |
| endDate | String | ISO 8601 end date (inclusive) |
| numRecords | Number | Number of data points in slice |
| sliceType | String | `simple` or `compound` |
| dataSliceIds | List | For compound slices: list of child slice IDs |

### GSI-1: datasetId-index
- **PK:** datasetId
- **Purpose:** Query all slices from a dataset

### Example Data

```json
{
  "sliceId": "S1",
  "datasetId": "01",
  "startDate": "2024-01-01",
  "endDate": "2024-11-01",
  "numRecords": 215,
  "sliceType": "simple",
  "dataSliceIds": null
}
```

```json
{
  "sliceId": "S2",
  "datasetId": "02",
  "startDate": "2024-01-01",
  "endDate": "2024-11-01",
  "numRecords": 215,
  "sliceType": "simple",
  "dataSliceIds": null
}
```

```json
{
  "sliceId": "C1",
  "datasetId": "01",
  "startDate": "2023-01-01",
  "endDate": "2024-12-31",
  "numRecords": 504,
  "sliceType": "compound",
  "dataSliceIds": ["S1", "S3", "S5"]
}
```

---

## Table 5: ModelScaffolds

**Purpose:** Reusable model architecture templates with training code.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **scaffoldId** (PK) | String | Unique scaffold identifier (e.g., "SLR-LAG-1") |
| name | String | Human-readable scaffold name |
| listName | String | Short display name for lists |
| type | String | Model category: `ML`, `DL`, `TS`, `ECON`, etc. |
| inputs | List | List of required input features |
| outputs | List | List of output predictions |
| hyperparameters | Map | Default hyperparameters (JSON) |
| description | String | Detailed model description (HTML/Markdown) |
| learningAlgorithm | String | Training algorithm (OLS, Adam, MLE, etc.) |
| purpose | String | What the model predicts |
| trainingApproach | String | How training is executed |

### Example Data

```json
{
  "scaffoldId": "01",
  "name": "SLR-LAG-1",
  "listName": "Simple Linear Regression (Lag 1)",
  "type": "ML",
  "inputs": ["laggedValue"],
  "outputs": ["predictedValue"],
  "hyperparameters": {
    "learningRate": 0.01,
    "epochs": 100
  },
  "description": "<h3>Simple Linear Regression</h3><p>Uses previous day's value to predict next day...</p>",
  "learningAlgorithm": "OLS",
  "purpose": "Predict next-day price from previous price",
  "trainingApproach": "Least squares fitting"
}
```

```json
{
  "scaffoldId": "02",
  "name": "GARCH-1-1",
  "listName": "GARCH(1,1) Volatility",
  "type": "TS",
  "inputs": ["returns"],
  "outputs": ["volatility"],
  "hyperparameters": {
    "p": 1,
    "q": 1
  },
  "description": "<h3>GARCH(1,1)</h3><p>Generalized Autoregressive Conditional Heteroskedasticity...</p>",
  "learningAlgorithm": "MLE",
  "purpose": "Model time-varying volatility",
  "trainingApproach": "Maximum likelihood estimation"
}
```

---

## Table 6: ModelFits

**Purpose:** Trained models with weights, metadata, and performance metrics.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **modelFitId** (PK) | String | Unique model fit identifier |
| name | String | Human-readable fit name |
| trainingSlices | List | List of dataSliceIds used for training |
| inputs | List | Actual input feature names used |
| dataSliceId | String | Primary training slice reference |
| trainingDate | String | ISO 8601 timestamp of training completion |
| modelSize | Number | Size in bytes |
| type | String | Storage format: `KERAS`, `TFJS`, `COEFFICIENTS`, etc. |
| fileLocation | String | S3 path to model files |
| modelObj | Map | For simple models: coefficients stored inline (JSON) |
| trainingStatus | String | `unfit`, `fitting`, `fit`, `failed` |
| scaffoldId | String | Reference to ModelScaffolds |
| assetId | String | Asset this model was trained on |

### GSI-1: scaffoldId-index
- **PK:** scaffoldId
- **Purpose:** Find all fits for a specific scaffold

### GSI-2: assetId-trainingStatus-index
- **PK:** assetId
- **SK:** trainingStatus
- **Purpose:** Find all "fit" models for an asset

### Example Data

```json
{
  "modelFitId": "03",
  "name": "SLR-NonMasked-Lag1",
  "trainingSlices": ["S1"],
  "inputs": ["close_lag1"],
  "dataSliceId": "S1",
  "trainingDate": "2024-11-02T10:30:00Z",
  "modelSize": 4096,
  "type": "KERAS",
  "fileLocation": "s3://chasing-prophets/models/03/model.h5",
  "modelObj": null,
  "trainingStatus": "fit",
  "scaffoldId": "01",
  "assetId": "SPX"
}
```

```json
{
  "modelFitId": "04",
  "name": "SLR-NonMasked-Lag1",
  "trainingSlices": ["S2"],
  "inputs": ["close_lag1"],
  "dataSliceId": "S2",
  "trainingDate": "2024-11-02T11:00:00Z",
  "modelSize": 3872,
  "type": "COEFFICIENTS",
  "fileLocation": "s3://chasing-prophets/models/coefficients/04.json",
  "modelObj": {
    "intercept": 100.5,
    "slope": 0.98
  },
  "trainingStatus": "fit",
  "scaffoldId": "01",
  "assetId": "DJIA"
}
```

---

## Table 7: Prophets

**Purpose:** Deployed prediction engines that users interact with.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **prophetId** (PK) | String | Unique prophet identifier |
| name | String | Prophet display name (auto-generated or custom) |
| assetName | String | Asset name for display |
| datasets | List | Dataset IDs the prophet uses |
| trainingSlices | List | Training slice IDs |
| modelFits | List | Model fit IDs used by this prophet |
| outputMeasure | String | What the prophet predicts (e.g., "close_price") |
| forecastMethod | String | `direct`, `iterative`, `multi-step`, etc. |
| logFile | String | S3 path to prophet activity logs |
| trainingCode | String | S3 path to custom training code (if any) |
| inferenceCode | String | S3 path to custom inference code (if any) |
| OHLCV_inference | String | S3 path to inference results cache |
| trainStatus | String | `trained`, `training`, `failed` |
| managedStatus | String | `managed` (system) or `user-managed` |
| isActive | Boolean | Whether prophet is currently active |
| createdBy | String | userId of creator |
| createdAt | String | ISO 8601 timestamp |

### GSI-1: assetName-index
- **PK:** assetName
- **Purpose:** Find all prophets for a specific asset

### GSI-2: modelFits-index (if querying by model fit)
- **PK:** modelFits (multi-valued)
- **Purpose:** Find prophets using a specific model fit

### Example Data

```json
{
  "prophetId": "P1",
  "name": "TimeSage AI - SPX",
  "assetName": "SPX",
  "datasets": ["01"],
  "trainingSlices": ["S1"],
  "modelFits": ["03"],
  "outputMeasure": "close_price",
  "forecastMethod": "direct",
  "logFile": "s3://chasing-prophets/logs/prophets/P1.log",
  "trainingCode": "s3://chasing-prophets/scripts/prophets/P1-train.py",
  "inferenceCode": "s3://chasing-prophets/scripts/prophets/P1-infer.py",
  "OHLCV_inference": "s3://chasing-prophets/data/predictions/P1-predictions.csv",
  "trainStatus": "trained",
  "managedStatus": "managed",
  "isActive": true,
  "createdBy": "0000-02",
  "createdAt": "2024-10-15T00:00:00Z"
}
```

---

## Table 8: Messages

**Purpose:** System notifications and user alerts.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **messageId** (PK) | String | Unique message identifier |
| type | String | `info`, `warning`, `error`, `notification` |
| text | String | Message content |
| userId | String | Recipient user ID |
| isRead | Boolean | Whether user has read the message |
| createdAt | String | ISO 8601 timestamp |

### GSI-1: userId-isRead-index
- **PK:** userId
- **SK:** isRead
- **Purpose:** Query unread messages for a user

### Example Data

```json
{
  "messageId": "M1",
  "type": "notification",
  "text": "New model fit completed for Prophet TimeSage AI",
  "userId": "0000-01",
  "isRead": false,
  "createdAt": "2025-11-04T14:45:00Z"
}
```

---

## Table 9: ManagedPerformance (Prophet Performance Metrics)

**Purpose:** Daily performance tracking for each prophet's predictions.

### Schema

| Attribute | Type | Description |
|-----------|------|-------------|
| **prophetId** (PK) | String | Prophet identifier |
| **date** (SK) | String | ISO 8601 date (YYYY-MM-DD) |
| resType | String | Result type: `Model-Fit`, `MAPE`, `Close-Return`, etc. |
| resName | String | Specific metric name |
| resMeasure | Map | Metric measurements (JSON) |
| resValue_perPeriod_date | Map | Per-period values keyed by date |
| perSerial | Map | Time-series data |
| days | Number | Number of days in evaluation period |
| startDate | String | Evaluation start date |
| endDate | String | Evaluation end date |

### Example Data

```json
{
  "prophetId": "P1",
  "date": "2025-11-04",
  "resType": "Model-Fit",
  "resName": "MAPE",
  "resMeasure": {
    "value": 2.5,
    "unit": "percent"
  },
  "resValue_perPeriod_date": {
    "2025-11-01": 2.3,
    "2025-11-02": 2.4,
    "2025-11-03": 2.6,
    "2025-11-04": 2.5
  },
  "perSerial": {
    "predicted": [100.5, 101.2, 102.0, 101.8],
    "actual": [100.8, 101.0, 102.3, 101.5]
  },
  "days": 30,
  "startDate": "2025-10-05",
  "endDate": "2025-11-04"
}
```

---

## Data Relationships

```
Users
  └── created → Prophets (1:many)
  └── receives → Messages (1:many)

Assets
  └── has → Datasets (1:many)
  └── tracked by → Prophets (1:many)

Datasets
  └── belongs to → Assets (many:1)
  └── sliced into → DataSlices (1:many)

DataSlices
  └── derived from → Datasets (many:1)
  └── used by → ModelFits (many:many)
  └── composed of → DataSlices (compound slices) (many:many)

ModelScaffolds
  └── instantiated as → ModelFits (1:many)

ModelFits
  └── based on → ModelScaffolds (many:1)
  └── trained on → DataSlices (many:many)
  └── used by → Prophets (many:many)

Prophets
  └── uses → ModelFits (many:many)
  └── predicts → Assets (many:1)
  └── tracked by → ManagedPerformance (1:many)
  └── created by → Users (many:1)

ManagedPerformance
  └── belongs to → Prophets (many:1)
```

---

## Access Patterns & Queries

### Common Query Patterns

| Use Case | Table | Query Type | Keys/Filters |
|----------|-------|------------|--------------|
| Get user by email | Users | GSI Query | GSI-1: email |
| Get all assets | Assets | Scan | (filter by isActive) |
| Get datasets for asset | Datasets | GSI Query | GSI-1: assetId |
| Get slices for dataset | DataSlices | GSI Query | GSI-1: datasetId |
| Get all model scaffolds | ModelScaffolds | Scan | (filter by type) |
| Get fits for scaffold | ModelFits | GSI Query | GSI-1: scaffoldId |
| Get fit models for asset | ModelFits | GSI Query | GSI-2: assetId + status="fit" |
| Get prophets for asset | Prophets | GSI Query | GSI-1: assetName |
| Get prophet performance | ManagedPerformance | Query | PK: prophetId, SK: date range |
| Get unread messages for user | Messages | GSI Query | GSI-1: userId + isRead=false |

### Example Query Code

```typescript
// Get all datasets for SPX
const params = {
  TableName: 'Datasets',
  IndexName: 'assetId-index',
  KeyConditionExpression: 'assetId = :assetId',
  ExpressionAttributeValues: {
    ':assetId': 'SPX'
  }
};
const result = await dynamodb.query(params).promise();
```

```typescript
// Get prophet performance for last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const params = {
  TableName: 'ManagedPerformance',
  KeyConditionExpression: 'prophetId = :prophetId AND #date >= :startDate',
  ExpressionAttributeNames: {
    '#date': 'date'
  },
  ExpressionAttributeValues: {
    ':prophetId': 'P1',
    ':startDate': thirtyDaysAgo.toISOString().split('T')[0]
  }
};
const result = await dynamodb.query(params).promise();
```

---

## Prophet Bill of Materials (Composition)

Based on your whiteboard sketch, here's how a Prophet is constructed:

```
Prophet {
  prophetId: "P1"
  name: "TimeSage AI - SPX"
  
  // What it predicts
  assetName: "SPX"
  outputMeasure: "close_price"
  forecastMethod: "direct"
  
  // Data it uses
  datasets: ["01"]           // SPX OHLCV Dataset
  trainingSlices: ["S1"]     // 2024-01-01 to 2024-11-01
  
  // Model it runs
  modelFits: ["03"]          // SLR-LAG-1 trained on S1
    └─> scaffoldId: "01"     // Simple Linear Regression
    └─> type: "KERAS"
    └─> fileLocation: "s3://.../models/03/"
  
  // Execution code
  trainingCode: "s3://.../P1-train.py"
  inferenceCode: "s3://.../P1-infer.py"
  
  // Results
  OHLCV_inference: "s3://.../P1-predictions.csv"
  
  // Performance tracking
  ManagedPerformance[] {
    date: "2025-11-04"
    MAPE: 2.5%
    predictions vs actuals
  }
}
```

---

## S3 Integration

Models and data referenced in DynamoDB are stored in S3:

```
s3://chasing-prophets/
├── models/
│   ├── 03/                      # ModelFit 03
│   │   ├── model.json           # TensorFlow.js model
│   │   └── group1-shard1of1.bin
│   └── coefficients/
│       └── 04.json              # Simple coefficient models
├── data/
│   ├── assets/
│   │   ├── SPX/
│   │   │   └── ohlcv_full.csv
│   │   └── DJIA/
│   │       └── ohlcv_full.csv
│   └── predictions/
│       └── P1-predictions.csv   # Prophet inference cache
├── scripts/
│   └── prophets/
│       ├── P1-train.py
│       └── P1-infer.py
└── logs/
    ├── users/
    │   └── 0000-01-20250104.txt
    └── prophets/
        └── P1.log
```

---

## Future Enhancements

### ManagedProphets Table (User-Created Prophets)
- Users can clone and customize prophets
- Track user-specific prophet instances
- Performance comparisons between managed and user prophets

### ManagedModelFits Table (User-Created Fits)
- Users can train models on custom data slices
- Sandbox environment for experimentation
- Quota limits for compute usage

### Forecasts Table (Future Feature)
- Multi-prophet ensemble forecasts
- User-constructed prediction chains
- Backtest results and validation

---

## Summary

Your database design follows a **clear hierarchy**:

```
Assets → Datasets → DataSlices → ModelScaffolds → ModelFits → Prophets → Performance
```

**Key Design Principles:**
1. ✅ **Separation of data and models**: Datasets and slices are independent of models
2. ✅ **Reusable scaffolds**: One scaffold can generate many fits
3. ✅ **Flexible prophets**: Can use multiple model fits, custom code
4. ✅ **Performance tracking**: Daily metrics stored separately for scalability
5. ✅ **S3 integration**: Large objects (models, data) stored in S3, metadata in DynamoDB
6. ✅ **User management**: Clear user roles and preferences
7. ✅ **Notifications**: Message system for alerts and updates

This schema supports your vision for a scalable, extensible prediction platform! 🚀

