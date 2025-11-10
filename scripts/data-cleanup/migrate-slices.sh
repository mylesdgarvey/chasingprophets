#!/bin/bash
# Migrate all DJIA data slices to use dataset-djia-historical

source /workspaces/chasingprophets/scripts/load-env.sh

echo "Migrating all DJIA data slices to dataset-djia-historical..."

# Get all slice IDs
SLICE_IDS=$(aws dynamodb scan \
  --table-name ChasingProphets-DataSlices \
  --region us-east-1 \
  --filter-expression "attribute_exists(assetId) AND attribute_not_exists(datasetId)" \
  --projection-expression "dataSliceId" \
  | jq -r '.Items[].dataSliceId.S')

count=0
total=$(echo "$SLICE_IDS" | wc -l)

echo "Found $total slices to migrate"

for slice_id in $SLICE_IDS; do
  aws dynamodb update-item \
    --table-name ChasingProphets-DataSlices \
    --key "{\"dataSliceId\":{\"S\":\"$slice_id\"}}" \
    --update-expression "SET datasetId = :datasetId" \
    --expression-attribute-values '{":datasetId":{"S":"dataset-djia-historical"}}' \
    --region us-east-1 \
    --no-cli-pager \
    > /dev/null 2>&1
  
  count=$((count + 1))
  
  if [ $((count % 10)) -eq 0 ]; then
    echo "  Migrated $count/$total slices..."
  fi
done

echo "✅ Migrated all $count slices to dataset-djia-historical"
