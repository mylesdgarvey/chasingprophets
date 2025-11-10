#!/bin/bash
set -e

# Complete setup from scratch
# This script orchestrates the full setup process for ChasingProphets

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 COMPLETE SETUP FROM SCRATCH"
echo "================================"
echo "This will set up the entire ChasingProphets infrastructure"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

# Load environment
source "$SCRIPT_DIR/load-env.sh"

# Step 1: Setup IAM roles
echo ""
echo "📋 Step 1/7: Setting up IAM roles..."
npx tsx "$SCRIPT_DIR/setup-iam-roles.ts"

# Step 2: Setup S3
echo ""
echo "📦 Step 2/7: Setting up S3 buckets..."
npx tsx "$SCRIPT_DIR/setup-s3.ts"

# Step 3: Setup DynamoDB tables
echo ""
echo "🗄️  Step 3/7: Setting up DynamoDB tables..."
npx tsx "$SCRIPT_DIR/setup-dynamodb.ts"

# Step 4: Setup model-specific tables
echo ""
echo "🤖 Step 4/7: Setting up model tables..."
npx tsx "$SCRIPT_DIR/setup-model-tables.ts"

# Step 5: Setup Cognito
echo ""
echo "👤 Step 5/7: Setting up Cognito user pool..."
bash "$SCRIPT_DIR/setup-cognito.sh"

# Step 6: Load stock data
echo ""
echo "📊 Step 6/7: Loading stock data..."
python3 "$SCRIPT_DIR/data/load-market-data.py"

# Step 7: Create data slices and train models
echo ""
echo "✂️  Step 7/7: Creating data slices..."
npx tsx "$SCRIPT_DIR/admin/create-slices.ts"

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "🎉 Your ChasingProphets instance is ready!"
echo ""
echo "Next steps:"
echo "  1. Train models:"
echo "     npx tsx scripts/admin/train-models.ts"
echo ""
echo "  2. Calculate performance metrics:"
echo "     python3 scripts/admin/calculate-performance.py"
echo ""
echo "  3. Start the dev server:"
echo "     npm run dev"
echo ""
