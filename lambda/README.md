# Lambda Functions — Daily Automation

This directory contains AWS Lambda functions for automated daily prophet predictions and performance tracking.

## Functions

### 1. `daily-predictions/`
**Purpose**: Generate daily forecasts for all active prophets

**Trigger**: EventBridge cron at 06:00 ET on market days (Mon-Fri)

**Process**:
1. Query all active prophets from DynamoDB
2. For each prophet:
   - Fetch model fit and parameters from S3
   - Download remote inference script (inference.py)
   - Fetch latest price data (60-day lookback)
   - Execute inference to predict next day's price
   - Write forecast to `ChasingProphets-Forecasts` table

**Environment Variables**:
- `PROPHETS_TABLE`: ChasingProphets-Prophets
- `MODEL_FITS_TABLE`: ChasingProphets-ModelFits
- `FORECASTS_TABLE`: ChasingProphets-Forecasts
- `ASSET_PRICES_TABLE`: ChasingProphets-AssetPrices
- `S3_BUCKET`: chasingprophets-models-us-east-1

**Runtime**: Python 3.11, 300s timeout, 512MB memory

---

### 2. `daily-performance/`
**Purpose**: Compute performance metrics and update rolling aggregates

**Trigger**: EventBridge cron at 06:05 ET on market days (5 minutes after predictions)

**Process**:
1. Query all active prophets
2. For each prophet:
   - Fetch yesterday's prediction from Forecasts table
   - Fetch today's actual price from AssetPrices
   - Compute error metrics (absolute error, percentage error, directional accuracy)
   - Update Forecasts table with actual value
   - Write to `ChasingProphets-Performance` table (daily record)
   - Update rolling aggregates in `ChasingProphets-ProphetPerformanceSummary`:
     - 20-day, 60-day, 120-day, 240-day windows
     - Metrics: MAPE, percentile errors (75th, 90th), directional accuracy

**Environment Variables**:
- `PROPHETS_TABLE`: ChasingProphets-Prophets
- `FORECASTS_TABLE`: ChasingProphets-Forecasts
- `ASSET_PRICES_TABLE`: ChasingProphets-AssetPrices
- `PERFORMANCE_TABLE`: ChasingProphets-Performance
- `PERFORMANCE_SUMMARY_TABLE`: ChasingProphets-ProphetPerformanceSummary

**Runtime**: Python 3.11, 300s timeout, 512MB memory

---

## Deployment

### Prerequisites
1. **Lambda Execution Role**: Create IAM role with permissions:
   - DynamoDB: Read/Write access to all ChasingProphets tables
   - S3: Read access to `chasingprophets-models-us-east-1`
   - CloudWatch Logs: Write access for logging

2. **AWS CLI configured** with appropriate credentials

3. **Set environment variable**:
   ```bash
   export LAMBDA_ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role"
   ```

### Deploy
```bash
cd /workspaces/chasingprophets
./scripts/aws/deploy-lambdas.sh
```

This script will:
- Package both Lambda functions
- Create or update Lambda functions in AWS
- Create EventBridge schedules
- Configure Lambda permissions

### Manual Testing
```bash
# Test predictions Lambda
aws lambda invoke \
  --function-name chp-daily-predictions \
  --region us-east-1 \
  output-predictions.json

cat output-predictions.json

# Test performance Lambda
aws lambda invoke \
  --function-name chp-daily-performance \
  --region us-east-1 \
  output-performance.json

cat output-performance.json
```

### Check Logs
```bash
# View prediction Lambda logs
aws logs tail /aws/lambda/chp-daily-predictions --follow

# View performance Lambda logs
aws logs tail /aws/lambda/chp-daily-performance --follow
```

---

## EventBridge Schedules

### Daily Predictions Schedule
- **Name**: `chp-daily-predictions-schedule`
- **Cron**: `cron(0 11 ? * MON-FRI *)` (06:00 ET on market days)
- **Target**: `chp-daily-predictions` Lambda

### Daily Performance Schedule
- **Name**: `chp-daily-performance-schedule`
- **Cron**: `cron(5 11 ? * MON-FRI *)` (06:05 ET on market days)
- **Target**: `chp-daily-performance` Lambda

**Note**: Schedules use UTC time. 11:00 UTC = 06:00 EST or 07:00 EDT depending on daylight saving time.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EventBridge                          │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │ 06:00 ET Mon-Fri │      │ 06:05 ET Mon-Fri │       │
│  └────────┬─────────┘      └────────┬─────────┘       │
└───────────┼───────────────────────────┼─────────────────┘
            │                           │
            ▼                           ▼
   ┌────────────────┐         ┌────────────────┐
   │  daily-        │         │  daily-        │
   │  predictions   │         │  performance   │
   │  Lambda        │         │  Lambda        │
   └────────┬───────┘         └────────┬───────┘
            │                          │
            ▼                          ▼
   ┌────────────────┐         ┌────────────────┐
   │  DynamoDB:     │         │  DynamoDB:     │
   │  - Prophets    │◄────────│  - Forecasts   │
   │  - ModelFits   │         │  - Performance │
   │  - Forecasts   │         │  - Summary     │
   └────────┬───────┘         └────────────────┘
            │
            ▼
   ┌────────────────┐
   │  S3:           │
   │  - Scripts     │
   │  - Parameters  │
   └────────────────┘
```

---

## Monitoring

### CloudWatch Metrics
Both Lambdas emit:
- Invocations
- Errors
- Duration
- Concurrent executions

### Custom Logs
Each Lambda logs:
- Prophet processing status (success/failed)
- Error details
- Performance metrics
- Execution summary

### Alerts (Recommended)
Create CloudWatch alarms for:
- Lambda errors > 0
- Lambda duration > 240s
- Performance summary MAPE thresholds

---

## Cost Optimization

### Current Design
- **Daily Predictions**: ~5-15 min execution (depends on prophet count)
- **Daily Performance**: ~2-5 min execution
- **Total**: ~20 min/day = ~600 min/month
- **Cost**: ~$0.10/month (assuming 512MB memory)

### Optimizations
1. **Batch Processing**: Process prophets in parallel using Step Functions
2. **Conditional Execution**: Only run on market days (skip holidays)
3. **Incremental Updates**: Cache intermediate results in DynamoDB
4. **Memory Tuning**: Reduce to 256MB if performance allows

---

## Troubleshooting

### Common Issues

**1. Lambda Timeout**
- Increase timeout in deployment script
- Optimize inference script execution
- Consider parallelizing prophet processing

**2. Missing Permissions**
```bash
# Check Lambda execution role
aws iam get-role --role-name lambda-execution-role

# Attach DynamoDB policy
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

**3. EventBridge Not Triggering**
```bash
# Verify rule status
aws events describe-rule --name chp-daily-predictions-schedule

# Check Lambda permissions
aws lambda get-policy --function-name chp-daily-predictions
```

**4. Inference Script Errors**
- Verify S3 paths in ModelFit records
- Check inference script syntax
- Test locally with sample data

---

## Local Development

### Test Locally
```bash
cd lambda/daily-predictions
python handler.py  # Requires AWS credentials in environment
```

### Debug Mode
Set `DEBUG=true` in environment to enable verbose logging:
```python
import os
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'
```

---

## Next Steps

1. **Phase 8**: Implement ensemble combination for multi-fit prophets
2. **Phase 9**: Add multi-horizon forecasts (5/20/60/120/240-day)
3. **Phase 10**: Create admin dashboard for Lambda monitoring
4. **Phase 11**: Implement automatic retraining triggers
