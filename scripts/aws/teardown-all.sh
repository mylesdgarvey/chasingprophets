#!/bin/bash
set -e

# Load environment variables
source "$(dirname "$0")/../load-env.sh"

echo "🔥 COMPLETE AWS TEARDOWN - This will DELETE EVERYTHING!"
echo "=================================================="
echo "This will delete:"
echo "  - All DynamoDB tables"
echo "  - All S3 buckets and contents"
echo "  - Cognito User Pool"
echo "  - IAM roles and policies"
echo ""
read -p "Are you ABSOLUTELY sure? Type 'DELETE' to confirm: " confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "Teardown cancelled."
    exit 1
fi

echo ""
echo "Starting complete teardown..."

# 1. Delete all DynamoDB tables
echo ""
echo "📋 Deleting DynamoDB tables..."
TABLES=(
    "ChasingProphets-Assets"
    "ChasingProphets-AssetPrices"
    "ChasingProphets-Datasets"
    "ChasingProphets-DataSlices"
    "ChasingProphets-ModelScaffolds"
    "ChasingProphets-ModelFits"
    "ChasingProphets-Prophets"
    "ChasingProphets-Forecasts"
    "ChasingProphets-Prices"
    "ChasingProphets-Performance"
    "ChasingProphets-ProphetPerformanceSummary"
)

for table in "${TABLES[@]}"; do
    echo "  Deleting table: $table"
    aws dynamodb delete-table --table-name "$table" 2>/dev/null && echo "    ✓ Deleted" || echo "    ⊘ Not found"
done

# Wait for tables to be deleted
echo "  Waiting for tables to be deleted..."
sleep 10

# 2. Delete S3 buckets
echo ""
echo "🗑️  Deleting S3 buckets..."
BUCKET_NAME="chasingprophets-models-${AWS_ACCOUNT_ID}"

echo "  Emptying bucket: $BUCKET_NAME"
aws s3 rm "s3://${BUCKET_NAME}" --recursive 2>/dev/null && echo "    ✓ Emptied" || echo "    ⊘ Not found"

echo "  Deleting bucket: $BUCKET_NAME"
aws s3 rb "s3://${BUCKET_NAME}" 2>/dev/null && echo "    ✓ Deleted" || echo "    ⊘ Not found"

# 3. Delete Cognito User Pool
echo ""
echo "👤 Deleting Cognito User Pool..."
if [ -n "$VITE_COGNITO_USER_POOL_ID" ]; then
    echo "  Deleting user pool: $VITE_COGNITO_USER_POOL_ID"
    aws cognito-idp delete-user-pool --user-pool-id "$VITE_COGNITO_USER_POOL_ID" 2>/dev/null && echo "    ✓ Deleted" || echo "    ⊘ Not found"
else
    echo "  ⊘ No user pool ID found in .env"
fi

# 4. Delete IAM roles and policies
echo ""
echo "🔐 Deleting IAM roles and policies..."
ROLES=(
    "ChasingProphetsLambdaRole"
)

for role in "${ROLES[@]}"; do
    echo "  Detaching policies from role: $role"
    # List and detach all attached policies
    POLICIES=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null || echo "")
    if [ -n "$POLICIES" ]; then
        for policy in $POLICIES; do
            echo "    Detaching: $policy"
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" 2>/dev/null || true
        done
    fi
    
    echo "  Deleting role: $role"
    aws iam delete-role --role-name "$role" 2>/dev/null && echo "    ✓ Deleted" || echo "    ⊘ Not found"
done

echo ""
echo "✅ TEARDOWN COMPLETE!"
echo ""
echo "All AWS resources have been deleted."
echo "You can now run the setup scripts to rebuild from scratch."
