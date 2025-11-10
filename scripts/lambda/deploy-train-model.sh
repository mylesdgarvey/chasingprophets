#!/bin/bash
# Deploy Lambda function for model training

set -e

FUNCTION_NAME="ChasingProphets-TrainModel"
REGION="${AWS_REGION:-us-east-1}"
ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ChasingProphets-LambdaExecRole"

echo "🚀 Deploying Lambda: $FUNCTION_NAME"
echo ""

# 1. Build TypeScript
echo "📦 Building TypeScript..."
cd /workspaces/chasingprophets/lambda/train-model
mkdir -p build
npx tsc index.ts \
  --outDir build \
  --target ES2020 \
  --module commonjs \
  --esModuleInterop \
  --resolveJsonModule \
  --skipLibCheck \
  --moduleResolution node
echo "  ✓ Build complete"
echo ""

# 2. Install dependencies
echo "📥 Installing dependencies..."
cd build
npm init -y > /dev/null 2>&1
npm install --production \
  @aws-sdk/client-dynamodb \
  @aws-sdk/client-s3 > /dev/null 2>&1
echo "  ✓ Dependencies installed"
echo ""

# 3. Create deployment package
echo "📦 Creating deployment package..."
zip -r /tmp/lambda-train-model.zip . > /dev/null
echo "  ✓ Package created: /tmp/lambda-train-model.zip"
echo ""

# 4. Create IAM role if it doesn't exist
echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name ChasingProphets-LambdaExecRole > /dev/null 2>&1; then
  echo "  Creating IAM role..."
  
  cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  aws iam create-role \
    --role-name ChasingProphets-LambdaExecRole \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json
  
  # Attach policies
  aws iam attach-role-policy \
    --role-name ChasingProphets-LambdaExecRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  
  aws iam attach-role-policy \
    --role-name ChasingProphets-LambdaExecRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
  
  aws iam attach-role-policy \
    --role-name ChasingProphets-LambdaExecRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
  
  echo "  ✓ IAM role created"
  echo "  ⏳ Waiting 10s for role to propagate..."
  sleep 10
else
  echo "  ✓ IAM role exists"
fi
echo ""

# 5. Create or update Lambda function
echo "⚡ Deploying Lambda function..."
if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
  echo "  Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb:///tmp/lambda-train-model.zip
  echo "  ✓ Function updated"
else
  echo "  Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs20.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb:///tmp/lambda-train-model.zip \
    --timeout 300 \
    --memory-size 512 \
    --environment "Variables={AWS_REGION=$REGION}"
  echo "  ✓ Function created"
fi
echo ""

echo "✅ Deployment complete!"
echo ""
echo "Test with:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME \\"
echo "    --payload '{\"modelFitId\":\"DJIA_20d_slice1_SLR\"}' \\"
echo "    /tmp/lambda-output.json"
