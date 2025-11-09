# Resources & Locations (Alpha)

Date: 2025-11-06
Status: Updated for contract-based scaffold system

## AWS Account resources (dev)
- Region: ${AWS_REGION} (default us-east-1 unless overridden)
- S3
  - Bucket: chasingprophets-models-{region} (currently: chasingprophets-models-us-east-1)
  - Folders (prefixes):
    - `data/assets/{TICKER}/ohlcv_full.csv` - Raw OHLCV data (e.g., ^DJI, ^GSPC)
    - `slices/{dataSliceId}.csv` - Optional derived data slices
    - `models/{modelFitId}/parameters.json` - Trained model parameters (e.g., regression coefficients)
    - `scripts/scaffolds/{scaffoldId}/train.py` - Training scripts (Python)
    - `scripts/scaffolds/{scaffoldId}/inference.py` - Remote inference scripts (Python, runs on Lambda)
    - `scripts/scaffolds/{scaffoldId}/inference.js` - Local inference scripts (JavaScript, runs in browser)
- DynamoDB (on-demand)
  - ChasingProphets-Assets (PK: assetId)
  - ChasingProphets-AssetPrices (PK: assetId, SK: date)
  - ChasingProphets-Datasets (PK: datasetId, GSI: assetId)
  - ChasingProphets-DataSlices (PK: dataSliceId)
  - ChasingProphets-ModelScaffolds (PK: scaffoldId)
  - ChasingProphets-ModelFits (PK: modelFitId)
  - ChasingProphets-Prophets (PK: prophetId)
  - ChasingProphets-Forecasts (PK: forecastId, SK: startDate; attrs: prophetId, assetId, horizon, predictions JSON, status)
  - ChasingProphets-Performance (PK: prophetId, SK: date)
  - ChasingProphets-ProphetPerformanceSummary (PK: prophetId, SK: aggregationWindow)
- Cognito
  - User Pool: ChasingProphetsUsers
  - App Client: ChasingProphetsWeb (no secret)
  - Groups: admin, user, guest
- IAM
  - Role: ChProphets-Lambda-Role (assumed by lambda.amazonaws.com)
  - Role: ChProphets-AmplifyServiceRole (assumed by amplify.amazonaws.com)
  - Policies attached by script (see IAM bootstrap doc)
- EventBridge (planned)
  - Rule: chp-daily-0600-et → target Lambda(s)
  - Lambda resource policies per target allowing events.amazonaws.com invoke with SourceArn = rule ARN
- API Gateway (planned)
  - chp-api (REST) with Cognito authorizer
- Lambda (planned)
  - chp-api-* handlers, chp-data-pipeline, chp-prophet-updater

## Codebase mapping
- Frontend: src/* (React + TS)
- Seed data scripts: scripts/*
- AWS setup scripts: scripts/aws-setup.sh, scripts/setup-cognito.sh, scripts/aws/* (new)
- Data ingestion scripts: scripts/data/* (new)

## Identifiers & naming
- All table names prefixed with ChasingProphets-
- One S3 bucket per environment; path prefixes carry structure
- IAM roles prefixed with ChProphets-

Keep this list as the source of truth when validating deployments or debugging permissions.

### 3.1. DynamoDB Tables

- **`ChasingProphets-Assets`**
  - PK: `assetId` (String) - e.g., "DJIA", "SPX"
  - Attributes: `ticker`, `name`, `description`, `type` (e.g., "index")

- **`ChasingProphets-AssetPrices`**
  - PK: `assetId` (String)
  - SK: `date` (String, YYYY-MM-DD)
  - Attributes: `open`, `high`, `low`, `close`, `volume`

- **`ChasingProphets-Datasets`**
  - **Purpose**: Metadata layer connecting an Asset to its data collection.
  - PK: `datasetId` (String)
  - Attributes: `assetId`, `name`, `description`, `source` (e.g., "ChasingProphets-AssetPrices")

- **`ChasingProphets-DataSlices`**
  - **Purpose**: Defines a specific subset of a Dataset with analyzed schema for contract validation
  - **Slice Types**: 
    - **Simple**: Single contiguous time period
    - **Compound**: Union of multiple simple slices (e.g., train+validation sets)
  - PK: `dataSliceId` (String)
  - Attributes: 
    - `datasetId` (String) - Foreign key
    - `name` (String) - Display name
    - `startDate` (String, YYYY-MM-DD) - Start of date range (earliest for compound)
    - `endDate` (String, YYYY-MM-DD) - End of date range (latest for compound)
    - `sliceType` (String) - 'simple' | 'compound'
    - `baseSliceIds` (List<String>) - Only for compound: list of simple slice IDs
    - `availableColumns` (List<String>) - e.g., ["date", "open", "high", "low", "close", "volume"]
    - `columnTypes` (Map) - e.g., {close: "numerical", date: "datetime", ...}
    - `columnRanges` (Map) - e.g., {close: {min: 100.5, max: 450.2}, volume: {min: 0, max: 1e9}}
    - `recordCount` (Number)
    - `s3Path` (String) - Optional
    - `createdAt`, `lastUpdated`

- **`ChasingProphets-ModelScaffolds`**
  - **Purpose**: Contract-based blueprint for predictive models with executable scripts
  - PK: `scaffoldId` (String) - e.g., "SLR-LAG-1-OHLCV"
  - Attributes: 
    - `name` (String) - Display name
    - `description` (String) - Long description
    - `modelType` (String) - 'ML' | 'DL' | 'TS' | 'statistical'
    - `isContextualized` (Boolean) - true if uses specific variable names (e.g., "close_lag_1"), false if generic (e.g., "x", "y")
    - `inputContract` (List<Map>) - Array of {name, type, required, minValue, maxValue, allowedValues, description}
    - `outputContract` (List<Map>) - Same structure as inputContract
    - `inferenceMode` (String) - 'local' | 'remote' | 'hybrid'
    - `s3TrainingScriptPath` (String) - Required: scripts/scaffolds/{scaffoldId}/train.py
    - `s3RemoteInferenceScriptPath` (String) - Required: scripts/scaffolds/{scaffoldId}/inference.py
    - `s3LocalInferenceScriptPath` (String) - Optional: scripts/scaffolds/{scaffoldId}/inference.js
    - `formulaLatex` (String) - Optional LaTeX formula
    - `createdAt`, `lastUpdated`, `createdBy`

- **`ChasingProphets-ModelFits`**
  - **Purpose**: Trained instance of a scaffold on a contract-validated slice
  - PK: `modelFitId` (String)
  - GSI-1: `scaffoldId` (find all fits for a scaffold)
  - GSI-2: `assetId` (find all fits for an asset)
  - Attributes: 
    - `scaffoldId`, `assetId`, `dataSliceId` (Foreign keys)
    - `modelUrl` (String) - Base S3 path: models/{modelFitId}/
    - `modelParametersPath` (String) - S3 path to parameters.json
    - `s3RemoteInferenceScriptPath` (String) - Copied from scaffold at fit creation
    - `s3LocalInferenceScriptPath` (String) - Copied from scaffold (if exists)
    - `trainingMetrics` (Map) - {mape, rmse, r2, ...}
    - `trainingStatus` (String) - 'unfit' | 'fitting' | 'fit' | 'failed'
    - `createdAt`, `lastUpdated`

- **`ChasingProphets-Prophets`**
  - **Purpose**: Deployable prediction engine using a model fit
  - PK: `prophetId` (String)
  - GSI-1: `assetId` (find all prophets for an asset)
  - GSI-2: `isActive` (find all active prophets)
  - Attributes: 
    - `name` (String)
    - `assetId` (String)
    - `modelFitIds` (List<String>) - Single fit in alpha; array supports future ensembling
    - `forecastMethod` (String)
    - `outputMeasure` (String) - e.g., "close_price"
    - `isActive` (String) - "true" | "false" (string for DynamoDB GSI compatibility)
    - `description` (String)
    - `createdAt`, `lastUpdated`

- **`ChasingProphets-Forecasts`**
  - PK: `forecastId` (String)
  - SK: `startDate` (String)
  - Attributes: `prophetId`, `assetId`, `horizon`, `predictions`

- **`ChasingProphets-Performance`**
  - Stores *daily* raw data for performance calculations.
  - PK: `prophetId` (String)
  - SK: `date` (String)
  - Attributes: `predicted`, `actual`, `error`

- **`ChasingProphets-ProphetPerformanceSummary`**
  - **Purpose**: Stores aggregated rolling-window metrics for leaderboard ranking
  - PK: `prophetId` (String)
  - SK: `aggregationWindow` (String) - e.g., "20d", "40d", "60d", "120d", "240d", "480d", "1080d", "1200d"
  - Attributes: 
    - `mape` (Number) - Mean Absolute Percentage Error
    - `rmse` (Number) - Root Mean Squared Error
    - `percentileError75` (Number) - 75th percentile of absolute error
    - `percentileError90` (Number) - 90th percentile of absolute error
    - `directionalAccuracy` (Number) - Percentage of correct direction predictions
    - `lastUpdated` (String) - ISO timestamp

- **`ChasingProphets-Users`**
  - Standard user table (managed by Cognito)

- **`ChasingProphets-Notifications`**
  - Standard notifications table