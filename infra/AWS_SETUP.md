# AWS Setup Instructions for ChasingProphets

## 1. DynamoDB Tables Setup

### Users Table
```bash
aws dynamodb create-table \
    --table-name ChasingProphets-Users \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"EmailIndex\",
                \"KeySchema\": [{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]"
```

### Assets Table
```bash
aws dynamodb create-table \
    --table-name ChasingProphets-Assets \
    --attribute-definitions \
        AttributeName=symbol,AttributeType=S \
        AttributeName=market,AttributeType=S \
        AttributeName=lastUpdated,AttributeType=S \
    --key-schema \
        AttributeName=symbol,KeyType=HASH \
        AttributeName=market,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"MarketLastUpdatedIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"market\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"lastUpdated\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]"
```

## 2. Cognito User Pool Setup

1. Create User Pool
```bash
aws cognito-idp create-user-pool \
    --pool-name ChasingProphets-Users \
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":true}}' \
    --schema '[{"Name":"email","Required":true,"Mutable":true},{"Name":"custom:role","Required":false,"Mutable":true}]' \
    --auto-verified-attributes email
```

2. Create App Client
```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id YOUR_USER_POOL_ID \
    --client-name ChasingProphets-Web \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

3. Create Admin User
```bash
aws cognito-idp admin-create-user \
    --user-pool-id YOUR_USER_POOL_ID \
    --username admin@chasingprophets.com \
    --temporary-password Admin123! \
    --user-attributes Name=email,Value=admin@chasingprophets.com Name=custom:role,Value=admin
```

## 3. Environment Variables

Create a .env file in your project root:
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_API_ENDPOINT=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

## 4. IAM Roles and Policies

### DynamoDB Access Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ChasingProphets-Users",
                "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ChasingProphets-Assets",
                "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ChasingProphets-Users/index/*",
                "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ChasingProphets-Assets/index/*"
            ]
        }
    ]
}
```

## 5. Security Best Practices

1. Enable CloudWatch logging for all tables
2. Enable Point-in-time Recovery for both tables
3. Enable server-side encryption using AWS KMS
4. Set up IAM roles with least privilege access
5. Configure VPC endpoints for DynamoDB access
6. Enable Multi-Factor Authentication in Cognito
7. Regularly rotate access keys and review CloudTrail logs

## 6. AWS Amplify Setup (Optional)

1. Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
```

2. Configure Amplify
```bash
amplify configure
```

3. Initialize Amplify in your project
```bash
amplify init
```

4. Add authentication
```bash
amplify add auth
```

5. Push changes
```bash
amplify push
```

## 7. Local Development Setup

1. Install AWS CLI
2. Configure AWS credentials:
```bash
aws configure
```

3. Create ~/.aws/credentials:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
region = us-east-1
```

## 8. Data Migration (If needed)

1. Export existing data:
```bash
aws dynamodb scan --table-name OldTable --output json > data_backup.json
```

2. Import data to new tables:
```bash
node scripts/migrate-data.js
```

Remember to replace placeholder values like YOUR_USER_POOL_ID, REGION, and ACCOUNT_ID with your actual AWS configuration values.