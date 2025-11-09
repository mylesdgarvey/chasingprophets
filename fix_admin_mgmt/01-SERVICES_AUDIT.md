# Services Audit - Available CRUD Functions

**Purpose:** Document all available service layer functions for admin operations

---

## 📁 Service Files Location
- `/workspaces/chasingprophets/src/services/`

---

## 1️⃣ ASSETS SERVICE (`assets.ts`)

### Available Functions

#### ✅ **READ Operations**
```typescript
getAsset(ticker: string): Promise<AssetResponse | null>
getAllAssets(): Promise<AssetResponse[]>
getAssetsByMarket(market: string): Promise<AssetResponse[]>
searchAssets(query: string, limit = 10): Promise<AssetSearchResult[]>
getAssetPrices(ticker: string, startDate?: string, endDate?: string): Promise<PriceData[]>
```

#### ❌ **MISSING Operations**
- `createAsset()` - **DOES NOT EXIST**
- `updateAsset()` - **DOES NOT EXIST**
- `deleteAsset()` - **DOES NOT EXIST**

### Database Schema
- **Table:** `ChasingProphets-Assets`
- **Partition Key:** `ticker` (String)
- **GSI:** `MarketIndex` on `market`

### Notes
- Asset CRUD operations need to be created from scratch
- Service only supports read-only operations currently
- Uses DynamoDB DocumentClient

---

## 2️⃣ DATASETS SERVICE (`dataset.ts`)

### Available Functions

#### ✅ **FULL CRUD**
```typescript
// Read
getAllDatasets(): Promise<Dataset[]>
getDatasetsByAsset(assetId: string): Promise<Dataset[]>
getDataset(datasetId: string): Promise<Dataset | null>

// Create
createDataset(input: CreateDatasetInput): Promise<Dataset>

// Update
updateDataset(datasetId: string, updates: Partial<Dataset>): Promise<Dataset>

// Delete
deleteDataset(datasetId: string): Promise<void>
```

### Database Schema
- **Table:** `ChasingProphets-Datasets`
- **Partition Key:** `datasetId` (String)
- **GSI:** `AssetIndex` on `assetId`

### Notes
- **FULLY FUNCTIONAL SERVICE** ✅
- All CRUD operations available
- Only missing UI components to call these functions

---

## 3️⃣ DATA SLICES SERVICE (`dataSlice.ts`)

### Available Functions

#### ✅ **CRUD Operations**
```typescript
// Read
getDataSlice(dataSliceId: string): Promise<DataSlice | null>
getDataSlicesByDataset(datasetId: string): Promise<DataSlice[]>
getAllDataSlices(): Promise<DataSlice[]>

// Create
createDataSlice(input: CreateDataSliceInput): Promise<DataSlice>

// Delete
deleteDataSlice(dataSliceId: string): Promise<void>
```

#### ⚠️ **MISSING Update Operation**
- `updateDataSlice()` - **DOES NOT EXIST**

#### ✅ **Helper Functions**
```typescript
analyzeSliceSchema(csvText: string): Promise<{
  availableColumns: string[];
  columnTypes: Record<string, FieldType>;
  columnRanges?: Record<string, { min: number; max: number }>;
}>

validateContractMatch(dataSlice: DataSlice, scaffold: ModelScaffold): Promise<{
  valid: boolean;
  errors: string[];
}>
```

### Database Schema
- **Table:** `ChasingProphets-DataSlices`
- **Partition Key:** `dataSliceId` (String)
- **GSI:** `DatasetIndex` on `datasetId`

### Notes
- Missing `updateDataSlice()` function - slices are immutable by design?
- Has advanced helper functions for schema analysis
- Supports both simple and compound slices

---

## 4️⃣ MODEL SCAFFOLDS SERVICE (`modelScaffold.ts`)

### Available Functions

#### ✅ **FULL CRUD**
```typescript
// Read
getModelScaffold(scaffoldId: string): Promise<ModelScaffold | null>
getAllModelScaffolds(): Promise<ModelScaffold[]>

// Create
createModelScaffold(input: CreateModelScaffoldInput): Promise<ModelScaffold>

// Update
updateModelScaffold(scaffoldId: string, updates: Partial<ModelScaffold>): Promise<ModelScaffold>

// Delete
deleteModelScaffold(scaffoldId: string): Promise<void>
```

#### ✅ **S3 File Management**
```typescript
uploadScriptToS3(scriptContent: string, s3Path: string): Promise<string>
downloadScriptFromS3(s3Path: string): Promise<string>
```

### Database Schema
- **Table:** `ChasingProphets-ModelScaffolds`
- **Partition Key:** `scaffoldId` (String)

### Notes
- **FULLY FUNCTIONAL SERVICE** ✅
- **UI EXISTS** for create/edit operations (`ScaffoldEdit.tsx`)
- Handles Python/JS script upload to S3
- This is the ONLY entity with working create/edit UI

---

## 5️⃣ MODEL FITS SERVICE (`modelFit.ts`)

### Available Functions

#### ✅ **READ Operations**
```typescript
getModelFit(modelFitId: string): Promise<ModelFit | null>
getModelFitsByAsset(assetId: string): Promise<ModelFit[]>
getModelFitsByScaffold(scaffoldId: string): Promise<ModelFit[]>
getAllModelFits(): Promise<ModelFit[]>
```

#### ⚠️ **PARTIAL CRUD**
```typescript
// Create
createModelFit(input: CreateModelFitInput): Promise<ModelFit>

// Delete
deleteModelFit(modelFitId: string): Promise<void>
```

#### ❌ **MISSING Operations**
- `updateModelFit()` - **DOES NOT EXIST**

### Database Schema
- **Table:** `ChasingProphets-ModelFits`
- **Partition Key:** `modelFitId` (String)
- **GSI:** `AssetIndex` on `assetId`
- **GSI:** `ScaffoldIndex` on `scaffoldId`

### Notes
- ModelFits are created via training jobs (Lambda), not manual UI
- Update operation likely not needed (training results are immutable)
- Manual create operation exists but probably shouldn't be exposed in UI

---

## 6️⃣ PROPHETS SERVICE (`prophet.ts`)

### Available Functions

#### ✅ **READ Operations**
```typescript
getProphet(prophetId: string): Promise<Prophet | null>
getProphetsByAsset(assetId: string): Promise<Prophet[]>
getActiveProphets(): Promise<Prophet[]>
getAllProphets(): Promise<Prophet[]>
```

#### ✅ **CRUD Operations**
```typescript
// Create
createProphet(input: CreateProphetInput): Promise<Prophet>

// Update
updateProphet(prophetId: string, updates: UpdateProphetInput): Promise<Prophet>

// Delete
deleteProphet(prophetId: string): Promise<void>
```

### Database Schema
- **Table:** `ChasingProphets-Prophets`
- **Partition Key:** `prophetId` (String)
- **GSI:** `AssetIndex` on `assetId`

### Notes
- **FULLY FUNCTIONAL SERVICE** ✅
- All CRUD operations available
- Supports ensembling (multiple modelFitIds)
- Only missing UI components

---

## 📊 SERVICE AVAILABILITY MATRIX

| Entity | Get | GetAll | Create | Update | Delete | S3 Support | Status |
|--------|-----|--------|--------|--------|--------|------------|--------|
| **Assets** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Incomplete |
| **Datasets** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Complete |
| **DataSlices** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | Mostly Complete |
| **Scaffolds** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Complete + UI |
| **ModelFits** | ✅ | ✅ | ✅* | ❌ | ✅ | ❌ | Auto-Created |
| **Prophets** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Complete |

*ModelFits created by Lambda, not UI

---

## 🚨 REQUIRED SERVICE ADDITIONS

### High Priority (Blocking UI)

1. **Assets Service** - Need to create:
   ```typescript
   createAsset(input: CreateAssetInput): Promise<AssetMeta>
   updateAsset(ticker: string, updates: Partial<AssetMeta>): Promise<AssetMeta>
   deleteAsset(ticker: string): Promise<void>
   ```

2. **DataSlices Service** - Need to create (if updates allowed):
   ```typescript
   updateDataSlice(dataSliceId: string, updates: Partial<DataSlice>): Promise<DataSlice>
   ```

### Low Priority (Nice to Have)

3. **ModelFits Service** - Need to create (if manual editing needed):
   ```typescript
   updateModelFit(modelFitId: string, updates: Partial<ModelFit>): Promise<ModelFit>
   ```

---

## 📝 CREATE INPUT TYPES (From Type Definitions)

### CreateAssetInput (NEEDS DEFINITION)
```typescript
// TODO: Define in src/types/assets.ts
interface CreateAssetInput {
  ticker: string;
  name: string;
  market: string;
  type?: string;
  sector?: string;
  currency?: string;
  lastPrice?: number;
}
```

### CreateDatasetInput ✅
```typescript
interface CreateDatasetInput {
  datasetId: string;
  assetId: string;
  name?: string;
  source: string;        // S3 path
  type: DatasetType;     // 'timeseries' | 'table' | etc
  recordCount?: number;
  startDate?: string;
  endDate?: string;
}
```

### CreateDataSliceInput ✅
```typescript
interface CreateDataSliceInput {
  dataSliceId: string;
  datasetId: string;
  sliceType: 'simple' | 'compound';
  startDate?: string;
  endDate?: string;
  availableColumns: string[];
  columnTypes: Record<string, FieldType>;
  columnRanges?: Record<string, { min: number; max: number }>;
  baseSliceIds?: string[];  // For compound slices
}
```

### CreateModelScaffoldInput ✅
```typescript
interface CreateModelScaffoldInput {
  scaffoldId: string;
  name: string;
  description?: string;
  family: 'statistical' | 'ml' | 'dl' | 'ensemble';
  inputContract: ContractField[];
  outputContract: ContractField[];
  trainScript: string;      // S3 path
  inferenceScript: string;  // S3 path
  hyperparameters?: Record<string, any>;
}
```

### CreateProphetInput ✅
```typescript
interface CreateProphetInput {
  prophetId: string;
  assetId: string;
  modelFitIds: string[];    // Support ensembles
  name?: string;
  status: ProphetStatus;    // 'pending_training' | 'active' | 'inactive'
  ensembleStrategy?: 'average' | 'weighted' | 'voting';
  weights?: number[];
}
```

---

## 🔄 NEXT STEPS

1. ✅ Complete services audit
2. ⏭️ Create missing Asset CRUD functions in `assets.ts`
3. ⏭️ Add TypeScript type definitions for CreateAssetInput
4. ⏭️ Consider if DataSlice/ModelFit updates are needed
5. ⏭️ Test all existing service functions work correctly
