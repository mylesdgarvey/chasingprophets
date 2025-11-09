# Phase 2: Data Cleanup Tasks

**Purpose:** Clean up duplicate/orphaned data before implementing CRUD UI  
**Priority:** HIGH - Must be done before users can create/edit entities

---

## 🔍 ISSUES IDENTIFIED

### 1. **Duplicate DJIA Datasets**
**Problem:** User reported "two datasets of the djia in the database"  
**Impact:** Confusing UX, wasted storage, unclear which is canonical  
**Root Cause:** Likely manual seeding + script execution

### 2. **Orphaned Data Slices**
**Problem:** "slices don't appear to be latched to a dataset"  
**Impact:** Data slices not showing parent dataset, broken relationships  
**Root Cause:** Schema migration from `assetId` to `datasetId` incomplete

### 3. **Inconsistent Schema**
**Problem:** DataSlice has both `datasetId` (new) and `assetId` (legacy)  
**Impact:** Code complexity, potential bugs, migration needed  
**Root Cause:** Incremental schema changes without full migration

---

## 📋 CLEANUP TASKS

### Task 1: Audit Current Database State

#### 1.1 List All Assets
```bash
aws dynamodb scan \
  --table-name ChasingProphets-Assets \
  --region us-east-1 \
  | jq '.Items[] | {ticker: .ticker.S, name: .name.S, market: .market.S}'
```

**Expected:**
- Small number of assets (DJIA, SPY, AAPL, etc.)
- No duplicates on ticker (primary key enforces this)

#### 1.2 List All Datasets with Asset Links
```bash
aws dynamodb scan \
  --table-name ChasingProphets-Datasets \
  --region us-east-1 \
  | jq '.Items[] | {
      datasetId: .datasetId.S, 
      assetId: .assetId.S, 
      name: .name.S,
      source: .source.S,
      recordCount: .recordCount.N
    }'
```

**Look for:**
- Multiple datasets with same `assetId` (e.g., two DJIA datasets)
- Datasets with missing `source` (S3 path)
- Datasets with `recordCount = 0` or `null`

#### 1.3 List All Data Slices with Parent Links
```bash
aws dynamodb scan \
  --table-name ChasingProphets-DataSlices \
  --region us-east-1 \
  | jq '.Items[] | {
      dataSliceId: .dataSliceId.S,
      datasetId: .datasetId.S // null,
      assetId: .assetId.S // null,
      startDate: .startDate.S,
      endDate: .endDate.S,
      sliceType: .sliceType.S // null
    }'
```

**Look for:**
- Slices with `assetId` but no `datasetId` (legacy schema)
- Slices with neither `assetId` nor `datasetId` (orphaned)
- Slices referencing non-existent `datasetId`

#### 1.4 List All Model Fits with Dependencies
```bash
aws dynamodb scan \
  --table-name ChasingProphets-ModelFits \
  --region us-east-1 \
  | jq '.Items[] | {
      modelFitId: .modelFitId.S,
      scaffoldId: .scaffoldId.S,
      dataSliceId: .dataSliceId.S,
      assetId: .assetId.S
    }'
```

**Look for:**
- Fits referencing non-existent `dataSliceId`
- Fits referencing non-existent `scaffoldId`

---

### Task 2: Identify Duplicate Datasets

#### 2.1 Find DJIA Duplicates
```typescript
// Run in browser console or Node script
const datasets = await getAllDatasets();
const djiaDatasets = datasets.filter(d => d.assetId === 'DJIA' || d.assetId === '^DJI');

console.log('DJIA Datasets:', djiaDatasets.map(d => ({
  datasetId: d.datasetId,
  name: d.name,
  source: d.source,
  recordCount: d.recordCount,
  dateRange: d.dateRange,
  createdAt: d.createdAt
})));
```

#### 2.2 Decide Which to Keep
**Criteria:**
1. Most recent `createdAt` or `lastUpdated`
2. Largest `recordCount`
3. Most complete `dateRange`
4. Valid S3 `source` path

**Decision Logic:**
```typescript
function selectCanonicalDataset(duplicates: Dataset[]): Dataset {
  // Prefer dataset with most records
  const sorted = duplicates.sort((a, b) => 
    (b.recordCount || 0) - (a.recordCount || 0)
  );
  
  // Verify S3 source exists
  const canonical = sorted.find(d => d.source && d.source.startsWith('s3://'));
  
  return canonical || sorted[0];
}
```

#### 2.3 Migrate Child Dependencies
Before deleting duplicate datasets, reassign all child entities:

```typescript
async function migrateChildEntities(oldDatasetId: string, newDatasetId: string) {
  // Get all data slices pointing to old dataset
  const slices = await getDataSlicesByDataset(oldDatasetId);
  
  for (const slice of slices) {
    // Update slice to point to new dataset
    await updateDataSlice(slice.dataSliceId, {
      datasetId: newDatasetId
    });
  }
  
  console.log(`Migrated ${slices.length} data slices`);
}
```

#### 2.4 Delete Duplicate Datasets
```typescript
async function deleteDuplicateDatasets() {
  const datasets = await getAllDatasets();
  const byAsset = groupBy(datasets, d => d.assetId);
  
  for (const [assetId, dups] of Object.entries(byAsset)) {
    if (dups.length > 1) {
      console.log(`Found ${dups.length} datasets for ${assetId}`);
      const canonical = selectCanonicalDataset(dups);
      const toDelete = dups.filter(d => d.datasetId !== canonical.datasetId);
      
      for (const dup of toDelete) {
        // Migrate children first
        await migrateChildEntities(dup.datasetId, canonical.datasetId);
        
        // Then delete
        await deleteDataset(dup.datasetId);
        console.log(`Deleted duplicate dataset: ${dup.datasetId}`);
      }
    }
  }
}
```

---

### Task 3: Fix Orphaned Data Slices

#### 3.1 Find Slices with Legacy Schema
```typescript
async function findLegacySlices() {
  const allSlices = await getAllDataSlices();
  
  const legacy = allSlices.filter(s => 
    s.assetId && !s.datasetId  // Has assetId but no datasetId
  );
  
  console.log(`Found ${legacy.length} legacy slices to migrate`);
  return legacy;
}
```

#### 3.2 Migrate Legacy Slices to New Schema
```typescript
async function migrateLegacySlices() {
  const legacy = await findLegacySlices();
  const datasets = await getAllDatasets();
  
  for (const slice of legacy) {
    // Find dataset for this asset
    const dataset = datasets.find(d => d.assetId === slice.assetId);
    
    if (!dataset) {
      console.error(`No dataset found for assetId: ${slice.assetId}`);
      continue;
    }
    
    // Update slice with datasetId
    await updateDataSlice(slice.dataSliceId, {
      datasetId: dataset.datasetId
    });
    
    console.log(`Migrated slice ${slice.dataSliceId}: ${slice.assetId} → ${dataset.datasetId}`);
  }
}
```

#### 3.3 Find Truly Orphaned Slices
```typescript
async function findOrphanedSlices() {
  const allSlices = await getAllDataSlices();
  const datasets = await getAllDatasets();
  const datasetIds = new Set(datasets.map(d => d.datasetId));
  
  const orphaned = allSlices.filter(s => {
    if (!s.datasetId && !s.assetId) return true;  // No parent at all
    if (s.datasetId && !datasetIds.has(s.datasetId)) return true;  // Dataset deleted
    return false;
  });
  
  console.log(`Found ${orphaned.length} orphaned slices`);
  return orphaned;
}
```

#### 3.4 Handle Orphaned Slices
**Options:**
1. **Delete** - If slice is not used by any model fits
2. **Reassign** - If dataset can be inferred from date ranges
3. **Manual Review** - If uncertain

```typescript
async function handleOrphanedSlices() {
  const orphaned = await findOrphanedSlices();
  const allFits = await getAllModelFits();
  
  for (const slice of orphaned) {
    // Check if any model fit uses this slice
    const usedByFit = allFits.some(f => f.dataSliceId === slice.dataSliceId);
    
    if (!usedByFit) {
      // Safe to delete
      await deleteDataSlice(slice.dataSliceId);
      console.log(`Deleted orphaned slice: ${slice.dataSliceId}`);
    } else {
      // Need manual review
      console.warn(`Orphaned slice ${slice.dataSliceId} is used by model fits - needs manual review`);
    }
  }
}
```

---

### Task 4: Verify Referential Integrity

#### 4.1 Check Asset → Dataset Links
```typescript
async function verifyAssetDatasetLinks() {
  const datasets = await getAllDatasets();
  const assets = await getAllAssets();
  const assetIds = new Set(assets.map(a => a.ticker));
  
  const broken = datasets.filter(d => !assetIds.has(d.assetId));
  
  if (broken.length > 0) {
    console.error(`${broken.length} datasets reference non-existent assets`);
    broken.forEach(d => console.error(`  ${d.datasetId} → ${d.assetId}`));
  }
  
  return broken;
}
```

#### 4.2 Check Dataset → DataSlice Links
```typescript
async function verifyDatasetSliceLinks() {
  const slices = await getAllDataSlices();
  const datasets = await getAllDatasets();
  const datasetIds = new Set(datasets.map(d => d.datasetId));
  
  const broken = slices.filter(s => 
    s.datasetId && !datasetIds.has(s.datasetId)
  );
  
  if (broken.length > 0) {
    console.error(`${broken.length} slices reference non-existent datasets`);
    broken.forEach(s => console.error(`  ${s.dataSliceId} → ${s.datasetId}`));
  }
  
  return broken;
}
```

#### 4.3 Check ModelFit → DataSlice Links
```typescript
async function verifyFitSliceLinks() {
  const fits = await getAllModelFits();
  const slices = await getAllDataSlices();
  const sliceIds = new Set(slices.map(s => s.dataSliceId));
  
  const broken = fits.filter(f => !sliceIds.has(f.dataSliceId));
  
  if (broken.length > 0) {
    console.error(`${broken.length} fits reference non-existent slices`);
    broken.forEach(f => console.error(`  ${f.modelFitId} → ${f.dataSliceId}`));
  }
  
  return broken;
}
```

#### 4.4 Check ModelFit → Scaffold Links
```typescript
async function verifyFitScaffoldLinks() {
  const fits = await getAllModelFits();
  const scaffolds = await getAllModelScaffolds();
  const scaffoldIds = new Set(scaffolds.map(s => s.scaffoldId));
  
  const broken = fits.filter(f => !scaffoldIds.has(f.scaffoldId));
  
  if (broken.length > 0) {
    console.error(`${broken.length} fits reference non-existent scaffolds`);
    broken.forEach(f => console.error(`  ${f.modelFitId} → ${f.scaffoldId}`));
  }
  
  return broken;
}
```

---

## 🚀 EXECUTION PLAN

### Step 1: Backup Current State
```bash
# Export all tables to S3 before making changes
aws dynamodb create-backup \
  --table-name ChasingProphets-Datasets \
  --backup-name datasets-backup-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name ChasingProphets-DataSlices \
  --backup-name slices-backup-$(date +%Y%m%d)
```

### Step 2: Run Audit Scripts
```bash
# Create cleanup script
node scripts/data-cleanup/audit-database.ts
```

### Step 3: Review Audit Results
- Check console output for duplicates, orphans, broken links
- Make decision on which datasets to keep/delete
- Identify slices that need migration

### Step 4: Execute Cleanup
```bash
# Run cleanup with dry-run first
node scripts/data-cleanup/clean-duplicates.ts --dry-run

# Then run for real
node scripts/data-cleanup/clean-duplicates.ts
```

### Step 5: Verify Cleanup
```bash
# Re-run audit to confirm clean state
node scripts/data-cleanup/audit-database.ts
```

### Step 6: Update UI to Reflect Clean Data
- Refresh management pages
- Verify no broken links
- Check dataset detail pages show correct slices

---

## 📝 SCRIPT SKELETON

Create `/workspaces/chasingprophets/scripts/data-cleanup/full-cleanup.ts`:

```typescript
import { getAllAssets } from '../../src/services/assets';
import { getAllDatasets, deleteDataset } from '../../src/services/dataset';
import { getAllDataSlices, updateDataSlice, deleteDataSlice } from '../../src/services/dataSlice';
import { getAllModelFits } from '../../src/services/modelFit';
import { getAllModelScaffolds } from '../../src/services/modelScaffold';

async function main() {
  console.log('=== Starting Database Cleanup ===\n');
  
  // 1. Audit
  console.log('Step 1: Auditing current state...');
  const assets = await getAllAssets();
  const datasets = await getAllDatasets();
  const slices = await getAllDataSlices();
  const fits = await getAllModelFits();
  const scaffolds = await getAllModelScaffolds();
  
  console.log(`  Assets: ${assets.length}`);
  console.log(`  Datasets: ${datasets.length}`);
  console.log(`  Data Slices: ${slices.length}`);
  console.log(`  Model Fits: ${fits.length}`);
  console.log(`  Scaffolds: ${scaffolds.length}\n`);
  
  // 2. Find duplicates
  console.log('Step 2: Finding duplicate datasets...');
  const byAsset = new Map<string, Dataset[]>();
  datasets.forEach(d => {
    const existing = byAsset.get(d.assetId) || [];
    byAsset.set(d.assetId, [...existing, d]);
  });
  
  const duplicates = Array.from(byAsset.entries()).filter(([_, dups]) => dups.length > 1);
  console.log(`  Found ${duplicates.length} assets with duplicate datasets\n`);
  
  // 3. Migrate legacy slices
  console.log('Step 3: Migrating legacy data slices...');
  const legacy = slices.filter(s => s.assetId && !s.datasetId);
  console.log(`  Found ${legacy.length} legacy slices to migrate\n`);
  
  // 4. Verify referential integrity
  console.log('Step 4: Checking referential integrity...');
  // ... implement checks
  
  console.log('\n=== Cleanup Complete ===');
}

main().catch(console.error);
```

---

## 🔄 NEXT STEPS

1. ✅ Document cleanup tasks
2. ⏭️ Create cleanup scripts in `scripts/data-cleanup/`
3. ⏭️ Run audit to get actual database state
4. ⏭️ Review results with user
5. ⏭️ Execute cleanup (with backups!)
6. ⏭️ Verify clean state
7. ⏭️ Proceed to Phase 3 (Create Operations)
