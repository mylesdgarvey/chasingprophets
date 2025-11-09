#!/usr/bin/env tsx
/**
 * Reset and rebuild the entire pipeline with CORRECT approach:
 * - Stacked non-overlapping slices ending 2024-12-31
 * - Only 2 scaffolds (SLR_1, MLR_2)
 * - Percentage returns for training
 */

import { DynamoDBClient, ScanCommand, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
// Parse CSV manually
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

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

interface CSVRow {
  date: string;
  close: number;
}

// Step 1: Delete all existing records
async function clearTables() {
  console.log('\n🗑️  Clearing existing data...\n');
  
  // DataSlices: key = dataSliceId
  console.log(`  Clearing ChasingProphets-DataSlices...`);
  let scan = await dynamodb.send(new ScanCommand({ TableName: 'ChasingProphets-DataSlices' }));
  if (scan.Items && scan.Items.length > 0) {
    for (const item of scan.Items) {
      const id = item.dataSliceId?.S;
      if (id) {
        await dynamodb.send(new DeleteItemCommand({
          TableName: 'ChasingProphets-DataSlices',
          Key: { dataSliceId: { S: id } }
        }));
      }
    }
    console.log(`    ✓ Deleted ${scan.Items.length} records`);
  } else {
    console.log(`    (empty)`);
  }
  
  // ModelFits: key = modelFitId
  console.log(`  Clearing ChasingProphets-ModelFits...`);
  scan = await dynamodb.send(new ScanCommand({ TableName: 'ChasingProphets-ModelFits' }));
  if (scan.Items && scan.Items.length > 0) {
    for (const item of scan.Items) {
      const id = item.modelFitId?.S;
      if (id) {
        await dynamodb.send(new DeleteItemCommand({
          TableName: 'ChasingProphets-ModelFits',
          Key: { modelFitId: { S: id } }
        }));
      }
    }
    console.log(`    ✓ Deleted ${scan.Items.length} records`);
  } else {
    console.log(`    (empty)`);
  }
  
  // Prophets: key = prophetId
  console.log(`  Clearing ChasingProphets-Prophets...`);
  scan = await dynamodb.send(new ScanCommand({ TableName: 'ChasingProphets-Prophets' }));
  if (scan.Items && scan.Items.length > 0) {
    for (const item of scan.Items) {
      const id = item.prophetId?.S;
      if (id) {
        await dynamodb.send(new DeleteItemCommand({
          TableName: 'ChasingProphets-Prophets',
          Key: { prophetId: { S: id } }
        }));
      }
    }
    console.log(`    ✓ Deleted ${scan.Items.length} records`);
  } else {
    console.log(`    (empty)`);
  }
}

// Step 2: Load DJIA data up to 2024-12-31
async function loadDJIAData(): Promise<CSVRow[]> {
  console.log('\n📊 Loading DJIA data...\n');
  
  const csvPath = '/workspaces/chasingprophets/public/djia_sample.csv';
  const content = await fs.readFile(csvPath, 'utf-8');
  const records = parseCSV(content);
  
  // Filter to 2024-12-31 and before
  const filtered = records
    .filter((r: any) => r.date <= '2024-12-31')
    .map((r: any) => ({
      date: r.date,
      close: parseFloat(r.close)
    }));
  
  console.log(`  ✓ Loaded ${filtered.length} trading days (2015-10-12 to 2024-12-31)`);
  return filtered;
}

// Step 3: Create stacked non-overlapping slices
async function createSlices(data: CSVRow[]) {
  console.log('\n🔪 Creating stacked slices...\n');
  
  const windowSizes = [20, 60, 120, 240];
  const totalDays = data.length;
  
  for (const windowSize of windowSizes) {
    const numSlices = Math.floor(totalDays / windowSize);
    console.log(`  ${windowSize}-day slices: ${numSlices} slices`);
    
    for (let i = 0; i < numSlices; i++) {
      // Calculate slice window (stacked from left to right, ending at 2024-12-31)
      const endIdx = totalDays - (i * windowSize);
      const startIdx = endIdx - windowSize;
      
      const sliceData = data.slice(startIdx, endIdx);
      const startDate = sliceData[0].date;
      const endDate = sliceData[sliceData.length - 1].date;
      
      const sliceId = `DJIA_${windowSize}d_slice${i + 1}`;
      
      // Save slice data to S3
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: `slices/${sliceId}.json`,
        Body: JSON.stringify(sliceData, null, 2),
        ContentType: 'application/json'
      }));
      
      // Create DynamoDB record
      await dynamodb.send(new PutItemCommand({
        TableName: 'ChasingProphets-DataSlices',
        Item: {
          dataSliceId: { S: sliceId },
          assetId: { S: 'DJIA' },
          windowDays: { N: windowSize.toString() },
          startDate: { S: startDate },
          endDate: { S: endDate },
          recordCount: { N: sliceData.length.toString() },
          s3Key: { S: `slices/${sliceId}.json` },
          createdAt: { S: new Date().toISOString() }
        }
      }));
    }
  }
  
  console.log(`\n  ✓ Created ${windowSizes.reduce((sum, w) => sum + Math.floor(totalDays / w), 0)} slices`);
}

// Step 4: Verify scaffolds exist (should be 2: SLR_1, MLR_2)
async function verifyScaffolds() {
  console.log('\n🏗️  Verifying scaffolds...\n');
  
  const scan = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelScaffolds'
  }));
  
  const scaffolds = scan.Items?.map(item => item.scaffoldId?.S).filter(Boolean) || [];
  console.log(`  Found scaffolds: ${scaffolds.join(', ')}`);
  
  if (scaffolds.length !== 2 || !scaffolds.includes('SLR') || !scaffolds.includes('MLR')) {
    throw new Error('Expected exactly 2 scaffolds: SLR and MLR');
  }
  
  console.log('  ✓ Scaffolds verified');
}

// Step 5: Create model fits (slice × scaffold)
async function createModelFits() {
  console.log('\n🤖 Creating model fits...\n');
  
  // Get all slices
  const slicesScan = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-DataSlices'
  }));
  const slices = slicesScan.Items || [];
  
  // Get all scaffolds
  const scaffoldsScan = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelScaffolds'
  }));
  const scaffolds = scaffoldsScan.Items || [];
  
  console.log(`  Creating ${slices.length} slices × ${scaffolds.length} scaffolds = ${slices.length * scaffolds.length} model fits\n`);
  
  let count = 0;
  for (const slice of slices) {
    const sliceId = slice.dataSliceId?.S!;
    const assetId = slice.assetId?.S!;
    
    for (const scaffold of scaffolds) {
      const scaffoldId = scaffold.scaffoldId?.S!;
      const fitId = `${sliceId}_${scaffoldId}`;
      
      await dynamodb.send(new PutItemCommand({
        TableName: 'ChasingProphets-ModelFits',
        Item: {
          modelFitId: { S: fitId },
          scaffoldId: { S: scaffoldId },
          dataSliceId: { S: sliceId },
          assetId: { S: assetId },
          trainingStatus: { S: 'unfit' },
          createdAt: { S: new Date().toISOString() }
        }
      }));
      
      count++;
      if (count % 50 === 0) {
        console.log(`    Created ${count} model fits...`);
      }
    }
  }
  
  console.log(`\n  ✓ Created ${count} model fits (all status='unfit')`);
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  RESET & REBUILD PIPELINE (Correct Approach)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await clearTables();
    const data = await loadDJIAData();
    await createSlices(data);
    await verifyScaffolds();
    await createModelFits();
    
    console.log('\n✅ COMPLETE!\n');
    console.log('Next steps:');
    console.log('  1. Update Python training scripts to use % returns');
    console.log('  2. Deploy Lambda for training');
    console.log('  3. Run batch training via Lambda\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
