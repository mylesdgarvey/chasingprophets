#!/usr/bin/env ts-node
/**
 * Initialize Standard Data Slices
 * Creates standard time-window slices for training:
 * - 30, 60, 90, 120, 240, 480, 600, 1200 day windows
 * - Each window size is stacked consecutively from earliest data up to end of 2024
 * - NO 2025 data is used for training (reserved for testing)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Use require for papaparse to avoid type issues
const Papa = require('papaparse');

const REGION = process.env.VITE_AWS_REGION || "us-east-1";
const BUCKET = process.env.VITE_S3_MODELS_BUCKET || "chasingprophets-models-us-east-1";

// Initialize clients
const ddbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

// Standard window sizes in days
const WINDOW_SIZES = [30, 60, 90, 120, 240, 480, 600, 1200];

// Training data cutoff - NO 2025 data
const TRAINING_CUTOFF = '2024-12-31';

interface PriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch DJIA price data from S3
 */
async function fetchDJIAData(): Promise<PriceRow[]> {
  console.log('Fetching DJIA data from S3...');
  
  // Assuming DJIA data is stored at this location (adjust if needed)
  const s3Key = 'public/djia_sample.csv';
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('No data in S3 response');
  }

  const csvText = await response.Body.transformToString();
  
  // Parse CSV
  const parsed = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  const prices: PriceRow[] = ((parsed.data as any[]) || [])
    .filter((row: any) => row.date && row.close)
    .map((row: any) => ({
      date: String(row.date),
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseInt(row.volume) || 0
    }))
    .filter((row: any) => row.date <= TRAINING_CUTOFF)  // Exclude 2025
    .sort((a: any, b: any) => a.date.localeCompare(b.date));  // Ensure chronological order

  console.log(`Loaded ${prices.length} price records (up to ${TRAINING_CUTOFF})`);
  console.log(`Date range: ${prices[0].date} to ${prices[prices.length - 1].date}`);
  
  return prices;
}

/**
 * Analyze CSV data schema
 */
function analyzeSchema(data: PriceRow[]): {
  availableColumns: string[];
  columnTypes: Record<string, string>;
  columnRanges: Record<string, { min: number; max: number }>;
} {
  const availableColumns = ['date', 'open', 'high', 'low', 'close', 'volume'];
  
  const columnTypes: Record<string, string> = {
    date: 'datetime',
    open: 'numerical',
    high: 'numerical',
    low: 'numerical',
    close: 'numerical',
    volume: 'numerical'
  };

  const columnRanges: Record<string, { min: number; max: number }> = {
    open: { min: Math.min(...data.map(d => d.open)), max: Math.max(...data.map(d => d.open)) },
    high: { min: Math.min(...data.map(d => d.high)), max: Math.max(...data.map(d => d.high)) },
    low: { min: Math.min(...data.map(d => d.low)), max: Math.max(...data.map(d => d.low)) },
    close: { min: Math.min(...data.map(d => d.close)), max: Math.max(...data.map(d => d.close)) },
    volume: { min: Math.min(...data.map(d => d.volume)), max: Math.max(...data.map(d => d.volume)) }
  };

  return { availableColumns, columnTypes, columnRanges };
}

/**
 * Add days to a date
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Create data slices for a specific window size
 */
async function createWindowSlices(
  windowDays: number,
  allData: PriceRow[],
  schema: ReturnType<typeof analyzeSchema>
): Promise<number> {
  console.log(`\nCreating ${windowDays}-day window slices...`);
  
  let sliceCount = 0;
  let currentIndex = 0;
  
  while (currentIndex + windowDays <= allData.length) {
    const windowData = allData.slice(currentIndex, currentIndex + windowDays);
    const startDate = windowData[0].date;
    const endDate = windowData[windowData.length - 1].date;
    
    // Stop if end date exceeds training cutoff
    if (endDate > TRAINING_CUTOFF) {
      break;
    }

    // Calculate ranges for this specific window
    const windowRanges: Record<string, { min: number; max: number }> = {
      open: { min: Math.min(...windowData.map(d => d.open)), max: Math.max(...windowData.map(d => d.open)) },
      high: { min: Math.min(...windowData.map(d => d.high)), max: Math.max(...windowData.map(d => d.high)) },
      low: { min: Math.min(...windowData.map(d => d.low)), max: Math.max(...windowData.map(d => d.low)) },
      close: { min: Math.min(...windowData.map(d => d.close)), max: Math.max(...windowData.map(d => d.close)) },
      volume: { min: Math.min(...windowData.map(d => d.volume)), max: Math.max(...windowData.map(d => d.volume)) }
    };

    const sliceId = `DJIA_${windowDays}d_${startDate}_${endDate}`;
    
    const dataSlice = {
      dataSliceId: sliceId,
      datasetId: 'DJIA_OHLCV',
      name: `DJIA ${windowDays}-day window (${startDate} to ${endDate})`,
      startDate,
      endDate,
      sliceType: 'simple',
      availableColumns: schema.availableColumns,
      columnTypes: schema.columnTypes,
      columnRanges: windowRanges,
      recordCount: windowData.length,
      createdAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await ddb.send(new PutCommand({
      TableName: 'ChasingProphets-DataSlices',
      Item: dataSlice
    }));

    sliceCount++;
    console.log(`  ✓ Created: ${sliceId} (${windowData.length} records)`);
    
    // Move window forward by window size (non-overlapping)
    currentIndex += windowDays;
  }
  
  console.log(`Created ${sliceCount} slices for ${windowDays}-day window`);
  return sliceCount;
}

/**
 * Ensure DJIA dataset exists
 */
async function ensureDJIADataset(): Promise<void> {
  const datasetId = 'DJIA_OHLCV';
  
  // Check if dataset exists
  try {
    const result = await ddb.send(new GetCommand({
      TableName: 'ChasingProphets-Datasets',
      Key: { datasetId }
    }));

    if (result.Item) {
      console.log('✓ DJIA dataset already exists');
      return;
    }
  } catch (err) {
    // Dataset doesn't exist, create it
  }

  // Create dataset
  const dataset = {
    datasetId,
    assetId: 'DJIA',
    name: 'DJIA OHLCV Data',
    description: 'Dow Jones Industrial Average - Open, High, Low, Close, Volume',
    source: `s3://${BUCKET}/public/djia_sample.csv`,
    type: 'OHLCV',
    startDate: '1970-01-01',
    endDate: TRAINING_CUTOFF,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  await ddb.send(new PutCommand({
    TableName: 'ChasingProphets-Datasets',
    Item: dataset
  }));

  console.log('✓ Created DJIA dataset');
}

/**
 * Main function
 */
async function main() {
  console.log('Initializing Standard Data Slices');
  console.log('==================================');
  console.log(`Training cutoff: ${TRAINING_CUTOFF}`);
  console.log(`Window sizes: ${WINDOW_SIZES.join(', ')} days\n`);

  // Ensure dataset exists
  await ensureDJIADataset();

  // Fetch DJIA data
  const allData = await fetchDJIAData();

  // Analyze schema once
  const schema = analyzeSchema(allData);
  console.log('\nSchema Analysis:');
  console.log(`  Columns: ${schema.availableColumns.join(', ')}`);
  console.log(`  Overall ranges:`);
  Object.entries(schema.columnRanges).forEach(([col, range]) => {
    console.log(`    ${col}: ${range.min.toFixed(2)} - ${range.max.toFixed(2)}`);
  });

  // Create slices for each window size
  let totalSlices = 0;
  for (const windowDays of WINDOW_SIZES) {
    const count = await createWindowSlices(windowDays, allData, schema);
    totalSlices += count;
  }

  console.log('\n==================================');
  console.log(`✓ Initialization complete!`);
  console.log(`  Total slices created: ${totalSlices}`);
  console.log(`  Window sizes: ${WINDOW_SIZES.length}`);
  console.log(`  Training data: up to ${TRAINING_CUTOFF}`);
  console.log(`  2025 data: EXCLUDED (reserved for testing)`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
