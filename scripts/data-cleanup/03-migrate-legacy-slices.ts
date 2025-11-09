#!/usr/bin/env tsx
/**
 * Migrate Legacy Data Slices
 * Updates slices from assetId (legacy) to datasetId (new schema)
 */

import { getAllDatasets } from '../../src/services/dataset';
import { getAllDataSlices } from '../../src/services/dataSlice';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ 
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  }
});
const docClient = DynamoDBDocumentClient.from(client);

async function updateDataSlice(dataSliceId: string, datasetId: string) {
  const command = new UpdateCommand({
    TableName: 'ChasingProphets-DataSlices',
    Key: { dataSliceId },
    UpdateExpression: 'SET datasetId = :datasetId',
    ExpressionAttributeValues: {
      ':datasetId': datasetId
    }
  });
  
  await docClient.send(command);
}

async function migrateLegacySlices(dryRun = true) {
  console.log('═══════════════════════════════════════════');
  console.log(dryRun ? '   DRY RUN - No changes will be made' : '   MIGRATING LEGACY SLICES');
  console.log('═══════════════════════════════════════════\n');

  const datasets = await getAllDatasets();
  const slices = await getAllDataSlices();

  // Create assetId → datasetId mapping
  const assetToDataset = new Map<string, string>();
  datasets.forEach(d => {
    assetToDataset.set(d.assetId, d.datasetId);
  });

  // Find legacy slices
  const legacy = slices.filter(s => s.assetId && !s.datasetId);
  const migrated = slices.filter(s => s.datasetId);
  const orphaned = slices.filter(s => !s.assetId && !s.datasetId);

  console.log('📊 SLICE SCHEMA STATUS:');
  console.log(`  Legacy (assetId only):     ${legacy.length}`);
  console.log(`  Already migrated:          ${migrated.length}`);
  console.log(`  Orphaned (no parent):      ${orphaned.length}`);
  console.log(`  Total:                     ${slices.length}\n`);

  if (legacy.length === 0) {
    console.log('✅ No legacy slices found - all migrated!\n');
    return;
  }

  // Group by assetId
  const byAsset = new Map<string, typeof legacy>();
  legacy.forEach(s => {
    const existing = byAsset.get(s.assetId!) || [];
    byAsset.set(s.assetId!, [...existing, s]);
  });

  console.log(`🔧 MIGRATION PLAN:\n`);
  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const [assetId, slicesForAsset] of byAsset.entries()) {
    const datasetId = assetToDataset.get(assetId);
    
    if (!datasetId) {
      console.log(`  ⚠️  Asset ${assetId}: No dataset found - ${slicesForAsset.length} slices will be orphaned`);
      totalSkipped += slicesForAsset.length;
      continue;
    }

    console.log(`  ✓ Asset ${assetId} → Dataset ${datasetId}`);
    console.log(`    Migrating ${slicesForAsset.length} slices...`);

    if (!dryRun) {
      for (const slice of slicesForAsset) {
        await updateDataSlice(slice.dataSliceId, datasetId);
        totalMigrated++;
        
        if (totalMigrated % 50 === 0) {
          console.log(`    ... ${totalMigrated}/${legacy.length} migrated`);
        }
      }
    } else {
      totalMigrated += slicesForAsset.length;
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('   MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`  ✅ Slices migrated:        ${totalMigrated}`);
  console.log(`  ⚠️  Slices skipped:         ${totalSkipped}`);
  console.log(`  📊 Total processed:        ${totalMigrated + totalSkipped}\n`);

  if (dryRun) {
    console.log('ℹ️  This was a dry run. No changes were made.');
    console.log('   Run with --execute flag to apply changes.\n');
  } else {
    console.log('✅ Migration complete!\n');
  }
}

// Check for --execute flag
const dryRun = !process.argv.includes('--execute');

migrateLegacySlices(dryRun).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
