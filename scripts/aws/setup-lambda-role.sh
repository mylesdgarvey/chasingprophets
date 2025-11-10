#!/bin/bash

# Script to create IAM role for Lambda functions with necessary permissions
# This role allows Lambdas to:
# - Read/write to DynamoDB tables
# - Read from S3 bucket
# - Write to CloudWatch Logs

set -e

ROLE_NAME="ChasingProphets-Lambda-ExecutionRole"
POLICY_NAME="ChasingProphets-Lambda-Policy"

echo "================================="
echo "Creating Lambda Execution Role"
echo "================================="

# Create trust policy document
cat > /tmp/lambda-trust-policy.json <<EOF
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

# Create IAM role
echo "Creating IAM role: $ROLE_NAME"
ROLE_ARN=$(aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --description "Execution role for ChasingProphets Lambda functions" \
  --query 'Role.Arn' \
  --output text 2>/dev/null || \
  aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo "Role ARN: $ROLE_ARN"

# Create policy document for DynamoDB, S3, and CloudWatch Logs
cat > /tmp/lambda-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/ChasingProphets-*"
      ]
    },
    {
      "Sid": "S3ReadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::chasingprophets-models-us-east-1",
        "arn:aws:s3:::chasingprophets-models-us-east-1/*"
      ]
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/lambda/chp-*"
    }
  ]
}
EOF

# Create or update policy
echo "Creating/updating policy: $POLICY_NAME"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Try to create policy, if it exists, create a new version
if aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/lambda-policy.json \
  --description "Permissions for ChasingProphets Lambda functions" \
  --output text 2>/dev/null; then
  echo "Created new policy: $POLICY_ARN"
else
  echo "Policy already exists, creating new version..."
  # Delete oldest non-default version if at limit (5 versions max)
  VERSIONS=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[?!IsDefaultVersion].[VersionId,CreateDate]' --output text | sort -k2 | head -1 | cut -f1)
  if [ ! -z "$VERSIONS" ]; then
    aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$VERSIONS" 2>/dev/null || true
  fi
  
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file:///tmp/lambda-policy.json \
    --set-as-default \
    --output text
  echo "Updated policy: $POLICY_ARN"
fi

# Attach policy to role
echo "Attaching policy to role..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || echo "Policy already attached"

# Wait for role to be available
echo "Waiting for role propagation (10 seconds)..."
sleep 10

echo ""
echo "================================="
echo "✅ Lambda Role Created Successfully"
echo "================================="
echo ""
echo "Role ARN: $ROLE_ARN"
echo ""
echo "To use this role with Lambda deployment, run:"
echo "export LAMBDA_ROLE_ARN=\"$ROLE_ARN\""
echo ""
echo "Or add to your .env file:"
echo "LAMBDA_ROLE_ARN=$ROLE_ARN"
echo ""

# Clean up temp files
rm -f /tmp/lambda-trust-policy.json /tmp/lambda-policy.json
