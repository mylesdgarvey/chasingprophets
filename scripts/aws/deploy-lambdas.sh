#!/bin/bash

# Deploy Lambda Functions and Configure EventBridge Schedules
# This script packages and deploys the daily prediction and performance Lambdas

set -e

REGION=${AWS_REGION:-us-east-1}
LAMBDA_ROLE_ARN=${LAMBDA_ROLE_ARN}

if [ -z "$LAMBDA_ROLE_ARN" ]; then
    echo "Error: LAMBDA_ROLE_ARN environment variable not set"
    echo "Please set it to the ARN of your Lambda execution role"
    exit 1
fi

echo "🚀 Deploying Chasing Prophets Lambda Functions"
echo "Region: $REGION"
echo ""

# Function to package and deploy Lambda
deploy_lambda() {
    local LAMBDA_NAME=$1
    local LAMBDA_DIR=$2
    local DESCRIPTION=$3
    local TIMEOUT=${4:-300}
    local MEMORY=${5:-512}
    
    echo "📦 Packaging $LAMBDA_NAME..."
    
    cd "$LAMBDA_DIR"
    
    # Create deployment package
    if [ -f requirements.txt ]; then
        # Install dependencies
        pip install -r requirements.txt -t package/ --quiet
        cd package
        zip -r ../deployment.zip . --quiet
        cd ..
        zip deployment.zip handler.py
        rm -rf package
    else
        zip deployment.zip handler.py
    fi
    
    echo "☁️  Deploying $LAMBDA_NAME to AWS..."
    
    # Check if function exists
    if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" 2>/dev/null; then
        # Update existing function
        aws lambda update-function-code \
            --function-name "$LAMBDA_NAME" \
            --zip-file fileb://deployment.zip \
            --region "$REGION" \
            --no-cli-pager > /dev/null
        
        echo "✅ Updated $LAMBDA_NAME"
    else
        # Create new function
        aws lambda create-function \
            --function-name "$LAMBDA_NAME" \
            --runtime python3.11 \
            --role "$LAMBDA_ROLE_ARN" \
            --handler handler.lambda_handler \
            --zip-file fileb://deployment.zip \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY" \
            --region "$REGION" \
            --description "$DESCRIPTION" \
            --environment "Variables={
                PROPHETS_TABLE=ChasingProphets-Prophets,
                MODEL_FITS_TABLE=ChasingProphets-ModelFits,
                FORECASTS_TABLE=ChasingProphets-Forecasts,
                ASSET_PRICES_TABLE=ChasingProphets-AssetPrices,
                PERFORMANCE_TABLE=ChasingProphets-Performance,
                PERFORMANCE_SUMMARY_TABLE=ChasingProphets-ProphetPerformanceSummary,
                S3_BUCKET=chasingprophets-models-us-east-1
            }" \
            --no-cli-pager > /dev/null
        
        echo "✅ Created $LAMBDA_NAME"
    fi
    
    # Clean up
    rm deployment.zip
    
    cd - > /dev/null
}

# Function to create EventBridge rule
create_schedule() {
    local RULE_NAME=$1
    local LAMBDA_NAME=$2
    local CRON_EXPRESSION=$3
    local DESCRIPTION=$4
    
    echo ""
    echo "⏰ Configuring schedule: $RULE_NAME"
    
    # Create or update rule
    aws events put-rule \
        --name "$RULE_NAME" \
        --schedule-expression "$CRON_EXPRESSION" \
        --state ENABLED \
        --description "$DESCRIPTION" \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    # Get Lambda ARN
    LAMBDA_ARN=$(aws lambda get-function \
        --function-name "$LAMBDA_NAME" \
        --region "$REGION" \
        --query 'Configuration.FunctionArn' \
        --output text)
    
    # Add Lambda as target
    aws events put-targets \
        --rule "$RULE_NAME" \
        --targets "Id=1,Arn=$LAMBDA_ARN" \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    # Add permission for EventBridge to invoke Lambda
    aws lambda add-permission \
        --function-name "$LAMBDA_NAME" \
        --statement-id "${RULE_NAME}-invoke" \
        --action lambda:InvokeFunction \
        --principal events.amazonaws.com \
        --source-arn "arn:aws:events:${REGION}:$(aws sts get-caller-identity --query Account --output text):rule/${RULE_NAME}" \
        --region "$REGION" \
        --no-cli-pager 2>/dev/null || echo "  (Permission already exists)"
    
    echo "✅ Schedule configured: $RULE_NAME"
}

# Deploy Daily Predictions Lambda
deploy_lambda \
    "chp-daily-predictions" \
    "lambda/daily-predictions" \
    "Daily prophet predictions - generates forecasts for all active prophets" \
    300 \
    512

# Deploy Daily Performance Lambda
deploy_lambda \
    "chp-daily-performance" \
    "lambda/daily-performance" \
    "Daily performance tracking - computes metrics and updates summaries" \
    300 \
    512

# Create EventBridge schedules
# Note: Using UTC time. 11:00 UTC = 06:00 ET (EST), 07:00 ET (EDT)
# Market days only: Monday-Friday

create_schedule \
    "chp-daily-predictions-schedule" \
    "chp-daily-predictions" \
    "cron(0 11 ? * MON-FRI *)" \
    "Trigger daily prophet predictions at 06:00 ET on market days"

create_schedule \
    "chp-daily-performance-schedule" \
    "chp-daily-performance" \
    "cron(5 11 ? * MON-FRI *)" \
    "Trigger daily performance tracking at 06:05 ET on market days"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Lambda Functions:"
echo "  - chp-daily-predictions (daily inference)"
echo "  - chp-daily-performance (metrics computation)"
echo ""
echo "EventBridge Schedules:"
echo "  - chp-daily-predictions-schedule (06:00 ET Mon-Fri)"
echo "  - chp-daily-performance-schedule (06:05 ET Mon-Fri)"
echo ""
echo "Next steps:"
echo "  1. Verify Lambda execution role has DynamoDB and S3 permissions"
echo "  2. Test manually: aws lambda invoke --function-name chp-daily-predictions output.json"
echo "  3. Check CloudWatch Logs for execution details"
