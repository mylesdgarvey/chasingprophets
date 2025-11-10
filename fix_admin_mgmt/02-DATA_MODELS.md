# Data Models - TypeScript Interface Definitions

**Purpose:** Document all entity TypeScript interfaces and their relationships

---

## 1️⃣ ASSET (`src/types/assets.ts`)

### Core Interface
```typescript
type AssetMeta = {
  ticker: string;         // Primary Key (e.g., "DJIA", "AAPL")
  name: string;          // Display name (e.g., "Dow Jones Industrial Average")
  market?: string;       // Market/exchange (e.g., "US", "NYSE")
  lastPrice?: number | null;  // Latest price
  priceChange?: number;  // Daily change
}
```

### ❌ Missing: CreateAssetInput
**NEEDS TO BE CREATED:**
```typescript
interface CreateAssetInput {
  ticker: string;       // Required
  name: string;         // Required
  market?: string;      // Optional
  type?: string;        // Optional: "stock", "index", "crypto"
  sector?: string;      // Optional: "technology", "healthcare"
  currency?: string;    // Optional: "USD", "EUR"
}
```

### Database Table
- **Table:** `ChasingProphets-Assets`
- **Partition Key:** `ticker`
- **GSI:** `MarketIndex` on `market`

---

## 2️⃣ DATASET (`src/types/dataset.ts`)

### Core Interface
```typescript
interface Dataset {
  datasetId: string;      // Primary Key (e.g., "djia-historical-2020-2024")
  assetId: string;        // Foreign Key to Asset (ticker)
  name: string;           // Display name
  description: string;    // Purpose/notes
  source: string;         // S3 path (e.g., "s3://bucket/djia.csv")
  datasetType?: DatasetType;  // 'timeseries' | 'table' | 'text' | 'image'
  recordCount?: number;   // Number of rows
  dateRange?: {
    start: string;        // YYYY-MM-DD
    end: string;          // YYYY-MM-DD
  };
  createdAt: string;      // ISO timestamp
  lastUpdated: string;    // ISO timestamp
}

type DatasetType = 'table' | 'text' | 'timeseries' | 'image';
```

### Create Input ✅
```typescript
interface CreateDatasetInput {
  datasetId: string;
  assetId: string;
  name: string;
  description: string;
  source: string;        // S3 path
  recordCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

### Database Table
- **Table:** `ChasingProphets-Datasets`
- **Partition Key:** `datasetId`
- **GSI:** `AssetIndex` on `assetId`

### Relationships
- **Parent:** 1 Asset → Many Datasets
- **Child:** 1 Dataset → Many DataSlices

---

## 3️⃣ DATA SLICE (`src/types/dataSlice.ts`)

### Core Interface
```typescript
interface DataSlice {
  dataSliceId: string;    // Primary Key (e.g., "djia-2020-2022-train")
  datasetId?: string;     // Foreign Key to Dataset (NEW SCHEMA)
  assetId?: string;       // Foreign Key to Asset (LEGACY SCHEMA)
  
  startDate: string;      // YYYY-MM-DD (inclusive)
  endDate: string;        // YYYY-MM-DD (inclusive)
  description?: string;
  
  // Slice composition
  sliceType?: SliceType;  // 'simple' | 'compound'
  baseSliceIds?: string[];  // For compound: list of simple slice IDs
  
  // Schema for contract validation
  availableColumns?: string[];  // ["date", "open", "high", "low", "close"]
  columnTypes?: Record<string, FieldType>;  // { "close": "numerical", "date": "datetime" }
  columnRanges?: Record<string, { min: number; max: number }>;  // { "close": { min: 100, max: 500 } }
  
  // Legacy fields
  recordCount?: number;
  windowDays?: number;
  s3Key?: string;
  
  createdAt: string;
}

type SliceType = 'simple' | 'compound';
type FieldType = 'numerical' | 'categorical' | 'datetime' | 'text' | 'boolean';
```

### Create Input ✅
```typescript
interface CreateDataSliceInput {
  dataSliceId: string;
  datasetId: string;      // Required (new schema)
  startDate: string;
  endDate: string;
  description?: string;
  sliceType: SliceType;
  baseSliceIds?: string[];  // Required for compound slices
  availableColumns: string[];
  columnTypes: Record<string, FieldType>;
  columnRanges?: Record<string, { min: number; max: number }>;
}
```

### Database Table
- **Table:** `ChasingProphets-DataSlices`
- **Partition Key:** `dataSliceId`
- **GSI:** `DatasetIndex` on `datasetId`

### Relationships
- **Parent:** 1 Dataset → Many DataSlices
- **Child:** 1 DataSlice + 1 Scaffold → 1 ModelFit

### Schema Migration Issue ⚠️
- **Old schema** used `assetId` (direct link to asset)
- **New schema** uses `datasetId` (link to dataset → asset)
- **Current code** handles both for backwards compatibility

---

## 4️⃣ MODEL SCAFFOLD (`src/types/modelScaffold.ts`)

### Core Interface
```typescript
interface ModelScaffold {
  // Identity
  scaffoldId: string;     // Primary Key (e.g., "linear-regression-v1")
  name: string;           // Display name
  description: string;
  modelType?: 'ML' | 'DL' | 'TS' | 'statistical';
  
  // Classification
  scaffoldType: ScaffoldType;  // 'context-free' | 'context-dependent'
  modelMajorCategory?: string;  // 'econometrics', 'deep_learning'
  modelCategory?: string;       // 'multiple_linear_regression'
  learningAlgorithm: LearningAlgorithm;  // 'MLE', 'OLS', 'adam', 'sgd'
  
  // Contract specification (defines input/output schema)
  isContextualized: boolean;  // Legacy field
  inputContract: ContractField[];
  outputContract: ContractField[];
  
  // Execution scripts (S3 paths)
  inferenceMode: InferenceMode;  // 'local' | 'remote' | 'hybrid'
  s3TrainingScriptPath: string;        // Python script for training
  s3RemoteInferenceScriptPath: string; // Python script for Lambda
  s3LocalInferenceScriptPath?: string; // JavaScript for browser
  
  // Documentation
  formulaLatex?: string;  // LaTeX formula representation
  s3SpecificationPath?: string;  // S3 path to .tex document
  
  createdAt: string;
  lastUpdated: string;
  createdBy?: string;
}

type ScaffoldType = 'context-free' | 'context-dependent';
type InferenceMode = 'local' | 'remote' | 'hybrid';
type LearningAlgorithm = 'MLE' | 'OLS' | 'gradient_descent' | 'adam' | 'sgd' | 'custom' | string;

interface ContractField {
  name: string;           // Column name (e.g., "close_price")
  type: FieldType;        // 'numerical' | 'categorical' | etc
  required: boolean;      // Must exist in data
  minValue?: number;      // For numerical validation
  maxValue?: number;
  allowedValues?: string[];  // For categorical
  description?: string;
}
```

### Create Input ✅
```typescript
interface CreateModelScaffoldInput {
  scaffoldId: string;
  name: string;
  description: string;
  modelType?: 'ML' | 'DL' | 'TS' | 'statistical';
  scaffoldType: ScaffoldType;
  modelMajorCategory?: string;
  modelCategory?: string;
  learningAlgorithm: LearningAlgorithm;
  isContextualized: boolean;
  inputContract: ContractField[];
  outputContract: ContractField[];
  inferenceMode: InferenceMode;
  s3TrainingScriptPath: string;
  s3RemoteInferenceScriptPath: string;
  s3LocalInferenceScriptPath?: string;
  formulaLatex?: string;
  s3SpecificationPath?: string;
  createdBy?: string;
}
```

### Database Table
- **Table:** `ChasingProphets-ModelScaffolds`
- **Partition Key:** `scaffoldId`

### Relationships
- **Child:** 1 Scaffold + 1 DataSlice → 1 ModelFit

---

## 5️⃣ MODEL FIT (`src/types/modelFit.ts`)

### Core Interface
```typescript
interface ModelFit {
  modelFitId: string;     // Primary Key (e.g., "djia-lr-fit-2024-01")
  scaffoldId: string;     // Foreign Key to ModelScaffold
  dataSliceId: string;    // Foreign Key to DataSlice
  assetId: string;        // Denormalized from dataSlice
  
  // Training metadata
  trainingDate: string;   // ISO timestamp
  trainingDuration?: number;  // Seconds
  
  // Training metrics
  metrics: {
    r2?: number;          // R-squared (0-1, higher better)
    rmse?: number;        // Root Mean Squared Error (lower better)
    mape?: number;        // Mean Absolute Percentage Error (lower better)
    mae?: number;         // Mean Absolute Error
  };
  
  // Model artifacts (S3 paths)
  s3ModelPath: string;    // Serialized model weights
  s3MetadataPath?: string;  // Training logs, plots
  
  // Hyperparameters used
  hyperparameters?: Record<string, any>;
  
  // Status
  status: 'training' | 'completed' | 'failed';
  errorMessage?: string;
  
  createdAt: string;
  updatedAt?: string;
}
```

### Create Input ✅
```typescript
interface CreateModelFitInput {
  modelFitId: string;
  scaffoldId: string;
  dataSliceId: string;
  assetId: string;
  trainingDate: string;
  trainingDuration?: number;
  metrics: {
    r2?: number;
    rmse?: number;
    mape?: number;
    mae?: number;
  };
  s3ModelPath: string;
  s3MetadataPath?: string;
  hyperparameters?: Record<string, any>;
  status: 'training' | 'completed' | 'failed';
  errorMessage?: string;
}
```

### Database Table
- **Table:** `ChasingProphets-ModelFits`
- **Partition Key:** `modelFitId`
- **GSI:** `ScaffoldIndex` on `scaffoldId`
- **GSI:** `AssetIndex` on `assetId`

### Relationships
- **Parents:** 1 Scaffold + 1 DataSlice → 1 ModelFit
- **Child:** Many ModelFits → 1 Prophet (ensembling)

---

## 6️⃣ PROPHET (`src/types/prophet.ts`)

### Core Interface
```typescript
interface Prophet {
  prophetId: string;      // Primary Key (e.g., "djia-ensemble-lr-lstm")
  prophetName: string;    // Display name
  description?: string;
  
  // Asset binding
  assetId: string;        // Foreign Key to Asset
  
  // Model binding (supports ensembles)
  modelFitIds: string[];  // Foreign Keys to ModelFits
  ensembleMethod: EnsembleMethod;  // 'single' | 'average' | 'weighted_average' | 'voting'
  ensembleWeights?: number[];  // For weighted_average
  
  // What property to forecast
  targetProperty: string;  // e.g., "close", "volume"
  
  // Transform scripts (S3 paths)
  s3InputTransformScriptPath?: string;   // Optional pre-processing
  s3OutputTransformScriptPath: string;   // Required post-processing
  
  // Forecast configuration
  forecastMethod: ForecastMethodType;  // 'direct' | 'stochastic' | 'confidence_interval'
  forecastParams?: {
    seed?: number;
    distribution?: 'normal' | 'lognormal';
    errorModel?: 'additive' | 'multiplicative';
  };
  
  // Status
  status: ProphetStatus;  // 'pending_training' | 'active' | 'inactive' | 'failed'
  
  createdAt: string;
  updatedAt?: string;
  
  // Performance metrics
  performance?: {
    rmse?: number;
    mape?: number;
    r2?: number;
    directionalAccuracy?: number;
    backtestPeriod?: { start: string; end: string };
  };
}

type EnsembleMethod = 'single' | 'average' | 'weighted_average' | 'voting';
type ForecastMethodType = 'direct' | 'stochastic' | 'confidence_interval';
type ProphetStatus = 'pending_training' | 'active' | 'inactive' | 'failed';
```

### Create Input ✅
```typescript
interface CreateProphetInput {
  prophetId: string;
  prophetName: string;
  assetId: string;
  modelFitIds: string[];
  ensembleMethod?: EnsembleMethod;
  ensembleWeights?: number[];
  targetProperty: string;
  s3OutputTransformScriptPath: string;
  s3InputTransformScriptPath?: string;
  forecastMethod?: ForecastMethodType;
  forecastParams?: {
    seed?: number;
    distribution?: 'normal' | 'lognormal';
    errorModel?: 'additive' | 'multiplicative';
  };
  description?: string;
}
```

### Database Table
- **Table:** `ChasingProphets-Prophets`
- **Partition Key:** `prophetId`
- **GSI:** `AssetIndex` on `assetId`

### Relationships
- **Parents:** 1 Asset + Many ModelFits → 1 Prophet
- **Child:** 1 Prophet → Many Forecasts (time series)

---

## 🔗 ENTITY RELATIONSHIP DIAGRAM

```
┌──────────┐
│  Asset   │ (ticker)
└────┬─────┘
     │ 1:N
     ▼
┌──────────┐
│ Dataset  │ (datasetId)
└────┬─────┘
     │ 1:N
     ▼
┌──────────────┐
│  DataSlice   │ (dataSliceId)
└──────┬───────┘
       │
       │ N:1        ┌────────────────┐
       ├───────────→│ ModelScaffold  │ (scaffoldId)
       │            └────────────────┘
       │ 1:1
       ▼
  ┌──────────┐
  │ModelFit  │ (modelFitId)
  └────┬─────┘
       │ N:M (ensemble)
       ▼
  ┌──────────┐
  │ Prophet  │ (prophetId)
  └────┬─────┘
       │ 1:N
       ▼
  ┌──────────┐
  │ Forecast │ (forecastId)
  └──────────┘
```

---

## ⚠️ DATA MODEL ISSUES

### 1. **DataSlice Schema Migration**
- Old schema: `assetId` (direct link)
- New schema: `datasetId` (through dataset)
- **Fix:** Migrate all old slices to use `datasetId`

### 2. **Missing CreateAssetInput**
- No TypeScript interface defined
- **Fix:** Add to `src/types/assets.ts`

### 3. **Immutability Unclear**
- DataSlice: No update function (immutable by design?)
- ModelFit: No update function (training results immutable?)
- **Decision needed:** Should these be editable?

---

## 🔄 NEXT STEPS

1. ✅ Document all data models
2. ⏭️ Add `CreateAssetInput` interface
3. ⏭️ Add `UpdateAssetInput` interface (if needed)
4. ⏭️ Decide on DataSlice/ModelFit mutability
5. ⏭️ Migrate legacy DataSlice records to new schema
