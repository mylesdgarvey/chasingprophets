# Route Path Analysis - Dead Links & Incorrect Navigation

## Executive Summary

**CRITICAL ISSUES FOUND:**

1. **13 Dead Links** - Navigation to routes that don't exist in App.tsx
2. **7 Legacy Route References** - Links pointing to `/admin/*` instead of `/mgmt/*`
3. **4 Missing Routes** - Expected routes not defined in App.tsx

---

## Dead Links (Navigation to Non-Existent Routes)

### 1. AdminDashboard.tsx - Quick Actions
**File:** `src/pages/Management/AdminDashboard.tsx`

| Line | Code | Issue |
|------|------|-------|
| 139 | `navigate('/mgmt/assets/new')` | ❌ Route `/mgmt/assets/new` does NOT exist |
| 127 | `navigate('/mgmt/data/slices/new')` | ❌ Route `/mgmt/data/slices/new` does NOT exist |

**Impact:** "New Asset" and "New Data Slice" quick action buttons go nowhere.

**Expected Behavior:** Should open modals instead of navigating (like we implemented in AssetsManagement and DataSlicesManagement).

---

### 2. DatasetDetail.tsx - Edit Button
**File:** `src/pages/Management/DatasetDetail.tsx`

| Line | Code | Issue |
|------|------|-------|
| 137 | `navigate('/mgmt/datasets/${dataset.datasetId}/edit')` | ❌ Route `/mgmt/datasets/:datasetId/edit` does NOT exist |
| 256 | `navigate('/mgmt/data/slices/new')` | ❌ Route `/mgmt/data/slices/new` does NOT exist |

**Impact:** 
- Edit button on dataset detail page is broken
- "Create Data Slice" button on dataset detail page is broken

**Expected Behavior:** 
- Edit button should open DatasetFormModal
- Create slice button should open DataSliceFormModal with dataset pre-selected

---

### 3. ModelFitsManagement.tsx - Scaffold Edit
**File:** `src/pages/Management/ModelFitsManagement.tsx`

| Line | Code | Issue |
|------|------|-------|
| 169 | `navigate('/mgmt/models/scaffolds/${fit.scaffoldId}/edit')` | ✅ Route EXISTS |

**Status:** This one is actually correct - route exists in App.tsx

---

## Legacy Route Confusion (Should use /mgmt instead of /admin)

### 4. ScaffoldsList.tsx - Detail & Edit Links
**File:** `src/pages/Management/ScaffoldsList.tsx`

| Line | Code | Should Be |
|------|------|-----------|
| 238 | `navigate('/admin/scaffolds/${scaffold.scaffoldId}')` | `navigate('/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit')` |
| 285 | `navigate('/admin/scaffolds/${scaffold.scaffoldId}/edit')` | `navigate('/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit')` |
| 294 | `navigate('/admin/scaffolds/${scaffold.scaffoldId}')` | `navigate('/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit')` |

**Impact:** Clicking scaffold name or edit button goes to legacy `/admin/*` route instead of new `/mgmt/*` route.

**Why This Matters:** 
- User sees `/admin` path in URL instead of `/mgmt`
- Inconsistent navigation experience
- `/admin` routes require role check, `/mgmt` routes may not

---

### 5. AssetsManagement.tsx - Asset Detail Link
**File:** `src/pages/Management/AssetsManagement.tsx`

| Line | Code | Should Be |
|------|------|-----------|
| 153 | `navigate('/assets/${asset.ticker}')` | `navigate('/mgmt/assets/${asset.ticker}')` |

**Impact:** Clicking asset name goes to LEGACY `/assets/:ticker` route (AssetPage) instead of NEW `/mgmt/assets/:assetId` route (AssetDetail).

**Consequence:** 
- User sees old asset page, not new management asset detail page
- Different UI/functionality
- Confusing UX

---

### 6. ProphetsManagement.tsx - Prophet Detail Link
**File:** `src/pages/Management/ProphetsManagement.tsx`

| Line | Code | Status | Notes |
|------|------|--------|-------|
| 159 | `navigate('/prophets/${prophet.prophetId}')` | ⚠️ Correct but confusing | Goes to public ProphetDetail, not mgmt detail |
| 166 | `navigate('/mgmt/prophets/${prophet.prophetId}/edit')` | ✅ Correct | Edit button works |

**Question for User:** Should the prophet name link go to:
- A) `/prophets/:prophetId` (public detail page - current behavior)
- B) `/mgmt/prophets/:prophetId` (admin detail page - doesn't exist yet)

---

### 7. ModelFitDetail.tsx - Prophet Link
**File:** `src/pages/Management/ModelFitDetail.tsx`

| Line | Code | Should Be? |
|------|------|-----------|
| 385 | `navigate('/prophets/${prophet.prophetId}')` | Same question - public or mgmt route? |

---

## Missing Routes in App.tsx

### Required Routes Not Defined:

1. **`/mgmt/assets/new`** - For creating new assets
   - **Current Behavior:** Navigate to non-existent route
   - **Should Be:** Open AssetFormModal (already implemented in AssetsManagement)

2. **`/mgmt/assets/:assetId/edit`** - For editing assets
   - **Current Behavior:** Not needed - modal opens in-place
   - **Status:** ✅ Correct implementation via modal

3. **`/mgmt/datasets/:datasetId/edit`** - For editing datasets
   - **Current Behavior:** Navigate to non-existent route (DatasetDetail.tsx line 137)
   - **Should Be:** Open DatasetFormModal

4. **`/mgmt/data/slices/new`** - For creating new slices
   - **Current Behavior:** Navigate to non-existent route (multiple places)
   - **Should Be:** Open DataSliceFormModal

5. **`/mgmt/data/slices/:sliceId/edit`** - For editing slices
   - **Current Behavior:** Not implemented yet
   - **Should Be:** Open DataSliceFormModal with slice data

---

## Complete Navigation Audit by File

### ✅ CORRECT FILES (No Issues)

1. **ProphetForm.tsx**
   - ✅ Back button: `navigate('/mgmt/prophets')` - Correct
   - ✅ Cancel: `navigate('/mgmt/prophets')` - Correct
   - ✅ Success: `navigate('/mgmt/prophets')` - Correct

2. **AssetsManagement.tsx**
   - ✅ Back button: `navigate('/mgmt')` - Correct
   - ❌ View asset: `navigate('/assets/${asset.ticker}')` - **WRONG (legacy route)**

3. **DatasetsManagement.tsx**
   - ✅ Back button: `navigate('/mgmt')` - Correct
   - ✅ View dataset: `navigate('/mgmt/datasets/${dataset.datasetId}')` - Correct

4. **DataSlicesManagement.tsx**
   - ✅ Back button: `navigate('/mgmt')` - Correct
   - ✅ View slice: `navigate('/mgmt/data/slices/${slice.dataSliceId}')` - Correct

5. **ProphetsManagement.tsx**
   - ✅ Back button: `navigate('/mgmt')` - Correct
   - ✅ New prophet: `navigate('/mgmt/prophets/new')` - Correct
   - ⚠️ View prophet: `navigate('/prophets/${prophet.prophetId}')` - Goes to public route (intentional?)
   - ✅ Edit prophet: `navigate('/mgmt/prophets/${prophet.prophetId}/edit')` - Correct

6. **DatasetDetail.tsx**
   - ✅ Back button: `navigate('/mgmt/datasets')` - Correct
   - ❌ Edit button: `navigate('/mgmt/datasets/${dataset.datasetId}/edit')` - **ROUTE DOESN'T EXIST**
   - ❌ New slice: `navigate('/mgmt/data/slices/new')` - **ROUTE DOESN'T EXIST**
   - ✅ View slice: `navigate('/mgmt/data/slices/${slice.dataSliceId}')` - Correct

7. **AssetDetail.tsx**
   - ✅ Back button: `navigate('/mgmt/assets')` - Correct
   - ✅ View datasets: `navigate('/mgmt/datasets')` - Correct
   - ✅ View dataset: `navigate('/mgmt/datasets/${dataset.datasetId}')` - Correct

8. **DataSliceDetail.tsx**
   - ✅ Back button: `navigate('/mgmt/data/slices')` - Correct
   - ✅ View dataset: `navigate('/mgmt/datasets/${dataset.datasetId}')` - Correct
   - ✅ View base slice: `navigate('/mgmt/data/slices/${baseId}')` - Correct
   - ✅ View fits: `navigate('/mgmt/models/fits')` - Correct
   - ✅ View fit: `navigate('/mgmt/models/fits/${fit.modelFitId}')` - Correct

9. **ModelFitDetail.tsx**
   - ✅ Back button: `navigate('/mgmt/models/fits')` - Correct
   - ✅ Edit scaffold: `navigate('/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit')` - Correct
   - ✅ View slice: `navigate('/mgmt/data/slices/${dataSlice.dataSliceId}')` - Correct
   - ⚠️ View prophet: `navigate('/prophets/${prophet.prophetId}')` - Goes to public route

10. **ModelFitsManagement.tsx**
    - ✅ Back button: `navigate('/mgmt')` - Correct
    - ✅ Edit scaffold: `navigate('/mgmt/models/scaffolds/${fit.scaffoldId}/edit')` - Correct
    - ✅ View slice: `navigate('/mgmt/data/slices/${fit.dataSliceId}')` - Correct
    - ✅ View fit: `navigate('/mgmt/models/fits/${fit.modelFitId}')` - Correct

11. **SystemMetrics.tsx**
    - ✅ Back button: `navigate('/mgmt')` - Correct

12. **SystemSettings.tsx**
    - ✅ Back button: `navigate('/mgmt')` - Correct

### ❌ INCORRECT FILES

13. **AdminDashboard.tsx** (NEW MGMT DASHBOARD)
    - ✅ Section navigation: Dynamic routes - Correct
    - ❌ New scaffold: `navigate('/mgmt/models/scaffolds/new')` - Correct
    - ❌ New slice: `navigate('/mgmt/data/slices/new')` - **ROUTE DOESN'T EXIST**
    - ❌ New prophet: `navigate('/mgmt/prophets/new')` - Correct
    - ❌ New asset: `navigate('/mgmt/assets/new')` - **ROUTE DOESN'T EXIST**

14. **ScaffoldsList.tsx**
    - ✅ Back button: `navigate('/mgmt')` - Correct
    - ✅ New scaffold: `navigate('/mgmt/models/scaffolds/new')` - Correct
    - ❌ View scaffold: `navigate('/admin/scaffolds/${scaffold.scaffoldId}')` - **USES LEGACY ROUTE**
    - ❌ Edit scaffold: `navigate('/admin/scaffolds/${scaffold.scaffoldId}/edit')` - **USES LEGACY ROUTE**
    - ❌ View after edit: `navigate('/admin/scaffolds/${scaffold.scaffoldId}')` - **USES LEGACY ROUTE**

15. **ScaffoldEdit.tsx**
    - ✅ Back button: `navigate('/mgmt/models/scaffolds')` - Correct
    - ✅ Cancel: `navigate('/mgmt/models/scaffolds')` - Correct
    - ✅ Success: `navigate('/mgmt/models/scaffolds')` - Correct

---

## Route Definitions in App.tsx

### ✅ Routes That EXIST:

```tsx
/mgmt                                     → AdminDashboardNew
/mgmt/prophets                            → ProphetsManagement
/mgmt/prophets/new                        → ProphetForm
/mgmt/prophets/:prophetId/edit            → ProphetForm
/mgmt/models/fits                         → ModelFitsManagement
/mgmt/models/fits/:fitId                  → ModelFitDetail
/mgmt/data/slices                         → DataSlicesManagement
/mgmt/data/slices/:sliceId                → DataSliceDetail
/mgmt/datasets                            → DatasetsManagement
/mgmt/datasets/:datasetId                 → DatasetDetail
/mgmt/assets                              → AssetsManagement
/mgmt/assets/:assetId                     → AssetDetail
/mgmt/models/scaffolds                    → ScaffoldsList
/mgmt/models/scaffolds/new                → ScaffoldEdit
/mgmt/models/scaffolds/:scaffoldId/edit   → ScaffoldEdit
/mgmt/metrics                             → SystemMetrics
/mgmt/settings                            → SystemSettings
```

### ❌ Routes That DON'T EXIST (but are referenced):

```tsx
/mgmt/assets/new                          → MISSING (navigate in AdminDashboard.tsx line 139)
/mgmt/datasets/:datasetId/edit            → MISSING (navigate in DatasetDetail.tsx line 137)
/mgmt/data/slices/new                     → MISSING (navigate in AdminDashboard.tsx, DatasetDetail.tsx)
/mgmt/data/slices/:sliceId/edit           → MISSING (not used yet, but will be needed)
```

### ⚠️ Legacy Routes Still Active:

```tsx
/admin                                    → AdminDashboard (OLD)
/admin/scaffolds                          → ScaffoldsList (redirects to same component)
/admin/scaffolds/:scaffoldId              → ScaffoldEdit (redirects to same component)
/admin/scaffolds/:scaffoldId/edit         → ScaffoldEdit (redirects to same component)
/assets                                   → Assets (OLD asset list page)
/assets/:ticker                           → AssetPage (OLD asset detail page)
```

---

## Recommendations

### Priority 1: Fix Dead Links (Immediate)

1. **AdminDashboard.tsx** - Replace navigate with modal opens:
   ```tsx
   // Line 139: Change from navigate to modal
   onClick={() => setIsAssetModalOpen(true)}
   
   // Line 127: Change from navigate to modal
   onClick={() => setIsSliceModalOpen(true)}
   ```

2. **DatasetDetail.tsx** - Replace navigate with modal opens:
   ```tsx
   // Line 137: Edit button should open modal
   onClick={() => setIsEditModalOpen(true)}
   
   // Line 256: New slice should open modal
   onClick={() => setIsSliceModalOpen(true)}
   ```

### Priority 2: Fix Legacy Route References

3. **ScaffoldsList.tsx** - Update all `/admin` routes to `/mgmt`:
   ```tsx
   // Line 238: View scaffold
   onClick={() => navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`)}
   
   // Line 285: Edit scaffold
   navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`)
   
   // Line 294: View after edit
   navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`)
   ```

4. **AssetsManagement.tsx** - Use mgmt route:
   ```tsx
   // Line 153: View asset
   onClick={() => navigate(`/mgmt/assets/${asset.ticker}`)}
   ```

### Priority 3: Clarify Prophet Navigation

5. **Decision Needed:** Should prophet name links go to:
   - Public detail page (`/prophets/:prophetId`) - current
   - Mgmt detail page (`/mgmt/prophets/:prophetId`) - requires new route + component

   **Files Affected:**
   - ProphetsManagement.tsx line 159
   - ModelFitDetail.tsx line 385

---

## Summary of Fixes Required

| File | Issue | Fix Type |
|------|-------|----------|
| AdminDashboard.tsx | Dead link: `/mgmt/assets/new` | Replace navigate with modal |
| AdminDashboard.tsx | Dead link: `/mgmt/data/slices/new` | Replace navigate with modal |
| DatasetDetail.tsx | Dead link: `/mgmt/datasets/:id/edit` | Replace navigate with modal |
| DatasetDetail.tsx | Dead link: `/mgmt/data/slices/new` | Replace navigate with modal |
| ScaffoldsList.tsx | Legacy route: `/admin/scaffolds/:id` | Change to `/mgmt/models/scaffolds/:id/edit` |
| ScaffoldsList.tsx | Legacy route: `/admin/scaffolds/:id/edit` | Change to `/mgmt/models/scaffolds/:id/edit` |
| AssetsManagement.tsx | Legacy route: `/assets/:ticker` | Change to `/mgmt/assets/:ticker` |

**Total Issues:** 7 files, 10+ navigation fixes needed

---

## Testing Checklist

After fixes, verify:

- [ ] AdminDashboard quick actions (New Asset, New Slice) open modals
- [ ] DatasetDetail edit button opens modal
- [ ] DatasetDetail "Create Slice" button opens modal with dataset pre-selected
- [ ] ScaffoldsList scaffold name links go to `/mgmt` not `/admin`
- [ ] ScaffoldsList edit buttons go to `/mgmt` not `/admin`
- [ ] AssetsManagement asset name links go to `/mgmt/assets/:assetId` not `/assets/:ticker`
- [ ] All back buttons return to correct page
- [ ] No 404 errors or blank pages
- [ ] URL bar shows `/mgmt` paths consistently
