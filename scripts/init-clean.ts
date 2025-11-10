#!/usr/bin/env tsx
/**
 * CLEAN INITIALIZATION SCRIPT
 * 
 * This script sets up the entire ChasingProphets system from scratch:
 * 1. Creates all DynamoDB tables
 * 2. Creates S3 bucket and folder structure
 * 3. Uploads scaffold training/inference scripts to S3
 * 4. Downloads DJIA and SPX data ONLY
 * 5. Creates data slices for both assets
 * 6. Creates prophets (scaffold × slice combinations)
 * 7. Trains all prophets
 * 8. Calculates performance metrics
 */

import 'dotenv/config';
import { DynamoDBClient, CreateTableCommand, ListTablesCommand, DescribeTableCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { S3Client, CreateBucketCommand, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// AWS Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const bucketName = `chasingprophets-models-${region}`;

const dynamodb = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  ChasingProphets Clean Initialization                ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

// Step 1: Create DynamoDB Tables
async function createTables() {
  console.log('📋 Step 1: Creating DynamoDB tables...\n');
  
  const tables = [
    {
      TableName: 'ChasingProphets-Assets',
      KeySchema: [{ AttributeName: 'ticker', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'ticker', AttributeType: 'S' }],
    },
    // NO AssetPrices table - data is in S3 CSV files!
    {
      TableName: 'ChasingProphets-Datasets',
      KeySchema: [{ AttributeName: 'datasetId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'datasetId', AttributeType: 'S' }],
    },
    {
      TableName: 'ChasingProphets-DataSlices',
      KeySchema: [{ AttributeName: 'dataSliceId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'dataSliceId', AttributeType: 'S' }],
    },
    {
      TableName: 'ChasingProphets-ModelScaffolds',
      KeySchema: [{ AttributeName: 'scaffoldId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'scaffoldId', AttributeType: 'S' }],
    },
    {
      TableName: 'ChasingProphets-ModelFits',
      KeySchema: [{ AttributeName: 'modelFitId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'modelFitId', AttributeType: 'S' }],
    },
    {
      TableName: 'ChasingProphets-Prophets',
      KeySchema: [{ AttributeName: 'prophetId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'prophetId', AttributeType: 'S' }],
    },
    {
      TableName: 'ChasingProphets-Performance',
      KeySchema: [
        { AttributeName: 'prophetId', KeyType: 'HASH' },
        { AttributeName: 'evaluationDate', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'prophetId', AttributeType: 'S' },
        { AttributeName: 'evaluationDate', AttributeType: 'S' }
      ],
    },
    {
      TableName: 'ChasingProphets-ProphetPerformanceSummary',
      KeySchema: [
        { AttributeName: 'prophetId', KeyType: 'HASH' },
        { AttributeName: 'aggregationWindow', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'prophetId', AttributeType: 'S' },
        { AttributeName: 'aggregationWindow', AttributeType: 'S' }
      ],
    },
  ];

  const existing = await dynamodb.send(new ListTablesCommand({}));
  const existingNames = existing.TableNames || [];

  const tablesToWaitFor: string[] = [];

  for (const table of tables) {
    if (existingNames.includes(table.TableName)) {
      console.log(`  ✓ ${table.TableName} already exists`);
    } else {
      await dynamodb.send(new CreateTableCommand({
        ...table,
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`  ✓ Created ${table.TableName}`);
      tablesToWaitFor.push(table.TableName);
    }
  }

  // Wait for all newly created tables to be active
  if (tablesToWaitFor.length > 0) {
    console.log(`\n  ⏳ Waiting for ${tablesToWaitFor.length} table(s) to become active...`);
    for (const tableName of tablesToWaitFor) {
      await waitUntilTableExists(
        { client: dynamodb, maxWaitTime: 120 },
        { TableName: tableName }
      );
      console.log(`  ✓ ${tableName} is active`);
    }
  }

  console.log('\n✅ All tables ready\n');
}

// Step 2: Create S3 Bucket and Structure
async function createS3Structure() {
  console.log('📦 Step 2: Creating S3 bucket and structure...\n');

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`  ✓ Bucket ${bucketName} exists`);
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`  ✓ Created bucket ${bucketName}`);
  }

  const folders = [
    'models/scaffolds/slr/',
    'models/scaffolds/mlr/',
    'models/parameters/',
    'data/datasets/',
  ];

  for (const folder of folders) {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: folder,
      Body: '',
    }));
    console.log(`  ✓ Created folder: ${folder}`);
  }

  console.log('\n✅ S3 structure ready\n');
}

// Step 3: Upload Scaffold Scripts
async function uploadScaffoldScripts() {
  console.log('📜 Step 3: Uploading scaffold scripts to S3...\n');

  // Read training and inference scripts from lambda/scaffolds
  const slrTrain = await fs.readFile(path.join(__dirname, '../lambda/scaffolds/slr/train.py'), 'utf-8');
  const slrInference = await fs.readFile(path.join(__dirname, '../lambda/scaffolds/slr/inference.js'), 'utf-8');
  const mlrTrain = await fs.readFile(path.join(__dirname, '../lambda/scaffolds/mlr/train.py'), 'utf-8');
  const mlrInference = await fs.readFile(path.join(__dirname, '../lambda/scaffolds/mlr/inference.js'), 'utf-8');

  // Upload SLR scripts
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'models/scaffolds/slr/train.py',
    Body: slrTrain,
  }));

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'models/scaffolds/slr/inference.js',
    Body: slrInference,
    ContentType: 'application/javascript',
  }));

  // Upload MLR scripts
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'models/scaffolds/mlr/train.py',
    Body: mlrTrain,
  }));

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'models/scaffolds/mlr/inference.js',
    Body: mlrInference,
    ContentType: 'application/javascript',
  }));

  console.log('  ✓ Uploaded SLR scripts (train.py + inference.js)');
  console.log('  ✓ Uploaded MLR scripts (train.py + inference.js)');
  console.log('\n✅ Scaffold scripts uploaded\n');
}

// Step 4: Download Market Data DIRECTLY to S3 CSV files
async function downloadMarketData() {
  console.log('📊 Step 4: Downloading market data to S3 (DJIA and SPX)...\n');
  
  const { stdout } = await execAsync('python3 scripts/data/download-to-s3.py');
  console.log(stdout);
  
  console.log('\n✅ Market data loaded to S3\n');
}

// Step 4.5: Setup Cognito User Pool
async function setupCognito() {
  console.log('👤 Step 4.5: Setting up Cognito User Pool...\n');
  
  try {
    const { stdout } = await execAsync('bash scripts/setup-cognito.sh');
    console.log(stdout);
    console.log('\n✅ Cognito configured\n');
  } catch (error) {
    console.log('   ⚠️  Cognito setup skipped (may already exist or script not found)');
    console.log('   You can set it up manually later with: bash scripts/setup-cognito.sh\n');
  }
}

// Step 5: Create Model Scaffolds in DB
async function createScaffolds() {
  console.log('🏗️  Step 5: Creating model scaffolds...\n');
  
  const { stdout } = await execAsync('npx tsx scripts/models/init-models.ts');
  console.log(stdout);
  
  console.log('\n✅ Scaffolds created\n');
}

// Step 6: Create Data Slices and Prophets
async function createSlicesAndProphets() {
  console.log('✂️  Step 6: Creating data slices and prophets...\n');
  
  const { stdout } = await execAsync('npx tsx scripts/admin/create-slices-and-prophets.ts');
  console.log(stdout);
  
  console.log('\n✅ Slices and prophets created\n');
}

// Step 7: Train All Models
async function trainModels() {
  console.log('🎓 Step 7: Training all models...\n');
  
  // Use spawn instead of exec to handle long-running process
  return new Promise<void>((resolve, reject) => {
    const training = spawn('npx', ['tsx', 'scripts/admin/train-models.ts'], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    training.on('close', (code: number) => {
      if (code === 0) {
        console.log('\n✅ Models trained\n');
        resolve();
      } else {
        reject(new Error(`Training failed with exit code ${code}`));
      }
    });

    training.on('error', (error: Error) => {
      reject(error);
    });
  });
}

// Step 8: Calculate Performance
async function calculatePerformance() {
  console.log('📈 Step 8: Calculating performance metrics...\n');
  
  return new Promise<void>((resolve, reject) => {
    const perf = spawn('python3', ['scripts/admin/calculate-performance.py'], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    perf.on('close', (code: number) => {
      if (code === 0) {
        console.log('\n✅ Performance calculated\n');
        resolve();
      } else {
        reject(new Error(`Performance calculation failed with exit code ${code}`));
      }
    });

    perf.on('error', (error: Error) => {
      reject(error);
    });
  });
}

// Main execution
async function main() {
  try {
    await createTables();
    await createS3Structure();
    await uploadScaffoldScripts();
    await downloadMarketData();
    await setupCognito();
    await createScaffolds();
    await createSlicesAndProphets();
    await trainModels();
    await calculatePerformance();

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  ✅ INITIALIZATION COMPLETE!                         ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log('🎉 Your ChasingProphets instance is ready!');
    console.log('\nRun: npm run dev');
  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    process.exit(1);
  }
}

main();
