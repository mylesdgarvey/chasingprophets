"""
Daily Performance Lambda
Computes performance metrics for all active prophets by comparing yesterday's predictions with today's actuals

Trigger: EventBridge rule at 06:05 ET daily (5 minutes after predictions)
Logic:
  1. Query all active prophets
  2. For each prophet:
     - Fetch yesterday's prediction from Forecasts table
     - Fetch today's actual price from AssetPrices
     - Compute error metrics (absolute error, percentage error, directional accuracy)
     - Update Forecasts table with actual value
     - Write to Performance table (daily record)
     - Update rolling aggregates in ProphetPerformanceSummary (multiple windows)
"""

import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
from collections import deque
from typing import List, Dict, Optional

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
PROPHETS_TABLE = os.environ.get('PROPHETS_TABLE', 'ChasingProphets-Prophets')
FORECASTS_TABLE = os.environ.get('FORECASTS_TABLE', 'ChasingProphets-Forecasts')
ASSET_PRICES_TABLE = os.environ.get('ASSET_PRICES_TABLE', 'ChasingProphets-AssetPrices')
PERFORMANCE_TABLE = os.environ.get('PERFORMANCE_TABLE', 'ChasingProphets-Performance')
PERFORMANCE_SUMMARY_TABLE = os.environ.get('PERFORMANCE_SUMMARY_TABLE', 'ChasingProphets-ProphetPerformanceSummary')

# DynamoDB tables
prophets_table = dynamodb.Table(PROPHETS_TABLE)
forecasts_table = dynamodb.Table(FORECASTS_TABLE)
asset_prices_table = dynamodb.Table(ASSET_PRICES_TABLE)
performance_table = dynamodb.Table(PERFORMANCE_TABLE)
performance_summary_table = dynamodb.Table(PERFORMANCE_SUMMARY_TABLE)

# Aggregation windows (in days)
WINDOWS = [20, 60, 120, 240]


def decimal_default(obj):
    """JSON encoder for Decimal types"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def get_active_prophets():
    """Fetch all active prophets"""
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


def get_actual_price(asset_id, date_str):
    """Fetch actual price for a specific date"""
    try:
        response = asset_prices_table.get_item(
            Key={'ticker': asset_id, 'date': date_str}
        )
        item = response.get('Item')
        if item:
            return float(item.get('close', 0))
        return None
    except Exception as e:
        print(f"Error fetching price for {asset_id} on {date_str}: {e}")
        return None


def get_yesterday_forecast(prophet_id, yesterday_str):
    """Fetch forecast for yesterday"""
    try:
        # Query forecasts by prophet and target date
        response = forecasts_table.query(
            IndexName='prophetId-targetDate-index',  # Assumes GSI exists
            KeyConditionExpression='prophetId = :pid AND targetDate = :date',
            ExpressionAttributeValues={
                ':pid': prophet_id,
                ':date': yesterday_str
            },
            Limit=1
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except:
        # Fallback: scan if GSI doesn't exist
        try:
            response = forecasts_table.scan(
                FilterExpression='prophetId = :pid AND targetDate = :date',
                ExpressionAttributeValues={
                    ':pid': prophet_id,
                    ':date': yesterday_str
                },
                Limit=1
            )
            items = response.get('Items', [])
            return items[0] if items else None
        except Exception as e:
            print(f"Error fetching forecast for {prophet_id} on {yesterday_str}: {e}")
            return None


def get_recent_performance(prophet_id, days=240):
    """Fetch recent performance records for rolling metrics"""
    try:
        response = performance_table.query(
            KeyConditionExpression='prophetId = :pid',
            ExpressionAttributeValues={':pid': prophet_id},
            ScanIndexForward=False,  # Descending order (latest first)
            Limit=days
        )
        items = response.get('Items', [])
        # Reverse to chronological order
        return sorted(items, key=lambda x: x['date'])
    except Exception as e:
        print(f"Error fetching performance for {prophet_id}: {e}")
        return []


def compute_metrics(predicted, actual):
    """Compute error metrics"""
    error = predicted - actual
    absolute_error = abs(error)
    percentage_error = (absolute_error / actual * 100) if actual != 0 else 0
    
    return {
        'error': error,
        'absoluteError': absolute_error,
        'percentageError': percentage_error
    }


def compute_rolling_metrics(performance_records: List[Dict], window_days: int) -> Optional[Dict]:
    """
    Compute rolling aggregated metrics for a given window
    
    Returns:
        {
            'mape': float,
            'percentileError75': float,
            'percentileError90': float,
            'directionalAccuracy': float
        }
    """
    if len(performance_records) < window_days:
        return None  # Not enough data
    
    # Get last N records
    recent = performance_records[-window_days:]
    
    # Extract metrics
    percentage_errors = [float(r.get('percentageError', 0)) for r in recent]
    errors = [float(r.get('error', 0)) for r in recent]
    actuals = [float(r.get('actual', 0)) for r in recent]
    predicteds = [float(r.get('predicted', 0)) for r in recent]
    
    # MAPE (Mean Absolute Percentage Error)
    mape = sum(percentage_errors) / len(percentage_errors)
    
    # Percentile errors
    sorted_errors = sorted(percentage_errors)
    idx_75 = int(len(sorted_errors) * 0.75)
    idx_90 = int(len(sorted_errors) * 0.90)
    percentile_error_75 = sorted_errors[idx_75]
    percentile_error_90 = sorted_errors[idx_90]
    
    # Directional accuracy (% of times predicted direction was correct)
    correct_direction = 0
    for i in range(1, len(actuals)):
        actual_direction = actuals[i] - actuals[i-1]
        predicted_direction = predicteds[i] - actuals[i-1]  # Compare prediction to previous actual
        
        if (actual_direction > 0 and predicted_direction > 0) or \
           (actual_direction < 0 and predicted_direction < 0) or \
           (actual_direction == 0 and predicted_direction == 0):
            correct_direction += 1
    
    directional_accuracy = (correct_direction / (len(actuals) - 1) * 100) if len(actuals) > 1 else 0
    
    return {
        'mape': round(mape, 2),
        'percentileError75': round(percentile_error_75, 2),
        'percentileError90': round(percentile_error_90, 2),
        'directionalAccuracy': round(directional_accuracy, 2)
    }


def update_forecast_with_actual(forecast_id, actual_value):
    """Update forecast record with actual value"""
    try:
        forecasts_table.update_item(
            Key={'forecastId': forecast_id},
            UpdateExpression='SET actual = :actual',
            ExpressionAttributeValues={':actual': Decimal(str(actual_value))}
        )
        return True
    except Exception as e:
        print(f"Error updating forecast {forecast_id}: {e}")
        return False


def write_performance_record(prophet_id, date_str, predicted, actual, metrics):
    """Write daily performance record"""
    try:
        item = {
            'prophetId': prophet_id,
            'date': date_str,
            'predicted': Decimal(str(predicted)),
            'actual': Decimal(str(actual)),
            'error': Decimal(str(metrics['error'])),
            'absoluteError': Decimal(str(metrics['absoluteError'])),
            'percentageError': Decimal(str(metrics['percentageError'])),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        performance_table.put_item(Item=item)
        return True
    except Exception as e:
        print(f"Error writing performance record: {e}")
        return False


def update_performance_summary(prophet_id, window_days, metrics):
    """Update or create performance summary for a specific window"""
    try:
        aggregation_window = f"{window_days}-day"
        
        item = {
            'prophetId': prophet_id,
            'aggregationWindow': aggregation_window,
            'mape': Decimal(str(metrics['mape'])),
            'percentileError75': Decimal(str(metrics['percentileError75'])),
            'percentileError90': Decimal(str(metrics['percentileError90'])),
            'directionalAccuracy': Decimal(str(metrics['directionalAccuracy'])),
            'lastUpdated': datetime.utcnow().isoformat()
        }
        
        performance_summary_table.put_item(Item=item)
        return True
    except Exception as e:
        print(f"Error updating summary for {window_days}-day: {e}")
        return False


def process_prophet(prophet, today_str, yesterday_str):
    """Process performance for a single prophet"""
    prophet_id = prophet['prophetId']
    prophet_name = prophet.get('prophetName', prophet_id)
    asset_id = prophet.get('assetId')
    
    print(f"\n📊 Processing: {prophet_name} ({prophet_id})")
    
    # Get yesterday's forecast
    forecast = get_yesterday_forecast(prophet_id, yesterday_str)
    if not forecast:
        print(f"  ⚠️  No forecast for {yesterday_str}")
        return False
    
    forecast_id = forecast['forecastId']
    predicted = float(forecast.get('predicted', 0))
    
    # Get today's actual price
    actual = get_actual_price(asset_id, today_str)
    if actual is None:
        print(f"  ⚠️  No actual price for {today_str}")
        return False
    
    print(f"  📈 Predicted: {predicted:.2f}, Actual: {actual:.2f}")
    
    # Compute metrics
    metrics = compute_metrics(predicted, actual)
    print(f"  📊 Error: {metrics['error']:.2f}, MAPE: {metrics['percentageError']:.2f}%")
    
    # Update forecast with actual
    update_forecast_with_actual(forecast_id, actual)
    
    # Write performance record
    write_performance_record(prophet_id, today_str, predicted, actual, metrics)
    
    # Get recent performance for rolling metrics
    performance_records = get_recent_performance(prophet_id, days=max(WINDOWS))
    
    # Add today's record
    performance_records.append({
        'prophetId': prophet_id,
        'date': today_str,
        'predicted': predicted,
        'actual': actual,
        **metrics
    })
    
    # Update rolling summaries for each window
    for window in WINDOWS:
        rolling_metrics = compute_rolling_metrics(performance_records, window)
        if rolling_metrics:
            update_performance_summary(prophet_id, window, rolling_metrics)
            print(f"  ✅ Updated {window}-day summary: MAPE={rolling_metrics['mape']}%")
        else:
            print(f"  ⚠️  Not enough data for {window}-day window")
    
    return True


def lambda_handler(event, context):
    """Main Lambda handler"""
    print("🚀 Starting daily performance Lambda")
    print(f"Time: {datetime.utcnow().isoformat()}")
    
    # Calculate dates
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    today_str = today.strftime('%Y-%m-%d')
    yesterday_str = yesterday.strftime('%Y-%m-%d')
    
    print(f"Yesterday (forecast date): {yesterday_str}")
    print(f"Today (actual date): {today_str}")
    
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
        'date': today_str,
        'prophets': []
    }
    
    for prophet in prophets:
        prophet_id = prophet['prophetId']
        prophet_name = prophet.get('prophetName', prophet_id)
        
        try:
            success = process_prophet(prophet, today_str, yesterday_str)
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
            import traceback
            traceback.print_exc()
            results['failed'] += 1
            results['prophets'].append({
                'prophetId': prophet_id,
                'name': prophet_name,
                'status': 'error',
                'error': str(e)
            })
    
    print(f"\n✅ Daily performance processing complete!")
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
