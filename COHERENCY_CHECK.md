# System Coherency Check
**Date**: November 6, 2025  
**Purpose**: Verify current implementation against human concept document and design sketches

---

## Executive Summary

### ✅ **WELL ALIGNED**
- Core entity hierarchy (Assets → Datasets → Slices → Scaffolds → Fits → Prophets → Forecasts)
- DynamoDB table structure (11 tables defined, services implemented)
- S3 organization for scripts (scaffolds, prophets, models)
- Dual inference architecture (server daily updates, client visualization)
- TypeScript type system matches database schema

### ⚠️ **GAPS IDENTIFIED**
1. **Prophet Definition Mismatch**: Concept says "takes one or many model fits" but current implementation uses single `modelFitId` (not array)
2. **Forecast vs. Prophet Confusion**: Concept separates these, but implementation blurs the line
3. **Performance Ranking**: Concept emphasizes system-wide ranking tables, but implementation stores performance inline in Prophet records
4. **Context-Dependent vs. Context-Free Scaffolds**: Concept distinguishes these, but implementation treats all as context-free
5. **Missing Forecast Window System**: Concept specifies fixed windows (20d, 60d, 120d, 240d), but implementation uses arbitrary data slice windows

### 🔴 **CRITICAL ISSUES**
1. **Prophet ≠ Forecast**: The concept clearly separates these. A Prophet uses model fits to generate predictions, but a **Forecast** is the actual time-series prediction over a fixed window (20d, 60d, etc.)
2. **Missing Forecasting Method Implementation**: Concept describes forecasting methods (how prophet transforms model output), but we only have placeholder

---

## Detailed Analysis

### 1. Entity (Asset) ✅ ALIGNED

**Concept**: "The thing we are seeking to describe, explain, and predict"

**Implementation**:
```typescript
// src/types/assets.ts
export type AssetMeta = {
  ticker: string;      // Primary key
  name: string;        // Full name
  market?: string;     // Exchange
  priceChange?: number;
  lastPrice?: number;
}

// DynamoDB Table
TABLES.ASSETS = 'ChasingProphets-Assets'
TABLES.ASSET_PRICES = 'ChasingProphets-AssetPrices'
```

**Status**: ✅ **Matches concept perfectly**
- Asset is the core entity
- Has metadata table + time-series prices table
- DJIA and SPX can be loaded

---

### 2. Datasets ✅ ALIGNED

**Concept**: "Describes an entity. Within the dataset are measures of the entity... fixed in some way (e.g., OHLCV always has 5 columns)"

**Implementation**:
```typescript
// src/types/dataset.ts
export interface Dataset {
  datasetId: string;           // PK: Unique identifier
  assetId: string;             // FK: Which asset this describes
  name: string;                // e.g., "DJIA_OHLCV"
  dataType: 'OHLCV' | 'fundamentals' | 'custom';
  s3Path: string;              // Where CSV lives in S3
  columnExpectations: Array<{ // Fixed column structure
    name: string;
    type: 'string' | 'number' | 'date';
    required: boolean;
  }>;
  isLive: boolean;             // Auto-updated?
  createdAt: string;
}

// DynamoDB Table
TABLES.DATASETS = 'ChasingProphets-Datasets'
```

**Status**: ✅ **Matches concept**
- Dataset always tied to one asset
- Fixed schema via `columnExpectations`
- S3 path for raw data storage
- OHLCV is the primary type for finance

**Service**: `src/services/dataset.ts` - Full CRUD implemented

---

### 3. Data Slices ⚠️ **PARTIAL ALIGNMENT**

**Concept**: "Describes a part of a given dataset... can be simple (within a single time range) or compound (union of various simple slices)"

**Implementation**:
```typescript
// src/types/dataSlice.ts
export interface DataSlice {
  dataSliceId: string;         // PK
  datasetId: string;           // FK: Parent dataset
  sliceName: string;
  sliceType: 'simple' | 'compound';
  
  // Simple slice
  startDate?: string;
  endDate?: string;
  windowSizeDays?: number;     // NEW: For rolling windows
  
  // Compound slice
  simpleSliceIds?: string[];   // Union of simple slices
  
  // Metadata
  s3Path?: string;             // Cached slice data
  rowCount?: number;
  columnRanges?: Record<string, { min: number; max: number }>;
  createdAt: string;
}
```

**Issues**:
1. ✅ **Good**: Supports simple/compound distinction
2. ⚠️ **Gap**: `windowSizeDays` added for orchestrator convenience, but concept doesn't mention this
3. ⚠️ **Gap**: No explicit filtering beyond date ranges (concept implies "matching certain criteria")

**Current Usage**: Orchestrator creates 187 slices for DJIA using sliding windows (30d, 60d, 90d, 120d, 240d, 480d, 600d, 1200d)

**Recommendation**: This is OK for V1, but should add:
- Filter criteria support (e.g., "only trading days with volume > X")
- Compound slice composition logic

---

### 4. Model Scaffold ⚠️ **SIGNIFICANT GAPS**

**Concept**:
```
- type: "context-free" or "context-dependent"
- input_specification: [{var_1_name, var_1_type, var_1_range}, ...]
- output_specification: [{out_1_name, out_1_type, out_1_range}]
- model_major_category: "econometrics"
- model_category: "multiple_linear_regression"
- learning_algorithm: "maximum_likelihood_estimation"
- model_specification_file: "specification.tex"
- model_training_file: "training.py"
- model_inference_file: "inference.py/inference.js"
```

**Implementation**:
```typescript
// src/types/modelScaffold.ts
export interface ModelScaffold {
  scaffoldId: string;                  // PK
  name: string;
  description?: string;
  modelType: 'ML' | 'DL' | 'TS' | 'other';
  category?: string;
  
  // Input/Output Contracts
  inputContract: {
    expectedColumns: string[];
    dataTypes: Record<string, 'number' | 'string' | 'date' | 'boolean'>;
    preprocessing?: string;
  };
  outputContract: {
    outputColumns: string[];
    outputTypes: Record<string, 'number' | 'string' | 'boolean'>;
    outputDescription?: string;
  };
  
  // S3 Script Paths
  s3TrainingScriptPath: string;        // train.py
  s3RemoteInferenceScriptPath: string; // inference.py (Lambda)
  s3LocalInferenceScriptPath: string;  // inference.js (Browser)
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

**Issues**:
1. 🔴 **MISSING**: `type` field ("context-free" vs "context-dependent") - **CRITICAL GAP**
2. 🔴 **MISSING**: `learning_algorithm` field - concept explicitly mentions this
3. 🔴 **MISSING**: `model_specification_file` (LaTeX) - concept wants users to enter LaTeX
4. 🔴 **MISSING**: `model_major_category` ("econometrics", etc.)
5. ✅ **Good**: Input/output contracts exist (though simpler than concept's detailed spec)
6. ✅ **Good**: Training and inference script paths

**Current State**:
- 2 scaffolds: SLR, MLR
- Both are **context-free** (use generic "x", "y" variables)
- Scripts exist in `scripts/scaffolds/slr/` and `scripts/scaffolds/mlr/`

**Recommendation**:
- Add `scaffoldType: 'context-free' | 'context-dependent'` field
- Add `learningAlgorithm: string` field
- Add `s3SpecificationPath?: string` for LaTeX files (future phase)
- Expand input/output contracts to match concept's detailed specification

---

### 5. Model Fit ✅ MOSTLY ALIGNED

**Concept**: "Scaffold + data slice + training → fit. Stored in organized S3 folder. Actions: train, infer."

**Implementation**:
```typescript
// src/types/modelFit.ts
export interface ModelFit {
  modelFitId: string;                  // PK
  scaffoldId: string;                  // FK: Which scaffold template
  dataSliceId: string;                 // FK: What data was used
  assetId: string;                     // FK: Which asset
  
  // Training Status
  status: 'unfit' | 'training' | 'fit' | 'failed';
  
  // S3 Artifacts
  s3ParametersPath?: string;           // Where trained params live
  s3TrainingScriptPath: string;        // train.py (copied from scaffold)
  s3RemoteInferenceScriptPath: string; // inference.py
  s3LocalInferenceScriptPath: string;  // inference.js
  
  // Contracts (copied from scaffold at creation)
  inputContract: {...};
  outputContract: {...};
  
  // Training Metadata
  trainingMetadata?: {
    startedAt?: string;
    completedAt?: string;
    trainingDuration?: number;
    errorMessage?: string;
  };
  
  // Metrics (model's internal performance)
  metrics?: {
    train_r2?: number;
    train_rmse?: number;
    train_mae?: number;
    test_r2?: number;
    test_rmse?: number;
    test_mae?: number;
  };
  
  createdAt: string;
  updatedAt?: string;
}
```

**Status**: ✅ **Good alignment**
- Scaffold + data slice → fit ✅
- S3 organization ✅
- Training status tracking ✅
- Metrics stored ✅

**Current State**:
- 374 model fits created for DJIA (187 slices × 2 scaffolds)
- All status: `unfit` (pending training)
- Parameters path set but files don't exist yet

**Recommendation**: No major changes needed. This is well-designed.

---

### 6. Prophet 🔴 **CRITICAL MISALIGNMENT**

**Concept** (exact quote):
> "The prophet takes one **(or many) model fits** on a single same training data slice... uses the models to infer the next value... takes output about the model and converts them to specific measured output about the entity... applies... the 'forecasting method'"

**Implementation**:
```typescript
// src/types/prophet.ts
export interface Prophet {
  prophetId: string;
  prophetName: string;
  assetId: string;
  
  modelFitId: string;  // 🔴 SINGLE FIT, NOT ARRAY
  
  targetProperty: string;  // What to predict (close, volume, etc.)
  
  // Transformation scripts
  s3InputTransformScriptPath?: string;
  s3OutputTransformScriptPath: string;
  
  // Forecasting method
  forecastMethod: 'direct' | 'stochastic' | 'confidence_interval';
  forecastParams?: {...};
  
  status: 'pending_training' | 'active' | 'inactive' | 'failed';
  performance?: {...};  // RMSE, MAPE, R², etc.
}
```

**Issues**:
1. 🔴 **CRITICAL**: `modelFitId` is single string, **not array**
   - Concept says "one or many model fits"
   - This prevents ensemble models (averaging multiple fits)
   
2. ⚠️ **Gap**: Concept says "single same training data slice"
   - Implementation doesn't enforce this
   - If we add `modelFitIds: string[]`, we should validate they all use same slice
   
3. ⚠️ **Gap**: "Forecasting method" mentioned in concept but not detailed
   - We have `forecastMethod` field ✅
   - But implementation is placeholder (not actually used yet)

**Recommendation**:
```typescript
export interface Prophet {
  // ... existing fields ...
  
  // CHANGE THIS:
  modelFitIds: string[];  // One or more fits (ensemble support)
  ensembleMethod?: 'average' | 'weighted_average' | 'voting';
  ensembleWeights?: number[];  // If weighted_average
  
  // VALIDATE: All fits must use same dataSliceId
}
```

---

### 7. Forecast 🔴 **COMPLETELY MISSING**

**Concept** (exact quote):
> "This is an object that is specific to an entity over a specific **time horizon**. The time window is **fixed to the system**. Typical examples would be 20 days, 60 days, 120 days, 240 days, etc. The forecast window has a **start date** which will only use input information prior to that start date... This will continue for the entire time window. A forecast can then be 'judged' performance wise..."

**Implementation**:
```typescript
// src/types/forecast.ts
export interface Forecast {
  forecastId: string;
  prophetId: string;
  assetId: string;
  startDate: string;  // PK part 2
  
  predictions: ForecastPrediction[];  // Time series
  
  performance?: {
    rmse?: number;
    mape?: number;
    r2?: number;
  };
  
  createdAt: string;
}

export interface ForecastPrediction {
  date: string;
  predictedValue: number;
  actualValue?: number;
  confidence?: number;
}
```

**Issues**:
1. 🔴 **MISSING**: Fixed time horizons (20d, 60d, 120d, 240d)
   - Current implementation has no `horizon` or `windowDays` field
   
2. 🔴 **CONFUSION**: Is this a forecast or just stored predictions?
   - Concept: Forecast = rolling multi-step prediction over fixed window
   - Implementation: Looks like just a snapshot of predictions
   
3. 🔴 **MISSING**: Daily generation logic
   - Concept implies forecasts are generated daily with new start dates
   - No scheduler/Lambda for this exists

**Recommendation**:
```typescript
export interface Forecast {
  forecastId: string;  // {prophetId}_{horizon}d_{startDate}
  prophetId: string;
  assetId: string;
  
  horizon: 20 | 60 | 120 | 240 | 480 | 1200 | 2400;  // Fixed windows
  startDate: string;   // First prediction date
  endDate: string;     // Last prediction date (startDate + horizon)
  
  // Multi-step predictions
  predictions: ForecastPrediction[];  // Length = horizon
  
  // Performance (if actual data available)
  performance?: {
    rmse: number;
    mape: number;
    r2: number;
    directionalAccuracy: number;
    
    // Per-window metrics
    windows: {
      '5d': { rmse, mape, r2, directionalAccuracy },
      '20d': { ... },
      // etc.
    };
  };
  
  status: 'generating' | 'complete' | 'failed';
  createdAt: string;
}
```

**Critical Realization**:
The concept document describes **TWO distinct things**:

1. **Prophet**: The "engine" that uses model fit(s) to make **single-step** predictions
2. **Forecast**: The **multi-step** time series generated by running a prophet repeatedly over a fixed horizon

**Current implementation conflates these!**

---

### 8. Performance Ranking ⚠️ **PARTIALLY IMPLEMENTED**

**Concept**:
> "This nuance in the system will rank model fits, scaffolds, prophets, assets... computed daily by back end lambda... stored in the database... user can rank the different components and inspect them based on those performance measures"

**Implementation**:
```typescript
// src/types/performance.ts
export interface ProphetPerformanceSummary {
  prophetId: string;    // PK
  assetId: string;
  prophetName: string;
  
  // Performance across multiple windows
  performance_5d?: PerformanceMetrics;
  performance_20d?: PerformanceMetrics;
  performance_60d?: PerformanceMetrics;
  // ... etc ...
  
  lastUpdated: string;
  ranking?: number;
}

// Also: Prophet.performance field (inline)
```

**Issues**:
1. ✅ **Good**: Performance tracked across multiple windows
2. ⚠️ **Gap**: Ranking logic not implemented
3. ⚠️ **Gap**: Performance for scaffolds/fits not tracked separately
4. ⚠️ **Confusion**: Performance stored in TWO places:
   - `Prophet.performance` (inline in prophet record)
   - `ProphetPerformanceSummary` table (separate table)

**Recommendation**:
- Keep performance inline in Prophet for simplicity (daily Lambda updates this)
- Add separate ranking tables for leaderboards:
  ```
  ChasingProphets-ProphetRankings (by RMSE, MAPE, R², etc.)
  ChasingProphets-ScaffoldRankings
  ChasingProphets-AssetRankings
  ```
- Add `ranking` algorithm that runs after daily performance update

---

### 9. S3 Organization ✅ ALIGNED

**Concept**: "Stored in organized S3 folder, according to the model itself"

**Implementation**:
```
s3://chasingprophets-models-us-east-1/
├── datasets/
│   ├── DJIA/
│   │   └── DJIA_OHLCV.csv
│   └── SPX/
│       └── SPX_OHLCV.csv
├── scripts/
│   ├── scaffolds/
│   │   ├── SLR/
│   │   │   ├── train.py
│   │   │   ├── inference.py
│   │   │   └── inference.js
│   │   └── MLR/
│   │       ├── train.py
│   │       ├── inference.py
│   │       └── inference.js
│   └── prophets/
│       ├── {prophetId}/
│       │   ├── input_transform.js
│       │   └── output_transform.js
│       └── ...
└── models/
    └── {modelFitId}/
        ├── parameters.json
        ├── train_log.txt
        └── metadata.json
```

**Status**: ✅ **Well organized and matches concept**

---

### 10. Training & Inference ⚠️ **PARTIALLY IMPLEMENTED**

**Concept**:
- Training: Lambda runs train.py, stores params in S3
- Inference: 
  - Daily batch (Lambda + Python)
  - Client-side (browser + JavaScript)

**Implementation**:
- ✅ Scripts exist: `train.py`, `inference.py`, `inference.js`
- ✅ Dual inference architecture documented
- ⏳ Lambda for training: **Not yet created**
- ⏳ Lambda for daily performance updates: **Not yet created**
- ⏳ Client-side inference engine: **Not yet created**

**Recommendation**: This is next on the roadmap (Phase 4F onwards)

---

## Gaps Summary Table

| Component | Concept Requirement | Current Implementation | Priority |
|-----------|-------------------|----------------------|----------|
| **Prophet.modelFitIds** | Array (ensemble) | Single string | 🔴 HIGH |
| **Forecast.horizon** | Fixed windows (20d, 60d, etc.) | Missing | 🔴 HIGH |
| **Prophet vs. Forecast** | Separate concepts | Conflated | 🔴 HIGH |
| **Scaffold.type** | context-free / context-dependent | Missing | ⚠️ MEDIUM |
| **Scaffold.learningAlgorithm** | Explicit field | Missing | ⚠️ MEDIUM |
| **Performance Ranking** | Separate ranking tables | Inline only | ⚠️ MEDIUM |
| **Compound Slices** | Union of simple slices | Placeholder only | 🟢 LOW |
| **LaTeX Specification** | User-entered model spec | Not implemented | 🟢 LOW (future) |

---

## Recommendations

### Immediate Fixes (Before Continuing)

1. **Fix Prophet Schema**:
   ```typescript
   export interface Prophet {
     // ... existing ...
     modelFitIds: string[];  // CHANGE from modelFitId
     ensembleMethod?: 'average' | 'weighted_average' | 'voting';
   }
   ```

2. **Clarify Forecast vs. Prophet**:
   - Prophet = **engine** (uses model fits + transforms)
   - Forecast = **output** (multi-step predictions over fixed horizon)
   - Keep both separate

3. **Add Fixed Forecast Horizons**:
   ```typescript
   export const FORECAST_HORIZONS = [5, 20, 60, 120, 240, 480, 1200, 2400] as const;
   export type ForecastHorizon = typeof FORECAST_HORIZONS[number];
   
   export interface Forecast {
     // ...
     horizon: ForecastHorizon;  // ADD THIS
   }
   ```

4. **Add Scaffold Type Field**:
   ```typescript
   export interface ModelScaffold {
     // ...
     scaffoldType: 'context-free' | 'context-dependent';
     learningAlgorithm: 'MLE' | 'gradient_descent' | 'OLS' | string;
   }
   ```

### Future Enhancements (V2+)

1. **LaTeX Model Specifications**: Admin can enter LaTeX, rendered on model pages
2. **Compound Data Slices**: Implement union logic
3. **Performance Ranking Tables**: Leaderboards for prophets/scaffolds/assets
4. **Social Features**: User profiles, prophet sharing, ProphetCoin (way later)

---

## Conclusion

### ✅ **Overall Coherency**: 7/10

The system is **fundamentally well-aligned** with the concept:
- Core entity hierarchy is correct
- Database schema matches intent
- S3 organization is clean
- Dual inference is properly architected

### 🔴 **Critical Issues to Address**:

1. **Prophet should support multiple model fits** (ensemble)
2. **Forecast should have fixed horizons** (20d, 60d, etc.)
3. **Separate Prophet (engine) from Forecast (output)**

### 🚀 **Ready to Proceed?**

**YES**, with minor schema fixes:
- Update `Prophet.modelFitId → modelFitIds: string[]`
- Add `Forecast.horizon` field
- Add `ModelScaffold.scaffoldType` and `learningAlgorithm` fields

Once these are addressed, the system will be **fully coherent** with the human concept document and ready for V1 deployment with DJIA/SPX data.
