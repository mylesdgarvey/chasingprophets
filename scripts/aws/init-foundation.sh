#!/usr/bin/env bash
set -euo pipefail

# Initialize core AWS resources for the dev environment
# Requires AWS_* env in .env (use ./scripts/load-env.sh)

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
info(){ echo -e "${BLUE}$1${NC}"; }
ok(){ echo -e "${GREEN}$1${NC}"; }
err(){ echo -e "${RED}$1${NC}"; }

REGION=${AWS_REGION:-us-east-1}

require_aws(){
  if ! command -v aws >/dev/null 2>&1; then
    err "AWS CLI not found. Install and configure it first."; exit 1
  fi
}

account_id(){
  aws sts get-caller-identity --query Account --output text
}

ensure_bucket(){
  local BUCKET="$1"
  if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
    ok "S3 bucket exists: $BUCKET"
  else
    info "Creating S3 bucket: $BUCKET"
    if [ "$REGION" = "us-east-1" ]; then
      aws s3api create-bucket --bucket "$BUCKET"
    else
      aws s3api create-bucket --bucket "$BUCKET" --create-bucket-configuration LocationConstraint="$REGION"
    fi
    aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
    ok "Created and configured S3 bucket: $BUCKET"
  fi
}

ensure_table(){
  local NAME="$1"; shift
  local SPEC_JSON="$1"; shift
  if aws dynamodb describe-table --table-name "$NAME" >/dev/null 2>&1; then
    ok "DynamoDB table exists: $NAME"
  else
    info "Creating DynamoDB table: $NAME"
    aws dynamodb create-table --table-name "$NAME" --billing-mode PAY_PER_REQUEST $SPEC_JSON >/dev/null
    info "Waiting for table to become ACTIVE: $NAME"
    aws dynamodb wait table-exists --table-name "$NAME"
    ok "Created table: $NAME"
  fi
}

ensure_role(){
  local ROLE_NAME="$1"; shift
  local TRUST_JSON="$1"; shift
  local POLICY_ARN="$1"; shift || true
  if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    ok "IAM role exists: $ROLE_NAME"
  else
    info "Creating IAM role: $ROLE_NAME"
    aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST_JSON" >/dev/null
    ok "Created role: $ROLE_NAME"
  fi
  if [ -n "${POLICY_ARN:-}" ]; then
    if aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[?PolicyArn==`'"$POLICY_ARN"'`]' --output text | grep -q "$POLICY_ARN"; then
      ok "Policy already attached: $POLICY_ARN → $ROLE_NAME"
    else
      info "Attaching policy: $POLICY_ARN → $ROLE_NAME"
      aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN"
    fi
  fi
}

main(){
  require_aws
  ok "AWS CLI detected. Region: $REGION"

  local ACC=$(account_id)
  ok "AWS Account: $ACC"

  # S3 bucket
  local BUCKET="chasing-prophets-dev-${ACC}-${REGION}"
  ensure_bucket "$BUCKET"

  # DynamoDB tables core (existing) + new ones
  ensure_table "ChasingProphets-Assets" "--attribute-definitions AttributeName=ticker,AttributeType=S --key-schema AttributeName=ticker,KeyType=HASH"
  ensure_table "ChasingProphets-AssetPrices" "--attribute-definitions AttributeName=ticker,AttributeType=S AttributeName=date,AttributeType=S --key-schema AttributeName=ticker,KeyType=HASH AttributeName=date,KeyType=RANGE"
  ensure_table "ChasingProphets-Users" "--attribute-definitions AttributeName=userId,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH --global-secondary-indexes '[{\"IndexName\":\"EmailIndex\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]'"
  ensure_table "ChasingProphets-Notifications" "--attribute-definitions AttributeName=userId,AttributeType=S AttributeName=notificationId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH AttributeName=notificationId,KeyType=RANGE"

  ensure_table "ChasingProphets-Datasets" "--attribute-definitions AttributeName=datasetId,AttributeType=S AttributeName=assetId,AttributeType=S --key-schema AttributeName=datasetId,KeyType=HASH --global-secondary-indexes '[{\"IndexName\":\"AssetIndex\",\"KeySchema\":[{\"AttributeName\":\"assetId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]'"
  ensure_table "ChasingProphets-DataSlices" "--attribute-definitions AttributeName=dataSliceId,AttributeType=S --key-schema AttributeName=dataSliceId,KeyType=HASH"
  ensure_table "ChasingProphets-ModelScaffolds" "--attribute-definitions AttributeName=scaffoldId,AttributeType=S --key-schema AttributeName=scaffoldId,KeyType=HASH"
  ensure_table "ChasingProphets-ModelFits" "--attribute-definitions AttributeName=modelFitId,AttributeType=S AttributeName=scaffoldId,AttributeType=S AttributeName=assetId,AttributeType=S AttributeName=status,AttributeType=S --key-schema AttributeName=modelFitId,KeyType=HASH --global-secondary-indexes '[{\"IndexName\":\"ScaffoldIndex\",\"KeySchema\":[{\"AttributeName\":\"scaffoldId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"AssetStatusIndex\",\"KeySchema\":[{\"AttributeName\":\"assetId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]'"
  ensure_table "ChasingProphets-Prophets" "--attribute-definitions AttributeName=prophetId,AttributeType=S AttributeName=assetId,AttributeType=S AttributeName=modelFitId,AttributeType=S --key-schema AttributeName=prophetId,KeyType=HASH --global-secondary-indexes '[{\"IndexName\":\"AssetIndex\",\"KeySchema\":[{\"AttributeName\":\"assetId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"ModelFitIndex\",\"KeySchema\":[{\"AttributeName\":\"modelFitId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]'"
  ensure_table "ChasingProphets-Performance" "--attribute-definitions AttributeName=prophetId,AttributeType=S AttributeName=date,AttributeType=S --key-schema AttributeName=prophetId,KeyType=HASH AttributeName=date,KeyType=RANGE"

  # IAM roles
  local TRUST_LAMBDA='{ "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Principal": { "Service": "lambda.amazonaws.com" }, "Action": "sts:AssumeRole" }] }'
  local TRUST_AMP='{ "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Principal": { "Service": "amplify.amazonaws.com" }, "Action": "sts:AssumeRole" }] }'

  ensure_role "ChProphets-Lambda-Role" "$TRUST_LAMBDA"
  # Attach AWSLambdaBasicExecutionRole for logs
  aws iam attach-role-policy --role-name ChProphets-Lambda-Role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null || true
  # Attach fine-grained inline policy for DDB and S3
  cat > /tmp/chp-lambda-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:Query","dynamodb:Scan"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:PutObject"],
      "Resource": "arn:aws:s3:::chasing-prophets-dev-*-*/*"
    }
  ]
}
JSON
  if aws iam get-policy --policy-arn arn:aws:iam::$ACC:policy/ChProphets-Lambda-Access >/dev/null 2>&1; then
    info "Updating inline managed policy ChProphets-Lambda-Access"
  else
    info "Creating managed policy ChProphets-Lambda-Access"
    aws iam create-policy --policy-name ChProphets-Lambda-Access --policy-document file:///tmp/chp-lambda-policy.json >/dev/null || true
  fi
  aws iam attach-role-policy --role-name ChProphets-Lambda-Role --policy-arn arn:aws:iam::$ACC:policy/ChProphets-Lambda-Access >/dev/null || true

  ensure_role "ChProphets-AmplifyServiceRole" "$TRUST_AMP" "arn:aws:iam::aws:policy/AWSAmplifyFullAccess"

  ok "Foundation initialized. Bucket: $BUCKET"
}

main "$@"