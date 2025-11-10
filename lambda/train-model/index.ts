#!/usr/bin/env tsx
/**
 * Lambda Handler for Model Training
 * Triggered by API Gateway or direct invocation
 * Trains one model fit at a time
 */

import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const dynamodb = new DynamoDBClient({ region });
const s3 = new S3Client({ region });

const BUCKET = 'chasingprophets-models-us-east-1';

interface TrainingEvent {
  modelFitId: string;
}

interface TrainingResult {
  success: boolean;
  modelFitId: string;
  parameters?: any;
  metrics?: any;
  error?: string;
}

export async function handler(event: TrainingEvent): Promise<TrainingResult> {
  const { modelFitId } = event;
  
  console.log(`[Lambda] Training model fit: ${modelFitId}`);
  
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
    const assetId = fitResp.Item.assetId?.S!;
    
    console.log(`  Scaffold: ${scaffoldId}, Slice: ${dataSliceId}, Asset: ${assetId}`);
    
    // 2. Load Scaffold
    const scaffoldResp = await dynamodb.send(new GetItemCommand({
      TableName: 'ChasingProphets-ModelScaffolds',
      Key: { scaffoldId: { S: scaffoldId } }
    }));
    
    if (!scaffoldResp.Item) {
      throw new Error(`Scaffold not found: ${scaffoldId}`);
    }
    
    const trainingScriptS3 = scaffoldResp.Item.trainingScript?.S!;
    const trainingConfigStr = scaffoldResp.Item.trainingConfig?.S || '{}';
    const trainingConfig = JSON.parse(trainingConfigStr);
    
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
    
    console.log(`  Loaded ${sliceData.length} records from slice`);
    
    // 4. Download Python training script
    const scriptObj = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: trainingScriptS3
    }));
    const scriptContent = await scriptObj.Body?.transformToString();
    
    const tempDir = '/tmp';
    const scriptPath = path.join(tempDir, 'train.py');
    await fs.writeFile(scriptPath, scriptContent!);
    await fs.chmod(scriptPath, 0o755);
    
    // 5. Execute Python training
    const trainingInput = {
      data: sliceData,
      config: trainingConfig
    };
    
    const result = await runPythonScript(scriptPath, trainingInput);
    
    // 6. Save parameters to S3
    const paramsKey = `models/${modelFitId}/parameters.json`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: paramsKey,
      Body: JSON.stringify(result, null, 2),
      ContentType: 'application/json'
    }));
    
    console.log(`  ✓ Saved parameters to S3: ${paramsKey}`);
    
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
    
    console.log(`  ✓ Updated ModelFit status: fit`);
    
    return {
      success: true,
      modelFitId,
      parameters: result.parameters,
      metrics: result.metrics
    };
    
  } catch (error) {
    console.error(`[Lambda] Error training ${modelFitId}:`, error);
    
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
      console.error('Failed to update error status:', updateError);
    }
    
    return {
      success: false,
      modelFitId,
      error: String(error)
    };
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

// For local testing
if (require.main === module) {
  const testEvent = {
    modelFitId: process.argv[2] || 'DJIA_20d_slice1_SLR'
  };
  
  handler(testEvent)
    .then(result => {
      console.log('\n✅ Lambda result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Lambda error:', error);
      process.exit(1);
    });
}
