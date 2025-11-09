#!/usr/bin/env tsx
/**
 * Migration Script: Set modelParametersPath for all trained ModelFits
 * 
 * All trained models should have their parameters at:
 * s3://chasingprophets-models-{region}/models/{modelFitId}/parameters.json
 * 
 * This script updates all ModelFits with trainingStatus='fit' to have the correct path.
 */

import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

const dynamodb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

const TABLE = 'ChasingProphets-ModelFits';

async function getAllTrainedModelFits(): Promise<any[]> {
  const result = await dynamodb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'trainingStatus = :status',
    ExpressionAttributeValues: {
      ':status': { S: 'fit' }
    }
  }));

  if (!result.Items) return [];
  return result.Items.map(item => unmarshall(item));
}

async function updateModelFitParametersPath(modelFitId: string, parametersPath: string) {
  await dynamodb.send(new UpdateItemCommand({
    TableName: TABLE,
    Key: { modelFitId: { S: modelFitId } },
    UpdateExpression: 'SET modelParametersPath = :path, updatedAt = :now',
    ExpressionAttributeValues: {
      ':path': { S: parametersPath },
      ':now': { S: new Date().toISOString() }
    }
  }));
}

async function main() {
  console.log('🔧 Migration: Set modelParametersPath for trained ModelFits\n');

  // Load all trained model fits
  console.log('Loading trained model fits...');
  const modelFits = await getAllTrainedModelFits();
  console.log(`✓ Loaded ${modelFits.length} trained model fits\n`);

  let updated = 0;
  let skipped = 0;

  console.log('Setting parameter paths...\n');

  for (const fit of modelFits) {
    // Skip if already has path
    if (fit.modelParametersPath) {
      skipped++;
      continue;
    }

    // Construct standard path
    const parametersPath = `s3://${BUCKET}/models/${fit.modelFitId}/parameters.json`;

    try {
      await updateModelFitParametersPath(fit.modelFitId, parametersPath);
      updated++;

      if (updated % 50 === 0) {
        console.log(`  ✓ Updated ${updated} model fits...`);
      }
    } catch (error) {
      console.error(`  ✗ Error updating ${fit.modelFitId}:`, error);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total trained fits: ${modelFits.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Already had path: ${skipped}`);
  console.log('═══════════════════════════════════════\n');

  console.log('✅ Migration completed successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
