#!/usr/bin/env tsx
/**
 * Test Prophet Inference
 * Phase 4H: Verify inference works with trained models
 */

import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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

async function testProphetInference(prophetId: string) {
  console.log(`\n📊 Testing Prophet: ${prophetId}\n`);
  
  // 1. Load prophet
  const prophetResp = await dynamodb.send(new GetItemCommand({
    TableName: 'ChasingProphets-Prophets',
    Key: { prophetId: { S: prophetId } }
  }));
  
  if (!prophetResp.Item) {
    throw new Error(`Prophet not found: ${prophetId}`);
  }
  
  const prophetName = prophetResp.Item.prophetName?.S!;
  const modelFitIds = prophetResp.Item.modelFitIds?.L?.map(v => v.S!) || [];
  const assetId = prophetResp.Item.assetId?.S!;
  
  console.log(`  Name: ${prophetName}`);
  console.log(`  Asset: ${assetId}`);
  console.log(`  Model Fits: ${modelFitIds.join(', ')}`);
  console.log(``);
  
  // 2. Load first model fit
  const modelFitId = modelFitIds[0];
  const fitResp = await dynamodb.send(new GetItemCommand({
    TableName: 'ChasingProphets-ModelFits',
    Key: { modelFitId: { S: modelFitId } }
  }));
  
  if (!fitResp.Item) {
    throw new Error(`ModelFit not found: ${modelFitId}`);
  }
  
  const scaffoldId = fitResp.Item.scaffoldId?.S!;
  const dataSliceId = fitResp.Item.dataSliceId?.S!;
  const parametersS3 = fitResp.Item.parametersS3?.S!;
  
  console.log(`  Scaffold: ${scaffoldId}`);
  console.log(`  Slice: ${dataSliceId}`);
  console.log(``);
  
  // 3. Load scaffold
  const scaffoldResp = await dynamodb.send(new GetItemCommand({
    TableName: 'ChasingProphets-ModelScaffolds',
    Key: { scaffoldId: { S: scaffoldId } }
  }));
  
  if (!scaffoldResp.Item) {
    throw new Error(`Scaffold not found: ${scaffoldId}`);
  }
  
  const inferenceScriptS3 = scaffoldResp.Item.s3RemoteInferenceScriptPath?.S!;
  const s3Match = inferenceScriptS3.match(/^s3:\/\/[^/]+\/(.+)$/);
  const inferenceScriptKey = s3Match![1];
  
  // 4. Load trained parameters
  console.log(`📥 Loading trained parameters...`);
  const paramsObj = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: parametersS3
  }));
  const paramsStr = await paramsObj.Body?.transformToString();
  const params = JSON.parse(paramsStr!);
  
  console.log(`  Parameters:`, JSON.stringify(params.parameters, null, 2));
  console.log(`  Training metrics:`, JSON.stringify(params.metrics, null, 2));
  console.log(``);
  
  // 5. Load slice data for inference
  console.log(`📊 Loading slice data...`);
  const sliceResp = await dynamodb.send(new GetItemCommand({
    TableName: 'ChasingProphets-DataSlices',
    Key: { dataSliceId: { S: dataSliceId } }
  }));
  
  const sliceS3Key = sliceResp.Item?.s3Key?.S!;
  const sliceObj = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: sliceS3Key
  }));
  const sliceDataStr = await sliceObj.Body?.transformToString();
  const sliceData = JSON.parse(sliceDataStr!);
  
  console.log(`  Loaded ${sliceData.length} records`);
  console.log(``);
  
  // 6. Download inference script
  console.log(`🔧 Running inference...`);
  const scriptObj = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: inferenceScriptKey
  }));
  const scriptContent = await scriptObj.Body?.transformToString();
  
  const tempDir = '/tmp';
  const scriptPath = path.join(tempDir, `inference_${scaffoldId}_${Date.now()}.py`);
  await fs.writeFile(scriptPath, scriptContent!);
  await fs.chmod(scriptPath, 0o755);
  
  // 7. Run inference (predict next return)
  const inferenceInput = {
    data: sliceData,
    parameters: params.parameters
  };
  
  const result = await runPythonScript(scriptPath, inferenceInput);
  await fs.unlink(scriptPath);
  
  console.log(`  ✓ Inference complete`);
  console.log(``);
  console.log(`📈 Predictions:`, JSON.stringify(result, null, 2));
  console.log(``);
  
  return result;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 4H: TEST PROPHET INFERENCE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Get a sample SLR and MLR prophet
  console.log('\n🔍 Finding sample prophets...');
  const scan = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-Prophets',
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': { S: 'active' } },
    Limit: 10
  }));
  
  const prophets = scan.Items || [];
  const slrProphet = prophets.find(p => p.prophetName?.S?.includes('SLR'));
  const mlrProphet = prophets.find(p => p.prophetName?.S?.includes('MLR'));
  
  if (!slrProphet || !mlrProphet) {
    console.log('⚠️  Could not find SLR or MLR prophet\n');
    return;
  }
  
  console.log(`✓ Found SLR prophet: ${slrProphet.prophetId?.S}`);
  console.log(`✓ Found MLR prophet: ${mlrProphet.prophetId?.S}`);
  
  // Test SLR
  try {
    await testProphetInference(slrProphet.prophetId?.S!);
  } catch (error) {
    console.error('❌ SLR inference failed:', error);
  }
  
  // Test MLR
  try {
    await testProphetInference(mlrProphet.prophetId?.S!);
  } catch (error) {
    console.error('❌ MLR inference failed:', error);
  }
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 4H COMPLETE                                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
