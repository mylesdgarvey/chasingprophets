# ChasingProphets Clean Initialization

## Quick Start

From scratch setup:

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials

# 2. Run clean initialization
npx tsx scripts/init-clean.ts
```

That's it! The script will:
1. ✅ Create all DynamoDB tables
2. ✅ Create S3 bucket and structure  
3. ✅ Upload training/inference scripts to S3
4. ✅ Download DJIA and SPX data (10 years)
5. ✅ Create data slices (20d, 60d, 120d, 240d windows)
6. ✅ Create prophets (model fits for each scaffold × slice)
7. ✅ Train all models
8. ✅ Calculate performance metrics

## What Gets Created

### Assets (2)
- **DJIA** - Dow Jones Industrial Average
- **SPX** - S&P 500 Index

### Model Scaffolds (2)
- **SLR** - Simple Linear Regression
- **MLR** - Multiple Linear Regression

### Data Slices (~380 per asset)
- 20-day windows (sliding)
- 60-day windows (sliding)
- 120-day windows (sliding)
- 240-day windows (sliding)

### Prophets (~760 total)
- Each prophet = 1 scaffold × 1 slice
- Trained on historical data
- Performance metrics calculated for 20d, 60d, 120d, 240d windows

## File Structure

```
scripts/
  ├── init-clean.ts              # Main initialization script (USE THIS!)
  ├── models/
  │   └── init-models.ts         # Creates model scaffolds in DB
  ├── data/
  │   └── load-market-data.py    # Downloads DJIA + SPX from Yahoo Finance
  ├── admin/
  │   ├── create-slices-and-prophets.ts  # Creates slices and prophets
  │   ├── train-models.ts        # Trains all pending models
  │   └── calculate-performance.py  # Calculates performance metrics
  └── old_files/                 # Old messy scripts (ignore)
```

## Manual Steps (if needed)

### Create Tables Only
```bash
# Run only step 1 of init-clean.ts manually
npx tsx -e "import('./scripts/init-clean.ts').then(m => m.createTables())"
```

### Download Data Only
```bash
python3 scripts/data/load-market-data.py
```

### Create Slices and Prophets
```bash
npx tsx scripts/admin/create-slices-and-prophets.ts
```

### Train Models
```bash
npx tsx scripts/admin/train-models.ts
```

### Calculate Performance
```bash
python3 scripts/admin/calculate-performance.py
```

## Important Notes

⚠️ **NO FAKE DATA**: All old scripts that generated fake/sample data have been moved to `old_files/`

✅ **REAL DATA ONLY**: System now uses ONLY real DJIA and SPX data from Yahoo Finance

🔒 **Security**: Never commit `.env` file - it's now in `.gitignore`

## Troubleshooting

### "No data found for DJIA/SPX"
Run: `python3 scripts/data/load-market-data.py`

### "No scaffolds found"
Run: `npx tsx scripts/models/init-models.ts`

### "Training failed"
Check S3 bucket has scaffold scripts:
```bash
aws s3 ls s3://chasingprophets-models-us-east-1/models/scaffolds/ --recursive
```

### Start Fresh
```bash
# Delete everything and rebuild
npx tsx scripts/aws/teardown-all.sh
npx tsx scripts/init-clean.ts
```
