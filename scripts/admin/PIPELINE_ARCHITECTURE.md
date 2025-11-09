# Admin Model Pipeline Architecture

## Overview
The admin model pipeline provides automated orchestration for creating data slices, model fits, and prophets at scale. This will be implemented as Lambda functions accessible from the admin dashboard.

## Current State (Session 4)
- **Local Script**: `scripts/admin/orchestrate-pipeline.ts`
- Demonstrates full pipeline flow
- Creates slices + fits + prophets for an asset
- Can be run locally for DJIA initialization

## Future Lambda Architecture (Session 5/6)

### Lambda Functions

#### 1. **AutoSliceGenerator** (`lambda-auto-slice-generator`)
**Purpose**: Generate standard time-window slices for an asset

**Input**:
```json
{
  "assetId": "DJIA",
  "datasetId": "DJIA_OHLCV",
  "windowSizes": [30, 60, 90, 120, 240, 480, 600, 1200],
  "trainingCutoff": "2024-12-31"
}
```

**Process**:
1. Fetch dataset metadata from DynamoDB
2. Read CSV from S3
3. For each window size:
   - Create non-overlapping slices
   - Stack consecutively until training cutoff
   - Analyze schema (columns, types, ranges)
   - Save to DataSlices table

**Output**:
```json
{
  "assetId": "DJIA",
  "slicesCreated": 147,
  "sliceIds": ["DJIA_30d_2020-01-01_2020-01-30", ...],
  "duration": 12.5
}
```

#### 2. **AutoProphetGenerator** (`lambda-auto-prophet-generator`)
**Purpose**: Create model fits and prophets for all scaffold-asset-slice combinations

**Input**:
```json
{
  "assetId": "DJIA",
  "scaffoldIds": ["SLR", "MLR"],  // or "all"
  "sliceIds": ["DJIA_30d_...", ...]  // or "all" for asset
}
```

**Process**:
1. Fetch scaffolds from DynamoDB
2. Fetch slices from DynamoDB
3. For each scaffold × slice combination:
   - Create ModelFit record with status='unfit'
   - Copy script paths from scaffold
   - Create Prophet record with status='pending_training'
   - Link prophet to model fit

**Output**:
```json
{
  "modelFitsCreated": 294,
  "prophetsCreated": 294,
  "status": "ready_for_training"
}
```

#### 3. **TrainingQueueManager** (`lambda-training-queue-manager`)
**Purpose**: Manage training queue and batch operations

**Input**:
```json
{
  "action": "list" | "add" | "remove" | "start_batch",
  "filters": {
    "assetId": "DJIA",
    "scaffoldId": "SLR",
    "status": "unfit"
  },
  "batchSize": 10  // for batch training
}
```

**Process**:
- **list**: Query ModelFits table with filters
- **add**: Add specific fits to queue
- **remove**: Remove from queue
- **start_batch**: Trigger BatchTrainingCoordinator

**Output**:
```json
{
  "queueSize": 294,
  "unfitModels": 294,
  "fittingModels": 0,
  "fitModels": 0,
  "failedModels": 0
}
```

#### 4. **BatchTrainingCoordinator** (`lambda-batch-training-coordinator`)
**Purpose**: Coordinate parallel training jobs

**Input**:
```json
{
  "modelFitIds": ["SLR_DJIA_...", "MLR_DJIA_...", ...],
  "maxConcurrency": 10,
  "timeoutPerJob": 300  // seconds
}
```

**Process**:
1. For each model fit ID (up to maxConcurrency):
   - Invoke `lambda-model-trainer` asynchronously
   - Update ModelFit status to 'fitting'
2. Monitor completion via DynamoDB streams
3. When all complete, update Prophet statuses

**Implementation Options**:
- **Option A**: Step Functions (recommended for orchestration)
- **Option B**: Lambda with DynamoDB Streams
- **Option C**: SQS queue with Lambda consumers

**Output**:
```json
{
  "batchId": "batch-2025-11-06-12345",
  "totalJobs": 294,
  "launched": 10,
  "queued": 284,
  "status": "in_progress"
}
```

#### 5. **ModelTrainer** (`lambda-model-trainer`)
**Purpose**: Train a single model (already planned for Session 4F)

**Input**:
```json
{
  "modelFitId": "SLR_DJIA_DJIA_30d_2020-01-01_2020-01-30"
}
```

**Process**:
1. Fetch ModelFit + Scaffold + DataSlice from DynamoDB
2. Download training script from S3
3. Fetch training data from S3
4. Execute training script (Python in Lambda runtime or ECS)
5. Upload parameters.json to S3
6. Update ModelFit with metrics and status='fit'

**Output**:
```json
{
  "modelFitId": "SLR_DJIA_...",
  "status": "fit",
  "metrics": {
    "r2": 0.9994,
    "rmse": 0.144,
    "mape": 1.70
  },
  "trainingTime": 2.3
}
```

## Admin Dashboard UI Flow

### Page: `/admin/pipeline-orchestrator`

```
┌─────────────────────────────────────────┐
│  Model Pipeline Orchestrator            │
├─────────────────────────────────────────┤
│                                         │
│  Step 1: Select Asset                   │
│  [DJIA ▼] or upload new CSV             │
│                                         │
│  Step 2: Generate Slices               │
│  Window Sizes: [30,60,90,120,240,480,600,1200] │
│  Training Cutoff: [2024-12-31]          │
│  [Generate Slices]                      │
│  Status: ✓ 147 slices created           │
│                                         │
│  Step 3: Select Scaffolds               │
│  ☑ SLR - Simple Linear Regression       │
│  ☑ MLR - Multiple Linear Regression     │
│  [Generate Prophets]                    │
│  Status: ✓ 294 model fits created       │
│                                         │
│  Step 4: Training Queue                 │
│  ┌────────────────────────────────┐    │
│  │ Scaffold  │ Unfit │ Progress   │    │
│  ├────────────────────────────────┤    │
│  │ SLR       │  147  │ ████░░ 60% │    │
│  │ MLR       │   88  │ █░░░░░ 20% │    │
│  └────────────────────────────────┘    │
│                                         │
│  [Batch Train All (294 jobs)] [Config ⚙]│
│  Max Concurrency: [10]                  │
│  Timeout per job: [300s]                │
│                                         │
└─────────────────────────────────────────┘
```

### Batch Training Configuration Modal

```
┌─────────────────────────────────────────┐
│  Batch Training Configuration           │
├─────────────────────────────────────────┤
│  Jobs to train: 294                     │
│                                         │
│  Concurrency:                           │
│  [10] parallel jobs (max 100)           │
│                                         │
│  Execution:                             │
│  ○ Lambda (< 15 min jobs)               │
│  ○ ECS Fargate (> 15 min jobs)          │
│                                         │
│  Priority:                              │
│  ○ Latest slices first                  │
│  ○ Oldest slices first                  │
│  ○ Smallest slices first                │
│                                         │
│  Estimated time: ~8 minutes             │
│  Estimated cost: $0.42                  │
│                                         │
│  [Cancel] [Start Batch Training]        │
└─────────────────────────────────────────┘
```

## Implementation Phases

### Session 5 (Admin UI)
- Create admin dashboard page
- Build UI for pipeline orchestration
- Call Lambda functions via API Gateway
- Display training queue status
- Real-time progress updates

### Session 6 (Lambda Functions)
- Implement 5 Lambda functions
- Set up Step Functions for batch coordination
- Configure DynamoDB Streams for monitoring
- Add CloudWatch logging and metrics
- Create API Gateway endpoints

### Session 7 (Production)
- Add authentication/authorization
- Implement rate limiting
- Add cost monitoring
- Create admin alerts
- Documentation and runbooks

## Database Schema Updates

### ModelFits Table (add index)
```
GSI-2: trainingStatus-index
  PK: trainingStatus
  SK: createdAt
  Purpose: Query all unfit/fitting/failed models quickly
```

### Prophets Table (add field)
```
status: 'pending_training' | 'training' | 'active' | 'inactive' | 'failed'
```

### TrainingJobs Table (NEW - optional)
```
PK: jobId
Attributes:
  - batchId
  - modelFitId
  - scaffoldId
  - assetId
  - status (queued | running | completed | failed)
  - startedAt
  - completedAt
  - executionArn (Step Functions ARN)
  - logs (CloudWatch log stream)
```

## Cost Estimation

### Per-Asset Pipeline (e.g., DJIA)
- **Slice Generation**: 1 Lambda invocation × $0.0000002 = $0.0000002
- **Prophet Generation**: 1 Lambda invocation × $0.0000002 = $0.0000002
- **Training (294 jobs @ 2s each)**: 
  - 294 × 2s × 1GB × $0.0000166667/GB-s = $0.0098
- **Storage (294 parameter files @ 1KB)**: 
  - 294KB × $0.023/GB/month = $0.0000068
- **DynamoDB writes**: 
  - 294 slices + 588 fits/prophets × $0.00000125 = $0.0011

**Total per asset**: ~$0.011 (1.1 cents)

For 100 assets: ~$1.10

## Next Steps

1. ✅ Create local orchestration script (done)
2. Run script for DJIA to populate system
3. Session 5: Build admin UI
4. Session 6: Implement Lambda functions
5. Session 7: Production hardening

## Usage Example

```bash
# Initialize DJIA with full pipeline
npm run orchestrate-pipeline DJIA public/djia_sample.csv

# Output:
# ✓ Dataset created
# ✓ 147 slices created
# ✓ 294 model fits created (unfit)
# ✓ 294 prophets created (pending_training)
# Ready for batch training!
```
