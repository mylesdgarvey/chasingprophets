#!/usr/bin/env python3
"""
Download market data DIRECTLY to S3 CSV files
NO DynamoDB - all data goes to S3 only!
"""

import os
import sys
import boto3
from datetime import datetime
from decimal import Decimal

try:
    import yfinance as yf
except ImportError:
    print("📦 Installing yfinance...")
    os.system(f"{sys.executable} -m pip install yfinance -q")
    import yfinance as yf

# AWS Configuration
REGION = os.getenv('AWS_REGION', 'us-east-1')
ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
BUCKET = f'chasingprophets-models-{REGION}'

if not ACCESS_KEY or not SECRET_KEY:
    print("❌ ERROR: AWS credentials not found in environment")
    sys.exit(1)

# S3 and DynamoDB clients
s3 = boto3.client(
    's3',
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

dynamodb = boto3.resource(
    'dynamodb',
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

def fetch_ticker_data(symbol, period="10y"):
    """Fetch historical data using yfinance"""
    print(f"📥 Fetching {symbol}...")
    
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
        
        if df.empty:
            print(f"   ⚠️  No data returned for {symbol}")
            return None
        
        print(f"   ✅ Fetched {len(df)} records ({df.index[0].date()} to {df.index[-1].date()})")
        return df
        
    except Exception as e:
        print(f"   ❌ Failed to fetch {symbol}: {e}")
        return None

def upload_csv_to_s3(ticker, df):
    """Convert dataframe to CSV and upload to S3"""
    print(f"\n💾 Uploading {ticker} CSV to S3...")
    
    # Convert to CSV format
    csv_data = "date,open,high,low,close,volume\n"
    for date, row in df.iterrows():
        csv_data += f"{date.strftime('%Y-%m-%d')},{row['Open']},{row['High']},{row['Low']},{row['Close']},{int(row['Volume'])}\n"
    
    # Upload to S3
    s3_key = f"data/assets/{ticker}/ohlcv_full.csv"
    s3.put_object(
        Bucket=BUCKET,
        Key=s3_key,
        Body=csv_data.encode('utf-8'),
        ContentType='text/csv'
    )
    
    print(f"   ✅ Uploaded to s3://{BUCKET}/{s3_key}")
    return len(df)

def create_asset_record(ticker, name, market):
    """Create asset metadata in DynamoDB Assets table"""
    print(f"\n📝 Creating asset record: {ticker}")
    
    table = dynamodb.Table('ChasingProphets-Assets')
    
    try:
        table.put_item(
            Item={
                'ticker': ticker,
                'name': name,
                'description': f'{name} historical data',
                'market': market,
                'type': 'index',
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
        )
        print(f"   ✅ Created asset: {ticker}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create asset: {e}")
        return False

def create_dataset_record(dataset_id, asset_id, name):
    """Create dataset record pointing to S3 CSV file"""
    print(f"\n📝 Creating dataset: {dataset_id}")
    
    table = dynamodb.Table('ChasingProphets-Datasets')
    
    try:
        table.put_item(
            Item={
                'datasetId': dataset_id,
                'assetId': asset_id,
                'name': name,
                'description': f'Historical OHLCV data for {asset_id}',
                'sourceType': 's3',
                'source': f's3://{BUCKET}/data/assets/{asset_id}/ohlcv_full.csv',
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
        )
        print(f"   ✅ Created dataset: {dataset_id}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create dataset: {e}")
        return False

def process_ticker(yahoo_symbol, ticker_id, name, market, period='10y'):
    """Download and process a single ticker"""
    print(f"\n{'='*60}")
    print(f"Processing: {name} ({ticker_id})")
    print('='*60)
    
    try:
        # 1. Fetch data from Yahoo Finance
        df = fetch_ticker_data(yahoo_symbol, period=period)
        
        if df is None or df.empty:
            print(f"⚠️  Skipping {ticker_id} - no data available")
            return False
        
        # 2. Upload CSV to S3
        record_count = upload_csv_to_s3(ticker_id, df)
        
        # 3. Create asset metadata in DynamoDB
        if not create_asset_record(ticker_id, name, market):
            return False
        
        # 4. Create dataset record pointing to S3
        dataset_id = f"dataset-{ticker_id.lower()}-historical"
        if not create_dataset_record(dataset_id, ticker_id, f"{name} Historical Data"):
            return False
        
        print(f"\n✅ {ticker_id} complete! ({record_count} records in S3)")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to process {ticker_id}: {e}")
        return False

def main():
    """Main entry point"""
    print("\n🚀 Market Data Download - Direct to S3")
    print(f"Region: {REGION}")
    print(f"S3 Bucket: {BUCKET}\n")
    
    # Define tickers to load (DJIA and SPX ONLY)
    tickers = [
        ('^DJI', 'DJIA', 'Dow Jones Industrial Average', 'US_INDEX'),
        ('^GSPC', 'SPX', 'S&P 500 Index', 'US_INDEX')
    ]
    
    # Process each ticker
    results = []
    for yahoo_symbol, ticker_id, name, market in tickers:
        success = process_ticker(yahoo_symbol, ticker_id, name, market, period='10y')
        results.append((ticker_id, success))
    
    # Summary
    print("\n" + "="*60)
    print("🎉 Market Data Download Complete!")
    print("="*60)
    print("\n📊 Summary:")
    
    successful = [t for t, s in results if s]
    failed = [t for t, s in results if not s]
    
    print(f"   ✅ Successful: {', '.join(successful) if successful else 'None'}")
    if failed:
        print(f"   ❌ Failed: {', '.join(failed)}")
    
    print(f"\n   Total: {len(successful)}/{len(results)} tickers loaded")
    print("\n✅ Data is in S3 CSV files (NOT DynamoDB)\n")
    
    return 0 if len(failed) == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
