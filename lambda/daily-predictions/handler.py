"""
Daily Predictions Lambda
Runs daily inference for all active prophets and stores forecasts in DynamoDB

Trigger: EventBridge rule at 06:00 ET daily (11:00 UTC on market days)
Logic:
  1. Query all active prophets from DynamoDB
  2. For each prophet:
     - Fetch model fit and parameters from S3
     - Download remote inference script from S3
     - Fetch latest price data
     - Execute inference to predict next day's price
     - Write forecast to DynamoDB Forecasts table
"""

import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import sys
import tempfile
import importlib.util

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
REGION = os.environ.get('AWS_REGION', 'us-east-1')
PROPHETS_TABLE = os.environ.get('PROPHETS_TABLE', 'ChasingProphets-Prophets')
MODEL_FITS_TABLE = os.environ.get('MODEL_FITS_TABLE', 'ChasingProphets-ModelFits')
FORECASTS_TABLE = os.environ.get('FORECASTS_TABLE', 'ChasingProphets-Forecasts')
ASSET_PRICES_TABLE = os.environ.get('ASSET_PRICES_TABLE', 'ChasingProphets-AssetPrices')
S3_BUCKET = os.environ.get('S3_BUCKET', 'chasingprophets-models-us-east-1')

# DynamoDB tables
prophets_table = dynamodb.Table(PROPHETS_TABLE)
model_fits_table = dynamodb.Table(MODEL_FITS_TABLE)
forecasts_table = dynamodb.Table(FORECASTS_TABLE)
asset_prices_table = dynamodb.Table(ASSET_PRICES_TABLE)


def decimal_default(obj):
    """JSON encoder for Decimal types"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def get_active_prophets():
    """Fetch all active prophets from DynamoDB"""
    try:
        response = prophets_table.scan(
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'active'}
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error fetching active prophets: {e}")
        return []


def get_model_fit(model_fit_id):
    """Fetch model fit details from DynamoDB"""
    try:
        response = model_fits_table.get_item(Key={'modelFitId': model_fit_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error fetching model fit {model_fit_id}: {e}")
        return None


def get_latest_prices(asset_id, lookback_days=60):
    """Fetch latest price data for an asset"""
    try:
        # Get last N days of price data
        response = asset_prices_table.query(
            KeyConditionExpression='ticker = :ticker',
            ExpressionAttributeValues={':ticker': asset_id},
            ScanIndexForward=False,  # Descending order (latest first)
            Limit=lookback_days
        )
        items = response.get('Items', [])
        # Reverse to get chronological order
        return sorted(items, key=lambda x: x['date'])
    except Exception as e:
        print(f"Error fetching prices for {asset_id}: {e}")
        return []


def download_from_s3(s3_path):
    """Download file from S3 and return content"""
    try:
        # Parse S3 path (format: s3://bucket/key or bucket/key)
        if s3_path.startswith('s3://'):
            s3_path = s3_path[5:]  # Remove s3://
        
        parts = s3_path.split('/', 1)
        if len(parts) != 2:
            # Assume it's a key in the default bucket
            bucket = S3_BUCKET
            key = s3_path
        else:
            bucket, key = parts
        
        print(f"Downloading from S3: bucket={bucket}, key={key}")
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read()
        
        # If it's a JSON file, parse it
        if key.endswith('.json'):
            return json.loads(content.decode('utf-8'))
        else:
            return content.decode('utf-8')
            
    except Exception as e:
        print(f"Error downloading from S3 ({s3_path}): {e}")
        return None


def execute_remote_inference(inference_script, parameters, price_data):
    """
    Execute remote inference script
    
    Args:
        inference_script: Python code as string
        parameters: Model parameters dict
        price_data: List of price records
    
    Returns:
        Predicted value or None
    """
    try:
        # Create temporary module
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(inference_script)
            temp_path = f.name
        
        # Load module dynamically
        spec = importlib.util.spec_from_file_location("inference_module", temp_path)
        inference_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(inference_module)
        
        # Call predict function
        if hasattr(inference_module, 'predict'):
            prediction = inference_module.predict(parameters, price_data)
            os.unlink(temp_path)  # Clean up
            return prediction
        else:
            print("Error: inference script missing 'predict' function")
            os.unlink(temp_path)
            return None
            
    except Exception as e:
        print(f"Error executing inference: {e}")
        import traceback
        traceback.print_exc()
        return None


def write_forecast(prophet_id, asset_id, forecast_date, predicted_value, horizon='1-day'):
    """Write forecast to DynamoDB"""
    try:
        forecast_id = f"{prophet_id}_{forecast_date}_{horizon}"
        
        item = {
            'forecastId': forecast_id,
            'prophetId': prophet_id,
            'assetId': asset_id,
            'generatedDate': datetime.utcnow().isoformat(),
            'targetDate': forecast_date,
            'horizon': horizon,
            'predicted': Decimal(str(predicted_value)),
            'actual': None,  # Will be filled by performance Lambda
            'createdAt': datetime.utcnow().isoformat()
        }
        
        forecasts_table.put_item(Item=item)
        print(f"✅ Wrote forecast: {forecast_id} = {predicted_value}")
        return True
        
    except Exception as e:
        print(f"Error writing forecast: {e}")
        return False


def process_prophet(prophet):
    """Run inference for a single prophet"""
    prophet_id = prophet['prophetId']
    prophet_name = prophet.get('prophetName', prophet_id)
    asset_id = prophet.get('assetId')
    
    print(f"\n📊 Processing prophet: {prophet_name} ({prophet_id})")
    
    # Get model fit (use first one if ensemble)
    model_fit_ids = prophet.get('modelFitIds', [])
    if not model_fit_ids:
        print(f"  ⚠️  No model fits for {prophet_name}")
        return False
    
    model_fit_id = model_fit_ids[0]  # Use first fit for now
    model_fit = get_model_fit(model_fit_id)
    
    if not model_fit:
        print(f"  ⚠️  Model fit not found: {model_fit_id}")
        return False
    
    # Check if remote inference is available
    inference_script_path = model_fit.get('s3RemoteInferenceScriptPath')
    parameters_path = model_fit.get('modelParametersPath')
    
    if not inference_script_path or not parameters_path:
        print(f"  ⚠️  Missing inference script or parameters")
        return False
    
    # Download inference script and parameters
    print(f"  📥 Downloading inference script: {inference_script_path}")
    inference_script = download_from_s3(inference_script_path)
    
    print(f"  📥 Downloading parameters: {parameters_path}")
    parameters = download_from_s3(parameters_path)
    
    if not inference_script or not parameters:
        print(f"  ⚠️  Failed to download required files")
        return False
    
    # Get latest price data
    print(f"  📥 Fetching price data for {asset_id}")
    price_data = get_latest_prices(asset_id, lookback_days=60)
    
    if not price_data or len(price_data) < 5:
        print(f"  ⚠️  Insufficient price data")
        return False
    
    # Execute inference
    print(f"  🔮 Running inference...")
    predicted_value = execute_remote_inference(inference_script, parameters, price_data)
    
    if predicted_value is None:
        print(f"  ⚠️  Inference failed")
        return False
    
    # Determine forecast date (next market day)
    latest_date = datetime.fromisoformat(price_data[-1]['date'])
    forecast_date = (latest_date + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Write forecast
    success = write_forecast(prophet_id, asset_id, forecast_date, predicted_value)
    
    if success:
        print(f"  ✅ Forecast complete: {predicted_value}")
    
    return success


def lambda_handler(event, context):
    """Main Lambda handler"""
    print("🚀 Starting daily predictions Lambda")
    print(f"Time: {datetime.utcnow().isoformat()}")
    
    # Get all active prophets
    prophets = get_active_prophets()
    print(f"\n📋 Found {len(prophets)} active prophets")
    
    if not prophets:
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No active prophets found'})
        }
    
    # Process each prophet
    results = {
        'total': len(prophets),
        'successful': 0,
        'failed': 0,
        'prophets': []
    }
    
    for prophet in prophets:
        prophet_id = prophet['prophetId']
        prophet_name = prophet.get('prophetName', prophet_id)
        
        try:
            success = process_prophet(prophet)
            if success:
                results['successful'] += 1
                results['prophets'].append({
                    'prophetId': prophet_id,
                    'name': prophet_name,
                    'status': 'success'
                })
            else:
                results['failed'] += 1
                results['prophets'].append({
                    'prophetId': prophet_id,
                    'name': prophet_name,
                    'status': 'failed'
                })
        except Exception as e:
            print(f"❌ Error processing {prophet_name}: {e}")
            results['failed'] += 1
            results['prophets'].append({
                'prophetId': prophet_id,
                'name': prophet_name,
                'status': 'error',
                'error': str(e)
            })
    
    print(f"\n✅ Daily predictions complete!")
    print(f"   Successful: {results['successful']}")
    print(f"   Failed: {results['failed']}")
    
    return {
        'statusCode': 200,
        'body': json.dumps(results, default=decimal_default)
    }


# For local testing
if __name__ == '__main__':
    result = lambda_handler({}, {})
    print(json.dumps(result, indent=2, default=decimal_default))
