# AWS DynamoDB Setup Instructions

## Table Structures

### Assets Table
```
Table Name: ChasingProphets-Assets
Primary Key: ticker (String)
Attributes:
- ticker (String) - Primary key
- assetId (String)
- name (String)
- description (String)
- type (String)
- createdAt (String) - ISO date
```

### Asset Prices Table
```
Table Name: ChasingProphets-AssetPrices
Primary Key: Composite (ticker + date)
- ticker (String) - Partition key
- date (String) - Sort key, ISO date YYYY-MM-DD
Attributes:
- open (Number)
- high (Number)
- low (Number)
- close (Number)
- volume (Number)
```

## Setup Steps

1. Create `.env` file with AWS credentials:
```ini
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

2. Run the setup script:
```bash
# Normal setup (keeps existing tables)
npm run setup-db

# Reset everything
npm run setup-db -- --reset
```

## Sample Data

The script creates:
1. Two assets (SPY and DIA)
2. 30 days of OHLCV data for each asset

## API Usage Examples

```typescript
// Get asset details
const params = {
  TableName: "ChasingProphets-Assets",
  Key: {
    ticker: { S: "SPY" }
  }
};

// Get price history for an asset
const params = {
  TableName: "ChasingProphets-AssetPrices",
  KeyConditionExpression: "ticker = :t",
  ExpressionAttributeValues: {
    ":t": { S: "SPY" }
  }
};

// Get price data for specific date range
const params = {
  TableName: "ChasingProphets-AssetPrices",
  KeyConditionExpression: "ticker = :t AND #date BETWEEN :start AND :end",
  ExpressionAttributeNames: {
    "#date": "date"
  },
  ExpressionAttributeValues: {
    ":t": { S: "SPY" },
    ":start": { S: "2025-09-21" },
    ":end": { S: "2025-10-21" }
  }
};
```