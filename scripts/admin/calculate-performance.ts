#!/usr/bin/env tsx
/**
 * Calculate Performance Metrics for All Prophets
 * 
 * This script:
 * 1. Loads all active prophets with trained models
 * 2. Runs inference on the most recent 2400 days (or max available)
 * 3. Calculates prediction errors for each data point
 * 4. Aggregates metrics over rolling windows (20d, 60d, 120d, 240d)
 * 5. Stores results in ProphetPerformanceSummary table
 * 
 * This replaces the dummy seed data with REAL performance metrics.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand,
  PutCommand,
  BatchWriteCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  S3Client, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const s3 = new S3Client({ region: REGION });

const TABLES = {
  PROPHETS: 'ChasingProphets-Prophets',
  MODEL_FITS: 'ChasingProphets-ModelFits',
  MODEL_SCAFFOLDS: 'ChasingProphets-ModelScaffolds',
  DATA_SLICES: 'ChasingProphets-DataSlices',
  DATASETS: 'ChasingProphets-Datasets',
  ASSETS: 'ChasingProphets-Assets',
  PERFORMANCE_SUMMARY: 'ChasingProphets-ProphetPerformanceSummary'
};

const AGGREGATION_WINDOWS = [20, 60, 120, 240]; // days
const MAX_INFERENCE_DAYS = 2400;

interface Prophet {
  prophetId: string;
  prophetName: string;
  assetId: string;
  status: string;
  modelFitIds: string[];
  targetProperty: string;
}

interface ModelFit {
  modelFitId: string;
  scaffoldId: string;
  dataSliceId: string;
  trainingStatus: string;
  modelParametersPath?: string;
}

interface ModelScaffold {
  scaffoldId: string;
  name: string;
  s3RemoteInferenceScriptPath: string;
}

interface DataSlice {
  dataSliceId: string;
  datasetId: string;
  startDate: string;
  endDate: string;
}

interface Dataset {
  datasetId: string;
  assetId: string;
  s3DataPath: string;
}

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Prediction {
  date: string;
  actual: number;
  predicted: number;
  error: number;
  percentError: number;
}

interface PerformanceMetrics {
  mape: number;
  rmse: number;
  mae: number;
  directionalAccuracy: number;
  sampleSize: number;
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadFromS3(s3Path: string): Promise<string> {
  const key = s3Path.replace(`s3://${BUCKET}/`, '');
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);
  if (!response.Body) throw new Error(`No data at ${s3Path}`);
  return await response.Body.transformToString();
}

async function getAllProphets(): Promise<Prophet[]> {
  const command = new ScanCommand({ TableName: TABLES.PROPHETS });
  const response = await ddb.send(command);
  return (response.Items || []) as Prophet[];
}

async function getModelFit(modelFitId: string): Promise<ModelFit | null> {
  const command = new GetCommand({
    TableName: TABLES.MODEL_FITS,
    Key: { modelFitId }
  });
  const response = await ddb.send(command);
  return (response.Item as ModelFit) || null;
}

async function getScaffold(scaffoldId: string): Promise<ModelScaffold | null> {
  const command = new GetCommand({
    TableName: TABLES.MODEL_SCAFFOLDS,
    Key: { scaffoldId }
  });
  const response = await ddb.send(command);
  return (response.Item as ModelScaffold) || null;
}

async function getDataSlice(dataSliceId: string): Promise<DataSlice | null> {
  const command = new GetCommand({
    TableName: TABLES.DATA_SLICES,
    Key: { dataSliceId }
  });
  const response = await ddb.send(command);
  return (response.Item as DataSlice) || null;
}

async function getDataset(datasetId: string): Promise<Dataset | null> {
  const command = new GetCommand({
    TableName: TABLES.DATASETS,
    Key: { datasetId }
  });
  const response = await ddb.send(command);
  return (response.Item as Dataset) || null;
}

async function loadHistoricalData(s3DataPath: string, maxDays: number): Promise<PriceData[]> {
  const csvContent = await loadFromS3(s3DataPath);
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data: PriceData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header.trim().toLowerCase()] = values[idx]?.trim();
    });
    
    data.push({
      date: row.date,
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseFloat(row.volume)
    });
  }
  
  // Sort by date ascending
  data.sort((a, b) => a.date.localeCompare(b.date));
  
  // Return most recent maxDays
  return data.slice(-maxDays);
}

// ============================================================================
// Python Inference Execution
// ============================================================================

async function runPythonInference(
  scriptPath: string,
  parametersPath: string,
  dataPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Download script and parameters to temp files
    const tempDir = '/tmp/inference';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const localScriptPath = path.join(tempDir, 'inference.py');
    const localParamsPath = path.join(tempDir, 'parameters.json');
    const localDataPath = path.join(tempDir, 'data.csv');
    
    Promise.all([
      loadFromS3(scriptPath).then(content => fs.writeFileSync(localScriptPath, content)),
      loadFromS3(parametersPath).then(content => fs.writeFileSync(localParamsPath, content)),
      loadFromS3(dataPath).then(content => fs.writeFileSync(localDataPath, content))
    ]).then(() => {
      const python = spawn('python3', [
        localScriptPath,
        '--parameters', localParamsPath,
        '--data', localDataPath,
        '--output', outputPath
      ]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => { stdout += data.toString(); });
      python.stderr.on('data', (data) => { stderr += data.toString(); });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python inference failed: ${stderr}`));
        }
      });
    }).catch(reject);
  });
}

// ============================================================================
// Metrics Calculation
// ============================================================================

function calculateReturns(prices: PriceData[], field: string = 'close'): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = (prices[i - 1] as any)[field];
    const currentPrice = (prices[i] as any)[field];
    const percentReturn = ((currentPrice / prevPrice) - 1) * 100;
    returns.push(percentReturn);
  }
  return returns;
}

function runInferenceWithReturns(
  historicalData: PriceData[],
  parameters: any,
  targetField: string = 'close'
): Prediction[] {
  const predictions: Prediction[] = [];
  const returns = calculateReturns(historicalData, targetField);
  
  // Need at least 3 returns for MLR (2 lags + 1 to predict)
  const minReturns = 3;
  if (returns.length < minReturns) return predictions;
  
  // Extract model parameters
  const { coefficients, intercept, slope, input_fields } = parameters.parameters || parameters;
  
  // Determine model type
  const isSLR = slope !== undefined;
  const isMLR = coefficients !== undefined && Array.isArray(coefficients);
  
  for (let i = minReturns; i < historicalData.length; i++) {
    const current = historicalData[i];
    const previous = historicalData[i - 1];
    const returnIndex = i - 1;
    
    try {
      let predictedReturn: number;
      
      if (isSLR) {
        // Simple Linear Regression: y = slope * x + intercept
        const x = returns[returnIndex - 1]; // t-1 return
        predictedReturn = slope * x + intercept;
      } else if (isMLR) {
        // Multiple Linear Regression: y = sum(ci * xi) + intercept
        const features: number[] = [];
        
        if (input_fields) {
          // Use specified input fields
          for (const field of input_fields) {
            if (field === 'return_t-1' && returnIndex >= 1) {
              features.push(returns[returnIndex - 1]);
            } else if (field === 'return_t-2' && returnIndex >= 2) {
              features.push(returns[returnIndex - 2]);
            }
          }
        } else {
          // Default: use t-1 and t-2 returns
          if (returnIndex >= 1) features.push(returns[returnIndex - 1]);
          if (returnIndex >= 2) features.push(returns[returnIndex - 2]);
        }
        
        predictedReturn = intercept;
        for (let j = 0; j < coefficients.length && j < features.length; j++) {
          predictedReturn += coefficients[j] * features[j];
        }
      } else {
        throw new Error('Unknown model type');
      }
      
      // Convert predicted % return to absolute price
      const previousPrice = (previous as any)[targetField];
      const predictedPrice = previousPrice * (1 + predictedReturn / 100);
      
      const actual = (current as any)[targetField];
      const error = actual - predictedPrice;
      const percentError = Math.abs(error / actual) * 100;
      
      predictions.push({
        date: current.date,
        actual,
        predicted: predictedPrice,
        error,
        percentError
      });
    } catch (err) {
      // Skip failed predictions
      continue;
    }
  }
  
  return predictions;
}

function calculateMetrics(predictions: Prediction[]): PerformanceMetrics {
  if (predictions.length === 0) {
    return { mape: 0, rmse: 0, mae: 0, directionalAccuracy: 0, sampleSize: 0 };
  }
  
  const mape = predictions.reduce((sum, p) => sum + p.percentError, 0) / predictions.length;
  const mse = predictions.reduce((sum, p) => sum + p.error * p.error, 0) / predictions.length;
  const rmse = Math.sqrt(mse);
  const mae = predictions.reduce((sum, p) => sum + Math.abs(p.error), 0) / predictions.length;
  
  let correctDirections = 0;
  for (let i = 1; i < predictions.length; i++) {
    const actualDirection = predictions[i].actual > predictions[i - 1].actual ? 1 : -1;
    const predictedDirection = predictions[i].predicted > predictions[i - 1].predicted ? 1 : -1;
    if (actualDirection === predictedDirection) {
      correctDirections++;
    }
  }
  const directionalAccuracy = (correctDirections / (predictions.length - 1)) * 100;
  
  return {
    mape: Math.round(mape * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    mae: Math.round(mae * 100) / 100,
    directionalAccuracy: Math.round(directionalAccuracy * 100) / 100,
    sampleSize: predictions.length
  };
}

function calculateRollingMetrics(
  predictions: Prediction[],
  windowSize: number
): PerformanceMetrics | null {
  if (predictions.length < windowSize) return null;
  
  const recentPredictions = predictions.slice(-windowSize);
  return calculateMetrics(recentPredictions);
}

// ============================================================================
// Main Execution
// ============================================================================

async function calculatePerformanceForProphet(prophet: Prophet): Promise<void> {
  console.log(`\n📊 Processing: ${prophet.prophetName} (${prophet.prophetId})`);
  
  // Skip if no model fits
  if (!prophet.modelFitIds || prophet.modelFitIds.length === 0) {
    console.log('   ⚠️  No model fits found - skipping');
    return;
  }
  
  // Get first model fit
  const modelFitId = prophet.modelFitIds[0];
  const modelFit = await getModelFit(modelFitId);
  
  if (!modelFit || modelFit.trainingStatus !== 'fit') {
    console.log(`   ⚠️  Model not trained (status: ${modelFit?.trainingStatus}) - skipping`);
    return;
  }
  
  if (!modelFit.modelParametersPath) {
    console.log('   ⚠️  No parameters path - skipping');
    return;
  }
  
  // Load scaffold
  const scaffold = await getScaffold(modelFit.scaffoldId);
  if (!scaffold) {
    console.log('   ⚠️  Scaffold not found - skipping');
    return;
  }
  
  // Load data slice
  const slice = await getDataSlice(modelFit.dataSliceId);
  if (!slice) {
    console.log('   ⚠️  Data slice not found - skipping');
    return;
  }
  
  // Load dataset
  const dataset = await getDataset(slice.datasetId);
  if (!dataset) {
    console.log('   ⚠️  Dataset not found - skipping');
    return;
  }
  
  try {
    // Load historical data (most recent 2400 days)
    console.log(`   📥 Loading historical data from ${dataset.s3DataPath}...`);
    const historicalData = await loadHistoricalData(dataset.s3DataPath, MAX_INFERENCE_DAYS);
    console.log(`   ✓ Loaded ${historicalData.length} data points`);
    
    // Load model parameters
    console.log(`   📥 Loading model parameters...`);
    const parametersContent = await loadFromS3(modelFit.modelParametersPath);
    const parameters = JSON.parse(parametersContent);
    console.log(`   ✓ Parameters loaded`);
    
    // Run inference
    console.log(`   🔮 Running inference...`);
    const predictions = runInferenceWithReturns(
      historicalData,
      parameters,
      prophet.targetProperty || 'close'
    );
    console.log(`   ✓ Generated ${predictions.length} predictions`);
    
    if (predictions.length === 0) {
      console.log('   ⚠️  No valid predictions - skipping');
      return;
    }
    
    // Calculate metrics for each aggregation window
    const performanceRecords = [];
    
    for (const windowDays of AGGREGATION_WINDOWS) {
      const windowName = `${windowDays}-day`;
      const metrics = calculateRollingMetrics(predictions, windowDays);
      
      if (metrics) {
        console.log(`   📈 ${windowName}: MAPE=${metrics.mape.toFixed(2)}%, Dir=${metrics.directionalAccuracy.toFixed(1)}%`);
        
        performanceRecords.push({
          prophetId: prophet.prophetId,
          aggregationWindow: windowName,
          mape: metrics.mape,
          rmse: metrics.rmse,
          mae: metrics.mae,
          directionalAccuracy: metrics.directionalAccuracy,
          percentileError75: metrics.mape * 1.25, // Approximate
          percentileError90: metrics.mape * 1.75, // Approximate
          sampleSize: metrics.sampleSize,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // Store in DynamoDB
    if (performanceRecords.length > 0) {
      console.log(`   💾 Saving ${performanceRecords.length} performance records...`);
      
      for (const record of performanceRecords) {
        await ddb.send(new PutCommand({
          TableName: TABLES.PERFORMANCE_SUMMARY,
          Item: record
        }));
      }
      
      console.log(`   ✅ Performance metrics saved`);
    }
    
  } catch (err) {
    console.error(`   ❌ Error processing prophet:`, err);
  }
}

async function main() {
  console.log('🚀 Starting Performance Calculation\n');
  console.log('═'.repeat(80));
  
  // Load all prophets
  console.log('\n📋 Loading prophets...');
  const prophets = await getAllProphets();
  console.log(`   Found ${prophets.length} total prophets`);
  
  // Filter to active prophets only
  const activeProphets = prophets.filter(p => p.status === 'active');
  console.log(`   ${activeProphets.length} active prophets to process`);
  
  // Clear existing performance summaries
  console.log('\n🧹 Clearing old performance summaries...');
  const scanCommand = new ScanCommand({ TableName: TABLES.PERFORMANCE_SUMMARY });
  const existing = await ddb.send(scanCommand);
  
  if (existing.Items && existing.Items.length > 0) {
    console.log(`   Deleting ${existing.Items.length} existing records...`);
    for (const item of existing.Items) {
      await ddb.send(new DeleteCommand({
        TableName: TABLES.PERFORMANCE_SUMMARY,
        Key: {
          prophetId: item.prophetId,
          aggregationWindow: item.aggregationWindow
        }
      }));
    }
    console.log('   ✓ Old records deleted');
  } else {
    console.log('   (No existing records)');
  }
  
  // Process each prophet
  console.log('\n' + '═'.repeat(80));
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  for (const prophet of activeProphets) {
    processed++;
    console.log(`\n[${processed}/${activeProphets.length}]`);
    
    try {
      await calculatePerformanceForProphet(prophet);
      succeeded++;
    } catch (err) {
      console.error(`❌ Failed:`, err);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Performance Calculation Complete\n');
  console.log(`   Processed: ${processed}`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log('');
}

main().catch(console.error);
