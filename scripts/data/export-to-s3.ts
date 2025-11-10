#!/usr/bin/env tsx
/**
 * Export Asset Prices from DynamoDB to S3 CSV files
 * 
 * Reads data from ChasingProphets-AssetPrices table and writes
 * CSV files to S3 at data/assets/{assetId}/ohlcv_full.csv
 */

import 'dotenv/config';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

const dynamodb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

async function exportAssetToS3(ticker: string) {
  console.log(`\n📤 Exporting ${ticker} to S3...`);
  
  // Query all price records for this ticker
  const cmd = new QueryCommand({
    TableName: 'ChasingProphets-AssetPrices',
    KeyConditionExpression: 'ticker = :ticker',
    ExpressionAttributeValues: {
      ':ticker': { S: ticker }
    }
  });
  
  const result = await dynamodb.send(cmd);
  
  if (!result.Items || result.Items.length === 0) {
    console.log(`  ⚠️  No data found for ${ticker}`);
    return;
  }
  
  // Convert to array and sort by date
  const prices = result.Items
    .map(item => unmarshall(item))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  console.log(`  ✓ Loaded ${prices.length} price records`);
  
  // Convert to CSV format
  const header = 'date,open,high,low,close,volume';
  const rows = prices.map(p => 
    `${p.date},${p.open},${p.high},${p.low},${p.close},${p.volume}`
  );
  const csv = [header, ...rows].join('\n');
  
  // Upload to S3
  const s3Key = `data/assets/${ticker}/ohlcv_full.csv`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: csv,
    ContentType: 'text/csv'
  }));
  
  console.log(`  ✓ Uploaded to s3://${BUCKET}/${s3Key}`);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Export AssetPrices to S3 CSV Files                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  const tickers = ['DJIA', 'SPX'];
  
  for (const ticker of tickers) {
    await exportAssetToS3(ticker);
  }
  
  console.log('\n✅ All assets exported to S3\n');
}

main().catch(console.error);
