# ChasingProphets Platform

A modern web platform for machine learning-based financial market predictions. Train multiple prophet models on historical price data and visualize their predictions in real-time.

## Features

- **784 Prophet Models** - Automated training of SLR/MLR models across multiple time windows
- **Client-Side Inference** - Fast predictions executed directly in the browser
- **Performance Tracking** - MAPE, RMSE, MAE metrics across 20/60/120/240-day windows
- **Real-time Visualization** - Interactive charts showing predictions vs actual prices
- **User Authentication** - AWS Cognito-based secure access
- **Leaderboard** - Compare prophet performance at a glance

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **State Management**: React Query
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: AWS DynamoDB (8 tables)
- **Storage**: AWS S3 (model parameters + inference scripts)
- **Auth**: AWS Cognito
- **ML**: Python scikit-learn (training), JavaScript (inference)

## Quick Start (GitHub Codespaces)

### Prerequisites

- GitHub account
- AWS Account with programmatic access
- AWS CLI credentials (Access Key ID + Secret Access Key)

### Step 1: Open in Codespaces

Click the green "Code" button → "Codespaces" → "Create codespace on main"

### Step 2: Configure AWS Credentials

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Complete Initialization

This single command will build everything from scratch:

```bash
cd /workspaces/chasingprophets
source scripts/load-env.sh
npx tsx scripts/init-clean.ts
```

**What this does (takes ~10-15 minutes):**
1. ✅ Creates 8 DynamoDB tables
2. ✅ Creates S3 bucket for models
3. ✅ Uploads training + inference scripts
4. ✅ Downloads DJIA & S&P 500 historical data
5. ✅ Sets up Cognito user pool
6. ✅ Creates 2 model scaffolds (SLR, MLR)
7. ✅ Creates 784 prophet models
8. ✅ Trains all 784 models
9. ✅ Calculates performance metrics

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Login

Open the app (usually http://localhost:5173) and login with:
- **Username**: `admin@chasingprophets.local`
- **Password**: `Admin123!`

## Project Structure

```
chasingprophets/
├── src/                          # Frontend React application
│   ├── pages/                    # Page components
│   │   ├── Prophets/            # Prophet leaderboard & detail
│   │   └── Auth/                # Login/register
│   ├── services/                # API service layer
│   ├── utils/                   # Utilities (localInference.ts!)
│   └── types/                   # TypeScript definitions
├── lambda/                      # Model training & inference
│   └── scaffolds/
│       ├── slr/                 # Simple Linear Regression
│       │   ├── train.py         # Python training script
│       │   └── inference.js     # JavaScript inference
│       └── mlr/                 # Multiple Linear Regression
│           ├── train.py
│           └── inference.js
├── scripts/                     # Setup & admin scripts
│   ├── init-clean.ts           # 🌟 MASTER INIT SCRIPT
│   ├── admin/
│   │   ├── train-models.ts     # Train all prophets
│   │   └── calculate-performance.py
│   └── aws/
│       └── teardown-all.sh     # Delete all AWS resources
└── .env                        # Auto-generated Cognito config
```

## Architecture

### Data Flow
1. **Training** (Python on EC2/local):
   - Downloads OHLCV data from S3
   - Trains scikit-learn models
   - Saves parameters as JSON to S3

2. **Inference** (JavaScript in browser):
   - Loads parameters.json from S3
   - Loads inference.js from S3
   - Executes predictions client-side
   - Displays on prophet detail page

### Database Schema (DynamoDB)
- **Assets** - DJIA, SPX market data
- **Datasets** - Time-series datasets
- **DataSlices** - Training/test data splits
- **ModelScaffolds** - SLR, MLR configurations
- **ModelFits** - Trained model metadata
- **Prophets** - Individual prophet instances
- **Performance** - MAPE/RMSE/MAE metrics
- **ProphetPerformanceSummary** - Aggregated stats

## Common Commands

### Full Teardown + Rebuild
```bash
# Delete everything
source scripts/load-env.sh
printf "DELETE\n" | bash scripts/aws/teardown-all.sh

# Rebuild from scratch
npx tsx scripts/init-clean.ts
```

### Train All Models (after changes)
```bash
source scripts/load-env.sh
npx tsx scripts/admin/train-models.ts
```

### Recalculate Performance
```bash
source scripts/load-env.sh
python scripts/admin/calculate-performance.py
```

### Development Server
```bash
npm run dev
```

## AWS IAM Permissions Required

Your AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:BatchWriteItem",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "cognito-idp:CreateUserPool",
        "cognito-idp:DeleteUserPool",
        "cognito-idp:CreateUserPoolClient",
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword"
      ],
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Cognito Login Issues
If you see "User pool does not exist":
1. Restart Vite to pick up new Cognito credentials: `npm run dev`
2. Check `.env` has correct `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`

### Inference Not Working
If prophet detail page shows errors:
1. Check browser console for specific error
2. Verify inference.js files uploaded correctly:
   ```bash
   source scripts/load-env.sh
   aws s3 ls s3://chasingprophets-models-us-east-1/models/scaffolds/slr/
   ```
3. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)

### Training Failures
If models fail to train:
1. Check Python dependencies: `pip install scikit-learn numpy pandas`
2. Verify S3 data exists:
   ```bash
   aws s3 ls s3://chasingprophets-data-dev/data/assets/DJIA/
   ```

### "Table Already Exists" Error
Run teardown first:
```bash
source scripts/load-env.sh
printf "DELETE\n" | bash scripts/aws/teardown-all.sh
```

## Key Files

- **`scripts/init-clean.ts`** - Master initialization script
- **`src/utils/localInference.ts`** - Client-side inference engine  
- **`lambda/scaffolds/*/inference.js`** - Model inference functions
- **`.env`** - Auto-generated Cognito credentials (DO NOT commit)

## Development Notes

### Inference Function Signature
**Critical**: Inference scripts use `predict(input, parameters)` order:
```javascript
// lambda/scaffolds/slr/inference.js
function predict(input, parameters) {
  const { slope, intercept, input_field } = parameters;
  const x = input[input_field];
  return slope * x + intercept;
}
```

Frontend calls with matching order:
```typescript
// src/utils/localInference.ts
const result = predictFunction(input, modelParams);
```

### Model Training Data Format
Models are trained on **actual prices**, not returns:
```json
{
  "date": "2024-01-15",
  "open": 37234.43,
  "high": 37456.89,
  "low": 37123.45,
  "close": 37389.17,
  "volume": 345678900
}
```

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
1. All 784 models train successfully
2. Frontend inference works without errors
3. No AWS credentials committed to repo

### AWS Setup

1. **Create an AWS Account**
   - Go to [AWS Console](https://aws.amazon.com)
   - Click "Create an AWS Account"
   - Follow the sign-up process

2. **Create an IAM User**
   - Go to [IAM Console](https://console.aws.amazon.com/iam)
   - Click "Users" in the left sidebar
   - Click "Create user"
   - Enter username (e.g., "chasingprophets-app")
   - Click "Next"
   - Select "Attach policies directly"
   - Create new policy with the following JSON:
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Effect": "Allow",
                 "Action": [
                     "dynamodb:CreateTable",
                     "dynamodb:DeleteTable",
                     "dynamodb:DescribeTable",
                     "dynamodb:GetItem",
                     "dynamodb:PutItem",
                     "dynamodb:Query",
                     "dynamodb:Scan",
                     "dynamodb:UpdateItem",
                     "cognito-idp:CreateUserPool",
                     "cognito-idp:DeleteUserPool",
                     "cognito-idp:CreateUserPoolClient",
                     "cognito-idp:AdminCreateUser",
                     "cognito-idp:ListUserPools"
                 ],
                 "Resource": [
                     "arn:aws:dynamodb:*:*:table/ChasingProphets-*",
                     "arn:aws:cognito-idp:*:*:userpool/*"
                 ]
             }
         ]
     }
     ```
   - Name the policy "ChasingProphets-Policy"
   - Attach the policy to your user
   - Click "Next" and "Create user"

3. **Generate Access Keys**
   - Select your new user
   - Go to "Security credentials" tab
   - Under "Access keys", click "Create access key"
   - Select "Application running outside AWS"
   - Click "Next" and "Create access key"
   - **IMPORTANT**: Download the CSV file or copy the Access Key ID and Secret Access Key
   - Store these securely, you won't see them again!

### Application Setup (one-command, destructive by default)

This repository supports a single-command preflight that will prepare a fresh Codespace, install tools, and provision AWS resources for development. WARNING: the default behavior is destructive — it will delete and recreate Cognito user pools and DynamoDB tables named for this project.

1. Copy the example `.env` and add your AWS credentials (required for provisioning):

```bash
cp .env.example .env
# Edit .env and set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
# Leave VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID blank — the preflight will populate them.
```

2. Run the automated preflight (single command):

```bash
# WARNING: destructive — deletes + recreates Cognito pools and DynamoDB tables
chmod +x scripts/*.sh
bash scripts/preflight.sh
```

What the preflight does (default):
- Installs AWS CLI and Node/npm if missing
- Loads and exports `.env` variables
- Validates AWS credentials
- Runs `npm install`
- Deletes existing ChasingProphets DynamoDB tables and Cognito user pools, recreates them, and seeds data (2015–2025 OHLCV for 5 assets)
- Updates `.env` with the created Cognito user-pool ID and app client ID

3. Start the dev server after provisioning completes:

```bash
npm run dev
# open the URL Vite prints (e.g. http://localhost:5173/)
```

4. Default credentials (created by setup):

- Email: admin@chasingprophets.local
- Temporary password: Admin123!

Notes and quick alternatives
- If you do NOT want to touch AWS, leave `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` blank in `.env`. The frontend will fall back to local generated JSON data and the app will run without provisioning.
- If you want the same flow but non-destructive in future, edit `scripts/preflight.sh` to call `./scripts/aws-setup.sh` without `--reset` or add an `AUTO_SETUP` guard.
- Rotate access keys after testing and consider using short-lived credentials or a secrets manager for production.

## Project Structure

```
chasingprophets/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API and database services
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types and interfaces
├── scripts/           # Setup and utility scripts
├── public/            # Static assets
└── infra/            # Infrastructure setup files
```

## Database Schema

### Assets Table
- Primary Key: `ticker` (String)
- GSI: MarketIndex
  - Primary Key: `market` (String)
- Attributes:
  - name (String)
  - description (String)
  - market (String)
  - createdAt (String, ISO timestamp)

### Asset Prices Table
- Primary Key: Composite key
  - Hash Key: `ticker` (String) - References Assets table
  - Range Key: `date` (String, ISO format)
- Attributes:
  - open (Number)
  - high (Number)
  - low (Number)
  - close (Number)
  - volume (Number)
  - lastUpdated (String, ISO timestamp)

### Users Table
- Primary Key: `userId` (String)
- GSI: EmailIndex
  - Primary Key: `email` (String)
- Attributes:
  - username (String)
  - email (String)
  - role (String)
  - createdAt (String, ISO timestamp)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run setup-db` - Initialize DynamoDB tables
- `npm run test` - Run tests
- `npm run lint` - Run linting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
