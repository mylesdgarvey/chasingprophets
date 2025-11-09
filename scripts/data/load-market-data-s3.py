#!/usr/bin/env python3
"""
Load historical market data for specified tickers to S3 as CSV files.
Creates Asset and Dataset records in DynamoDB with S3 references.
Designed for batch operations with configurable ticker list.
"""

import os
import sys
from datetime import datetime, timedelta
from io import StringIO
import boto3
import yfinance as yf
import pandas as pd

# Configuration
TICKERS = [
    {'symbol': '^DJI', 'name': 'DJIA', 'market': 'US_INDEX'},
    {'symbol': '^GSPC', 'name': 'SPX', 'market': 'US_INDEX'}
]
YEARS_BACK = 10
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCOUNT_ID = '080577529621'
S3_BUCKET = f'chasingprophets-models-{AWS_REGION}'

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)
assets_table = dynamodb.Table('ChasingProphets-Assets')
datasets_table = dynamodb.Table('ChasingProphets-Datasets')


def fetch_ohlcv(symbol, years_back=10):
    """Fetch OHLCV data from Yahoo Finance using yfinance."""
    print(f"\n📊 Fetching {years_back} years of data for {symbol}...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years_back * 365)
    
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date)
        
        if df.empty:
            print(f"⚠️  No data returned for {symbol}")
            return None
        
        # Reset index to make Date a column
        df = df.reset_index()
        
        # Rename columns to match our schema
        df = df.rename(columns={
            'Date': 'date',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        })
        
        # Keep only the columns we need
        df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
        
        # Convert date to string format
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        print(f"✅ Fetched {len(df)} records for {symbol}")
        print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
        
        return df
    
    except Exception as e:
        print(f"❌ Error fetching data for {symbol}: {e}")
        return None


def upload_csv_to_s3(df, ticker_name):
    """Upload DataFrame as CSV to S3."""
    s3_key = f"data/assets/{ticker_name}/ohlcv_full.csv"
    s3_path = f"s3://{S3_BUCKET}/{s3_key}"
    
    print(f"\n📤 Uploading CSV to S3: {s3_path}")
    
    try:
        # Convert DataFrame to CSV string
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=csv_buffer.getvalue(),
            ContentType='text/csv'
        )
        
        print(f"✅ Uploaded {len(df)} records to S3")
        return s3_path
    
    except Exception as e:
        print(f"❌ Error uploading to S3: {e}")
        return None


def create_asset(ticker_info):
    """Create or update asset record in DynamoDB."""
    asset_id = ticker_info['name']
    
    try:
        assets_table.put_item(
            Item={
                'assetId': asset_id,
                'name': ticker_info['name'],
                'ticker': ticker_info['symbol'],
                'market': ticker_info['market'],
                'description': f"{ticker_info['name']} - {ticker_info['market']}",
                'lastUpdated': datetime.now().isoformat()
            }
        )
        print(f"✅ Created/updated asset: {asset_id}")
    except Exception as e:
        print(f"❌ Error creating asset {asset_id}: {e}")


def create_dataset_record(ticker_info, df, s3_path):
    """Create dataset record pointing to S3 CSV file."""
    dataset_id = f"dataset-{ticker_info['name'].lower()}-historical"
    
    try:
        datasets_table.put_item(
            Item={
                'datasetId': dataset_id,
                'assetId': ticker_info['name'],
                'name': f"{ticker_info['name']} Historical OHLCV",
                'description': f"{YEARS_BACK}-year historical data for {ticker_info['name']}",
                'source': s3_path,  # S3 path instead of DynamoDB table
                'recordCount': len(df),
                'dateRange': {
                    'start': df['date'].min(),
                    'end': df['date'].max()
                },
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            }
        )
        print(f"✅ Created dataset record: {dataset_id}")
        print(f"   Source: {s3_path}")
    except Exception as e:
        print(f"❌ Error creating dataset {dataset_id}: {e}")


def process_ticker(ticker_info):
    """Complete pipeline for one ticker: fetch, upload to S3, create asset + dataset."""
    print(f"\n{'='*60}")
    print(f"Processing: {ticker_info['name']} ({ticker_info['symbol']})")
    print(f"{'='*60}")
    
    # 1. Fetch data
    df = fetch_ohlcv(ticker_info['symbol'], YEARS_BACK)
    if df is None:
        return False
    
    # 2. Upload CSV to S3
    s3_path = upload_csv_to_s3(df, ticker_info['name'])
    if s3_path is None:
        return False
    
    # 3. Create/update asset
    create_asset(ticker_info)
    
    # 4. Create dataset record with S3 reference
    create_dataset_record(ticker_info, df, s3_path)
    
    return True


def main():
    print("🚀 Starting market data loader (S3 CSV pattern)...")
    print(f"AWS Region: {AWS_REGION}")
    print(f"S3 Bucket: {S3_BUCKET}")
    print(f"Tickers to process: {len(TICKERS)}")
    
    success_count = 0
    for ticker_info in TICKERS:
        if process_ticker(ticker_info):
            success_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Completed: {success_count}/{len(TICKERS)} tickers processed successfully")
    print(f"{'='*60}")
    print(f"\n✅ Data stored in S3, metadata in DynamoDB")
    print(f"✅ AssetService should fetch CSV from S3 using Dataset.source path")


if __name__ == '__main__':
    main()
