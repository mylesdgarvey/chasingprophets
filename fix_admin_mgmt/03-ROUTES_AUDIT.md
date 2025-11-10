# Routes Audit - Registered vs Referenced

**Purpose:** Document all route definitions and identify broken navigation

---

## 🗺️ REGISTERED ROUTES (in `App.tsx`)

### User-Facing Routes
```typescript
<Route path="/" element={<Dashboard />} />
<Route path="/prophets" element={<ProphetsPage />} />
<Route path="/prophets/:prophetId" element={<ProphetDetail />} />
<Route path="/compare" element={<ProphetComparison />} />
<Route path="/leaderboard" element={<Leaderboard />} />
```

### Management Routes (NEW - `/mgmt`)
```typescript
<Route path="/mgmt" element={<AdminDashboardNew />} />

{/* Assets */}
<Route path="/mgmt/assets" element={<AssetsManagement />} />
<Route path="/mgmt/assets/:assetId" element={<AssetDetail />} />
❌ MISSING: /mgmt/assets/new
❌ MISSING: /mgmt/assets/:assetId/edit

{/* Datasets */}
<Route path="/mgmt/datasets" element={<DatasetsManagement />} />
<Route path="/mgmt/datasets/:datasetId" element={<DatasetDetail />} />
❌ MISSING: /mgmt/datasets/new
❌ MISSING: /mgmt/datasets/:datasetId/edit

{/* Data Slices */}
<Route path="/mgmt/data/slices" element={<DataSlicesManagement />} />
<Route path="/mgmt/data/slices/:sliceId" element={<DataSliceDetail />} />
❌ MISSING: /mgmt/data/slices/new
❌ MISSING: /mgmt/data/slices/:sliceId/edit

{/* Model Scaffolds */}
<Route path="/mgmt/models/scaffolds" element={<ScaffoldsList />} />
✅ <Route path="/mgmt/models/scaffolds/new" element={<ScaffoldEdit />} />
✅ <Route path="/mgmt/models/scaffolds/:scaffoldId/edit" element={<ScaffoldEdit />} />

{/* Model Fits */}
<Route path="/mgmt/models/fits" element={<ModelFitsManagement />} />
<Route path="/mgmt/models/fits/:fitId" element={<ModelFitDetail />} />
❌ MISSING: /mgmt/models/fits/new (probably not needed - auto-created)
❌ MISSING: /mgmt/models/fits/:fitId/edit (probably not needed - immutable)

{/* Prophets */}
<Route path="/mgmt/prophets" element={<ProphetsManagement />} />
❌ MISSING: /mgmt/prophets/:prophetId (detail page)
❌ MISSING: /mgmt/prophets/new
❌ MISSING: /mgmt/prophets/:prophetId/edit

{/* System */}
<Route path="/mgmt/metrics" element={<SystemMetrics />} />
<Route path="/mgmt/settings" element={<SystemSettings />} />
```

### Legacy Routes (OLD - `/admin`)
```typescript
<Route path="/admin" element={<Navigate to="/mgmt" />} />
<Route path="/admin/scaffolds" element={<Navigate to="/mgmt/models/scaffolds" />} />
```

---

## 📞 REFERENCED ROUTES (in components)

### AdminDashboard.tsx
```typescript
navigate('/mgmt/models/scaffolds/new')  ❌ Works (route exists)
navigate('/mgmt/data/slices/new')       ❌ BROKEN (route missing)
navigate('/mgmt/prophets/new')          ❌ BROKEN (route missing)
navigate('/mgmt/assets/new')            ❌ BROKEN (route missing)
```

### AssetsManagement.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate('/mgmt/assets/new')                 ❌ BROKEN (route missing)
navigate(`/mgmt/assets/${asset.ticker}/edit`) ❌ BROKEN (route missing)
navigate(`/mgmt/assets/${asset.ticker}`)     ✅ Works (detail page)
```

### DatasetsManagement.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate('/mgmt/datasets/new')                    ❌ BROKEN (route missing)
navigate(`/mgmt/datasets/${dataset.datasetId}/edit`) ❌ BROKEN (route missing)
navigate(`/mgmt/datasets/${dataset.datasetId}`)   ✅ Works (detail page)
```

### DataSlicesManagement.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate('/mgmt/data/slices/new')                ❌ BROKEN (route missing)
navigate(`/mgmt/data/slices/${slice.dataSliceId}/edit`) ❌ BROKEN (route missing)
navigate(`/mgmt/data/slices/${slice.dataSliceId}`)  ✅ Works (detail page)
```

### ProphetsManagement.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate('/mgmt/prophets/new')                    ❌ BROKEN (route missing)
navigate(`/mgmt/prophets/${prophet.prophetId}/edit`) ❌ BROKEN (route missing)
❌ MISSING: Detail page navigation
```

### ModelFitsManagement.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate(`/mgmt/models/scaffolds/${fit.scaffoldId}/edit`) ✅ Works
navigate(`/mgmt/models/fits/${fit.modelFitId}`)  ✅ Works (detail page)
navigate(`/mgmt/data/slices/${fit.dataSliceId}`) ✅ Works (detail page)
```

### ScaffoldsList.tsx
```typescript
navigate('/mgmt')  // Back to Admin - ✅ Works
navigate('/mgmt/models/scaffolds/new')  ✅ Works (route exists)
navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`) ✅ Works
```

### DatasetDetail.tsx
```typescript
navigate('/mgmt/datasets')  // Back to list - ✅ Works
navigate(`/mgmt/datasets/${dataset.datasetId}/edit`) ❌ BROKEN (route missing)
navigate('/mgmt/data/slices/new')  ❌ BROKEN (route missing)
navigate(`/mgmt/data/slices/${slice.dataSliceId}`)  ✅ Works
```

### AssetDetail.tsx
```typescript
navigate('/mgmt/assets')  // Back to list - ✅ Works
navigate(`/mgmt/datasets/${dataset.datasetId}`)  ✅ Works
```

### DataSliceDetail.tsx
```typescript
navigate('/mgmt/data/slices')  // Back to list - ✅ Works
navigate(`/mgmt/datasets/${datasetId}`)  ✅ Works
navigate(`/mgmt/models/fits/${fit.modelFitId}`)  ✅ Works
```

### ModelFitDetail.tsx
```typescript
navigate('/mgmt/models/fits')  // Back to list - ✅ Works
navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`) ✅ Works
navigate(`/mgmt/data/slices/${dataSlice.dataSliceId}`)  ✅ Works
navigate(`/mgmt/prophets/${prophet.prophetId}`)  ❌ BROKEN (route missing)
```

---

## 🔴 BROKEN NAVIGATION SUMMARY

### Missing "New Entity" Routes (HIGH PRIORITY)
1. `/mgmt/assets/new` - Referenced by: AdminDashboard, AssetsManagement
2. `/mgmt/datasets/new` - Referenced by: DatasetsManagement
3. `/mgmt/data/slices/new` - Referenced by: AdminDashboard, DataSlicesManagement, DatasetDetail
4. `/mgmt/prophets/new` - Referenced by: AdminDashboard, ProphetsManagement

### Missing "Edit Entity" Routes (HIGH PRIORITY)
1. `/mgmt/assets/:assetId/edit` - Referenced by: AssetsManagement
2. `/mgmt/datasets/:datasetId/edit` - Referenced by: DatasetsManagement, DatasetDetail
3. `/mgmt/data/slices/:sliceId/edit` - Referenced by: DataSlicesManagement
4. `/mgmt/prophets/:prophetId/edit` - Referenced by: ProphetsManagement

### Missing Detail Routes (MEDIUM PRIORITY)
1. `/mgmt/prophets/:prophetId` - Referenced by: ModelFitDetail, (should be in ProphetsManagement)

---

## ✅ WORKING ROUTES

### List Pages (All Working)
- `/mgmt` - Admin Dashboard
- `/mgmt/assets` - Assets list
- `/mgmt/datasets` - Datasets list
- `/mgmt/data/slices` - Data slices list
- `/mgmt/models/scaffolds` - Scaffolds list
- `/mgmt/models/fits` - Model fits list
- `/mgmt/prophets` - Prophets list
- `/mgmt/metrics` - System metrics
- `/mgmt/settings` - System settings

### Detail Pages (Mostly Working)
- ✅ `/mgmt/assets/:assetId` - Asset detail
- ✅ `/mgmt/datasets/:datasetId` - Dataset detail with visualizations
- ✅ `/mgmt/data/slices/:sliceId` - Data slice detail
- ✅ `/mgmt/models/fits/:fitId` - Model fit detail
- ❌ `/mgmt/prophets/:prophetId` - MISSING

### CRUD Pages (Only Scaffolds)
- ✅ `/mgmt/models/scaffolds/new` - Create scaffold
- ✅ `/mgmt/models/scaffolds/:scaffoldId/edit` - Edit scaffold

---

## 🚨 NAVIGATION INCONSISTENCIES

### "Back to Admin" Button Issue
**Current behavior:**
```typescript
navigate('/mgmt')  // Most components use this
```

**Problem:**
- User mentioned links going to "fucked up version of admin under /mgmt"
- Legacy `/admin` routes still exist but redirect to `/mgmt`
- Inconsistent user experience

**Solution:**
- Remove ALL legacy `/admin` routes
- Standardize on `/mgmt` everywhere
- Update any hardcoded `/admin` links

---

## 📋 REQUIRED ROUTE ADDITIONS

### Phase 1: Create Operations (High Priority)

#### Assets
```typescript
import AssetForm from './pages/Management/AssetForm';

<Route path="/mgmt/assets/new" element={<AssetForm />} />
<Route path="/mgmt/assets/:assetId/edit" element={<AssetForm />} />
```

#### Datasets
```typescript
import DatasetForm from './pages/Management/DatasetForm';

<Route path="/mgmt/datasets/new" element={<DatasetForm />} />
<Route path="/mgmt/datasets/:datasetId/edit" element={<DatasetForm />} />
```

#### Data Slices
```typescript
import DataSliceForm from './pages/Management/DataSliceForm';

<Route path="/mgmt/data/slices/new" element={<DataSliceForm />} />
<Route path="/mgmt/data/slices/:sliceId/edit" element={<DataSliceForm />} />
```

#### Prophets
```typescript
import ProphetForm from './pages/Management/ProphetForm';
import ProphetDetail from './pages/Management/ProphetDetail';

<Route path="/mgmt/prophets/:prophetId" element={<ProphetDetail />} />
<Route path="/mgmt/prophets/new" element={<ProphetForm />} />
<Route path="/mgmt/prophets/:prophetId/edit" element={<ProphetForm />} />
```

---

## 🎯 IMPLEMENTATION STRATEGY

### Option A: Dedicated Pages (Current Approach for Scaffolds)
**Pros:**
- More space for complex forms
- Can have multi-step wizards
- Better for file uploads (S3 scripts)

**Cons:**
- More navigation/page loads
- Need separate components for each entity

**Best for:** Scaffolds (complex), Prophets (multiple steps)

### Option B: Modal Overlays (Recommended for Simple Entities)
**Pros:**
- Faster UX (no page navigation)
- Context preserved (stay on list page)
- Easier to implement (reuse list page)

**Cons:**
- Limited space for complex forms
- Can't have URL-addressable forms

**Best for:** Assets, Datasets, DataSlices (simple forms)

### Hybrid Approach (RECOMMENDED)
- **Modals:** Assets, Datasets, DataSlices (simple CRUD)
- **Pages:** Scaffolds (already done), Prophets (complex setup)
- **No CRUD UI:** ModelFits (auto-created by training jobs)

---

## 🔄 NEXT STEPS

1. ✅ Complete routes audit
2. ⏭️ Decide on modal vs page approach per entity
3. ⏭️ Create missing route components
4. ⏭️ Add routes to App.tsx
5. ⏭️ Update all navigation calls
6. ⏭️ Remove legacy `/admin` routes
7. ⏭️ Test all navigation flows
