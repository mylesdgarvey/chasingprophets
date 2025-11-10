#!/usr/bin/env tsx
/**
 * Batch Training Orchestrator
 * Simulates Lambda invocation for model training
 * Can be triggered manually or scheduled
 */

import { DynamoDBClient, ScanCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

const dynamodb = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const BUCKET = 'chasingprophets-models-us-east-1';

// Train a single model fit
async function trainModelFit(modelFitId: string): Promise<{success: boolean; error?: string}> {
  console.log(`\n📦 Training: ${modelFitId}`);
  
  try {
    // 1. Load ModelFit
    const fitResp = await dynamodb.send(new GetItemCommand({
      TableName: 'ChasingProphets-ModelFits',
      Key: { modelFitId: { S: modelFitId } }
    }));
    
    if (!fitResp.Item) {
      throw new Error(`ModelFit not found: ${modelFitId}`);
    }
    
    const scaffoldId = fitResp.Item.scaffoldId?.S!;
    const dataSliceId = fitResp.Item.dataSliceId?.S!;
    
    console.log(`  Scaffold: ${scaffoldId}, Slice: ${dataSliceId}`);
    
    // 2. Load Scaffold
    const scaffoldResp = await dynamodb.send(new GetItemCommand({
      TableName: 'ChasingProphets-ModelScaffolds',
      Key: { scaffoldId: { S: scaffoldId } }
    }));
    
    if (!scaffoldResp.Item) {
      throw new Error(`Scaffold not found: ${scaffoldId}`);
    }
    
    const trainingScriptS3 = scaffoldResp.Item.s3TrainingScriptPath?.S!;
    const trainingConfigStr = scaffoldResp.Item.trainingConfig?.S || '{}';
    const trainingConfig = JSON.parse(trainingConfigStr);
    
    // Extract S3 key from s3:// URL
    const s3Match = trainingScriptS3.match(/^s3:\/\/[^/]+\/(.+)$/);
    if (!s3Match) {
      throw new Error(`Invalid S3 URL: ${trainingScriptS3}`);
    }
    const trainingScriptKey = s3Match[1];
    
    // 3. Load training data
    const sliceResp = await dynamodb.send(new GetItemCommand({
      TableName: 'ChasingProphets-DataSlices',
      Key: { dataSliceId: { S: dataSliceId } }
    }));
    
    if (!sliceResp.Item) {
      throw new Error(`DataSlice not found: ${dataSliceId}`);
    }
    
    const sliceS3Key = sliceResp.Item.s3Key?.S!;
    
    // Download slice data from S3
    const sliceObj = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: sliceS3Key
    }));
    const sliceDataStr = await sliceObj.Body?.transformToString();
    const sliceData = JSON.parse(sliceDataStr || '[]');
    
    console.log(`  Loaded ${sliceData.length} records`);
    
    // 4. Download Python training script
    const scriptObj = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: trainingScriptKey
    }));
    const scriptContent = await scriptObj.Body?.transformToString();
    
    const tempDir = '/tmp';
    const scriptPath = path.join(tempDir, `train_${scaffoldId}_${Date.now()}.py`);
    await fs.writeFile(scriptPath, scriptContent!);
    await fs.chmod(scriptPath, 0o755);
    
    // 5. Execute Python training
    const trainingInput = {
      data: sliceData,
      config: trainingConfig
    };
    
    const result = await runPythonScript(scriptPath, trainingInput);
    
    // Clean up temp script
    await fs.unlink(scriptPath);
    
    // 6. Save parameters to S3
    const paramsKey = `models/${modelFitId}/parameters.json`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: paramsKey,
      Body: JSON.stringify(result, null, 2),
      ContentType: 'application/json'
    }));
    
    console.log(`  ✓ Saved parameters to S3`);
    
    // 7. Update ModelFit status
    await dynamodb.send(new UpdateItemCommand({
      TableName: 'ChasingProphets-ModelFits',
      Key: { modelFitId: { S: modelFitId } },
      UpdateExpression: 'SET trainingStatus = :status, parametersS3 = :s3, trainedAt = :timestamp',
      ExpressionAttributeValues: {
        ':status': { S: 'fit' },
        ':s3': { S: paramsKey },
        ':timestamp': { S: new Date().toISOString() }
      }
    }));
    
    console.log(`  ✓ Updated status: fit`);
    
    return { success: true };
    
  } catch (error) {
    console.error(`  ❌ Error:`, error);
    
    // Mark as failed
    try {
      await dynamodb.send(new UpdateItemCommand({
        TableName: 'ChasingProphets-ModelFits',
        Key: { modelFitId: { S: modelFitId } },
        UpdateExpression: 'SET trainingStatus = :status, errorMessage = :error, failedAt = :timestamp',
        ExpressionAttributeValues: {
          ':status': { S: 'failed' },
          ':error': { S: String(error) },
          ':timestamp': { S: new Date().toISOString() }
        }
      }));
    } catch (updateError) {
      console.error('  Failed to update error status:', updateError);
    }
    
    return { success: false, error: String(error) };
  }
}

async function runPythonScript(scriptPath: string, input: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed (code ${code}): ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
    
    // Send input via stdin
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

// Main: scan for unfit models and train them
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  BATCH TRAINING ORCHESTRATOR (With Percentage Returns)    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Get limit from args
  const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;
  
  console.log(`🔍 Scanning for unfit model fits...`);
  const scan = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits',
    FilterExpression: 'trainingStatus = :status',
    ExpressionAttributeValues: {
      ':status': { S: 'unfit' }
    }
  }));
  
  const unfitModels = scan.Items || [];
  const total = unfitModels.length;
  const toTrain = limit ? unfitModels.slice(0, limit) : unfitModels;
  
  console.log(`✓ Found ${total} unfit model fits`);
  if (limit) {
    console.log(`  Training first ${toTrain.length} (limit: ${limit})\n`);
  } else {
    console.log(`  Training all ${toTrain.length}\n`);
  }
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < toTrain.length; i++) {
    const item = toTrain[i];
    const modelFitId = item.modelFitId?.S!;
    
    console.log(`[${i + 1}/${toTrain.length}] ==============================`);
    
    const result = await trainModelFit(modelFitId);
    
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  COMPLETE: ${success} success, ${failed} failed (out of ${toTrain.length})    `);
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
