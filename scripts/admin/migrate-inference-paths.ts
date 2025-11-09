#!/usr/bin/env tsx
/**
 * Migration Script: Copy inference script paths from scaffolds to model fits
 * 
 * ModelFit records should have s3LocalInferenceScriptPath and s3RemoteInferenceScriptPath
 * copied from their parent scaffold. This script updates all existing ModelFits.
 */

import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';

const dynamodb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

const TABLES = {
  ModelFits: 'ChasingProphets-ModelFits',
  ModelScaffolds: 'ChasingProphets-ModelScaffolds'
};

async function getAllScaffolds(): Promise<Map<string, any>> {
  const result = await dynamodb.send(new ScanCommand({
    TableName: TABLES.ModelScaffolds
  }));

  const scaffoldMap = new Map();
  if (result.Items) {
    result.Items.forEach(item => {
      const scaffold = unmarshall(item);
      scaffoldMap.set(scaffold.scaffoldId, scaffold);
    });
  }

  return scaffoldMap;
}

async function getAllModelFits(): Promise<any[]> {
  const result = await dynamodb.send(new ScanCommand({
    TableName: TABLES.ModelFits
  }));

  if (!result.Items) return [];
  return result.Items.map(item => unmarshall(item));
}

async function updateModelFit(modelFitId: string, localPath: string, remotePath: string) {
  await dynamodb.send(new UpdateItemCommand({
    TableName: TABLES.ModelFits,
    Key: { modelFitId: { S: modelFitId } },
    UpdateExpression: 'SET s3LocalInferenceScriptPath = :local, s3RemoteInferenceScriptPath = :remote, updatedAt = :now',
    ExpressionAttributeValues: {
      ':local': { S: localPath },
      ':remote': { S: remotePath },
      ':now': { S: new Date().toISOString() }
    }
  }));
}

async function main() {
  console.log('🔧 Migration: Copy inference script paths to ModelFits\n');

  // Load all scaffolds
  console.log('Loading scaffolds...');
  const scaffolds = await getAllScaffolds();
  console.log(`✓ Loaded ${scaffolds.size} scaffolds\n`);

  // Load all model fits
  console.log('Loading model fits...');
  const modelFits = await getAllModelFits();
  console.log(`✓ Loaded ${modelFits.length} model fits\n`);

  // Update each model fit
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log('Updating model fits...\n');

  for (const fit of modelFits) {
    try {
      const scaffold = scaffolds.get(fit.scaffoldId);
      
      if (!scaffold) {
        console.log(`  ⚠️  ${fit.modelFitId}: Scaffold ${fit.scaffoldId} not found`);
        skipped++;
        continue;
      }

      if (!scaffold.s3LocalInferenceScriptPath || !scaffold.s3RemoteInferenceScriptPath) {
        console.log(`  ⚠️  ${fit.modelFitId}: Scaffold missing inference paths`);
        skipped++;
        continue;
      }

      // Check if already has paths
      if (fit.s3LocalInferenceScriptPath && fit.s3RemoteInferenceScriptPath) {
        skipped++;
        continue;
      }

      // Update
      await updateModelFit(
        fit.modelFitId,
        scaffold.s3LocalInferenceScriptPath,
        scaffold.s3RemoteInferenceScriptPath
      );

      updated++;
      if (updated % 50 === 0) {
        console.log(`  ✓ Updated ${updated} model fits...`);
      }
    } catch (error) {
      console.error(`  ✗ Error updating ${fit.modelFitId}:`, error);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total model fits: ${modelFits.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('═══════════════════════════════════════\n');

  if (errors > 0) {
    console.log('⚠️  Migration completed with errors');
    process.exit(1);
  }

  console.log('✅ Migration completed successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
