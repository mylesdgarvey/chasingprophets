#!/usr/bin/env python3
"""
Calculate Performance Metrics for All Prophets

This script:
1. Loads trained model parameters from S3
2. Runs inference on the MOST RECENT data (20, 60, 120, 240 days)
3. Calculates performance metrics (MAPE, RMSE, R², Directional Accuracy) for each window
4. Stores results in ChasingProphets-ProphetPerformanceSummary table

Note: Models are trained on historical slices but evaluated on RECENT data
"""

import boto3
import json
import pandas as pd
import numpy as np
from datetime import datetime
from decimal import Decimal
import sys
from io import StringIO

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3 = boto3.client('s3', region_name='us-east-1')

BUCKET = 'chasingprophets-models-us-east-1'
TABLES = {
    'PROPHETS': 'ChasingProphets-Prophets',
    'MODEL_FITS': 'ChasingProphets-ModelFits',
    'DATA_SLICES': 'ChasingProphets-DataSlices',
    'DATASETS': 'ChasingProphets-Datasets',
    'PERFORMANCE': 'ChasingProphets-Performance',
    'PROPHET_PERFORMANCE_SUMMARY': 'ChasingProphets-ProphetPerformanceSummary'
}

# Evaluation windows (most recent N days)
EVALUATION_WINDOWS = [20, 60, 120, 240]

def load_from_s3(key):
    """Load file content from S3"""
    response = s3.get_object(Bucket=BUCKET, Key=key)
    return response['Body'].read().decode('utf-8')

def load_csv_from_s3(key):
    """Load CSV data from S3 into DataFrame"""
    content = load_from_s3(key)
    return pd.read_csv(StringIO(content))

def calculate_returns(prices):
    """Calculate percentage returns from prices"""
    returns = []
    for i in range(1, len(prices)):
        ret = ((prices[i] / prices[i-1]) - 1) * 100
        returns.append(ret)
    return returns

def predict_slr(parameters, return_t_minus_1):
    """Simple Linear Regression prediction"""
    slope = parameters['slope']
    intercept = parameters['intercept']
    return slope * return_t_minus_1 + intercept

def predict_mlr(parameters, return_t_minus_1, return_t_minus_2):
    """Multiple Linear Regression prediction"""
    coefficients = parameters['coefficients']
    intercept = parameters['intercept']
    input_fields = parameters.get('input_fields', ['return_t-1', 'return_t-2'])
    
    # Map input fields to values
    features = []
    for field in input_fields:
        if field == 'return_t-1':
            features.append(return_t_minus_1)
        elif field == 'return_t-2':
            features.append(return_t_minus_2)
    
    prediction = intercept
    for i, coef in enumerate(coefficients):
        if i < len(features):
            prediction += coef * features[i]
    
    return prediction

def run_inference_on_recent_data(scaffold_id, parameters, asset_id):
    """
    Run inference on the MOST RECENT data for the asset
    Returns: DataFrame with full historical data and predictions
    """
    # Asset IDs are already DJIA or SPX, no mapping needed
    folder = asset_id
    
    # Load the full CSV data
    s3_path = f'data/assets/{folder}/ohlcv_full.csv'
    try:
        df = load_csv_from_s3(s3_path)
    except Exception as e:
        print(f"    ✗ Failed to load CSV from {s3_path}: {e}")
        return []
    
    # Get price column (close)
    prices = df['close'].values
    dates = df['date'].values
    
    # Calculate returns
    returns = calculate_returns(prices)
    
    predictions = []
    
    # Need at least 3 data points for MLR (t-2, t-1, t)
    min_index = 3
    
    for i in range(min_index, len(df)):
        date = dates[i]
        actual_price = prices[i]
        previous_price = prices[i-1]
        
        # Get lagged returns
        return_t_minus_1 = returns[i-2]  # returns[i-2] corresponds to day i-1
        return_t_minus_2 = returns[i-3] if i >= 3 else 0.0
        
        # Predict next return
        try:
            if scaffold_id.lower() == 'slr':
                predicted_return = predict_slr(parameters, return_t_minus_1)
            elif scaffold_id.lower() == 'mlr':
                predicted_return = predict_mlr(parameters, return_t_minus_1, return_t_minus_2)
            else:
                if len(predictions) == 0:
                    print(f"    ✗ Unknown scaffold: {scaffold_id}")
                return []
        except Exception as e:
            if len(predictions) == 0:  # Only print error once
                print(f"    ✗ Prediction error: {e}")
            return []
        
        # Convert predicted return to price
        predicted_price = previous_price * (1 + predicted_return / 100)
        
        # Actual return for this day
        actual_return = returns[i-1]
        
        predictions.append({
            'date': date,
            'actual_price': float(actual_price),
            'predicted_price': float(predicted_price),
            'actual_return': float(actual_return),
            'predicted_return': float(predicted_return)
        })
    
    return predictions

def calculate_metrics_for_window(predictions, window_days):
    """
    Calculate performance metrics for the most recent N days
    """
    if len(predictions) < window_days:
        # Not enough data for this window
        return None
    
    # Take the most recent window_days predictions
    recent_predictions = predictions[-window_days:]
    
    actual_prices = np.array([p['actual_price'] for p in recent_predictions])
    predicted_prices = np.array([p['predicted_price'] for p in recent_predictions])
    actual_returns = np.array([p['actual_return'] for p in recent_predictions])
    predicted_returns = np.array([p['predicted_return'] for p in recent_predictions])
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((actual_prices - predicted_prices) / actual_prices)) * 100
    
    # RMSE (Root Mean Squared Error)
    rmse = np.sqrt(np.mean((actual_prices - predicted_prices) ** 2))
    
    # R² Score
    ss_res = np.sum((actual_prices - predicted_prices) ** 2)
    ss_tot = np.sum((actual_prices - np.mean(actual_prices)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Directional Accuracy (did we predict the direction correctly?)
    actual_directions = np.sign(actual_returns)
    predicted_directions = np.sign(predicted_returns)
    directional_accuracy = np.mean(actual_directions == predicted_directions) * 100
    
    return {
        'mape': float(mape),
        'rmse': float(rmse),
        'r2': float(r2),
        'directional_accuracy': float(directional_accuracy),
        'sample_size': len(recent_predictions)
    }

def process_prophet(prophet):
    """Process a single prophet and calculate its performance across all windows"""
    prophet_id = prophet['prophetId']
    model_fit_ids = prophet.get('modelFitIds', [])
    asset_id = prophet['assetId']
    
    if not model_fit_ids or len(model_fit_ids) == 0:
        print(f"⚠️  {prophet_id}: No model fits")
        return False
    
    # Use the first model fit (prophets have one fit in our current setup)
    model_fit_id = model_fit_ids[0]
    
    print(f"Processing {prophet_id}...", end='', flush=True)
    
    try:
        # Get model fit details
        model_fits_table = dynamodb.Table(TABLES['MODEL_FITS'])
        model_fit_response = model_fits_table.get_item(Key={'modelFitId': model_fit_id})
        
        if 'Item' not in model_fit_response:
            print(f" ⚠️  Model fit not found: {model_fit_id}")
            return False
        
        model_fit = model_fit_response['Item']
        scaffold_id = model_fit['scaffoldId']
        s3_parameters_path = model_fit['modelParametersPath']
        
        # Load parameters from S3
        params_key = s3_parameters_path.replace(f's3://{BUCKET}/', '')
        params_json = load_from_s3(params_key)
        params_data = json.loads(params_json)
        # Parameters are stored directly in the JSON, not nested under 'parameters' key
        parameters = params_data if 'slope' in params_data or 'coefficients' in params_data else params_data.get('parameters', params_data)
        
        # Run inference on the FULL dataset for this asset
        all_predictions = run_inference_on_recent_data(scaffold_id, parameters, asset_id)
        
        if len(all_predictions) == 0:
            print(f" ⚠️  No predictions generated")
            return False
        
        # Calculate metrics for each evaluation window
        performance_summary_table = dynamodb.Table(TABLES['PROPHET_PERFORMANCE_SUMMARY'])
        window_metrics = {}
        
        for window_days in EVALUATION_WINDOWS:
            metrics = calculate_metrics_for_window(all_predictions, window_days)
            
            if metrics is None:
                continue
            
            window_key = f"{window_days}-day"
            window_metrics[window_key] = metrics
            
            # Store in ProphetPerformanceSummary table
            performance_summary_table.put_item(Item={
                'prophetId': prophet_id,
                'aggregationWindow': window_key,
                'mape': Decimal(str(metrics['mape'])),
                'rmse': Decimal(str(metrics['rmse'])),
                'r2': Decimal(str(metrics['r2'])),
                'directionalAccuracy': Decimal(str(metrics['directional_accuracy'])),
                'sampleSize': metrics['sample_size'],
                'lastUpdated': datetime.now().isoformat()
            })
        
        if len(window_metrics) == 0:
            print(f" ⚠️  No windows calculated")
            return False
        
        # Print summary (show metrics for each window)
        metrics_str = ", ".join([
            f"{win}: MAPE={m['mape']:.2f}%" 
            for win, m in window_metrics.items()
        ])
        print(f" ✓ {metrics_str}")
        return True
        
    except Exception as e:
        print(f" ✗ Error: {str(e)}")
        return False

def main():
    """Main execution"""
    print("📊 Calculating Performance Metrics for All Prophets\n")
    
    # Get all active prophets
    prophets_table = dynamodb.Table(TABLES['PROPHETS'])
    response = prophets_table.scan(
        FilterExpression='#status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'active'}
    )
    
    prophets = response['Items']
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = prophets_table.scan(
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'active'},
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        prophets.extend(response['Items'])
    
    print(f"Found {len(prophets)} active prophets\n")
    
    success_count = 0
    failure_count = 0
    
    for i, prophet in enumerate(prophets, 1):
        if process_prophet(prophet):
            success_count += 1
        else:
            failure_count += 1
    
    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  ✓ Success: {success_count}")
    print(f"  ✗ Failed:  {failure_count}")
    print(f"  Total:     {len(prophets)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
