#!/usr/bin/env python3
"""
Fetch historical stock/index data and load to DynamoDB
Supports batch operations with multiple tickers
"""

import os
import sys
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import time

# Try importing yfinance, install if needed
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

if not ACCESS_KEY or not SECRET_KEY:
    print("❌ ERROR: AWS credentials not found in environment")
    sys.exit(1)

# DynamoDB setup
dynamodb = boto3.resource(
    'dynamodb',
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

TABLES = {
    'ASSETS': 'ChasingProphets-Assets',
    'PRICES': 'ChasingProphets-AssetPrices',
    'DATASETS': 'ChasingProphets-Datasets'
}

def fetch_ticker_data(symbol, start_date, end_date, period="10y"):
    """
    Fetch historical data for a ticker using yfinance
    
    Args:
        symbol: Ticker symbol (e.g., '^DJI', 'AAPL')
        start_date: Start date (datetime or None)
        end_date: End date (datetime or None)  
        period: Period string if dates not provided (e.g., '10y', '5y', 'max')
    
    Returns:
        DataFrame with OHLCV data
    """
    print(f"📥 Fetching {symbol}...")
    
    try:
        ticker = yf.Ticker(symbol)
        
        if start_date and end_date:
            df = ticker.history(start=start_date, end=end_date)
        else:
            df = ticker.history(period=period)
        
        if df.empty:
            print(f"   ⚠️  No data returned for {symbol}")
            return None
        
        print(f"   ✅ Fetched {len(df)} records ({df.index[0].date()} to {df.index[-1].date()})")
        return df
        
    except Exception as e:
        print(f"   ❌ Failed to fetch {symbol}: {e}")
        return None

def create_asset_record(ticker, name, market, asset_type='index'):
    """Create or update asset metadata record"""
    print(f"\n📝 Creating asset record: {ticker}")
    
    table = dynamodb.Table(TABLES['ASSETS'])
    
    try:
        table.put_item(
            Item={
                'ticker': ticker,
                'name': name,
                'description': f'{name} historical data',
                'market': market,
                'type': asset_type,
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
        )
        print(f"   ✅ Created asset: {ticker}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create asset: {e}")
        return False

def batch_write_prices(ticker, df, market):
    """
    Batch write price data to DynamoDB with automatic retries
    
    Args:
        ticker: Asset ticker
        df: Pandas DataFrame with price data
        market: Market identifier
    """
    print(f"\n💾 Writing {len(df)} price records to DynamoDB...")
    
    table = dynamodb.Table(TABLES['PRICES'])
    
    # Prepare items
    items = []
    for date, row in df.iterrows():
        items.append({
            'ticker': ticker,
            'date': date.strftime('%Y-%m-%d'),
            'open': Decimal(str(round(row['Open'], 2))),
            'high': Decimal(str(round(row['High'], 2))),
            'low': Decimal(str(round(row['Low'], 2))),
            'close': Decimal(str(round(row['Close'], 2))),
            'volume': int(row['Volume']),
            'market': market,
            'lastUpdated': datetime.utcnow().isoformat()
        })
    
    # Batch write (25 items at a time - DynamoDB limit)
    BATCH_SIZE = 25
    total_written = 0
    
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        
        retry_count = 0
        max_retries = 5
        
        while retry_count < max_retries:
            try:
                with table.batch_writer() as batch_writer:
                    for item in batch:
                        batch_writer.put_item(Item=item)
                
                total_written += len(batch)
                
                # Progress update
                if total_written % 250 == 0 or total_written == len(items):
                    print(f"   Progress: {total_written}/{len(items)} records written")
                
                break  # Success, exit retry loop
                
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    print(f"   ❌ Failed batch after {max_retries} retries: {e}")
                    raise
                
                # Exponential backoff
                wait_time = 0.1 * (2 ** retry_count)
                time.sleep(wait_time)
    
    print(f"   ✅ Wrote {total_written} price records")
    return total_written

def create_dataset_record(dataset_id, asset_id, name):
    """Create dataset metadata record"""
    print(f"\n📝 Creating dataset: {dataset_id}")
    
    table = dynamodb.Table(TABLES['DATASETS'])
    
    try:
        table.put_item(
            Item={
                'datasetId': dataset_id,
                'assetId': asset_id,
                'name': name,
                'description': f'Historical OHLCV data for {asset_id}',
                'source': TABLES['PRICES'],
                'sourceType': 'dynamodb',
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
        )
        print(f"   ✅ Created dataset: {dataset_id}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create dataset: {e}")
        return False

def process_ticker(symbol, ticker_id, name, market, asset_type='index', period='10y'):
    """
    Complete processing pipeline for a single ticker
    
    Args:
        symbol: Yahoo Finance symbol (e.g., '^DJI')
        ticker_id: Our internal ticker ID (e.g., 'DJIA')
        name: Full name
        market: Market identifier
        asset_type: Type of asset (index, stock, etf, etc.)
        period: How much history to fetch
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*60}")
    print(f"Processing: {name} ({ticker_id})")
    print('='*60)
    
    try:
        # 1. Fetch data
        df = fetch_ticker_data(symbol, None, None, period=period)
        
        if df is None or df.empty:
            print(f"⚠️  Skipping {ticker_id} - no data available")
            return False
        
        # 2. Create asset record
        if not create_asset_record(ticker_id, name, market, asset_type):
            return False
        
        # 3. Write price data
        records_written = batch_write_prices(ticker_id, df, market)
        
        # 4. Create dataset
        dataset_id = f"dataset-{ticker_id.lower()}-historical"
        if not create_dataset_record(dataset_id, ticker_id, f"{name} Historical Data"):
            return False
        
        print(f"\n✅ {ticker_id} complete! ({records_written} records)")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to process {ticker_id}: {e}")
        return False

def main():
    """Main entry point"""
    print("\n🚀 Session 2: Real Data Seeding")
    print(f"Region: {REGION}")
    print(f"Tables: {', '.join(TABLES.values())}\n")
    
    # Define tickers to load
    # Format: (yahoo_symbol, internal_ticker, name, market, asset_type)
    tickers = [
        ('^DJI', 'DJIA', 'Dow Jones Industrial Average', 'US_INDEX', 'index'),
        ('^GSPC', 'SPX', 'S&P 500 Index', 'US_INDEX', 'index')
    ]
    
    # Process each ticker
    results = []
    for yahoo_symbol, ticker_id, name, market, asset_type in tickers:
        success = process_ticker(yahoo_symbol, ticker_id, name, market, asset_type, period='10y')
        results.append((ticker_id, success))
    
    # Summary
    print("\n" + "="*60)
    print("🎉 Session 2 Data Seeding Complete!")
    print("="*60)
    print("\n📊 Summary:")
    
    successful = [t for t, s in results if s]
    failed = [t for t, s in results if not s]
    
    print(f"   ✅ Successful: {', '.join(successful) if successful else 'None'}")
    if failed:
        print(f"   ❌ Failed: {', '.join(failed)}")
    
    print(f"\n   Total: {len(successful)}/{len(results)} tickers loaded")
    print("\n✅ Ready to test: Navigate to /assets/DJIA or /assets/SPX in your app\n")
    
    return 0 if len(failed) == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
