# Dual Inference Architecture

## Overview

**Prophets use DUAL INFERENCE** - both server-side AND client-side execution:

1. **🔄 Server-Side** (Daily Automated):
   - AWS EventBridge cron → Lambda
   - Updates `Prophet.performance` in DynamoDB
   - Runs daily for all active prophets

2. **👁️ Client-Side** (User On-Demand):
   - Browser JavaScript
   - Generates interactive visualizations
   - Runs when user visits prophet/model fit page

**Both use identical scripts/parameters** - server stores metrics, client renders charts.

---

## 🔄 Server-Side Inference (Daily Performance Updates)

### Purpose
Automatically update prophet performance metrics with latest market data.

### Trigger
- **AWS EventBridge** cron schedule
- **Frequency**: Daily at midnight UTC
- **Target**: Lambda function `UpdateProphetPerformance`

### Lambda Execution Flow

```typescript
// Lambda: UpdateProphetPerformance
// Triggered by EventBridge daily

import { getActiveProphets, updateProphetPerformance } from './services/prophet';
import { getModelFit } from './services/modelFit';
import { fetchAssetData } from './services/asset';
import { downloadS3Script, downloadS3Json } from './utils/s3';
import { calculateRMSE, calculateMAPE, calculateR2, calculateDirectionalAccuracy } from './utils/metrics';

export async function handler(event: any) {
  console.log('🔄 Starting daily prophet performance update...');
  
  // 1. Get all active prophets (status = 'active')
  const prophets = await getActiveProphets();
  console.log(`Found ${prophets.length} active prophets`);
  
  const results = { success: 0, failed: 0 };
  
  // 2. Process each prophet
  for (const prophet of prophets) {
    try {
      console.log(`Processing ${prophet.prophetName}...`);
      
      // 3. Fetch latest data (window size from data slice)
      const modelFit = await getModelFit(prophet.modelFitId);
      const dataSlice = await getDataSlice(modelFit.dataSliceId);
      const inputData = await fetchAssetData(
        prophet.assetId,
        dataSlice.windowSizeDays,
        new Date() // up to today
      );
      
      // 4. Download inference components
      const parameters = await downloadS3Json(modelFit.s3ParametersPath);
      const inferenceScript = await downloadS3Script(modelFit.s3LocalInferenceScriptPath);
      const inputTransform = prophet.s3InputTransformScriptPath
        ? await downloadS3Script(prophet.s3InputTransformScriptPath)
        : null;
      const outputTransform = await downloadS3Script(prophet.s3OutputTransformScriptPath);
      
      // 5. Execute inference pipeline
      const transformedInput = inputTransform
        ? await inputTransform(inputData, {})
        : inputData;
      
      const modelOutput = inferenceScript.predict(transformedInput, parameters);
      
      const predictions = await outputTransform(modelOutput, {
        lastActualPrice: inputData[inputData.length - 1][prophet.targetProperty]
      });
      
      // 6. Calculate metrics (on asset's actual values, not model's internal representation)
      const actual = inputData.slice(1).map(d => d[prophet.targetProperty]);
      const metrics = {
        rmse: calculateRMSE(actual, predictions),
        mape: calculateMAPE(actual, predictions),
        r2: calculateR2(actual, predictions),
        directionalAccuracy: calculateDirectionalAccuracy(actual, predictions),
        backtestPeriod: {
          start: inputData[0].date,
          end: inputData[inputData.length - 1].date
        }
      };
      
      // 7. Update DynamoDB
      await updateProphetPerformance(prophet.prophetId, metrics);
      
      console.log(`✅ ${prophet.prophetName}: RMSE=${metrics.rmse.toFixed(2)}, R²=${metrics.r2.toFixed(3)}`);
      results.success++;
      
    } catch (error) {
      console.error(`❌ Failed ${prophet.prophetName}:`, error);
      results.failed++;
      // Continue with next prophet
    }
  }
  
  console.log(`\n📊 Results: ${results.success} success, ${results.failed} failed`);
  return results;
}
```

### Result
- Prophet records have **fresh performance metrics**
- Users see **current accuracy** when browsing
- **No manual intervention** required

### AWS Infrastructure
```yaml
# EventBridge Rule (CloudFormation)
UpdateProphetPerformanceRule:
  Type: AWS::Events::Rule
  Properties:
    Description: "Trigger daily prophet performance updates"
    ScheduleExpression: "cron(0 0 * * ? *)"  # Daily at midnight UTC
    State: ENABLED
    Targets:
      - Arn: !GetAtt UpdateProphetPerformanceLambda.Arn
        Id: "UpdateProphetPerformanceTarget"

# Lambda Function
UpdateProphetPerformanceLambda:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: UpdateProphetPerformance
    Runtime: nodejs18.x
    Handler: index.handler
    Timeout: 900  # 15 minutes (many prophets)
    MemorySize: 1024
    Environment:
      Variables:
        DYNAMODB_TABLE_PROPHETS: !Ref ProphetsTable
        S3_MODELS_BUCKET: !Ref ModelsBucket
```

---

## 👁️ Client-Side Inference (User Visualization)

### Purpose
Show users **interactive visualizations** of prophet/model fit performance.

### Trigger
User navigates to:
- **Individual Prophet Page** (`/prophets/{prophetId}`)
- **Individual Model Fit Page** (`/model-fits/{modelFitId}`)

### Multi-Window Analysis

User sees predictions across **8 time windows**:
- **5 days** (1 week)
- **20 days** (1 month)
- **60 days** (quarter)
- **120 days** (half year)
- **240 days** (1 year)
- **480 days** (2 years)
- **1200 days** (5 years)
- **2400 days** (10 years)

### Client Execution Flow

```typescript
// src/utils/prophetInference.ts

interface InferenceResult {
  window: number;  // days
  dates: string[];
  actual: number[];
  predicted: number[];
  metrics: {
    rmse: number;
    mape: number;
    r2: number;
    directionalAccuracy: number;
  };
  trainingData: {
    x: number[];
    y: number[];
  };
  regressionLine: {
    x: number[];
    y: number[];
    ci95_upper: number[];
    ci95_lower: number[];
  };
}

export async function runProphetInferenceMultiWindow(
  prophetId: string
): Promise<InferenceResult[]> {
  
  // 1. Fetch prophet metadata
  const prophet = await getProphet(prophetId);
  const modelFit = await getModelFit(prophet.modelFitId);
  
  // 2. Download inference components (one-time)
  const parameters = await downloadS3Json(modelFit.s3ParametersPath);
  const inferenceScript = await downloadS3Script(modelFit.s3LocalInferenceScriptPath);
  const inputTransform = prophet.s3InputTransformScriptPath
    ? await downloadS3Script(prophet.s3InputTransformScriptPath)
    : null;
  const outputTransform = await downloadS3Script(prophet.s3OutputTransformScriptPath);
  
  // 3. Run inference for each time window
  const windows = [5, 20, 60, 120, 240, 480, 1200, 2400];
  const results: InferenceResult[] = [];
  
  for (const days of windows) {
    try {
      // 4. Fetch asset data for this window
      const inputData = await fetchAssetData(prophet.assetId, days + 1); // +1 for lag
      
      if (!inputData || inputData.length < days) {
        console.warn(`Insufficient data for ${days}-day window`);
        continue;
      }
      
      // 5. Execute inference pipeline (same as server)
      const transformedInput = inputTransform
        ? await inputTransform(inputData, {})
        : inputData;
      
      const modelOutput = inferenceScript.predict(transformedInput, parameters);
      
      const predictions = await outputTransform(modelOutput, {
        lastActualPrice: inputData[inputData.length - 1][prophet.targetProperty]
      });
      
      // 6. Calculate metrics
      const actual = inputData.slice(1).map(d => d[prophet.targetProperty]);
      const metrics = {
        rmse: calculateRMSE(actual, predictions),
        mape: calculateMAPE(actual, predictions),
        r2: calculateR2(actual, predictions),
        directionalAccuracy: calculateDirectionalAccuracy(actual, predictions)
      };
      
      // 7. Prepare visualization data
      results.push({
        window: days,
        dates: inputData.slice(1).map(d => d.date),
        actual,
        predicted: predictions,
        metrics,
        trainingData: {
          x: transformedInput.map(d => d.x),  // Model's input
          y: transformedInput.map(d => d.y)   // Model's output
        },
        regressionLine: calculateRegressionLine(transformedInput, parameters)
      });
      
    } catch (error) {
      console.error(`Error running ${days}-day inference:`, error);
    }
  }
  
  return results;
}
```

### Page Visualizations

#### Individual Prophet Page

For **each time window** (5d, 20d, etc.), show:

1. **📈 Time Series Plot**
   - Dual line chart: Actual (blue) vs. Predicted (orange)
   - X-axis: Date
   - Y-axis: Asset value (e.g., DJIA closing price)
   - Tooltip: Date, Actual, Predicted, Error

2. **📊 Scatter Plot**
   - Training data: X (model input) vs. Y (model output)
   - Regression line (from model parameters)
   - 95% confidence interval bands
   - Shows model's fit quality

3. **📋 Stats Widget**
   - Big, fancy display of:
     - **RMSE**: 45.2 (in asset units, e.g., dollars)
     - **R²**: 0.85 (goodness of fit)
     - **MAPE**: 1.2% (mean absolute % error)
     - **Directional Accuracy**: 72% (% correct up/down predictions)

4. **🎯 Performance Grid**
   - Card for each time window
   - Shows metrics side-by-side
   - Color-coded (green = good, red = poor)
   - Example:
     ```
     | Window | RMSE | R²   | MAPE | Dir Acc |
     |--------|------|------|------|---------|
     | 5d     | 32.1 | 0.91 | 0.9% | 80%     |
     | 20d    | 45.2 | 0.85 | 1.2% | 72%     |
     | 60d    | 67.8 | 0.78 | 1.8% | 68%     |
     | ...    | ...  | ...  | ...  | ...     |
     ```

#### Individual Model Fit Page

Same structure as Prophet page, but shows:
- **Model's internal metrics** (in model's units, e.g., % returns)
- **Input/Output contracts**
- **Training metadata** (samples, epochs, convergence)

---

## Key Comparison: Server vs. Client

| Aspect | Server-Side (Lambda) | Client-Side (Browser) |
|--------|---------------------|----------------------|
| **Purpose** | Update performance metrics | Visualize predictions |
| **Trigger** | Daily cron (EventBridge) | User navigation |
| **Frequency** | Once per day | On-demand |
| **Data** | Latest market data | Flexible (5d to 2400d) |
| **Output** | Metrics → DynamoDB | Charts → UI |
| **Duration** | ~15 min (all prophets) | ~2 sec (one prophet) |
| **Scripts Used** | Same from S3 | Same from S3 |
| **User Interaction** | None (automated) | Interactive |

---

## Data Flow Example: DJIA Prophet

### Server-Side (Daily Update)

```
EventBridge Cron (12:00 AM UTC)
  ↓
Lambda: UpdateProphetPerformance
  ↓
Scan: Get all active prophets (374 for DJIA + SPX)
  ↓
For each prophet:
  1. Fetch latest 30 days of DJIA prices from DynamoDB/S3
  2. Download: parameters.json, inference.js, output_transform.js
  3. Transform: Prices → % returns
  4. Predict: Model outputs next-day returns
  5. Transform: % returns → Predicted prices
  6. Calculate: RMSE, MAPE, R², directional accuracy
  7. Update: Prophet.performance in DynamoDB
  ↓
DynamoDB: Prophet record updated
  performance: {
    rmse: 45.2,
    mape: 0.012,
    r2: 0.85,
    directionalAccuracy: 0.72
  }
```

### Client-Side (User Visits Page)

```
User → Navigates to /prophets/abc-123
  ↓
React Component: IndividualProphetPage
  ↓
useEffect: runProphetInferenceMultiWindow("abc-123")
  ↓
For each window (5d, 20d, 60d, ...):
  1. Fetch DJIA data for window (e.g., last 60 days)
  2. Download: parameters.json, inference.js, output_transform.js (cached)
  3. Transform: Prices → % returns
  4. Predict: Model outputs next-day returns
  5. Transform: % returns → Predicted prices
  6. Calculate: RMSE, MAPE, R², directional accuracy
  7. Render: Time series plot, scatter plot, stats widget
  ↓
UI: User sees 8 interactive charts with metrics
```

---

## Implementation Checklist

### ✅ Completed
- [x] Prophet type updated with `s3InputTransformScriptPath`, `s3OutputTransformScriptPath`, `status`, `performance`
- [x] Prophet service updated: `getActiveProphets`, `createProphet`, `updateProphet`, `updateProphetPerformance`
- [x] Orchestrator generates and uploads default `output_transform.js` scripts
- [x] 374 prophets regenerated with new schema + S3 scripts

### ⏳ In Progress
- [ ] Update development plan documents with dual inference architecture

### 🔜 Next Steps
1. **Build Client-Side Inference Engine**
   - `src/utils/prophetInference.ts`
   - `runProphetInferenceMultiWindow()`
   - S3 download utilities
   - Metrics calculation functions

2. **Build Server-Side Lambda**
   - `lambdas/UpdateProphetPerformance/index.ts`
   - EventBridge cron setup
   - Error handling + logging

3. **Training Flow**
   - Admin UI: Training queue page
   - Batch training script
   - Upload `parameters.json` to S3
   - Update statuses: `unfit` → `fit`, `pending_training` → `active`

4. **Prophet Pages**
   - List page: Simple table (active prophets only)
   - Individual page: Rich multi-window visualizations

5. **Model Fit Pages**
   - List page: Simple table (all fits)
   - Individual page: Rich visualizations (same structure as prophet)

6. **E2E Testing**
   - DJIA + SPX pipeline
   - Training → Daily updates → Client visualization
   - Verify metrics match across server/client

---

## Why Dual Inference?

### Server-Side Benefits
- ✅ **Automated**: No user action required
- ✅ **Consistent**: All prophets updated daily
- ✅ **Scalable**: Handles 1000s of prophets
- ✅ **Fresh**: Users see current performance

### Client-Side Benefits
- ✅ **Interactive**: User explores different time windows
- ✅ **Visual**: Rich charts explain performance
- ✅ **Fast**: No API latency for visualization
- ✅ **Flexible**: Easy to add new visualizations

### Together
- ✅ **Same logic**: Server/client use identical scripts (no drift)
- ✅ **Trustworthy**: Client reproduces server's calculations
- ✅ **Transparent**: Users see exactly how metrics are computed
- ✅ **Cost-effective**: Server runs once/day, client on-demand

---

## Example Prophet Workflow (End-to-End)

### Day 1: Training
1. Admin uploads DJIA CSV (10 years)
2. Orchestrator auto-generates:
   - 187 data slices (various window sizes)
   - 374 model fits (SLR + MLR × slices) → `status: unfit`
   - 374 prophets → `status: pending_training`
3. Admin clicks "Train All"
4. Batch script trains all fits → uploads `parameters.json` to S3
5. ModelFits → `status: fit`
6. Prophets → `status: active`

### Day 2+: Automated Updates
1. **12:00 AM UTC**: EventBridge triggers Lambda
2. Lambda scans 374 active prophets
3. For each: Download scripts → Run inference → Calculate metrics → Update DynamoDB
4. **User wakes up**: Sees updated performance metrics in prophet list

### Anytime: User Explores
1. User clicks on "SLR-DJIA-60d" prophet
2. Browser downloads scripts (cached after first load)
3. Browser runs inference for 5d, 20d, 60d, 120d, 240d, 480d, 1200d, 2400d
4. UI renders 8 time series plots + scatter plots + stats widgets
5. User compares: "60-day window has best R² (0.91), but 240-day has best directional accuracy (75%)"
6. User decides to focus on 240-day window for trading strategy

---

## Future Enhancements

### Stochastic Forecasting
- Add random error to predictions
- Show uncertainty bands
- `forecastMethod: 'stochastic'`
- `forecastParams: { seed: 42, distribution: 'normal', errorModel: 'additive' }`

### Confidence Intervals
- Model-based uncertainty estimation
- 95% prediction bands
- `forecastMethod: 'confidence_interval'`

### Ensemble Prophets
- Use multiple model fits
- Weighted averaging
- `modelFitIds: ['fit1', 'fit2', 'fit3']` (future)

### Custom Input Transforms
- User edits `input_transform.js` in browser
- Adds technical indicators (RSI, MACD, Bollinger Bands)
- Re-runs inference instantly
- Compares performance with/without indicators

### Real-Time Inference
- WebSocket data feed
- Live predictions as market updates
- Rolling window updates
