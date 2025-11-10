#!/usr/bin/env python3
"""
Initialize default model scaffolds, data slices, model fits, and prophets.
Session 4: Populate DynamoDB with baseline predictive models.
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import boto3

# AWS Configuration
REGION = os.getenv('AWS_REGION', 'us-east-1')
ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

if not ACCESS_KEY or not SECRET_KEY:
    print("❌ ERROR: AWS credentials not found in environment")
    sys.exit(1)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=REGION)

TABLES = {
    'DATASETS': 'ChasingProphets-Datasets',
    'DATA_SLICES': 'ChasingProphets-DataSlices',
    'MODEL_SCAFFOLDS': 'ChasingProphets-ModelScaffolds',
    'MODEL_FITS': 'ChasingProphets-ModelFits',
    'PROPHETS': 'ChasingProphets-Prophets'
}

# Assets we're working with
ASSETS = [
    {'ticker': '^DJI', 'name': 'DJIA'},
    {'ticker': '^GSPC', 'name': 'SPX'}
]

def create_model_scaffolds():
    """
    Create 2 general linear regression scaffolds:
    1. SLR - Simple Linear Regression (supports any single lag, we'll use lag=1)
    2. MLR - Multiple Linear Regression (supports multiple lags, we'll use lags=[1,2])
    """
    print("\n" + "="*60)
    print("Creating Model Scaffolds")
    print("="*60)
    
    table = dynamodb.Table(TABLES['MODEL_SCAFFOLDS'])
    
    scaffolds = [
        {
            'scaffoldId': 'SLR',
            'name': 'Simple Linear Regression',
            'description': 'General SLR model with configurable lag. Uses single lagged value as predictor.',
            'formulaLatex': r'y_t = \beta_0 + \beta_1 \cdot y_{t-k} + \epsilon',
            'modelType': 'statistical',
            'defaultParams': {
                'lag': 1  # Default lag, but configurable per fit
            },
            'createdAt': datetime.now().isoformat(),
            'lastUpdated': datetime.now().isoformat()
        },
        {
            'scaffoldId': 'MLR',
            'name': 'Multiple Linear Regression',
            'description': 'General MLR model with configurable lags. Uses multiple lagged values as predictors.',
            'formulaLatex': r'y_t = \beta_0 + \sum_{i=1}^{n} \beta_i \cdot y_{t-k_i} + \epsilon',
            'modelType': 'statistical',
            'defaultParams': {
                'lags': [1, 2]  # Default lags, but configurable per fit
            },
            'createdAt': datetime.now().isoformat(),
            'lastUpdated': datetime.now().isoformat()
        }
    ]
    
    for scaffold in scaffolds:
        table.put_item(Item=scaffold)
        print(f"✅ Created scaffold: {scaffold['scaffoldId']} - {scaffold['name']}")
        print(f"   Formula: {scaffold['formulaLatex']}")
        print(f"   Default params: {scaffold['defaultParams']}")
    
    return scaffolds

def create_data_slices():
    """
    Create 2-year data slices for DJIA and SPX
    Uses the last 2 years of available data
    """
    print("\n" + "="*60)
    print("Creating Data Slices")
    print("="*60)
    
    datasets_table = dynamodb.Table(TABLES['DATASETS'])
    slices_table = dynamodb.Table(TABLES['DATA_SLICES'])
    
    # Calculate 2-year window
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=2*365)
    
    slices = []
    
    for asset in ASSETS:
        # Get the dataset for this asset
        response = datasets_table.query(
            IndexName='AssetIndex',
            KeyConditionExpression='assetId = :assetId',
            ExpressionAttributeValues={':assetId': asset['ticker']}
        )
        
        if not response['Items']:
            print(f"⚠️  No dataset found for {asset['name']}, skipping...")
            continue
        
        dataset = response['Items'][0]
        
        # Create data slice
        slice_data = {
            'dataSliceId': f"slice-{asset['name'].lower()}-last2y",
            'datasetId': dataset['datasetId'],
            'startDate': start_date.isoformat(),
            'endDate': end_date.isoformat(),
            'description': f"Last 2 years of {asset['name']} data for training",
            'createdAt': datetime.now().isoformat()
        }
        
        slices_table.put_item(Item=slice_data)
        slices.append(slice_data)
        print(f"✅ Created slice: {slice_data['dataSliceId']}")
        print(f"   Dataset: {dataset['datasetId']}")
        print(f"   Date range: {start_date} to {end_date}")
    
    return slices

def create_model_fits(scaffolds, slices):
    """
    Create 4 model fits:
    - SLR × DJIA (lag=1)
    - SLR × SPX (lag=1)
    - MLR × DJIA (lags=[1,2])
    - MLR × SPX (lags=[1,2])
    """
    print("\n" + "="*60)
    print("Creating Model Fits")
    print("="*60)
    
    table = dynamodb.Table(TABLES['MODEL_FITS'])
    
    fits = []
    
    for scaffold in scaffolds:
        for asset in ASSETS:
            # Find matching slice
            slice_match = next((s for s in slices if asset['name'].lower() in s['dataSliceId']), None)
            if not slice_match:
                print(f"⚠️  No slice found for {asset['name']}, skipping...")
                continue
            
            # Determine params based on scaffold
            if scaffold['scaffoldId'] == 'SLR':
                fit_params = {'lag': 1}
                model_fit_id = f"fit-slr-lag1-{asset['name'].lower()}"
            else:  # MLR
                fit_params = {'lags': [1, 2]}
                model_fit_id = f"fit-mlr-lag12-{asset['name'].lower()}"
            
            fit_data = {
                'modelFitId': model_fit_id,
                'scaffoldId': scaffold['scaffoldId'],
                'assetId': asset['ticker'],
                'dataSliceId': slice_match['dataSliceId'],
                'fitParams': fit_params,
                'trainingStatus': 'fit',  # Marking as fit (in reality would be trained)
                'trainingMetrics': {
                    'mape': Decimal('0.0'),  # Placeholder - would be real metrics after training
                    'rmse': Decimal('0.0'),
                    'r2': Decimal('0.0')
                },
                'modelUrl': f"s3://chasingprophets-models-{REGION}/models/{model_fit_id}/model.json",
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            }
            
            table.put_item(Item=fit_data)
            fits.append(fit_data)
            print(f"✅ Created fit: {fit_data['modelFitId']}")
            print(f"   Scaffold: {scaffold['scaffoldId']}")
            print(f"   Asset: {asset['name']} ({asset['ticker']})")
            print(f"   Params: {fit_params}")
    
    return fits

def create_prophets(fits):
    """
    Create 4 prophets, one for each model fit
    """
    print("\n" + "="*60)
    print("Creating Prophets")
    print("="*60)
    
    table = dynamodb.Table(TABLES['PROPHETS'])
    
    prophets = []
    
    # Prophet naming map
    prophet_names = {
        'SLR': 'SimpleSage',
        'MLR': 'MultiMind'
    }
    
    for fit in fits:
        # Extract scaffold and asset from fit
        scaffold_id = fit['scaffoldId']
        asset_id = fit['assetId']
        
        # Find asset name
        asset = next((a for a in ASSETS if a['ticker'] == asset_id), None)
        if not asset:
            continue
        
        base_name = prophet_names.get(scaffold_id, scaffold_id)
        
        prophet_data = {
            'prophetId': f"prophet-{fit['modelFitId']}",
            'name': f"{base_name} - {asset['name']}",
            'assetId': asset_id,
            'modelFitIds': [fit['modelFitId']],  # Array to support ensembling
            'forecastMethod': 'direct',
            'outputMeasure': 'close_price',
            'isActive': 'true',  # String instead of boolean to match GSI type
            'description': f"{scaffold_id} prophet for {asset['name']} using {fit.get('fitParams', {})}",
            'createdAt': datetime.now().isoformat(),
            'lastUpdated': datetime.now().isoformat()
        }
        
        table.put_item(Item=prophet_data)
        prophets.append(prophet_data)
        print(f"✅ Created prophet: {prophet_data['name']}")
        print(f"   Prophet ID: {prophet_data['prophetId']}")
        print(f"   Asset: {asset['name']}")
        print(f"   Model Fits: {prophet_data['modelFitIds']}")
    
    return prophets

def main():
    print("🚀 Initializing default models for Chasing Prophets")
    print(f"AWS Region: {REGION}")
    
    try:
        # Step 1: Create scaffolds
        scaffolds = create_model_scaffolds()
        
        # Step 2: Create data slices
        slices = create_data_slices()
        
        # Step 3: Create model fits
        fits = create_model_fits(scaffolds, slices)
        
        # Step 4: Create prophets
        prophets = create_prophets(fits)
        
        print("\n" + "="*60)
        print("✅ Initialization Complete!")
        print("="*60)
        print(f"Created:")
        print(f"  - {len(scaffolds)} model scaffolds")
        print(f"  - {len(slices)} data slices")
        print(f"  - {len(fits)} model fits")
        print(f"  - {len(prophets)} prophets")
        print("\n✅ Ready to generate forecasts!")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
