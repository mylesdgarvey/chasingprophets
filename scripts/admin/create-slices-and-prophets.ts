#!/usr/bin/env tsx
/**
 * Create Data Slices and Prophets
 * 
 * This script:
 * 1. Loads DJIA and SPX data from S3 CSV files
 * 2. Creates sliding window slices (20d, 60d, 120d, 240d)
 * 3. Creates prophets (model fit = scaffold × slice)
 */

import 'dotenv/config';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

interface PriceRecord {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  Create Data Slices and Prophets                     ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

// Step 1: Load price data from S3 CSV file
async function loadPriceData(assetId: string): Promise<PriceRecord[]> {
  console.log(`📊 Loading ${assetId} price data from S3...`);
  
  const s3Key = `data/assets/${assetId}/ohlcv_full.csv`;
  const result = await s3.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key
  }));

  if (!result.Body) {
    throw new Error(`No data found for ${assetId} in S3`);
  }

  const csvText = await result.Body.transformToString();
  const lines = csvText.trim().split('\n');
  
  const prices: PriceRecord[] = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      date: values[0],
      open: parseFloat(values[1]),
      high: parseFloat(values[2]),
      low: parseFloat(values[3]),
      close: parseFloat(values[4]),
      volume: parseInt(values[5])
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  console.log(`  ✓ Loaded ${prices.length} price records (${prices[0].date} to ${prices[prices.length - 1].date})\n`);
  return prices;
}

// Step 2: Create sliding window slices
async function createSlices(assetId: string, datasetId: string, prices: PriceRecord[]) {
  console.log(`✂️  Creating slices for ${assetId}...\n`);

  const windowSizes = [20, 60, 120, 240];
  let totalSlices = 0;

  for (const windowSize of windowSizes) {
    const numSlices = Math.floor(prices.length / windowSize);
    console.log(`  ${windowSize}-day slices: ${numSlices} slices`);

    for (let i = 0; i < numSlices; i++) {
      const startIdx = i * windowSize;
      const endIdx = startIdx + windowSize;
      const sliceData = prices.slice(startIdx, endIdx);

      const sliceId = `${assetId}_${windowSize}d_slice${i + 1}`;
      
      await dynamodb.send(new PutItemCommand({
        TableName: 'ChasingProphets-DataSlices',
        Item: {
          dataSliceId: { S: sliceId },
          datasetId: { S: datasetId },
          assetId: { S: assetId },
          sliceType: { S: 'sliding_window' },
          windowSize: { N: String(windowSize) },
          startDate: { S: sliceData[0].date },
          endDate: { S: sliceData[sliceData.length - 1].date },
          recordCount: { N: String(sliceData.length) },
          createdAt: { S: new Date().toISOString() }
        }
      }));

      totalSlices++;
    }
  }

  console.log(`\n  ✓ Created ${totalSlices} slices for ${assetId}\n`);
  return totalSlices;
}

// Step 3: Create model fits (prophets)
async function createModelFits(assetId: string) {
  console.log(`🤖 Creating model fits for ${assetId}...\n`);

  // Get scaffolds
  const scaffolds = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelScaffolds'
  }));

  if (!scaffolds.Items || scaffolds.Items.length === 0) {
    throw new Error('No scaffolds found! Run init-models.ts first');
  }

  // Get slices for this asset
  const slices = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-DataSlices',
    FilterExpression: 'assetId = :asset',
    ExpressionAttributeValues: {
      ':asset': { S: assetId }
    }
  }));

  if (!slices.Items || slices.Items.length === 0) {
    throw new Error(`No slices found for ${assetId}`);
  }

  let count = 0;
  
  for (const scaffold of scaffolds.Items) {
    const scaffoldId = scaffold.scaffoldId!.S!;
    
    for (const slice of slices.Items) {
      const sliceId = slice.dataSliceId!.S!;
      const modelFitId = `${sliceId}_${scaffoldId}`;

      await dynamodb.send(new PutItemCommand({
        TableName: 'ChasingProphets-ModelFits',
        Item: {
          modelFitId: { S: modelFitId },
          scaffoldId: { S: scaffoldId },
          dataSliceId: { S: sliceId },
          trainingStatus: { S: 'pending_training' },
          createdAt: { S: new Date().toISOString() }
        }
      }));

      count++;
    }
  }

  console.log(`  ✓ Created ${count} model fits (${slices.Items.length} slices × ${scaffolds.Items.length} scaffolds)\n`);
  return count;
}

// Step 4: Create prophets
async function createProphets(assetId: string) {
  console.log(`🔮 Creating prophets for ${assetId}...\n`);

  // Get all model fits for this asset
  const modelFits = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits'
  }));

  if (!modelFits.Items || modelFits.Items.length === 0) {
    console.log('  ⚠️  No model fits found\n');
    return 0;
  }

  // Filter to only this asset's model fits
  const assetModelFits = modelFits.Items.filter(item => {
    const sliceId = item.dataSliceId?.S || '';
    return sliceId.startsWith(assetId);
  });

  let count = 0;

  for (const modelFit of assetModelFits) {
    const modelFitId = modelFit.modelFitId!.S!;
    const sliceId = modelFit.dataSliceId!.S!;
    const scaffoldId = modelFit.scaffoldId!.S!;
    
    // Prophet ID = sliceId + scaffoldId format
    const prophetId = `prophet-${scaffoldId.toLowerCase()}-${assetId.toLowerCase()}-${sliceId.split('_').slice(1).join('-')}`;

    await dynamodb.send(new PutItemCommand({
      TableName: 'ChasingProphets-Prophets',
      Item: {
        prophetId: { S: prophetId },
        prophetName: { S: `${assetId} ${scaffoldId} ${sliceId}` },
        assetId: { S: assetId },
        status: { S: 'pending_training' },
        modelFitIds: { L: [{ S: modelFitId }] },
        targetProperty: { S: 'close' },
        ensembleMethod: { S: 'single' },
        forecastMethod: { S: 'direct' },
        createdAt: { S: new Date().toISOString() }
      }
    }));

    count++;
  }

  console.log(`  ✓ Created ${count} prophets\n`);
  return count;
}

// Main execution
async function main() {
  try {
    const assets = ['DJIA', 'SPX'];
    
    for (const assetId of assets) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${assetId}`);
      console.log('='.repeat(60) + '\n');

      const datasetId = `dataset-${assetId.toLowerCase()}-historical`;
      
      // Load price data
      const prices = await loadPriceData(assetId);
      
      // Create slices
      await createSlices(assetId, datasetId, prices);
      
      // Create model fits
      await createModelFits(assetId);
      
      // Create prophets
      await createProphets(assetId);
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  ✅ COMPLETE!                                        ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
