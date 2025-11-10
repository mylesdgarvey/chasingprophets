#!/usr/bin/env tsx
/**
 * Database Audit Script
 * Scans all tables and reports issues
 */

import { getAllAssets } from '../../src/services/assets';
import { getAllDatasets } from '../../src/services/dataset';
import { getAllDataSlices } from '../../src/services/dataSlice';
import { getAllModelFits } from '../../src/services/modelFit';
import { getAllModelScaffolds } from '../../src/services/modelScaffold';

async function audit() {
  console.log('═══════════════════════════════════════════');
  console.log('   DATABASE AUDIT REPORT');
  console.log('═══════════════════════════════════════════\n');

  // Load all data
  const assets = await getAllAssets();
  const datasets = await getAllDatasets();
  const slices = await getAllDataSlices();
  const fits = await getAllModelFits();
  const scaffolds = await getAllModelScaffolds();

  console.log('📊 TABLE COUNTS:');
  console.log(`  Assets:        ${assets.length}`);
  console.log(`  Datasets:      ${datasets.length}`);
  console.log(`  Data Slices:   ${slices.length}`);
  console.log(`  Model Fits:    ${fits.length}`);
  console.log(`  Scaffolds:     ${scaffolds.length}\n`);

  // Check for duplicate datasets
  console.log('🔍 CHECKING FOR DUPLICATE DATASETS...');
  const byAsset = new Map<string, typeof datasets>();
  datasets.forEach(d => {
    const existing = byAsset.get(d.assetId) || [];
    byAsset.set(d.assetId, [...existing, d]);
  });

  const duplicates = Array.from(byAsset.entries()).filter(([_, dups]) => dups.length > 1);
  if (duplicates.length > 0) {
    console.log(`  ⚠️  Found ${duplicates.length} assets with duplicate datasets:\n`);
    duplicates.forEach(([assetId, dups]) => {
      console.log(`  Asset: ${assetId}`);
      dups.forEach(d => {
        console.log(`    - ${d.datasetId} (${d.name})`);
        console.log(`      Records: ${d.recordCount || 0}`);
        console.log(`      Source: ${d.source}`);
        console.log(`      Created: ${d.createdAt}\n`);
      });
    });
  } else {
    console.log('  ✅ No duplicate datasets found\n');
  }

  // Check for legacy data slices
  console.log('🔍 CHECKING DATA SLICE SCHEMA...');
  const legacySlices = slices.filter(s => s.assetId && !s.datasetId);
  const newSlices = slices.filter(s => s.datasetId);
  const orphanedSlices = slices.filter(s => !s.assetId && !s.datasetId);

  console.log(`  Legacy schema (assetId only):  ${legacySlices.length}`);
  console.log(`  New schema (datasetId):        ${newSlices.length}`);
  console.log(`  Orphaned (no parent):          ${orphanedSlices.length}\n`);

  if (legacySlices.length > 0) {
    console.log(`  ⚠️  ${legacySlices.length} slices need migration from assetId → datasetId\n`);
  }

  // Check referential integrity
  console.log('🔍 CHECKING REFERENTIAL INTEGRITY...');
  
  // Assets → Datasets
  const assetIds = new Set(assets.map(a => a.ticker));
  const brokenDatasets = datasets.filter(d => !assetIds.has(d.assetId));
  if (brokenDatasets.length > 0) {
    console.log(`  ❌ ${brokenDatasets.length} datasets reference non-existent assets`);
    brokenDatasets.forEach(d => console.log(`     ${d.datasetId} → ${d.assetId}`));
  } else {
    console.log('  ✅ All datasets have valid asset references');
  }

  // Datasets → Slices
  const datasetIds = new Set(datasets.map(d => d.datasetId));
  const brokenSlices = slices.filter(s => s.datasetId && !datasetIds.has(s.datasetId));
  if (brokenSlices.length > 0) {
    console.log(`  ❌ ${brokenSlices.length} slices reference non-existent datasets`);
    brokenSlices.forEach(s => console.log(`     ${s.dataSliceId} → ${s.datasetId}`));
  } else {
    console.log('  ✅ All slices have valid dataset references (where datasetId exists)');
  }

  // Slices → Fits
  const sliceIds = new Set(slices.map(s => s.dataSliceId));
  const brokenFits = fits.filter(f => !sliceIds.has(f.dataSliceId));
  if (brokenFits.length > 0) {
    console.log(`  ❌ ${brokenFits.length} fits reference non-existent slices`);
    brokenFits.forEach(f => console.log(`     ${f.modelFitId} → ${f.dataSliceId}`));
  } else {
    console.log('  ✅ All fits have valid slice references');
  }

  // Scaffolds → Fits
  const scaffoldIds = new Set(scaffolds.map(s => s.scaffoldId));
  const brokenFitScaffolds = fits.filter(f => !scaffoldIds.has(f.scaffoldId));
  if (brokenFitScaffolds.length > 0) {
    console.log(`  ❌ ${brokenFitScaffolds.length} fits reference non-existent scaffolds`);
    brokenFitScaffolds.forEach(f => console.log(`     ${f.modelFitId} → ${f.scaffoldId}`));
  } else {
    console.log('  ✅ All fits have valid scaffold references');
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('   AUDIT COMPLETE');
  console.log('═══════════════════════════════════════════\n');

  // Summary
  const issues = [
    duplicates.length > 0 && `${duplicates.length} duplicate dataset groups`,
    legacySlices.length > 0 && `${legacySlices.length} legacy slices`,
    orphanedSlices.length > 0 && `${orphanedSlices.length} orphaned slices`,
    brokenDatasets.length > 0 && `${brokenDatasets.length} broken dataset references`,
    brokenSlices.length > 0 && `${brokenSlices.length} broken slice references`,
    brokenFits.length > 0 && `${brokenFits.length} broken fit references`,
    brokenFitScaffolds.length > 0 && `${brokenFitScaffolds.length} broken fit→scaffold references`
  ].filter(Boolean);

  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\nRun cleanup scripts to fix these issues.\n');
    process.exit(1);
  } else {
    console.log('✅ NO ISSUES FOUND - Database is clean!\n');
    process.exit(0);
  }
}

audit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
