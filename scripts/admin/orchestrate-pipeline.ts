#!/usr/bin/env ts-node
/**
 * Admin Model Pipeline Orchestrator
 * 
 * This script demonstrates the full pipeline that will eventually be Lambda-based:
 * 1. Auto-generate standard data slices for an asset
 * 2. Auto-generate prophet configurations for all scaffold-asset-slice combinations
 * 3. Create training queue entries
 * 
 * Future: This will be broken into Lambda functions for admin dashboard use
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from 'crypto';
import Papa from 'papaparse';

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

// Required scaffolds - every asset goes through these
const REQUIRED_SCAFFOLDS = ['SLR', 'MLR'];

interface PriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface DataSlice {
  dataSliceId: string;
  datasetId: string;
  name: string;
  startDate: string;
  endDate: string;
  sliceType: string;
  availableColumns: string[];
  columnTypes: Record<string, string>;
  columnRanges: Record<string, { min: number; max: number }>;
  recordCount: number;
  createdAt: string;
}

interface ModelScaffold {
  scaffoldId: string;
  name: string;
  [key: string]: any;
}

interface Prophet {
  prophetId: string;
  prophetName: string;
  description?: string;
  assetId: string;
  modelFitId: string;
  targetProperty: string;
  s3InputTransformScriptPath?: string;
  s3OutputTransformScriptPath: string;
  forecastMethod: 'direct' | 'stochastic' | 'confidence_interval';
  forecastParams?: Record<string, any>;
  status: 'pending_training' | 'active' | 'inactive' | 'failed';
  createdAt: string;
}

interface ModelFit {
  modelFitId: string;
  scaffoldId: string;
  assetId: string;
  dataSliceId: string;
  modelParametersPath: string;
  s3RemoteInferenceScriptPath: string;
  s3LocalInferenceScriptPath?: string;
  trainingStatus: string;
  createdAt: string;
  lastUpdated: string;
}

/**
 * STEP 1: Fetch asset data from S3
 */
async function fetchAssetData(assetId: string, s3Path: string): Promise<PriceRow[]> {
  console.log(`\n📥 Fetching ${assetId} data from S3...`);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Path
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
    .filter((row: any) => row.date <= TRAINING_CUTOFF)
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  console.log(`   Loaded ${prices.length} records (${prices[0]?.date} to ${prices[prices.length - 1]?.date})`);
  
  return prices;
}

/**
 * STEP 2: Auto-generate standard data slices
 */
async function autoGenerateSlices(
  assetId: string,
  datasetId: string,
  data: any[]
): Promise<DataSlice[]> {
  console.log(`\n🔪 Auto-generating standard slices for ${assetId}...`);
  
  const slices: DataSlice[] = [];
  
  // Dynamically detect columns from first data row
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  const numericColumns = availableColumns.filter(col => 
    col !== 'date' && typeof firstRow[col] === 'number'
  );
  
  const columnTypes: Record<string, string> = {};
  availableColumns.forEach(col => {
    columnTypes[col] = col === 'date' ? 'datetime' : 'numerical';
  });
  
  console.log(`   Detected columns: ${availableColumns.join(', ')}`);
  console.log(`   Numeric columns for range tracking: ${numericColumns.join(', ')}`);

  for (const windowDays of WINDOW_SIZES) {
    let currentIndex = 0;
    let windowCount = 0;
    
    while (currentIndex + windowDays <= data.length) {
      const windowData = data.slice(currentIndex, currentIndex + windowDays);
      const startDate = windowData[0].date;
      const endDate = windowData[windowData.length - 1].date;
      
      if (endDate > TRAINING_CUTOFF) break;

      // Calculate ranges for numeric columns only
      const windowRanges: Record<string, { min: number; max: number }> = {};
      numericColumns.forEach(col => {
        const values = windowData.map((d: any) => d[col]).filter((v: any) => !isNaN(v) && isFinite(v));
        if (values.length > 0) {
          windowRanges[col] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      });

      const sliceId = `${assetId}_${windowDays}d_${startDate}_${endDate}`;
      
      const dataSlice: DataSlice = {
        dataSliceId: sliceId,
        datasetId,
        name: `${assetId} ${windowDays}-day window (${startDate} to ${endDate})`,
        startDate,
        endDate,
        sliceType: 'simple',
        availableColumns,
        columnTypes,
        columnRanges: windowRanges,
        recordCount: windowData.length,
        createdAt: new Date().toISOString()
      };

      await ddb.send(new PutCommand({
        TableName: 'ChasingProphets-DataSlices',
        Item: dataSlice
      }));

      slices.push(dataSlice);
      windowCount++;
      currentIndex += windowDays;
    }
    
    console.log(`   ✓ ${windowDays}-day window: ${windowCount} slices`);
  }
  
  console.log(`   Total: ${slices.length} slices created`);
  return slices;
}

/**
 * STEP 3: Fetch all available scaffolds
 */
async function getAllScaffolds(): Promise<ModelScaffold[]> {
  console.log(`\n🏗️  Fetching required scaffolds (${REQUIRED_SCAFFOLDS.join(', ')})...`);
  
  const result = await ddb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelScaffolds'
  }));

  const allScaffolds = (result.Items || []) as ModelScaffold[];
  
  // Filter to only required scaffolds
  const scaffolds = allScaffolds.filter(s => REQUIRED_SCAFFOLDS.includes(s.scaffoldId));
  
  console.log(`   Found ${scaffolds.length} required scaffolds: ${scaffolds.map(s => s.scaffoldId).join(', ')}`);
  
  if (scaffolds.length !== REQUIRED_SCAFFOLDS.length) {
    const missing = REQUIRED_SCAFFOLDS.filter(id => !scaffolds.find(s => s.scaffoldId === id));
    console.warn(`   ⚠️  Warning: Missing required scaffolds: ${missing.join(', ')}`);
  }
  
  return scaffolds;
}

/**
 * STEP 4: Auto-generate model fits and prophets
 * Creates a model fit (unfit status) and prophet for each scaffold-asset-slice combination
 */
async function autoGenerateProphets(
  assetId: string,
  slices: DataSlice[],
  scaffolds: ModelScaffold[]
): Promise<{ modelFits: ModelFit[], prophets: Prophet[] }> {
  console.log(`\n🔮 Auto-generating prophets and model fits...`);
  
  const modelFits: ModelFit[] = [];
  const prophets: Prophet[] = [];
  
  let fitCount = 0;
  let prophetCount = 0;

  for (const scaffold of scaffolds) {
    for (const slice of slices) {
      // Create model fit (unfit status)
      const modelFitId = `${scaffold.scaffoldId}_${assetId}_${slice.dataSliceId}`;
      
      const modelFit: ModelFit = {
        modelFitId,
        scaffoldId: scaffold.scaffoldId,
        assetId,
        dataSliceId: slice.dataSliceId,
        modelParametersPath: `models/${modelFitId}/parameters.json`,
        s3RemoteInferenceScriptPath: (scaffold as any).s3RemoteInferenceScriptPath,
        s3LocalInferenceScriptPath: (scaffold as any).s3LocalInferenceScriptPath,
        trainingStatus: 'unfit',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await ddb.send(new PutCommand({
        TableName: 'ChasingProphets-ModelFits',
        Item: modelFit
      }));

      modelFits.push(modelFit);
      fitCount++;

      // Create prophet (pending_training status) and upload default output transform
      const prophetId = randomUUID();

      // Default passthrough output_transform script (CommonJS)
      const outputTransformScript = `// Default output_transform for prophet ${prophetId}\nmodule.exports = async function output_transform(predictions, context = {}) {\n  // predictions may be an array or scalar; default behavior: passthrough\n  return predictions;\n};\n`;

      const s3Key = `scripts/prophets/${prophetId}/output_transform.js`;
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: outputTransformScript,
          ContentType: 'application/javascript'
        }));
      } catch (err) {
        console.warn(`   ⚠️  Warning: failed uploading output transform for ${prophetId}:`, err);
      }

      const s3OutputPath = `s3://${BUCKET}/${s3Key}`;

      const prophet: Prophet = {
        prophetId,
        prophetName: `${scaffold.scaffoldId}-${assetId}-${slice.startDate}`,
        description: `${scaffold.name} on ${assetId} (${slice.startDate} to ${slice.endDate})`,
        assetId,
        modelFitIds: [modelFitId],  // CHANGED: Array with single fit (ensemble support for future)
        ensembleMethod: 'single',   // ADDED: Single model fit for now
        targetProperty: 'close',
        s3OutputTransformScriptPath: s3OutputPath,
        forecastMethod: 'direct',
        status: 'pending_training',  // Will change to 'active' after training
        createdAt: new Date().toISOString()
      };

      await ddb.send(new PutCommand({
        TableName: 'ChasingProphets-Prophets',
        Item: prophet
      }));

      prophets.push(prophet);
      prophetCount++;
    }
    
    console.log(`   ✓ ${scaffold.scaffoldId}: ${slices.length} fits + prophets`);
  }
  
  console.log(`   Total: ${fitCount} model fits, ${prophetCount} prophets`);
  return { modelFits, prophets };
}

/**
 * STEP 5: Display training queue summary
 */
function displayTrainingQueue(modelFits: ModelFit[], scaffolds: ModelScaffold[]) {
  console.log(`\n📋 Training Queue Summary`);
  console.log(`=========================`);
  
  const byScaffold = modelFits.reduce((acc, fit) => {
    if (!acc[fit.scaffoldId]) acc[fit.scaffoldId] = [];
    acc[fit.scaffoldId].push(fit);
    return acc;
  }, {} as Record<string, ModelFit[]>);

  Object.entries(byScaffold).forEach(([scaffoldId, fits]) => {
    const scaffold = scaffolds.find(s => s.scaffoldId === scaffoldId);
    console.log(`\n${scaffoldId} (${scaffold?.name}): ${fits.length} jobs`);
    console.log(`  Status: All unfit, pending training`);
    console.log(`  Ready for batch training: YES`);
  });

  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Admin can review the training queue`);
  console.log(`   2. Click "Batch Train All" to start parallel training`);
  console.log(`   3. Each model fit will spawn a Lambda training job`);
  console.log(`   4. Prophets will activate once their model is trained`);
}

/**
 * STEP 6: Ensure dataset exists
 */
async function ensureDataset(assetId: string, s3Path: string): Promise<string> {
  const datasetId = `${assetId}_OHLCV`;
  
  try {
    const result = await ddb.send(new GetCommand({
      TableName: 'ChasingProphets-Datasets',
      Key: { datasetId }
    }));

    if (result.Item) {
      console.log(`✓ Dataset ${datasetId} already exists`);
      return datasetId;
    }
  } catch (err) {
    // Dataset doesn't exist
  }

  // Create dataset
  const dataset = {
    datasetId,
    assetId,
    name: `${assetId} OHLCV Data`,
    description: `${assetId} - Open, High, Low, Close, Volume`,
    source: `s3://${BUCKET}/${s3Path}`,
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

  console.log(`✓ Created dataset ${datasetId}`);
  return datasetId;
}

/**
 * Main orchestration function
 */
async function orchestrateModelPipeline(assetId: string, s3DataPath: string) {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  Admin Model Pipeline Orchestrator        ║`);
  console.log(`╚════════════════════════════════════════════╝`);
  console.log(`\nAsset: ${assetId}`);
  console.log(`S3 Path: ${s3DataPath}`);
  console.log(`Training Cutoff: ${TRAINING_CUTOFF}`);
  console.log(`Window Sizes: ${WINDOW_SIZES.join(', ')} days`);

  // Step 1: Ensure dataset exists
  const datasetId = await ensureDataset(assetId, s3DataPath);

  // Step 2: Fetch asset data
  const data = await fetchAssetData(assetId, s3DataPath);

  // Step 3: Auto-generate slices
  const slices = await autoGenerateSlices(assetId, datasetId, data);

  // Step 4: Get available scaffolds
  const scaffolds = await getAllScaffolds();

  // Step 5: Auto-generate prophets and model fits
  const { modelFits, prophets } = await autoGenerateProphets(assetId, slices, scaffolds);

  // Step 6: Display training queue
  displayTrainingQueue(modelFits, scaffolds);

  console.log(`\n✅ Pipeline orchestration complete!`);
  console.log(`\n📊 Summary:`);
  console.log(`   Asset: ${assetId}`);
  console.log(`   Data Slices: ${slices.length}`);
  console.log(`   Scaffolds: ${scaffolds.length}`);
  console.log(`   Model Fits: ${modelFits.length} (all unfit)`);
  console.log(`   Prophets: ${prophets.length} (all pending_training)`);
  console.log(`   Total Training Jobs: ${modelFits.length}`);
}

/**
 * Main entry point
 */
async function main() {
  const assetId = process.argv[2] || 'DJIA';
  const s3DataPath = process.argv[3] || 'public/djia_sample.csv';
  
  await orchestrateModelPipeline(assetId, s3DataPath);
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
