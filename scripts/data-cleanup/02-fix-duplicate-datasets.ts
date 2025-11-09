#!/usr/bin/env node
/**
 * Fix Duplicate Datasets
 * Identifies canonical dataset and deletes duplicates after migrating children
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ 
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  }
});
const docClient = DynamoDBDocumentClient.from(client);

async function updateDataSlice(dataSliceId: string, updates: any) {
  const command = new UpdateCommand({
    TableName: 'ChasingProphets-DataSlices',
    Key: { dataSliceId },
    UpdateExpression: 'SET datasetId = :datasetId',
    ExpressionAttributeValues: {
      ':datasetId': updates.datasetId
    }
  });
  
  await docClient.send(command);
}

async function fixDuplicates(dryRun = true) {
  console.log('═══════════════════════════════════════════');
  console.log(dryRun ? '   DRY RUN - No changes will be made' : '   FIXING DUPLICATE DATASETS');
  console.log('═══════════════════════════════════════════\n');

  const datasets = await getAllDatasets();
  const slices = await getAllDataSlices();

  // Group by assetId
  const byAsset = new Map<string, typeof datasets>();
  datasets.forEach(d => {
    const existing = byAsset.get(d.assetId) || [];
    byAsset.set(d.assetId, [...existing, d]);
  });

  const duplicates = Array.from(byAsset.entries()).filter(([_, dups]) => dups.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate datasets found!\n');
    return;
  }

  console.log(`Found ${duplicates.length} assets with duplicate datasets\n`);

  for (const [assetId, dups] of duplicates) {
    console.log(`\n🔧 Processing asset: ${assetId}`);
    console.log(`   Found ${dups.length} datasets:\n`);

    // Sort by record count (highest first)
    const sorted = dups.sort((a, b) => (b.recordCount || 0) - (a.recordCount || 0));
    
    sorted.forEach((d, i) => {
      console.log(`   ${i === 0 ? '👑' : '  '} ${d.datasetId}`);
      console.log(`      Name: ${d.name}`);
      console.log(`      Records: ${d.recordCount || 0}`);
      console.log(`      Source: ${d.source}`);
      console.log(`      Created: ${d.createdAt}`);
    });

    const canonical = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`\n   ✅ Keeping: ${canonical.datasetId} (${canonical.recordCount} records)`);
    console.log(`   ❌ Deleting: ${toDelete.map(d => d.datasetId).join(', ')}\n`);

    // Migrate slices
    for (const dup of toDelete) {
      const affectedSlices = slices.filter(s => s.datasetId === dup.datasetId);
      
      if (affectedSlices.length > 0) {
        console.log(`   📦 Migrating ${affectedSlices.length} slices from ${dup.datasetId} → ${canonical.datasetId}`);
        
        if (!dryRun) {
          for (const slice of affectedSlices) {
            await updateDataSlice(slice.dataSliceId, { datasetId: canonical.datasetId });
            console.log(`      ✓ ${slice.dataSliceId}`);
          }
        }
      }

      // Delete duplicate
      console.log(`   🗑️  Deleting dataset: ${dup.datasetId}`);
      if (!dryRun) {
        await deleteDataset(dup.datasetId);
        console.log(`      ✓ Deleted`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(dryRun ? '   DRY RUN COMPLETE' : '   CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════\n');

  if (dryRun) {
    console.log('ℹ️  This was a dry run. No changes were made.');
    console.log('   Run with --execute flag to apply changes.\n');
  }
}

// Check for --execute flag
const dryRun = !process.argv.includes('--execute');

fixDuplicates(dryRun).catch(err => {
  console.error('❌ Failed to fix duplicates:', err);
  process.exit(1);
});
