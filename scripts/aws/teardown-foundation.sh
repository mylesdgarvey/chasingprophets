#!/usr/bin/env bash
set -euo pipefail

# Danger: Teardown environment resources created by init-foundation.sh
# Requires confirmation flag --force

REGION=${AWS_REGION:-us-east-1}

confirm=false
for arg in "$@"; do
  if [ "$arg" = "--force" ]; then confirm=true; fi
done

if [ "$confirm" != true ]; then
  echo "Refusing to teardown without --force" >&2
  exit 1
fi

ACC=$(aws sts get-caller-identity --query Account --output text)
BUCKET="chasing-prophets-dev-${ACC}-${REGION}"

echo "Deleting objects in S3 bucket: $BUCKET"
aws s3 rm "s3://$BUCKET" --recursive || true
echo "Deleting bucket: $BUCKET"
aws s3api delete-bucket --bucket "$BUCKET" || true

TABLES=(
  ChasingProphets-Performance
  ChasingProphets-Prophets
  ChasingProphets-ModelFits
  ChasingProphets-ModelScaffolds
  ChasingProphets-DataSlices
  ChasingProphets-Datasets
  ChasingProphets-Notifications
  ChasingProphets-AssetPrices
  ChasingProphets-Assets
  ChasingProphets-Users
)

for T in "${TABLES[@]}"; do
  if aws dynamodb describe-table --table-name "$T" >/dev/null 2>&1; then
    echo "Deleting table: $T"
    aws dynamodb delete-table --table-name "$T"
    aws dynamodb wait table-not-exists --table-name "$T" || true
  fi
done

echo "Teardown complete. (Roles and policies are left intact.)"