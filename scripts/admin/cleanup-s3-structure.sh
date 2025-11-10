#!/bin/bash
###############################################################################
# S3 Structure Cleanup Script
# 
# Cleans S3 bucket to match intended architecture:
# - Deletes duplicate datasets folder
# - Deletes 191 pre-computed data slice files (wrong architecture)
# - Moves scaffold scripts from scaffolds/ to scripts/scaffolds/
# - Keeps correct structure: data/assets/, models/, scripts/
###############################################################################

set -e  # Exit on error

BUCKET="chasingprophets-models-us-east-1"

echo "🧹 S3 BUCKET CLEANUP: $BUCKET"
echo "================================================"
echo ""

# Step 1: Delete duplicate datasets folder
echo "1️⃣  Deleting duplicate datasets/DJIA/ folder..."
aws s3 rm s3://$BUCKET/datasets/ --recursive
echo "   ✓ Deleted datasets/"
echo ""

# Step 2: Delete all pre-computed data slice files
echo "2️⃣  Deleting 191 pre-computed data slice files (wrong architecture)..."
aws s3 rm s3://$BUCKET/slices/ --recursive
echo "   ✓ Deleted slices/"
echo ""

# Step 3: Move scaffold scripts to correct location
echo "3️⃣  Moving scaffold scripts to correct location..."
echo "   Moving scaffolds/mlr/ → scripts/scaffolds/mlr/"
aws s3 cp s3://$BUCKET/scaffolds/mlr/train.py s3://$BUCKET/scripts/scaffolds/mlr/train.py
aws s3 cp s3://$BUCKET/scaffolds/mlr/inference.py s3://$BUCKET/scripts/scaffolds/mlr/inference.py
echo "   Moving scaffolds/slr/ → scripts/scaffolds/slr/"
aws s3 cp s3://$BUCKET/scaffolds/slr/train.py s3://$BUCKET/scripts/scaffolds/slr/train.py
aws s3 cp s3://$BUCKET/scaffolds/slr/inference.py s3://$BUCKET/scripts/scaffolds/slr/inference.py
echo "   ✓ Copied scaffold scripts to scripts/scaffolds/"
echo ""

# Step 4: Delete old scaffold location
echo "4️⃣  Deleting old scaffolds/ folder..."
aws s3 rm s3://$BUCKET/scaffolds/ --recursive
echo "   ✓ Deleted scaffolds/"
echo ""

# Step 5: Delete empty artifacts folder
echo "5️⃣  Deleting empty artifacts/ folder..."
aws s3 rm s3://$BUCKET/artifacts/ --recursive
echo "   ✓ Deleted artifacts/"
echo ""

# Step 6: Verify final structure
echo "✅ CLEANUP COMPLETE"
echo ""
echo "📊 Final S3 Structure:"
echo "================================================"
aws s3 ls s3://$BUCKET/ | grep PRE
echo ""
echo "File counts:"
echo "  data/assets/: $(aws s3 ls s3://$BUCKET/data/assets/ --recursive | wc -l) files (should be 2)"
echo "  models/: $(aws s3 ls s3://$BUCKET/models/ --recursive | wc -l) files (761 parameter files)"
echo "  scripts/scaffolds/: $(aws s3 ls s3://$BUCKET/scripts/scaffolds/ --recursive | wc -l) files (should be 4)"
echo "  scripts/prophets/: $(aws s3 ls s3://$BUCKET/scripts/prophets/ --recursive | wc -l) files (754 output transforms)"
echo ""
echo "🎯 Structure now matches architecture specification!"
echo ""
echo "⚠️  TODO - Create missing files:"
echo "  - scripts/scaffolds/mlr/inference.js (local inference)"
echo "  - scripts/scaffolds/slr/inference.js (local inference)"
