# Chasing Prophets - Production Architecture (v1 Alpha)

**Date:** November 4, 2025  
**Status:** Design Finalized  
**Environment:** Dev (current codespace) → Prod (to be deployed)

---

## System Overview

Chasing Prophets is a financial prediction ecosystem enabling users to discover, evaluate, and utilize machine learning "prophets" (trained models + forecasting methods) for asset price prediction. The alpha focuses on:

- **Assets**: Financial instruments (stocks, indices)
- **Datasets**: OHLCV pricing data (live and historical)
- **Data Slices**: Fixed, immutable training/evaluation windows
- **Model Scaffolds**: Reusable model architectures (SLR, GARCH, LSTM, etc.)
- **Model Fits**: Trained models (scaffolds + data slices)
- **Prophets**: Deployed prediction engines (model fits + forecasting methods + performance tracking)

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Libraries**: Plotly.js (charts), custom CSS
- **State Management**: React Context (Auth, Theme)
- **ML Inference**: TensorFlow.js (client-side model execution)
- **Hosting**: AWS Amplify

### Backend
- **API Layer**: AWS API Gateway (REST)
- **Compute**: AWS Lambda (Python 3.11+)
- **Training Jobs**: AWS ECS Fargate (custom containers)
- **Scheduling**: AWS EventBridge (daily cron jobs)
- **Authentication**: AWS Cognito (User Pools + Identity Pools)

### Data & Storage
- **Database**: AWS DynamoDB (multiple tables, pay-per-request)
- **Object Storage**: AWS S3 (single bucket, multiple prefixes)
- **Caching**: Browser-level (IndexedDB for models, localStorage for user prefs)

### Security
- **Access Control**: Cognito groups (admin/user/guest) + IAM policies
- **Model Protection**: S3 pre-signed URLs (short-lived, 5-15 min expiration)
- **API Authorization**: Cognito JWT tokens validated by API Gateway authorizer
- **Secrets**: AWS Secrets Manager (API keys, DB credentials)

### Development & Deployment
- **Version Control**: GitHub
- **Deployment (Dev)**: Manual (Amplify CLI or Console)
- **Deployment (Prod)**: Amplify CI/CD from Git repo (planned)
- **Infrastructure**: Manual AWS Console (IaC with CDK/Terraform planned for prod)

---

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ React App    │  │ TensorFlow.js│  │ IndexedDB (models)  │  │
│  │ (Amplify)    │  │ (inference)  │  │ localStorage (prefs)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
└─────────┼──────────────────┼──────────────────────────────────┘
          │                  │
          │ HTTPS (JWT)      │ HTTPS (pre-signed URLs)
          │                  │
┌─────────▼──────────────────▼──────────────────────────────────┐
│                         AWS CLOUD                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              API Gateway (REST Endpoints)                │ │
│  │  /assets, /prophets, /model-fits, /admin/*              │ │
│  │  Authorizer: Cognito User Pools                         │ │
│  └────────┬────────────────────────────────┬────────────────┘ │
│           │                                 │                  │
│  ┌────────▼────────┐              ┌────────▼────────────────┐ │
│  │ Lambda Functions│              │ Cognito User Pools      │ │
│  ├─────────────────┤              │ - admin group          │ │
│  │ CRUD APIs       │              │ - user group           │ │
│  │ Presign S3 URLs │              │ - guest group          │ │
│  │ Trigger Training│              │ Google OAuth (future)  │ │
│  │ Prophet Updates │              └────────────────────────┘ │
│  └────────┬────────┘                                          │
│           │                                                    │
│  ┌────────▼─────────────────────────────────────────────────┐ │
│  │                   DynamoDB Tables                        │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ • Assets          • ModelScaffolds    • Users           │ │
│  │ • Datasets        • ModelFits         • PerformanceMetrics│ │
│  │ • DataSlices      • Prophets                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              S3 Bucket: chasing-prophets                 │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ models/          • TensorFlow.js models (model.json, .bin)│ │
│  │ data/            • OHLCV CSVs, seed datasets             │ │
│  │ scripts/         • Admin-uploaded training scripts       │ │
│  │ static/          • Static assets, exports                │ │
│  │                                                           │ │
│  │ Access: Pre-signed URLs (15 min expiration)              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │             EventBridge Scheduled Rules                  │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Daily 6am ET: Trigger data pipeline Lambda              │ │
│  │   └─> Pull latest OHLCV from provider (Yahoo Finance)   │ │
│  │   └─> Update Datasets table & S3                        │ │
│  │   └─> Trigger prophet update Lambda                     │ │
│  │       └─> For each Prophet: run inference, calc metrics │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          ECS Fargate (Training Jobs)                     │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Triggered by: Admin UI -> Lambda -> ECS Task            │ │
│  │ Workflow:                                                │ │
│  │   1. Pull data slice from S3                            │ │
│  │   2. Load scaffold code from S3                         │ │
│  │   3. Train model (Python/TensorFlow)                    │ │
│  │   4. Convert to TensorFlow.js                           │ │
│  │   5. Upload model to S3 (models/ prefix)                │ │
│  │   6. Update ModelFit status in DynamoDB                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### 1. User Authentication Flow
```
User → Cognito Login → JWT Token → Store in Context
                                  ↓
                    API Gateway validates JWT on each request
                                  ↓
                    Lambda checks user group (admin/user/guest)
                                  ↓
                    Return data filtered by permissions
```

### 2. Prophet Inference Flow (Client-Side)
```
User visits Prophet Page
  ↓
Frontend calls GET /prophets/{id} (API Gateway)
  ↓
Lambda returns:
  - Prophet metadata
  - ModelFit reference
  - Pre-signed URL for model.json (expires in 15 min)
  - Last 480 days of input data
  ↓
Frontend downloads model from S3 (via pre-signed URL)
  ↓
TensorFlow.js loads model in browser
  ↓
Run inference on input data (client CPU/WebGL)
  ↓
Display predictions vs actuals in Plotly chart
```

**Security Note**: Pre-signed URLs expire quickly. Model must be downloaded and used within 15 minutes. An attacker would need to:
1. Intercept the pre-signed URL (HTTPS encrypted)
2. Download within expiration window
3. Reverse-engineer TensorFlow.js binary format

This provides reasonable protection for v1. For proprietary models later, use server-side inference.

### 3. Model Training Flow (Admin)
```
Admin navigates to Admin Panel → Model Fits → Create New
  ↓
Selects: Scaffold + Asset + Data Slice
  ↓
Frontend calls POST /admin/model-fits (API Gateway)
  ↓
Lambda creates ModelFit record (status: 'unfit')
  ↓
Lambda triggers ECS Fargate task:
  - Container image: custom-trainer:latest
  - Environment: MODEL_FIT_ID, S3_BUCKET, etc.
  ↓
ECS Task:
  1. Load scaffold Python code from S3
  2. Load data slice from S3
  3. Train model using scaffold.train()
  4. Convert to TensorFlow.js format
  5. Upload to S3: models/{model_fit_id}/model.json
  6. Update DynamoDB: status = 'fit', modelUrl, modelSize
  ↓
Admin sees status update in UI (polls or uses WebSocket future feature)
```

### 4. Daily Prophet Update Flow
```
EventBridge: 6:00 AM ET daily
  ↓
Trigger Lambda: data-pipeline
  ↓
Pull latest OHLCV from Yahoo Finance API
  ↓
Update Datasets table + upload to S3: data/djia_latest.csv
  ↓
Trigger Lambda: prophet-updater
  ↓
For each active Prophet:
  - Load model from S3
  - Fetch latest input data (up to 480 days)
  - Run inference
  - Calculate performance metrics (MAE, RMSE, directional accuracy)
  - Store in PerformanceMetrics table (partition key: prophetId, sort key: date)
  ↓
Metrics displayed on Prophet detail pages
```

### 5. Admin Code Upload Flow
```
Admin navigates to Admin Panel → Model Scaffolds → Create/Edit
  ↓
Uploads Python file (scaffold training code)
  ↓
Frontend calls POST /admin/scaffolds/upload (multipart/form-data)
  ↓
Lambda receives file:
  - Validates Python syntax (basic check)
  - Uploads to S3: scripts/scaffolds/{scaffold_id}.py
  - Creates/updates ModelScaffold record in DynamoDB
  ↓
Scaffold available for Model Fit creation
```

**Security**: Lambda executes admin-uploaded code. For v1, trust admins. For v2+, add sandboxing (AWS Batch, isolated containers, code review).

---

## DynamoDB Table Design (High-Level)

### Table: Assets
- **PK**: `assetId` (e.g., "DJIA", "AAPL")
- **Attributes**: name, type (index, stock), sector, description, isActive
- **GSI**: None (query by PK only)

### Table: Datasets
- **PK**: `datasetId` (e.g., "DJIA_OHLCV")
- **Attributes**: assetId, type (OHLCV, fundamentals), startDate, endDate, s3Path, isLive, lastUpdated
- **GSI-1**: `assetId` (query all datasets for an asset)

### Table: DataSlices
- **PK**: `dataSliceId` (e.g., "DJIA_2020-01-01_2020-12-31")
- **SK**: `version` (for compound slices)
- **Attributes**: datasetId, startDate, endDate, sliceType (simple/compound), s3Path (if cached), metadata
- **GSI-1**: `datasetId` (query slices by dataset)

### Table: ModelScaffolds
- **PK**: `scaffoldId` (e.g., "SLR-LAG-1", "GARCH-1-1")
- **Attributes**: name, description, formulaLatex, inputShape, outputShape, inferenceEngine (tfjs/coefficients/server), s3CodePath, config (JSON)
- **GSI**: None

### Table: ModelFits
- **PK**: `modelFitId` (UUID or composite like "GARCH-1-1_DJIA_2020-01-01_2020-12-31")
- **Attributes**: scaffoldId, assetId, dataSliceId, status (unfit/fitting/fit), modelUrl (S3 pre-signed base), modelSize, trainingMetrics (JSON), createdAt, updatedAt
- **GSI-1**: `scaffoldId` (find all fits for a scaffold)
- **GSI-2**: `assetId-status` (find all 'fit' models for an asset)

### Table: Prophets
- **PK**: `prophetId` (UUID or descriptive)
- **Attributes**: name, description, modelFitId, assetId, forecastMethod (direct/iterative), isActive, createdBy, createdAt
- **GSI-1**: `assetId` (find all prophets for an asset)
- **GSI-2**: `modelFitId` (find all prophets using a model fit)

### Table: PerformanceMetrics
- **PK**: `prophetId`
- **SK**: `date` (YYYY-MM-DD)
- **Attributes**: predicted, actual, error, mae, rmse, directionalAccuracy, metadata (JSON)
- **TTL**: Optional (expire old metrics after 2 years)

### Table: Users
- **PK**: `userId` (Cognito sub UUID)
- **Attributes**: email, name, role (admin/user/guest), preferences (JSON), createdAt, lastLogin
- **GSI-1**: `email` (lookup by email)

---

## API Endpoints (REST)

### Public/Guest Endpoints
- `GET /assets` - List all assets
- `GET /assets/{assetId}` - Asset details
- `GET /prophets` - List public prophets (with filtering)
- `GET /prophets/{prophetId}` - Prophet details + pre-signed model URL

### User Endpoints (requires authentication)
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update preferences
- `GET /user/favorites` - User's favorited prophets (future)
- `POST /prophets/{prophetId}/favorite` - Add to favorites

### Admin Endpoints (requires admin group)
- **Assets**
  - `POST /admin/assets` - Create asset
  - `PUT /admin/assets/{assetId}` - Update asset
  - `DELETE /admin/assets/{assetId}` - Deactivate asset

- **Datasets**
  - `POST /admin/datasets` - Create/upload dataset
  - `PUT /admin/datasets/{datasetId}` - Update dataset
  - `POST /admin/datasets/{datasetId}/refresh` - Trigger data pull

- **Model Scaffolds**
  - `GET /admin/scaffolds` - List all scaffolds
  - `POST /admin/scaffolds` - Create scaffold (with code upload)
  - `PUT /admin/scaffolds/{scaffoldId}` - Update scaffold
  - `POST /admin/scaffolds/upload` - Upload scaffold code

- **Model Fits**
  - `POST /admin/model-fits` - Create model fit (triggers training)
  - `GET /admin/model-fits/{modelFitId}` - Get fit status
  - `DELETE /admin/model-fits/{modelFitId}` - Delete fit

- **Prophets**
  - `POST /admin/prophets` - Create prophet
  - `PUT /admin/prophets/{prophetId}` - Update prophet
  - `DELETE /admin/prophets/{prophetId}` - Deactivate prophet
  - `POST /admin/prophets/{prophetId}/refresh` - Manually trigger update

- **System**
  - `POST /admin/system/update-all-prophets` - Manually trigger daily update job
  - `GET /admin/system/status` - System health check

---

## S3 Bucket Structure

**Bucket Name**: `chasing-prophets` (or `chasing-prophets-dev` / `chasing-prophets-prod`)

```
chasing-prophets/
├── models/
│   ├── {modelFitId}/
│   │   ├── model.json           # TensorFlow.js model topology
│   │   ├── group1-shard1of1.bin # Model weights
│   │   └── metadata.json        # Custom metadata (training metrics, dates)
│   └── coefficients/
│       └── {modelFitId}.json    # For non-TF models (GARCH coefficients)
│
├── data/
│   ├── assets/
│   │   ├── DJIA/
│   │   │   ├── ohlcv_full.csv   # Complete historical data
│   │   │   └── ohlcv_2024.csv   # Annual partitions
│   │   └── SPX/
│   │       └── ohlcv_full.csv
│   └── slices/
│       └── {dataSliceId}.csv    # Cached slices (optional optimization)
│
├── scripts/
│   ├── scaffolds/
│   │   └── {scaffoldId}.py      # Admin-uploaded scaffold training code
│   ├── pullers/
│   │   └── yahoo_finance_puller.py  # Data ingestion scripts
│   └── utils/
│       └── preprocessing.py     # Shared utilities
│
└── static/
    ├── exports/                 # User-generated exports (future)
    └── uploads/                 # Temporary admin uploads
```

---

## Security & IAM

### Cognito User Pools
- **Groups**: `admin`, `user`, `guest`
- **Custom Attributes**: `custom:role` (redundant with groups, for display)
- **MFA**: Optional (enable for admins in prod)

### IAM Roles

**Lambda Execution Role** (`ChProphets-Lambda-Role`)
- `dynamodb:GetItem`, `PutItem`, `Query`, `Scan`, `UpdateItem` on all tables
- `s3:GetObject`, `PutObject` on `chasing-prophets/*`
- `s3:GetObjectPresignedUrl` (via SDK, not explicit policy)
- `ecs:RunTask` (for triggering training jobs)
- `logs:CreateLogGroup`, `PutLogEvents`

**ECS Task Role** (`ChProphets-Trainer-Role`)
- `s3:GetObject`, `PutObject` on `chasing-prophets/models/*`, `chasing-prophets/data/*`, `chasing-prophets/scripts/*`
- `dynamodb:UpdateItem` on `ModelFits` table
- `secretsmanager:GetSecretValue` (for API keys)
- `logs:CreateLogStream`, `PutLogEvents`

**Cognito Authenticated Role** (`ChProphets-User-Role`)
- (Optional) If using Identity Pools for direct S3 access
- Currently NOT needed — all S3 access via pre-signed URLs from Lambda

**API Gateway Authorizer**
- Type: Cognito User Pools
- Token source: `Authorization` header (Bearer token)
- Validates JWT on every request

---

## Deployment Process

### Development (Current)
1. Code in VS Code (codespace)
2. Test locally with `npm run dev` (Vite dev server)
3. Manual deployment:
   - Build: `npm run build`
   - Deploy to Amplify: `amplify publish` or upload `dist/` via Console

### Production (Future)
1. Push to `main` branch on GitHub
2. Amplify CI/CD auto-triggers:
   - Detects changes
   - Runs `npm install` → `npm run build`
   - Deploys to Amplify hosting
   - Updates CloudFront cache
3. Backend (Lambda, ECS) deployed via:
   - AWS CDK (Infrastructure as Code) - recommended
   - Manual for initial setup, then CDK for updates

### Environment Variables
**Frontend** (Amplify Environment Variables):
- `VITE_API_GATEWAY_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_S3_BUCKET_NAME`
- `VITE_REGION`

**Backend** (Lambda Environment Variables):
- `DYNAMODB_REGION`
- `S3_BUCKET_NAME`
- `ECS_CLUSTER_NAME`
- `ECS_TASK_DEFINITION`
- `YAHOO_FINANCE_API_KEY` (in Secrets Manager, not env var)

---

## Cost Estimation (v1 Alpha, <$10/month budget)

### AWS Free Tier (first 12 months)
- **Amplify**: 1,000 build minutes/month, 15 GB served/month (free tier)
- **Lambda**: 1M requests/month, 400K GB-seconds compute (free tier)
- **DynamoDB**: 25 GB storage, 200M requests/month (always free)
- **S3**: 5 GB storage, 20K GET, 2K PUT (first 12 months)
- **Cognito**: 50K MAUs (always free)

### Estimated Usage (Dev/Early Prod)
- **Amplify**: ~10 deploys/month, <1 GB served → **$0**
- **API Gateway**: ~10K requests/month → **$0.04**
- **Lambda**: ~50K invocations/month, avg 512 MB, 3s duration → **$0.50**
- **DynamoDB**: 
  - Storage: <1 GB → **$0.25**
  - Requests: <10M/month → **$1.25**
- **S3**: 
  - Storage: <5 GB → **$0.12**
  - Transfers: <10 GB → **$0.90**
- **ECS Fargate**: 
  - Training: 10 tasks/month × 0.5 vCPU × 1 GB × 5 min → **$0.15**
- **EventBridge**: Scheduled rules are free
- **Secrets Manager**: 1 secret → **$0.40**

**Total: ~$3.61/month** (well within budget!)

### Cost Optimization Tips
- Use DynamoDB on-demand (pay per request, no reserved capacity)
- Enable S3 Intelligent-Tiering for models (auto-archive old models)
- Use Lambda SnapStart for faster cold starts (free)
- Keep model files small (<10 MB) to minimize S3 transfer costs
- Cache models in browser (IndexedDB) to reduce repeated downloads

---

## Future Enhancements (Post-Alpha)

### Phase 2: Advanced Features
- **Forecasts**: User-constructed multi-prophet predictions
- **Social Features**: Prophet leaderboards, user comments, sharing
- **Prophet Marketplace**: Users publish/monetize their own prophets
- **Real-time Updates**: WebSocket connections for live prophet performance
- **Advanced Models**: GPT-based text analysis, computer vision for charts

### Phase 3: Scale & Monetization
- **Stripe Integration**: Subscription tiers (free/pro/enterprise)
- **Multi-region Deployment**: CloudFront + regional Lambda@Edge
- **Advanced Security**: Model encryption at rest (KMS), DRM-style protection
- **SageMaker Integration**: GPU training for large models
- **Data Partnerships**: Bloomberg, Reuters feeds (premium datasets)

### Phase 4: Platform Expansion
- **Asset Classes**: Crypto, forex, commodities, options
- **Custom Datasets**: User-uploaded datasets (with privacy controls)
- **Collaborative Forecasting**: Teams, model ensembles
- **White-label**: Enterprise customers can deploy private instances

---

## Open Questions & Decisions Deferred

1. **Model Protection**: Pre-signed URLs provide basic security. For truly proprietary models, consider:
   - Server-side inference only (no client download)
   - Encrypted models with client-side decryption key (complex)
   - Obfuscated TensorFlow.js models (minimal protection)
   - **Decision**: Start with pre-signed URLs, revisit if needed

2. **Git vs AWS-Only Deployment**: 
   - Amplify CAN deploy from Git (recommended for CI/CD)
   - Amplify CAN deploy from manual zip upload (OK for quick tests)
   - **Recommendation**: Use Git (GitHub) as source of truth. Amplify watches repo for changes.
   - You don't need a separate Git server — use GitHub (free for public/private repos)

3. **Dev vs Prod Separation**:
   - **Dev**: Current codespace → Amplify dev environment
   - **Prod**: Separate Amplify environment, same AWS account (or separate account later)
   - Use Amplify environment branches: `dev` environment from `dev` branch, `prod` from `main`

4. **CDN/CloudFront for Models**: Deferred to Phase 2 when traffic increases

5. **IaC Strategy**: Manual for v1, CDK for prod later

---

## Summary of Finalized Decisions

| Component | Decision |
|-----------|----------|
| **Hosting** | AWS Amplify (React/Vite) |
| **API** | API Gateway + Lambda (Python) |
| **Database** | DynamoDB (multiple tables) |
| **Storage** | S3 (single bucket, multiple prefixes) |
| **Training** | ECS Fargate (custom containers) |
| **Admin Code Execution** | Lambda (trusted admin code) |
| **Model Security** | Pre-signed URLs (15 min expiration) |
| **Auth** | Cognito User Pools + groups |
| **Scheduling** | EventBridge (daily cron) |
| **Deployment (Dev)** | Manual (Amplify CLI/Console) |
| **Deployment (Prod)** | Amplify CI/CD from GitHub |
| **Environments** | Dev (current) + Prod (separate Amplify env) |
| **Budget** | <$10/month (achievable with free tier) |

---

**Next Steps**: Move to **(2) Frontend Design & User Flow** when ready.

