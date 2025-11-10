#!/usr/bin/env tsx
/**
 * Complete Database and S3 Cleanup + Initialization
 * 
 * This script:
 * 1. Cleans up S3 to match intended architecture
 * 2. Resets all DynamoDB tables
 * 3. Initializes proper data structure:
 *    - Assets (DJIA, SPX)
 *    - Datasets (pointing to S3 CSV files)
 *    - Data Slices (metadata only - NO CSV storage)
 *    - Model Scaffolds (SLR, MLR)
 *    - Model Fits (creates metadata, marks as untrained)
 *    - Prophets (creates metadata, marks as pending_training)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  PutCommand,
  DeleteCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  S3Client, 
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const s3 = new S3Client({ region: REGION });

const TABLES = {
  ASSETS: 'ChasingProphets-Assets',
  DATASETS: 'ChasingProphets-Datasets',
  DATA_SLICES: 'ChasingProphets-DataSlices',
  MODEL_SCAFFOLDS: 'ChasingProphets-ModelScaffolds',
  MODEL_FITS: 'ChasingProphets-ModelFits',
  PROPHETS: 'ChasingProphets-Prophets',
  FORECASTS: 'ChasingProphets-Forecasts',
  PERFORMANCE: 'ChasingProphets-Performance',
  PROPHET_PERFORMANCE_SUMMARY: 'ChasingProphets-ProphetPerformanceSummary'
};

console.log('🧹 PHASE 1: Cleaning S3 bucket structure...\n');

async function cleanS3Structure() {
  try {
    // List all objects
    const listResponse = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET
    }));

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('  ℹ️  S3 bucket is empty');
      return;
    }

    console.log(`  Found ${listResponse.Contents.length} objects in S3`);
    
    // Identify objects that don't match intended structure
    const toDelete: string[] = [];
    const toKeep: string[] = [];
    
    for (const obj of listResponse.Contents) {
      const key = obj.Key!;
      
      // Keep: data/assets/{TICKER}/ohlcv_full.csv
      // Keep: scripts/scaffolds/{scaffoldId}/*.py, *.js
      // Keep: scripts/prophets/{prophetId}/*.js
      // Keep: models/{modelFitId}/parameters.json
      // DELETE: Everything else (especially data/, datasets/, slices/ folders)
      
      const validPaths = [
        /^data\/assets\/[A-Z0-9^]+\/ohlcv_full\.csv$/,  // Raw asset data
        /^scripts\/scaffolds\/[a-z0-9-]+\/(train\.py|inference\.py|inference\.js)$/,  // Scaffold scripts
        /^scripts\/prophets\/[a-z0-9-]+\/output_transform\.js$/,  // Prophet transforms
        /^models\/[a-z0-9-]+\/parameters\.json$/,  // Model parameters
        /^public\/djia_sample\.csv$/  // Legacy public sample
      ];
      
      const isValid = validPaths.some(pattern => pattern.test(key));
      
      if (isValid) {
        toKeep.push(key);
      } else {
        toDelete.push(key);
      }
    }
    
    console.log(`  ✓ Keeping ${toKeep.length} valid objects`);
    console.log(`  ✗ Deleting ${toDelete.length} invalid objects`);
    
    if (toDelete.length > 0) {
      // Delete in batches of 1000 (S3 limit)
      for (let i = 0; i < toDelete.length; i += 1000) {
        const batch = toDelete.slice(i, i + 1000);
        await s3.send(new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: {
            Objects: batch.map(key => ({ Key: key }))
          }
        }));
        console.log(`  Deleted batch ${Math.floor(i / 1000) + 1}`);
      }
    }
    
    console.log('  ✅ S3 cleanup complete\n');
  } catch (error) {
    console.error('  ❌ S3 cleanup failed:', error);
    throw error;
  }
}

console.log('🗑️  PHASE 2: Clearing DynamoDB tables...\n');

async function clearTable(tableName: string) {
  try {
    const scanResponse = await ddb.send(new ScanCommand({
      TableName: tableName
    }));
    
    if (!scanResponse.Items || scanResponse.Items.length === 0) {
      console.log(`  ${tableName}: Already empty`);
      return;
    }
    
    console.log(`  ${tableName}: Deleting ${scanResponse.Items.length} items...`);
    
    // Delete in batches of 25 (DynamoDB limit)
    for (let i = 0; i < scanResponse.Items.length; i += 25) {
      const batch = scanResponse.Items.slice(i, i + 25);
      const requests = batch.map(item => ({
        DeleteRequest: {
          Key: getTableKey(tableName, item)
        }
      }));
      
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: requests
        }
      }));
    }
    
    console.log(`  ✓ ${tableName}: Cleared`);
  } catch (error) {
    console.error(`  ✗ ${tableName}: Failed -`, error);
  }
}

function getTableKey(tableName: string, item: any): any {
  // ProphetPerformanceSummary has composite key
  if (tableName === TABLES.PROPHET_PERFORMANCE_SUMMARY) {
    return {
      prophetId: item.prophetId,
      aggregationWindow: item.aggregationWindow
    };
  }
  
  const keyMap: Record<string, string> = {
    [TABLES.ASSETS]: 'ticker',
    [TABLES.DATASETS]: 'datasetId',
    [TABLES.DATA_SLICES]: 'dataSliceId',
    [TABLES.MODEL_SCAFFOLDS]: 'scaffoldId',
    [TABLES.MODEL_FITS]: 'modelFitId',
    [TABLES.PROPHETS]: 'prophetId',
    [TABLES.FORECASTS]: 'forecastId',
    [TABLES.PERFORMANCE]: 'performanceId'
  };
  
  const keyName = keyMap[tableName];
  return { [keyName]: item[keyName] };
}

async function clearAllTables() {
  for (const [name, tableName] of Object.entries(TABLES)) {
    await clearTable(tableName);
  }
  console.log();
}

console.log('📊 PHASE 3: Initializing Assets...\n');

async function initializeAssets() {
  const assets = [
    {
      ticker: '^DJI',  // Official Yahoo Finance ticker for DJIA
      name: 'Dow Jones Industrial Average',
      type: 'index',
      description: 'Price-weighted index of 30 prominent US companies',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      ticker: '^GSPC',  // Official Yahoo Finance ticker for S&P 500
      name: 'S&P 500',
      type: 'index',
      description: 'Market-cap weighted index of 500 large US companies',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
  
  for (const asset of assets) {
    await ddb.send(new PutCommand({
      TableName: TABLES.ASSETS,
      Item: asset
    }));
    console.log(`  ✓ Created asset: ${asset.ticker} (${asset.name})`);
  }
  console.log();
}

console.log('💾 PHASE 4: Initializing Datasets...\n');

async function initializeDatasets() {
  const datasets = [
    {
      datasetId: 'djia-historical',
      name: 'DJIA Historical OHLCV',
      assetId: '^DJI',
      source: `s3://${BUCKET}/data/assets/DJIA/ohlcv_full.csv`,
      description: 'Complete historical OHLCV data for Dow Jones',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      datasetId: 'spx-historical',
      name: 'S&P 500 Historical OHLCV',
      assetId: '^GSPC',
      source: `s3://${BUCKET}/data/assets/SPX/ohlcv_full.csv`,
      description: 'Complete historical OHLCV data for S&P 500',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
  
  for (const dataset of datasets) {
    await ddb.send(new PutCommand({
      TableName: TABLES.DATASETS,
      Item: dataset
    }));
    console.log(`  ✓ Created dataset: ${dataset.datasetId}`);
  }
  console.log();
}

console.log('📐 PHASE 5: Initializing Data Slices (metadata only)...\n');

async function initializeDataSlices() {
  // Dataset spans: 2015-11-09 to 2025-11-05 (2513 days)
  const datasetStart = new Date('2015-11-09');
  const datasetEnd = new Date('2025-11-05');
  const totalDays = 2513;
  
  // Create sliding windows for each duration
  const windowSizes = [
    { days: 20, count: Math.floor(totalDays / 20) },   // ~125 slices
    { days: 60, count: Math.floor(totalDays / 60) },   // ~41 slices
    { days: 120, count: Math.floor(totalDays / 120) }, // ~20 slices
    { days: 240, count: Math.floor(totalDays / 240) }  // ~10 slices
  ];
  
  const datasets = [
    { id: 'djia-historical', ticker: 'DJIA' },
    { id: 'spx-historical', ticker: 'SPX' }
  ];
  
  let totalSlices = 0;
  
  for (const dataset of datasets) {
    for (const window of windowSizes) {
      for (let i = 0; i < window.count; i++) {
        const startOffset = i * window.days;
        const endOffset = startOffset + window.days - 1;
        
        const startDate = new Date(datasetStart);
        startDate.setDate(startDate.getDate() + startOffset);
        
        const endDate = new Date(datasetStart);
        endDate.setDate(endDate.getDate() + endOffset);
        
        const sliceId = `${dataset.id}-${window.days}d-slice${i + 1}`;
        
        const slice = {
          dataSliceId: sliceId,
          name: `${dataset.ticker} ${window.days}d Window #${i + 1}`,
          datasetId: dataset.id,
          sliceType: 'sliding_window',
          windowSize: window.days,
          windowIndex: i + 1,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          availableColumns: ['date', 'open', 'high', 'low', 'close', 'volume'],
          columnTypes: {
            date: 'datetime',
            open: 'numerical',
            high: 'numerical',
            low: 'numerical',
            close: 'numerical',
            volume: 'numerical'
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        await ddb.send(new PutCommand({
          TableName: TABLES.DATA_SLICES,
          Item: slice
        }));
        totalSlices++;
      }
      console.log(`  ✓ Created ${window.count} slices for ${dataset.ticker} (${window.days}d windows)`);
    }
  }
  console.log(`  ✅ Total slices created: ${totalSlices}\n`);
}

console.log('🧬 PHASE 6: Initializing Model Scaffolds...\n');

async function initializeScaffolds() {
  const scaffolds = [
    {
      scaffoldId: 'slr',
      name: 'Simple Linear Regression',
      description: 'Single-variable linear regression for time series forecasting',
      scaffoldType: 'context-dependent',
      learningAlgorithm: 'ordinary_least_squares',
      modelCategory: 'econometrics',
      inferenceMode: 'hybrid',
      formula: 'y = \\beta_0 + \\beta_1 x + \\epsilon',
      s3TrainingScriptPath: `s3://${BUCKET}/scripts/scaffolds/slr/train.py`,
      s3RemoteInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/slr/inference.py`,
      s3LocalInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/slr/inference.js`,
      inputContract: {
        fields: ['close'],
        types: { close: 'numerical' }
      },
      outputContract: {
        fields: ['predicted_close'],
        types: { predicted_close: 'numerical' }
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      scaffoldId: 'mlr',
      name: 'Multiple Linear Regression',
      description: 'Multi-variable linear regression for time series forecasting',
      scaffoldType: 'context-dependent',
      learningAlgorithm: 'ordinary_least_squares',
      modelCategory: 'econometrics',
      inferenceMode: 'hybrid',
      formula: 'y = \\beta_0 + \\beta_1 x_1 + \\beta_2 x_2 + ... + \\epsilon',
      s3TrainingScriptPath: `s3://${BUCKET}/scripts/scaffolds/mlr/train.py`,
      s3RemoteInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/mlr/inference.py`,
      s3LocalInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/mlr/inference.js`,
      inputContract: {
        fields: ['open', 'high', 'low', 'close', 'volume'],
        types: { 
          open: 'numerical', 
          high: 'numerical', 
          low: 'numerical', 
          close: 'numerical', 
          volume: 'numerical' 
        }
      },
      outputContract: {
        fields: ['predicted_close'],
        types: { predicted_close: 'numerical' }
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
  
  for (const scaffold of scaffolds) {
    await ddb.send(new PutCommand({
      TableName: TABLES.MODEL_SCAFFOLDS,
      Item: scaffold
    }));
    console.log(`  ✓ Created scaffold: ${scaffold.scaffoldId} (${scaffold.name})`);
  }
  console.log();
}

console.log('🎯 PHASE 7: Initializing Model Fits (untrained)...\n');

async function initializeModelFits() {
  // Get all data slices
  const scanResult = await ddb.send(new ScanCommand({
    TableName: TABLES.DATA_SLICES
  }));
  
  const slices = scanResult.Items || [];
  const scaffolds = ['slr', 'mlr'];
  
  let totalFits = 0;
  
  for (const scaffold of scaffolds) {
    for (const slice of slices) {
      const modelFitId = `${scaffold}-${slice.dataSliceId}`;
      
      const fit = {
        modelFitId,
        scaffoldId: scaffold,
        dataSliceId: slice.dataSliceId,
        assetId: slice.datasetId.startsWith('djia') ? '^DJI' : '^GSPC',
        trainingStatus: 'pending_training',
        modelParametersPath: `s3://${BUCKET}/models/${modelFitId}/parameters.json`,
        s3TrainingScriptPath: `s3://${BUCKET}/scripts/scaffolds/${scaffold}/train.py`,
        s3RemoteInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/${scaffold}/inference.py`,
        s3LocalInferenceScriptPath: `s3://${BUCKET}/scripts/scaffolds/${scaffold}/inference.js`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await ddb.send(new PutCommand({
        TableName: TABLES.MODEL_FITS,
        Item: fit
      }));
      totalFits++;
    }
    console.log(`  ✓ Created ${slices.length} model fits for scaffold: ${scaffold}`);
  }
  console.log(`  ✅ Total model fits created: ${totalFits}\n`);
}

console.log('🔮 PHASE 8: Initializing Prophets (pending training)...\n');

async function initializeProphets() {
  // Get all model fits
  const scanResult = await ddb.send(new ScanCommand({
    TableName: TABLES.MODEL_FITS
  }));
  
  const modelFits = scanResult.Items || [];
  let totalProphets = 0;
  
  for (const fit of modelFits) {
    const prophetId = `prophet-${fit.modelFitId}`;
    
    // Extract asset ticker for name (e.g., "DJIA" from "djia-historical-20d-slice1")
    const ticker = fit.assetId === '^DJI' ? 'DJIA' : 'SPX';
    const scaffoldName = fit.scaffoldId.toUpperCase();
    
    // Extract window info from slice ID (e.g., "20d-slice1" -> "20d #1")
    const sliceMatch = fit.dataSliceId.match(/-(\d+)d-slice(\d+)$/);
    const windowInfo = sliceMatch ? `${sliceMatch[1]}d #${sliceMatch[2]}` : fit.dataSliceId;
    
    const prophet = {
      prophetId,
      prophetName: `${ticker} ${scaffoldName} ${windowInfo}`,
      assetId: fit.assetId,
      modelFitIds: [fit.modelFitId],
      ensembleMethod: 'single',
      targetProperty: 'close',
      forecastMethod: 'direct',
      status: 'pending_training',
      s3OutputTransformScriptPath: `s3://${BUCKET}/scripts/prophets/${prophetId}/output_transform.js`,
      performance: {
        rmse: null,
        mape: null,
        directionalAccuracy: null,
        r2: null
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await ddb.send(new PutCommand({
      TableName: TABLES.PROPHETS,
      Item: prophet
    }));
    totalProphets++;
  }
  console.log(`  ✅ Total prophets created: ${totalProphets}\n`);
}

// Main execution
async function main() {
  try {
    // SKIP S3 cleanup due to permissions - will handle manually
    console.log('⚠️  Skipping S3 cleanup (permissions issue - handle manually)\n');
    
    await clearAllTables();
    await initializeAssets();
    await initializeDatasets();
    await initializeDataSlices();
    await initializeScaffolds();
    await initializeModelFits();
    await initializeProphets();
    
    console.log('✅ COMPLETE: Database structure initialized\n');
    console.log('📋 Summary:');
    console.log('  - 2 Assets created (^DJI, ^GSPC)');
    console.log('  - 2 Datasets created (pointing to S3 CSVs)');
    console.log('  - ~392 Data Slices created (sliding windows: 20d, 60d, 120d, 240d)');
    console.log('  - 2 Model Scaffolds created (SLR, MLR)');
    console.log('  - ~784 Model Fits created (2 scaffolds × ~392 slices)');
    console.log('  - ~784 Prophets created (1 per model fit)');
    console.log('\n🔧 Next Steps:');
    console.log('  1. Run training script to train models');
    console.log('  2. Prophets will auto-activate after training completes');
    console.log('  3. Run inference to compute performance summaries');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
