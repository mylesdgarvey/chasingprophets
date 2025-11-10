#!/usr/bin/env tsx
/**
 * Batch Training Script for Model Fits
 * 
 * Scans all ModelFit records with status='unfit' and trains them using
 * their scaffold's training script. Saves parameters to S3 and updates
 * ModelFit and Prophet statuses.
 * 
 * Usage:
 *   ./scripts/load-env.sh tsx scripts/admin/train-models.ts [--limit N] [--dry-run]
 */

import 'dotenv/config';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;
const TABLES = {
  ModelFits: 'ChasingProphets-ModelFits',
  ModelScaffolds: 'ChasingProphets-ModelScaffolds',
  DataSlices: 'ChasingProphets-DataSlices',
  Prophets: 'ChasingProphets-Prophets',
  Assets: 'ChasingProphets-Assets',
};

const dynamodb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

interface ModelFit {
  modelFitId: string;
  scaffoldId: string;
  dataSliceId?: string;
  sliceId?: string;
  assetId: string;
  trainingStatus: string;
  s3TrainingScriptPath?: string;
  [key: string]: any; // Allow additional fields
}

interface DataSlice {
  dataSliceId: string;
  assetId: string;
  startDate: string;
  endDate: string;
  windowDays: number;
}

// Parse CLI args
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : undefined;
const dryRun = args.includes('--dry-run');

console.log('🚀 Batch Model Training Script');
console.log(`   Limit: ${limit || 'none'}`);
console.log(`   Dry run: ${dryRun}`);
console.log('');

async function getS3Object(s3Path: string): Promise<string> {
  const match = s3Path.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) throw new Error('Invalid S3 path: ' + s3Path);
  const [, bucket, key] = match;
  
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Empty S3 object: ' + s3Path);
  return await (res.Body as any).transformToString();
}

async function getAssetPrices(assetId: string): Promise<any[]> {
  // Read asset prices from S3 CSV file
  console.log(`   Loading ${assetId} prices from S3...`);
  
  const s3Path = `data/assets/${assetId}/ohlcv_full.csv`;
  const csvText = await getS3Object(`s3://${BUCKET}/${s3Path}`);
  
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((h, i) => {
      const val = values[i]?.trim();
      if (h === 'date') {
        row[h] = val;
      } else {
        row[h] = parseFloat(val);
      }
    });
    return row;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

async function getScaffold(scaffoldId: string): Promise<any> {
  console.log(`   Querying scaffold: ${scaffoldId}...`);
  const cmd = new ScanCommand({
    TableName: TABLES.ModelScaffolds,
    FilterExpression: 'scaffoldId = :sid',
    ExpressionAttributeValues: {
      ':sid': { S: scaffoldId }
    }
  });
  
  const result = await dynamodb.send(cmd);
  console.log(`   Scaffold query complete`);
  if (!result.Items || result.Items.length === 0) {
    throw new Error(`Scaffold not found: ${scaffoldId}`);
  }
  
  return unmarshall(result.Items[0]);
}

async function getSliceData(sliceId: string): Promise<any[]> {
  console.log(`   Loading slice ${sliceId}...`);
  // Get slice metadata from DynamoDB
  const scanCmd = new ScanCommand({
    TableName: TABLES.DataSlices,
    FilterExpression: 'dataSliceId = :sid',
    ExpressionAttributeValues: {
      ':sid': { S: sliceId }
    }
  });
  
  const result = await dynamodb.send(scanCmd);
  console.log(`   Slice metadata loaded`);
  if (!result.Items || result.Items.length === 0) {
    throw new Error(`Slice not found: ${sliceId}`);
  }
  
  const slice = unmarshall(result.Items[0]) as DataSlice;
  
  // Load full asset data using assetId from slice
  console.log(`   Loading asset prices from DynamoDB for ${slice.assetId}...`);
  const allPrices = await getAssetPrices(slice.assetId);
  console.log(`   Asset prices loaded: ${allPrices.length} records`);
  
  // Filter by slice date range
  const filtered = allPrices.filter(row => {
    return row.date >= slice.startDate && row.date <= slice.endDate;
  });
  
  console.log(`   Filtered to ${filtered.length} records for slice`);
  return filtered;
}

async function runPythonTraining(
  scriptPath: string,
  trainingData: any[],
  modelFitId: string
): Promise<any> {
  // Download training script from S3
  console.log('      → Downloading training script from S3...');
  const scriptContent = await getS3Object(scriptPath);
  
  // Create temp directory for this training job
  const tempDir = join(tmpdir(), `train-${modelFitId}`);
  mkdirSync(tempDir, { recursive: true });
  
  const scriptFile = join(tempDir, 'train.py');
  
  // Write script to temp file
  writeFileSync(scriptFile, scriptContent);
  console.log('      → Script written to temp file');
  
  // Prepare input for Python script (via stdin)
  // Different configs for SLR vs MLR
  let config: any;
  if (scriptPath.includes('/slr/')) {
    config = {
      input_field: 'close',
      output_field: 'close'
    };
  } else if (scriptPath.includes('/mlr/')) {
    config = {
      input_fields: ['close', 'volume'],  // MLR uses multiple inputs
      output_field: 'close'
    };
  } else {
    // Default config
    config = {
      input_field: 'close',
      output_field: 'close'
    };
  }
  
  const pythonInput = {
    data: trainingData,
    config: config
  };
  
  console.log('      → Executing Python script...');
  
  // Execute Python script with input via stdin
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptFile], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }  // Inherit environment variables including PATH
    });
    
    let stdout = '';
    let stderr = '';
    
    // Send input to stdin
    pythonProcess.stdin.write(JSON.stringify(pythonInput));
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temp directory
      rmSync(tempDir, { recursive: true, force: true });
      
      if (code !== 0) {
        console.error(`      ✗ Python training failed (exit code ${code})`);
        console.error('      stderr:', stderr);
        reject(new Error(`Training script exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        console.error('      ✗ Failed to parse Python output');
        console.error('      stdout:', stdout);
        console.error('      stderr:', stderr);
        reject(new Error(`Failed to parse training output: ${err}`));
      }
    });
  });
}

async function saveParametersToS3(modelFitId: string, parameters: any): Promise<string> {
  const key = `models/${modelFitId}/parameters.json`;
  const s3Path = `s3://${BUCKET}/${key}`;
  
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(parameters, null, 2),
    ContentType: 'application/json'
  });
  
  await s3.send(cmd);
  return s3Path;
}

async function updateModelFitStatus(modelFitId: string, parametersPath: string) {
  const cmd = new UpdateItemCommand({
    TableName: TABLES.ModelFits,
    Key: { modelFitId: { S: modelFitId } },
    UpdateExpression: 'SET trainingStatus = :status, modelParametersPath = :path, updatedAt = :now',
    ExpressionAttributeValues: {
      ':status': { S: 'fit' },
      ':path': { S: parametersPath },
      ':now': { S: new Date().toISOString() }
    }
  });
  
  await dynamodb.send(cmd);
}

async function updateProphetStatus(prophetId: string) {
  const cmd = new UpdateItemCommand({
    TableName: TABLES.Prophets,
    Key: { prophetId: { S: prophetId } },
    UpdateExpression: 'SET #status = :status, updatedAt = :now',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': { S: 'active' },
      ':now': { S: new Date().toISOString() }
    }
  });
  
  await dynamodb.send(cmd);
}

async function getUnfitModelFits(): Promise<ModelFit[]> {
  console.log('   Querying DynamoDB table:', TABLES.ModelFits);
  const cmd = new ScanCommand({
    TableName: TABLES.ModelFits,
    FilterExpression: 'trainingStatus = :pending',
    ExpressionAttributeValues: {
      ':pending': { S: 'pending_training' }
    }
  });
  
  console.log('   Executing scan...');
  const result = await dynamodb.send(cmd);
  console.log('   Scan complete, processing results...');
  if (!result.Items) return [];
  
  return result.Items.map(item => unmarshall(item) as ModelFit);
}

async function getProphetsForModelFit(modelFitId: string): Promise<string[]> {
  const cmd = new ScanCommand({
    TableName: TABLES.Prophets,
    FilterExpression: 'contains(modelFitIds, :mfid)',
    ExpressionAttributeValues: {
      ':mfid': { S: modelFitId }
    }
  });
  
  const result = await dynamodb.send(cmd);
  if (!result.Items) return [];
  
  return result.Items.map(item => unmarshall(item).prophetId);
}

async function trainModelFit(fit: ModelFit): Promise<void> {
  console.log(`\n📦 Training: ${fit.modelFitId}`);
  console.log(`   Scaffold: ${fit.scaffoldId}`);
  console.log(`   Slice: ${fit.dataSliceId || fit.sliceId || 'unknown'}`);
  console.log(`   Asset: ${fit.assetId}`);
  
  if (dryRun) {
    console.log('   [DRY RUN] Skipping actual training');
    return;
  }
  
  try {
    // 0. Get scaffold to get training script path
    console.log('   📋 Loading scaffold...');
    const scaffold = await getScaffold(fit.scaffoldId);
    if (!scaffold.s3TrainingScriptPath) {
      throw new Error(`Scaffold ${fit.scaffoldId} missing s3TrainingScriptPath`);
    }
    console.log(`   ✓ Scaffold loaded`);
    
    // 1. Load training data from slice
    console.log('   📊 Loading training data...');
    const sliceId = fit.dataSliceId || fit.sliceId;
    if (!sliceId) {
      throw new Error('Missing dataSliceId/sliceId in ModelFit');
    }
    const trainingData = await getSliceData(sliceId);
    console.log(`   ✓ Loaded ${trainingData.length} records`);
    
    // 2. Run Python training script
    console.log('   🔧 Running training script...');
    const parameters = await runPythonTraining(
      scaffold.s3TrainingScriptPath,
      trainingData,
      fit.modelFitId
    );
    console.log('   ✓ Training complete');
    console.log(`   📈 Parameters: ${JSON.stringify(parameters).substring(0, 100)}...`);
    
    // 3. Save parameters to S3
    console.log('   💾 Saving parameters to S3...');
    const parametersPath = await saveParametersToS3(fit.modelFitId, parameters);
    console.log(`   ✓ Saved: ${parametersPath}`);
    
    // 4. Update ModelFit status
    console.log('   📝 Updating ModelFit status...');
    await updateModelFitStatus(fit.modelFitId, parametersPath);
    console.log('   ✓ ModelFit status: fit');
    
    // 5. Update associated Prophet(s) status
    const prophetIds = await getProphetsForModelFit(fit.modelFitId);
    if (prophetIds.length > 0) {
      console.log(`   🔮 Updating ${prophetIds.length} prophet(s)...`);
      for (const prophetId of prophetIds) {
        await updateProphetStatus(prophetId);
      }
      console.log('   ✓ Prophet(s) status: active');
    }
    
    console.log('   ✅ Training complete for ' + fit.modelFitId);
  } catch (error: any) {
    console.error(`   ❌ Training failed for ${fit.modelFitId}:`);
    console.error(`   ${error.message || error}`);
    throw error;
  }
}

async function main() {
  try {
    // 1. Scan for unfit model fits
    console.log('🔍 Scanning for unfit model fits...');
    const unfitFits = await getUnfitModelFits();
    console.log(`✓ Found ${unfitFits.length} unfit model fits`);
    
    if (unfitFits.length === 0) {
      console.log('\n✅ No model fits to train. All done!');
      return;
    }
    
    // Apply limit if specified
    const fitsToTrain = limit ? unfitFits.slice(0, limit) : unfitFits;
    
    console.log(`\n🎯 Training ${fitsToTrain.length} model fit(s)...`);
    console.log('');
    
    let successCount = 0;
    let failureCount = 0;
    
    // 2. Train each fit sequentially
    for (let i = 0; i < fitsToTrain.length; i++) {
      const fit = fitsToTrain[i];
      console.log(`\n[${ i + 1}/${fitsToTrain.length}] ==============================`);
      
      try {
        await trainModelFit(fit);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Skipping to next fit...\n`);
        // Continue to next fit rather than stopping the batch
      }
    }
    
    // 3. Summary
    console.log('\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 TRAINING SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total processed: ${fitsToTrain.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failures: ${failureCount}`);
    console.log(`⏳ Remaining: ${unfitFits.length - fitsToTrain.length}`);
    console.log('═══════════════════════════════════════');
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some training jobs failed. Check logs above for details.');
      process.exit(1);
    }
    
    console.log('\n✅ Batch training complete!');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
