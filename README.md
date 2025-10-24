# ChasingProphets Platform

ChasingProphets is a modern web platform for tracking and analyzing financial market data, built with React, TypeScript, and AWS DynamoDB.

## Features

- Real-time market data tracking
- Asset performance visualization
- User authentication and authorization
- Market predictions (coming soon)
- Social trading features (coming soon)

## Tech Stack

- Frontend: React + TypeScript
- State Management: React Query
- Routing: React Router
- Styling: Tailwind CSS
- Charts: Recharts
- Database: AWS DynamoDB
- Auth: AWS Cognito

## Getting Started

### Prerequisites

- Node.js 18+
- AWS Account
- AWS CLI configured

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
